<!--
  智能画笔 "Pen"
  圆 "Circle"
  方形 "Rect"
  曲线 "CurveLine"
  箭头  "Arrow"
  角度 "Angle"
  尺子  "Ruler"
  文本  "Text"
  像素值 "Point"
  橡皮擦 "Rubber"
 -->
<template>
  <div
    id="editWrapper"
    :style="style"
    v-show="roiStatus && !imageData.isCPR"
    ref="iedit"
    @dragover.stop.prevent
    @drop.stop="drop"
  >
    <div
      class="pen-crop-mask"
      ref="penCropMask"
      v-show="activeOpt === 'PenCrop'"
    ></div>
    <div class="crop-confirm-mask" v-show="showCropConfirm">
      <div class="confirm-bar">
        <div>{{ $t("crop") }}</div>
        <div class="btn-wrapper">
          <button
            class="btn-cancel"
            @click.stop="cancelCrop"
            @mousedown.stop
            @mouseup.stop
          ></button>
          <button
            class="btn-confirm"
            @click.stop="confirmCrop"
            @mousedown.stop
            @mouseup.stop
          ></button>
        </div>
      </div>
    </div>
    <textarea
      ref="textArea"
      class="canvasInput"
      @mouseup.stop.prevent
      v-model="editMarkStore.text"
      :placeholder="$t('annotation')"
      :class="[
        labelStatus == 'Text' && editExistRoi
          ? 'canvasInputShow'
          : 'canvasInputHide',
      ]"
      :style="{
        top: textAreaTop + 'px',
        left: textAreaLeft + 'px',
        width: textAreaWidth + 'px',
        height: textAreaHeight + 'px',
      }"
      maxlength="40"
    ></textarea>
    <svg
      v-show="activeOpt == 'Pen' || isVR"
      :width="canvasSize.width"
      :height="canvasSize.height"
      id="SVGM_SVG"
      ref="SVGM_SVG"
      :style="{
        width: canvasSize.width + 'px',
        height: canvasSize.height + 'px',
      }"
    >
      <polygon
        style="
          fill: rgba(22, 255, 255, 0.1);
          stroke: rgba(22, 255, 255, 1);
          stroke-width: 1;
          fill-rule: evenodd;
        "
        ref="SVGM_Polygon"
      />
    </svg>
    <canvas
      :width="canvasSize.width"
      :height="canvasSize.height"
      :class="{
        penCursor: activeOpt == 'Pen',
        roundCursor: activeOpt == 'Circle' || activeOpt == 'VOI_Circle',
        rectCursor: activeOpt == 'Rect' || activeOpt == 'VOI_Rect',
        curveLineCursor: activeOpt == 'CurveLine',
        curveRulerCursor: activeOpt == 'CurveRuler',
        arrowCursor: activeOpt == 'Arrow',
        angleCursor: activeOpt == 'Angle',
        rulerCursor: activeOpt == 'Ruler',
        textCursor: activeOpt == 'Text',
        rubberCursor: activeOpt == 'Rubber',
        suvCursor: activeOpt == 'Point',
      }"
      id="main"
      ref="canvas"
    ></canvas>
    <canvas class="hide" ref="tempCanvas"></canvas>
  </div>
</template>
<script>
import LANG from "../../../assets/js/lang.js";
import REMARK from "../js/remark.js";
import DATA from "../js/data.js";
import FIND from "../js/find";
import bus from "@/assets/js/bus.js";

