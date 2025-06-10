<template>
  <transition name="fade" @after-leave="afterLeave" @after-enter="afterEnter">
    <div
      class="notification"
      :style="style"
      v-show="visible"
      @mouseenter="clearTimer"
      @mouseleave="createTimer"
    >
      <img :src="src" alt="" />
      <p class="content">{{ content }}</p>
      <!-- <a class="btn" @click="handleClose">{{ btn }}</a> -->
    </div>
  </transition>
</template>

<script>
export default {
  name: "notification",
  props: {
    content: {
      type: String,
      required: true,
    },
    btn: {
      type: String,
      default: "关闭",
    },
  },
  data() {
    return {
      visible: true,
      src: require("./icon/success.png"),
      color: {
        bg: null,
        text: null,
      },
    };
  },
  computed: {
    style() {
      return {};
    },
  },
  methods: {
    handleClose(e) {
      e.preventDefault();
      this.$emit("close");
    },
    afterLeave() {
      this.$emit("closed");
    },
    afterEnter() {},
    clearTimer() {},
    createTimer() {},
  },
};
</script>
<style lang="scss" scoped>
.notification {
  display: flex;
  background-color: #eafeea;
  color: #67c23a;
  align-items: center;
  padding: 25px 20px;
  position: fixed;
  width: 400px;
  border-radius: 6px;
  z-index: 999999;
  // box-shadow: 0px 3px 6px -1px rgba(0, 0, 0, 0.2),
  //   0px 6px 10px 0px rgba(0, 0, 0, 0.2);
  // flex-wrap: wrap;
  transition: all 0.3s;
  img {
    width: 24px;
    height: 24px;
    margin-right: 10px;
    padding-top: 5px;
  }
  .content {
    width: 100%;
    padding: 0;
    font-size: 24px;
  }
  .btn {
    color: #ff4081;
    padding-left: 24px;
    margin-left: auto;
    cursor: pointer;
  }
}
</style>
