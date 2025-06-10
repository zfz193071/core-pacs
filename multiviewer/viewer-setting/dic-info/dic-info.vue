<template>
  <div class="dic-info">
    <div class="dic-info-title">{{ $t("settings.titles.info") }}</div>
    <!--  dcm信息  -->
    <div class="info scrollbar2">
      <el-checkbox
        :indeterminate="isIndeterminate"
        v-model="checkAll"
        @change="handleCheckAllChange"
        class="checkAll"
        >{{ $t("selectAll") }}</el-checkbox
      >
      <el-checkbox-group v-model="checkedDic" class="checkBox">
        <div class="check" v-for="dic in dicList" :key="dic">
          <el-checkbox :label="dic">{{
            $t(`settings.info.${dic}`)
          }}</el-checkbox>
        </div>
      </el-checkbox-group>
    </div>

    <!--  字体样式  -->
    <div class="font">
      <div class="box-title">{{ $t("settings.titles.fontStyle") }}</div>
      <div class="size">
        <div class="title">{{ $t("fontSize") }}</div>
        <el-select
          v-model="fontSizeCheck"
          size="mini"
          :popper-append-to-body="false"
        >
          <el-option
            v-for="font of fontSizeGroup"
            :key="font.key"
            :label="$t(font.key)"
            :value="font.key"
          ></el-option>
        </el-select>
      </div>
      <div class="color-group">
        <p class="title">{{ $t("color") }}</p>
        <span
          class="color"
          :class="{ checked: colorCheck === item }"
          :style="{ backgroundColor: item }"
          v-for="item in colorGroup"
          :key="item"
          @click.stop="colorCheck = item"
        ></span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "dic-info",
  props: {
    dicomShow: {
      type: Object,
      required: true,
    },
    dicomStyle: {
      type: Object,
      required: true,
    },
    dicomShowAll: {
      type: Object,
      required: true,
    },
    pickedModel: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      isIndeterminate: false,
      checkAll: true,
      checkedDic: [],
      fontSizeGroup: [
        { text: "大", key: "fontL", fontSize: "18px", rule: "3px" },
        { text: "中", key: "fontM", fontSize: "14px", rule: "2px" },
        { text: "小", key: "fontS", fontSize: "10px", rule: "1px" },
      ],
      fontSizeCheck: "fontS",
      colorGroup: [
        "#fff",
        "#cccc32",
        "#ff7e7e",
        "#8ec3ff",
        "#45c5d8",
        "#2fdba0",
        "#576D8A",
        "#B4C2D7",
        "#ffb535",
        "#dd9aff",
        "#0078FF",
        "#6FECFF",
      ],
      colorCheck: "#fff",
    };
  },

  computed: {
    dicList() {
      let arr = [];
      Object.keys(this.dicomShow).forEach((key) => {
        arr.push(key);
      });
      return arr;
    },
  },

  methods: {
    handleCheckAllChange(val) {
      this.checkedDic = val ? this.dicList : [];
      this.isIndeterminate = false;
    },

    handleSyncToPrintChange(val) {
      localStorage.setItem("syncToPrint", val);
    },

    /**
     * 保存操作
     */
    save() {
      let obj = {};
      let dicomShow = { ...this.dicomShow };
      if (this.dicomShowAll[this.pickedModel]) {
        dicomShow = { ...this.dicomShowAll[this.pickedModel] };
      }
      Object.keys(dicomShow).forEach((key) => {
        obj[key] = dicomShow[key];
      });
      this.dicList.forEach((item) => {
        obj[item] = this.checkedDic.includes(item);
      });
      let objAll = this.$clone(this.dicomShowAll);
      objAll[this.pickedModel] = obj;
      localStorage.dicomShowAll = JSON.stringify(objAll);
      let fontSize = {};
      this.fontSizeGroup.some((item) => {
        if (item.key === this.fontSizeCheck) {
          fontSize = item;
        }
        return item.key === this.fontSizeCheck;
      });
      localStorage.dicomStyle = JSON.stringify({
        fontSize,
        color: this.colorCheck,
      });
      this.$emit("setDicomShowAll", objAll);
      console.log(this.dicomShowAll, "dicomShowAll");
      this.$emit("update:dicomStyle", {
        fontSize,
        color: this.colorCheck,
      });
    },

    /**
     * 初始化所有数据
     */
    init() {
      this.isIndeterminate = false;
      this.colorCheck = this.dicomStyle.color;
      this.fontSizeCheck = this.dicomStyle.fontSize.key;
      this.checkedDic = [];
      Object.keys(this.dicomShow).forEach((key) => {
        if (this.dicomShow[key]) {
          this.checkedDic.push(key);
        }
      });
    },
  },

  watch: {
    // 读取对应模态
    pickedModel: {
      handler(val) {
        let dicomShow = { ...this.dicomShow };
        if (this.dicomShowAll[val]) {
          dicomShow = { ...this.dicomShowAll[val] };
        }
        this.checkedDic = [];
        Object.keys(dicomShow).forEach((key) => {
          if (dicomShow[key]) {
            this.checkedDic.push(key);
          }
        });
      },
      deep: true,
      immediate: true,
    },
    dicomStyle: {
      handler() {
        this.fontSizeCheck = this.dicomStyle.fontSize.key;
        this.colorCheck = this.dicomStyle.color;
      },
      deep: true,
      immediate: true,
    },
    checkedDic: {
      handler() {
        this.checkAll = this.checkedDic.length === this.dicList.length;
        this.isIndeterminate =
          this.checkedDic.length > 0 &&
          this.checkedDic.length < this.dicList.length;
      },
      deep: true,
      immediate: true,
    },
  },
};
</script>

<style lang="sass" scoped>
@import "dic-info"
</style>
