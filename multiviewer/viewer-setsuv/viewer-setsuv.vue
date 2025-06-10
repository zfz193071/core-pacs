<template>
  <div id="setsuv" :class="{ vertical }" :style="style">
    <div class="head">
      <p>设置</p>
      <span class="close" @click.stop="close"></span>
    </div>
    <div class="suv_main" @mousedown.stop>
      <!-- <div class="box">
        <p>层厚(mm)：</p>
        <input
          class="other_input"
          v-model.lazy="thickness"
          :class="{
            invalid: invalid.thickness,
            disabled: !canThick,
          }"
          :disabled="!canThick"
          @blur="sure2"
          @keyup.enter="$event.target.blur()"
        />
        <div class="btn" @click.stop="reset">重置</div>
      </div> -->
      <div class="box">
        <p>窗宽：</p>
        <input
          v-model.lazy="ww"
          :class="{ invalid: invalid.ww }"
          @blur="changeWWWL('ww')"
          @keyup.enter="$event.target.blur()"
        />
      </div>
      <div class="box">
        <p>窗位：</p>
        <input
          v-model.lazy="wl"
          :class="{ invalid: invalid.wl }"
          @blur="changeWWWL('wl')"
          @keyup.enter="$event.target.blur()"
        />
      </div>
      <div class="box">
        <p>T：</p>
        <input
          v-model.lazy="T"
          :class="{ invalid: invalid.T }"
          @blur="changeWWWL('T')"
          @keyup.enter="$event.target.blur()"
        />
      </div>
      <div class="box">
        <p>B：</p>
        <input
          v-model.lazy="B"
          :class="{ invalid: invalid.B }"
          @blur="changeWWWL('B')"
          @keyup.enter="$event.target.blur()"
        />
      </div>
    </div>
  </div>
</template>

<script>
import DATA from "../js/data.js";
import { mapState } from "vuex";
export default {
  name: "viewer-setsuv",
  data: function () {
    return {
      invalid: {
        ww: false,
        wl: false,
        B: false,
        T: false,
        thickness: false,
      },
      ww: "",
      wl: "",
      T: "",
      B: "",
      thickness: 0,
      oriThickness: 0,
      maxThickness: 0,
      minThickness: 0.1,
      num: 0,
    };
  },
  props: {
    vertical: Boolean,
    seriesListPos: String,
    imageData: {},
    seriesInfo: {},
    suvShow: {},
    mprLayerShow: {},
    imgPoor: {},
    canvasRange: Object,
  },
  computed: {
    ...mapState(["scaleRatio"]),
    style() {
      return {
        height: `calc(1 / ${this.scaleRatio} * (100% - ${this.canvasRange.RBTopWidth}px - ${this.canvasRange.RBBottomWidth}px))`,
        top: `${this.canvasRange.RBTopWidth}px`,
        transform: `scale(${this.scaleRatio})`,
        transformOrigin: "100% 0",
      };
    },

    series() {
      return this.seriesInfo;
    },

    needInit() {
      const { ww, wl, curViewMod } = this.imageData;
      let str = `${ww}${wl}${curViewMod}`;
      let res = this.$md5(str);
      return res;
    },

    canThick() {
      return !this.seriesInfo.isNotUniformSquence;
    },
  },

  mounted() {
    this.initData();
    this.$follow_mouse("setsuv");
  },

  methods: {
    close() {
      this.$emit("update:suvShow", false);
    },
    changeWWWL(key) {
      this.num = this.verifyParam(key);
      if (this.num) return;
      let data;
      if (key === "ww" || key === "wl") {
        data = {
          ww: this.ww * 1,
          wl: this.wl * 1,
        };
        let res = DATA.wwwl2suv(data.ww, data.wl, this.series);
        this.B = this.$num2e(res.B);
        this.T = this.$num2e(res.T);
      } else if (key === "B" || key === "T") {
        data = {
          B: this.B * 1,
          T: this.T * 1,
        };
        let res = DATA.suv2wwwl(this.series, data.T, data.B);
        this.ww = res.ww;
        this.wl = res.wl;
      }
      this.sure1();
    },
    sure1() {
      if (this.num) return;
      let { currentSID } = this.seriesInfo;
      let poor = this.imgPoor[currentSID];
      if (!poor.imageDone) {
        this.$emit("update:mprLayerShow", true);
        return;
      }
      this.$emit("changeValue", this.ww * 1, this.wl * 1);
    },
    sure2() {
      this.num = this.verifyParam("thickness");
      if (this.num) return;
      let { currentSID } = this.seriesInfo;
      let poor = this.imgPoor[currentSID];
      if (!poor.imageDone) {
        this.$emit("update:mprLayerShow", true);
        return;
      }
      let data = { thickness: Number(this.thickness).toFixed(2) };
      this.$emit("changeValue2", data);
    },
    reset() {
      let { curViewMod } = this.imageData;
      let { volumeSpacing } = this.seriesInfo;
      this.thickness = volumeSpacing[curViewMod].orgT;
      this.sure2();
    },
    //验证参数
    verifyParam(key) {
      this.errReset();
      let num = 0;
      let keys1 = ["ww", "wl"];
      let keys2 = ["B", "T"];
      let keys = [];
      if (keys1.includes(key)) {
        keys = keys1;
      } else if (keys2.includes(key)) {
        keys = keys2;
      } else if (key === "thickness") {
        keys = [key];
      }

      for (let i = 0; i < keys.length; i++) {
        num = this.ISNaN(keys[i], num);
      }
      return num;
    },
    //错误重置
    errReset() {
      this.invalid = {
        ww: false,
        wl: false,
        B: false,
        T: false,
        thickness: false,
      };
      this.num = 0;
    },
    ISNaN(key, num) {
      let p = this[key] * 1;
      if (isNaN(p)) {
        this.invalid[key] = true;
        num++;
      } else if (key === "ww" && p === 0) {
        this.invalid[key] = true;
        num++;
      } else if (
        key === "thickness" &&
        (!p || p < this.minThickness || p > this.maxThickness)
      ) {
        this.invalid[key] = true;
        num++;
      }
      return num;
    },
    initData() {
      let { ww, wl, curViewMod } = this.imageData;
      let max,
        min,
        w = ww,
        l = wl;

      let res = DATA.wwwl2suv(w, l, this.series);
      min = res.B;
      max = res.T;
      this.ww = this.$num2e(w);
      this.wl = this.$num2e(l);
      this.B = this.$num2e(min);
      this.T = this.$num2e(max);
      this.thickness = 1;
      this.oriThickness = 1;
      this.maxThickness = this.seriesInfo.instances.length;

      let { volumeSize, volumeSpacing } = this.seriesInfo;
      if (volumeSize && volumeSpacing) {
        this.thickness = volumeSpacing[curViewMod].thickness;
        this.oriThickness = volumeSpacing[curViewMod].orgT;
        this.maxThickness = this.thickness * volumeSize[curViewMod].d;
      }
    },
  },
  watch: {
    needInit() {
      this.initData();
    },

    /**
     * 显示当前菜单时，且触发拖拽逻辑后，当由横屏变为竖屏时，需要将拖拽控制的style清空。
     * @param newest
     */
    // vertical(newest) {
    //   if (newest) {
    //   }
    // },
  },
};
</script>

<style lang="scss" scoped>
@import "./viewer-setsuv.scss";
</style>
