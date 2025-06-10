import ACTIVEOPT from "./activeOpt.js";
import DATA from "./data.js";
import CROSS from "./crosshair.js";
import store from "@/store/store.js";
let CLICKOPT = {
  //点击事件
  clickOpt(that) {
    const cvp = that.currViewport;
    const canvasNow = cvp.canvasNow;
    const seriesInfo = cvp.seriesInfos[canvasNow];
    const canvasSize = cvp.canvasSize[canvasNow];
    const imageDatas = cvp.imageDatas;
    const imgPoor = that.imgPoor;
    let val = that.clickOpt;
    if (val === "default") return;

    switch (val) {
      case "MetaInfo": //元信息
      case "WWWLPre": //窗宽窗位预设
      case "aiAnalysis": // AI分析数据
      case "Colormap": //伪彩预设
      case "settingShow": //显示隐藏dicom信息
      case "registrationShow": //显示隐藏配准窗口
      case "imageStitchingShow": //显示隐藏图像拼接窗口
      case "Mark": //工具箱
      case "roiList":
      case "tempShow":
      case "imageList":
      case "History":
      case "Download": {
        let obj = {
          MetaInfo: "dicomListShow",
          WWWLPre: "windowLevelSetShow",
          Colormap: "colormapShow",
          settingShow: "settingShow",
          registrationShow: "registrationShow",
          imageStitchingShow: "imageStitchingShow",
          Mark: "roiEditBoxShow",
          roiList: "roiListShow",
          tempShow: "tempShow",
          aiAnalysis: "aiShow",
          imageList: "showImageList",
          History: "historyShow",
          Download: "downloadShow",
        };
        let item = obj[val];
        that[item] = !that[item];
        if (that[item]) {
          that.dialogZIndex++;
        }
        break;
      }
      //隐藏标注
      case "hideMark": {
        that.roiShow = that.roiShow > -1 ? -1 : 1;
        break;
      }
      //隐藏定位线
      case "hidePosLine": {
        that.posLineShow = !that.posLineShow;
        localStorage.setItem("posLineShow", that.posLineShow);
        break;
      }
      //关联布局
      case "linkLayoutAuto": {
        that.isAutoLinkout = !that.isAutoLinkout; //显示隐藏关联布局
        that.isManualLinkout = false;
        let keys = Object.keys(that.viewportList);
        for (let i = 0; i < keys.length; i++) {
          let viewport = that.viewportList[keys[i]];
          viewport.manualLinkNum = undefined;
          if (!viewport.addIntoSynicDisable && that.isAutoLinkout) {
            viewport.addIntoSynic = true;
          } else {
            viewport.addIntoSynic = false;
          }
        }
        break;
      }
      case "linkLayoutManual": {
        that.isManualLinkout = !that.isManualLinkout; //显示隐藏关联布局
        that.isAutoLinkout = false;
        let keys = Object.keys(that.viewportList);
        for (let i = 0; i < keys.length; i++) {
          let viewport = that.viewportList[keys[i]];
          viewport.manualLinkNum = undefined;
          viewport.addIntoSynic = false;
        }
        break;
      }
      //VOI
      case "VOITool": {
        that.isVoiToolShow = !that.isVoiToolShow; //显示隐藏VOI工具箱
        break;
      }
      //删除标注
      case "delMark": {
        // let list = cvp.ieditListData[cvp.currentSID];
        let list = that.ieditListData[cvp.currentSID];
        if (!list || !list.length) {
          break;
        }
        // that.warning.deleRoi = true
        that.delAllMark();
        break;
      }

      //黑白反转
      case "ReverseBW": {
        let imageData = { ...cvp.imageDatas[canvasNow] };
        if (imageData.colormapIndex === "B&W") {
          imageData.colormapIndex = "B&W Inverse";
        } else {
          imageData.colormapIndex = "B&W";
        }
        cvp.imageDatas.splice(canvasNow, 1, { ...imageData });
        break;
      }

      //伪彩反转
      case "ChangeColor": {
        cvp.renderDataList = {};
        let imageData = { ...cvp.imageDatas[canvasNow] };
        let { colormapIndex, colormapSaveIndex } = imageData;
        if (colormapIndex === colormapSaveIndex) {
          imageData.colormapIndex = "B&W";
        } else {
          imageData.colormapIndex = imageData.colormapSaveIndex;
        }

        cvp.imageDatas.splice(canvasNow, 1, { ...imageData });
        break;
      }

      //设置参数
      case "setParam": {
        if (that.paramShow === true) {
          that.paramShow = false;
          break;
        }
        let series = seriesInfo;
        if (series.model !== "PT") {
          break;
        }
        that.paramShow = true;
        break;
      }
      //上下反转
      //左右反转
      case "Flip":
      case "Reverse": {
        let imageData = { ...cvp.imageDatas[canvasNow] };

        if (val === "Flip") {
          imageData.scale.y = imageData.scale.y * -1;
        } else if (val === "Reverse") {
          imageData.scale.x = imageData.scale.x * -1;
        }
        cvp.imageDatas.splice(canvasNow, 1, { ...imageData });
        break;
      }
      //左旋或者右旋固定角度
      case "LeftRotate":
      case "RightRotate": {
        let imageData = { ...cvp.imageDatas[canvasNow] };
        let angle = Math.PI / 2;
        if (val === "LeftRotate") {
          imageData.rotate -= angle;
        } else if (val === "RightRotate") {
          imageData.rotate += angle;
        }
        that.$set(cvp.imageDatas, canvasNow, imageData);
        // cvp.imageDatas.splice(canvasNow, 1, { ...imageData });
        console.log(cvp.imageDatas, "imagedatas");
        break;
      }
      //横断面
      //矢状面
      //冠状面
      //如果数据不均匀，则不会生成volumedata，也因此不能进入和切换视图
      case "Cross":
      case "Coronal":
      case "Sagittal": {
        let obj = {
          Cross: 0,
          Coronal: 1,
          Sagittal: 2,
        };
        let { currentSID, volumeSize, isNotUniformSquence, initViewMod } =
          seriesInfo;

        let curViewMod = obj[val];
        let poor = imgPoor[currentSID];
        if (!poor.imageDone && curViewMod !== initViewMod) {
          that.mprLayerShow = true;
          break;
        }
        if (volumeSize[initViewMod].d < 5) {
          //切片数量不足
          that.showWarning = true;
          that.warningType = "msgLess";
        } else if (that.warningTip && isNotUniformSquence) {
          //间隔不均匀
          that.warning.spacing = true;
        } else {
          this.changeViewMod(that, canvasNow, curViewMod);
        }
        break;
      }
      case "quitMPR": {
        that.isInMPR = false;
        that.$store.commit("resetMPRTrans");
        break;
      }
      //视图窗口
      case "Grid1":
      case "Grid2":
      case "Grid3":
      case "Grid4":
      case "Grid5":
      case "Grid6":
      case "Grid9":
      case "Grid12":
      case "Grid18":
      case "Grid20":
      case "Grid24":
      case "Grid30": {
        let num = Number(val.slice(4));
        cvp.gridNum = num;
        cvp.gridMod = 0;
        that.changeCurrGridNum();
        store.commit("setImageStitching", []);
        break;
      }
      case "Grid2.0":
      case "Grid3.0":
      case "Grid3.1":
      case "Grid3.2": // 调试代码
      case "Grid4.0":
      case "Grid4.1":
      case "Grid6.0": {
        let num = val.slice(4);
        cvp.gridNum = num;
        cvp.gridMod = 0;
        that.changeCurrGridNum();
        store.commit("setImageStitching", []);
        break;
      }
      // 布局窗口
      case "Layout1":
      case "Layout2":
      case "Layout4":
      case "Layout6":
      case "Layout9":
      case "Layout12":
      case "Layout18":
      case "Layout20":
      case "Layout24":
      case "Layout30": {
        store.commit("setImageStitching", []);
        const num = Number(val.slice(6));
        that.layoutNum = num;
        that.changeLayout(num);
        break;
      }
      case "Layout2.0":
      case "Layout6.0": {
        store.commit("setImageStitching", []);
        const layoutStr = val.slice(6);
        that.layoutNum = layoutStr;
        that.changeLayout(layoutStr);
        break;
      }

      // 重置
      case "Reset": {
        this.resetFn(that);
        break;
      }

      // 适应窗口
      case "Fit": {
        let imageData = { ...imageDatas[canvasNow] };
        let curViewMod = imageData.curViewMod;
        let scale = this.getFullScale(
          canvasSize,
          curViewMod,
          seriesInfo,
          imageData.curImageNum,
        );
        imageData.scale = scale;
        imageData.translate.x = 0;
        imageData.translate.y = 0;
        cvp.imageDatas.splice(canvasNow, 1, { ...imageData });
        break;
      }
      //原图大小
      case "OneToOne": {
        let imageData = { ...imageDatas[canvasNow] };
        let { curViewMod, dataWithInfo } = imageData;
        let { pixelSpacingW: w, pixelSpacingH: h } = dataWithInfo;
        if (!w) w = 1;
        if (!h) h = 1;
        imageData.scale.x = 1;
        imageData.scale.y = (1 * h) / w;
        imageData.scale.baseSpacing = w;
        imageData.scale.baseFactor = 1;
        imageData.translate.x = 0;
        imageData.translate.y = 0;
        cvp.imageDatas.splice(canvasNow, 1, { ...imageData });
        break;
      }
      case "ACross": {
        that.activeOpt = "ACross";
        ACTIVEOPT.ACross(that, null);
        break;
      }
      case "Full": {
        let { layoutNum, viewportID } = that;
        let { canvasRange } = that;
        let { gridNum } = cvp;
        if (gridNum === 1 && layoutNum === 1) return;
        let { fullGridIndex, fullVPID } = canvasRange;
        if (fullVPID != undefined && fullGridIndex != undefined) {
          // 退出全屏状态
          canvasRange.fullVPID = undefined;
          canvasRange.fullGridIndex = undefined;
        } else {
          // 进入全屏状态
          canvasRange.fullVPID = viewportID;
          canvasRange.fullGridIndex = canvasNow;
        }
        that.canvasRange = { ...canvasRange };
        break;
      }

      // 模板
      case "MPR3": {
        if (cvp.gridMod === "MPR3") {
          for (let i = 0; i < 3; i++) {
            let imageData = { ...cvp.imageDatas[i] };
            cvp.imageDatas.splice(i, 1, { ...imageData });
          }
          if (!that.useCompatibility) Vue.prototype.$loading(true);
          setTimeout(() => {
            that.isInMPR = true;
          }, 10);
        } else {
          let seriesInfo = cvp.seriesInfos[cvp.canvasNow];
          let { currentSID, volumeSize, initViewMod, isNotUniformSquence } =
            seriesInfo;
          let poor = that.imgPoor[currentSID];

          if (!poor.imageDone) {
            // 未加载完成
            that.mprLayerShow = true;
            break;
          }
          if (volumeSize[initViewMod].d < 5) {
            // 切片数量不足
            that.showWarning = true;
            that.warningType = "msgLess";
          } else if (that.warningTip && isNotUniformSquence) {
            //间隔不均匀
            that.warning.spacing = true;
          } else {
            // 存储进入MPR、CPR、VR之前的图像数据
            this.setViewportListBefore(that);
            if (!that.useCompatibility) Vue.prototype.$loading(true);
            that.changeLayout(1);
            that.changeGridMod(val);
            setTimeout(() => {
              that.isInMPR = true;
            }, 10);
            that.dicomShow.orientation = false;
          }
        }
        break;
      }
      case "CPR": {
        if (!that.isInCPR) {
          let seriesInfo = cvp.seriesInfos[cvp.canvasNow];
          let { currentSID, volumeSize, initViewMod, isNotUniformSquence } =
            seriesInfo;
          let poor = that.imgPoor[currentSID];

          if (!poor.imageDone) {
            // 未加载完成
            that.mprLayerShow = true;
            break;
          }
          if (volumeSize[initViewMod].d < 5) {
            // 切片数量不足
            that.showWarning = true;
            that.warningType = "msgLess";
          } else if (that.warningTip && isNotUniformSquence) {
            //间隔不均匀
            that.warning.spacing = true;
          } else {
            // 存储进入MPR、CPR、VR之前的图像数据
            this.setViewportListBefore(that);
            Vue.prototype.$loading(true);
            setTimeout(() => {
              that.isInCPR = true;
            }, 10);
          }
        } else {
          that.isInCPR = false;
        }
        break;
      }
      case "VR": {
        if (!that.isInVR) {
          let seriesInfo = cvp.seriesInfos[cvp.canvasNow];
          let { currentSID, volumeSize, initViewMod, isNotUniformSquence } =
            seriesInfo;
          let poor = that.imgPoor[currentSID];

          if (!poor.imageDone) {
            // 未加载完成
            that.mprLayerShow = true;
            break;
          }
          if (volumeSize[initViewMod].d < 5) {
            // 切片数量不足
            that.showWarning = true;
            that.warningType = "msgLess";
          } else if (that.warningTip && isNotUniformSquence) {
            //间隔不均匀
            that.warning.spacing = true;
          } else {
            // 存储进入MPR、CPR、VR之前的图像数据
            this.setViewportListBefore(that);
            Vue.prototype.$loading(true);
            setTimeout(() => {
              that.isInVR = true;
            }, 10);
          }
        } else {
          that.isInVR = false;
        }
        break;
      }
      case "tabelRemove": {
        for (let i = 0; i < cvp.imageDatas.length; i++) {
          if (cvp.imageDatas[i].isVR) {
            let imageData = { ...cvp.imageDatas[i] };
            imageData.tabelRemoveFlag = new Date().getTime();
            cvp.imageDatas.splice(i, 1, { ...imageData });
          }
        }
      }
    }
  },
  resetFn(that, flag = false) {
    const cvp = that.currViewport;
    const canvasNow = cvp.canvasNow;
    const seriesInfo = cvp.seriesInfos[canvasNow];
    const canvasSize = cvp.canvasSize[canvasNow];
    const imageDatas = cvp.imageDatas;

    //重置十字的参数
    let dicAll = CROSS.dicAll;
    for (let i = 0; i < dicAll.length; i++) {
      cvp.AcrossPoint[dicAll[i]] = 0;
    }
    cvp.AcrossPoint.planes = CROSS.initPlanes(seriesInfo);
    cvp.AcrossPoint.isPlaneRotated = false;

    let imageData = { ...imageDatas[canvasNow] };
    if (imageData.isVR) {
      that.resetVR();
      return;
    }

    imageData.rotate = 0;
    let curViewMod = imageData.curViewMod;
    let scale = this.getFullScale(
      canvasSize,
      curViewMod,
      seriesInfo,
      imageData.curImageNum,
    );
    imageData.scale = scale;
    imageData.translate.x = 0;
    imageData.translate.y = 0;
    imageData = CROSS.asyncImageData(imageData, cvp.AcrossPoint, seriesInfo);

    if (seriesInfo.model === "MR" || seriesInfo.isNotUniformSquence) {
      imageData.defaultFlag = true;
      DATA.getOneWLS(imageData, seriesInfo);
    } else {
      imageData.ww = seriesInfo.ww;
      imageData.wl = seriesInfo.wl;
    }
    imageDatas.splice(canvasNow, 1, { ...imageData });

    if (seriesInfo.model === "MR" && cvp.imageDatas.length > 1) {
      for (const imageData of cvp.imageDatas) {
        imageData.defaultFlag = true;
      }
    }

    store.commit("resetMPRTrans");
  },
  updateWWWL(that, ww, wl) {
    const cvp = that.currViewport;
    const { canvasNow, imageDatas } = cvp;
    let imageData = imageDatas[canvasNow];

    imageData = { ...imageData, defaultFlag: false };
    imageData.ww = ww;
    imageData.wl = wl;
    imageDatas.splice(canvasNow, 1, { ...imageData });
  },
  setWWWLByOneKey(that, id) {
    const shortcutsKey = that["shortcutsKey"];
    const idList = ["D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9"];
    const obj = {};
    for (let i = 0; i < idList.length; i++) {
      const id = idList[i];
      const item = { index: i };
      const key = shortcutsKey[id]["key"];
      obj[id] = item;
    }
    if (obj[id]) {
      let ele = that.WindowLevelSetData[obj[id].index];
      if (ele && ele.id && ele.id === id) {
        this.updateWWWL(that, ele.ww, ele.wl);
      }
    }
  },

  //更新面
  changeViewMod(that, canvasNow, curViewMod) {
    let seriesInfo = null,
      imageData = null,
      canvasSize = null;
    const cvp = that.currViewport;
    seriesInfo = cvp.seriesInfos[canvasNow];
    imageData = cvp.imageDatas[canvasNow];
    canvasSize = cvp.canvasSize[canvasNow];
    imageData.curViewMod = curViewMod;
    imageData.rotate = 0;
    imageData.translate.x = 0;
    imageData.translate.y = 0;
    imageData = CROSS.asyncImageData(imageData, cvp.AcrossPoint, seriesInfo);
    cvp.imageDatas.splice(canvasNow, 1, { ...imageData });
  },

  //固定分辨率显示
  getSettingScale(curViewMod, seriesInfo, settingPixelSpacing) {
    let pixelSpacing = seriesInfo.volumeSpacing[curViewMod];
    let scale = { x: 1, y: 1 };
    scale.x = pixelSpacing.w / settingPixelSpacing;
    scale.y = pixelSpacing.h / settingPixelSpacing;
    scale.baseSpacing = settingPixelSpacing;
    scale.baseFactor = 1;
    return scale;
  },

  //全屏显示
  getFullScale(canvasSize, curViewMod, seriesInfo, curImageNum) {
    let scale = { x: 1, y: 1, baseSpacing: 1, baseFactor: 1 };
    let pixelSpacingW, pixelSpacingH, imageWidth, imageHeight;
    if (seriesInfo.isNotUniformSquence) {
      let instances = seriesInfo.instances;
      if (!instances || !instances[curImageNum]) {
        return scale;
      }
      let instance = instances[curImageNum];
      pixelSpacingW = instance.PixelSpacing[1];
      pixelSpacingH = instance.PixelSpacing[0];
      imageWidth = instance.columns;
      imageHeight = instance.rows;
      if (Number.isNaN(imageWidth) || Number.isNaN(imageHeight)) {
        return scale;
      }
    } else {
      imageWidth = seriesInfo.volumeSize[curViewMod].w;
      imageHeight = seriesInfo.volumeSize[curViewMod].h;
      pixelSpacingW = seriesInfo.volumeSpacing[curViewMod].w;
      pixelSpacingH = seriesInfo.volumeSpacing[curViewMod].h;
    }
    let x_y = pixelSpacingW / pixelSpacingH;
    let tempX = canvasSize.width / (imageWidth * x_y);
    let tempY = canvasSize.height / imageHeight;

    if (tempY > tempX) {
      scale.x = tempX * x_y;
      scale.y = tempX;
    } else {
      scale.x = tempY * x_y;
      scale.y = tempY;
    }
    scale.baseSpacing = pixelSpacingH;
    scale.baseFactor = scale.y;
    return scale;
  },
  //新显示屏打开,//默认在主屏打开
  async openScreen(src, name, isPrimary = true) {
    //chrome://flags 开启 #enable-experimental-web-platform-features
    let screens = [window.screen];
    let { availHeight, availLeft, availTop, availWidth } = screens[0];
    let index = 0;
    if (!("getScreens" in self)) {
      console.log("chrome版本不支持该功能");
    } else if ("isMultiScreen" in self && !(await isMultiScreen())) {
      console.log("没有多个显示屏");
    } else {
      let s = (await getScreens().catch((_) => { })) || {
        screens: [window.screen],
      };
      screens = s.screens;
      const permission = await navigator.permissions.query({
        name: "window-placement",
      });
      if (permission.state === "denied") {
        console.log("您禁用了窗口放置权限，请开启使用");
      }

      for (let i = 0; i < screens.length; i++) {
        if (
          screens[i].availHeight != availHeight ||
          screens[i].availLeft != availLeft ||
          screens[i].availTop != availTop ||
          screens[i].availWidth != availWidth
        ) {
          index = i;
          break;
        }
      }
    }
    let screen = screens[index];
    const optionsStr = `
      width=${screen.availWidth},
      height=${screen.availHeight},
      left=${screen.availLeft},
      top=${screen.availTop}
    `;
    window.open(src, name, optionsStr);
  },
  setViewportListBefore(that) {
    that.layoutNumBefore = that.layoutNum;
    that.viewportListBefore = Object.values(that.viewportList).map((item) => {
      return {
        currentSID: item.currentSID,
        gridNum: item.gridNum,
        AcrossPoint: that.$clone(item.AcrossPoint),
        imageDatas: item.imageDatas.map((v) => {
          return {
            ww: v.ww,
            wl: v.wl,
            translate: that.$clone(v.translate),
            scale: that.$clone(v.scale),
            rotate: v.rotate,
            colormapIndex: v.colormapIndex,
            curViewMod: v.curViewMod,
            curImageNum: v.curImageNum,
            imageNum: v.imageNum,
            defaultFlag: v.defaultFlag,
            DWIUID: v.DWIUID,
          };
        }),
      };
    });
  },
};

export default CLICKOPT;
