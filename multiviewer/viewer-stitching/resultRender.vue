<template>
  <div class="result-render" ref="canvas-box">
    <canvas ref="canvas" id="stitching-result" style="display: block"></canvas>
    <div class="info">
      <span
        >{{ $t("settings.info.ww") }}:{{ imageData.ww }}
        {{ $t("settings.info.wl") }}:{{ imageData.wl }}</span
      >
    </div>
  </div>
</template>

<script>
import DATA from "../js/data";
import CROSS from "../js/crosshair";
import CIMG from "../js/cimg";
import { mapState } from "vuex";
export default {
  props: {
    resizeFlag: Number,
    handleFlag: Number,
    mergeType: String,
    regPara: Array,
    pickedId: String,
  },
  data() {
    return {
      canvas: null,
      canvasCxt: null,
      seriesInfo: {},
      imageData: {},
    };
  },
  computed: {
    ...mapState(["imageStitchingList"]),
    needRefresh() {
      return this.resizeFlag + this.handleFlag + JSON.stringify(this.regPara);
    },
  },
  watch: {
    needRefresh() {
      this.loadImg();
    },
  },
  mounted() {
    this.canvas = this.$refs.canvas;
    this.canvasCxt = this.canvas.getContext("2d");
    this.loadImg();
  },
  methods: {
    setScale(origBuf) {
      let scale = { x: 1, y: 1, baseSpacing: 1, baseFactor: 1 };
      let {
        pixelSpacingW,
        pixelSpacingH,
        width: imageWidth,
        height: imageHeight,
      } = origBuf;
      let { width: canvasWidth, height: canvasHeight } = this.canvas;

      let x_y = pixelSpacingW / pixelSpacingH;
      let tempX = canvasWidth / (imageWidth * x_y);
      let tempY = canvasHeight / imageHeight;

      if (tempY > tempX) {
        scale.x = tempX * x_y;
        scale.y = tempX;
      } else {
        scale.x = tempY * x_y;
        scale.y = tempY;
      }
      scale.baseSpacing = pixelSpacingH;
      scale.baseFactor = scale.y;
      return scale;
    },
    loadImg() {
      const canvasBox = this.$refs["canvas-box"];
      this.canvas.width = canvasBox.clientWidth;
      this.canvas.height = canvasBox.clientHeight;

      console.log("result imageStitchingList", this.imageStitchingList);

      const newDataWithInfo = this.getFusionResult("simple");

      console.log("result newDataWithInfo", newDataWithInfo);
      this.imageData = { ...DATA.imageData };
      this.imageData.dataWithInfo = newDataWithInfo;
      this.imageData.scale = this.setScale(newDataWithInfo.origBuf);
      const imagePicked = this.imageStitchingList.find(
        (v) => v.stitchingId === this.pickedId,
      );
      this.imageData.ww = imagePicked.imageData.ww;
      this.imageData.wl = imagePicked.imageData.wl;
      this.imageData.colormapIndex = imagePicked.imageData.colormapIndex;
      this.$emit("setNewImageData", this.imageData);
      this.$nextTick(() => {
        this.updateImg();
      });
    },
    formatPara(type) {
      const origBufArr = [],
        paramsArr = [],
        initScaleArr = [1];
      let maxWH = 0;
      for (let i = 0; i < this.imageStitchingList.length; i++) {
        if (
          !this.imageStitchingList[i]?.imageData?.dataWithInfo?.origBuf ||
          !this.imageStitchingList[i]?.params
        ) {
          console.error("没有原始数据");
          return;
        }

        origBufArr.push(
          this.imageStitchingList[i].imageData.dataWithInfo.origBuf,
        );
        if (origBufArr[i].width > maxWH) maxWH = origBufArr[i].width;
        if (origBufArr[i].height > maxWH) maxWH = origBufArr[i].height;
        let paraNow = this.$clone(this.imageStitchingList[i].params);
        if (i > 0) {
          initScaleArr[i] =
            origBufArr[i].pixelSpacingW / origBufArr[0].pixelSpacingW;
        }

        //第0张图的中心点始终是(0,0)
        paraNow.translate.y =
          paraNow.translate.y +
          (this.regPara[i] || 0) -
          this.imageStitchingList[0].params.translate.y;
        paraNow.translate.x =
          paraNow.translate.x - this.imageStitchingList[0].params.translate.x;
        paraNow.scale = paraNow.scale * initScaleArr[i];
        paramsArr.push(paraNow);
      }

      if (type === "simple") {
        if (maxWH > 600) {
          let simpleScale = 2;
          if (maxWH > 1200) {
            simpleScale = 4;
          }
          //降采样
          for (let i = 0; i < origBufArr.length; i++) {
            let origBuf = origBufArr[i];
            let newWidth = Math.floor(origBuf.width / simpleScale);
            let newHeight = Math.floor(origBuf.height / simpleScale);
            const DataType = origBuf.data.constructor;
            const isColor = origBuf.isColor;
            const outputData = new DataType(
              newWidth * newHeight * (isColor ? 4 : 1),
            );
            let newOrigBuf = {
              ...origBuf,
              width: newWidth,
              height: newHeight,
              pixelSpacingW: origBuf.pixelSpacingW * simpleScale,
              pixelSpacingH: origBuf.pixelSpacingH * simpleScale,
              data: outputData,
            };
            let cLen = isColor ? 4 : 1;
            for (let a = 0; a < newHeight; a++) {
              for (let b = 0; b < newWidth; b++) {
                for (let c = 0; c < cLen; c++) {
                  newOrigBuf.data[(a * newWidth + b) * cLen + c] =
                    origBufArr[i].data[
                      (a * simpleScale * origBuf.width + b * simpleScale) *
                        cLen +
                        c
                    ];
                }
              }
            }

            origBufArr[i] = newOrigBuf;
            paramsArr[i].translate.x = Math.round(
              paramsArr[i].translate.x / simpleScale,
            );
            paramsArr[i].translate.y = Math.round(
              paramsArr[i].translate.y / simpleScale,
            );
          }
        }
      }
      return { origBufArr, paramsArr };
    },
    // type: "simple" 用于渲染,"original"，用于保存
    getFusionResult(type) {
      const { origBufArr, paramsArr } = this.formatPara(type);
      console.log("result", origBufArr, paramsArr);
      const newOrigBuf = CROSS.verticalConcatenate(
        origBufArr,
        paramsArr,
        this.mergeType,
      );
      const newDataWithInfo = {
        ...this.imageStitchingList[0].imageData.dataWithInfo,
        origBuf: newOrigBuf,
        width: newOrigBuf.width,
        height: newOrigBuf.height,
        pixelSpacingH: newOrigBuf.pixelSpacingH,
        pixelSpacingW: newOrigBuf.pixelSpacingW,
      };
      return newDataWithInfo;
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
.result-render {
  width: 100%;
  height: 100%;
  border: 1px solid transparent;
  position: relative;
  .info {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    display: flex;
    flex-direction: column-reverse;
    box-sizing: border-box;
    padding: 0 0 8px 8px;
    span {
      font-size: 12px;
      color: var(--navHoverColor);
    }
  }
}
</style>
