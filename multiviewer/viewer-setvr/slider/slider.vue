<template>
  <div id="slider" ref="slider">
    <el-slider
      v-model="range"
      range
      :min="fullMappingRange[0]"
      :max="fullMappingRange[1]"
      :show-tooltip="false"
      @change="changeRange"
      @input="inputRange"
    >
    </el-slider>
  </div>
</template>
<script>
const DEFAULT_TRACK_COLOR = "rgba(128, 128, 128, 0.2)";
export default {
  name: "slider",
  props: {
    mappingRange: {},
    fullMappingRange: {},
    rgbPoints: {},
    step: {},
  },
  data() {
    return {
      range: [0, 0],
    };
  },
  methods: {
    changeRange(range) {
      this.setButtonBackground();
    },
    inputRange(range) {
      this.$emit("input", range);
    },
    setButtonBackground() {
      let doms = document.querySelectorAll(
        "#slider .el-slider__button-wrapper",
      );
      let left1 = doms[0].style.left.split("%")[0];
      let left2 = doms[1].style.left.split("%")[0];
      if (Number(left1) > Number(left2)) {
        doms[0].querySelectorAll(".el-slider__button")[0].style.background =
          this.endBackgroundColor;
        doms[1].querySelectorAll(".el-slider__button")[0].style.background =
          this.startBackgroundColor;
      }
      if (Number(left1) <= Number(left2)) {
        doms[1].querySelectorAll(".el-slider__button")[0].style.background =
          this.endBackgroundColor;
        doms[0].querySelectorAll(".el-slider__button")[0].style.background =
          this.startBackgroundColor;
      }
    },
    changeBackground() {
      this.$nextTick(() => {
        let doms = document.querySelectorAll(
          "#slider .el-slider__button-wrapper",
        );
        let leftArr = [];
        for (let dom of doms) {
          leftArr.push(dom.style.left.split("%")[0]);
        }
        leftArr.sort((a, b) => {
          a - b;
        });
        let background = `linear-gradient(to right, ${this.startBackgroundColor} ${leftArr[0]}%, ${this.endBackgroundColor} ${leftArr[1]}%)`;
        let ddd = document.querySelectorAll("#slider .el-slider__runway")[0];
        ddd.style.background = background;
      });
    },
  },
  watch: {
    mappingRange: {
      handler() {
        this.range = this.mappingRange;
        this.setButtonBackground();
      },
      deep: true,
    },
    filledBackgroundColor() {
      let dom = document.querySelectorAll("#slider .el-slider__bar")[0];
      dom.style.background = this.filledBackgroundColor;
    },
    range() {
      this.changeBackground();
    },
    startBackgroundColor() {
      this.changeBackground();
    },
    endBackgroundColor() {
      this.changeBackground();
    },
  },
  computed: {
    startBackgroundColor() {
      if (!this.rgbPoints) {
        return DEFAULT_TRACK_COLOR;
      }
      const [r, g, b] = this.rgbPoints.slice(1, 4).map((c) => c * 255);
      return `rgb(${r}, ${g}, ${b})`;
    },
    filledBackgroundColor() {
      if (!this.rgbPoints) {
        return DEFAULT_TRACK_COLOR;
      }
      const rangeMax = this.rgbPoints[this.rgbPoints.length - 4];
      const rangeMin = this.rgbPoints[0];
      const width = rangeMax - rangeMin;
      const colorStops = [];
      for (let i = 0; i < this.rgbPoints.length; i += 4) {
        const [r, g, b] = [
          this.rgbPoints[i + 1] * 255,
          this.rgbPoints[i + 2] * 255,
          this.rgbPoints[i + 3] * 255,
        ];
        const stop = ((this.rgbPoints[i] - rangeMin) / width) * 100; // in percent
        colorStops.push(`rgba(${r}, ${g}, ${b}) ${stop.toFixed(2)}%`);
      }
      return `linear-gradient(to right, ${colorStops.join(", ")})`;
    },
    endBackgroundColor() {
      if (!this.rgbPoints) {
        return DEFAULT_TRACK_COLOR;
      }
      const end = this.rgbPoints.length;
      const [r, g, b] = this.rgbPoints.slice(end - 3).map((c) => c * 255);
      return `rgb(${r}, ${g}, ${b})`;
    },
  },
};
</script>
<style lang="scss" scoped>
@import "./slider.scss";
</style>
