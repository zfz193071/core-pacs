<template>
  <div v-show="downloadShow" id="downloadList" ref="map" :style="style">
    <p>
      {{ $t("download") }}
      <span class="close" @click.stop="back"></span>
    </p>
    <div class="border"></div>
    <div class="history-content" @mousedown.stop>
      <div class="title download-list-title">
        <div>{{ $t("historyContent.current") }}</div>
        <el-popover trigger="hover">
          <div class="download-task-list">
            <div
              class="task-item"
              v-for="item in downloadTasks"
              :key="item.studyId"
            >
              <div class="name">{{ item.filename }}</div>
              <div class="status">{{ getDownloadStatus(item.status) }}</div>
            </div>
          </div>
          <div slot="reference">
            {{
              downloadTasks[0]
                ? $t("downloadContent.downloading") +
                  ": " +
                  downloadTasks[0].filename
                : ""
            }}
          </div>
        </el-popover>
      </div>
      <DownloadTable
        showCheck
        :columnData="columnData"
        :tableData.sync="data"
      />
      <div class="btns">
        <button
          :class="{
            disabled: downloadDisable,
            btn: true,
          }"
          :disabled="downloadDisable"
          @click="startDownload"
        >
          {{ $t("download") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import DownloadTable from "../co-history/table.vue";
import { columnData } from "../co-history/constant";
import api from "../../../assets/api";
import { getDataType } from "@/assets/js/YMDataHandler.js";
export default {
  name: "co-download",
  components: {
    DownloadTable,
  },
  props: {
    downloadShow: { type: Boolean, required: true },
    canvasRange: Object,
    appendStudyList: Array,
    zindex: Number,
  },
  mounted() {
    this.$follow_mouse("downloadList");
    this.env = getDataType().env.toLocaleLowerCase();
  },
  data() {
    return {
      columnData: [...columnData],
      data: [],
      downloadTasks: [],
      downloadDisable: false,
      env: "",
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
  },
  watch: {
    downloadShow(val) {
      if (val) {
        this.getStudyList().then((res) => {
          // 把追加进来的study也加入表格
          this.data = res.concat(this.appendStudyList);
        });
        this.index = this.zindex;
      } else {
        this.data = [];
      }
    },
  },
  methods: {
    back() {
      this.$emit("update:downloadShow", false);
    },
    getDownloadStatus(status) {
      if (status === 0) {
        return this.$t("downloadContent.downloading");
      } else if (status === 1) {
        return this.$t("downloadContent.success");
      } else if (status === 2) {
        return this.$t("downloadContent.fail");
      }
    },
    async getStudyList() {
      // const patientId = this.studyInfos[0].patientId;
      let data;
      if (this.env === "studies") {
        const keys = Object.keys(this.studyInfos);
        data = {
          studyIdList: keys,
        };
      } else {
        let study;
        for (let key in this.studyInfos) {
          if (this.studyInfos[key].isOrigin) {
            study = this.studyInfos[key];
            break;
          }
        }
        console.log(study, "getstudylist");
        if (!study) return [];
        const { id: studyId } = study;
        data = {
          studyIdList: [studyId],
        };
      }
      return api.getStudyList(data).then((res) => {
        let { records } = res.data;
        return records;
      });
    },
    download(item) {
      if (!item) {
        this.downloadDisable = false;
        return;
      }
      const { filename, studyId } = item;
      api
        .downloadStudy(studyId)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
          a.remove();
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          this.downloadTasks.shift();
          this.download(this.downloadTasks[0]);
        });
    },
    startDownload() {
      const tasks = this.data
        .filter((item) => item.checked)
        .map((t) => {
          return {
            filename: `${t.patientName}_${t.patientId}_${new Date().getTime()}.zip`,
            status: 0,
            studyId: t.id,
          };
        });
      this.downloadTasks = tasks;
      console.log(tasks, "tasks");
      this.downloadDisable = true;
      this.download(this.downloadTasks[0]);
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../co-history/index.scss";

.download-list-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.download-task-list {
  .task-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .status {
      margin-left: 30px;
    }
  }
}
</style>
