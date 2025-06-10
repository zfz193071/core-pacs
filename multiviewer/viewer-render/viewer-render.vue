<template>
  <div
    class="render"
    ref="renderEl"
    :style="style"
    @click.stop="changeCanvas"
    @dragover.stop.prevent
    @drop.stop="drop"
  >
    <canvas ref="hideCanvas" class="hideCanvas"></canvas>
    <canvas ref="hideCanvas2" class="hideCanvas"></canvas>
    <canvas
      ref="canvas"
      class="render-canvas"
      :style="{
        width: canvasSize.width + 'px',
        height: canvasSize.height + 'px',
      }"
      :width="canvasSize.width"
      :height="canvasSize.height"
    ></canvas>
    <viewer-vr
      v-if="showVR"
      ref="vr"
      :imgPoor="imgPoor"
      :imageData="imageData"
      :seriesInfo="seriesInfo"
      :canvasSize="vrSize"
      :isVRNow="index === canvasNow"
      :AcrossPoint="AcrossPoint"
      :vtkBlendMod="vtkBlendMod"
      :CPRVoiListData="CPRVoiListData[currentSID]"
      :isInMPR="isInMPR"
      :activeOpt="activeOpt"
      @changeDWIFromVR="changeDWIFromVR"
      @renderError="$emit('renderError')"
      @vrLoaded="currViewport.canvasNow = 0"
    ></viewer-vr>
    <canvas
      ref="canvasforCross"
      :style="{
        width: canvasSize.width + 'px',
        height: canvasSize.height + 'px',
      }"
      :width="canvasSize.width"
      :height="canvasSize.height"
    ></canvas>
    <dicom-info
      :seriesInfo="seriesInfo"
      :imageData="imageData"
      :canvasSize="canvasSize"
      :layoutStr="layoutStr"
      :crossDirection="crossDirection"
      :dicomShow="dicomShow"
      :dicomShowAll="dicomShowAll"
      :dicomStyle="dicomStyle"
      :dicomTempShow="dicomTempShow"
      :showVR="showVR"
      :isInVR="isInVR"
      :isInCPR="isInCPR"
      :isInMPR="isInMPR"
    ></dicom-info>
    <el-checkbox
      v-if="!showVR && showImageStitching && !isAutoLinkout && !isManualLinkout"
      class="stitching-checkbox"
      :value="stitchingThisImage"
    ></el-checkbox>
  </div>
</template>

