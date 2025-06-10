<template>
  <div class="layer-split">
    <div class="select-all">
      <el-checkbox
        v-model="selectAll"
        :indeterminate="isIndeterminate"
        @change="selectAllFn"
      ></el-checkbox>
      <span>全选</span>
    </div>
    <div class="split-list">
      <div
        class="split-item"
        v-for="(item, index) in splitList"
        :key="item.studyInfo.seriesId"
      >
        <el-checkbox
          :value="item.checked"
          @change="selectItemFn(index)"
        ></el-checkbox>
        <span>{{ getInfo(item) }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import seriesApi from "../../../assets/api/series.js";
export default {
  props: {
    splitList: {
      type: Array,
      default: () => [],
    },
    showWarning: {
      type: Boolean,
      defalut: false,
    },
  },
  data() {
    return {
      selectAll: false,
      isIndeterminate: false,
    };
  },
  watch: {
    showWarning(val) {
      if (val) {
        this.selectAll = false;
        this.isIndeterminate = false;
      }
    },
  },
  methods: {
    getInfo(item) {
      const {
        studyInfo: { modality, id, description, imageNumber },
        imgInfo: {
          info: { PatientName, PatientID },
        },
      } = item;
      return `${PatientName} / ${PatientID} / ${modality} / SID: ${id} / ${description} / ${imageNumber} imgs`;
    },
    selectAllFn() {
      this.splitList.forEach((item) => {
        item.checked = this.selectAll;
      });
      this.$emit("selectSplit", this.splitList);
    },
    selectItemFn(index) {
      const list = this.splitList;
      list[index].checked = !list[index].checked;
      this.$emit("selectSplit", list);
      this.isIndeterminate =
        list.some((item) => !item.checked) &&
        !list.every((item) => !item.checked);
      this.selectAll = list.every((item) => item.checked);
    },
    async handleUpload() {
      if (!this.splitList.find((v) => v.checked)) {
        this.$layer("请选择要上传的序列", undefined, "warn");
        return;
      }
      const pickedData = this.splitList.filter((v) => v.checked);
      let params = [];
      pickedData.forEach((v) => {
        params.push({
          description: v?.studyInfo?.description,
          number: v?.studyInfo?.id,
          timestamp: v?.studyInfo?.seriesId,
          seriesKeyId: v?.studyInfo?.seriesKeyId,
          instancesIdList: v?.imgInfo?.info?.instances.map((item) => item.id),
        });
      });
      const res = await seriesApi.seriesSplit(params);
      if (res.code === 200) {
        this.$layer("上传成功", undefined, "success");
        this.$emit("splitCallback", res.data);
      } else if (res.code === "66666") {
        this.$layer("无权限，上传失败", undefined, "warn");
      } else if (res.code === "55555") {
        this.$layer("登录已过期，请重新登录", undefined, "warn");
      } else {
        this.$layer("上传失败", undefined, "warn");
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.layer-split {
  min-width: 691px;
  font-size: 14px;
  line-height: 20px;
  box-sizing: border-box;
  background: #f4f6f8;
  border-radius: 5px;
  border: 1px solid #d8d8d8;

  .el-checkbox {
    margin-right: 10px;
  }

  .select-all {
    padding: 10px 0 8px 22px;
    border-bottom: 1px solid #d8d8d8;
  }

  .split-list {
    padding: 10px 0 8px 22px;
  }

  .split-item {
    display: flex;
    margin-bottom: 14px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
