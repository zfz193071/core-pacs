<template>
  <div class="dicList">
    <div id="dicList">
      <div class="roiHead">
        <p>{{ LANG.showDicList[LANG.index] }}</p>
        <span @click.stop="close"></span>
      </div>
      <div class="section">
        <div class="main">
          <p class="title">信息</p>
          <el-checkbox
            :indeterminate="isIndeterminate"
            v-model="checkAll"
            @change="handleCheckAllChange"
            class="checkAll"
            >全选</el-checkbox
          >
          <el-checkbox-group v-model="checkedDic" class="checkBox">
            <div class="check" v-for="dic in dicList" :key="dic">
              <el-checkbox :label="dic">{{
                LANG[dic][LANG.index]
              }}</el-checkbox>
            </div>
          </el-checkbox-group>
          <p class="title">样式</p>
          <div class="styleGroup">
            <p class="title">字号</p>
            <span
              :class="
                fontSizeCheck === item.key
                  ? 'fontSize fontSize_check'
                  : 'fontSize'
              "
              v-for="item in fontSizeGroup"
              :key="item.key"
              @click.stop="fontSizeCheck = item.key"
              >{{ item.text }}</span
            >
          </div>
          <div class="styleGroup">
            <p class="title">颜色</p>
            <span
              :class="colorCheck === item ? 'color color_check' : 'color'"
              :style="{ background: item }"
              v-for="item in colorGroup"
              :key="item"
              @click.stop="colorCheck = item"
            ></span>
          </div>
        </div>
        <div class="btnBox">
          <div class="btn" @click.stop="save">{{ LANG.save[LANG.index] }}</div>
          <div class="btn" @click.stop="close">
            {{ LANG.cancel[LANG.index] }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import LANG from "../../../assets/js/lang.js";
export default {
  name: "dicList",
  props: {
    dicomShow: { type: Object, required: true },
    dicomStyle: { type: Object, required: true },
  },
  data() {
    return {
      LANG,
      isIndeterminate: false,
      checkedDic: [],
      checkAll: true,
      fontSizeGroup: [
        { text: "大", key: "b", fontSize: "18px", rule: "3px" },
        { text: "中", key: "m", fontSize: "14px", rule: "2px" },
        { text: "小", key: "s", fontSize: "10px", rule: "1px" },
      ],
      fontSizeCheck: "s",
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
    close() {
      this.$emit("update:ifShowInfo", false);
    },
    save() {
      let obj = {};
      Object.keys(this.dicomShow).forEach((key) => {
        obj[key] = this.dicomShow[key];
      });
      this.dicList.forEach((item) => {
        if (this.checkedDic.includes(item)) {
          obj[item] = true;
        } else {
          obj[item] = false;
        }
      });
      localStorage.dicomShow = JSON.stringify(obj);
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
      this.$emit("update:dicomShow", obj);
      this.$emit("update:dicomStyle", {
        fontSize,
        color: this.colorCheck,
      });
      this.$emit("update:ifShowInfo", false);
    },
  },
  watch: {
    dicomShow: {
      handler() {
        this.checkedDic = [];
        Object.keys(this.dicomShow).forEach((key) => {
          if (this.dicomShow[key]) {
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
<style lang="scss" scoped>
@import "./viewer-dic-list.scss";
</style>
