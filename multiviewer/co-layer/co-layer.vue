<template>
  <div class="rgba" v-show="layerShow" :class="type">
    <div class="icon-state"></div>
    <div class="layer">
      <div class="ch overflow-1" v-if="lang === 'zh'">{{ layerText }}</div>
      <div class="en overflow-1" v-else>{{ layerTextEn }}</div>
    </div>
  </div>
</template>

<script>
// import Vue from 'vue' //改为cdn引用了
export default {
  name: "layer",
  data() {
    return {
      layerShow: false,
      layerText: "",
      type: "success",
    };
  },

  computed: {
    lang() {
      return this.$i18n.locale;
    },
    /**
     * 中英文对照
     * @return {string}
     */
    layerTextEn() {
      switch (this.layerText) {
        case "保存截图成功":
          return "Save the screenshot successfully";
        case "保存截图失败":
          return "Failed to save the screenshot";
        case "保存截图失败:响应超时":
          return "Failed to save the screenshot:timeout";
        case "无权限，保存失败":
          return "Failed to save the screenshot:no permission";
        case "设置成功":
          return "Successfully set";
        case "设置失败":
          return "Failed to set data";
        case "有未加载完成的数据":
          return "There is unfinished data";
        case "输入框最多输入90个字符":
          return "a maximum of 90 characters";
        case "复制成功":
          return "Successfully copy";
        case "该报告已锁定":
          return "The report is locked";
        case "该数据未上传或已被删除":
          return "The data has not been uploaded or has been deleted";
        case "导入失败":
          return "Import failure";
        case "导入成功":
          return "Successfully imported";
        case "删除截图成功":
          return "Deleted screenshot successfully";
        case "登录已过期":
          return "Login expired";
        case "无权限，操作失败":
          return "No operation permission";
        case "当前检查只有一个SR序列，不支持截图转序列":
          return "Not support screenshot to series";
        case "请选择2至6张图像":
          return "Please select 2 to 6 images";
        case "请选择CR、DR、DX模态的图像":
          return "Please select images in CR, DR, DX modality";
        case "系统异常":
          return "System abnormality";
        default:
          return "Tip message";
      }
    },
  },

  created() {
    /**
     * 自定义弹框
     * @param layerText 描述文字
     * @param time 显示时长ms
     * @param type {"success" | "fail" | "warn" | "info" | "normal"} 显示状态(默认: "success")
     */
    Vue.prototype.$layer = (layerText, time = 3000, type = "success") => {
      if (!layerText) {
        this.layerShow = false;
        return;
      }
      this.layerText = layerText;
      this.layerShow = true;
      this.type = type;
      let times = time ? time : 3000;
      setTimeout(() => {
        this.layerShow = false;
      }, times);
    };
  },
  methods: {},
};
</script>

<style scoped lang="scss">
@import "co-layer";
</style>
