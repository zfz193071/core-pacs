<template>
  <div
    id="catcher"
    :class="{
      moveCursor: activeOpt == 'Pan',
      zoomCursor: activeOpt == 'Zoom',
      windowWLCursor: activeOpt == 'Window',
      centerCursor:
        activeOpt == 'ACross' && findOptResult && findOptResult.acrossPan,
      marginfyCursor: activeOpt == 'Magnify',
      pageCursor: activeOpt == 'Page' || MinCurrentSID,
      rotateCursor:
        activeOpt == 'Rotate' ||
        (activeOpt == 'ACross' && findOptResult && findOptResult.acrossRotate),
      thickCursor:
        activeOpt == 'ACross' && findOptResult && findOptResult.acrossThick,
    }"
    :style="style"
    ref="catcher"
    @dblclick.stop="clickOptFull"
    @dragover.stop.prevent
    @drop.stop="drop"
  >
    <div
      class="VR-cursor"
      id="vrCursor"
      v-show="imageData.isVR"
      @mousedown.stop="vrCursorDown"
      @mousemove.stop="vrCursorMove"
      @mouseup.stop="vrCursorUp"
      @mouseleave.stop="vrCursorUp"
    ></div>
    <canvas
      ref="crossTool"
      v-show="
        activeOpt == 'ACross' &&
        optMouseDownFlag != 2 &&
        optMouseDownFlag != 1 &&
        !imageData.isCPR &&
        !useCompatibility
      "
      :style="{
        width: canvasSize.width + 'px',
        height: canvasSize.height + 'px',
      }"
      :width="canvasSize.width"
      :height="canvasSize.height"
    >
    </canvas>
    <div ref="sidebar" v-show="imageData.imageNum && !showVR" class="sidebar Z">
      <div ref="scrollbar" class="scrollbar" @dblclick.stop>
        <div class="scrollblock" :style="{ top: currentScrollPosition }"></div>
        <div class="scroll-container"></div>
        <div class="scrollTop" @mousedown.stop.prevent="scrollPreFn"></div>
        <div class="scrollBottom" @mousedown.stop.prevent="scrollNextFn"></div>
      </div>
    </div>
    <div
      class="vieBox"
      @click.stop="changeVie"
      v-if="MinCurrentSID && !seriesInfo.isNotUniformSquence"
      @dblclick.stop
    ></div>
    <div
      class="close"
      @click.stop.prevent="clickOptFull"
      @dblclick.stop
      v-if="isfull && !isMini"
    ></div>
    <div
      ref="iconSelect"
      :class="{ 'icon-select': true, 'icon-select-rotate': showOption }"
      v-show="showIcon && !useCompatibility"
      @click.stop.prevent="
        showOption = !showOption;
        setVR();
      "
    ></div>
    <el-checkbox
      v-if="!showVR && showImageStitching && !isAutoLinkout && !isManualLinkout"
      class="stitching-checkbox"
      @change="handleChangeStitching"
    ></el-checkbox>
    <div v-show="showOption" class="mrpmipOption" ref="mprmipOPT">
      <template v-if="imageData.isCPR">
        <div class="option-item">{{ $t("CPR.mode") }}:</div>
        <div class="option-item">
          <el-select
            v-model="AcrossPoint.CPRMode"
            size="mini"
            :popper-append-to-body="false"
          >
            <el-option :label="$t('CPR.straight')" value="2"></el-option>
            <el-option :label="$t('CPR.stretch')" value="1"></el-option>
          </el-select>
        </div>
        <div class="option-item">{{ $t("CPR.projection") }}:</div>
        <div class="option-item">
          <el-select
            v-model="AcrossPoint.CPRProjectionMode"
            size="mini"
            :popper-append-to-body="false"
          >
            <el-option label="MaxIP" :value="0"></el-option>
            <el-option label="MinIP" :value="1"></el-option>
            <el-option label="AvgIP" :value="2"></el-option>
          </el-select>
        </div>
        <div class="option-item">{{ $t("CPR.thickness") }}(mm):</div>
        <div class="option-item">
          <div class="slider-wrapper">
            <Slider
              :value.sync="AcrossPoint.CPRThickness"
              :max="VolumeDiagonal"
            />
          </div>
          <div class="input-wrapper">
            <input v-model.number="AcrossPoint.CPRThickness" type="number" />
            <!-- <span>mm</span> -->
          </div>
        </div>
        <div class="option-item">{{ $t("CPR.angle") }}:</div>
        <div class="option-item">
          <div class="slider-wrapper">
            <Slider :value.sync="AcrossPoint.CPRRotate" :max="360" />
          </div>
          <div class="input-wrapper">
            <input v-model="AcrossPoint.CPRRotate" type="number" />
            <span>°</span>
          </div>
        </div>
      </template>
      <template v-else-if="isInMPR">
        <div class="option-item">{{ $t("MPR.projection") }}:</div>
        <div class="option-item">
          <el-select
            v-model="mprMipOpt"
            size="mini"
            :popper-append-to-body="false"
            popper-class="mprPopper"
          >
            <el-option label="MaxIP" value="1"></el-option>
            <el-option label="MinIP" value="2"></el-option>
            <el-option label="AvgIP" value="3"></el-option>
          </el-select>
        </div>
        <div class="option-item space-between">
          <div>{{ $t("MPR.xThickness") }}:</div>
          <div class="check">
            <el-checkbox
              :value="mprThicknessSync"
              @change="$emit('update:mprThicknessSync', !mprThicknessSync)"
              >{{ $t("MPR.sync") }}</el-checkbox
            >
          </div>
        </div>
        <div class="option-item">
          <div class="slider-wrapper">
            <Slider :value.sync="thicknessX" :max="thicknessXMax" unit="mm" />
          </div>
          <div class="input-wrapper">
            <input v-model.number="thicknessX" type="number" />
            <span>mm</span>
          </div>
        </div>
        <div class="option-item">{{ $t("MPR.yThickness") }}:</div>
        <div
          :class="{ 'option-disable': mprThicknessSync, 'option-item': true }"
        >
          <div class="slider-wrapper">
            <Slider :value.sync="thicknessY" :max="thicknessYMax" unit="mm" />
          </div>
          <div class="input-wrapper">
            <input v-model.number="thicknessY" type="number" />
            <span>mm</span>
          </div>
        </div>
        <div class="option-item">
          <div class="check">
            <el-checkbox
              :value="mprOrthogonalitySync"
              @change="handleChangeOrthogonality"
              >{{ $t("MPR.keepOrthogonality") }}</el-checkbox
            >
          </div>
        </div>
      </template>
      <!-- <el-radio-group v-model="mprMipOpt" class="select-container">
        <el-radio label="1">MaxIP</el-radio>
        <el-radio label="2">MinIP</el-radio>
        <el-radio label="3">AvgIP</el-radio>
      </el-radio-group> -->
    </div>

    <!--  link  -->
    <!-- <div
      class="link"
      v-if="currViewport && isCatcherShow && !isfull"
      @dblclick.stop
    >
      <div class="sync">
        <el-checkbox v-model="currViewport.isRepeat">平铺</el-checkbox>
        <el-checkbox v-model="currViewport.isSacle">缩放</el-checkbox>
        <el-checkbox v-model="currViewport.isPosition">定位</el-checkbox>
      </div>
    </div> -->
  </div>
