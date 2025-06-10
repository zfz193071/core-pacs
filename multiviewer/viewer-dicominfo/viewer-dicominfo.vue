<template>
  <div
    class="infoWrapper"
    :style="{ fontSize, color, lineHeight }"
    v-show="dicomTempShow"
  >
    <div class="info">
      <div>
        <p>
          {{ infoShow.part ? model : "" }}
          <br v-if="infoShow.part" />
          {{ infoShow.patientName ? seriesInfo.PatientName : "" }}
          <br v-if="infoShow.patientName" />
          {{ infoShow.seriesTime ? SeriesDate : "" }}
          <br v-if="infoShow.seriesTime && SeriesDate" />
          {{ infoShow.seriesTime ? AcquisitionTime : "" }}
          <br v-if="infoShow.age" />
          {{ infoShow.age ? Age : "" }}
          <br v-if="infoShow.sex" />
          {{ infoShow.sex ? Sex : "" }}
        </p>
        <p>
          {{ infoShow.pixel ? pixelSpacing : "" }}<br v-if="infoShow.pixel" />
          {{ infoShow.thickness ? thickness : ""
          }}<br
            v-if="
              infoShow.thickness &&
              seriesInfo.initViewMod === imageData.curViewMod
            "
          />
          {{ infoShow.wwwl ? wwwl : "" }}
          <br v-if="infoShow.wwwl" />
          {{ infoShow.TB ? SUV : "" }}
        </p>
      </div>
      <div>
        <p>
          <!-- {{seriesInfo.institutionName}}<br> -->
          {{ infoShow.patientId ? seriesInfo.PatientID : "" }}
          <br v-if="infoShow.patientId" />
          {{ infoShow.SID ? SID : "" }}
          <br v-if="infoShow.SID" />
          {{ infoShow.imgNum ? imageNum : "" }}
          <br v-if="infoShow.institutionName && seriesInfo.institutionName" />
          {{
            infoShow.institutionName && seriesInfo.institutionName
              ? seriesInfo.institutionName
              : ""
          }}
        </p>
        <p>
          {{ infoShow.vendor ? seriesInfo.manufacturer : "" }}
          <br v-if="infoShow.vendor" />
          {{ infoShow.modelName ? seriesInfo.manufacturerModelName : "" }}
          <br v-if="infoShow.description" />
          {{ infoShow.description ? seriesInfo.description : "" }}
        </p>
      </div>
    </div>

    <dl
      class="color"
      v-if="!isVR"
      v-show="infoShow.pseudo"
      :style="{ fontSize, color }"
    >
      <dt :style="{ top: `-${lineHeight}` }">0</dt>
      <dd :style="{ bottom: `-${lineHeight}` }">255</dd>
      <img
        :src="colorSrc"
        height="20"
        :width="canvasSize.height / 2"
        class="keepInScreenshotImg"
      />
    </dl>

    <div class="pos" v-show="infoShow.orientation" :style="{ fontSize, color }">
      <p>{{ crossDirection[0] }}</p>
      <p>{{ crossDirection[1] }}</p>
      <p>{{ crossDirection[2] }}</p>
      <p>{{ crossDirection[3] }}</p>
    </div>

    <div class="ruler-wrapper" v-show="infoShow.rulerImg">
      <div class="ruler" :style="{ height: rulerHeight + 'px' }">
        <div
          class="graduate"
          v-for="data in 8"
          :key="data"
          :style="{ borderWidth: ruleFontSize }"
        ></div>
      </div>
      <div class="text" :style="{ fontSize, color }">
        {{ getRulerGraduate }}mm
      </div>
    </div>
  </div>
</template>

