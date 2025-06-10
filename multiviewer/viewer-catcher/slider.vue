<template>
  <div class="slider-container" ref="container">
    <div class="slider-track">
      <div
        class="slider-track-fill"
        :style="`transform: translateX(${percentage}%)`"
        @click="(e) => directTo(e, 0)"
      ></div>
      <div class="slider-track-nofill" @click="(e) => directTo(e, 1)"></div>
    </div>
    <div class="slider-thumb-container">
      <div
        class="slider-thumb-tick"
        ref="thumb"
        :style="`transform: translateX(${percentage}%)`"
      >
        <div :class="{ 'slider-thumb': true, 'scale-out': focus }"></div>
        <div :class="{ bubble: true, 'scale-in': focus }">
          <div class="slider-thumb-label">{{ value }}{{ unit }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Slider",
  props: {
    value: {
      type: Number,
      required: true,
      default: 0,
    },
    min: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 100,
    },
    unit: {
      type: String,
      default: "",
    },
    step: {
      type: Number,
      default: 1,
    },
    width: {
      type: Number,
      default: 94,
    },
  },
  computed: {
    percentage() {
      return Math.round(
        ((this.value - this.min) / (this.max - this.min)) * 100,
      );
    },
    decimalLength() {
      if (Number.isInteger(this.step)) {
        return 0;
      }

      const decimalPart = String(this.step).split(".")[1];
      return decimalPart ? decimalPart.length : 0;
    },
  },
  data() {
    return {
      focus: false,
      startX: 0,
      containerWidth: 0,
      startPercent: 0,
    };
  },
  watch: {
    value(val) {
      if (!this.focus) {
        this.startPercent = this.percentage;
      }
      if (val > this.max) {
        this.$emit("update:value", this.max);
      }
      if (val < this.min) {
        this.$emit("update:value", this.min);
      }
    },
  },
  mounted() {
    this.containerWidth = this.$refs.container.getBoundingClientRect().width;
    this.$refs.thumb.addEventListener("mousedown", this.start);
    document.body.addEventListener("mouseup", this.leave, true);
    document.body.addEventListener("mouseleave", this.leave);
    document.body.addEventListener("mousemove", this.move, true);
  },
  beforeDestroy() {
    this.$refs.thumb.removeEventListener("mousedown", this.start);
    document.body.removeEventListener("mouseup", this.leave);
    document.body.removeEventListener("mouseleave", this.leave);
    document.body.removeEventListener("mousemove", this.move);
  },
  methods: {
    start(e) {
      if (!this.containerWidth)
        this.containerWidth =
          this.$refs.container.getBoundingClientRect().width;
      this.focus = !this.focus;
      this.startX = e.clientX;
      if (!this.focus) this.startPercent = this.percentage;
    },
    leave() {
      this.focus = false;
      this.startPercent = this.percentage;
    },
    move(e) {
      if (!this.focus) return;
      const diff = e.clientX - this.startX;
      let percent = this.startPercent + (diff / this.containerWidth) * 100;
      if (percent >= 100) percent = 100;
      if (percent <= 0) percent = 0;
      const value = (
        this.min +
        Math.round(((this.max - this.min) / this.step) * (percent / 100)) *
          this.step
      ).toFixed(this.decimalLength);
      this.$emit("update:value", parseFloat(value));
    },
    directTo(e, direct) {
      let percent, value;
      if (!this.containerWidth)
        this.containerWidth =
          this.$refs.container.getBoundingClientRect().width;
      if (!direct) {
        percent = (e.offsetX - this.containerWidth) / this.containerWidth;
        value = (
          parseFloat(this.value) +
          Math.round(((this.max - this.min) / this.step) * percent) * this.step
        ).toFixed(this.decimalLength);
      } else {
        percent = e.offsetX / this.containerWidth;
        value = (
          this.min +
          Math.round(((this.max - this.min) / this.step) * percent) * this.step
        ).toFixed(this.decimalLength);
      }

      this.$emit("update:value", parseFloat(value));
    },
  },
};
</script>

<style lang="scss" scoped>
.slider-container {
  position: relative;
  width: 100%;
  height: 2px;
}
.slider-track {
  position: relative;
  height: 100%;
  background: #cccccc;
  overflow: hidden;
  &-fill {
    cursor: pointer;
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: #3b8be4;
  }
  &-nofill {
    height: 100%;
    cursor: pointer;
  }
}

.slider-thumb-container {
  position: absolute;
  width: 100%;
  // height: 20px;
  top: -10px;
  left: 0;
}

.slider-thumb-tick {
  position: absolute;
  width: 100%;
  height: 0;
  z-index: 100;
}
.slider-thumb {
  position: absolute;
  box-sizing: border-box;
  position: absolute;
  cursor: pointer;
  top: 6px;
  width: 10px;
  height: 10px;
  border: 4px solid transparent;
  left: -3px;
  background-color: #3b8be4;
  border-radius: 50%;
  transition: transform 0.3s;
  transform: scale(1);
}
.slider-thumb-label {
  transform: rotate(-45deg);
}
.bubble {
  position: absolute;
  width: 30px;
  height: 30px;
  border-radius: 50% 50% 0;
  background-color: #3b8be4;
  color: white;
  text-align: center;
  line-height: 30px;
  font-size: 12px;
  top: -18px;
  left: -30px;
  transition:
    transform 0.3s,
    border-radius 0.3s;
  transform-origin: 100% 100%;
  transform: scale(0) rotate(45deg);
}
.scale-out {
  transform: scale(0);
}
.scale-in {
  transform: scale(1) rotate(45deg);
}
</style>
