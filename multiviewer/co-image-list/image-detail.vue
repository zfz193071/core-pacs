<template>
  <div class="image-detail-wrapper">
    <div class="left-arrow" @click="preview">
      <i class="el-icon-arrow-left"></i>
    </div>
    <div class="image-content">
      <div class="header">
        <span>{{ currNum }} / {{ totalNum }}</span>
        <div @click="$emit('close')">
          <svg-icon name="image-close" />
        </div>
      </div>

      <img :src="image.filePath" alt="image" />

      <div class="footer">
        <input type="text" v-model="desc" @change="changeNotes" />
        <div class="btn-paste" @click="handleCopy">
          <svg-icon name="paste" />
        </div>
      </div>
    </div>
    <div class="right-arrow" @click="next">
      <i class="el-icon-arrow-right"></i>
    </div>
  </div>
</template>

<script>
import seriesApi from "../../../assets/api/series";
export default {
  name: "ImageDetail",
  props: {
    canvasRange: Object,
    image: {
      type: Object,
      default: () => ({}),
    },
    currNum: {
      type: Number,
      default: 0,
    },
    totalNum: {
      type: Number,
      default: 0,
    },
  },
  computed: {
    desc: {
      get() {
        return this.image.notes;
      },
      set(value) {
        this.$emit("update:image", {
          ...this.image,
          notes: value,
        });
      },
    },
  },
  methods: {
    preview() {
      this.$emit("changeIndex", -1);
    },
    next() {
      this.$emit("changeIndex", 1);
    },
    async changeNotes() {
      await seriesApi.updateScreenshotNotes({
        id: this.image.id,
        notes: this.desc,
      });
    },
    async handleCopy() {
      this.$layer("复制成功");
      const res = await navigator.permissions.query({
        name: "clipboard-write",
      });
      if (res.state === "granted") {
        return await navigator.clipboard.writeText(this.desc);
      } else {
        const el = document.createElement("textarea");
        el.value = this.desc;
        el.setAttribute("readonly", "");
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        return Promise.resolve(true);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.image-detail-wrapper {
  position: fixed;
  background: var(--themGary);
  right: 405px;
  top: 0;
  width: calc(100vw - 406px);
  height: 100%;
  display: flex;

  .left-arrow,
  .right-arrow {
    width: 81px;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    i {
      font-size: 50px;
      cursor: pointer;
      color: var(--defaultfontColor2);
    }
  }

  .image-content {
    flex: 1;

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 102px;

      .svg-icon {
        color: var(--defaultfontColor2);
        cursor: pointer;
      }
    }

    img {
      width: 100%;
      height: calc(100% - 252px);
      object-fit: contain;
    }

    .footer {
      height: 70px;
      margin: 40px 0;
      position: relative;

      .btn-paste {
        position: absolute;
        right: 37px;
        top: 21px;
        color: var(--defaultfontColor2);
        cursor: pointer;
      }

      input {
        width: 100%;
        height: 70px;
        border-radius: 3px;
        border: 1px solid var(--vrBlockBorderColor);
        padding: 0 80px 0 23px;
        box-sizing: border-box;
        background: var(--themGary);
        color: var(--defaultFontColor);
      }
    }
  }
}
</style>
