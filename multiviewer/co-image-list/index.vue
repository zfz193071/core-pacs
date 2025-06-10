<template>
  <div class="image-list-wrapper" id="imagelist" :style="style">
    <p>
      {{ $t("imageList") }}
      <span class="close" @click.stop="close"></span>
    </p>
    <div class="border"></div>
    <div class="handle-bar">
      <span>
        <span @click="handleSelectAll">
          <svg-icon :name="selectAll ? 'round-select' : 'round-unselect'" />
        </span>
        {{ $t("selectAll") }}
      </span>
      <div>
        <button class="btn-save" @click="handleSaveToSeries">
          {{ $t("saveToSeries") }}
        </button>
        <button class="btn-delete" @click="handleDelete">
          {{ $t("delete") }}
        </button>
      </div>
    </div>
    <ul class="scrollbar">
      <li
        class="image-item"
        :class="{ selected: image.selected, preview: currIndex === index }"
        v-for="(image, index) in imageList"
        @click.stop="previewImg(image.id, index)"
        :key="image.id"
      >
        <div class="btn-select" @click.stop="selectImg(index)">
          <svg-icon
            :name="image.selected ? 'round-select' : 'round-unselect'"
          />
        </div>
        <img :src="image.filePath" />
        <div class="desc">{{ image.notes }}</div>
      </li>
    </ul>
    <image-detail
      v-if="currIndex !== null"
      :canvasRange="canvasRange"
      :scale="scaleRatio"
      :currNum="currIndex + 1"
      :totalNum="imageList.length"
      :image.sync="imageList[currIndex]"
      @close="currIndex = null"
      @changeIndex="handleChangeIndex"
    />
  </div>
</template>

<script>
import { createImgPoor, formatSeriesList } from "../fetch/seriesdata";
import { DataHandler } from "../js/dataToSeries";
import seriesApi from "../../../assets/api/series";
import { mapState, mapMutations } from "vuex";
import ImageDetail from "./image-detail.vue";
import moment from "moment";
export default {
  name: "co-imageList",
  components: {
    ImageDetail,
  },
  data() {
    return {
      imageList: [],
      currIndex: null,
      currId: "",
      selectAll: false,
    };
  },
  props: {
    showImageList: Boolean,
    canvasRange: Object,
  },
  computed: {
    ...mapState(["scaleRatio", "imgPoor"]),
    style() {
      return {
        height: `calc(1 / ${this.scaleRatio} * (100% - ${this.canvasRange.RBTopWidth}px - ${this.canvasRange.RBBottomWidth}px))`,
        top: `${this.canvasRange.RBTopWidth}px`,
        transform: `scale(${this.scaleRatio})`,
        transformOrigin: "100% 0",
      };
    },
    studyKey() {
      const studyInfos = this.$store.state.studyInfos;
      const keys = Object.keys(studyInfos);

      if (keys.length > 1) {
        keys.sort((a, b) => {
          return moment(studyInfos[a].date).isAfter(moment(studyInfos[b].date))
            ? -1
            : 1;
        });
      }
      let studyKey = keys[0];
      return studyKey;
    },
  },
  methods: {
    ...mapMutations(["setImgPoor"]),
    async getImgList() {
      const res = await seriesApi.getScreenshotList(this.studyKey);
      if (res.code === 200) {
        this.imageList = res.data.map((v) => {
          this.$set(v, "selected", false);
          return v;
        });
        this.selectAll = false;
      }
    },
    close() {
      this.$emit("update:showImageList", false);
    },
    selectImg(index) {
      this.imageList[index].selected = !this.imageList[index].selected;
      this.selectAll = this.imageList.every((item) => item.selected);
    },
    previewImg(id, index) {
      this.currId = id;
      this.currIndex = index;
    },
    handleSelectAll() {
      this.selectAll = !this.selectAll;
      this.imageList.forEach((item) => {
        item.selected = this.selectAll;
      });
    },
    async handleDelete() {
      if (!this.imageList.find((v) => v.selected)) {
        return this.$layer("请勾选要删除的图像", undefined, "warn");
      }
      const ids = this.imageList.filter((v) => v.selected).map((j) => j.id);
      const res = await seriesApi.deleteScreenshot({ fileIds: ids });
      if (res.code === 200) {
        await this.getImgList();
        this.selectAll = false;
        const tempIndex = this.imageList.findIndex((v) => v.id === this.currId);
        this.currIndex = tempIndex > -1 ? tempIndex : null;
        this.$layer("删除成功", undefined, "success");
      } else if (res.code === 66666) {
        this.$layer("无权限，操作失败", undefined, "warn");
      } else if (res.code === 55555) {
        this.$layer("登录已过期，请重新登录", undefined, "warn");
      }
    },
    async handleSaveToSeries() {
      const studyInfos = this.$store.state.studyInfos[this.studyKey];
      if (!this.imageList.find((v) => v.selected)) {
        return this.$layer("请勾选要存为序列的图像", undefined, "warn");
      }
      this.$loading();
      const ids = this.imageList.filter((v) => v.selected).map((j) => j.id);
      const res = await seriesApi.seriesScreenshotToSeries({ fileIds: ids });
      if (res.code === 200) {
        const info = {
          accessionNumber: studyInfos.accessionNumber,
          date: studyInfos.date,
          description: studyInfos.description,
          deviceModel: studyInfos.deviceModel,
          id: studyInfos.id,
          patient: studyInfos.patient,
          pipeline: studyInfos.pipeline,
          series: [res.data],
          seriesId: studyInfos.seriesId,
          sid: studyInfos.sid,
          stationName: studyInfos.stationName,
          time: studyInfos.time,
          uid: studyInfos.uid,
        };
        const data = DataHandler(info, info.uid, true);
        const newData = formatSeriesList([res.data], studyInfos);
        const lists = this.$parent.$refs.serieslist.LISTS;
        lists[this.studyKey + "x"].data.push(newData[0]);
        this.$set(lists, this.studyKey + "x", lists[this.studyKey + "x"]);
        const imgPoor = this.imgPoor;
        const tasks = data.map((item) => {
          return new Promise((resolve) => {
            const { seriesInfo } = item;
            createImgPoor(seriesInfo).then((result) => {
              imgPoor[seriesInfo.SeriesIndex] = result;
              this.setImgPoor(imgPoor);
              resolve();
            });
          });
        });
        await Promise.all(tasks);
        this.$emit("forceLoadImg", 0, {});
        this.$loading(false);
      } else {
        if (res.code === 401) {
          this.$layer("无权限，操作失败", undefined, "warn");
        } else if (res.code === 2002) {
          this.$layer("登录已过期", undefined, "warn");
        } else if (res.code === 500) {
          const msg = res.message;
          if (msg === "当前检查只有一个SR序列，不支持截图转序列") {
            this.$layer(msg, undefined, "warn");
          }
        } else {
          this.$layer("系统异常", undefined, "warn");
        }
        this.$loading(false);
      }
    },
    handleChangeIndex(index) {
      this.currIndex += index;
      if (this.currIndex < 0) {
        this.currIndex = this.imageList.length - 1;
      } else if (this.currIndex >= this.imageList.length) {
        this.currIndex = 0;
      }
      this.currId = this.imageList[this.currIndex].id;
    },
  },

  mounted() {
    this.getImgList();
    // this.$follow_mouse("imagelist");
  },
};
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>
