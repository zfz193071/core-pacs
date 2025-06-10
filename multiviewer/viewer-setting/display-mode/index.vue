<template>
  <div class="display-mode">
    <div class="color">
      <div class="box-title">{{ $t("settings.titles.mode") }}</div>
      <div class="left">
        <el-checkbox
          :disabled="isLowerConfigureDevice"
          v-model="useCompatibility"
          >{{ $t("settings.displayMode.mode") }}</el-checkbox
        >
      </div>

      <div class="right">
        <div class="tip">
          <div class="warning"></div>
          <div>{{ $t("settings.displayMode.tip") }}</div>
        </div>
      </div>
    </div>
    <!-- <div class="reg-settings">
      <div class="left">
        <el-checkbox v-model="useShowRegImages">{{
          $t("settings.regImages.text")
        }}</el-checkbox>
      </div>
      <div class="right">{{ $t("settings.regImages.tip") }}</div>
    </div> -->
    <div class="color position">
      <div class="box-title">
        {{ $t("settings.imageInitialPosition.position") }}
      </div>
      <el-radio-group v-model="imageInitialPosition">
        <el-radio label="first">{{
          $t("settings.imageInitialPosition.first")
        }}</el-radio>
        <el-radio label="center">{{
          $t("settings.imageInitialPosition.center")
        }}</el-radio>
      </el-radio-group>
    </div>
    <div class="color full-series">
      <div class="box-title">
        {{ $t("settings.fullSeries.text") }}
      </div>
      <div class="left">
        <el-checkbox v-model="loadFullSeries">{{
          $t("settings.fullSeries.text")
        }}</el-checkbox>
      </div>
    </div>
    <div class="color image-stitching" v-if="showImageStitching">
      <div class="box-title">
        {{ $t("settings.imageStitching.title") }}
      </div>
      <div class="left">
        <el-checkbox v-model="enableImageStitching">{{
          $t("settings.imageStitching.text")
        }}</el-checkbox>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { getDataType } from "@/assets/js/YMDataHandler";
export default {
  name: "DisplayMode",
  mounted() {
    const flag = localStorage.getItem("useCompatibility");
    if (flag === "true") this.useCompatibility = true;
    else if (this.isLowerConfigureDevice) this.useCompatibility = true;
    // const regFlag = localStorage.getItem("useShowRegImages");
    // if (regFlag === "true") this.useShowRegImages = true;
    //图像初始位置
    const imageInitialPosition = localStorage.getItem("imageInitialPosition");
    if (imageInitialPosition) this.imageInitialPosition = imageInitialPosition;
    // 加载全影像序列
    const loadFullSeries = localStorage.getItem("loadFullSeries");
    if (loadFullSeries === "true") this.loadFullSeries = true;
    //
    const enableImageStitching = localStorage.getItem("enableImageStitching");
    if (enableImageStitching === "true") this.enableImageStitching = true;
  },
  data() {
    return {
      useCompatibility: false,
      // useShowRegImages: false,
      imageInitialPosition: "first",
      loadFullSeries: false,
      enableImageStitching: false,
    };
  },
  computed: {
    ...mapState(["isLowerConfigureDevice"]),
    showImageStitching() {
      const obj = getDataType();
      return obj.env === "JH";
    },
  },
  methods: {
    // ...mapMutations(["setIsShowRegImages"]),
    /**
     * 保存并切换主题色
     */
    save() {
      localStorage.setItem("useCompatibility", this.useCompatibility);
      localStorage.setItem("imageInitialPosition", this.imageInitialPosition);
      localStorage.setItem("loadFullSeries", this.loadFullSeries);
      localStorage.setItem("enableImageStitching", this.enableImageStitching);
      // this.setIsShowRegImages(this.useShowRegImages);
      // localStorage.setItem("useShowRegImages", this.useShowRegImages);
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>
