<!--
 * @Author: 
 * @Date: 2024-03-16 00:32:58
 * @LastEditTime: 2024-03-19 16:22:53
 * @LastEditors: ssy
 * @Description: 
-->
<template>
  <div id="temp" :class="{ vertical: vertical }" :style="{ height }">
    <dl class="tit">
      <dt>模板</dt>
      <dd class="close" @click.stop="clickOptFn2('tempShow')"></dd>
    </dl>
    <ul class="scrollbar2" @mousedown.stop>
      <li @click.stop="clickOptFn('Grid1')" :class="{ useful: true }">
        <img :src="oneWindowSrc" alt="" />
      </li>
      <li
        @click.stop="clickOptFn('MPR3')"
        :class="{ useful: true, active: gridMod === 'MPR3' }"
      >
        <img :src="MPR3Src" alt="" />
      </li>
      <li
        @click.stop="clickOptFn('MPR4')"
        :class="{ useful: true, active: gridMod === 'MPR4' }"
      >
        <img :src="MPR4Src" alt="" />
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "viewer-temp",
  data() {
    return {};
  },
  props: {
    tempShow: Boolean,
    clickOpt: {},
    gridMod: {},
    imageData: {},
    vertical: {},
    seriesListPos: String,
    seriesInfo: {},
  },
  created() {},
  computed: {
    height() {
      const toolbarHeight = this.vertical ? "104px" : "52px";
      const bottomSeriesListHeight =
        this.seriesListPos === "BOTTOM" ? "145px" : "0px";
      return `calc(100% - ${toolbarHeight} - ${bottomSeriesListHeight})`;
    },
    isPT() {
      //只针对NM的四窗口模版,但是允许NM图像显示
      return this.seriesInfo.model === "PT" || this.seriesInfo.model === "NM";
    },
    oneWindowSrc() {
      if (this.seriesInfo && this.isPT) return require("./images/pt/0.png");
      return require("./images/ct/0.png");
    },
    MPR3Src() {
      if (this.seriesInfo && this.isPT) return require(`./images/pt/1.png`);
      return require(`./images/ct/1.png`);
    },
    MPR4Src() {
      if (this.seriesInfo && this.isPT) return require(`./images/pt/2.png`);
      return require(`./images/ct/2.png`);
    },
  },
  mounted() {
    this.$follow_mouse("temp");
  },
  methods: {
    clickOptFn(item) {
      this.$emit("update:clickOpt", item);
    },
    clickOptFn2(item) {
      this.$emit("update:clickOpt", item);
    },
  },
};
</script>

<style lang='scss' scoped>
@import "./viewer-temp.scss";
</style>
