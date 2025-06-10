<template>
  <div id="colormap" ref="map" :style="style">
    <p>
      {{ $t("colormap") }}
      <span class="close" @click.stop="colormapBack"></span>
    </p>
    <div class="border"></div>
    <ul class="scrollbar" @mousedown.stop>
      <li
        v-for="(colormap, index) in colormap"
        @click.stop="changeColor(colormap)"
        :key="index"
      >
        <span v-html="colormap.text || colormap.type"></span>
        <img :src="colorSrc(colormap.type)" />
      </li>
    </ul>
  </div>
</template>

<script>
import DATA from "../../multiviewer/js/data";
import { mapState } from "vuex";
export default {
  name: "co-colormap",
  data() {
    return {
      colormap: null,
      start: {
        x: null,
        y: null,
      },
      index: 1000,
    };
  },
  props: {
    seriesListPos: String,
    colormapShow: { type: Boolean, required: true },
    pagetype: { required: true },
    imageData: { required: true },
    renderDataList: {},
    canvasRange: Object,
    zindex: Number,
  },
  computed: {
    ...mapState(["scaleRatio"]),
    style() {
      return {
        height: `calc(1 / ${this.scaleRatio} * (100% - ${this.canvasRange.RBTopWidth}px - ${this.canvasRange.RBBottomWidth}px))`,
        top: `${this.canvasRange.RBTopWidth}px`,
        transform: `scale(${this.scaleRatio})`,
        transformOrigin: "100% 0",
        zIndex: this.index,
      };
    },
  },
  created() {
    this.colormap = [
      { text: "UCLA(Default)", type: "UCLA" },
      //   { text: "Inverse", type: "B&W Inverse" },  //放在调窗里单独使用了，ssy 0317
      { type: "5percent" },
      { type: "A_Squared" },
      { type: "Blue_Green" },
      { type: "Blue_Green_Red" },
      { type: "Blue_Red_Yellow" },
      { type: "Ceretec" },
      { type: "French" },
      { type: "GE" },
      // { type:"GE-256" },
      { type: "GreenFire" },
      { type: "Hot_Iron" },
      { type: "Hot_Iron_LUT" },
      { type: "NIH" },
      { type: "Perfusion" },
      { type: "p-phase" },
      { type: "Rainbow" },
      { type: "Rainbow2" },
      { type: "Rainbow3" },
      { type: "S_Pet" },
      { type: "Siemens" },
      { type: "Stern" },
      { type: "SUV1" },
      { type: "SUV2" },
      { type: "Warm" },
      { type: "Warm_Metal" },
      { type: "PET" },
    ];
  },
  methods: {
    colormapBack() {
      this.$emit("update:colormapShow", false);
    },
    changeColor(colormap) {
      this.$emit("update:renderDataList", {});
      let type = colormap.type;
      let imageData = { ...this.imageData };
      imageData.colormapSaveIndex = type;
      imageData.colormapIndex = type;
      this.$emit("update:imageData", imageData);
    },
    colorSrc(key) {
      let src = DATA.getCMPSrc(key);
      return src;
    },
  },

  mounted() {
    this.$follow_mouse("colormap");
    this.index = this.zindex;
  },
};
</script>

<style lang="scss" scoped>
@import "./co-colormap.scss";
</style>
