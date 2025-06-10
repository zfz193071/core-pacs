<template>
  <div v-show="historyShow" id="historyList" ref="map" :style="style">
    <p>
      {{ $t("history") }}
      <span class="close" @click.stop="back"></span>
    </p>
    <div class="border"></div>
    <div class="history-content" @mousedown.stop>
      <div class="title">{{ $t("historyContent.current") }}</div>
      <HistoryTable :columnData="columnData" :tableData="currentData" />
      <div class="title">{{ $t("historyContent.history") }}</div>
      <HistoryTable
        :columnData="columnData"
        :tableData.sync="historyData"
        showCheck
      />
      <div class="btns">
        <button class="btn" @click="append">
          {{ $t("historyContent.append") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import HistoryTable from "./table.vue";
import { columnData } from "./constant";
import api from "../../../assets/api";
export default {
  name: "co-history",
  components: {
    HistoryTable,
  },
  props: {
    historyShow: { type: Boolean, required: true },
    canvasRange: Object,
    zindex: Number,
  },
  mounted() {
    this.$follow_mouse("historyList");
  },
  data() {
    return {
      columnData: [...columnData],
      historyData: [],
      currentData: [],
      index: 1000,
    };
  },
  computed: {
    ...mapState(["scaleRatio", "studyInfos"]),
    style() {
      return {
        height: `calc(1 / ${this.scaleRatio} * (100% - ${this.canvasRange.RBTopWidth}px - ${this.canvasRange.RBBottomWidth}px))`,
        top: `${this.canvasRange.RBTopWidth}px`,
        transform: `scale(${this.scaleRatio})`,
        transformOrigin: "100% 0",
        zIndex: this.index,
      };
    },
    originStudyId() {
      let study;
      for (let key in this.studyInfos) {
        if (this.studyInfos[key].isOrigin) {
          study = this.studyInfos[key];
          break;
        }
      }
      if (!study) return "";
      const { id: studyId } = study;
      return studyId;
    },
  },
  watch: {
    historyShow(val) {
      if (val) {
        this.getCurrStudyList().then((res) => {
          this.currentData = res;
        });
        this.getHistoryStudyList().then((res) => {
          this.historyData = res || [];
          this.historyData.forEach((item) => {
            if (this.studyInfos[item.id]) {
              item.checked = true;
            }
          });
        });
        this.index = this.zindex;
      } else {
        this.historyData = [];
      }
    },
  },
  methods: {
    back() {
      this.$emit("update:historyShow", false);
    },
    async getCurrStudyList() {
      if (!this.originStudyId) return [];
      let data = {
        studyIdList: [this.originStudyId],
      };
      return api.getStudyList(data).then((res) => {
        let { records } = res.data;
        return records;
      });
    },
    async getHistoryStudyList() {
      if (!this.originStudyId) return [];
      return api.getHistoryStudyList(this.originStudyId).then((res) => {
        let records = res.data;
        return records;
      });
    },
    append() {
      const appendData = this.historyData.filter((item) => {
        return item.checked;
      });
      console.log(this.historyData, appendData, "appendata");
      this.$emit("appendStudy", appendData);
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>