export default {
  name: "viewer-iedit",
  props: {
    canvasSize: {
      type: Object,
      required: true,
      default: () => {
        return { left: 0, top: 0, width: 4, height: 4 };
      },
    },
    viewportSize: {
      required: true,
      default: () => ({ left: 0, top: 0, width: 4, height: 4 }),
    },
    seriesInfo: { required: true },
    activeOpt: { type: String, required: true },
    canvasNow: { required: true, default: 0 },
    ieditListData: { required: true, default: () => ({}) },
    CPRVoiListData: { required: true, default: () => ({}) },
    imageData: { required: true },
    imgPoor: { type: Object, required: true },
    roiStatus: { required: true },
    ieditActive: {},
    iediting: {},
    aiAnalysisResult: Object,
    aiRemarkList: Array,
    hiddenIDList: Array,
    currViewport: {
      type: Object,
      required: false,
    },
  },
  data() {
    return {
      LANG,
      /*画标注时存入的坐标点*/
      editMarkStore: {},
      /*当前是否是标注状态*/
      // roiStatus: true,
      /*当前实例的canvas*/
      canvas: null,
      canvas2d: null,
      tempCanvas: null,
      tempCanvas2d: null,
      SVGM_Polygon: null,

      startDraw: false,
      editExistRoi: false /*编辑层是否存在标注*/,
      findRoiPointName: null /*查找到的控制点名称*/,

      /*标注颜色列表*/
      color: "rgba(24,200,210,1)",

      /*鼠标按下和放开时坐标点*/
      ieditTempPoint: { x: 0, y: 0 },

      /*text的大小位置*/
      textAreaTop: 0,
      textAreaLeft: 0,
      textAreaWidth: 150,
      textAreaHeight: 150,
      infoRangeDic: {
        Pen: { width: 130, height: 85 }, //画笔
        Circle: { width: 130, height: 85 }, //圆
        Rect: { width: 130, height: 85 }, //矩形
        Merge: { width: 130, height: 85 },
        Angle: { width: 120, height: 30 }, //角度
        Ruler: { width: 120, height: 30 }, //尺子
        CurveRuler: { width: 120, height: 30 }, //曲线测量尺子
        HeartChest: { width: 140, height: 40 }, //尺子
        COBAngle: { width: 140, height: 40 }, //尺子
        Point: { width: 120, height: 30 }, //像素值
      },
      labelStatus: null,
      showCropConfirm: false,
      cropConfirmPosition: { x: 0, y: 0 },
    };
  },
  computed: {
    style() {
      let { top, left, width, height, zindex } = this.canvasSize;
      const { top: vpTop, left: vpLeft } = this.viewportSize;
      let res = {
        top: top + "px",
        left: left + "px",
        width: width + "px",
        height: height + "px",
        // "z-index": zindex,
      };
      return res;
    },
    pixelSpacingOnCanvas() {
      let { curViewMod } = this.imageData;
      let { volumeSpacing } = this.seriesInfo;

      return volumeSpacing[curViewMod].w; //像素点一定是正方形的，毫米分分辨率长宽相同
    },

    /**
     * AI标注初始化条件
     * @return {{imageData: boolean, aiRemarkList: boolean}}
     */
    aiInitFilter() {
      const existimageData = Boolean(this.imageData);
      const existAiRemarkList = Boolean(this.aiRemarkList);
      return {
        imageData: existimageData,
        aiRemarkList: existAiRemarkList,
      };
    },
    isVR() {
      return this.imageData?.isVR;
    },
  },

  created() {
    const unwatch = this.$watch("aiInitFilter", () => {
      if (!this.aiInitFilter.imageData || !this.aiInitFilter.aiRemarkList) {
        return;
      }
      this.initAimark();
      unwatch();
    });

    let penCropFlag = false;
    const _this = this;
    this.penCropMousedownListener = function (e) {
      if (_this.activeOpt === "PenCrop" && e.button === 0) {
        REMARK.SVGMARK._SVGEle = _this.$refs.SVGM_SVG;
        penCropFlag = true;
      }
    };

    this.penCropMousemoveListener = function (e) {
      if (penCropFlag) {
        const point = {
          x: e.offsetX,
          y: e.offsetY,
        };
        REMARK.SVGMARK._polyPointListCanvas.push(point);
        REMARK.SVGMARK.reflashSVG();
      }
    };

    this.penCropMouseupListener = function (e) {
      const len = REMARK.SVGMARK._polyPointListCanvas.length;
      penCropFlag = false;
      if (len < 5) return;
      _this.$store.commit(
        "setVRPenCropPointList",
        REMARK.SVGMARK._polyPointListCanvas,
      );
      _this.showCropConfirm = true;
      console.log("setVRPenCropPoint", REMARK.SVGMARK._polyPointListCanvas);
    };
  },

  mounted() {
    this.canvas = this.$refs.canvas;
    this.canvas2d = this.canvas.getContext("2d");
    this.tempCanvas = this.$refs.tempCanvas;
    this.SVGM_Polygon = this.$refs.SVGM_Polygon;
    this.SVGM_SVG = this.$refs.SVGM_SVG;
    this.tempCanvas2d = this.tempCanvas.getContext("2d");
    REMARK.addEditMouseEvent(this);

    this.$refs.penCropMask.addEventListener(
      "mousedown",
      this.penCropMousedownListener,
    );
    this.$refs.penCropMask.addEventListener(
      "mousemove",
      this.penCropMousemoveListener,
    );
    this.$refs.penCropMask.addEventListener(
      "mouseup",
      this.penCropMouseupListener,
    );
  },

  beforeDestroy() {
    REMARK.removeEditMouseEvent(this);
    this.$refs.penCropMask.removeEventListener(
      "mousedown",
      this.penCropMousedownListener,
    );
    this.$refs.penCropMask.removeEventListener(
      "mousemove",
      this.penCropMousemoveListener,
    );
    this.$refs.penCropMask.removeEventListener(
      "mouseup",
      this.penCropMouseupListener,
    );
  },
  methods: {
    /*给不同标注注册事件*/
    registMarkTool(labelStatus) {
      if (!this.ieditActive) this.clearIeditPara();
      switch (labelStatus) {
        case "VOI_Circle":
          REMARK.registVOICircle(this);
          break;
        case "VOI_Rect":
          REMARK.registVOIRect(this);
          break;
        case "Pen":
          REMARK.registPen(this);
          break;
        case "Circle":
          REMARK.registCircle(this);
          break;
        case "Rect":
          REMARK.registRect(this);
          break;
        case "CurveLine":
          REMARK.registCurveLine(this);
          break;
        case "CurveRuler":
          REMARK.registCurveRuler(this);
          break;
        case "Arrow":
          REMARK.registArrow(this);
          break;
        case "Angle":
          REMARK.registAngle(this);
          break;
        case "Ruler":
          REMARK.registRuler(this);
          break;
        case "Text":
          REMARK.registText(this);
          break;
        case "Rubber":
          REMARK.registRubber(this);
          break;
        case "Point":
          REMARK.registPoint(this);
          break;
        case "CPRPoint":
          REMARK.registCPRPoint(this);
          break;
        case "HeartChest":
          REMARK.registHeartChest(this);
          break;
        case "COBAngle":
          REMARK.registCOBAngle(this);
          break;
      }
    },

    getCropConfirmPosition(x, y) {
      if (x + 235 > this.canvasSize.width) {
        x = this.canvasSize.width - 235;
      } else if (y + 40 > this.canvasSize.height) {
        y = this.canvasSize.height - 40;
      }
      return { x, y };
    },
    clearSVGMark() {
      REMARK.SVGMARK.clearAll();
      REMARK.SVGMARK._SVGEle = null;
    },
    confirmCrop() {
      this.showCropConfirm = false;
      this.clearSVGMark();
      bus.$emit("confirmPenCrop");
      this.$emit("update:activeOpt", "Rotate");
    },
    cancelCrop() {
      this.showCropConfirm = false;
      this.clearSVGMark();
      // bus.$emit("cancelPenCrop");
    },

    /*清空当前iedit参数*/
    clearIeditPara() {
      this.editExistRoi = false;
      this.startDraw = false;
      this.editMarkStore = {
        type: 0,
        editPointList: [],
        curveLinePointList: [],
        textArray: [],
        text: "",
        img: null,
        imgData: null,
      };
      this.canvas2d.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.tempCanvas2d.clearRect(
        0,
        0,
        this.tempCanvas.width,
        this.tempCanvas.height,
      );
      REMARK.SVGMARK.clearAll();
    },
    /*确定*/
    async iSure(editMarkStore, seriesInfo, imageData) {
      if (this.verifyPoint(editMarkStore)) return;
      let temp = { ...editMarkStore };
      temp.name = temp.name ? temp.name : "";
      temp.date = temp.date ? temp.date : this.$getTime();
      temp.ID = temp.ID ? temp.ID : Date.now().toString(36);
      let isFromVTKClip = this.imageData.dataWithInfo?.isFromVTKClip;
      temp.isFromVTKClip = isFromVTKClip;
      //本来在这里对融合图像的标注单独做了处理，但本版本不需要
      temp = await this.saveEditMark(temp, seriesInfo);
      return temp;
    },
    //对点进行验证 无效点不存储
    verifyPoint(editMarkStore) {
      let { type, editPointList, curveLinePointList, text, polyPointList } =
        editMarkStore;
      let res = false;
      switch (type) {
        case "Pen": {
          if (!polyPointList || polyPointList.length < 4) {
            res = true;
          }
          break;
        }
        case "Text": {
          if (!text) res = true;
          break;
        }
        case "Rect":
        case "Circle":
        case "Ruler":
        case "Arrow":
        case "Angle": {
          for (let i = 0; i < editPointList.length; i++) {
            if (res) break;
            for (let j = 0; j < editPointList.length; j++) {
              if (i === j) break;
              let point1 = editPointList[i];
              let point2 = editPointList[j];
              if (point1.x === point2.x && point1.y === point2.y) {
                res = true;
              }
            }
          }
          break;
        }
        case "CurveLine": {
          if (curveLinePointList.length < 2) res = true;
          break;
        }
        default:
          break;
      }
      if (res) this.clearIeditPara();
      return res;
    },

    //保存标注
    async saveEditMark(temp, seriesInfo) {
      //保存二维标注
      let currentSID = seriesInfo.currentSID;

      temp.imgData = null;
      // 每次保存CPR点位的时候，移除掉这个属性
      if (temp.CPRContinue) delete temp.CPRContinue;
      let arr = { ...this.ieditListData };
      if (!arr[currentSID]) {
        arr[currentSID] = new Array();
      }
      let index = arr[currentSID].findIndex((item) => item.ID === temp.ID);
      if (index > -1) {
        arr[currentSID][index] = temp;
      } else {
        arr[currentSID].push(temp);
      }
      console.log(arr, temp, "iedit 保存标注");
      this.$emit("update:ieditListData", arr);
      this.$emit("saveMarks", currentSID);
      this.clearIeditPara();
      this.$emit("updateRoi", this.clearIeditPara);
      setTimeout(() => {
        this.$emit("update:ieditActive", null);
      });
      return temp;
    },

    /*添加角度信息*/
    addAngleInfo(editMarkStore) {
      editMarkStore.infoWidth = this.infoRangeDic["Angle"].width;
      editMarkStore.infoHeight = this.infoRangeDic["Angle"].height;
      let [point1, point2, point3] = editMarkStore.editPointList;
      editMarkStore.angle = this.getAngle(point1, point2, point3);
      return editMarkStore;
    },
    /*添加直尺信息*/
    addRulerInfo(editMarkStore, imageData) {
      editMarkStore.infoWidth = this.infoRangeDic["Ruler"].width;
      editMarkStore.infoHeight = this.infoRangeDic["Ruler"].height;
      let { dataWithInfo } = imageData;
      let { pixelSpacingW: w, pixelSpacingH: h } = dataWithInfo;
      let [point1, point2] = editMarkStore.editPointList;
      editMarkStore.length = this.getRulerLength(point1, point2, { w, h });
      return editMarkStore;
    },
    /*添加曲线测量信息*/
    addCurveRulerInfo(editMarkStore, imageData) {
      editMarkStore.infoWidth = this.infoRangeDic["CurveRuler"].width;
      editMarkStore.infoHeight = this.infoRangeDic["CurveRuler"].height;
      let { dataWithInfo } = imageData;
      let { pixelSpacingW: w, pixelSpacingH: h } = dataWithInfo;
      if (editMarkStore.editPointList.length < 2) return editMarkStore;
      editMarkStore.length = this.getCurveRulerLength(
        editMarkStore.editPointList,
        { w, h },
      );
      return editMarkStore;
    },
    /*添加文本信息*/
    addTextInfo(editMarkStore) {
      let ctx = this.canvas2d;
      ctx.font = "14px Arial";
      let count = 0;
      let text = editMarkStore.text;
      let index = 0;
      let arr = [];
      for (let i = 0; i < text.length; i++) {
        let str = text.substring(index, i + 1);
        let width = ctx.measureText(str).width;

        if (width > 110) {
          arr.push(str);
          count++;
          index = i;
        }
        if (i === text.length - 1) {
          arr.push(str);
          count++;
        }
      }
      editMarkStore.textLineCount = count;
      editMarkStore.infoWidth = 140;
      editMarkStore.infoHeight = 10 + 20 * count;
      editMarkStore.textArray = arr;
      return editMarkStore;
    },
    /*添加像素值信息*/
    addPointInfo(editMarkStore, seriesInfo, imageData) {
      editMarkStore.infoWidth = this.infoRangeDic["Point"].width;
      editMarkStore.infoHeight = this.infoRangeDic["Point"].height;
      let imagePos = editMarkStore.editPointList[0];
      editMarkStore.value = this.getPointValue(imagePos, seriesInfo, imageData);
      editMarkStore.linePoint = editMarkStore.editPointList[0];
      return editMarkStore;
    },
    /*添加心胸比信息*/
    addHeartChestInfo(editMarkStore, imageData) {
      editMarkStore.infoWidth = this.infoRangeDic["HeartChest"].width;
      editMarkStore.infoHeight = this.infoRangeDic["HeartChest"].height;
      let { dataWithInfo } = imageData;
      let { pixelSpacingW: w, pixelSpacingH: h } = dataWithInfo;
      editMarkStore.values = this.getHeartChestRatio(
        editMarkStore.editPointList,
        { w, h },
      );
      return editMarkStore;
    },
    /*添加COB角度信息*/
    addCOBAngleInfo(editMarkStore, imageData) {
      editMarkStore.infoWidth = this.infoRangeDic["COBAngle"].width;
      editMarkStore.infoHeight = this.infoRangeDic["COBAngle"].height;
      let { dataWithInfo } = imageData;
      let { pixelSpacingW: w, pixelSpacingH: h } = dataWithInfo;
      editMarkStore.values = this.getCOBAngleValue(
        editMarkStore.editPointList,
        { w, h },
      );
      return editMarkStore;
    },
    /*添加矩形信息*/
    addRectInfo(editMarkStore, seriesInfo, imageData) {
      let { pixelSpacingH, pixelSpacingW, origBuf } = imageData.dataWithInfo;
      let pixelSpacing = { w: pixelSpacingW, h: pixelSpacingH };

      editMarkStore.area = this.getRectArea(
        editMarkStore.editPointList,
        pixelSpacing,
      );

      if (!origBuf.isColor && editMarkStore.editPointList.length === 4)
        return this.getInfosofRorC(editMarkStore, seriesInfo, imageData);
      else return editMarkStore;
    },
    /*添加圆形信息*/
    addCircleInfo(editMarkStore, seriesInfo, imageData) {
      let { pixelSpacingH, pixelSpacingW, origBuf } = imageData.dataWithInfo;
      let pixelSpacing = { w: pixelSpacingW, h: pixelSpacingH };
      let [point1, point2] = editMarkStore.editPointList;
      let center;
      if (point2) {
        center = {
          x: (point2.x + point1.x) / 2,
          y: (point2.y + point1.y) / 2,
        };
      }
      editMarkStore.area = this.getCircleArea(point1, center, pixelSpacing);
      if (!origBuf.isColor && point2)
        return this.getInfosofRorC(editMarkStore, seriesInfo, imageData);
      else return editMarkStore;
    },
    /*添加画笔ROI信息*/
    addROIInfo(editMarkStore, seriesInfo, imageData) {
      return this.getInfosofPoly(editMarkStore, seriesInfo, imageData);
    },

    getCircleMinRect(editMarkStore, imageWidth, imageHeight) {
      let rect = {
        minRectStart: { x: 0, y: 0 },
        minRectStop: { x: 0, y: 0 },
        CC: { x: 0, y: 0 },
        C1: { x: 0, y: 0 },
        aa: 0,
      };
      let [point1, point2] = editMarkStore.editPointList;
      let xx = Math.abs(point2.x - point1.x) / 2;
      let yy = Math.abs(point2.y - point1.y) / 2;
      rect.CC = {
        x: (point1.x + point2.x) / 2,
        y: (point1.y + point2.y) / 2,
      };
      rect.minRectStart = {
        x: rect.CC.x - xx,
        y: rect.CC.y - yy,
      };
      rect.minRectStop = {
        x: rect.CC.x + xx,
        y: rect.CC.y + yy,
      };
      if (xx > yy) {
        //焦点在x轴上
        let c = Math.sqrt(Math.pow(xx, 2) - Math.pow(yy, 2));
        rect.C1 = {
          x: rect.CC.x - c,
          y: rect.CC.y,
        };
        rect.C2 = {
          x: rect.CC.x + c,
          y: rect.CC.y,
        };
        rect.aa = xx;
      } else {
        let c = Math.sqrt(Math.pow(yy, 2) - Math.pow(xx, 2));
        rect.C1 = {
          x: rect.CC.x,
          y: rect.CC.y - c,
        };
        rect.C2 = {
          x: rect.CC.x,
          y: rect.CC.y + c,
        };
        rect.aa = yy;
      }
      rect = this.intRect(rect, imageWidth, imageHeight);
      return rect;
    },
    isInCircle(point, minRect) {
      let resp = false;
      let { C1, C2, aa } = minRect;
      if (
        this.getPointDistance(point, C1) + this.getPointDistance(point, C2) <=
        aa * 2
      ) {
        resp = true;
      }
      return resp;
    },
    intRect(minRect, imageWidth, imageHeight) {
      minRect.minRectStart.x = Math.floor(minRect.minRectStart.x);
      if (minRect.minRectStart.x < 0) {
        minRect.minRectStart.x = 0;
      }
      minRect.minRectStart.y = Math.floor(minRect.minRectStart.y);
      if (minRect.minRectStart.y < 0) {
        minRect.minRectStart.y = 0;
      }
      minRect.minRectStop.x = Math.ceil(minRect.minRectStop.x);
      if (minRect.minRectStop.x > imageWidth - 1) {
        minRect.minRectStop.x = imageWidth - 1;
      }
      minRect.minRectStop.y = Math.ceil(minRect.minRectStop.y);
      if (minRect.minRectStop.y > imageHeight - 1) {
        minRect.minRectStop.y = imageHeight - 1;
      }
      return minRect;
    },
    getRectMinRect(editMarkStore, imageWidth, imageHeight) {
      let rect = {
        minRectStart: { x: 0, y: 0 },
        minRectStop: { x: 0, y: 0 },
      };
      let list = editMarkStore.editPointList;
      rect.minRectStart = {
        x: editMarkStore.editPointList[0].x,
        y: editMarkStore.editPointList[0].y,
      };
      rect.minRectStop = {
        x: editMarkStore.editPointList[0].x,
        y: editMarkStore.editPointList[0].y,
      };
      for (let i = 0; i < 4; i++) {
        if (rect.minRectStart.x > list[i].x) {
          rect.minRectStart.x = list[i].x;
        }
        if (rect.minRectStart.y > list[i].y) {
          rect.minRectStart.y = list[i].y;
        }
        if (rect.minRectStop.x < list[i].x) {
          rect.minRectStop.x = list[i].x;
        }
        if (rect.minRectStop.y < list[i].y) {
          rect.minRectStop.y = list[i].y;
        }
      }
      rect = this.intRect(rect, imageWidth, imageHeight);
      return rect;
    },
    getInfosofPoly(editMarkStore, seriesInfo, imageData) {
      let { dataWithInfo } = imageData;
      editMarkStore.infoWidth = this.infoRangeDic["Pen"].width;
      editMarkStore.infoHeight = this.infoRangeDic["Pen"].height;

      let orgdataObj = dataWithInfo.origBuf;
      let polyPointList = editMarkStore.polyPointList;
      let infoObj = REMARK.SVGMARK.getPolyMarkInfo(orgdataObj, polyPointList);
      let { pixelSpacingH, pixelSpacingW } = imageData.dataWithInfo;
      infoObj.area = pixelSpacingH * pixelSpacingW * infoObj.count;

      let defaultData = seriesInfo;
      let unit = "";
      if (defaultData.model == "CT") {
        unit = "HU";
      }
      if (defaultData.model == "PT") {
        unit = "SUV";
      }

      let { max, min, aver, variance, area } = infoObj;
      if (defaultData.model === "PT") {
        let { PW, RTD, RHL, ST, ET, UT, Units } = defaultData;
        max = DATA.getSUV(max, PW, RTD, RHL, ST, ET, UT, Units);
        min = DATA.getSUV(min, PW, RTD, RHL, ST, ET, UT, Units);
        aver = DATA.getSUV(aver, PW, RTD, RHL, ST, ET, UT, Units);
        variance = DATA.getSUV(variance, PW, RTD, RHL, ST, ET, UT, Units);
      }
      editMarkStore.max = (Math.round(max * 100) / 100).toString() + unit;
      editMarkStore.min = (Math.round(min * 100) / 100).toString() + unit;
      editMarkStore.aver = (Math.round(aver * 100) / 100).toString() + unit;
      editMarkStore.variance =
        (Math.round(variance * 100) / 100).toString() + unit;
      editMarkStore.area =
        "Area: " + Math.round((area * 100) / 100).toString() + "mm²";
      editMarkStore.model = defaultData.model;

      if (orgdataObj.isColor) {
        editMarkStore.max = undefined;
        editMarkStore.min = undefined;
        editMarkStore.aver = undefined;
        editMarkStore.variance = undefined;
        editMarkStore.max2 = undefined;
        editMarkStore.min2 = undefined;
        editMarkStore.aver2 = undefined;
        editMarkStore.variance2 = undefined;
      }
      return editMarkStore;
    },
    /*计算圆形标注或者矩形标注的选框信息*/
    getInfosofRorC(editMarkStore, seriesInfo, imageData) {
      let { dataWithInfo } = imageData;
      let count = 0;
      let variance = 0;
      let max = null;
      let min = null;
      let aver = 0;
      let defaultData = seriesInfo;

      editMarkStore.infoWidth = this.infoRangeDic["Pen"].width;
      editMarkStore.infoHeight = this.infoRangeDic["Pen"].height;
      let {
        data: buf = [],
        width: imageWidth,
        height: imageHeight,
      } = dataWithInfo.origBuf;

      let unit = "";
      if (defaultData.model == "CT") {
        unit = "HU";
      }
      if (defaultData.model == "PT") {
        unit = "SUV";
      }

      let dataLength = 0;
      //求最小外接矩形用于计算像素值
      let minRect = {};
      if (editMarkStore.type === "Circle") {
        minRect = this.getCircleMinRect(editMarkStore, imageWidth, imageHeight);
      }

      if (editMarkStore.type === "Rect") {
        minRect = this.getRectMinRect(editMarkStore, imageWidth, imageHeight);
      }

      let valueList = [];
      for (let j = minRect.minRectStart.y; j <= minRect.minRectStop.y; j++) {
        for (let i = minRect.minRectStart.x; i <= minRect.minRectStop.x; i++) {
          let point = { x: i, y: j };
          let pos = j * imageWidth + i;

          if (
            editMarkStore.type === "Rect" ||
            this.isInCircle(point, minRect)
          ) {
            let B = buf[[pos]];
            valueList.push(B);
            if (max == null) {
              max = B;
            } else if (B > max) {
              max = B;
            }
            if (min == null) {
              min = B;
            } else if (B < min) {
              min = B;
            }
            dataLength = dataLength + B;
            count++;
          }
        }
      }
      aver = dataLength / count;
      for (let i = 0; i < valueList.length; i++) {
        variance = variance + (valueList[i] - aver) * (valueList[i] - aver);
      }
      variance = Math.sqrt(variance / count);

      if (defaultData.model === "PT") {
        let { PW, RTD, RHL, ST, ET, UT, Units } = defaultData;
        max = DATA.getSUV(max, PW, RTD, RHL, ST, ET, UT, Units);
        min = DATA.getSUV(min, PW, RTD, RHL, ST, ET, UT, Units);
        aver = DATA.getSUV(aver, PW, RTD, RHL, ST, ET, UT, Units);
        variance = DATA.getSUV(variance, PW, RTD, RHL, ST, ET, UT, Units);
      }
      editMarkStore.max = (Math.round(max * 100) / 100).toString() + unit;
      editMarkStore.min = (Math.round(min * 100) / 100).toString() + unit;
      editMarkStore.aver = (Math.round(aver * 100) / 100).toString() + unit;
      editMarkStore.variance =
        (Math.round(variance * 100) / 100).toString() + unit;
      editMarkStore.model = defaultData.model;

      return editMarkStore;
    },

    getRectArea(pointList, pixelSpacing) {
      let area = 0;
      if (pointList.length != 4) {
        return area;
      }
      let lengtha = this.getPointDistance(pointList[0], pointList[1]);
      let lengthb = this.getPointDistance(pointList[0], pointList[3]);
      area = lengtha * lengthb * pixelSpacing.w * pixelSpacing.h;
      area = Math.round(area * 100) / 100;
      return "Area: " + area.toString() + "mm²";
    },
    getCircleArea(point1, center, pixelSpacing) {
      if (!center) return;
      let area = 0;
      let rotate = this.imageData.rotate;

      let r = this.getPointDistance(point1, center);

      let rotateO = this.getRotateAngle(point1.x, point1.y, center.x, center.y);
      let lengtha = Math.abs(Math.cos(rotateO - rotate) * r);
      let lengthb = Math.abs(Math.sin(rotateO - rotate) * r);
      area = Math.PI * lengtha * lengthb * pixelSpacing.w * pixelSpacing.h;
      area = Math.round(area * 100) / 100;
      return "Area: " + area.toString() + "mm²";
    },

    /*获取角度*/
    getAngle(startPoint, peakPoint, endPoint) {
      let angle = FIND.getAngle(startPoint, peakPoint, endPoint);
      angle = "Angle: " + angle.toString() + "deg";
      return angle;
    },
    getRulerLength(point1, point2, pixelSpacing) {
      if (!point2) return;
      let x = (point2.x - point1.x) * pixelSpacing.w;
      let y = (point2.y - point1.y) * pixelSpacing.h;
      let length = Math.sqrt(x * x + y * y);
      length = Math.round(length * 100) / 100;
      return "Length: " + length.toString() + "mm";
    },
    getCurveRulerLength(pointList, pixelSpacing) {
      let length = 0;
      for (let i = 0; i < pointList.length - 1; i++) {
        let x = (pointList[i + 1].x - pointList[i].x) * pixelSpacing.w;
        let y = (pointList[i + 1].y - pointList[i].y) * pixelSpacing.h;
        length += Math.sqrt(x * x + y * y);
      }
      length = Math.round(length * 100) / 100;
      return "Length: " + length.toString() + "mm";
    },
    getHeartChestRatio(points, pixelSpacing) {
      if (points.length < 4) return;
      let { w, h } = pixelSpacing;
      let x1 = (points[1].x - points[0].x) * w;
      let y1 = (points[1].y - points[0].y) * h;
      let l1 = Math.sqrt(x1 * x1 + y1 * y1);
      l1 = Math.round(l1 * 100) / 100;

      let x2 = (points[3].x - points[2].x) * w;
      let y2 = (points[3].y - points[2].y) * h;
      let l2 = Math.sqrt(x2 * x2 + y2 * y2);
      l2 = Math.round(l2 * 100) / 100;

      let t1 = `${l1}mm / ${l2}mm`;
      let t2 = `${this.$t("cardiothoracicRatio")}: ${(l1 / l2).toFixed(2)}`;

      return [t1, t2];
    },
    getCOBAngleValue(points, pixelSpacing) {
      if (points.length < 4) return;
      let x1 = points[1].x - points[0].x;
      let y1 = points[1].y - points[0].y;
      let x2 = points[3].x - points[2].x;
      let y2 = points[3].y - points[2].y;

      // 两条线的长度
      let { w, h } = pixelSpacing;
      let l1 = Math.sqrt(x1 * w * x1 * w + y1 * h * y1 * h);
      l1 = Math.round(l1 * 100) / 100;
      let l2 = Math.sqrt(x2 * w * x2 * w + y2 * h * y2 * h);
      l2 = Math.round(l2 * 100) / 100;
      let t1 = `${l1}mm / ${l2}mm`;

      // 向量 AB
      let vectorAB = {
        x: x1,
        y: y1,
      };
      // 向量 CD
      let vectorCD = {
        x: x2,
        y: y2,
      };
      // 计算向量 AB 的模（长度）
      let magnitudeAB = Math.sqrt(
        vectorAB.x * vectorAB.x + vectorAB.y * vectorAB.y,
      );
      // 计算向量 CD 的模（长度）
      let magnitudeCD = Math.sqrt(
        vectorCD.x * vectorCD.x + vectorCD.y * vectorCD.y,
      );
      // 计算向量 AB 和向量 CD 的点积
      let dotProduct = vectorAB.x * vectorCD.x + vectorAB.y * vectorCD.y;
      // 根据向量点积公式计算夹角的余弦值
      let cosTheta = dotProduct / (magnitudeAB * magnitudeCD);
      // 使用 Math.acos() 获取弧度值
      let radian = Math.acos(cosTheta);
      // 将弧度值转换为角度值
      let angle = (radian * 180) / Math.PI;
      angle = angle > 90 ? 180 - angle : angle;
      let t2 = `${this.$t("COBAngle")}: ${angle.toFixed(2)}deg`;

      return [t1, t2];
    },
    getPointValue(imagePos, seriesInfo, imageData) {
      let { dataWithInfo } = imageData;
      let origBuf = dataWithInfo.origBuf;
      let { PW, RTD, RHL, ST, ET, UT, Units } = seriesInfo;
      let {
        width: imageWidth,
        height: imageHeight,
        data: bufData = null,
      } = origBuf;
      let val = null;
      //取整
      imagePos.x = Math.round(imagePos.x);
      imagePos.y = Math.round(imagePos.y);
      if (
        imagePos.x >= 0 &&
        imagePos.y >= 0 &&
        imagePos.x <= imageWidth &&
        imagePos.y <= imageHeight
      ) {
        let checkedData = bufData[imagePos.y * imageWidth + imagePos.x];
        if (seriesInfo.model === "PT") {
          val =
            DATA.getSUV(checkedData, PW, RTD, RHL, ST, ET, UT, Units).toFixed(
              2,
            ) + "SUV";
        } else if (seriesInfo.model === "CT") {
          val = checkedData.toString() + "HU";
          const pointIndex = val.indexOf(".");
          if (pointIndex >= 1) {
            val = val.slice(0, pointIndex + 3) + "HU";
          }
        } else {
          val = checkedData.toString();
          const pointIndex = val.indexOf(".");
          if (pointIndex >= 1) {
            val = val.slice(0, pointIndex + 3);
          }
        }
      }
      return "Value: " + val;
    },
    /*删除*/
    iDelete() {
      this.clearIeditPara();
    },
    /*功能函数*/
    /*寻找控制点*/
    findSelectPoint(canvasPointList, canvasPoint) {
      for (let k in canvasPointList) {
        let dis = this.getPointDistance(canvasPointList[k], canvasPoint);
        if (dis < REMARK.selectCirleR) return k;
      }
      return false;
    },
    //计算两点之间距离
    getPointDistance(point1, point2) {
      return Math.sqrt(
        (point2.y - point1.y) * (point2.y - point1.y) +
          (point2.x - point1.x) * (point2.x - point1.x),
      );
    },
    //获取两线夹角
    getRotateAngle(x1, y1, x2, y2) {
      let height = y1 - y2,
        width = x1 - x2;
      if (width == 0) {
        return y1 >= y2 ? Math.PI / 2 : (Math.PI * 3) / 2;
      } else {
        let tan = Math.atan(height / width),
          angle = tan;

        return tan > 0
          ? x1 > x2
            ? angle
            : angle + Math.PI
          : x1 > x2
            ? angle + Math.PI * 2
            : angle + Math.PI;
      }
    },

    /**
     * 生成AI标记
     * @param item
     * @return {Object}
     */
    genAIRemark(item) {
      const id = item["id"];
      const point = item["markList"];
      const imageNum = item["index"];
      const aiIedit = {
        ID: id,
        editPointList: point,
        createType: "AIAnaysis",
        type: "Rect",
        model: "CT",
        curViewMod: 0,
        curImageNum: imageNum,
        curveLinePointList: [],
        ifNoneInfo: true,
        date: this.$moment().format("yyyy-MM-DD HH:mm:ss"),
      };
      return aiIedit;
    },

    /**
     * 初始化AI标注
     */
    initAimark() {
      if (!this.aiInitFilter.imageData || !this.aiInitFilter.aiRemarkList) {
        return;
      }

      // 创建rect标记
      const n = this.aiRemarkList.length;
      const sid = this.aiAnalysisResult["seriesID"];
      this.$set(this.ieditListData, sid, new Array(n));
      const currIeditListData = this.ieditListData[sid];

      for (let i = 0; i < n; i++) {
        const item = this.aiRemarkList[i];
        const remark = this.genAIRemark(item);
        this.$set(currIeditListData, i, remark);
      }
    },
    drop(event) {
      const series = JSON.parse(event.dataTransfer.getData("series"));
      this.$emit("dropSeries", { currentSID: series.seriesId });
    },
  },

  watch: {
    activeOpt: {
      handler(val) {
        switch (val) {
          case "VOI_Rect": {
            this.labelStatus = "VOI_Rect";
            break;
          }
          case "VOI_Circle": {
            this.labelStatus = "VOI_Circle";
            break;
          }
          case "Pen": {
            this.labelStatus = "Pen";
            break;
          }
          case "Circle": {
            this.labelStatus = "Circle";
            break;
          }
          case "Rect": {
            this.labelStatus = "Rect";
            break;
          }
          case "CurveLine": {
            this.labelStatus = "CurveLine";
            break;
          }
          case "CurveRuler": {
            this.labelStatus = "CurveRuler";
            break;
          }
          case "Arrow": {
            this.labelStatus = "Arrow";
            break;
          }
          case "Angle": {
            this.labelStatus = "Angle";
            break;
          }
          case "Ruler": {
            this.labelStatus = "Ruler";
            break;
          }
          case "Text": {
            this.labelStatus = "Text";
            break;
          }
          case "Rubber": {
            this.labelStatus = "Rubber";
            break;
          }
          case "Point": {
            this.labelStatus = "Point";
            break;
          }
          case "CPRPoint": {
            this.labelStatus = "CPRPoint";
            break;
          }
          case "HeartChest": {
            this.labelStatus = "HeartChest";
            break;
          }
          case "COBAngle": {
            this.labelStatus = "COBAngle";
            break;
          }
          default: {
            this.labelStatus = null;
            break;
          }
        }
      },
      deep: true,
    },
    labelStatus: function () {
      this.canvas.style = "";
      this.registMarkTool(this.labelStatus);
    },
    canvasNow: function () {
      if (this.labelStatus) {
        this.registMarkTool(this.labelStatus);
      }
    },
    startDraw() {
      this.$emit("update:iediting", this.startDraw);
    },

    /**
     * 隐藏已勾选的AI标注，其余的用户标注不受影响
     */
    hiddenIDList(newast) {
      const sid = this.seriesInfo["SeriesIndex"];
      let currIeditListData = this.ieditListData[sid];

      // 只保留用户标注，清空所有AI标注
      const userIeditList = currIeditListData.filter(
        (item) => item.createType !== "AIAnaysis" && !item.ifNoneInfo,
      );
      this.$set(this.ieditListData, sid, userIeditList);
      currIeditListData = userIeditList;

      // 过滤AI标注
      const filterAIList = this.aiRemarkList.filter((item) => {
        return !newast.includes(item.id);
      });
      for (let i = 0; i < filterAIList.length; i++) {
        const item = filterAIList[i];
        const remark = this.genAIRemark(item);
        currIeditListData.push(remark);
      }
    },
  },
};
</script>
<style lang="scss" scoped>
@import "./viewer-iedit.scss";
</style>
