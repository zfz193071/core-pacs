<template>
  <div class="selectBox_main" id="setParam" :class="{ vertical }">
    <p class="param-header">
      {{ LANG.Settings2[LANG.index] }}
      <span class="close" @click.stop="back"></span>
    </p>
    <div class="container" @mousedown.stop>
      <div class="box">
        <p>{{ LANG.Weight[LANG.index] }}(Kg):</p>
        <input v-model="PW" :class="{ invalid: invalid.PW }" />
      </div>
      <div class="box">
        <p>{{ LANG.TotalDose[LANG.index] }}：</p>
        <section>
          <input
            v-model="RTD"
            :class="{ invalid: invalid.RTD }"
            class="rtd"
            :title="RTD"
          />
          <div class="selectBox3">
            <div class="input">{{ UT }}</div>
            <ul class="scrollbar2">
              <li @click.stop="UT = 'Bq'">Bq</li>
              <li @click.stop="UT = 'Mci'">Mci</li>
            </ul>
          </div>
        </section>
      </div>
      <div class="box">
        <p>{{ LANG.HalfLife[LANG.index] }}(S):</p>
        <section>
          <input
            v-model="RHL"
            :class="{ invalid: invalid.RHL }"
            class="rtd"
            :title="RHL"
          />
          <div class="selectBox3">
            <div class="input">药物</div>
            <ul class="scrollbar2">
              <li @click.stop="changeTR('F18')">F18</li>
            </ul>
          </div>
        </section>
      </div>
      <div class="box">
        <p>{{ LANG.InjectionTime[LANG.index] }}:</p>
        <div>
          <input
            v-model="ST.h"
            maxlength="2"
            :class="{ invalid: invalid.ST_h }"
          />
          <div class="division">:</div>
          <input
            v-model="ST.m"
            maxlength="2"
            :class="{ invalid: invalid.ST_m }"
          />
          <div class="division">:</div>
          <input
            v-model="ST.s"
            maxlength="2"
            :class="{ invalid: invalid.ST_s }"
          />
        </div>
      </div>
      <div class="box">
        <p>{{ LANG.StudyTime[LANG.index] }}:</p>
        <div>
          <input
            v-model="ET.h"
            maxlength="2"
            :class="{ invalid: invalid.ET_h }"
          />
          <div class="division">:</div>
          <input
            v-model="ET.m"
            maxlength="2"
            :class="{ invalid: invalid.ET_m }"
          />
          <div class="division">:</div>
          <input
            v-model="ET.s"
            maxlength="2"
            :class="{ invalid: invalid.ET_s }"
          />
        </div>
      </div>
      <div class="btns">
        <div @click.stop="sure">{{ LANG.ok[LANG.index] }}</div>
        <div class="reset icon-reset default-font" @click.stop="resetParam">
          {{ LANG.reset[LANG.index] }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import DATA from "../js/data.js";
import LANG from "../../../assets/js/lang.js";
import api from "../../../assets/api/index.js";
export default {
  name: "viewer-setParam",
  props: {
    vertical: Boolean,
    paramShow: { required: true },
    seriesInfo: { required: true },
    currentSID: { required: true },
    imgPoor: { required: true },
    ieditListData: { required: true },
    roiShow: { required: true },
  },
  data: function () {
    return {
      LANG,
      PW: null, //体重（kg）
      UT: "Bq", //总放射剂量单位
      RTD: null, //总放射剂量（Bq）
      RHL: null, //药物半衰期（S）
      ST: {
        h: "00",
        m: "00",
        s: "00",
      }, //药物注射时间（00：00：00）
      ET: {
        h: "00",
        m: "00",
        s: "00",
      }, //检查时间（00：00：00）
      invalid: {
        PW: false,
        RTD: false,
        RHL: false,
        ST_h: false,
        ST_m: false,
        ST_s: false,
        ET_h: false,
        ET_m: false,
        ET_s: false,
      },
      series_pt: {},
    };
  },
  created() {
    //先判断是否是融合图像
    this.series_pt = this.seriesInfo;
    this.init();
  },

  mounted() {
    this.$follow_mouse("setParam");
  },

  methods: {
    back() {
      this.$emit("update:paramShow", false);
    },
    init() {
      let { PW, RTD, RHL, ST, ET, UT } = this.series_pt;
      this.UT = UT;
      this.PW = PW;
      this.RTD = RTD;
      this.RHL = RHL;
      this.ST = {
        h: ST.substring(0, 2),
        m: ST.substring(2, 4),
        s: ST.substring(4, 6),
      };
      this.ET = {
        h: ET.substring(0, 2),
        m: ET.substring(2, 4),
        s: ET.substring(4, 6),
      };
    },
    //错误重置
    errReset() {
      this.invalid = {
        PW: false,
        RTD: false,
        RHL: false,
        ST_h: false,
        ST_m: false,
        ST_s: false,
        ET_h: false,
        ET_m: false,
        ET_s: false,
      };
    },
    //验证参数
    verifyParam() {
      this.errReset();
      let num = 0;
      let keys = ["PW", "RTD", "RHL"];
      for (let i = 0; i < keys.length; i++) {
        num = this.ISNaN(keys[i], num);
      }
      let keys2 = ["ST_h", "ST_m", "ST_s", "ET_h", "ET_m", "ET_s"];
      for (let i = 0; i < keys2.length; i++) {
        num = this.ISNaT(keys2[i], num);
      }
      return num;
    },
    ISNaN(key, num) {
      let p = this[key] * 1;
      if (isNaN(p) || !this[key] || !p) {
        this.invalid[key] = true;
        num++;
      }
      return num;
    },
    ISNaT(key, num) {
      let [key1, key2] = key.split("_");
      let item = this[key1][key2];
      let p = item * 1;
      let err = 0;
      if (isNaN(p) || item.length !== 2 || p < 0) {
        err++;
      } else {
        switch (key2) {
          case "h": {
            if (p > 23) err++;
            break;
          }
          case "m":
          case "s": {
            if (p > 59) err++;
            break;
          }
        }
      }
      if (err) {
        this.invalid[key] = true;
        num++;
      }
      return num;
    },
    sure() {
      let num = this.verifyParam();
      if (num) return;
      let { PW, RTD, RHL, ST, ET, UT } = this;
      let oldVal = Object.assign({}, this.series_pt);
      let obj = {
        PW,
        RTD,
        RHL,
        UT,
        ST: ST.h + ST.m + ST.s,
        ET: ET.h + ET.m + ET.s,
      };

      let params = {
        series_id: this.series_pt.currentSID,
        obj,
      };
      api.updatePT(params).then((res) => {
        if (res.code === 1) {
          this.syncParam(oldVal, obj);
          this.back();
          this.$layer("设置成功");
        } else {
          this.$layer("设置失败", undefined, "fail");
        }
      });
    },
    changeTR(res) {
      let TR = {
        F18: "6588.000000",
      };
      this.RHL = TR[res];
    },
    resetParam() {
      let oldVal = Object.assign({}, this.series_pt);
      let obj = {
        PW: oldVal.cPW,
        RTD: oldVal.cRTD,
        RHL: oldVal.cRHL,
        UT: oldVal.cUT,
        ST: oldVal.cST,
        ET: oldVal.cET,
      };
      this.syncParam(oldVal, obj);
      this.init();
    },
    //同步参数
    syncParam(oldVal, obj) {
      this.seriesInfo.UT = obj.UT;
      this.seriesInfo.PW = obj.PW;
      this.seriesInfo.RTD = obj.RTD;
      this.seriesInfo.RHL = obj.RHL;
      this.seriesInfo.ST = obj.ST;
      this.seriesInfo.ET = obj.ET;
      this.seriesInfo.cUT = obj.UT;
      this.seriesInfo.cPW = obj.PW;
      this.seriesInfo.cRTD = obj.RTD;
      this.seriesInfo.cRHL = obj.RHL;
      this.seriesInfo.cST = obj.ST;
      this.seriesInfo.cET = obj.ET;

      let { currentSID: pt_currentSID } = this.series_pt;
      let { PW, RTD, RHL, ST, ET, UT, Units } = obj;

      if (this.imgPoor[pt_currentSID] && this.imgPoor[pt_currentSID].info) {
        this.imgPoor[pt_currentSID].info.PW = PW;
        this.imgPoor[pt_currentSID].info.RTD = RTD;
        this.imgPoor[pt_currentSID].info.RHL = RHL;
        this.imgPoor[pt_currentSID].info.ST = ST;
        this.imgPoor[pt_currentSID].info.ET = ET;
        this.imgPoor[pt_currentSID].info.UT = UT;

        this.imgPoor[pt_currentSID].info.cPW = PW;
        this.imgPoor[pt_currentSID].info.cRTD = RTD;
        this.imgPoor[pt_currentSID].info.cRHL = RHL;
        this.imgPoor[pt_currentSID].info.cST = ST;
        this.imgPoor[pt_currentSID].info.cET = ET;
        this.imgPoor[pt_currentSID].info.cUT = UT;
      }
      let num =
        DATA.getSUV(1, PW, RTD, RHL, ST, ET, UT, Units) /
        DATA.getSUV(
          1,
          oldVal.PW,
          oldVal.RTD,
          oldVal.RHL,
          oldVal.ST,
          oldVal.ET,
          oldVal.UT,
          Units
        );
      //重置suv值 （未保存到后台 只是本地刷新 因为参数值未保存在后台）
      for (let key in this.ieditListData) {
        if (key === pt_currentSID) {
          let ieditListData = this.ieditListData[key];
          for (let j = 0; j < ieditListData.length; j++) {
            ieditListData[j].max = num * ieditListData[j].max;
            ieditListData[j].min = num * ieditListData[j].min;
            ieditListData[j].aver = num * ieditListData[j].aver;
            ieditListData[j].variance = num * ieditListData[j].variance;
          }
          this.$emit("update:roiShow", this.roiShow + 1);
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./viewer-setParam.scss";
</style>
