import Notification from "./notification.vue";

export default {
  extends: Notification,
  computed: {
    style() {
      return {
        position: "fixed",
        left: "50%",
        margin: "0 0 0 -200px",
        bottom: `50%`,
        background: `${this.color.bg}`,
        color: `${this.color.text}`,
      };
    },
  },
  mounted() {
    this.createTimer();
  },
  methods: {
    createTimer() {
      if (this.autoClose) {
        this.timer = setTimeout(() => {
          this.visible = false;
        }, this.autoClose);
      }
    },
    clearTimer() {
      if (this.timer) {
        clearTimeout(this.timer);
      }
    },
    afterEnter() {
      this.height = this.$el.offsetHeight;
    },
  },
  beforeDestory() {
    this.clearTimer();
  },
  data() {
    return {
      verticalOffset: 0,
      autoClose: 3000,
      timer: null,
      height: 0,
      visible: false,
    };
  },
};
