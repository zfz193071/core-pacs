<template>
  <div class="stitching-render" ref="canvas-box">
    <canvas ref="canvas" style="display: block"></canvas>
    <div class="info">
      <div class="left">
        <span
          >{{ $t("settings.info.ww") }}:{{ imageData.ww }}
          {{ $t("settings.info.wl") }}:{{ imageData.wl }}</span
        >
        <span>{{ $t("stitching.rotate") }}:{{ params.rotate }}°</span>
      </div>
      <div class="right">
        <span
          >{{ $t("stitching.translate") }}: x:{{ params.translate.x }} y:{{
            params.translate.y
          }}</span
        >
        <span
          >{{ $t("stitching.scale") }}:{{
            (params.scale * 100).toFixed(2)
          }}%</span
        >
      </div>
    </div>
  </div>
</template>

<script>
import CLICKOPT from "../js/clickOpt";
import CIMG from "../js/cimg";
import { mapState } from "vuex";
export default {
  props: {
    imageData: Object,
    seriesInfo: Object,
    resizeFlag: Number,
    params: Object,
  },
  data() {
    return {
      canvas: null,
      canvasCxt: null,
    };
  },
  computed: {
    ...mapState(["imgPoor"]),
  },
  watch: {
    resizeFlag() {
      this.loadImg();
    },
  },
  mounted() {
    this.canvas = this.$refs.canvas;
    this.canvasCxt = this.canvas.getContext("2d");
    this.loadImg();
  },
  methods: {
    setScale() {
      let scale = CLICKOPT.getFullScale(
        { width: this.canvas.width, height: this.canvas.height },
        this.imageData.curViewMod,
        this.seriesInfo,
        this.imageData.curImageNum,
      );
      return scale;
    },
    loadImg() {
      const canvasBox = this.$refs["canvas-box"];
      this.canvas.width = canvasBox.clientWidth;
      this.canvas.height = canvasBox.clientHeight;
      let { scale } = this.imageData;
      if (!scale?.modified) {
        scale = this.setScale();
      }
      this.$emit("update:imageData", {
        ...this.imageData,
        scale,
      });
      this.$nextTick(() => {
        this.updateImg();
      });
    },
    updateImg() {
      const { colormapIndex, ww, wl, dataWithInfo, scale, rotate, translate } =
        this.imageData;
      let canvasEle;
      const { origBuf } = dataWithInfo;
      if (origBuf?.isColor) {
        let renderData = origBuf;
        canvasEle = document.createElement("canvas");
        canvasEle.width = renderData.width;
        canvasEle.height = renderData.height;
        let ctx = canvasEle.getContext("2d");
        ctx.putImageData(
          new ImageData(renderData.data, renderData.width, renderData.height),
          0,
          0,
        );
      } else {
        canvasEle = CIMG.getRenderCImg(
          origBuf,
          colormapIndex,
          ww,
          wl,
          scale,
          this.imageData.img,
        );
      }
      this.canvasCxt.fillStyle = "#000000";
      this.canvasCxt.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctxDrawImage(
        this.canvasCxt,
        canvasEle,
        scale,
        rotate,
        translate,
        this.canvas.width,
        this.canvas.height,
      );
    },
    ctxDrawImage(
      canvasEle_ctx,
      image,
      scale,
      rotate,
      translate,
      canvasWidth,
      canvasHeight,
    ) {
      let scaleCur = { ...scale },
        imageCur = image;
      //允许图像在调窗之后做一个缩放
      let { ifInterPro, interCImg } = image;
      //允许图像在调窗之后做一个缩放
      if (ifInterPro && interCImg) {
        let scale_self = {
          x: interCImg.width / image.width,
          y: interCImg.height / image.height,
        };
        scaleCur.x = scale.x / scale_self.x;
        scaleCur.y = scale.y / scale_self.y;
        imageCur = interCImg;
      }
      //旋转平移缩放
      canvasEle_ctx.save();
      canvasEle_ctx.scale(scaleCur.x, scaleCur.y);
      // 平移到中心点
      const tempX =
        (canvasWidth / 2 + translate.x) / scaleCur.x - imageCur.width / 2;
      const tempY =
        (canvasHeight / 2 + translate.y) / scaleCur.y - imageCur.height / 2;
      canvasEle_ctx.translate(tempX, tempY);
      // 最后做旋转
      canvasEle_ctx.translate(imageCur.width / 2, imageCur.height / 2);
      canvasEle_ctx.scale(1 / scaleCur.x, 1 / scaleCur.y);
      canvasEle_ctx.rotate(rotate);
      canvasEle_ctx.scale(scaleCur.x, scaleCur.y);
      canvasEle_ctx.translate(-imageCur.width / 2, -imageCur.height / 2);

      canvasEle_ctx.drawImage(imageCur, 0, 0);
      canvasEle_ctx.restore();
    },
  },
};
</script>

<style lang="scss" scoped>
.stitching-render {
  width: 100%;
  height: 100%;
  position: relative;
  .info {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    display: flex;
    .left,
    .right {
      flex: 1;
      display: flex;
      flex-direction: column-reverse;
    }
    .left {
      padding: 0 0 8px 8px;
    }
    .right {
      text-align: right;
      padding: 0 8px 8px 0;
    }
    span {
      font-size: 12px;
      color: var(--navHoverColor);
    }
  }
}
</style>