<script>
import DATA from "../js/data.js";
export default {
  name: "viewer-dicominfo",
  props: {
    seriesInfo: { type: Object, required: true },
    imageData: { type: Object, required: true },
    canvasSize: { type: Object, required: true },
    crossDirection: { type: Array, required: true },
    dicomShow: {},
    dicomShowAll: {},
    dicomStyle: {},
    dicomTempShow: Boolean,
    showVR: { default: false, required: false },
    isInVR: { type: Boolean },
    isInCPR: { type: Boolean },
    isInMPR: { type: Boolean },
  },
  data() {
    return {
      rulerGraduate: [
        0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500,
        1000, 2000, 5000,
      ],
      rulerHeight: null,
    };
  },
  computed: {
    infoShow() {
      const temp = this.dicomShowAll[this.seriesInfo.model];
      return temp ? temp : this.dicomShow;
    },
    lang() {
      return this.$i18n.locale;
    },
    Age() {
      let { PatientAge } = this.seriesInfo;
      if (this.lang === "en" && PatientAge.endsWith("岁")) {
        PatientAge = PatientAge.slice(0, -1);
      }
      return `${this.$t("settings.info.age")}: ${PatientAge}`;
    },
    Sex() {
      let sex;
      let { PatientSex } = this.seriesInfo;
      if (this.lang === "en" && ["男", "女", "未知"].includes(PatientSex)) {
        sex = PatientSex === "男" ? "M" : PatientSex === "女" ? "F" : "";
      } else {
        sex = PatientSex;
      }
      return `${this.$t("settings.info.sex")}: ${sex}`;
    },
    SID() {
      return `${this.$t("settings.info.SID")}:${this.seriesInfo.SID}`;
    },
    isVR() {
      return this.imageData?.isVR;
    },
    lineHeight() {
      let lh = "20px";
      if (this.dicomStyle) {
        let fs = this.dicomStyle.fontSize.fontSize;
        lh = `${10 + parseInt(fs)}px`;
      }
      return lh;
    },
    fontSize() {
      let fs = "10px";
      if (this.dicomStyle) {
        fs = this.dicomStyle.fontSize.fontSize;
      }
      return fs;
    },
    color() {
      let c = "#576d8a";
      if (this.dicomStyle) {
        c = this.dicomStyle.color;
      }
      return c;
    },
    ruleFontSize() {
      let fs = "1px";
      if (this.dicomStyle) {
        fs = this.dicomStyle.fontSize.rule;
      }
      return fs;
    },
    //部位模态
    model() {
      let { parts, model } = this.seriesInfo;
      return `${this.$t("settings.info.part")}:${parts}/${model}`;
    },
    //图像张数
    imageNum() {
      let { curImageNum, imageNum, curViewMod, isSyncOthers } = this.imageData;
      if (curImageNum === undefined || imageNum === undefined) return "";
      let showTotal = imageNum;
      let showCur = curImageNum;
      let { volumeSpacing } = this.seriesInfo;
      if (volumeSpacing) {
        let { d: dp, thickness } = volumeSpacing[curViewMod];
        let dimStep = Number((thickness / dp).toFixed(2));
        if (isSyncOthers) {
          dimStep = 1;
        }
        showTotal = Math.floor(imageNum / dimStep);
        showCur = Math.floor(curImageNum / dimStep);
        //BuDing20250606，接南昌中心需求，翻转的数据进MPR之前需保持原来的页码
        // const useCompatibility =
        //   localStorage.getItem("useCompatibility") === "true";
        // if (
        //   this.seriesInfo.ifRevers &&
        //   this.seriesInfo.initViewMod === curViewMod &&
        //   !(!useCompatibility && this.isInMPR)
        // ) {
        //   showCur = showTotal - showCur - 1;
        // }
      }
      if (showCur >= showTotal) {
        showCur = showTotal - 1;
      }
      return `${this.$t("settings.info.imgNum")}:${showCur + 1}/${showTotal}`;
    },
    //分辨率
    pixelSpacing() {
      let xPixelSpacing, yPixelSpacing;
      let { dataWithInfo } = this.imageData;
      if (dataWithInfo) {
        xPixelSpacing = dataWithInfo.pixelSpacingW || 1;
        yPixelSpacing = dataWithInfo.pixelSpacingH || 1;
      }
      return `${this.$t("settings.info.pixel")}:${xPixelSpacing.toFixed(
        2,
      )}mm*${yPixelSpacing.toFixed(2)}mm`;
    },
    //层厚
    thickness() {
      let { curViewMod, curImageNum } = this.imageData;
      let { initViewMod } = this.seriesInfo;
      if (initViewMod !== curViewMod) {
        return "";
      }
      let thick_ness = "--";
      let index = Math.floor(curImageNum);
      if (this.seriesInfo.instances[index]?.sliceThickness) {
        thick_ness =
          this.seriesInfo.instances[index]?.sliceThickness?.toString();
      }
      return `${this.$t("settings.info.thickness")}:${thick_ness}mm`;
    },
    SeriesDate() {
      let res = null;
      let { SeriesDate } = this.seriesInfo;
      if (SeriesDate) {
        res = this.$moment(SeriesDate).format("YYYY/MM/DD");
      }
      return res;
    },
    AcquisitionTime() {
      let res = null;
      let { AcquisitionTime: A } = this.seriesInfo;
      if (A && A.length >= 6) {
        res = A.substr(0, 2) + ":" + A.substr(2, 2) + ":" + A.substr(4, 2);
      }
      return res;
    },
    //窗宽窗位
    wwwl() {
      let { ww, wl } = this.imageData;
      let w = ww,
        l = wl;

      return `${this.$t("settings.info.ww")}:${this.$num2e(w)} ${this.$t(
        "settings.info.wl",
      )}:${this.$num2e(l)}`;
    },
    SUV() {
      let { ww, wl } = this.imageData;

      let max = wl + ww / 2;
      let min = wl - ww / 2;
      let str = "";

      let { model, PW, RTD, RHL, ST, ET, UT, Units } = this.seriesInfo;
      let unit = "";
      if (model === "PT") {
        unit = "SUV";
        max = DATA.getSUV(max, PW, RTD, RHL, ST, ET, UT, Units);
        min = DATA.getSUV(min, PW, RTD, RHL, ST, ET, UT, Units);
      } else if (model === "CT") {
        unit = "HU";
      }
      str = `T:${this.$num2e(max)}${unit},B:${this.$num2e(min)}${unit}`;

      return str;
    },
    colorSrc() {
      let { colormapIndex } = this.imageData;
      let key = colormapIndex;
      let src = DATA.getCMPSrc(key);
      return src;
    },
    getRulerGraduate() {
      let { curViewMod, scale, dataWithInfo } = this.imageData;
      let pix = {
        w: dataWithInfo.pixelSpacingW,
        h: dataWithInfo.pixelSpacingH,
      };
      let height = this.canvasSize.height;
      let sizeFlag = 20;
      if (height > 600) {
        sizeFlag = 25;
      } else if (height < 500 && height >= 400) {
        sizeFlag = 15;
      } else if (height < 400) {
        sizeFlag = 10;
      }
      let ps = Math.abs(
        (Math.min(pix.h, pix.w) * sizeFlag) /
          Math.min(Math.abs(scale.y), Math.abs(scale.x)),
      );
      for (let i = 0; i < 18; i++) {
        if (this.rulerGraduate[i] < ps && ps <= this.rulerGraduate[i + 1]) {
          this.rulerHeight =
            ((sizeFlag * this.rulerGraduate[i + 1]) / ps).toFixed(0) * 8 + 1;
          return this.rulerGraduate[i + 1];
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./viewer-dicominfo.scss";
</style>
