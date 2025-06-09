import RouteMapping from "@/assets/constant/route-mapping.js";
import { OBS, isMobile } from "../../../assets/js/utils.js";
import store from "@/store/store.js";
import DB from "./db.js";
import LOAD from "./loadImg.js";
import TaskQueue from "@/assets/js/taskQueue.js";
import DATA from "./data.js";
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;

cornerstone.imageCache.setMaximumSizeBytes(10000000); //单位Bytes，当前设定值10M
cornerstoneWADOImageLoader.configure({
  beforeSend: function (xhr) {},
});

const NETLOADER = {
  // 写入缓存队列
  setCacheTask: null,
  // 读取缓存队列
  getCacheTask: null,

  //图像地址
  getUrl(index, path, flag) {
    let url = "wadouri:" + path[index];
    if (flag) {
      return path[index];
    }
    return url;
  },

  //图像加载的触发点
  forceLoadStart(type, index, seriesInfo) {
    //如果index是非整数，需要推入不止一个数据
    if (
      index != undefined &&
      seriesInfo != undefined &&
      seriesInfo.currentSID != undefined
    ) {
      let arr = [];
      if (Number.isInteger(index)) {
        arr = [index];
      } else {
        arr = [Math.floor(index), Math.ceil(index)];
      }
      const dcmNetWork = store.state.dcmNetWork;
      let sid = seriesInfo.currentSID;
      for (let i = 0; i < arr.length; i++) {
        //这里的下载必须是原始dicom的下载，数据一定要在instances中
        //后面会有重复下载的校验，这里不需要考虑数据是否已经下载
        if (arr[i] > -1 && arr[i] < seriesInfo.instances.length) {
          let key = `${sid}___${arr[i]}`;
          if (dcmNetWork.highPriority.indexOf(key) == -1) {
            dcmNetWork.highPriority.push(key);
          }
        }
      }
    }
    //启动下载
    this.networkImageLoadEngine(type);
  },
  //第一优先级的下载任务,直接压入强制下载队列
  thumbTask() {
    const imgPoor = store.state.imgPoor;
    for (let key in imgPoor) {
      let { info, data } = imgPoor[key];
      let { instances, initViewMod, currentSID } = info;
      let index = Math.floor(instances.length / 2);

      if (!data[initViewMod][index] && !this.isInWorkStack(currentSID, index)) {
        let key = `${currentSID}___${index}`;
        return key;
      }
    }
    return null;
  },

  //第二优先级的下载任务
  //预加载，这里把一个优先加载的数据推入到预加载队列的栈中
  //这个函数只负责维护当前的预加载队列，不负责具体的下载
  forceLoadTask() {
    const dcmNetWork = store.state.dcmNetWork;
    if (dcmNetWork.highPriority.length > 0) {
      return dcmNetWork.highPriority[dcmNetWork.highPriority.length - 1];
    }
    return null;
  },

  //第三优先级的下载任务,work未满的状态下，指定的序列的预加载
  //首先加载当前序列
  //其次加载视图中的其他序列
  //最后在非兼容模式下面加载其他序列
  preloadTask() {
    const dcmNetWork = store.state.dcmNetWork;
    if (dcmNetWork.workArr.length >= dcmNetWork.num) return null;
    const imgPoor = store.state.imgPoor;

    let poorNow = null;
    const { currViewportSID, miniViewportSID, currViewportList } = dcmNetWork;

    //最高优先加载小窗口
    if (
      miniViewportSID &&
      imgPoor[miniViewportSID] &&
      !imgPoor[miniViewportSID].imageDone
    ) {
      poorNow = imgPoor[miniViewportSID];
    }

    //中间优先级加载当前窗口
    if (
      !poorNow &&
      currViewportSID &&
      imgPoor[currViewportSID] &&
      !imgPoor[currViewportSID].imageDone
    ) {
      poorNow = imgPoor[currViewportSID];
    }

    //最后加载其他窗口
    if (!poorNow) {
      for (let i = 0; i < currViewportList.length; i++) {
        if (
          currViewportList[i] &&
          imgPoor[currViewportList[i]] &&
          !imgPoor[currViewportList[i]].imageDone
        ) {
          poorNow = imgPoor[currViewportList[i]];
          break;
        }
      }
    }

    //如果还是没有找到，那么就加载其他序列
    if (!poorNow) {
      const isCompatibility =
        localStorage.getItem("useCompatibility") === "true";
      if (!store.state.isLowerConfigureDevice && !isCompatibility) {
        for (let key in imgPoor) {
          if (!imgPoor[key].imageDone) {
            poorNow = imgPoor[key];
            break;
          }
        }
      }
    }

    //如果当前序列已经下载完了，则不需要再次下载
    if (poorNow) {
      const { info, data } = poorNow;
      const { initViewMod, currentSID, instances } = info;
      const dataArrNow = data[initViewMod];
      for (let i = 0; i < instances.length; i++) {
        if (!dataArrNow[i] && !this.isInWorkStack(currentSID, i)) {
          let key = `${currentSID}___${i}`;
          return key;
        }
      }
    }
    return null;
  },
  //检查当前的sid和index是否在下载队列中
  isInWorkStack(sid, index) {
    const { workArr } = store.state.dcmNetWork;
    let inWorkArr = workArr.some((item) => {
      return item.sid === sid && item.index === index;
    });
    return inWorkArr;
  },
  pushToWorkStack(task, type) {
    if (!task) return;
    const dcmNetWork = store.state.dcmNetWork;
    const { highPriority } = dcmNetWork;
    //从强制下载队列中出栈
    const keyIndex = highPriority.indexOf(task);
    if (keyIndex > -1) {
      dcmNetWork.highPriority.splice(keyIndex, 1);
    }
    store.commit("setDcmNetWork", { ...dcmNetWork });

    //任务格式不合法
    let arr = task.split("___");
    if (arr.length != 2) return;

    let sid = arr[0],
      index = Number(arr[1]);
    if (!sid || !Number.isInteger(index)) return;

    let imgPoor = store.state.imgPoor;
    //任务目标不存在
    if (!imgPoor[sid]) return;

    const { info, data } = imgPoor[sid];
    const { initViewMod } = info;
    //已经加载过的数据,不需要再次加载
    if (data[initViewMod][index] || this.isInWorkStack(sid, index)) return;

    //入栈
    dcmNetWork.workArr.push({
      sid: sid,
      index: index,
    });
    store.commit("setDcmNetWork", { ...dcmNetWork });
    //启动下载
    this.loadNetworkImage(sid, index, type);
  },
  //按照优先级获取一个需要下载的数据任务
  getOneLoadTask() {
    //预览图为第一优先级，必须强制下载
    let key1 = this.thumbTask();
    if (key1) return key1;

    //highPriority队列为第二优先级,也必须强制下载,注意这里后进先出
    let key2 = this.forceLoadTask();
    if (key2) return key2;

    let key3 = this.preloadTask();
    if (key3) return key3;
    return null;
  },

  //更新最大动态范围
  updateDynamicWWWL(imgPoor) {
    const { info, volumeImageData } = imgPoor;
    if (!info.isNotUniformSquence && volumeImageData) {
      const range = volumeImageData.getPointData().getScalars().getRange();
      imgPoor.info.dynamic = {
        ww: range[1] - range[0],
        wl: (range[1] - range[0]) / 2,
      };
    } else {
      let max = -Infinity,
        min = Infinity;
      let data = imgPoor.data[info.initViewMod];
      for (let i = 0; i < data.length; i++) {
        if (data[i]) {
          if (data[i].max > max) max = data[i].max;
          if (data[i].min < min) min = data[i].min;
        }
      }
      if (max != -Infinity && min != Infinity) {
        imgPoor.info.dynamic = {
          ww: max - min,
          wl: (max - min) / 2,
        };
      }
    }
    if (!imgPoor.info.ww) {
      imgPoor.info.ww = imgPoor.info.dynamic?.ww;
      imgPoor.info.wl = imgPoor.info.dynamic?.wl;
    }
    //给一个默认值
    if (!imgPoor.info.dynamic) {
      imgPoor.info.dynamic = {
        ww: 1000,
        wl: 500,
      };
    }

    //如果窗宽是整数，床位也为整数
    if (Number.isInteger(imgPoor.info.dynamic.ww)) {
      imgPoor.info.dynamic.wl = Math.floor(imgPoor.info.dynamic.wl);
    }
    return imgPoor;
  },

  async loadNetworkImage(sid, index, type) {
    const { fileType, imageLoader } = RouteMapping[type];
    const imgPoor = store.state.imgPoor;
    const { info, data } = imgPoor[sid];
    const { initViewMod, path } = info;
    const that = this;
    // 是否使用indexDB缓存
    let isCache = that.isOpenCache();
    if (isCache) {
      let isData = await this.addCacheTaskStart(sid, type);
      if (isData) return;
    }
    //启动下载,这里都是异步下载，不会阻塞，需要启动回调函数
    function dataProCallback(imageData) {
      try {
        //补上分辨率
        imageData.pixelSpacingW = info.instances[index].PixelSpacing?.[0] || 1;
        imageData.pixelSpacingH = info.instances[index].PixelSpacing?.[1] || 1;

        data[initViewMod][index] = imageData;
        //找出当前序列的已经下载的数量,并判断是否已经下载完了
        const imgPoor = store.state.imgPoor;
        imgPoor[sid].done = data[initViewMod].filter((item) => item).length;

        if (imgPoor[sid].done == imgPoor[sid].num) {
          imgPoor[sid].imageDone = true;
          //更新volumeBuffer
          imgPoor[sid] = DATA.checkVTKData(imgPoor[sid]);
          //更新最大动态范围
          NETLOADER.updateDynamicWWWL(imgPoor[sid]);
          // 是否使用缓存
          if (isCache) {
            if (that.setCacheTask == null) {
              // 创建并发数为1的任务队列
              that.setCacheTask = new TaskQueue(1);
            }
            // 加入写入缓存队列
            that.setCacheTask.addTask(() => that.addToCache(imgPoor[sid]), sid);
          }
        }
        store.commit("setImgPoor", { ...imgPoor });
      } catch (error) {
        console.log("loadNetworkImage", error);
      }

      NETLOADER.networkImageLoadEngine(type);
    }

    let volumeBuffer = null;
    if (initViewMod === 0) {
      volumeBuffer = imgPoor[sid].volumeBuffer;
    }
    //注意这里不需要同步获取，使用异步函数能更好的利用多线程
    if (fileType === "dicom") {
      let url = undefined;
      // SR模态没有图像数据，通过 ContentSequence (0040,A730) 嵌套组织，需递归解析
      if (info.model === "SR") {
        url = path[index];
        if (imageLoader === "wadouri") {
          const xhr = new XMLHttpRequest();
          try {
            xhr.open("get", url, true);
          } catch (err) {
            console.log(err);
          }
          xhr.responseType = "arraybuffer";
          xhr.onreadystatechange = () => {
            if (xhr.readyState == 4) {
              if (xhr.status == 200) {
                const byteArray = new Uint8Array(xhr.response);
                const dataSet = dicomParser.parseDicom(byteArray);
                // 解析dataSet数据
                this.getSRContent(dataSet).then((imageData) => {
                  imgPoor[sid].info.instances[index].windowCenter = 0;
                  imgPoor[sid].info.instances[index].windowWidth = 0;
                  imgPoor[sid].info.instances[index].columns = imageData.width;
                  imgPoor[sid].info.instances[index].rows = imageData.height;
                  dataProCallback(imageData);
                });
              } else {
                console.log("error");
              }
            }
          };
          xhr.send();
        } else {
          const obs = new OBS();
          try {
            const blob = await obs.getObject(url, "arraybuffer");
            const byteArray = new Uint8Array(blob);
            const dataSet = dicomParser.parseDicom(byteArray);
            // 解析dataSet数据
            this.getSRContent(dataSet).then((imageData) => {
              imgPoor[sid].info.instances[index].windowCenter = 0;
              imgPoor[sid].info.instances[index].windowWidth = 0;
              imgPoor[sid].info.instances[index].columns = imageData.width;
              imgPoor[sid].info.instances[index].rows = imageData.height;
              dataProCallback(imageData);
            });
          } catch (e) {
            console.error(e);
          }
        }
      } else {
        if (imageLoader === "wadouri") {
          url = this.getUrl(index, path);
          this.getImageDataByCornerStone(url, info, volumeBuffer, index).then(
            (imageData) => {
              dataProCallback(imageData);
            },
          );
        } else {
          const obs = new OBS();
          obs.getObject(path[index], "arraybuffer").then((blob) => {
            url = "dicomweb:" + URL.createObjectURL(new Blob([blob]));
            this.getImageDataByCornerStone(url, info, volumeBuffer, index).then(
              (imageData) => {
                dataProCallback(imageData);
              },
            );
          });
        }
      }
    } else {
      // 解析png格式的影像图
      let img = new Image();
      img.crossOrigin = "anonymous";
      img.src = path[index];
      img.onload = () => {
        let imageData = this.getImageDataBy16b_PNG(
          img,
          info,
          volumeBuffer,
          index,
        );
        dataProCallback(imageData);
      };
    }
  },
  networkImageLoadEngine(type) {
    const dcmNetWork = store.state.dcmNetWork;
    // 首先移除已完成的并发元素
    const imgPoor = store.state.imgPoor;
    dcmNetWork.workArr = dcmNetWork.workArr.filter((item) => {
      let { sid: sidNow, index } = item;
      if (imgPoor[sidNow] && !imgPoor[sidNow].imageDone) {
        let { data, info } = imgPoor[sidNow];
        let { initViewMod } = info;
        if (!data[initViewMod][index]) {
          return item;
        }
      }
    });

    //当前节点可以尝试启动的任务个数，注意这里要异步去启动
    const { num, workArr } = dcmNetWork;
    const sets = num - workArr.length;
    const taskNum = Math.max(sets, 1);
    for (let i = 0; i < taskNum; i++) {
      setTimeout(() => {
        const task = NETLOADER.getOneLoadTask();
        if (task) {
          NETLOADER.pushToWorkStack(task, type);
        }
      }, 0);
    }
  },
  getOverlays(dataSet) {
    const overlays = [];
    if (!dataSet) return overlays;

    for (let group = 0x6000; group <= 0x601f; group += 2) {
      const groupHex = group.toString(16).padStart(4, "0");

      const overlay = {
        rows: dataSet.uint16(`x${groupHex}0010`),
        columns: dataSet.uint16(`x${groupHex}0011`),
        type: dataSet.string(`x${groupHex}0040`),
        origin: [
          dataSet.int16(`x${groupHex}0050`, 0) - 1,
          dataSet.int16(`x${groupHex}0050`, 1) - 1,
        ],
        bitPosition: dataSet.uint16(`x${groupHex}0102`),
        bitsAllocated: dataSet.uint16(`x${groupHex}0100`),
        data: dataSet.elements[`x${groupHex}3000`],
        description: dataSet.string(`x${groupHex}0022`),
      };

      if (overlay.data) {
        const pixcelData = this.getOverlayData(dataSet, overlay);
        overlay.pixcelData = pixcelData;
        overlays.push(overlay);
      }
    }

    return overlays;
  },
  getOverlayData(dataSet, overlay) {
    const overlayData = overlay.data;
    if (!overlayData) {
      return;
    }
    const data = new Uint8Array(overlay.rows * overlay.columns);

    for (let i = 0; i < overlayData.length; i++) {
      for (let k = 0; k < 8; k++) {
        const byte_as_int = dataSet.byteArray[overlayData.dataOffset + i];
        data[i * 8 + k] = (byte_as_int >> k) & 0b1;
      }
    }

    return data;
  },

  //所有的dicom文件走这个函数加载
  getImageDataByCornerStone(url, seriesInfo, volumeBuffer, nextIndex) {
    const { model } = seriesInfo;
    return cornerstone
      .loadImage(url)
      .then((image) => {
        //处理本次加载的结果
        let data = image.getPixelData();
        if (image.color) {
          //直接是8位彩图
          const result = new ImageData(data, image.width, image.height);
          const overlays = this.getOverlays(image.data);
          return {
            slope: image.slope,
            intercept: image.intercept,
            maxPixelValue: image.maxPixelValue,
            minPixelValue: image.minPixelValue,
            data: result.data,
            width: result.width,
            height: result.height,
            overlays,
            isColor: true,
          };
        } else {
          let slope = image.slope;
          let intercept = image.intercept;
          let isForceFloat = false;
          const unsign = this.checkImageTypeUnsign(data, intercept);
          //这里处理部分数据的intercept和slope是浮点数的磁共振数据
          if (intercept % 1 != 0 || slope % 1 != 0) {
            isForceFloat = true;
          }
          let datas = LOAD.createDataArray(
            data.length,
            model,
            isForceFloat,
            volumeBuffer,
            nextIndex,
            unsign,
          ); //此处依据数据类型创建了模态对应的buf类型
          for (let i = 0; i < datas.length; i++) {
            //datas[i] = slope * this.UnsignToSign(data[i]) + intercept//2022年1月4日 这个地方强转数据类型是不必要的，但是造成了ymyg wuhan sid 1663数据显示问题
            datas[i] = slope * data[i] + intercept;
          }
          const overlays = this.getOverlays(image.data);
          //pet数据有可能在横断面被插值
          let { volumeSize, initViewMod } = seriesInfo;

          let dataWidth = volumeSize ? volumeSize[initViewMod].w : image.width;
          let dataHeight = volumeSize
            ? volumeSize[initViewMod].h
            : image.height;
          return {
            slope: image.slope,
            intercept: image.intercept,
            max: image.maxPixelValue,
            min: image.minPixelValue,
            width: dataWidth,
            height: dataHeight,
            data: datas,
            length: data.length,
            overlays,
          };
        }
      })
      .catch((e) => {
        console.error(e, `${url} cornerstone加载失败`);
        return {
          width: 1,
          height: 1,
          data: [],
          length: 1,
          max: 1,
          min: 1,
        };
      });
  },

  // SR数据处理 —— 开始
  getSRContent(dataSet) {
    return new Promise((resolve, reject) => {
      const SRDataAll = this.processSRContent(dataSet); //获取全部数据
      const flattenSRData = this.flattenSRContent(SRDataAll)
        .map((item) => {
          return {
            label: item.conceptName,
            value: item.value,
          };
        })
        .filter((v) => typeof v.value === "string");
      const imageData = this.getSRImageData(flattenSRData);
      imageData.intercept = 0;
      imageData.isColor = true;
      imageData.maxPixelValue = 255;
      imageData.minPixelValue = 0;
      imageData.pixelSpacingH = 1;
      imageData.pixelSpacingW = 1;
      imageData.slope = 1;
      resolve(imageData);
    });
  },
  processSRContent(srDataset) {
    const result = {
      content: [],
    };

    // 查找SR文档的根内容序列
    const rootContentItem = this.findRootContentSequence(srDataset);
    if (rootContentItem) {
      // 递归处理内容树
      result.content = this.processContentItems(rootContentItem);
    }

    return result;
  },

  findRootContentSequence(dataset) {
    // 通常SR的根内容在0040A730 (Content Sequence)
    if (dataset.elements.x0040a730) {
      return dataset.elements.x0040a730.items;
    }
    return null;
  },
  // 递归处理内容项
  processContentItems(items) {
    const result = [];

    if (!items || items.length === 0) {
      return result;
    }

    items.forEach((item) => {
      const contentItem = {};
      const dataset = item.dataSet;

      // 提取基本属性
      contentItem.type = this.safeGetString(dataset, "x0040a040"); // Value Type
      contentItem.relationship = this.safeGetString(dataset, "x0040a010"); // Relationship Type

      // 提取概念名称 (Code)
      contentItem.conceptName = this.extractCodeSequence(dataset, "x0040a043");

      // 根据ValueType处理值
      switch (contentItem.type) {
        case "TEXT":
          contentItem.value = this.safeGetString(dataset, "x0040a160");
          break;

        case "NUM":
          contentItem.value = {
            numericValue: this.safeGetString(dataset, "x0040a300"),
            units: this.extractCodeSequence(dataset, "x004008ea"),
          };
          break;

        case "CODE":
          contentItem.value = this.extractCodeSequence(dataset, "x0040a168");
          break;

        case "CONTAINER":
          // 递归处理子内容
          if (dataset.elements.x0040a730) {
            contentItem.children = this.processContentItems(
              dataset.elements.x0040a730.items,
            );
          }
          break;

        case "IMAGE":
          // 处理图像引用
          contentItem.referencedSOP = {
            sopClassUid: this.safeGetString(dataset, "x00081150"),
            sopInstanceUid: this.safeGetString(dataset, "x00081155"),
          };
          break;

        default:
          // 处理其他ValueType
          break;
      }

      result.push(contentItem);
    });

    return result;
  },

  // 辅助函数：提取编码序列
  extractCodeSequence(dataset, tag) {
    // 检查序列是否存在
    const sequenceElement = dataset.elements[tag];
    if (
      !sequenceElement ||
      !sequenceElement.items ||
      sequenceElement.items.length === 0
    ) {
      return null;
    }

    // 获取序列的第一个项目
    const codeItem = sequenceElement.items[0].dataSet;

    // 安全提取编码值
    return {
      codeValue: this.safeGetString(codeItem, "x00080100"),
      codingSchemeDesignator: this.safeGetString(codeItem, "x00080102"),
      codingSchemeVersion: this.safeGetString(codeItem, "x00080103"),
      codeMeaning: this.safeGetString(codeItem, "x00080104"),
    };
  },
  // 安全获取字符串值的辅助函数
  safeGetString(dataset, tag) {
    if (!dataset || !dataset.elements || !dataset.elements[tag]) {
      return null;
    }
    return dataset.string(tag);
  },
  // 扁平化处理SR数据
  flattenSRContent(srData) {
    const flatData = [];

    // 递归扁平化函数
    function flatten(items, parentPath = []) {
      if (!items || items.length === 0) return;

      items.forEach((item, index) => {
        // 构建当前节点的路径
        const path = [...parentPath];
        if (item.conceptName && item.conceptName.codeMeaning) {
          path.push(item.conceptName.codeMeaning);
        } else {
          path.push(`item${index}`);
        }

        // 创建平面化条目
        const flatItem = {
          path: path.join(" > "),
          type: item.type,
          relationship: item.relationship,
          conceptName: item.conceptName?.codeMeaning || null,
          value: item.value,
        };

        flatData.push(flatItem);

        // 递归处理子节点
        if (item.children) {
          flatten(item.children, path);
        }
      });
    }

    // 从根内容开始扁平化
    flatten(srData.content);

    return flatData;
  },
  // 生成canvas
  getSRImageData(SRData) {
    const canvas = document.createElement("canvas");
    canvas.width = 700;
    canvas.height = 20 + SRData.length * 45;
    const ctx = canvas.getContext("2d");

    // 清空Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 设置白色背景
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 设置字体和颜色
    ctx.fillStyle = "#111111";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // 设置参数绘制起始位置
    let yPos = 10;
    const labelLineHeight = 20; // Label行高
    const valueLineHeight = 18; // Value行高
    const itemSpacing = 7; // 项间距

    // 绘制每个参数
    SRData.forEach((item) => {
      // 绘制Label（加粗）
      ctx.font = "bold 16px Arial";
      ctx.fillText(item.label.trim(), 10, yPos);
      yPos += labelLineHeight;

      // 绘制Value
      ctx.font = "16px Arial";
      ctx.fillText(item.value.trim(), 10, yPos);
      yPos += valueLineHeight + itemSpacing;
    });
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return imageData;
  },
  // SR数据处理 —— 结束

  imgToImageData(img) {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, img.width, img.height);
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    return imageData;
  },

  //所有的PNG文件走这个函数加载
  getImageDataBy16b_PNG(img, seriesInfo, volumeBuffer, index) {
    let { model, instances } = seriesInfo;
    let { bitsStored, bitsSigned, rescaleIntercept, rescaleSlop, highBit } =
      instances[index];
    let dataWidth = img.width;
    let dataHeight = img.height;
    let imgData = this.imgToImageData(img);

    //8位彩图在这里直接返回
    if (bitsStored === 8) {
      imgData.isColor = true;
      return imgData;
    }

    let slope = rescaleSlop || 1;
    let intercept = rescaleIntercept || 0;

    let imgLength = img.width * img.height;
    let buf = new Float32Array(imgLength);

    let bits;
    if (bitsSigned) {
      bits = highBit;
    } else {
      bits = bitsStored;
    }
    const unsigned = bits === 16;
    let isForceFloat = false;
    let ifForceShort = unsigned;
    if (intercept % 1 !== 0 || slope % 1 !== 0) {
      // 处理浮点数
      isForceFloat = true;
    }
    if (!isForceFloat && ifForceShort) {
      if (slope < 0 || intercept < 0) {
        ifForceShort = false;
      }
    }
    buf = LOAD.createDataArray(
      imgLength,
      model,
      isForceFloat,
      volumeBuffer,
      index,
      ifForceShort,
    );
    let max = -Infinity,
      min = Infinity;
    for (let i = 0; i < imgLength; i++) {
      let num =
        (((imgData.data[i * 4 + 1] << 8) & 0xff00) |
          (imgData.data[i * 4 + 2] & 0x00ff)) <<
        0;
      if (!unsigned) {
        const sign = imgData.data[i * 4 + 1] & (1 << (bits - 8));
        if (sign) {
          const bitcount = bits + 1;
          let value = parseInt(num.toString(2), 2);
          if ((value & (1 << (bitcount - 1))) > 0) {
            value = value - (1 << bitcount);
          }
          num = value;
        }
      }
      buf[i] = slope * num + intercept;
      if (buf[i] > max) max = buf[i];
      if (buf[i] < min) min = buf[i];
    }

    let origBuf = { width: dataWidth, height: dataHeight, data: buf, max, min };
    return origBuf;
  },

  checkImageTypeUnsign(image, intercept) {
    if (image instanceof Uint16Array) {
      if (intercept && intercept < 0) return false;
      return true;
    } else return false;
  },

  /**
   * 通过dcm文件获取内部数据和相关信息（可以获取二进制影像数据）
   * @param data
   * @returns {{pixelDataElement: Element, dataHeight: number, dataLength: number, intercept: (number|number), BitsStored: number, slope: (number|number), dataSet: (*|DataSet), dataWidth: number, SOPInstanceUID: string}}
   */
  getDicomParserData(data) {
    try {
      let dataArr = new Uint8Array(data);
      let dataSet = dicomParser.parseDicom(dataArr);
      let BitsStored = dataSet.uint16("x00280101");
      var pixelDataElement = dataSet.elements.x7fe00010;
      let dataHeight = dataSet.int16("x00280010");
      let dataWidth = dataSet.int16("x00280011");
      let dataLength = dataWidth * dataHeight;
      let slope = dataSet.floatString("x00281053")
        ? dataSet.floatString("x00281053")
        : 1;
      let intercept = dataSet.floatString("x00281052")
        ? dataSet.floatString("x00281052")
        : 0;
      let SOPInstanceUID = dataSet.string("x00080018");
      let highBit = dataSet.uint16("x00280102");
      let PixelRepresentation = dataSet.uint16("x00280103");
      let PlanarConfiguration = dataSet.uint16("x00280006");
      return {
        dataSet,
        BitsStored,
        highBit,
        pixelDataElement,
        dataHeight,
        dataWidth,
        dataLength,
        slope,
        intercept,
        SOPInstanceUID,
        PixelRepresentation,
        PlanarConfiguration,
      };
    } catch (err) {
      console.error("dicomParser解析失败:", err);
    }
  },
  setDynamicWWWL(imgPoor) {
    const { info, volumeImageData } = imgPoor;
    if (!info.isNotUniformSquence) {
      const range = volumeImageData.getPointData().getScalars().getRange();
      info.dynamic = {
        ww: range[1] - range[0],
        wl: (range[1] - range[0]) / 2,
      };
    }
  },
  /**
   * // 启动读取缓存队列
   * @param sid
   * @return {Promise<void>}
   */
  async addCacheTaskStart(sid, type) {
    // 是否存在缓存
    let len = await DB.getWhereCount(sid);
    // 存在缓存
    if (len && len > 0) {
      if (this.getCacheTask == null) {
        // 创建并发数为1的任务队列
        this.getCacheTask = new TaskQueue(1);
      }
      // 加入读取缓存队列
      this.getCacheTask
        .addTask(() => this.getCache(sid), sid)
        .catch(async (err) => {
          NETLOADER.networkImageLoadEngine(type);
          //已经存在任务
          console.log("err", err);
        })
        .then(() => {
          NETLOADER.networkImageLoadEngine(type);
        });
      return true;
    } else {
      return false;
    }
  },
  /**
   * 写入indexdb缓存
   * @param imgPoor
   * @return {Promise<void>}
   */
  async addToCache(imgPoor) {
    console.log("addtocache");
    return new Promise((resolve, reject) => {
      const {
        info: { SeriesIndex },
      } = imgPoor;
      DB.add(SeriesIndex, imgPoor.data);
      resolve();
    });
  },
  /**
   * 读取缓存
   * @param sid
   * @param imgPoor
   * @return {Promise<void>}
   */
  async getCache(sid) {
    const imgPoor = store.state.imgPoor;
    let result = await DB.get(sid);
    let imgPoorItem = imgPoor[sid];
    console.log("getImgPoor", "sid", sid, imgPoorItem.num);
    imgPoorItem.done = imgPoorItem.num;
    imgPoorItem.data = result.data.imageDatas;
    imgPoorItem.imageDone = true;
    //更新最大动态范围
    //更新volumeBuffer
    let isForce = true;
    imgPoorItem = DATA.checkVTKData(imgPoorItem, isForce);
    NETLOADER.updateDynamicWWWL(imgPoorItem);
    store.commit("setImgPoor", { ...imgPoor });
  },
  /**
   * 是否使用缓存
   * @return {true 不使用缓存 | false 使用缓存}
   */
  isOpenCache() {
    // 移动端不使用缓存
    if (isMobile()) return false;
    const cacheStorageInfoJSON = localStorage.getItem("cacheStorageInfo");
    const cacheStorageInfo = cacheStorageInfoJSON
      ? JSON.parse(cacheStorageInfoJSON)
      : store.state.cacheStorageInfo;

    const enableCache = cacheStorageInfo.enable;
    const isLowerConfigureDevice = store.state.isLowerConfigureDevice;
    let useCompatibility = localStorage.getItem("useCompatibility");

    //pc端：未开启缓存、兼容模式、低配设备不使用缓存
    if (!enableCache || useCompatibility === "true" || isLowerConfigureDevice)
      return false;
    return true;
  },
};

export default NETLOADER;
