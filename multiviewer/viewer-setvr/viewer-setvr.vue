<template>
  <div id="setvr" :style="style">
    <div class="vrHead">
      <p>{{ $t("VR.title") }}</p>
      <span class="close" @click.stop="close"></span>
    </div>
    <div class="vrContent" @mousedown.stop>
      <div :class="{ color: true, line_down: !lineShow }">
        <div class="title" @click.stop="lineShow = !lineShow">
          {{ $t("VR.customCurve") }}
          <svg-icon
            :name="iconName('round-arrow')"
            :class="{ down: lineShow }"
          />
          <!-- <img src="./images/up.png" alt="" :class="{ down: lineShow }" /> -->
        </div>
        <vr-clut
          ref="clut"
          v-show="lineShow"
          :windowWidthLevel.sync="imgProps.windowWidthLevel"
          :imageDataArray="imageDataArray"
          :imageDataRange="dataRange"
          :clutSize="clutSize"
          :isCLUTActive.sync="clutActive"
          :isCLUTPreActive.sync="clutPreActive"
          :colorPreset="colorPreset"
          @setColorPreset="setColorPreset"
          :requestAnimation="requestAnimation"
          :cancelAnimation="cancelAnimation"
        ></vr-clut>
        <div class="lineMesage" v-show="lineShow">
          <div class="addBox">
            <input type="text" v-model="presetName" />
            <div class="addBtn" @click.stop="addColorPreset">
              {{ $t("VR.new") }}
            </div>
          </div>
          <div class="lineList">
            <div
              :class="{
                line: true,
                line_check: colorPreset.Name === item.Name,
              }"
              @click.stop="checkColorPreset(item.Name)"
              v-for="item in colorPresetList"
              :key="item.Name"
            >
              <div class="name" :title="item.Name">{{ item.Name }}</div>
              <span class="del" @click.stop="delColorPreset(item.Name)"></span>
              <span
                class="save"
                @click.stop="saveColorPreset(item.Name)"
              ></span>
            </div>
          </div>
        </div>
      </div>
      <div :class="{ colore_presets: true, colore_presets_down: !coloreShow }">
        <div
          class="title"
          style="margin-bottom: 0"
          @click.stop="coloreShow = !coloreShow"
        >
          {{ $t("VR.presets") }}
          <svg-icon
            :name="iconName('round-arrow')"
            :class="{ down: coloreShow }"
          />
        </div>
        <div class="main" v-show="coloreShow">
          <div :class="{ content: true, 'content-expand': true }">
            <!-- <div @click.stop="widgetExpand = !widgetExpand">
              <svg-icon :name="iconName('expand')" />
            </div> -->
            <div
              class="imageBox"
              v-for="item in thumbList"
              :key="item.name"
              @click.stop="changePreset(item.name)"
            >
              <img :src="item.src" :alt="item.name" />
              <div
                class="imgBorder"
                v-if="imageData.presetName == item.name"
              ></div>
              <p>{{ item.name }}</p>
            </div>
          </div>
          <!-- <div :class="{ widget: true, hidden: !widgetExpand }">
            <div v-show="widgetExpand">
              <div ref="widget"></div>
              <slider
                :mappingRange="mappingRange"
                :fullMappingRange="fullMappingRange"
                :rgbPoints="rgbPoints"
                :step="colorSliderStep"
                @input="onColorMappingUpdate"
                @change="onColorMappingFinalize"
              />
            </div>
          </div> -->
        </div>
      </div>
      <div class="cinematic">
        <div class="title" @click.stop="paramsShow = !paramsShow">
          {{ $t("VR.params") }}
          <svg-icon
            :name="iconName('round-arrow')"
            :class="{ down: paramsShow }"
          />
        </div>
        <div v-show="paramsShow" class="cinematic-content">
          <div class="left">
            <div class="block">
              <span>{{ $t("VR.ambient") }}</span>
              <c-slider
                class="slider"
                :value.sync="vrParams.Ambient"
                :min="0"
                :max="1"
                :step="0.1"
              />
            </div>
            <div class="block">
              <span>{{ $t("VR.diffuse") }}</span>
              <c-slider
                class="slider"
                :value.sync="vrParams.Diffuse"
                :min="0"
                :max="2"
                :step="0.1"
              />
            </div>
            <div class="block">
              <el-switch v-model="vrParams.lightFollowsCamera" />
              <div style="margin-left: 7px">
                {{ $t("VR.lightFollowCamera") }}
              </div>
            </div>
          </div>
          <div class="right">
            <div class="radio-wrapper">
              <div
                :class="{
                  'radio-btn': true,
                  active: tabPosition === 'Standard',
                }"
                @click="tabPosition = 'Standard'"
              >
                {{ $t("VR.standard") }}
              </div>
              <div
                :class="{ 'radio-btn': true, active: tabPosition === 'hybrid' }"
                @click="tabPosition = 'hybrid'"
              >
                {{ $t("VR.hybrid") }}
              </div>
              <div
                :class="{
                  'radio-btn': true,
                  active: tabPosition === 'Ambient occlusion',
                }"
                @click="tabPosition = 'Ambient occlusion'"
              >
                {{ $t("VR.ambientOcclusion") }}
              </div>
              <!-- <el-radio-group v-model="tabPosition">
                <el-radio-button label="STandard">标准</el-radio-button>
                <el-radio-button label="hybrid">混合</el-radio-button>
                <el-radio-button label="Ambient occlusion"
                  >环境遮挡</el-radio-button
                >
              </el-radio-group> -->
            </div>
            <div v-if="tabPosition === 'Ambient occlusion'">
              <div class="block">
                <span>{{ $t("VR.size") }}</span>
                <c-slider
                  class="slider"
                  :value.sync="vrParams.Size"
                  :min="2"
                  :max="10"
                  :step="1"
                ></c-slider>
              </div>
              <div class="block">
                <span>{{ $t("VR.radius") }}</span>
                <c-slider
                  class="slider"
                  :value.sync="vrParams.Radius"
                  :min="vrParams.Size * 2"
                  :max="vrParams.Size * 2 + 10"
                  :step="1"
                ></c-slider>
              </div>
            </div>
            <div v-if="tabPosition === 'hybrid'">
              <div class="block">
                <span>{{ $t("VR.blending") }}</span>
                <c-slider
                  class="slider"
                  :value.sync="vrParams.Blending"
                  :min="0"
                  :max="1"
                  :step="0.05"
                ></c-slider>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="bg-color">
        <div class="title" @click.stop="bgColorShow = !bgColorShow">
          {{ $t("VR.background") }}
          <svg-icon
            :name="iconName('round-arrow')"
            :class="{ down: bgColorShow }"
          />
        </div>
        <div v-show="bgColorShow" class="bg-color-content">
          <div class="label">{{ $t("VR.color") }}:</div>
          <div class="color-wrapper">
            <div
              v-for="color in VRColors"
              :class="{ 'color-block': true, active: color === activeColor }"
              :key="color"
              :style="{ background: color }"
              @click="setBgColor(color)"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import {
  // initWidget,
  changeColorRange,
  // updateWidget,
  updatePreset,
  updateTransferFuncs,
  wwwlNewPresetObj,
  getWWWLFromEffectiveRange,
  initTransferFuncs,
} from "../js/vr/pwf";
// import slider from "./slider/slider.vue";
import CSlider from "../viewer-catcher/slider.vue";
import clutEditor from "./vr-clut/vr-clut";
// import SERVER from "./vr-clut/js/server";
import { mapState } from "vuex";
import { throttle } from "../js/utils";
import bus from "@/assets/js/bus.js";
import { VRColors } from "./constant";
import _COLORPRESETS from "../../../assets/js/MedicalColorPresets";
export default {
  name: "setvr",
  props: {
    setvrShow: { default: false },
    imgPoor: {},
    canvasRange: {
      required: true,
    },
    seriesInfo: {},
    imageData: {},
    activeOpt: String,
  },
  components: {
    // slider,
    CSlider,
    "vr-clut": clutEditor,
  },
  created() {
    const vrParams = localStorage.getItem("cvrParams");
    if (vrParams) {
      const params = JSON.parse(vrParams);
      if (params.Radius > params.Size * 2 + 10) {
        params.Radius = params.Size * 2 + 10;
      }
      this.$store.commit("setVrParams", params);
      console.log(this.vrParams, "setvr");
      if (
        this.vrParams.useLocalAmbientOcclusion &&
        !this.vrParams.useVolumetricScatteringBlending
      )
        this.tabPosition = "Ambient occlusion";
      if (
        !this.vrParams.useLocalAmbientOcclusion &&
        this.vrParams.useVolumetricScatteringBlending
      )
        this.tabPosition = "hybrid";
    }
    const colorPreset = localStorage.getItem("colorPreset");
    if (colorPreset) {
      this.colorPresetList = JSON.parse(localStorage.colorPreset);
    }

    bus.$on("renderReady", (renderer) => {
      this.fullScreenRenderer = renderer;
      let rep = this.fullScreenRenderer.getRenderer();
      const volume = rep.getVolumes()[0];
      const mapper = volume.getMapper();
      const renderData = mapper.getInputData();
      const scalars = renderData.getPointData().getScalars();
      const range = scalars.getRange();
      this.imageDataArray = scalars.getData();
      this.dataRange = range;

      // initPreset
      let defaultPreset = _COLORPRESETS.find(
        (item) => item.Name === this.imageData.presetName,
      );
      if (!defaultPreset) {
        const presets = JSON.parse(localStorage.getItem("colorPreset"));
        defaultPreset = presets.find(
          (item) => item.Name === this.imageData.presetName,
        );
      }

      const list = this.presetToClutList(defaultPreset);
      this.colorPreset = {
        ...defaultPreset,
        list,
      };
      const [ww, wl] = getWWWLFromEffectiveRange(this.colorPreset);
      this.$emit("updateWWWL", {
        ww,
        wl,
      });
      // initWidget(this);
      initTransferFuncs(this);
    });

    bus.$on("resetVR", () => {
      const preObj = this.getPresetByName(this.imageData.presetName);
      const list = this.presetToClutList(preObj);
      this.colorPreset = {
        ...preObj,
        list,
      };
      const [ww, wl] = getWWWLFromEffectiveRange(this.colorPreset);
      this.$emit("updateWWWL", {
        ww,
        wl,
      });
    });
  },
  mounted() {
    this.$follow_mouse("setvr");
    this.handleChangePreset = throttle(changeColorRange, 50);
  },
  beforeDestroy() {
    bus.$off("renderReady");
    bus.$off("resetVR");
    this.fullScreenRenderer?.delete();
    this.fullScreenRenderer = null;
    this.widget?.delete();
    this.lookupTable?.delete();
    this.pwfCleaner?.();
  },
  data() {
    return {
      lineShow: true,
      coloreShow: true,
      tabPosition: "Ambient occlusion",
      thumbList: [],
      imageDataArray: null,
      dataRange: null,
      lookupTable: null,
      widget: null,
      pwfCleaner: null,
      pwfFunc: null,
      fullMappingRange: [],
      imageDataRange: [],
      rgbPoints: [],
      mappingRange: [0, 0],

      clutSize: { width: 368, height: 150, top: 0, left: 0 },
      clutActive: true,
      clutPreActive: false,
      // SERVER,
      imgProps: {
        translate: { x: 0, y: 0 }, //图像中心相对于画布中心的平移距离
        scale: { x: 2, y: 2 }, //图像相对于原始的大小的缩放倍数
        rotate: 0, //图像相对于自己中心的旋转角度
        windowWidthLevel: { windowWidth: 0, windowLevel: 0 },
        magnifyPoint: { x: 0, y: 0 },
      },
      colorPreset: {
        Name: null,
        NanColor: [1, 1, 0],
        ColorSpace: "RGB",
        AbsoluteRange: true,
        OpacityPoints: [],
        RGBPoints: [],
        EffectiveRange: [0, 0],
        list: [],
      },
      presetName: null,
      colorPresetList: [],
      fullScreenRenderer: null,
      widgetExpand: true,
      paramsShow: true,
      bgColorShow: true,
      VRColors,
      activeColor: "rgb(0,0,0)",
      currPresetName: "",
      isAnimate: false,
    };
  },
  computed: {
    ...mapState(["scaleRatio", "vrParams", "theme", "VRTrans"]),
    style() {
      return {
        height: `calc(1 / ${this.scaleRatio} * (100% - ${this.canvasRange.RBTopWidth}px - ${this.canvasRange.RBBottomWidth}px))`,
        top: `${this.canvasRange.RBTopWidth}px`,
        transform: `scale(${this.scaleRatio})`,
        transformOrigin: "100% 0",
      };
    },
    colorSliderStep() {
      const [low, high] = this.imageDataRange;
      const width = high - low;
      const step = Math.min(1, width / 256);
      return step > 1 ? Math.round(step) : step;
    },
    wwwl() {
      if (this.imageData) {
        return {
          ww: this.imageData.ww,
          wl: this.imageData.wl,
        };
      }
      return {};
    },
  },
  methods: {
    iconName(name) {
      return this.theme === "light" ? `${name}-light` : name;
    },
    delColorPreset(name) {
      let index = this.colorPresetList.findIndex((item) => item.Name === name);
      if (this.colorPreset.Name === name) {
        if (this.colorPresetList.length > 1) {
          let i = index - 1 >= 0 ? index - 1 : 1;
          this.checkColorPreset(this.colorPresetList[i].Name);
        } else {
          this.colorPreset = {
            Name: null,
            NanColor: [1, 1, 0],
            ColorSpace: "RGB",
            AbsoluteRange: true,
            OpacityPoints: [],
            RGBPoints: [],
            EffectiveRange: [0, 0],
            list: [],
          };
          this.changePreset("CT-AAA");
        }
      }

      this.colorPresetList.splice(index, 1);
      localStorage.colorPreset = JSON.stringify(this.colorPresetList);
    },
    addColorPreset() {
      if (!this.presetName) return console.log("输入曲线名称");
      let arr = this.colorPresetList;
      let colorPreset = arr.find((item) => item.Name === this.presetName);
      if (colorPreset) {
        return console.log("曲线已存在");
      }

      // this.colorPreset = {
      //   Name: this.presetName,
      //   NanColor: [1, 1, 0],
      //   ColorSpace: "RGB",
      //   AbsoluteRange: true,
      //   OpacityPoints: [],
      //   RGBPoints: [],
      //   EffectiveRange: [0, 0],
      //   list: [],
      // };
      this.colorPreset.Name = this.presetName;
      this.colorPresetList.push(JSON.parse(JSON.stringify(this.colorPreset)));
      localStorage.colorPreset = JSON.stringify(this.colorPresetList);
      this.$nextTick(() => {
        this.checkColorPreset(this.presetName);
        this.presetName = "";
      });
    },
    saveColorPreset(name) {
      let arr = this.colorPresetList;
      let obj = arr.find((item) => item.Name === name);
      if (!obj) return;
      if (obj) {
        Object.keys(this.colorPreset).forEach((key) => {
          obj[key] = this.colorPreset[key];
        });
      }
      localStorage.setItem("colorPreset", JSON.stringify(this.colorPresetList));
      this.checkColorPreset(name, true);
    },
    checkColorPreset(name, isSave = false) {
      if (name === this.imageData.presetName && !isSave) return;
      let obj = this.colorPresetList.find((item) => item.Name === name);
      Object.keys(obj).forEach((key) => {
        this.colorPreset[key] = obj[key];
      });

      this.$emit("changeVRPara", { presetName: name });

      // 同步到widget上
      console.log(this.colorPreset, "preset");
      // changePreset(this, name, this.lookupTable);

      this.$nextTick(() => {
        const preObj = this.getPresetByName(name);
        // updateWidget(this, preObj);
        updateTransferFuncs(this, preObj);
      });
    },
    setColorPreset(list) {
      let obj = {
        NanColor: [1, 1, 0],
        ColorSpace: "RGB",
        AbsoluteRange: true,
        OpacityPoints: [],
        RGBPoints: [],
        EffectiveRange: [0, 0],
        list: JSON.parse(JSON.stringify(list)),
      };
      let arr = [];
      for (let item of list) {
        let color = this.colorRGB(item.color);
        obj.OpacityPoints.push(item.value);
        obj.OpacityPoints.push(item.opacity);
        obj.RGBPoints.push(item.value);
        obj.RGBPoints.push(...color);
        arr.push(item.value);
      }
      if (this.colorPreset.EffectiveRange) {
        obj.EffectiveRange = [...this.colorPreset.EffectiveRange];
      } else {
        arr.sort((a, b) => a - b);
        if (arr[0] < -3000) {
          obj.EffectiveRange[0] = arr[1];
        } else {
          obj.EffectiveRange[0] = arr[0];
        }
        if (arr[arr.length - 1] > 3000) {
          obj.EffectiveRange[1] = arr[arr.length - 2];
        } else {
          obj.EffectiveRange[1] = arr[arr.length - 1];
        }
      }
      Object.keys(obj).forEach((key) => {
        this.colorPreset[key] = obj[key];
      });
      updateTransferFuncs(this, this.colorPreset);
    },
    toColorHex(colorRGB) {
      const rgb = colorRGB.map((item) => Math.round(item * 255));
      return (
        "#" + rgb.map((item) => item.toString(16).padStart(2, "0")).join("")
      );
    },
    presetToClutList(colorPreset) {
      const list = [];
      const { OpacityPoints, RGBPoints } = colorPreset;
      for (let i = 0; i < OpacityPoints.length; i += 2) {
        const value = OpacityPoints[i];
        const opacity = OpacityPoints[i + 1];
        let obj = {
          value,
          opacity,
          position: { top: 0, left: 0 },
        };
        list.push(obj);
      }
      for (let i = 0; i < RGBPoints.length; i += 4) {
        const color = this.toColorHex(RGBPoints.slice(i + 1, i + 4));
        if (list[Math.floor(i / 4)]) list[Math.floor(i / 4)].color = color;
      }
      list.forEach((item) => {
        if (!item.color) item.color = "#ffffff";
      });
      return list;
    },
    setBgColor(color) {
      this.activeColor = color;
      bus.$emit("changeBgColor", color);
    },
    colorRGB(color) {
      // 16进制颜色值的正则
      let reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
      // 把颜色值变成小写
      color = color.toLowerCase();
      if (reg.test(color)) {
        // 如果只有三位的值，需变成六位，如：#fff => #ffffff
        if (color.length === 4) {
          let colorNew = "#";
          for (let i = 1; i < 4; i += 1) {
            colorNew += color.slice(i, i + 1).concat(color.slice(i, i + 1));
          }
          color = colorNew;
        }
        // 处理六位的颜色值，转为RGB
        let colorChange = [];
        for (let i = 1; i < 7; i += 2) {
          colorChange.push(
            Number((parseInt("0x" + color.slice(i, i + 2)) / 255).toFixed(6)),
          );
        }

        return colorChange;
      } else {
        return color;
      }
    },
    onColorMappingUpdate(range) {
      if (this.lookupTable && this.imageData.presetName) {
        this.handleChangePreset?.(this, this.lookupTable, range);
      }
    },
    onColorMappingFinalize() {},
    close() {
      this.$emit("update:setvrShow", false);
    },
    getPresetByName(presetName) {
      let preObj = _COLORPRESETS.find((ele) => ele.Name === presetName);
      if (!preObj) {
        preObj = this.colorPreset;
      }
      return preObj;
    },
    changePreset(presetName) {
      if (presetName === this.imageData.presetName) return;
      this.$emit("changeVRPara", { presetName: presetName });
      const defaultPreset = _COLORPRESETS.find(
        (item) => item.Name === presetName,
      );

      const list = this.presetToClutList(defaultPreset);
      console.log(list, "presetlist");
      this.colorPreset = {
        ...defaultPreset,
        list,
      };
      // this.colorPreset = {
      //   ...defaultPreset,
      //   list: []
      // };
      this.$nextTick(() => {
        const preObj = this.getPresetByName(presetName);
        const [ww, wl] = getWWWLFromEffectiveRange(preObj);
        this.$emit("updateWWWL", {
          ww,
          wl,
        });
        // updateWidget(this, preObj);
        updateTransferFuncs(this, preObj);
      });
    },
    requestAnimation() {
      if (!this.fullScreenRenderer || !this.isAnimate) return;
      const renderWindow = this.fullScreenRenderer.getRenderWindow();
      renderWindow.getInteractor().requestAnimation(this.pwfFunc);
      console.log("requestAnimation pwf");
      this.isAnimate = true;
    },
    cancelAnimation() {
      if (!this.fullScreenRenderer || this.isAnimate) return;
      const renderWindow = this.fullScreenRenderer.getRenderWindow();
      renderWindow.getInteractor().cancelAnimation(this.pwfFunc);
      console.log("cancelAnimation pwf");
      this.isAnimate = false;
    },
  },
  watch: {
    // theme() {
    //   const preObj = this.getPresetByName(this.imageData.presetName);
    //   if (this.setvrShow) updateWidget(this, preObj);
    // },
    tabPosition() {
      if (this.tabPosition === "Ambient occlusion") {
        this.vrParams.useLocalAmbientOcclusion = true;
        this.vrParams.useVolumetricScatteringBlending = false;
        this.vrParams.Blending = 0;
      }
      if (this.tabPosition === "hybrid") {
        this.vrParams.useLocalAmbientOcclusion = false;
        this.vrParams.useVolumetricScatteringBlending = true;
        this.vrParams.Size = 3;
        this.vrParams.Radius = 6;
      }
    },
    "vrParams.Size": {
      handler(val) {
        const radius = this.vrParams.Radius;
        if (radius < val * 2) {
          this.vrParams.Radius = val * 2;
        }
      },
    },
    setvrShow(val) {
      if (val) {
        if (!this.fullScreenRenderer) return;
        //初始化预览图
        let { currentSID } = this.seriesInfo;
        let imgPoorObj = this.imgPoor[currentSID];
        this.thumbList = imgPoorObj.thumbList ? imgPoorObj.thumbList : [];
        if (this.thumbList.length > 0) {
          this.coloreShow = true;
        }

        let defaultPreset = _COLORPRESETS.find(
          (item) => item.Name === this.imageData.presetName,
        );
        if (!defaultPreset) {
          const presets = JSON.parse(localStorage.getItem("colorPreset"));
          defaultPreset = presets.find(
            (item) => item.Name === this.imageData.presetName,
          );
        }

        const list = this.presetToClutList(defaultPreset);
        this.colorPreset = {
          ...defaultPreset,
          list,
        };
        // 初始化widget
        // initWidget(this);
      }
    },
    wwwl: {
      handler(val, old) {
        if (val.ww === old.ww && val.wl == old.wl) return false;
        if (this.currPresetName !== this.imageData.presetName) {
          this.currPresetName = this.imageData.presetName;
          return false;
        }
        if (!this.imageData.isVR) return false;
        // if (this.widget) {
        // const preObj = this.getPresetByName(this.imageData.presetName);
        const newPreObj = wwwlNewPresetObj(this.colorPreset, val.ww, val.wl);
        const list = this.presetToClutList(newPreObj);
        this.colorPreset.list = list;
        updatePreset(this, newPreObj, this.pwfFunc, this.lookupTable);

        // this.widget.setOpacityPoints(opPoints);
        // this.widget.render();
        // }
      },
      deep: true,
    },
    activeOpt(val) {
      if (!this.fullScreenRenderer || !this.imageData.isVR) return;
      // const renderWindow = this.fullScreenRenderer.getRenderWindow();
      if (val === "Window") {
        // renderWindow.getInteractor().requestAnimation(this.pwfFunc);
        this.requestAnimation();
      } else if (val !== "Window" && this.pwfFunc) {
        this.cancelAnimation();
      }
    },
  },
};
</script>
<style lang="scss" scoped>
@import "./viewer-setvr.scss";
</style>
