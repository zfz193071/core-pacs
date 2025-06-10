<template>
  <div class="layer-code-container">
    <div class="content">
      <div class="series">
        <svg-icon name="code-series"></svg-icon>
        <div class="info">
          <span>{{ $t("series.series") }}</span>
          <b>{{ seriesNum }}</b>
        </div>
      </div>
      <div class="image">
        <svg-icon name="code-image"></svg-icon>
        <div class="info">
          <span>{{ $t("image") }}</span>
          <b>{{ imageNum }}</b>
        </div>
      </div>
    </div>
    <div class="code">
      <canvas ref="qrcode"></canvas>
    </div>
  </div>
</template>

<script>
import QRCode from "qrcode";
import { mapState } from "vuex";
import { getDataType } from "../../../assets/js/YMDataHandler";
export default {
  data() {
    return {};
  },
  computed: {
    ...mapState(["studyInfos"]),
    isJH() {
      return getDataType().env === "JH";
    },
    seriesNum() {
      let num = 0;
      Object.values(this.studyInfos).forEach((item) => {
        if (item.isOrigin || !this.isJH) {
          num += item.series.length;
        }
      });
      return num;
    },
    imageNum() {
      let num = 0;
      Object.values(this.studyInfos).forEach((item) => {
        if (item.isOrigin || !this.isJH) {
          item.series.forEach((v) => {
            num += v.instances.length;
          });
        }
      });
      return num;
    },
  },
  mounted() {
    this.generateQRCode();
  },
  methods: {
    async generateQRCode() {
      try {
        await QRCode.toCanvas(this.$refs.qrcode, location.href, {
          width: 220,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
        console.log("QR code generated!");
      } catch (error) {
        console.error("Failed to generate QR code:", error);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
* {
  box-sizing: border-box;
}
.layer-code-container {
  width: 100%;
  height: 350px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  .content {
    height: 40px;
    display: flex;
    justify-content: space-between;
    .series,
    .image {
      display: flex;
      .svg-icon {
        width: 40px;
        height: 40px;
        margin-right: 9px;
      }
      .info {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        span {
          font-size: 12px;
          color: #333333;
        }
        b {
          font-size: 20px;
          color: #333333;
        }
      }
    }
  }
  .code {
    width: 245px;
    height: 245px;
    padding: 12.5px;
    border-radius: 10px;
    background-color: #3b8be480;
  }
}
</style>
