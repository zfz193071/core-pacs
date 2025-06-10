<template>
  <div id="registration">
    <div class="box" id="moveDom" :style="domStyle">
      <div class="head">
        <p>{{ $t("reg.title") }}</p>
        <span @click.stop="back"></span>
      </div>
      <div @mousedown.stop>
        <svg-icon
          v-if="dataSelectShow"
          class="arrow-right"
          :name="iconName('arrow-right')"
          @click.native="handleHide"
        ></svg-icon>
      </div>
      <div class="btn-show" @mousedown.stop v-if="!dataSelectShow">
        <svg-icon
          class="arrow-left"
          :name="iconName('arrow-left')"
          @click.native="handleShow"
        ></svg-icon>
        <span>{{ $t("reg.params") }}</span>
      </div>
      <div @mousedown.stop style="height: calc(100% - 36px)">
        <div class="dataSelect" v-if="dataSelectShow">
          <span class="title">{{ $t("reg.select") }}</span>
          <span class="label">{{ $t("reg.floatingLayer") }}</span>
          <el-select
            class="mgb14"
            v-model="left_study"
            :placeholder="$t('reg.selectStudy')"
            size="mini"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in studyList"
              :key="item.key"
              :label="item.PatientName + '/' + item.StudyDate"
              :value="item.key"
            ></el-option>
            <template slot="empty">
              <p class="empty">{{ $t("reg.noData") }}</p>
            </template>
          </el-select>
          <el-select
            v-model="left_series"
            :placeholder="$t('reg.selectSeries')"
            size="mini"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in left_seriesList"
              :key="item.seriesId"
              :label="item.id + '/' + item.description"
              :value="item.seriesId"
            ></el-option>
            <template slot="empty">
              <p class="empty">{{ $t("reg.noData") }}</p>
            </template>
          </el-select>
          <span class="label">{{ $t("reg.referenceLayer") }}</span>
          <el-select
            class="mgb14"
            v-model="right_study"
            :placeholder="$t('reg.selectStudy')"
            size="mini"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in studyList"
              :key="item.key"
              :label="item.PatientName + '/' + item.StudyDate"
              :value="item.key"
            ></el-option>
            <template slot="empty">
              <p class="empty">{{ $t("reg.noData") }}</p>
            </template>
          </el-select>
          <el-select
            v-model="right_series"
            :placeholder="$t('reg.selectSeries')"
            size="mini"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in right_seriesList"
              :key="item.seriesId"
              :label="item.id + '/' + item.description"
              :value="item.seriesId"
            ></el-option>
            <template slot="empty">
              <p class="empty">{{ $t("reg.noData") }}</p>
            </template>
          </el-select>
        </div>
        <div class="paramSelect" v-if="dataSelectShow">
          <span class="title">{{ $t("reg.registrationParams") }}</span>
          <span class="label">{{ $t("reg.move") }}</span>
          <div class="input-number">
            <span>x :</span>
            <el-input-number v-model="optTrans.trans.x"></el-input-number>
          </div>
          <div class="input-number">
            <span>y :</span>
            <el-input-number v-model="optTrans.trans.y"></el-input-number>
          </div>
          <div class="input-number mgb0">
            <span>z :</span>
            <el-input-number v-model="optTrans.trans.z"></el-input-number>
          </div>
          <span class="label">{{ $t("rotate") }}</span>
          <div class="input-number">
            <span>x :</span>
            <el-input-number v-model="optTrans.dRote.rx"></el-input-number>
          </div>
          <div class="input-number">
            <span>y :</span>
            <el-input-number v-model="optTrans.dRote.ry"></el-input-number>
          </div>
          <div class="input-number">
            <span>z :</span>
            <el-input-number v-model="optTrans.dRote.rz"></el-input-number>
          </div>
        </div>
        <div class="applySelect" v-if="dataSelectShow">
          <el-select
            v-model="applicationScenarios"
            size="mini"
            :popper-append-to-body="false"
          >
            <el-option :label="$t('reg.series')" value="series"></el-option>
            <el-option :label="$t('reg.study')" value="study"></el-option>
          </el-select>
          <div class="confirm" @click="handleApply">{{ $t("reg.use") }}</div>
        </div>
        <div class="main" @mousedown.stop>
          <div class="mid" ref="mid">
            <div
              class="mid_box"
              v-for="(item, index) in imageDatas"
              :class="{ active: canvasNow === index }"
              :key="index"
              :style="{
                height: size[index].height + 'px',
                width: size[index].width + 'px',
                left: size[index].left + 'px',
                top: size[index].top + 'px',
              }"
            >
              <regCanvas
                v-if="imageDatas[index] && done"
                :index="index"
                :canvasNow.sync="canvasNow"
                :pt_poor="pt_poorObj"
                :ct_poor="ct_poorObj"
                :series_ct="series_ct"
                :series_pt="series_pt"
                :imageData.sync="imageDatas[index]"
                :size="size[index]"
                :clearFlag="clearFlag"
                :resizeFlag="resizeFlag"
                :optTrans.sync="optTrans"
                :petOpacity="petOpacity"
                :AcrossPoint="AcrossPoint"
                @syncAP="syncAP"
              ></regCanvas>
            </div>
          </div>
        </div>
        <div class="tips">*{{ $t("reg.tips") }}</div>
        <div class="handle">
          <div class="handle-item" @click.stop="autoR">
            <div class="round">
              <svg-icon :name="iconName('registration-auto')"></svg-icon>
            </div>
            <span>{{ $t("reg.auto") }}</span>
          </div>
          <div class="handle-item" @click.stop="reset">
            <div class="round">
              <svg-icon :name="iconName('registration-load')"></svg-icon>
            </div>
            <span>{{ $t("reg.load") }}</span>
          </div>
          <div class="handle-item" @click.stop="clear">
            <div class="round">
              <svg-icon :name="iconName('registration-clear')"></svg-icon>
            </div>
            <span>{{ $t("reg.clear") }}</span>
          </div>
        </div>
      </div>
      <!-- <div class="scale" @mousedown.stop="scaleFn"></div> -->
    </div>
    <div class="loading" v-show="loadingShow"></div>
  </div>
