<template>
  <div id="roiList" :class="{ vertical }" :style="{ height }">
    <div class="roiHead">
      <p>{{ $t("markList") }}</p>
      <span class="close" @click.stop="close"></span>
    </div>
    <div class="border"></div>
    <section @mousedown.stop>
      <ul class="scrollbar">
        <li
          v-for="(item, index) in list_data"
          @click.stop="changeRemaks(item)"
          :key="item.ID"
        >
          <p class="index" @click.stop="del(item.ID)">
            {{ index + 1 }}
          </p>
          <p class="namespace">
            <input
              type="text"
              v-model="item.name"
              @blur="changeName"
              :placeholder="$t('unnamed')"
            />
          </p>
          <p class="type">{{ item.type | typeFilter(that) }}</p>
          <p class="liTime">{{ item.date | formatDate(that) }}</p>
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
import LANG from "../../../assets/js/lang.js";
export default {
  name: "viewer-roi-list",
  props: {
    vertical: Boolean,
    seriesListPos: String,
    ieditListData: { type: Object, required: true },
    currentSID: { required: true },
    roiListShow: { type: Boolean, required: true },
  },
  data: function () {
    return {
      that: this,
      LANG,
      list_data: [],
    };
  },

  mounted() {
    this.$follow_mouse("roiList");
    if (Array.isArray(this.ieditListData[this.currentSID])) {
      this.list_data = this.ieditListData[this.currentSID].filter((item) => {
        return !item.ifNoneInfo && item.createType !== "AIAnaysis";
      });
    }
  },

  computed: {
    height() {
      const toolbarHeight = this.vertical ? "104px" : "52px";
      const bottomSeriesListHeight =
        this.seriesListPos === "BOTTOM" ? "145px" : "0px";
      return `calc(100% - ${toolbarHeight} - ${bottomSeriesListHeight})`;
    },
    currEditData() {
      return this.ieditListData[this.currentSID];
    },
  },

  methods: {
    close() {
      this.$emit("update:roiListShow", false);
    },
    changeName(index) {
      let obj = new Object();
      for (var i = 0; i < this.list_data.length; i++) {
        delete this.list_data[i].imgData;
      }
      Object.keys(this.ieditListData).forEach((key) => {
        obj[key] = this.ieditListData[key];
      });
      obj[this.currentSID] = this.list_data;
      this.$emit("update:ieditListData", obj);
      this.$emit("saveMarks", this.currentSID);
    },
    del(ID) {
      const index = this.list_data.findIndex((data) => data.ID === ID);
      this.list_data.splice(index, 1);
      this.$emit("delMarks", ID);
    },
    changeRemaks(item) {
      this.$emit("setMarkPosi", item);
    },
  },
  filters: {
    typeFilter(type, that) {
      switch (type) {
        case "Pen": {
          return that.$t("pen");
        }
        case "Circle": {
          return that.$t("circle");
        }
        case "Rect": {
          return that.$t("rect");
        }
        case "CurveLine": {
          return that.$t("curve");
        }
        case "Arrow": {
          return that.$t("arrow");
        }
        case "Angle": {
          return that.$t("angle");
        }
        case "Ruler": {
          return that.$t("ruler");
        }
        case "CurveRuler": {
          return that.$t("CurveRuler");
        }
        case "Text": {
          return that.$t("text");
        }
        case "Point": {
          return that.$t("pixel");
        }
        case "CPRPoint": {
          return that.$t("CPRPoint");
        }
        case "HeartChest": {
          return that.$t("cardiothoracicRatio");
        }
        case "COBAngle": {
          return that.$t("COBAngle");
        }
      }
    },

    formatDate(dateStr, that) {
      const date = new Date(dateStr);
      if (!that.$moment(date).isValid()) return dateStr;
      return that.$moment(date).format("YYYYMMDD HH:mm:ss");
    },
  },

  watch: {
    currEditData: {
      handler() {
        if (!this.ieditListData[this.currentSID]) {
          this.list_data = [];
          return;
        }
        if (Array.isArray(this.ieditListData[this.currentSID])) {
          this.list_data = this.ieditListData[this.currentSID].filter(
            (item) => {
              return !item.ifNoneInfo && item.createType !== "AIAnaysis";
            },
          );
        }
      },
      deep: true,
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./viewer-roi-list.scss";
</style>
