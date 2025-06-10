import CLICKOPT from "./clickOpt.js";
import LOAD from "./loadImg.js";
import api from "../../../assets/api/index.js";
import markApi from "../../../assets/api/mark.js";
import { getDataType } from "../../../assets/js/YMDataHandler.js";
// import "@kitware/vtk.js"
import CROSS from "./crosshair.js";
import vtkDataArray from "@kitware/vtk.js/Common/Core/DataArray";
import vtkImageData from "@kitware/vtk.js/Common/DataModel/ImageData";
let [BW_name, Inverse_name, PET_name] = ["B&W", "B&W Inverse", "PET"];
let DATA = {
  imageData: {
    translate: { x: 0, y: 0 },
    scale: { x: 1, y: 1 },
    rotate: 0,
    img: document.createElement("canvas"),
    magnifyPoint: { x: -1, y: -1 },
    colormapIndex: BW_name,
    colormapSaveIndex: PET_name,
    ww: 1,
    wl: 1,
    curImageNum: 1,
    imageNum: 1,
    curViewMod: 0,
    defaultFlag: true,

    isCPR: 0, //是否是CPR重建图像
    dataWithInfo: {
      pixelSpacingW: 1,
      pixelSpacingH: 1,
      pixelSpacingD: 1,
      // imageWidth:372,
      // imageHeight:236,
      // crossOnImage:{x,y},
      // origBuf:{width,height,data},
      // curRoteMatrix:[[1,0,0],[0,1,0],[0,0,1]]
    },
    // isDataAfterRotate:false,
  },

  //注意这个函数不能更新imagedatas里面的数据，以免触发多次额外的刷新
  currentSID(that) {
    //每一次在数据列表或是在窗口中，切换数据的入口
    let cvp = that.currViewport;
    const { currentSID, canvasNow, seriesInfos, imageDatas } =
      that.currViewport;
    console.log("go into datajs async currentSID", currentSID);
    cvp.renderDataList = {};
    if (
      seriesInfos.length &&
      seriesInfos[canvasNow].currentSID === currentSID
    ) {
      //当前canvas的sid就是新的sid
      let seriesInfo_now = seriesInfos[canvasNow];
      let imageData_now = imageDatas[canvasNow];
      if (seriesInfo_now.model === "PT") {
        //更新SUV值对应的快捷键表
        this.upDateSUVTable(that, seriesInfo_now);
      }
      return { seriesInfo_now, imageData_now };
    }

    // 初次加载series info（切换CurrentSID兼容一脉云数据）
    let series = this.getInfo(that, currentSID);

    let seriesInfo_now = { ...series };

    let rotate = 0;
    let obj = {
      ww: series.ww,
      wl: series.wl,
      rotate,
      img: document.createElement("canvas"),
      translate: { x: 0, y: 0 },
      magnifyPoint: { x: -1, y: -1 },
      curViewMod: seriesInfo_now.initViewMod,
      defaultFlag: true,
      dataWithInfo: {
        pixelSpacingW: null,
        pixelSpacingH: null,
        pixelSpacingD: null,
      },
    };

    if (["PT", "NM", "OA"].includes(series.model)) {
      obj.colormapIndex = Inverse_name;
      obj.colormapSaveIndex = Inverse_name;
      if (series.model === "PT") {
        //更新SUV值对应的快捷键表
        this.upDateSUVTable(that, series);
      }
    } else if (series.model === "MR") {
      if (series.dynamic) {
        obj.ww = series.dynamic.ww;
        obj.wl = series.dynamic.wl;
      }
      this.getOneWLS(obj, series);
    }
    if (series.needInverse) {
      obj.colormapIndex = Inverse_name;
      obj.colormapSaveIndex = Inverse_name;
    }
    let imageData_now = { ...DATA.imageData, ...obj };
    return { imageData_now, seriesInfo_now };
  },

  async MinCurrentSID(that) {
    console.log("MinCurrentSID running");
    const mvp = that.minViewport;
    const {
      currentSID,
      seriesInfos,
      imageDatas,
      canvasNow,
      viewportSize: canvasSize,
    } = mvp;
    if (!currentSID) {
      mvp.seriesInfos = [];
      mvp.imageDatas = [];
      return;
    }

    let series = await this.getInfo(that, currentSID);
    mvp.seriesInfos = [{ ...series }];
    let seriesInfo = mvp.seriesInfos[canvasNow];
    let rotate = 0;
    let obj = {
      ww: series.ww,
      wl: series.wl,
      rotate,
      img: document.createElement("canvas"),
      translate: { x: 0, y: 0 },
      magnifyPoint: { x: -1, y: -1 },
      curViewMod: seriesInfo.initViewMod,
      defaultFlag: true,
    };
    let { AcrossPoint, initViewMod, centerIndex, totalNumber } =
      CROSS.getInitAcrossPoint(seriesInfo);
    obj.curViewMod = initViewMod;
    obj.curImageNum = centerIndex;
    obj.imageNum = totalNumber;
    obj.scale = CLICKOPT.getFullScale(
      canvasSize,
      seriesInfo.initViewMod,
      seriesInfo,
      obj.curImageNum,
    );

    // 反转伪彩
    if (seriesInfo.needInverse) {
      obj.colormapIndex = "B&W Inverse";
      obj.colormapSaveIndex = "B&W Inverse";
    }
    if (["PT", "NM", "OA"].includes(series.model)) {
      obj.colormapIndex = Inverse_name;
      obj.colormapSaveIndex = Inverse_name;
      if (series.model === "PT") {
        //更新SUV值对应的快捷键表
        this.upDateSUVTable(that, series);
      }
    } else if (series.model === "MR") {
      if (series.dynamic) {
        obj.ww = series.dynamic.ww;
        obj.wl = series.dynamic.wl;
      }
      this.getOneWLS(obj, series);
    }
    mvp.imageDatas = [{ ...DATA.imageData, ...obj }];
    mvp.AcrossPoint = AcrossPoint;
    // 小窗展示配准前的图像
    let arr = [];
    let arr1 = [];
    for (let i = 0; i < mvp.seriesInfos.length; i++) {
      arr[i] = DATA.updataSeriesInfo(that.imgPoor[mvp.currentSID].info, null);
      // 更新imageData
      let imageData = { ...mvp.imageDatas[i] };
      arr1[i] = CROSS.asyncImageData(imageData, mvp.AcrossPoint, arr[i]);
    }
    mvp.seriesInfos = arr;
    mvp.imageDatas = arr1;
  },
  //获取每张图窗宽窗位
  getOneWLS(imageData, series) {
    let { instances, initViewMod, model } = series;
    // MR和非均匀数据，重新读窗
    if ((model !== "MR" && !series.isNotUniformSquence) || !instances) return;
    let { curImageNum, curViewMod, defaultFlag, imageNum } = imageData;
    if (
      defaultFlag &&
      curViewMod === initViewMod &&
      instances.length === imageNum &&
      instances[curImageNum]
    ) {
      // 重建之后的序列不再有默认窗宽窗位=
      if (instances[curImageNum].windowWidth) {
        imageData.ww = instances[curImageNum].windowWidth;
        imageData.wl = instances[curImageNum].windowCenter;
      }
    }
  },

  getMultiData(series) {
    // series.orgVolumeSize[2] = Number(series.NumberOfFrames);
    // const num = series.NumberOfFrames;
    // let pathBase = series.path[0];
    // let posBase = series.ImagePositionPatient[0];
    // let thickBase = Number(series.thickness); //可能为负值
    // let newPathArr = [];
    // let newPosArr = [];
    // for (let i = 0; i < num; i++) {
    //   newPathArr.push(`${pathBase}?frame=${i}`);
    //   let imp = { ...posBase };
    //   imp.z = posBase.z + thickBase * i;
    //   newPosArr.push(imp);
    // }
    // series.path = newPathArr;
    // series.ImagePositionPatient = newPosArr;
    return series;
  },

  //只有均匀数据才会进入这个函数
  getInitPosition(series) {
    let { initViewMod } = series;
    let instances = series.instances;

    let ifRevers = false,
      length = instances.length,
      lastIndex = length - 1,
      minus = undefined;

    //ImagePositionPatient 为数组
    let { 0: x1, 1: y1, 2: z1 } = instances[0].ImagePositionPatient;
    let { 0: x2, 1: y2, 2: z2 } = instances[lastIndex].ImagePositionPatient;
    if (initViewMod === 0) {
      //横断面数据z轴要递减
      if (z1 < z2) {
        ifRevers = true;
      }
    }
    if (initViewMod === 1) {
      //冠状面数据y轴要递增
      if (y1 > y2) {
        ifRevers = true;
      }
    }
    if (initViewMod === 2) {
      //矢状面数据x轴要递增
      if (x1 > x2) {
        ifRevers = true;
      }
    }

    if (ifRevers) {
      //数据需要翻转
      series.instances = instances.reverse();
      series.path = series.path.reverse(); //load JH数据或者loadYM数据都是把数据路径存储到这里
      //BuDing20250606，接南昌中心需求，翻转的数据进MPR之前需保持原来的页码 
      // series.ifRevers = ifRevers
    }
    let absPos = Math.sqrt(
      Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2),
    );
    minus = Math.round((absPos * 100) / (length - 1)) / 100; //保留两位小数
    if (!minus) minus = 1;

    //取第一张数据作为基准数据
    let first = series.instances[0];
    if (series.SID === "5") {
      console.log("minus", minus, first);
    }
    series.ImageOrientationPatient = first.ImageOrientationPatient;
    series.volumeOrientation = CROSS.getAxesOfVolume(
      first.ImageOrientationPatient,
    );
    series.ImagePositionPatient = first.ImagePositionPatient;
    series.bitsSigned = first.bitsSigned;
    series.bitsStored = first.bitsStored;
    series.highBit = first.highBit;
    series.rescaleSlop = first.rescaleSlop;
    series.rescaleIntercept = first.rescaleIntercept;
    series.sliceThickness = first.sliceThickness || minus;
    series.thickness = minus;
    series.xPixelSpacing = Number(first.PixelSpacing[1]);
    series.yPixelSpacing = Number(first.PixelSpacing[0]);
    series.zPixelSpacing = series.thickness;
    series.orgVolumeSize = [first.columns, first.rows, length];
    return series;
  },

  //只有均匀数据才会进入这个函数
  getInitResize(series) {
    let {
      initViewMod,
      xPixelSpacing,
      yPixelSpacing,
      zPixelSpacing,
      orgVolumeSize,
    } = series;

    //层厚
    let thickness = Number(zPixelSpacing.toFixed(2));

    //orgT 是原始层厚，thickness是渲染的时候会被用到的层厚，有的时候会被改
    if (initViewMod === 0) {
      series.volumeSpacing = [
        {
          w: xPixelSpacing,
          h: yPixelSpacing,
          d: zPixelSpacing,
          orgT: thickness,
          thickness: thickness,
        },
        {
          w: xPixelSpacing,
          h: zPixelSpacing,
          d: yPixelSpacing,
          orgT: thickness,
          thickness: thickness,
        },
        {
          w: yPixelSpacing,
          h: zPixelSpacing,
          d: xPixelSpacing,
          orgT: thickness,
          thickness: thickness,
        },
      ];
      series.volumeSize = [
        { w: orgVolumeSize[0], h: orgVolumeSize[1], d: orgVolumeSize[2] },
        { w: orgVolumeSize[0], h: orgVolumeSize[2], d: orgVolumeSize[1] },
        { w: orgVolumeSize[1], h: orgVolumeSize[2], d: orgVolumeSize[0] },
      ];
    }

    if (initViewMod === 1) {
      //[xPixelSpacing-x yPixelSpacing-z zPixelSpacing-y]冠状面转横断面
      series.volumeSpacing = [
        {
          w: xPixelSpacing,
          h: zPixelSpacing,
          d: yPixelSpacing,
          orgT: thickness,
          thickness: thickness,
        },
        {
          w: xPixelSpacing,
          h: yPixelSpacing,
          d: zPixelSpacing,
          orgT: thickness,
          thickness: thickness,
        },
        {
          w: zPixelSpacing,
          h: yPixelSpacing,
          d: xPixelSpacing,
          orgT: thickness,
          thickness: thickness,
        },
      ];
      series.volumeSize = [
        { w: orgVolumeSize[0], h: orgVolumeSize[2], d: orgVolumeSize[1] },
        { w: orgVolumeSize[0], h: orgVolumeSize[1], d: orgVolumeSize[2] },
        { w: orgVolumeSize[2], h: orgVolumeSize[1], d: orgVolumeSize[0] },
      ];
    }

    if (initViewMod === 2) {
      //[xPixelSpacing-y yPixelSpacing-z zPixelSpacing-x]矢状面转横断面
      series.volumeSpacing = [
        {
          w: zPixelSpacing,
          h: xPixelSpacing,
          d: yPixelSpacing,
          orgT: thickness,
          thickness: thickness,
        },
        {
          w: zPixelSpacing,
          h: yPixelSpacing,
          d: xPixelSpacing,
          orgT: thickness,
          thickness: thickness,
        },
        {
          w: xPixelSpacing,
          h: yPixelSpacing,
          d: zPixelSpacing,
          orgT: thickness,
          thickness: thickness,
        },
      ];
      series.volumeSize = [
        { w: orgVolumeSize[2], h: orgVolumeSize[0], d: orgVolumeSize[1] },
        { w: orgVolumeSize[2], h: orgVolumeSize[1], d: orgVolumeSize[0] },
        { w: orgVolumeSize[0], h: orgVolumeSize[1], d: orgVolumeSize[2] },
      ];
    }

    return series;
  },

  //创建vtk data
  checkVTKData(imgPoorObj, isForce = false) {
    let { info: seriesInfo, imageDone, data: poor } = imgPoorObj;

    let { initViewMod, volumeSize, isNotUniformSquence } = seriesInfo;
    let isNumEnough = poor[initViewMod].length < 5 ? false : true;

    if (
      imageDone &&
      isNumEnough &&
      (initViewMod || isForce) &&
      !isNotUniformSquence
    ) {
      try {
        //图像加载完了并且初始化视图不是横断面 且图像均匀
        let curViewMod = 0;
        if (!imgPoorObj.volumeImageData) {
          let temp = this.getInitVtkVolume(seriesInfo);
          imgPoorObj.volumeBuffer = temp.volumeBuffer;
          imgPoorObj.volumeImageData = temp.volumeImageData;
        }
        let { volumeBuffer } = imgPoorObj;
        console.time("trans data to transverse volumebuffer"); //10-100ms数量级
        let { d: depth, w: width, h: height } = volumeSize[curViewMod];
        for (let i = 0; i < depth; i++) {
          let orgBuf;
          if (isForce) {
            //用于处理从indexDB里面读取的数据的情况
            orgBuf = poor[curViewMod][i];
          } else {
            orgBuf = LOAD.getSliceFromVolume(poor, seriesInfo, curViewMod, {
              curImageNum: i,
            });
          }
          //把数据填充到体数据里
          if (orgBuf && orgBuf.data) {
            let length = width * height,
              offset = i * length;
            volumeBuffer.set(orgBuf.data, offset);
            //引用体数据的内存
            orgBuf.data.set(volumeBuffer.subarray(offset, offset + length));
          }
        }
        console.timeEnd("trans data to transverse volumebuffer");
      } catch (error) {
        console.log("checkVTKData error");
        console.log(error);
      }
    }

    //把data的数据写入到vtkImageData里面

    return imgPoorObj;
  },

  getInitVtkVolume(seriesInfo) {
    let volumeBuffer, volumeImageData;

    const {
      model,
      volumeSize,
      volumeOrientation,
      rescaleIntercept,
      rescaleSlop,
      SeriesIndex,
      volumeSpacing,
      ImagePositionPatient,
      bitsSigned,
      bitsStored,
      highBit,
    } = seriesInfo;

    let curViewMod = 0;
    // 1. series下的image宽高相等
    // 2. 全部都是16位的数据
    let volumeLength =
      volumeSize[curViewMod].w *
      volumeSize[curViewMod].h *
      volumeSize[curViewMod].d;
    //这里处理部分数据的intercept和slope是浮点数的磁共振数据
    let bits;
    if (bitsSigned) {
      bits = highBit;
    } else {
      bits = bitsStored;
    }
    const unsigned = bits === 16;
    let isForceFloat = false;
    let ifForceShort = unsigned;
    if (rescaleIntercept % 1 != 0 || rescaleSlop % 1 != 0) {
      isForceFloat = true;
    }
    if (!isForceFloat && ifForceShort) {
      if (rescaleIntercept < 0 || rescaleSlop < 0) {
        ifForceShort = false;
      }
    }
    volumeBuffer = LOAD.createDataArray(
      volumeLength,
      model,
      isForceFloat,
      null,
      0,
      ifForceShort,
    );

    let Scalars = vtkDataArray.newInstance({
      size: volumeLength,
      dataType:
        volumeBuffer.BYTES_PER_ELEMENT === 2
          ? vtkDataArray.VtkDataTypes.SHORT
          : vtkDataArray.VtkDataTypes.FLOAT,
      name: SeriesIndex,
    });
    Scalars.setData(volumeBuffer, 1);
    volumeImageData = vtkImageData.newInstance();

    volumeImageData.setOrigin(ImagePositionPatient);

    let initOrientation = volumeOrientation[0].flat();
    //在世界坐标系下，数据也会有一个初始的方向
    volumeImageData.setDirection(initOrientation);

    volumeImageData.setSpacing(
      volumeSpacing[curViewMod].w,
      volumeSpacing[curViewMod].h,
      volumeSpacing[curViewMod].d,
    );
    volumeImageData.setExtent(
      0,
      volumeSize[curViewMod].w - 1,
      0,
      volumeSize[curViewMod].h - 1,
      0,
      volumeSize[curViewMod].d - 1,
    );
    volumeImageData.getPointData().setScalars(Scalars);

    return { volumeBuffer, volumeImageData };
  },

  getVolumeSlice(seriesInfo, volumeBuffer, curImageNum, left) {
    let volumeImageData;

    const {
      volumeSize,
      volumeOrientation,
      rescaleIntercept,
      rescaleSlop,
      SeriesIndex,
      volumeSpacing,
      ImagePositionPatient,
      bitsSigned,
      bitsStored,
      highBit,
      initViewMod,
    } = seriesInfo;

    // 1. series下的image宽高相等
    // 2. 全部都是16位的数据
    let volumeLength =
      volumeSize[initViewMod].w *
      volumeSize[initViewMod].h *
      volumeSize[initViewMod].d;
    //这里处理部分数据的intercept和slope是浮点数的磁共振数据
    let bits;
    if (bitsSigned) {
      bits = highBit;
    } else {
      bits = bitsStored;
    }
    const unsigned = bits === 16;
    let isForceFloat = false;
    let ifForceShort = unsigned;
    if (rescaleIntercept % 1 != 0 || rescaleSlop % 1 != 0) {
      isForceFloat = true;
    }
    if (!isForceFloat && ifForceShort) {
      if (rescaleIntercept < 0 || rescaleSlop < 0) {
        ifForceShort = false;
      }
    }

    let Scalars = vtkDataArray.newInstance({
      size: volumeLength,
      dataType:
        volumeBuffer?.BYTES_PER_ELEMENT === 2
          ? vtkDataArray.VtkDataTypes.SHORT
          : vtkDataArray.VtkDataTypes.FLOAT,
      name: SeriesIndex,
    });

    let index;
    if (initViewMod === 0) {
      index =
        volumeSize[initViewMod].w * volumeSize[initViewMod].h * curImageNum;
    } else if (initViewMod === 1) {
      index =
        volumeSize[initViewMod].w * volumeSize[initViewMod].d * curImageNum;
    } else {
      index =
        volumeSize[initViewMod].h * volumeSize[initViewMod].d * curImageNum;
    }
    let sliceVolume;
    if (volumeBuffer) {
      sliceVolume = left
        ? volumeBuffer.slice(0, index)
        : volumeBuffer.slice(index);
      Scalars.setData(sliceVolume, 1);
    }
    volumeImageData = vtkImageData.newInstance();

    volumeImageData.setOrigin(ImagePositionPatient);

    let initOrientation = volumeOrientation[0].flat();
    //在世界坐标系下，数据也会有一个初始的方向
    volumeImageData.setDirection(initOrientation);

    volumeImageData.setSpacing(
      volumeSpacing[initViewMod].w,
      volumeSpacing[initViewMod].h,
      volumeSpacing[initViewMod].d,
    );
    volumeImageData.setExtent(
      0,
      volumeSize[initViewMod].w - 1,
      0,
      volumeSize[initViewMod].h - 1,
      0,
      volumeSize[initViewMod].d - 1,
    );
    volumeImageData.getPointData().setScalars(Scalars);

    return { volumeBuffer: sliceVolume, volumeImageData };
  },

  //部分数据需要特殊处理，统一在这个函数里面做
  checkSpacialInfo(series) {
    let length = series.instances.length; //序列的长度
    let first = series.instances[0];
    //联影检查特殊类型的定位图单独处理定位图单独处理
    if (length === 2 && first.imageTypes?.indexOf("LOCALIZER") > -1) {
      let second = series.instances[1];
      if (first.rows === second.rows && first.columns === second.columns) {
        let index = -1;
        if (
          first.ImagePositionPatient &&
          first.PixelSpacing &&
          first.ImageOrientationPatient
        ) {
          index = 0;
        }
        if (
          second.ImagePositionPatient &&
          second.PixelSpacing &&
          second.ImageOrientationPatient
        ) {
          index = 1;
        }
        if (index > -1) {
          for (let i = 0; i < 2; i++) {
            if (
              !series.instances[i].PixelSpacing ||
              !series.instances[i].ImagePositionPatient ||
              !series.instances[i].ImageOrientationPatient
            ) {
              series.instances[i].ImagePositionPatient = {
                ...series.instances[index].ImagePositionPatient,
              };
              series.instances[i].PixelSpacing = {
                ...series.instances[index].PixelSpacing,
              };
              series.instances[i].ImageOrientationPatient = [
                ...series.instances[index].ImageOrientationPatient,
              ];
            }
          }
        }
      }
      //但是判定为不均匀
      series.isNotUniformSquence = true;
    }
    return series;
  },
  //seriesCheck
  //检查series的信息是否完整,是否均匀,允许重建
  // ifMissInfo:一般为false，如果为true，说明数据缺失pixelSpacing,ImagePositionPatient,ImageOrientation等信息
  // isNotSameSquence:一般为false，如果为true，说明数据包含了不同的数据类型，是拼接的序列
  checkSeriesInfo(series) {
    let isMissInfo = false;
    let isNotSameSquence = false;

    let length = series.instances.length; //序列的长度
    let first = series.instances[0];
    for (let i = 0; i < length; i++) {
      let image = series.instances[i];
      if (
        image.modality !== first.modality ||
        image.photometricInterpretation !== first.photometricInterpretation || //是否反色
        image.bitsStored !== first.bitsStored ||
        image.bitsAllocated !== first.bitsAllocated ||
        image.highBit !== first.highBit ||
        image.bitsSigned !== first.bitsSigned
      ) {
        isNotSameSquence = true;
      }
      //必须要有这些信息，如果缺失了，就不能显示
      if (!image.PixelSpacing) {
        image.PixelSpacing = [1, 1];
        isMissInfo = true;
      }
      if (!image.ImagePositionPatient) {
        image.ImagePositionPatient = [0, 0, i]; //不要同步到一个同一个位置以免影响十字定位
        isMissInfo = true;
      }
      if (!image.ImageOrientationPatient) {
        image.ImageOrientationPatient = [1, 0, 0, 0, 1, 0];
        isMissInfo = true;
      }
    }

    // 这里是针对序列拆分，如果原始序列是missInfo，那么拆分后的序列也应该是missInfo
    series.isMissInfo =
      series.isMissInfo !== undefined ? series.isMissInfo : isMissInfo;
    series.isNotSameSquence = isNotSameSquence;
    return series;
  },
  // isNotUniformSquence:不均匀的数据不可以做任何的三维重建，所有的三维相关的信息，都没有意义
  checkSeriesUniform(series) {
    let isNotUniformSquence = series.isNotUniformSquence
      ? series.isNotUniformSquence
      : false;
    let first = series.instances[0];
    let initViewMod = CROSS.axisToViewMode(first.ImageOrientationPatient);
    //信息缺失或者不一致的数据，直接判断为不均匀
    if (series.isMissInfo || series.isNotSameSquence) {
      isNotUniformSquence = true;
    } else {
      //检测是否均匀
      let len = series.instances.length;
      let temp = [];
      for (let index = 1; index < len; index++) {
        try {
          let image = series.instances[index];
          let orientation = image.ImageOrientationPatient;
          let viewModeNow = CROSS.axisToViewMode(orientation);
          //图像方位不一致，判定为不均匀
          if (viewModeNow !== initViewMod) {
            isNotUniformSquence = true;
            break;
          }
          let tempLast = JSON.parse(JSON.stringify(temp));
          let ImagePositionPatient = image.ImagePositionPatient;
          let ImagePositionPatient_1 =
            series.instances[index - 1].ImagePositionPatient;
          for (let a = 0; a < 3; a++) {
            temp[a] = Math.abs(
              ImagePositionPatient[a] - ImagePositionPatient_1[a],
            ).toFixed(3);
          }
          //如果三次的位移都是0，说明的定位有问题，不是可以重建的序列
          if (temp[0] == 0 && temp[1] == 0 && temp[2] == 0) {
            isNotUniformSquence = true;
            break;
          }
          if (index > 2) {
            for (let b = 0; b < 3; b++) {
              if (temp[b] != tempLast[b]) {
                //这个地方有精度干扰。更高的浮点精度，会导致更多的不均匀序列
                if (Math.abs(temp[b] - tempLast[b]) > 0.01) {
                  isNotUniformSquence = true;
                  break;
                }
              }
            }
          }
        } catch (error) {
          console.log("checkSeries error");
          isNotUniformSquence = true;
          console.log(error);
        }
      }
    }
    if (isNotUniformSquence) {
      initViewMod = 0;
    }
    series.initViewMod = initViewMod;
    series.curViewMod = series.initViewMod;
    series.isNotUniformSquence = isNotUniformSquence;
    return series;
  },

  //seriesInfo的格式化
  //重新处理层厚，判断图像是否均匀，求对应视图的分辨率和长宽信息，部分数据另外的重建的面需要插值
  getInitSeriesInfo(series) {
    //这个保留多帧数据的接口，暂时没有用到
    if (series.NumberOfFrames) {
      series = this.getMultiData(series);
    }
    series = this.checkSpacialInfo(series); //部分数据需要特殊处理
    series = this.checkSeriesInfo(series); //检查series的信息是否完整,是否均匀,允许重建
    series = this.checkSeriesUniform(series); //检查series的信息是否均匀
    console.log(
      "checkSeriesInfo",
      series.SID,
      "isNotUniformSquence:",
      series.isNotUniformSquence,
      "isMissInfo:",
      series.isMissInfo,
      "isNotSameSquence:",
      series.isNotSameSquence,
    );

    if (!series.isNotUniformSquence) {
      //只有均匀数据才需要初始化体数据的信息
      series = this.getInitPosition(series); //初始化图像位置
      series = this.getInitResize(series); //初始化图像是否需要插值和重建
    }
    //只有"PT"模态才需要SUV计算所需的信息
    if (series.model == "PT") {
      //一脉数据目前缺失了这些字段
      if (!series.UT) {
        //如果没有单位时间
        series.UT = "Bq";
        series.Units = "BQML";
      }
      if (!series.PW) {
        //如果没有体重
        series.PW = "60";
        series.PatientWeight = "60";
      }
      if (!series.RHL) {
        //如果没有半衰期
        series.RHL = "6586.2";
        series.RadionuclideHalfLife = "6586.2";
      }
      if (!series.RTD) {
        //如果没有总注射放射剂量
        series.RTD = "320000000";
        series.RadionuclideTotalDose = "320000000";
      }
      if (!series.ST) {
        //如果没有注射时间
        series.ST = "091314.000000";
        series.RadiopharmaceuticalStartTime = "091314.000000";
      }
      if (!series.ET) {
        //如果没有扫描时间
        series.AcquisitionTime = "101314.000000";
        series.ET = "101314.000000";
      }
      series.cUT = series.UT;
      series.cPW = series.PW;
      series.cRTD = series.RTD;
      series.cRHL = series.RHL;
      series.cST = series.ST;
      series.cET = series.ET;
    }
    return series;
  },

  //获取sereis信息
  getInfo(that, seriesId) {
    let info = that.imgPoor[seriesId] && that.imgPoor[seriesId].info;
    if (info) {
      info = this.updataSeriesInfo(info, that.imgPoor[seriesId].registPara);
      return info;
    } else {
      throw Error("注意当前series不存在imgPoor内，请检查代码流程");
    }
    // return new Promise((resolve, reject) => {
    //   let info = that.imgPoor[seriesId] && that.imgPoor[seriesId].info;
    //   if (info) {
    //     return resolve(info);
    //   } else {
    //     throw Error("注意当前series不存在imgPoor内，请检查代码流程");
    //   }
    // });
  },
  //获取标注
  getMarks(that, seriesInfo, currentSID) {
    return new Promise((resolve, reject) => {
      let ieditListData = that.ieditListData[currentSID];
      if (ieditListData) return resolve();
      const { env } = getDataType();
      if (env === "study") {
        markApi
          .getMarks(seriesInfo.accessionNumber, seriesInfo.seriesInstanceUid)
          .then((res) => {
            if (res.code === 200) {
              that.ieditListData[currentSID] = res.data?.labelJson
                ? JSON.parse(res.data.labelJson)
                : [];
              const vpKeyList = Object.keys(that.viewportList);
              const vpNum = vpKeyList.length;
              for (let i = 0; i < vpNum; i++) {
                if (
                  that.viewportList[vpKeyList[i]].seriesInfos[0]
                    ?.SeriesIndex === currentSID
                ) {
                  that.viewportList[vpKeyList[i]].ieditIndex = -1;
                }
              }
            }
            resolve();
          });
      }
    });
  },
  saveMarks(that, currentSID, fn) {
    return new Promise((resolve, reject) => {
      let seriesInfo = that.imageDataNow.series;
      let params = {
        accessionNumber: seriesInfo.accessionNumber,
        labelJson: JSON.stringify(that.ieditListData[currentSID]),
        seriesInstanceUid: seriesInfo.seriesInstanceUid,
      };
      const { env } = getDataType();
      if (env === "study") {
        markApi.saveMarks(params).then((res) => {
          if (res.code === 200) {
            if (fn) fn();
            resolve();
          }
          if (fn) fn();
          resolve();
        });
      }
    });
  },
  async delMarks(that, ieditActive) {
    let ieditListData = that.ieditListData || {};
    for (let k in ieditListData) {
      let listData = ieditListData[k];
      for (let i = 0; i < listData.length; i++) {
        let { ID } = listData[i];

        if (ID === ieditActive) {
          // 如果删的是CPR标注，只删掉当前选中的控制点
          // if (listData[i].type === "CPRPoint") {
          //   const index = cvp.ieditIndex;
          //   listData[i].editPointList.splice(index, 1);
          //   cprVoiListData[k].splice(index, 1);
          // } else {
          //   ieditListData[k].splice(i, 1);
          // }
          ieditListData[k].splice(i, 1);
          this.saveMarks(that, k);
        }
      }
    }
    that.roiShow++;
  },
  async delAllMarks(that, list) {
    let IDs = list.filter((item) => !item.ifNoneInfo).map((r) => r.ID);
    if (IDs.length <= 0) return;
    const cvp = that.currViewport;
    let ieditListData = that.ieditListData || {};
    let cprVoiListData = cvp.CPRVoiListData || {};
    for (let k in ieditListData) {
      // let listData = ieditListData[k];
      let flag = false;
      ieditListData[k] = ieditListData[k].filter((item) => {
        flag = true;
        return !IDs.includes(item.ID);
      });
      /*for (let i = 0; i < listData.length; i++) {
        let { ID } = listData[i]
        if (IDs.includes(ID)) {
          flag = true
          ieditListData[k].splice(--i, 1)
          that.ieditListData = ieditListData
        }
      }*/
      that.ieditListData = ieditListData;
      cprVoiListData[k] = [];
      cvp.CPRVoiListData = cprVoiListData;
      if (flag) this.saveMarks(that, k);
    }
    that.roiShow++;
  },
  setWWWL(imageData, series) {
    let { ww, wl, model } = series;
    let {
      intercept,
      slope,
      windowCenter,
      windowWidth,
      maxPixelValue,
      minPixelValue,
    } = imageData;
    let min = minPixelValue * slope + intercept,
      max = maxPixelValue * slope + intercept;
    let w = parseInt((max - min).toFixed(0));
    let l = parseInt(((max + min) / 2).toFixed(0));
    series.dynamic = {
      ww: w,
      wl: l,
    };
    //isNull表示初始化了窗宽窗位，但是初始化值不是有效值
    let isNull = (wl == 1 && ww == 1) || (wl == 0 && ww == 0);
    if (model === "PT") {
      let { ww: ww2, wl: wl2 } = this.suv2wwwl(series, 7, 0);
      series.ww = ww2;
      series.wl = wl2;
    } else if (isNull || !ww) {
      series.ww = w;
      series.wl = l;
    }
    return series;
  },
  upDateSUVTable(that, series) {
    that.tempDataPT[1].ww = series.ww;
    that.tempDataPT[1].wl = series.wl;
    if (series.dynamic) {
      that.tempDataPT[0].ww = series.dynamic.ww;
      that.tempDataPT[0].wl = series.dynamic.wl;
    } else {
      that.tempDataPT[0].ww = 20000;
      that.tempDataPT[0].wl = 10000;
    }

    for (let i = 2; i < that.tempDataPT.length; i++) {
      let min = that.tempDataPT[i].min;
      let max = that.tempDataPT[i].max;
      let { ww, wl } = this.suv2wwwl(series, max, min);
      that.tempDataPT[i].ww = ww;
      that.tempDataPT[i].wl = wl;
    }
  },
  suv2wwwl(series, max, min) {
    let { PW, RTD, RHL, ST, ET, UT, model, Units } = series;
    if (model === "PT") {
      if (Units && Units === "GML") {
        // max = max;
        // min = min;
      } else {
        if (UT === "Mci") RTD = RTD / (2.7027 * Math.pow(10, -8));
        ET =
          Number(ET.substring(0, 2)) * 3600 +
          Number(ET.substring(2, 4)) * 60 +
          Number(ET.substring(4, 6));
        ST =
          Number(ST.substring(0, 2)) * 3600 +
          Number(ST.substring(2, 4)) * 60 +
          Number(ST.substring(4, 6));
        let temp1 = (-0.693 * (ET - ST)) / RHL;
        let temp2 = Math.exp(temp1);
        max = (RTD * temp2 * max) / (PW * 1000);
        min = (RTD * temp2 * min) / (PW * 1000);
      }
    }
    let ww = max - min;
    let wl = max - ww / 2;
    return {
      ww,
      wl,
    };
  },
  wwwl2suv(ww, wl, series) {
    let min = wl - ww / 2;
    let max = wl + ww / 2;
    let { PW, RTD, RHL, ST, ET, UT, model, Units } = series;
    let T, B;
    if (model === "PT") {
      T = this.getSUV(max, PW, RTD, RHL, ST, ET, UT, Units);
      B = this.getSUV(min, PW, RTD, RHL, ST, ET, UT, Units);
    } else {
      T = max;
      B = min;
    }
    return {
      T,
      B,
    };
  },
  getSUV(value, PW, RTD, RHL, ST, ET, UT, Units) {
    if (Units && Units === "GML") {
      //如果单位是Units，则直接返回值
      return value;
    }
    if (UT === "Mci") RTD = RTD / (2.7027 * Math.pow(10, -8));
    ET =
      Number(ET.substring(0, 2)) * 3600 +
      Number(ET.substring(2, 4)) * 60 +
      Number(ET.substring(4, 6)); //扫描时间
    ST =
      Number(ST.substring(0, 2)) * 3600 +
      Number(ST.substring(2, 4)) * 60 +
      Number(ST.substring(4, 6)); //药物注射时间
    let temp1 = (-0.693 * (ET - ST)) / RHL;
    let temp2 = Math.exp(temp1);
    let RDD = RTD * temp2; //衰变后的放射药物剂量
    let B = (value * PW * 1000) / RDD;
    return B;
  },

  //from函数调用方
  updataSeriesInfo(seriesInfo, registPara, from) {
    let resp = seriesInfo;
    if (registPara) {
      let { trans, dRote } = registPara;
      if (trans && (trans.x || trans.y || trans.z)) {
        resp = { ...resp };
        //更新ImagePositionPatient
        let IPO = seriesInfo.ImagePositionPatient;
        if (IPO) {
          resp.ImagePositionPatient = [
            IPO[0] + trans.x || 0,
            IPO[1] + trans.y || 0,
            IPO[2] + trans.z || 0,
          ];
        }
        //更新instance的ImagePositionPatient
        let newinstances = [];
        let instances = seriesInfo.instances;
        for (let i = 0, len = instances.length; i < len; i++) {
          let instance = { ...instances[i] };
          let instanceIPO = instances[i].ImagePositionPatient;
          if (instanceIPO) {
            instance.ImagePositionPatient = [
              instanceIPO[0] + trans.x || 0,
              instanceIPO[1] + trans.y || 0,
              instanceIPO[2] + trans.z || 0,
            ];
          }
          newinstances.push(instance);
        }
        resp.instances = newinstances;
      }
      if (dRote && (dRote.rx || dRote.ry || dRote.rz)) {
        resp = { ...resp };
        resp.regRotePara = { ...dRote };
      }
    }
    // console.log("updataSeriesInfo", from, resp.ImagePositionPatient);
    resp.timestampUid = new Date().getTime();
    return resp;
  },
  //配准相关的接口，如果没有权限就不能往云上存，只能存到localstorage里面
  getRegistPara(currentSID) {
    return new Promise((resolve, reject) => {
      let curR = undefined;
      //先从localstorge本地读取,如果读到了记录，就不从云上读了
      let reg_records = localStorage.reg_records;
      if (reg_records) {
        reg_records = JSON.parse(reg_records);
        if (reg_records[currentSID]) {
          curR = reg_records[currentSID];
          resolve(curR);
        }
      }
      try {
        api.getRegistPara(currentSID).then((r) => {
          if (r && r.code === 1) {
            resolve(r.data);
          } else {
            resolve(false);
          }
        });
      } catch (error) {
        resolve(null);
      }
    });
  },
  saveRegistPara(currentSID, result, imgPoor) {
    return new Promise((resolve, reject) => {
      //先更新imgPoor
      imgPoor[currentSID].registPara = result;
      //先存localstorage
      let reg_records = localStorage.reg_records;
      if (!reg_records) {
        reg_records = "{}";
      }
      reg_records = JSON.parse(reg_records);
      console.log("saveRegistPara", currentSID, result);
      reg_records[currentSID] = result;
      localStorage.reg_records = JSON.stringify(reg_records);
      //再往云上存
      try {
        const params = {
          data: result,
          mix_id: currentSID,
        };
        api.saveRegistPara(params).then((res) => {
          if (res && res.code === 1) {
            console.log("saveRegistPara", currentSID, "success");
          } else {
            console.log("saveRegistPara", currentSID, "failed");
          }
          resolve();
        });
      } catch (error) {
        resolve();
      }
    });
  },
  deleteRegistPara(currentSID) {
    return new Promise((resolve, reject) => {
      //先删localstorage
      let reg_records = localStorage.reg_records;
      if (reg_records) {
        reg_records = JSON.parse(reg_records);
        if (reg_records[currentSID]) {
          delete reg_records[currentSID];
        }
      } else {
        reg_records = {};
      }
      localStorage.reg_records = JSON.stringify(reg_records);
      try {
        api.deleteRegistPara(currentSID).then((res) => {
          if (res && res.code === 1) {
            console.log("deleteRegistPara", currentSID, "success");
          } else {
            console.log("deleteRegistPara", currentSID, "failed");
          }
          resolve();
        });
      } catch (error) {
        resolve();
      }
    });
  },

  //根据伪彩id获取图片地址
  getCMPSrc(key) {
    let index = key === "B&W Inverse" ? "B_W Inverse" : key;
    let src = require(`../../../../static/colormap/${index}.png`);
    return src;
  },

  createImageData(seriesInfo) {
    let imageData = {
      ...this.imageData,
      scale: { x: 1, y: 1 },
      translate: { x: 0, y: 0 },
      img: null,
      curViewMod: seriesInfo.initViewMod,
      ww: seriesInfo.ww,
      wl: seriesInfo.wl,
      dataWithInfo: {
        pixelSpacingX: null,
        pixelSpacingY: null,
        pixelSpacingZ: null,
      },
    };

    // 反转伪彩
    if (seriesInfo.needInverse) {
      imageData.colormapIndex = "B&W Inverse";
      imageData.colormapSaveIndex = "B&W Inverse";
    }
    const totalNum = seriesInfo.instances.length;
    imageData.imageNum = totalNum;

    // 初始化窗宽窗位
    if (["PT", "NM", "OA"].includes(seriesInfo.model)) {
      imageData.colormapIndex = "B&W Inverse";
      imageData.colormapSaveIndex = "B&W Inverse";
    } else if (seriesInfo.model === "MR" || seriesInfo.isNotUniformSquence) {
      if (seriesInfo.dynamic) {
        imageData.ww = seriesInfo.dynamic.ww;
        imageData.wl = seriesInfo.dynamic.wl;
      }
      // 先设置curImageNum，再来执行这一步
      this.getOneWLS(imageData, seriesInfo);
    }

    imageData.key = `${seriesInfo.SeriesIndex}-${imageData.curImageNum}`;

    return imageData;
  },
};

export default DATA;