</template>

<script>
import DATA from "../js/data";
import CLICKOPT from "../js/clickOpt.js";
import regCanvas from "./regRender.vue";
// import viewerVr from "../viewer-vr/viewer-vr.vue";
import DOMFN from "./domFn";
import REGDATA from "./regData";
import AUTOREG from "./autoReg";

export default {
  name: "viewer-registration",
  data: function () {
    return {
      size: [],
      style: {
        // left: 250,
        // top: 60,
        height: 763,
        width: 1220,
      },
      pt_poorObj: {},
      ct_poorObj: {},
      imageDatas: [],
      vrImageData: null,
      canvasNow: 0,
      optTrans: {
        trans: { x: 0, y: 0, z: 0 },
        dRote: { rx: 0, ry: 0, rz: 0 },
      },
      clearFlag: 0,
      resizeFlag: 0,
      loadingShow: false,
      vrDrawFlag: 0,
      vrStopFlag: true,
      done: false,
      mergeList: {},
      petOpacity: 0.5,
      wwwlForReg: {
        ww: 400,
        wl: 40,
        ww2: 400,
        wl2: 40,
      },
      seriesInfo: {},
      //数据选择
      left_study: null,
      left_series: null,
      right_study: null,
      right_series: null,
      AcrossPoint: {},
      dataSelectShow: true,
      applicationScenarios: "series",
    };
  },
  components: {
    regCanvas,
    // viewerVr,
  },
  props: {
    registrationShow: { type: Boolean, required: true },
    imgPoor: { type: Object, required: true },
    clickOpt: {},
    seriesList: {
      required: true,
    },
  },
  async created() {
    let { reg_size } = localStorage;
    if (reg_size) {
      try {
        let temp = JSON.parse(reg_size);
        if (temp.top > 0 && temp.left > 0) {
          this.style = temp;
          DOMFN.setSize(this);
          return;
        }
      } catch (error) {
        console.log(error);
      }
    }
    DOMFN.setSize(this);
  },
  mounted() {
    console.log("mounted reg", this.seriesList);
    //初始化的时候都不显示vr
    this.vrStopFlag = true;
    this.$follow_mouse("moveDom");
  },
  computed: {
    showPara(val, oldVal) {
      try {
        let { x: pt_x, y: pt_y, z: pt_z } = this.optTrans.trans;
        let { rx, ry, rz } = this.optTrans.dRote;
        let tr = `x：${Math.round(pt_x)}，y：${Math.round(
          pt_y,
        )}，z：${Math.round(pt_z)}`;
        let ro = `rx：${this.radianToAngle(rx)}，ry：${this.radianToAngle(
          ry,
        )}，rz：${this.radianToAngle(rz)}`;
        let res = `配准参数 ${tr}，${ro}`;
        return res;
      } catch (e) {
        return "";
      }
    },
    series_pt() {
      let series_pt = {};
      if (this.left_series && this.pt_poorObj && this.pt_poorObj.info) {
        series_pt = DATA.updataSeriesInfo(this.pt_poorObj.info, this.optTrans);
      }
      return series_pt;
    },
    series_ct() {
      let series_ct = {};
      if (this.right_series && this.ct_poorObj && this.ct_poorObj.info) {
        series_ct = DATA.updataSeriesInfo(
          this.ct_poorObj.info,
          this.ct_poorObj.registPara,
        );
      }
      return series_ct;
    },
    domStyle() {
      let { left, top, height, width } = this.style;
      let res = {
        left: left + "px",
        top: top + "px",
        height: height + "px",
        width: width + "px",
      };
      return res;
    },
    studyList() {
      let res = [];
      if (this.seriesList) {
        let keyList = Object.keys(this.seriesList);
        for (let i = 0; i < keyList.length; i++) {
          let item = this.seriesList[keyList[i]];
          res.push({
            PatientName: item.PatientName,
            StudyDate: item.StudyDate,
            key: keyList[i],
          });
        }
      }
      return res;
    },
    left_seriesList() {
      let study = this.seriesList[this.left_study];
      let data = study ? study.data : [];
      let res = [];
      for (let i = 0; i < data.length; i++) {
        let sid = data[i].seriesId;
        if (
          this.imgPoor[sid] &&
          this.imgPoor[sid].imageDone &&
          !this.imgPoor[sid].info.isNotUniformSquence &&
          this.imgPoor[sid].num > 2
        ) {
          res.push(data[i]);
        }
      }
      return res;
    },

    //不需要数据下载完成,不需要非均匀序列，不需要有3张以上图片
    seriesListForSave() {
      let study = this.seriesList[this.left_study];
      let data = study ? study.data : [];
      let res = [];
      for (let i = 0; i < data.length; i++) {
        let sid = data[i].seriesId;
        if (this.imgPoor[sid]) {
          res.push(data[i]);
        }
      }
      return res;
    },
    right_seriesList() {
      let study = this.seriesList[this.right_study];
      let data = study ? study.data : [];
      let res = [];
      for (let i = 0; i < data.length; i++) {
        let sid = data[i].seriesId;
        if (
          this.imgPoor[sid] &&
          this.imgPoor[sid].imageDone &&
          !this.imgPoor[sid].info.isNotUniformSquence &&
          this.imgPoor[sid].num > 2
        ) {
          res.push(data[i]);
        }
      }
      return res;
    },
  },
  methods: {
    iconName(name) {
      const theme = this.$store.state.theme;
      if (theme === "light") return `${name}-light`;
      return name;
    },
    handleHide() {
      this.style.width -= 205;
      this.dataSelectShow = false;
    },
    handleShow() {
      this.style.width += 205;
      this.dataSelectShow = true;
    },
    syncAP(para) {
      let { index, curImageNum } = para;
      this.imageDatas[index].curImageNum = curImageNum;
      let imgCoord = {
        x: this.imageDatas[2].curImageNum,
        y: this.imageDatas[1].curImageNum,
        z: this.imageDatas[0].curImageNum,
      };
      let { volumeOrientation, volumeSpacing, ImagePositionPatient } =
        this.series_ct;
      let ori = volumeOrientation[0];
      let spacing = volumeSpacing[0];
      let dic = ["x", "y", "z"];
      let newAP = {
        x: ImagePositionPatient[0],
        y: ImagePositionPatient[1],
        z: ImagePositionPatient[2],
      };
      for (let i = 0; i < 3; i++) {
        newAP[dic[i]] =
          ImagePositionPatient[i] +
          ori[0][i] * imgCoord.x * spacing.w +
          ori[1][i] * imgCoord.y * spacing.h +
          ori[2][i] * imgCoord.z * spacing.d;
      }
      this.AcrossPoint = newAP;
    },
    async mixChangeHandle() {
      if (this.left_series && this.right_series) {
        this.pt_poorObj = this.imgPoor[this.left_series];
        this.ct_poorObj = this.imgPoor[this.right_series];
        REGDATA.initData(this);
        await this.resetTrans();
        this.done = true;
      }
    },
    radianToAngle(redian) {
      let r = Math.round((redian * 180) / Math.PI);
      r = r % 360;
      return r;
    },
    //返回
    back() {
      this.$emit("update:registrationShow", false);
    },
    //获取pt偏移量
    getTranslate() {
      let { series_pt, series_ct } = this;
      let { x: xpos2, y: ypos2, z: zpos2 } = series_pt.ImagePositionPatient;
      let { x: xpos1, y: ypos1, z: zpos1 } = series_ct.ImagePositionPatient;
      let x = xpos2 - xpos1;
      let y = ypos2 - ypos1;
      let z = -(zpos2 - zpos1);
      return { x, y, z };
    },
    clearTrans() {
      this.optTrans = {
        trans: { x: 0, y: 0, z: 0 },
        dRote: { rx: 0, ry: 0, rz: 0 },
      };
      this.clearFlag++;
    },
    async resetTrans() {
      this.clearTrans();
      if (this.pt_poorObj && this.pt_poorObj.info) {
        let temp = await DATA.getRegistPara(this.pt_poorObj.info.currentSID);
        if (temp) {
          this.optTrans = temp;
        }
      }
    },
    //重置
    async reset() {
      await this.resetTrans();
      this.$layer(this.$t("reg.loadTip"), 2000);
      this.$emit("update:clickOpt", "delMark");
      //更新vr视图
      if (!this.vrStopFlag) {
        this.vrDrawFlag++;
      }
    },
    //清除
    clear() {
      this.clearTrans();
      this.$layer(this.$t("reg.clearTip"), 2000);
      this.$emit("update:clickOpt", "delMark");
      //更新vr视图
      if (!this.vrStopFlag) {
        this.vrDrawFlag++;
      }
    },

    async handleApply() {
      this.applicationScenarios === "series"
        ? await this.applyToSeries()
        : await this.applyToStudy();
    },
    // 应用到序列
    async applyToSeries() {
      await DATA.saveRegistPara(
        this.series_pt.currentSID,
        this.optTrans,
        this.imgPoor,
      );
      //全局更新
      this.$emit("updateRegParaAll");
      //重新载入
      await this.mixChangeHandle();
    },
    //应用到检查
    async applyToStudy() {
      let seriesList = this.seriesListForSave;
      for (let i = 0; i < seriesList.length; i++) {
        let currentSID = seriesList[i].seriesId;
        await DATA.saveRegistPara(currentSID, this.optTrans, this.imgPoor);
      }
      this.$emit("updateRegParaAll");
      //重新载入
      await this.mixChangeHandle();
    },
    //自动配准
    async autoR() {
      if (!this.left_series) return;
      console.log("go into auto");
      let { series_ct, pt_poorObj, ct_poorObj, imageDatas } = this;
      let imageData = imageDatas[0];

      this.loadingShow = true;
      const that = this;
      setTimeout(async () => {
        if (pt_poorObj.info.currentSID === ct_poorObj.info.currentSID) {
          //重置trans到上一次存档
          await this.resetTrans();
          this.loadingShow = false;
          return;
        }
        //用中心对齐初始化XYZ方向
        let newOptTrans = {
          trans: { x: 0, y: 0, z: 0 },
          dRote: { rx: 0, ry: 0, rz: 0 },
        };
        newOptTrans = AUTOREG.regXYZCenter(series_ct, pt_poorObj, newOptTrans);

        //配准Z（在XYZ中心已经对齐的基础上）
        newOptTrans = AUTOREG.regZ(
          series_ct,
          ct_poorObj,
          pt_poorObj,
          newOptTrans,
          imageData,
        );
        that.optTrans = newOptTrans;
        for (let i = 0; i < 3; i++) {
          imageDatas[i].scale = CLICKOPT.getFullScale(
            this.size[i],
            i,
            series_ct,
          );
        }
        this.clearFlag++;
        that.loadingShow = false;
      }, 10);
    },
    //缩放
    // scaleFn(e) {
    //   DOMFN.scaleFn(this, moveDom, e);
    // },
    setInit() {
      if (this.studyList.length > 0) {
        this.left_study = this.left_study || this.studyList[0].key;
        this.right_study = this.right_study || this.studyList[0].key;
        if (this.left_seriesList.length > 0) {
          this.left_series = this.left_seriesList[0].seriesId;
        }
        if (this.right_seriesList.length > 0) {
          this.right_series = this.right_seriesList[0].seriesId;
        }
      }
    },
  },
  watch: {
    left_seriesList() {
      if (!this.left_series) {
        //测试代码
        this.setInit();
      }
    },
    right_seriesList() {
      if (!this.right_series) {
        //   测试代码
        this.setInit();
      }
    },
    left_series: {
      handler: async function () {
        await this.mixChangeHandle();
      },
      deep: true,
    },
    right_series: {
      handler: async function () {
        await this.mixChangeHandle();
      },
      deep: true,
    },
    style: {
      handler() {
        DOMFN.setSize(this);
      },
      deep: true,
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./viewer-registration.scss";
</style>
