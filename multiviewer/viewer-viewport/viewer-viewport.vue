<template>
  <div
    class="viewer-viewport"
    :style="viewportStyle"
    :id="`viewport-${viewportID}`"
  >
    <!--  筛选series  -->

    <el-checkbox
      class="sync-select"
      v-if="showSyncCheckbox"
      v-model="viewport.addIntoSynic"
      :disabled="viewport.addIntoSynicDisable"
      @change="handleAddIntoSynicChange"
    ></el-checkbox>

    <div class="icon-select"></div>
    <div class="series">
      <div class="select-container">
        <template>
          <div class="modality">{{ currSeriesDesc.modality }}</div>
          <div class="desc overflow-1" :title="currSeriesDesc.description">
            SID:{{ currSeriesDesc.id }}｜{{ currSeriesDesc.description }}
          </div>
        </template>
      </div>
      <div class="options">
        <div
          class="item"
          :class="{
            selected: currSeriesDesc.seriesId === series.seriesId,
            border:
              i + 1 < currStudySeriesData['data']['length'] &&
              series.modality !== currStudySeriesData['data'][i + 1].modality,
          }"
          v-for="(series, i) in currStudySeriesData['data']"
          :key="series.seriesId"
          @click.stop="clickSeries(series)"
        >
          <div class="modality" :class="series.modality">
            {{ series.modality }}
          </div>
          <div
            class="desc overflow-1"
            :title="`SID:${series.id}｜${series.description}`"
          >
            SID:{{ series.id }}｜{{ series.description }}
          </div>
        </div>
      </div>
    </div>
    <el-switch
      v-show="imgDone && hasRegistPara"
      size="mini"
      v-model="viewport.regFlag"
      :active-text="$t('reg.button')"
      :inactive-text="$t('reg.button')"
      active-color="#3B8BE4"
      inactive-color="#595959"
      @change="handleSwitchChange"
    >
    </el-switch>
  </div>
</template>