</template>

<script>
import ACTIVEOPT from "../js/activeOpt.js";
import CLICKOPT from "../js/clickOpt.js";
import WHEEL from "../../../assets/js/wheel";
import DATA from "../js/data";
import CROSS from "../js/crosshair.js";
import Slider from "./slider.vue";
import { vec3 } from "gl-matrix";
import { mapMutations, mapState } from "vuex";
import { throttle } from "lodash";
let flag = false;
export default {
  name: "viewer-catcher",
  components: {
    Slider,
  },
  props: {
    isMini: { type: Boolean, default: false },
    viewportSize: {
      default: () => ({ left: 0, top: 0, width: 4, height: 4 }),
    },
    viewportList: { type: Object, required: true },
    canvasSize: {
      default: () => {
        return { left: 0, top: 0, width: 4, height: 4 };
      },
    },
    currViewportID: { type: String, default: "" },
    canvasRange: {},
    activeOpt: { type: String, required: true },
    imageData: { required: true },
    imageDatas: { type: Array, required: false },
    seriesInfo: { required: true },
    seriesInfos: { type: Array, required: false },
    clickOpt: { type: String, required: true },
    gridNum: {},
    imgPoor: {},
    MinCurrentSID: {},
    minSize: {},
    AcrossPoint: {},
    currViewport: {
      type: Object,
      required: false,
    },
    isCatcherShow: { type: Boolean, default: false },
    canvasNow: { type: Number, required: false },
    vtkBlendMod: { type: Number, required: false },
    isInMPR: { type: Boolean, required: false },
    isInCPR: { type: Boolean, required: false },
    isInVR: { type: Boolean, required: false },
    useCompatibility: { type: Boolean }, //是否是兼容模式
    catcherShortcutKey: { type: Object, default: () => ({}) },
    setvrShow: { type: Boolean, required: false },
    mprThicknessSync: Boolean,
    isAutoLinkout: { type: Boolean, required: true },
    isManualLinkout: { type: Boolean, required: true },
  },
  data() {
    return {
      optStartPoint: {}, // 鼠标左键点击那一刻的坐标
      optCurrentPoint: {}, // 鼠标左键保持点击，移动的坐标
      optEndPoint: {},
      optMouseDownFlag: -1,
      currentScrollPosition: "50%",
      scrollMouseDownFlag: false,
      moveStart: { x: 0, y: 0 },
      rotateStart: 0,
      rotateData: { x: 0, y: 0 },
      touchStart: { x: 0, y: 0 },
      vector: { x: 0, y: 0 },
      zoomStart: { x: 1, y: 1 },
      presetBoxShow: false,
      findOptResult: null, //十字状态下，需要先检测当前点按下的时候，接下来进行的操作：移动十字，旋转，更新层厚，或是移动图像
      playInterval: null,
      crossTool: null,
      mprMipOpt: undefined,
      showOption: false,
      handleDownFlag: false,
      vrMouseFlag: false,
      vrButton: null,
      mprOrthogonalitySync: true,
    };
  },
  created() {
    this.mprMipOpt = this.vtkBlendMod.toString();
  },
  computed: {
    ...mapState(["imageStitchingList"]),
    showVR() {
      return this.imageData?.isCPR || this.imageData?.isVR;
    },
    isfull() {
      let { fullGridIndex, fullVPID } = this.canvasRange;
      return fullGridIndex !== undefined && fullVPID !== undefined;
    },
    style() {
      let { top, left, width, height, zindex } = this.canvasSize;

      let res = {
        width: width + "px",
        height: height + "px",
        top: top + "px",
        left: left + "px",
      };
      if (zindex) res.zIndex = zindex;
      return res;
    },
    showIcon() {
      return (
        (this.isInMPR && !this.isInCPR) ||
        this.imageData?.isCPR ||
        this.imageData?.isVR
      );
    },
    needUpdScrollPosition() {
      if (!this.imageData) return {};
      const updInfo = {
        canvasSize: this.canvasSize,
        currViewportID: this.currViewportID,
        curImageNum: this.imageData.DWIUID,
      };
      return updInfo;
    },
    thicknessX: {
      get() {
        let dic = CROSS.dicForThick[this.imageData.curViewMod];
        let val = this.AcrossPoint[dic.mprThickX];
        if (val < 0.1) {
          val = 0.1;
        }
        return val;
      },
      set(val) {
        let dic = CROSS.dicForThick[this.imageData.curViewMod];
        if (val < 0.1) {
          val = 0.1;
        }
        val = Number((Math.round(val * 100) / 100).toFixed(2));
        this.AcrossPoint[dic.mprThickX] = val;
      },
    },
    VolumeDiagonal() {
      let seriesInfo = this.seriesInfos[0];
      let { volumeSpacing, volumeSize } = seriesInfo;
      //求立方体的对角线长度
      let { w: lw, h: lh, d: ld } = volumeSize[0];
      let { w: pw, h: ph, d: pd } = volumeSpacing[0];
      let spacing = [pw, ph, pd],
        dimensions = [lw, lh, ld];
      let diagonal = vec3.len(vec3.mul([], spacing, dimensions));
      diagonal = Math.floor(diagonal);
      return diagonal;
    },
    thicknessXMax() {
      let { curViewMod } = this.imageData;
      let { volumeSpacing, volumeSize } = this.seriesInfo;
      let imageNum = volumeSize[curViewMod].h;
      if (imageNum === undefined) return 100;
      let { h, thickness } = volumeSpacing[curViewMod];
      let dimStep = Number((thickness / h).toFixed(2));
      let showTotal = Math.floor(imageNum / dimStep) * thickness;
      return showTotal;
    },
    thicknessY: {
      get() {
        let dic = CROSS.dicForThick[this.imageData.curViewMod];
        let val = this.AcrossPoint[dic.mprThickY];
        if (val < 0.1) {
          val = 0.1;
        }
        return val;
      },
      set(val) {
        let dic = CROSS.dicForThick[this.imageData.curViewMod];
        if (val < 0.1) {
          val = 0.1;
        }
        val = Number((Math.round(val * 100) / 100).toFixed(2));
        this.AcrossPoint[dic.mprThickY] = val;
      },
    },
    thicknessYMax() {
      let { curViewMod } = this.imageData;
      let { volumeSpacing, volumeSize } = this.seriesInfo;
      let imageNum = volumeSize[curViewMod].w;
      if (imageNum === undefined) return 100;
      let { w, thickness } = volumeSpacing[curViewMod];
      let dimStep = Number((thickness / w).toFixed(2));
      let showTotal = Math.floor(imageNum / dimStep) * thickness;
      return showTotal;
    },
    // 是否显示图像拼接勾选框
    showImageStitching() {
      const enableImageStitching = localStorage.getItem("enableImageStitching");
      return enableImageStitching === "true";
    },
  },
  mounted() {
    let { catcher, scrollbar, crossTool, mprmipOPT, iconSelect } = this.$refs;
    this.crossTool = crossTool;
    mprmipOPT.addEventListener("mousedown", this.stopPropagation);
    mprmipOPT.addEventListener("mousemove", this.stopPropagation);
    mprmipOPT.addEventListener("mouseup", this.stopPropagation);
    mprmipOPT.addEventListener("mouseleave", this.stopPropagation);
    iconSelect.addEventListener("mousedown", this.stopPropagation);

    if ($IsPC) {
      catcher.addEventListener("mousedown", this.optHandleDown);
      catcher.addEventListener("mousemove", this.optHandleMove);
      catcher.addEventListener("mouseup", this.optHandleUp);
      catcher.addEventListener("mouseleave", this.optHandleUp);

      scrollbar.addEventListener("mousedown", this.scrollStart);
      scrollbar.addEventListener("mousemove", this.scrollMove);
      scrollbar.addEventListener("mouseup", this.scrollEnd);
      scrollbar.addEventListener("mouseleave", this.scrollEnd);
      this.throttledScrollPreNextChange = throttle(
        this.throttledScrollPreNextHandle.bind(this),
        100,
      );
    } else {
      catcher.addEventListener("touchstart", this.optHandleDown);
      catcher.addEventListener("touchmove", this.optHandleMove);
      catcher.addEventListener("touchend", this.optHandleUp);

      scrollbar.addEventListener("touchstart", this.scrollStart);
      scrollbar.addEventListener("touchmove", this.scrollMove);
      scrollbar.addEventListener("touchend", this.scrollEnd);
    }
    this.catcherWheelListener = WHEEL(this.scrollPre, this.scrollNext, catcher);
    this.editWheelListener = WHEEL(
      this.scrollPre,
      this.scrollNext,
      editWrapper,
    );
  },
  beforeDestroy() {
    let { catcher, scrollbar } = this.$refs;
    this.catcherWheelListener &&
      catcher.removeEventListener("DOMMouseScroll", this.catcherWheelListener);
    this.editWheelListener &&
      editWrapper.removeEventListener("DOMMouseScroll", this.editWheelListener);
    if ($IsPC) {
      catcher.removeEventListener("mousedown", this.optHandleDown);
      catcher.removeEventListener("mousemove", this.optHandleMove);
      catcher.removeEventListener("mouseup", this.optHandleUp);
      catcher.removeEventListener("mouseleave", this.optHandleUp);

      scrollbar.removeEventListener("mousedown", this.scrollStart);
      scrollbar.removeEventListener("mousemove", this.scrollMove);
      scrollbar.removeEventListener("mouseup", this.scrollEnd);
      scrollbar.removeEventListener("mouseleave", this.scrollEnd);
    } else {
      catcher.removeEventListener("touchstart", this.optHandleDown);
      catcher.removeEventListener("touchmove", this.optHandleMove);
      catcher.removeEventListener("touchend", this.optHandleUp);

      scrollbar.removeEventListener("touchstart", this.scrollStart);
      scrollbar.removeEventListener("touchmove", this.scrollMove);
      scrollbar.removeEventListener("touchend", this.scrollEnd);
    }
  },
  methods: {
    ...mapMutations(["setImageStitching"]),
    stopPropagation(e) {
      e.stopPropagation();
    },
    handleChangeOrthogonality(checked) {
      this.mprOrthogonalitySync = checked;
      CROSS.isOrthogonalRotation = checked;
    },
    //滚轮事件
    scrollStart(e) {
      e.preventDefault();
      e.stopPropagation();
      this.scrollPosi(e);
      this.scrollMouseDownFlag = true;
    },
    scrollMove(e) {
      e.preventDefault();
      e.stopPropagation();
      if (this.scrollMouseDownFlag) {
        this.scrollPosi(e);
      }
    },
    scrollEnd(e) {
      e.preventDefault();
      e.stopPropagation();
      if (this.scrollMouseDownFlag) {
        this.scrollPosi(e);
        this.scrollMouseDownFlag = false;
      }
    },
    //操作滚动条 翻页
    scrollPosi(e) {
      const sidebarDOM = this.$refs.sidebar;
      const siderbarRect = sidebarDOM.getBoundingClientRect();
      const height = siderbarRect.height;

      let imageData = { ...this.imageData };
      let { imageNum, curImageNum, curViewMod, isSyncOthers } = imageData;
      let currentIndex = curImageNum;
      let pointy = e.clientY - siderbarRect.top;

      if (pointy < 0) {
        pointy = 0;
      } else if (pointy > height) {
        pointy = height;
      }
      if (imageNum) {
        currentIndex = parseInt((pointy / height) * imageNum);
      }
      //BuDing20250606，接南昌中心需求，翻转的数据进MPR之前需保持原来的页码
      //   if (
      //     this.seriesInfo.ifRevers &&
      //     this.seriesInfo.initViewMod === curViewMod &&
      //     !(!this.useCompatibility && this.isInMPR)
      //   ) {
      //     currentIndex = parseInt(((height - pointy) / height) * imageNum);
      //     currentIndex = imageNum - currentIndex - 1;
      //     curImageNum = imageNum - curImageNum - 1;
      //   }
      if (currentIndex < 0) {
        currentIndex = 0;
      }
      if (currentIndex > imageNum - 1) {
        currentIndex = imageNum - 1;
      }
      let num = currentIndex - curImageNum;

      if (!this.seriesInfo.isNotUniformSquence) {
        let { d: dp, thickness } = this.seriesInfo.volumeSpacing[curViewMod];
        if (!isSyncOthers) {
          num = (num * dp) / thickness;
        }
      }
      ACTIVEOPT.scrollHandle(this.currViewport, num);
    },
    throttledScrollPreNextHandle(key) {
      if (key === "Down") {
        this.scrollNextFn();
      } else {
        this.scrollPreFn();
      }
    },
    //上下翻页的按钮专用，如果是联动模式，需要翻多页
    scrollPreFn() {
      if (this.imageData.isCPR) return;
      // let num = 1; //暂时为1，之后需要计算具体翻几页
      // 根据imageData的curViewMod，计算curviewport下相同viewmod的数量
      // const mode = this.imageData.curViewMod;
      // const len =
      //   -1 *
      //   this.currViewport.imageDatas.filter((item) => item.curViewMod === mode)
      //     .length;
      ACTIVEOPT.scrollHandle(this.currViewport, -1);
    },
    //上下翻页的按钮专用，如果是联动模式，需要翻多页
    scrollNextFn() {
      if (this.imageData.isCPR) return;
      // let num = 1; //暂时为1，之后需要计算具体翻几页
      // 根据imageData的curViewMod，计算curviewport下相同viewmod的数量
      // const mode = this.imageData.curViewMod;
      // const len = this.currViewport.imageDatas.filter(
      //   (item) => item.curViewMod === mode,
      // ).length;
      ACTIVEOPT.scrollHandle(this.currViewport, 1);
    },
    //上翻1页
    scrollPre(num = -1) {
      if (this.imageData.isCPR) return;
      ACTIVEOPT.scrollHandle(this.currViewport, num);
    },
    //下翻1页
    scrollNext(num = 1) {
      if (this.imageData.isCPR) return;
      ACTIVEOPT.scrollHandle(this.currViewport, num);
    },
    scrollToTop() {
      if (this.isInMPR) return;
      let { curImageNum, curViewMod } = this.imageData;
      let showCur = curImageNum;
      let { volumeSpacing } = this.seriesInfo;
      if (volumeSpacing) {
        let { d: dp, thickness } = volumeSpacing[curViewMod];
        let dimStep = Number((thickness / dp).toFixed(2));
        showCur = Math.floor(curImageNum / dimStep);
      }

      ACTIVEOPT.scrollHandle(this.currViewport, -showCur, false);
    },
    scrollToBottom() {
      if (this.isInMPR) return;
      let { curImageNum, imageNum, curViewMod } = this.imageData;
      let showCur = curImageNum;
      let { volumeSpacing } = this.seriesInfo;
      if (volumeSpacing) {
        let { d: dp, thickness } = volumeSpacing[curViewMod];
        let dimStep = Number((thickness / dp).toFixed(2));
        showCur = Math.floor(curImageNum / dimStep);
        imageNum = Math.floor(imageNum / dimStep);
      }
      ACTIVEOPT.scrollHandle(this.currViewport, imageNum - showCur - 1, false);
    },
    updateFindResult() {
      let { crossPos, isVR, isCPR } = this.imageData;
      if (isVR || isCPR) return;
      if (crossPos && !this.seriesInfo.isMissInfo) {
        let newcrossImg = CROSS.getCrossForCatcher(
          crossPos,
          this.imageData,
          this.canvasSize,
          this.optCurrentPoint,
          this.isInMPR && !this.isInCPR && !this.useCompatibility,
        );
        if (newcrossImg) {
          let ctx = this.crossTool.getContext("2d");
          ctx.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
          ctx.drawImage(newcrossImg, 0, 0);
          this.findOptResult = newcrossImg.findOptResult;
        }
      } else {
        this.findOptResult = {};
        this.clearCrossTool();
      }
    },
    clearCrossTool() {
      let ctx = this.crossTool.getContext("2d");
      ctx.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
    },
    clickOptFn(item) {
      this.$emit("update:clickOpt", item);
    },
    clickOptFull(event) {
      if (event.target.closest(".el-checkbox")) {
        return; // 不处理复选框相关的点击事件
      }
      console.log(event, "event");
      this.clickOptFn("Full");
    },
    getWindowMouseType() {
      const mouseTypeStr = localStorage.getItem("vrShortcutKey");
      if (!mouseTypeStr) return null;

      const mouseMap = {
        left: 0,
        right: 2,
        middle: 1,
      };
      const mouseType = JSON.parse(mouseTypeStr);
      console.log(mouseType, "mousetype");
      let button = null;
      Object.entries(mouseType).forEach(([key, value]) => {
        if (value === "Window") button = mouseMap[key];
      });
      return button;
    },
    vrCursorDown(e) {
      let button = this.getWindowMouseType();
      console.log(button, "down");
      if (this.activeOpt === "Window") button = 0;
      this.optMouseDownFlag = e.button;
      if (button !== null) {
        this.vrMouseFlag = true;
        this.vrButton = button;
        this.optStartPoint = {
          x: e.offsetX,
          y: e.offsetY,
        };
      }
      console.log(e.button, "downbutton");
    },
    vrCursorMove(e) {
      if (this.vrMouseFlag) {
        if (this.optMouseDownFlag === this.vrButton) {
          this.optCurrentPoint = {
            x: e.offsetX,
            y: e.offsetY,
          };
          let imageData = ACTIVEOPT.Window(this);

          this.$emit("update:imageData", imageData);

          this.optStartPoint.x = this.optCurrentPoint.x;
          this.optStartPoint.y = this.optCurrentPoint.y;
        }
      }
    },
    vrCursorUp() {
      this.optStartPoint = {};
      this.optCurrentPoint = {};
      this.vrMouseFlag = false;
      this.vrButton = null;
      this.optMouseDownFlag = -1;
    },
    //down move up事件
    optHandleDown(e) {
      // if (this.imageData.isCPR) return;
      // 点击的close icon
      if (e.target.className.includes("close")) return;
      // VR 不进入默认的鼠标事件
      if (this.imageData.isVR) return;
      // e.preventDefault();
      // e.stopPropagation();

      this.optMouseDownFlag = e.button; //记录是鼠标右键||中键||左键
      this.optStartPoint = {
        x: e.offsetX,
        y: e.offsetY,
      };
      if (this.activeOpt === "ACross") {
        this.updateFindResult();
      }
      // if (this.imageData.isVR && !this.handleDownFlag) {
      //   this.handleDownFlag = true;
      //   bus.$emit("requestAnimation");
      // }

      if (e.touches && e.touches.length > 1) {
        this.moveStart.x = (e.touches[0].pageX + e.touches[1].pageX) / 2;
        this.moveStart.y = (e.touches[0].pageY + e.touches[1].pageY) / 2;
        this.vector.x = e.touches[0].pageX - e.touches[1].pageX;
        this.vector.y = e.touches[0].pageY - e.touches[1].pageY;

        const dx = e.touches[0].pageX - e.touches[1].pageX;
        const dy = e.touches[0].pageY - e.touches[1].pageY;
        this.zoomStart.x = this.zoomStart.y = Math.sqrt(dx * dx + dy * dy);
        this.zoomStart.y = Math.sqrt(dx * dx + dy * dy);

        this.rotateStart = (Math.atan2(dy, dx) * 180) / Math.PI;
      }
    },
    optHandleMove(e) {
      // if (this.imageData.isCPR) return;
      // e.preventDefault();
      // e.stopPropagation();
      this.optCurrentPoint = {
        x: e.offsetX,
        y: e.offsetY,
      };
      let val = this.MinCurrentSID ? "Page" : this.activeOpt;
      let imageData;
      if (this.optMouseDownFlag == -1) {
        //没有按键按下
        if (val === "ACross") {
          this.updateFindResult();
        }
        return false;
      }

      // if (this.imageData.isVR && this.handleDownFlag) {
      //   bus.$emit("updateLight");
      // }
      if (
        this.optMouseDownFlag === 0 ||
        (e.touches && e.touches.length === 1)
      ) {
        switch (val) {
          case "Window": {
            imageData = ACTIVEOPT.Window(this);
            break;
          }
          case "Pan": {
            if (this.imageData.isCPR) return;
            imageData = ACTIVEOPT.Pan(this);
            break;
          }
          case "Zoom": {
            imageData = ACTIVEOPT.Zoom(this);
            break;
          }
          case "Rotate": {
            imageData = ACTIVEOPT.Rotate(this);
            break;
          }
          case "Magnify": {
            imageData = ACTIVEOPT.Magnify(this);
            break;
          }
          case "Page": {
            //降帧率
            if (this.imageData.isCPR) return;
            if (Math.abs(this.optCurrentPoint.y - this.optStartPoint.y) > 3) {
              ACTIVEOPT.Page(this);
              this.optStartPoint.x = this.optCurrentPoint.x;
              this.optStartPoint.y = this.optCurrentPoint.y;
            }

            return;
          }
          case "ACross": {
            this.clearCrossTool();
            if (this.findOptResult.acrossPan) {
              //平移十字
              ACTIVEOPT.ACross(this.$parent, this.optCurrentPoint);
            } else if (this.findOptResult.acrossRotate) {
              //旋转十字
              ACTIVEOPT.RCross(
                this.$parent,
                this.optCurrentPoint,
                this.optStartPoint,
              );
              this.optStartPoint.x = this.optCurrentPoint.x;
              this.optStartPoint.y = this.optCurrentPoint.y;
            } else if (this.findOptResult.acrossThick) {
              //设置层厚
              ACTIVEOPT.TCross(
                this.$parent,
                this.optCurrentPoint,
                this.optStartPoint,
                this.findOptResult,
              );
            }
            return;
          }
          default: {
            return;
          }
        }
      } else if (this.optMouseDownFlag == 1 && !this.imageData.isVR) {
        switch (this.catcherShortcutKey.middle) {
          case "Window": {
            imageData = ACTIVEOPT.Window(this);
            break;
          }
          case "Pan": {
            if (this.imageData.isCPR) return;
            imageData = ACTIVEOPT.Pan(this);
            break;
          }
          case "Zoom": {
            imageData = ACTIVEOPT.Zoom(this);
            break;
          }
          case "Rotate": {
            imageData = ACTIVEOPT.Rotate(this);
            break;
          }
          case "Magnify": {
            imageData = ACTIVEOPT.Magnify(this);
            break;
          }
          case "Page": {
            //降帧率
            if (this.imageData.isCPR) return;
            if (Math.abs(this.optCurrentPoint.y - this.optStartPoint.y) > 3) {
              ACTIVEOPT.Page(this);
              this.optStartPoint.x = this.optCurrentPoint.x;
              this.optStartPoint.y = this.optCurrentPoint.y;
            }
            return;
          }
        }
      } else if (this.optMouseDownFlag == 2 && !this.imageData.isVR) {
        switch (this.catcherShortcutKey.right) {
          case "Window": {
            imageData = ACTIVEOPT.Window(this);
            break;
          }
          case "Pan": {
            if (this.imageData.isCPR) return;
            imageData = ACTIVEOPT.Pan(this);
            break;
          }
          case "Zoom": {
            imageData = ACTIVEOPT.Zoom(this);
            break;
          }
          case "Rotate": {
            imageData = ACTIVEOPT.Rotate(this);
            break;
          }
          case "Magnify": {
            imageData = ACTIVEOPT.Magnify(this);
            break;
          }
          case "Page": {
            //降帧率
            if (this.imageData.isCPR) return;
            if (Math.abs(this.optCurrentPoint.y - this.optStartPoint.y) > 3) {
              ACTIVEOPT.Page(this);
              this.optStartPoint.x = this.optCurrentPoint.x;
              this.optStartPoint.y = this.optCurrentPoint.y;
            }
            return;
          }
        }
      } else if (e.touches && e.touches.length > 1) {
        const dx = e.touches[0].pageX - e.touches[1].pageX;
        const dy = e.touches[0].pageY - e.touches[1].pageY;
        const rotateDatax = this.getRotateAngle(
          this.vector.x,
          this.vector.y,
          e.touches[0].pageX - this.moveStart.x,
          e.touches[0].pageY - this.moveStart.y,
        );
        const rotateDatay = this.getRotateAngle(
          -this.vector.x,
          -this.vector.y,
          e.touches[1].pageX - this.moveStart.x,
          e.touches[1].pageY - this.moveStart.y,
        );
        let imageData = { ...this.imageData };
        if (rotateDatax * rotateDatay < 0) {
          imageData.translate.x =
            (e.touches[0].pageX + e.touches[1].pageX) / 2 -
            this.moveStart.x +
            imageData.translate.x;
          imageData.translate.y =
            (e.touches[0].pageY + e.touches[1].pageY) / 2 -
            this.moveStart.y +
            imageData.translate.y;
        } else {
          let rotate =
            (Math.atan2(dy, dx) * 180) / Math.PI -
            this.rotateStart +
            (imageData.rotate * 180) / Math.PI;
          rotate = rotate % 360;
          if (rotate < -180) {
            rotate = rotate + 360;
          } else if (rotate > 180) {
            rotate = rotate - 360;
          }
          rotate = (rotate * Math.PI) / 180;
          imageData.rotate = rotate;
        }
        const zoom = Math.sqrt(dx * dx + dy * dy) / this.zoomStart.x;
        imageData.scale.x = zoom * imageData.scale.x;
        imageData.scale.y = zoom * imageData.scale.y;

        this.moveStart.x = (e.touches[0].pageX + e.touches[1].pageX) / 2;
        this.moveStart.y = (e.touches[0].pageY + e.touches[1].pageY) / 2;
        this.vector.x = e.touches[0].pageX - e.touches[1].pageX;
        this.vector.y = e.touches[0].pageY - e.touches[1].pageY;

        this.zoomStart.x = Math.sqrt(dx * dx + dy * dy);
        this.zoomStart.y = Math.sqrt(dx * dx + dy * dy);

        this.rotateStart = (Math.atan2(dy, dx) * 180) / Math.PI;
      }

      if (
        !this.imageData.isVR ||
        (this.imageData.isVR && this.activeOpt === "Window")
      ) {
        console.log(imageData, "udpateimagedata");
        this.$emit("update:imageData", imageData);
      }
      this.optStartPoint.x = this.optCurrentPoint.x;
      this.optStartPoint.y = this.optCurrentPoint.y;
    },
    optHandleUp(e) {
      // if (this.imageData.isVR && this.handleDownFlag) {
      //   this.handleDownFlag = false;
      //   // this.cancelAnimation();
      //   bus.$emit("cancelAnimation");
      // }
      // if (this.imageData.isCPR) return;
      this.optCurrentPoint = {
        x: e.offsetX,
        y: e.offsetY,
      };
      if (this.optMouseDownFlag == 2 || this.optMouseDownFlag == 1) {
        this.clearCrossTool();
      }
      if (this.activeOpt === "Magnify") {
        this.imageData.magnifyPoint.x = -1;
        this.imageData.magnifyPoint.y = -1;
      }
      if (this.optMouseDownFlag === 0) {
        if (
          this.activeOpt === "ACross" &&
          !this.MinCurrentSID &&
          this.findOptResult.acrossPan
        ) {
          const otherShortcutKey = JSON.parse(
            localStorage.getItem("otherShortcutKey"),
          );
          if (otherShortcutKey.isCrossClickPositioning === "yes") {
            ACTIVEOPT.ACross(this.$parent, this.optCurrentPoint);
          }
        }
      }

      let mouseKey;
      switch (this.optMouseDownFlag) {
        case 1:
          mouseKey = "middle";
          break;
        case 2:
          mouseKey = "right";
          break;
      }
      if (mouseKey && this.catcherShortcutKey[mouseKey] === "Magnify") {
        this.imageData.magnifyPoint.x = -1;
        this.imageData.magnifyPoint.y = -1;
      }

      this.findOptResult = 0;
      this.optMouseDownFlag = -1;
      this.optStartPoint = {};
      // this.optCurrentPoint = {};
    },
    //获取两线夹角
    getRotateAngle(x1, y1, x2, y2) {
      var epsilon = 1.0e-6;
      var nyPI = Math.acos(-1.0);
      var dist, dot, degree, angle;

      // normalize
      dist = Math.sqrt(x1 * x1 + y1 * y1);
      x1 /= dist;
      y1 /= dist;
      dist = Math.sqrt(x2 * x2 + y2 * y2);
      x2 /= dist;
      y2 /= dist;
      // dot product
      dot = x1 * x2 + y1 * y2;
      if (Math.abs(dot - 1.0) <= epsilon) {
        angle = 0.0;
      } else if (Math.abs(dot + 1.0) <= epsilon) {
        angle = nyPI;
      } else {
        var cross;
        angle = Math.acos(dot);
        cross = x1 * y2 - x2 * y1;
        if (cross < 0) {
          angle = 2 * nyPI - angle;
        }
      }
      degree = (angle * 180.0) / nyPI;
      if (0 <= degree && degree < 180) {
        degree = -degree;
      } else {
        degree = 360 - degree;
      }
      return degree;
    },
    changeVie() {
      this.$emit("changeVie");
    },
    setVR() {
      if (this.imageData.isVR) {
        this.$emit("update:setvrShow", true);
        this.showOption = false;
      }
    },

    setScrollPosition() {
      let { imageNum, curImageNum, curViewMod } = this.imageData;
      if (!this.isInMPR) {
        DATA.getOneWLS(this.imageData, this.seriesInfo);
      }
      //BuDing20250606，接南昌中心需求，翻转的数据进MPR之前需保持原来的页码
      //   if (
      //     this.seriesInfo.ifRevers &&
      //     this.seriesInfo.initViewMod === curViewMod &&
      //     !(!this.useCompatibility && this.isInMPR)
      //   ) {
      //     curImageNum = imageNum - curImageNum - 1;
      //   }

      if (this.seriesInfo.isNotUniformSquence) {
        this.imageData.scale = CLICKOPT.getFullScale(
          this.canvasSize,
          curViewMod,
          this.seriesInfo,
          curImageNum,
        );
      }
      if (imageNum === 0) return;
      const catcherDOM = this.$refs.catcher;
      const sidebarDOM = catcherDOM.querySelector(".sidebar");
      const height = sidebarDOM.clientHeight;
      if (height <= 0) return;
      let temp = (curImageNum / imageNum) * height;
      if (temp < 4) {
        temp = 4;
      } else if (temp > height - 9) {
        temp = height - 9;
      }
      this.currentScrollPosition = parseInt(temp) + "px";
    },
    drop(event) {
      if (this.isMini) return;

      const series = JSON.parse(event.dataTransfer.getData("series"));
      const cvp = this.currViewport;
      const currModality = cvp.seriesInfos[cvp.canvasNow]["model"];

      this.$emit("dropSeries", { currentSID: series.seriesId });
    },
    getImageNum(imageData, seriesInfo) {
      let { curImageNum, imageNum, curViewMod } = imageData;
      if (curImageNum === undefined || imageNum === undefined || this.showVR)
        return "";
      let showCur = curImageNum;
      let { volumeSpacing } = seriesInfo;
      if (volumeSpacing) {
        let { d: dp, thickness } = volumeSpacing[curViewMod];
        let dimStep = Number((thickness / dp).toFixed(2));
        showCur = Math.floor(curImageNum / dimStep);
      }
      return showCur;
    },
    handleChangeStitching() {
      if (!["CR", "DR", "DX"].includes(this.seriesInfo.model)) {
        return this.$layer("请选择CR、DR、DX模态的图像", undefined, "warn");
      }
      // 唯一id，seriesId-视图-页数
      const imageNum = this.getImageNum(this.imageData, this.seriesInfo);
      const stitchingId = `${this.seriesInfo.currentSID}-${this.imageData.curViewMod}-${imageNum}`;
      const list = [...this.imageStitchingList];
      const index = list.findIndex((v) => v.stitchingId === stitchingId);
      if (index === -1) {
        list.push({
          imageData: this.imageData,
          seriesInfo: this.seriesInfo,
          stitchingId,
          params: {
            rotate: 0,
            scale: 1,
            translate: {
              x: 0,
              y: 0,
            },
          },
        });
      } else {
        list.splice(index, 1);
      }
      this.setImageStitching(list);
    },
  },
  watch: {
    //张数更新时 更新滚动条位置
    needUpdScrollPosition: {
      handler() {
        this.$nextTick(() => {
          this.setScrollPosition();
        });
      },
      deep: true,
      immediate: true,
    },
    "imageData.crossPos": {
      handler() {
        if (this.activeOpt === "ACross" && this.optMouseDownFlag === -1) {
          //没有键按下
          this.updateFindResult();
        }
      },
      deep: true,
    },
    "imageData.curViewMod": {
      handler() {
        if (this.activeOpt === "ACross" && this.optMouseDownFlag === -1) {
          //没有键按下
          this.clearCrossTool();
        }
      },
      deep: true,
    },
    "imageData.isVR": {
      handler(val) {
        console.log(val, "isVR change");
        if (val === 0) {
          const catcherStr = localStorage.getItem("catcherShortcutKey");
          if (!catcherStr) this.$emit("update:activeOpt", "Page");
          const obj = JSON.parse(catcherStr);
          this.$emit("update:activeOpt", obj.left);
        } else if (val === 1) {
          const str = localStorage.getItem("vrShortcutKey");
          if (!str) this.$emit("update:activeOpt", "Rotate");
          const obj = JSON.parse(str);
          this.$emit("update:activeOpt", obj.left);
        }
      },
    },
    mprMipOpt() {
      this.$emit("update:vtkBlendMod", Number(this.mprMipOpt));
    },
    showIcon(val) {
      if (!val) {
        this.showOption = false;
      }
    },
    thicknessX(val) {
      flag = false;
      if (this.mprThicknessSync && !flag) {
        this.thicknessY = val;
        let dic = CROSS.dicForThick[this.imageData.curViewMod];
        const dics = ["thickS", "thickT", "thickC"];
        let left = dics.filter((item) => !Object.values(dic).includes(item));
        this.AcrossPoint[left[0]] = val;
      }
    },
    thicknessY(val) {
      flag = true;
      if (this.mprThicknessSync && flag) {
        this.thicknessX = val;
        let dic = CROSS.dicForThick[this.imageData.curViewMod];
        const dics = ["thickS", "thickT", "thickC"];
        let left = dics.filter((item) => !Object.values(dic).includes(item));
        this.AcrossPoint[left[0]] = val;
      }
    },
    // 过滤图像拼接列表
    imageData() {
      const viewportListValue = Object.values(this.viewportList);
      const stitchingIdList = [];
      viewportListValue.forEach((item) => {
        item.imageDatas.forEach((v, i) => {
          const imageNum = this.getImageNum(v, item.seriesInfos[i]);
          stitchingIdList.push(
            `${item.currentSID}-${v.curViewMod}-${imageNum}`,
          );
        });
      });
      let list = [...this.imageStitchingList];
      list = list.filter((v) => stitchingIdList.includes(v.stitchingId));
      this.setImageStitching(list);
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./viewer-catcher.scss";
</style>
