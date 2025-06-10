<!--
 * @Author: 
 * @Date: 2023-12-21 15:02:26
 * @LastEditTime: 2023-12-28 14:08:05
 * @LastEditors: ssy
 * @Description: 
-->
<template>
  <div class="confirmBox" v-show="text">
    <div class="confirm">
      <div class="title">
        提示
        <div class="close" @click.stop="back"></div>
      </div>
      <div class="content">
        <p>{{ text }}</p>
      </div>
      <div class="btns">
        <p @click.stop="contin" v-if="isHasFn">继续</p>
        <p class="cancel" @click.stop="back">{{ isHasFn ? "返回" : "确定" }}</p>
      </div>
    </div>
  </div>
</template>

<script>
// import Vue from 'vue' //改为cdn引用了
export default {
  name: "co-confirm",
  data: function () {
    return {
      text: "",
      isHasFn: false,
    };
  },
  created() {
    Vue.prototype.$confirm = (text, fn) => {
      this.text = text;
      if (fn) {
        this.isHasFn = true;
        this.contin = () => {
          this.back();
          setTimeout(() => {
            fn();
          }, 0);
        };
      } else {
        this.isHasFn = false;
      }
    };
  },
  methods: {
    contin() {},
    back() {
      this.text = "";
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./co-confirm.scss";
</style>