<script>
import Layout from "@/components/multiviewer/js/layout";
import { mapState } from "vuex";
import LOAD from "../js/loadImg";
export default {
  name: "viewer-viewport",
  props: {
    canvasRange: { required: true },
    viewportID: { required: true },
    viewport: {
      type: Object,
      required: true,
    },
    currViewportID: { required: true },
    seriesList: {
      required: true,
      default() {
        return [];
      },
    },
    isAutoLinkout: { required: true },
    isManualLinkout: { required: true },
    isInMPR: { required: true },
    isInCPR: { required: true },
    isInVR: { required: true },
  },
  data() {
    return {};
  },

  computed: {
    ...mapState(["imgPoor"]),
    hasRegistPara() {
      const currentSID = this.viewport.currentSID;
      const registPara = this.imgPoor[currentSID]?.registPara;
      if (!registPara) {
        return false;
      }
      return (
        registPara?.dRote.rx !== 0 ||
        registPara?.dRote.ry !== 0 ||
        registPara?.dRote.rz !== 0 ||
        registPara?.trans.x !== 0 ||
        registPara?.trans.y !== 0 ||
        registPara?.trans.z !== 0
      );
    },
    imgDone() {
      const currentSID = this.viewport.currentSID;
      return this.imgPoor[currentSID]?.imageDone;
    },
    curAP() {
      return JSON.stringify(this.viewport.AcrossPoint);
    },
    needUpdateImageDatas() {
      let needSyncCross = undefined,
        needSyncGeom = undefined,
        needSyncWWWL = undefined;
      let { canvasNow, imageDatas, AcrossPoint } = this.viewport;
      let imageDataNow = imageDatas[canvasNow];
      if (AcrossPoint) {
        let {
          x,
          y,
          z,
          rotateT,
          rotateC,
          rotateS,
          thickT,
          thickC,
          thickS,
          curViewMod,
        } = AcrossPoint;
        if (imageDataNow.isVR) {
          needSyncCross = undefined;
        } else {
          let gridNum = imageDatas.length;
          let str1 = `${x}${y}${z}${rotateT}${rotateC}${rotateS}${thickT}${thickC}${thickS}${gridNum}${curViewMod}`;
          needSyncCross = this.$md5(str1);
        }
      }
      if (canvasNow != undefined && imageDatas && imageDatas.length > 0) {
        if (imageDataNow) {
          let { scale, translate, rotate, ww, wl, colormapIndex } =
            imageDataNow;
          if (imageDataNow.isVR) {
            needSyncGeom = undefined;
          } else {
            let signX = Math.sign(scale.x);
            let signY = Math.sign(scale.y);
            let str2 = `${scale.baseSpacing}${scale.baseFactor}${translate.x}${translate.y}${rotate}${signX}${signY}`;
            needSyncGeom = this.$md5(str2);
          }
          let str3 = `${ww}${wl}${colormapIndex}`;
          if (imageDataNow.isVR) needSyncWWWL = undefined;
          else needSyncWWWL = this.$md5(str3);
        }
      }
      return {
        needSyncCross,
        needSyncGeom,
        needSyncWWWL,
      };
    },
    viewportStyle() {
      const vpSize = this.viewport.viewportSize;
      return {
        top: vpSize.top + "px",
        left: vpSize.left + "px",
        width: vpSize.width + "px",
        height: vpSize.height + "px",
      };
    },
    currSeriesInfo() {
      const now = this.viewport.canvasNow;
      return this.viewport.seriesInfos[now];
    },
    currSeriesDesc() {
      const sid = this.viewport.currentSID;
      for (const studyID in this.seriesList) {
        if (!this.seriesList[studyID]["data"]) return {};
        for (const series of this.seriesList[studyID]["data"]) {
          if (series.seriesId === sid) {
            return series;
          }
        }
      }
      return {};
    },
    currStudySeriesData() {
      const sid = this.viewport.currentSID;

      for (const studyID in this.seriesList) {
        if (!this.seriesList[studyID]["data"]) return {};
        for (const series of this.seriesList[studyID]["data"]) {
          if (series.seriesId === sid) {
            return this.seriesList[studyID];
          }
        }
      }

      return {};
    },
    showSyncCheckbox() {
      return (
        (this.isAutoLinkout || this.isManualLinkout) &&
        !this.isInMPR &&
        !this.isInCPR &&
        !this.isInVR
      );
    },
  },

  methods: {
    /**
     * 当前布局切换series
     */
    clickSeries(series) {
      this.$emit("update:currViewportID", this.viewportID);
      this.$emit("changeSIDSync", series.seriesId);
    },
    async handleSwitchChange(val) {
      const currentSID = this.viewport.currentSID;
      const registPara = this.imgPoor[currentSID]?.registPara;
      console.log(registPara, "当前配准参数");

      this.initSwitch(val);
      this.$emit("setSeriesInfo", this.viewportID);
    },
    initSwitch(val) {
      const leftE = document
        .getElementById(`viewport-${this.viewportID}`)
        .getElementsByClassName("el-switch__label--left")[0];
      leftE.style.display = val ? "flex" : "none";
      const rightE = document
        .getElementById(`viewport-${this.viewportID}`)
        .getElementsByClassName("el-switch__label--right")[0];
      rightE.style.display = val ? "none" : "flex";
    },
    handleAddIntoSynicChange(val) {
      if (this.isManualLinkout) {
        if (val) {
          this.$emit("updateManualLinkNum", this.viewport.viewportID);
          console.log("manualLink add");
        } else {
          console.log("manualLink remove");
          this.viewport.manualLinkNum = undefined;
        }
      }
    },
  },
  mounted() {
    const { gridNum } = this.viewport;
    const viewport = document.querySelector("#viewport-" + this.viewportID);
    const canvasSizeList = Layout.oneGridForGrid(this, viewport);
    this.viewport.canvasSize = canvasSizeList;
  },
  watch: {
    curAP() {
      console.log("AP change", this.viewportID, this.curAP);
    },
    imgDone(val) {
      if (val) {
        this.initSwitch(false);
      }
    },
    //这个函数触发的是viewport内部的imagedatas的更新
    needUpdateImageDatas: {
      handler(val, old) {
        let {
          needSyncCross: needSyncCross_old,
          needSyncGeom: needSyncGeom_old,
          needSyncWWWL: needSyncWWWL_old,
        } = old;
        let {
          needSyncCross: needSyncCross_new,
          needSyncGeom: needSyncGeom_new,
          needSyncWWWL: needSyncWWWL_new,
        } = val;
        if (needSyncCross_old != needSyncCross_new) {
          let isCurrViewport = this.viewport.viewportID === this.currViewportID;
          LOAD.syncCross(this.viewport, isCurrViewport);
          //这里触发了viewport之间的联动
          if (isCurrViewport) {
            this.$emit("syncVPAcorssPoint");
          }
        }

        if (needSyncGeom_new && needSyncGeom_old != needSyncGeom_new) {
          LOAD.syncGeom(this.viewport);
        }
        if (needSyncWWWL_old != needSyncWWWL_new) {
          LOAD.syncWWWL(this.viewport);
        }

        //这里强制刷新图像，更新定位线
      },
      deep: true,
    },
  },
};
</script>

<style lang="sass" scoped>
@import "viewer-viewport"
</style>