<script>
import LOAD from "../js/loadImg";
import dicominfo from "../viewer-dicominfo/viewer-dicominfo";
import vr from "../viewer-vr/viewer-vr";
import MARK from "../js/mark";
import CIMG from "../js/cimg";
import CROSS from "../js/crosshair";
import REMARK from "../js/remark";
import { mapMutations, mapState } from "vuex";
export default {
  name: "viewer-render",
  props: {
    isMini: { type: Boolean, default: false },
    currViewportID: { type: String, required: true },
    viewportID: { type: String, required: false },
    viewport: { type: Object, required: false },
    canvasSize: {
      required: true,
      default() {
        return {};
      },
    },
    currViewport: { type: Object, default: () => ({}) },
    imageData: { type: Object, required: true },
    seriesInfo: { type: Object, required: true },
    imgPoor: { type: Object, required: true },
    index: { type: Number, required: true },
    canvasNow: { type: Number, required: true },
    currentSID: { type: String, required: true },
    activeOpt: { type: String, required: true },
    type: { type: String, required: false },
    ieditListData: { required: true },
    CPRVoiListData: { required: true },
    roiShow: { type: Number, required: true },
    posLineShow: { required: true },
    AcrossPoint: {
      default: () => ({}),
    },
    renderDataList: {},
    dicomShow: {},
    dicomShowAll: {},
    dicomStyle: {},
    ieditActive: {},
    ieditIndex: {},
    positionLine: Object,
    pos: Object,
    dicomTempShow: Boolean,
    vtkBlendMod: { type: Number, required: false },
    isInMPR: { type: Boolean, required: false, default: false },
    useCompatibility: { type: Boolean },
    isInCPR: { type: Boolean },
    isInVR: { type: Boolean },
    seriesIdNow: String,
    isAutoLinkout: { type: Boolean, required: true },
    isManualLinkout: { type: Boolean, required: true },
  },
  data() {
    return {
      canvas: null,
      corssCanvas: null,
      canvasCtx: null,
      hideCanvas: null,
      hideCanvas2: null,
      magnifydata: null,
      crossDirection: ["", "", "", ""],
      justReflash: -1,
      CPRVoiReflash: false,
      retryCount: 0,
      retryMaxTimes: 5,
    };
  },
  components: {
    "dicom-info": dicominfo,
    "viewer-vr": vr,
  },
  mounted() {
    this.hideCanvas = this.$refs.hideCanvas;
    this.hideCanvas2 = this.$refs.hideCanvas2;
    this.canvas = this.$refs.canvas;
    this.corssCanvas = this.$refs.canvasforCross;
    this.canvasCtx = this.canvas.getContext("2d", {
      willReadFrequently: true,
    });
    //初始化放大镜
    this.magnifydata = LOAD.getMagnify(this.canvasCtx);
    this.loadImg();
  },
  computed: {
    ...mapState(["imageStitchingList"]),
    style() {
      const canvasSize = this.canvasSize;

      let res = {
        top: canvasSize.top + "px",
        left: canvasSize.left + "px",
        width: canvasSize.width + "px",
        height: canvasSize.height + "px",
        zIndex: canvasSize.zindex,
      };
      return res;
    },
    ieditFlag() {
      return this.ieditActive + this.ieditIndex;
    },
    isCPR() {
      return this.imageData?.isCPR;
    },
    isVR() {
      return this.imageData?.isVR;
    },
    showVR() {
      return (
        (this.isInMPR && !this.useCompatibility) || this.isCPR || this.isVR
      );
    },

    //响应数据源或者窗宽窗位变化
    needLoad() {
      let {
        DWIUID, //更新用于刷新的唯一ID
        ww,
        wl,
        colormapIndex,
        isInMPR,
      } = this.imageData;
      let uuid = this.seriesInfo?.timestampUid;
      //这个做法会导致移动的十字的时候，当前canvas也被刷新，重新load一次数据
      let str = `${DWIUID}
        ${ww}${wl}${colormapIndex}${isInMPR}${this.showVR}${uuid}`;
      let res = this.$md5(str);
      return res;
    },

    //响应数据不变，但是数据显示方式的变化
    needReflash() {
      let { translate, scale, rotate, magnifyPoint } = this.imageData;
      let { ieditFlag, roiShow } = this;
      let canvasSize = JSON.stringify(this.canvasSize);
      let trans = JSON.stringify(translate);
      let sc =
        JSON.stringify(scale.x) +
        JSON.stringify(scale.y) +
        JSON.stringify(scale.baseSpacing) +
        JSON.stringify(scale.baseFactor);
      let rot = JSON.stringify(rotate);
      let mag = JSON.stringify(magnifyPoint);
      //这里需要根据十字定位的变化来刷新
      let { curViewMod, forcePosLineReflash } = this.AcrossPoint;
      let needCrossReflash = `${this.activeOpt}${curViewMod}${forcePosLineReflash}${this.posLineShow}${this.currViewportID}${this.currViewport.canvasNow}`;
      let str = `canvasSize:${canvasSize}trans:${trans}sc:${sc}rot:${rot}mag:${mag}roiShow:${roiShow}ieditFlag:${ieditFlag}justReflash:${this.justReflash}needCrossReflash:${needCrossReflash}showVR:${this.showVR}`;
      let res = this.$md5(str);
      return res;
    },
    vrSize() {
      let { width, height } = this.canvasSize;
      width = Math.floor(width / 2) * 2;
      height = Math.floor(height / 2) * 2;
      return { width, height };
    },
    layoutStr() {
      return `${this.canvasSize.width}/${this.canvasSize.height}`;
    },
    // 是否显示图像拼接勾选框
    showImageStitching() {
      const enableImageStitching = localStorage.getItem("enableImageStitching");
      return enableImageStitching === "true";
    },
    //图像张数
    imageNum() {
      let { curImageNum, imageNum, curViewMod } = this.imageData;
      if (curImageNum === undefined || imageNum === undefined || this.showVR)
        return "";
      let showCur = curImageNum;
      let { volumeSpacing } = this.seriesInfo;
      if (volumeSpacing) {
        let { d: dp, thickness } = volumeSpacing[curViewMod];
        let dimStep = Number((thickness / dp).toFixed(2));
        showCur = Math.floor(curImageNum / dimStep);
      }
      return showCur;
    },
    // 当前图像是否拼接
    stitchingThisImage() {
      const stitchingId = `${this.seriesInfo.currentSID}-${this.imageData.curViewMod}-${this.imageNum}`;
      return this.imageStitchingList
        .map((v) => v.stitchingId)
        .includes(stitchingId);
    },
  },
  methods: {
    ...mapMutations(["setImageStitching"]),
    //获取orgObj的入口
    loadImg() {
      let { currentSID } = this.seriesInfo;
      let { curViewMod, curImageNum } = this.imageData;
      //在这里中断了原本render的getDWI流程
      if (this.showVR) return;

      try {
        let poorObj = this.imgPoor[currentSID];
        if (
          !this.imageData.dataWithInfo ||
          !this.imageData.dataWithInfo.DWIUID ||
          this.imageData.dataWithInfo.DWIUID != this.imageData.DWIUID
        ) {
          //这里不传loadSource，进入之后自行选择
          this.imageData.dataWithInfo = LOAD.getDataWithInfo(
            poorObj,
            this.seriesInfo,
            curViewMod,
            curImageNum,
            this.imageData.DWIUID,
            this.AcrossPoint,
          );
        }
        let origBuf = this.imageData.dataWithInfo.origBuf;
        console.log("loadImg", this.viewportID, curImageNum, origBuf);
        if (origBuf === null || origBuf === undefined) {
          this.imageData.dataWithInfo = {};
          throw "data not loading";
        }
      } catch (error) {
        //进到这里一定是原始截面没有下下来
        console.log(
          `waiting for loading:${curImageNum} of ${currentSID},mode:${curViewMod}`,
        );
        this.$emit("forceLoadImg", curImageNum, this.seriesInfo);
        if (!isNaN(curImageNum)) {
          //   500毫秒之后再试
          setTimeout(() => {
            this.loadImg();
          }, 500);
          return;
        } else {
          console.log(`loading error:${curImageNum}`);
          return;
        }
      }
      this.updateImg(this.imageData.dataWithInfo);
      this.setDirection();
    },

    //新增函数，用于适应加载不同的类型的数据之后，scale的倍率需要改变
    asyncScale(dataWithInfo) {
      let { pixelSpacingW, pixelSpacingH } = dataWithInfo;
      let { baseSpacing, baseFactor, x, y } = this.imageData.scale;
      if (!pixelSpacingH || !pixelSpacingW || !baseSpacing || !baseFactor)
        return false;
      let a = Math.round((10000 * Math.abs(x)) / pixelSpacingW);
      let b = Math.round((10000 * Math.abs(y)) / pixelSpacingH);
      let c = Math.round((10000 * baseFactor) / baseSpacing);
      if (a === c && b === c) return false;
      let signX = Math.sign(x) || 1;
      let signY = Math.sign(y) || 1;

      let scaleNew = { ...this.imageData.scale };
      scaleNew.x = (signX * (baseFactor * pixelSpacingW)) / baseSpacing;
      scaleNew.y = (signY * (baseFactor * pixelSpacingH)) / baseSpacing;
      this.imageData.scale = scaleNew;
      return true;
    },

    //更新img的数据，img是一个canvas对象，保存的是调窗和伪彩之后的结果
    updateImg() {
      let { colormapIndex, ww, wl, dataWithInfo } = this.imageData;
      console.log(this.imageData, this.index, "updateImg");
      let renderData;
      let { origBuf, DWIUID } = dataWithInfo;
      if (!ww) {
        ww = origBuf.max - origBuf.min;
        this.imageData.ww = origBuf.max - origBuf.min;
        wl = (origBuf.max + origBuf.min) * 0.5;
        this.imageData.wl = (origBuf.max + origBuf.min) * 0.5;
      }
      if (origBuf.isColor || origBuf.colorSpace) {
        //是彩图
        renderData = origBuf;
        // 彩图挂载overlays
        let hasOverLay = renderData.overlays && renderData.overlays.length > 0;
        if (hasOverLay) CIMG.setColorRenderDataOverlays(renderData);
        if (!this.imageData.img) {
          this.imageData.img = document.createElement("canvas");
        }
        this.imageData.img.width = renderData.width;
        this.imageData.img.height = renderData.height;
        let ctx = this.imageData.img.getContext("2d");
        ctx.putImageData(
          new ImageData(renderData.data, renderData.width, renderData.height),
          0,
          0,
        );
      } else {
        let tagScale = { x: this.imageData.scale.x, y: this.imageData.scale.y };
        this.imageData.img = CIMG.getRenderCImg(
          origBuf,
          colormapIndex,
          ww,
          wl,
          tagScale,
          this.imageData.img,
        );
      }
      this.imageData.img.DWIUID = DWIUID;
      this.justReflash++;
    },
    // 更新CPR的二维标注，先删掉原有标注，再根据CPR三维点位重新添加二维标注
    reflashCPRRoiList() {
      let ieditListData = this.ieditListData[this.seriesInfo.currentSID] || [];
      let cprVoiListData =
        this.CPRVoiListData?.[this.seriesInfo.currentSID] || [];

      let index = ieditListData?.findIndex(
        (item) =>
          item.curViewMod === this.imageData.curViewMod &&
          item.type === "CPRPoint",
      );
      let cprObj;
      if (index > -1) {
        cprObj = ieditListData.splice(index, 1)[0];
      }
      if (cprVoiListData.length && this.CPRVoiReflash) {
        // 创建curViewMod的新CPR标注
        if (cprObj) {
          cprObj = {
            ...cprObj,
            curViewMod: this.imageData.curViewMod,
            DWIUID: this.imageData.DWIUID,
            ID: Date.now().toString(36) + this.imageData.curViewMod.toString(),
            editPointList: [],
          };
        } else {
          cprObj = {
            type: "CPRPoint",
            curViewMod: this.imageData.curViewMod,
            DWIUID: this.imageData.DWIUID,
            model: this.seriesInfo.model,
            posFlag: false,
            // 确保ID唯一
            ID: Date.now().toString(36) + this.imageData.curViewMod.toString(),
            date: this.$getTime(),
            editPointList: [],
            curveLinePointList: [],
          };
        }
        cprVoiListData.forEach((crossPoint) => {
          // 将保存的CPR三维点位转成二维渲染
          let point = REMARK.CPRTransPointToCanvas(crossPoint, this);
          // point = REMARK.imgToCanvas(point, this);
          cprObj.editPointList.push(point);
        });
        ieditListData.push(cprObj);
      }
      this.CPRVoiReflash = true;

      return ieditListData;
    },
    //调用ctxDrawImage渲染图像到render上，还需要渲染标注和放大镜
    reflashImg() {
      let {
        img,
        scale,
        translate,
        rotate,
        magnifyPoint,
        colormapIndex,
        dataWithInfo,
        DWIUID,
      } = this.imageData;
      let seriesInfo = this.seriesInfo;

      //这里需要核对数据的分辨率信息,如果改变了，会更新scale，触发另一次reflash，因此此处不需要刷新
      if (this.asyncScale(dataWithInfo)) return;

      console.time(`reflashImg  ${this.viewportID}  ${this.index}`);

      //获取画布
      let ctx = this.canvasCtx;

      //MIP图像和MPR层厚调整过的图像，不需要渲染
      if (!this.showVR) {
        //这里需要核对数据是否可以用于渲染，如果没有创建成功，不能往下走
        if (!img) {
          console.log("image is not prepared");
          this.loadImg();
          return;
        }

        if (img.DWIUID != DWIUID) {
          console.log(
            `reflashImg ${this.index} DWIUID is updated`,
            img.DWIUID,
            DWIUID,
          );
          this.loadImg();
          return;
        }

        // 清空画布，并填充背景颜色
        let color = "#000";
        const isNMImage = this.$isNMImage(seriesInfo.model);
        if (colormapIndex === "B&W Inverse" && isNMImage) color = "#fff";
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        console.log(
          this.canvas.width,
          this.canvas.height,
          scale,
          this.index,
          "reflashimg",
        );
        //在这里渲染图片
        this.ctxDrawImage(
          ctx,
          img,
          scale,
          rotate,
          translate,
          this.canvas.width,
          this.canvas.height,
        );
        //在这里渲染放大镜（融合图像没有做处理）
        if (magnifyPoint.x > 0 && magnifyPoint.y > 0) {
          let buf = dataWithInfo.origBuf.data;
          LOAD.drawMagnify(
            magnifyPoint.x,
            magnifyPoint.y,
            ctx,
            this.magnifydata,
            this.imageData,
            this.canvasSize,
            buf,
            this,
          );
        }
      } else {
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }

      let ieditListData = this.ieditListData[seriesInfo.currentSID] || [];
      // let cprVoiListData = this.CPRVoiListData?.[seriesInfo.currentSID] || [];

      //此处删除了VOI的功能

      if (this.isInCPR && !this.isCPR) {
        // 如果处于查找状态，不要走删除再新建的流程
        if (!this.ieditActive) {
          ieditListData = this.reflashCPRRoiList();
        }
        // 进入这个判断，是因为在首尾添加CPR点位，ieditActive不为空
        // 其他viewport进行CPR标注同步，当前的viewPort不要刷新
        else if (this.canvasNow !== this.index) {
          ieditListData = this.reflashCPRRoiList();
        }
      }

      //这里渲染标注
      if (this.roiShow > -1 && ieditListData && !this.isCPR) {
        let listData = ieditListData.filter((res) => {
          return (
            res.curViewMod === this.imageData.curViewMod &&
            CROSS.isSameIndex(this.imageData.DWIUID, res.DWIUID) &&
            res?.isFromVTKClip === this.imageData.dataWithInfo?.isFromVTKClip
          );
        });

        for (var i = 0; i < listData.length; i++) {
          let flag =
            listData[i].ID === this.ieditActive &&
            this.index === this.canvasNow;
          MARK.markObjReflash(
            listData[i],
            this.canvas,
            this.imageData.translate,
            this.imageData.rotate,
            this.imageData.scale,
            this.canvas.width,
            this.canvas.height,
            img.width,
            img.height,
            seriesInfo.currentSID,
            flag && this.ieditIndex > -1,
            flag ? this.ieditIndex : null,
          );
        }
      }

      //这里渲染十字和定位线，未来为了优化性能，可以考虑移到外面单独刷新
      if (!this.isCPR && !this.isVR) this.loadCrossImg();
      console.timeEnd(`reflashImg  ${this.viewportID}  ${this.index}`);
    },
    //在canvas上画图，图片是已经存好的canvas对象，注意有可能是缩放过的
    ctxDrawImage(
      canvasEle_ctx,
      image,
      scale,
      rotate,
      translate,
      canvasWidth,
      canvasHeight,
    ) {
      let scaleCur = { ...scale },
        imageCur = image;
      //允许图像在调窗之后做一个缩放
      let { ifInterPro, interCImg } = image;
      //允许图像在调窗之后做一个缩放
      if (ifInterPro && interCImg) {
        let scale_self = {
          x: interCImg.width / image.width,
          y: interCImg.height / image.height,
        };
        scaleCur.x = scale.x / scale_self.x;
        scaleCur.y = scale.y / scale_self.y;
        imageCur = interCImg;
      }
      //旋转平移缩放
      canvasEle_ctx.save();
      canvasEle_ctx.scale(scaleCur.x, scaleCur.y);
      // 平移到中心点
      let tempX =
        (canvasWidth / 2 + translate.x) / scaleCur.x - imageCur.width / 2;
      let tempY =
        (canvasHeight / 2 + translate.y) / scaleCur.y - imageCur.height / 2;
      canvasEle_ctx.translate(tempX, tempY);
      // 最后做旋转
      canvasEle_ctx.translate(imageCur.width / 2, imageCur.height / 2);
      canvasEle_ctx.scale(1 / scaleCur.x, 1 / scaleCur.y);
      canvasEle_ctx.rotate(rotate);
      canvasEle_ctx.scale(scaleCur.x, scaleCur.y);
      canvasEle_ctx.translate(-imageCur.width / 2, -imageCur.height / 2);

      canvasEle_ctx.drawImage(imageCur, 0, 0);
      canvasEle_ctx.restore();
    },

    //渲染定位的十字线到render上,这一步是单独刷新的，有可能只刷新十字，不刷新后面渲染的图像
    reflashCross() {
      let ctx = this.corssCanvas.getContext("2d");
      ctx.clearRect(0, 0, this.corssCanvas.width, this.corssCanvas.height);
      //画定位线
      this.drawPos(ctx);

      //画十字
      this.drawCross(ctx);

      //画方块颜色标记
      this.drawMarkButton(ctx);
    },

    //更新canvasNow
    changeCanvas() {
      this.$emit("update:canvasNow", this.index);
      let currentSID = this.seriesInfo.currentSID;
      this.$emit("updateCurrViewportID", {
        viewportID: this.viewportID,
        currentSID,
        canvasNow: this.index,
      });
      // 兼容模式下，currSID改变时需要手动触发一下loadImg
      const useCompatibility =
        localStorage.getItem("useCompatibility") === "true";
      // 如果开了兼容模式或者是低配设备，只加载当前的序列
      if (useCompatibility || this.$store.state.isLowerConfigureDevice) {
        this.$nextTick(() => {
          this.loadImg();
        });
      }
    },
    //下载图像
    savePNG() {
      let tempsaveimage = this.canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      let save_link = document.createElementNS(
        "http://www.w3.org/1999/xhtml",
        "a",
      );
      save_link.href = tempsaveimage;
      save_link.download = "save.png";
      let event = document.createEvent("MouseEvents");
      event.initMouseEvent(
        "click",
        true,
        false,
        window,
        0,
        0,
        0,
        0,
        0,
        false,
        false,
        false,
        false,
        0,
        null,
      );
      save_link.dispatchEvent(event);
    },
    //算尺度 和方位
    setDirection() {
      let imageDirection = [
        {
          directionMap: { row: ["R", "L"], column: ["A", "P"] }, //横断面
        },
        {
          directionMap: { row: ["R", "L"], column: ["S", " I"] }, //冠状面
        },
        {
          directionMap: { row: ["A", "P"], column: ["S", " I"] }, //矢状面
        },
      ];
      let { dataWithInfo, rotate, scale } = this.imageData;
      let imgorient = dataWithInfo?.imgorient;

      if (!imgorient) return;
      let imageViewMode = CROSS.axisToViewMode(imgorient);
      let directionMap = imageDirection[imageViewMode].directionMap;

      //这个部分为临时修复24年7月25日遂川县人民医院MR2407240003患者磁共振检查上下左右标反的问题，之后需要重构
      if (imageViewMode === 0) {
        if (imgorient[0][0] < 0) {
          directionMap.row = ["L", "R"];
        }
        if (imgorient[1][1] < 0) {
          directionMap.column = ["P", "A"];
        }
      }
      if (imageViewMode === 1) {
        if (imgorient[0][0] < 0) {
          directionMap.row = ["L", "R"];
        }
        if (imgorient[1][2] > 0) {
          directionMap.column = ["I", "S"];
        }
      }
      if (imageViewMode === 2) {
        if (imgorient[0][1] < 0) {
          directionMap.row = ["P", "A"];
        }
        if (imgorient[1][2] > 0) {
          directionMap.column = ["I", "S"];
        }
      }

      //应用缩放对标识的影响
      let r = ((rotate * 180) / Math.PI) % 360;
      if (r < 0) r = 360 + r;

      let a, b, c, d;
      let Arr = [];
      if (scale.y < 0 && scale.x < 0) {
        a = directionMap.column[1];
        b = directionMap.row[0];
        c = directionMap.column[0];
        d = directionMap.row[1];
      } else if (scale.x < 0) {
        a = directionMap.column[0];
        b = directionMap.row[0];
        c = directionMap.column[1];
        d = directionMap.row[1];
      } else if (scale.y < 0) {
        a = directionMap.column[1];
        b = directionMap.row[1];
        c = directionMap.column[0];
        d = directionMap.row[0];
      } else {
        a = directionMap.column[0];
        b = directionMap.row[1];
        c = directionMap.column[1];
        d = directionMap.row[0];
      }

      //应用旋转对标识的影响
      if ((0 <= r && r <= 45) || (315 < r && r <= 360)) {
        Arr[0] = a;
        Arr[1] = b;
        Arr[2] = c;
        Arr[3] = d;
      } else if (45 < r && r <= 135) {
        Arr[0] = d;
        Arr[1] = a;
        Arr[2] = b;
        Arr[3] = c;
      } else if (135 < r && r <= 225) {
        Arr[0] = c;
        Arr[1] = d;
        Arr[2] = a;
        Arr[3] = b;
      } else {
        Arr[0] = b;
        Arr[1] = c;
        Arr[2] = d;
        Arr[3] = a;
      }
      this.crossDirection = Arr;
    },
    //定位线
    drawPos(ctx) {
      if (!this.posLineShow || this.seriesInfo.isMissInfo || this.isInMPR)
        return;

      CROSS.drawPosLine(
        ctx,
        this.imageData,
        this.seriesInfo,
        this.canvasSize,
        this.currViewport,
      );
    },

    //方块颜色标记
    drawMarkButton(ctx) {
      if (
        !this.seriesInfo.isMissInfo &&
        (this.posLineShow || this.activeOpt == "ACross")
      ) {
        //增加当前视图的颜色标记
        let viewMod = CROSS.axisToViewMode(
          this.imageData.dataWithInfo.imgorient,
        );
        //MRR模式下的十字的颜色始终是固定的
        if (this.isInMPR) viewMod = this.imageData.curViewMod;
        let color = CROSS.getMarkButtonColor(viewMod);
        ctx.fillStyle = color;
        let margin = 10,
          len = 15;
        ctx.fillRect(
          this.canvasSize.width - (margin + len),
          this.canvasSize.height - (margin + len),
          len,
          len,
        );
      }
    },

    //不管当前的交互是什么，都一定计算十字定位的图像
    loadCrossImg() {
      this.imageData.crossPos = CROSS.getCrossPosOnImg(
        this.imageData,
        this.AcrossPoint,
      );
      this.reflashCross();
    },
    //十字定位
    drawCross(ctx) {
      if (this.activeOpt !== "ACross" || this.seriesInfo.isMissInfo) return;
      //当前viewport的十字没有被同步，不刷新
      if (this.isAPNotSync()) return;
      let { crossPos } = this.imageData;
      if (crossPos) {
        CROSS.drawCross(ctx, this.imageData, this.canvasSize, this.isInMPR);
      }
    },
    isAPNotSync() {
      let flag = false;
      if (this.currViewportID !== this.viewportID) {
        let { AcrossPoint: APCur } = this.currViewport;
        let { AcrossPoint: AP } = this.viewport;
        if (AP && APCur) {
          if (
            Math.round(AP.x * 10 - APCur.x * 10) !== 0 ||
            Math.round(AP.y * 10 - APCur.y * 10) !== 0 ||
            Math.round(AP.z * 10 - APCur.z * 10) !== 0
          ) {
            flag = true;
          }
        }
      }
      return flag;
    },

    //DWI被VR组件更新了
    changeDWIFromVR() {
      console.log("update DWI from VR", this.index);
      //此处更新用于刷新的img
      //在这里重新启动loadImg之后的流程
      this.updateImg(this.imageData.dataWithInfo);
    },

    drop(event) {
      if (this.isMini) return;

      const series = JSON.parse(event.dataTransfer.getData("series"));
      const viewport = this.viewport;
      const currModality = viewport.seriesInfos[viewport.canvasNow]["model"];

      const canvasNow = this.index;
      const viewportID = this.viewportID;
      this.$emit("dropSeries", {
        canvasNow,
        currentSID: series.seriesId,
        viewportID,
      });
    },
  },
  watch: {
    needLoad() {
      console.log("needload");
      this.loadImg();
      if (
        this.ieditListData[this.currentSID] &&
        !this.ieditListData[this.currentSID].find(
          (item) =>
            item.type === "CPRPoint" &&
            item.curViewMod === this.imageData.curViewMod,
        ) &&
        !this.ieditActive
      )
        this.CPRVoiReflash = false;
    },
    CPRVoiListData: {
      handler(val) {
        if (val[this.currentSID]) {
          if (this.canvasNow !== this.index) {
            this.reflashImg();
          }
        }
      },
      deep: true,
    },
    needReflash() {
      if (this.isVR) return;
      this.$nextTick(() => {
        this.reflashImg();
      });
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./viewer-render.scss";
</style>
