<template>
  <div class="reg_render" ref="canvas_box" :class="{ isOn }">
    <canvas ref="hideCanvas" class="hideCanvas"></canvas>
    <canvas ref="hideCanvas2" class="hideCanvas"></canvas>
    <canvas ref="resultCanvas" class="resultCanvas"></canvas>
    <div>
      <p>{{ num_ct }}</p>
    </div>
  </div>
</template>

<script>
import LOAD from "../js/loadImg";
import WHEEL from "../../../assets/js/wheel.js"; //鼠标滚轮事件
import CIMG from "../js/cimg";
import CROSS from "../js/crosshair";

export default {
  data: function () {
    return {
      resultCanvas: null,
      point: { x: null, y: null },
      center: { x: 0, y: 0 },
      isOn: false,
      scaleInit: { x: 1, y: 1 },
      optMouseDownFlag: undefined, //记录鼠标按下的是左键还是右键,左键为0右键为2
      justReflash: -1,
    };
  },
  props: {
    imageData: {},
    ct_poor: {},
    pt_poor: {},
    series_pt: {},
    series_ct: {},
    size: {},
    canvasNow: {},
    index: {},
    optTrans: {},
    clearFlag: {},
    resizeFlag: {},
    RESULT: {},
    petOpacity: {},
    AcrossPoint: {},
  },
  mounted() {
    this.resultCanvas = this.$refs.resultCanvas;
    this.hideCanvas = this.$refs.hideCanvas;
    this.hideCanvas2 = this.$refs.hideCanvas2;
    //初次进来的时候保存一次缩放

    this.setCanvasSize();
    this.setListener();
    this.setWHEEL();
  },
  beforeDestroy() {
    let dom = this.$refs.canvas_box;
    if ($IsPC) {
      dom.removeEventListener("mousedown", this.optHandleDown);
      dom.removeEventListener("mousemove", this.optHandleMove);
      dom.removeEventListener("mouseup", this.optHandleUp);
      dom.removeEventListener("mouseleave", this.optHandleUp);
    } else {
      dom.removeEventListener("touchstart", this.optHandleDown);
      dom.removeEventListener("touchmove", this.optHandleMove);
      dom.removeEventListener("touchend", this.optHandleUp);
    }
  },
  computed: {
    //显示ct,pt的张数
    num_ct() {
      let { curImageNum, imageNum } = this.imageData;
      let page = Math.round(curImageNum) + 1;
      page < 1 ? (page = 1) : page;
      page > imageNum ? (page = imageNum) : page;
      return `${page}/${imageNum}`;
    },
    needLoad() {
      let seried_id = JSON.stringify(this.series_pt.currentSID);
      let infoPos = JSON.stringify(
        this.series_pt?.ImagePositionPatient || null,
      );
      let infoRote = JSON.stringify(this.series_pt?.regRotePara || null);
      let curImage = JSON.stringify(this.imageData.curImageNum);
      let clear = JSON.stringify(this.clearFlag);
      let canvasNow = JSON.stringify(this.canvasNow);
      let canvasSize = `${this.resultCanvas?.width} ${this.resultCanvas?.height}`;
      let resp =
        seried_id +
        infoPos +
        infoRote +
        curImage +
        clear +
        canvasNow +
        canvasSize;
      return resp;
    },
  },
  methods: {
    getCurPTCenter() {
      let center = null;
      if (this.imageData.dataWithInfo2 && this.imageData.dataWithInfo) {
        let {
          pixelSpacingH: pt_PH,
          pixelSpacingW: pt_PW,
          imgorient: pt_orien,
          leftTopPos: pt_ltp,
          origBuf: pt_orgBuf,
        } = this.imageData.dataWithInfo2;
        let {
          pixelSpacingH: ct_PH,
          pixelSpacingW: ct_PW,
          imgorient: ct_orien,
          leftTopPos: ct_ltp,
          origBuf: ct_orgBuf,
        } = this.imageData.dataWithInfo;
        if (ct_orgBuf && pt_orgBuf) {
          let { width: pt_w, height: pt_h } = pt_orgBuf;
          let { width: ct_w, height: ct_h } = ct_orgBuf;
          if (pt_w != undefined && pt_h != undefined) {
            let centerOnWorldPT = {},
              centerOnWorldCT = {},
              dis = [];
            let dic = ["x", "y", "z"];
            for (let i = 0; i < 3; i++) {
              let key = dic[i];
              centerOnWorldPT[key] =
                pt_ltp[key] +
                (pt_orien[0][i] * pt_PW * pt_w) / 2 +
                (pt_orien[1][i] * pt_PH * pt_h) / 2;
              centerOnWorldCT[key] =
                ct_ltp[key] +
                (ct_orien[0][i] * ct_PW * ct_w) / 2 +
                (ct_orien[1][i] * ct_PH * ct_h) / 2;
              dis[i] = centerOnWorldPT[key] - centerOnWorldCT[key];
            }
            //求投影
            let disX = CROSS.dotProduct(dis, ct_orien[0]);
            let disY = CROSS.dotProduct(dis, ct_orien[1]);
            center = {
              x: ct_w / 2 + disX / ct_PW,
              y: ct_h / 2 + disY / ct_PH,
            };
          }
        }
      }
      return center;
    },
    updateCenter() {
      //获取PT图像中心在canvas上的位置,默认在canvas的中心
      let { translate, rotate } = this.imageData;
      let scale = { ...this.imageData.scale };
      let { width: imageWidth, height: imageHeight } =
        this.imageData.dataWithInfo.origBuf;
      let { width: canvasWidth, height: canvasHeight } = this.resultCanvas;
      this.center = { x: canvasWidth / 2, y: canvasHeight / 2 };
      let centerOfPTOnCTImage = this.getCurPTCenter();
      if (centerOfPTOnCTImage) {
        let ptImgCenterOnCanvas = this.$coordinateImageToCanvas(
          translate,
          rotate,
          scale,
          imageWidth,
          imageHeight,
          canvasWidth,
          canvasHeight,
          centerOfPTOnCTImage,
        );

        //首先使用初始的scale尝试，看是否在范围内
        let rate = this.getCenterInRange(
          ptImgCenterOnCanvas,
          canvasWidth,
          canvasHeight,
          scale,
        );

        if (rate !== 1) {
          //已经超出了边界，需要缩小
          scale.x = scale.x * rate;
          scale.y = scale.y * rate;
          scale.baseFactor = scale.baseFactor * rate;
          this.imageData.scale = { ...scale };
          //在这里更新了scale和initscale
          ptImgCenterOnCanvas = this.$coordinateImageToCanvas(
            translate,
            rotate,
            scale,
            imageWidth,
            imageHeight,
            canvasWidth,
            canvasHeight,
            centerOfPTOnCTImage,
          );
        }

        this.center = { ...ptImgCenterOnCanvas };
      }
    },
    setCanvasSize() {
      let { height, width } = this.size;
      this.resultCanvas.width = width;
      this.resultCanvas.height = height;
      this.scaleInit = { ...this.imageData.scale };
    },
    setListener() {
      let dom = this.$refs.canvas_box;
      if ($IsPC) {
        dom.addEventListener("mousedown", this.optHandleDown);
        dom.addEventListener("mousemove", this.optHandleMove);
        dom.addEventListener("mouseup", this.optHandleUp);
        dom.addEventListener("mouseleave", this.optHandleUp);
      } else {
        dom.addEventListener("touchstart", this.optHandleDown);
        dom.addEventListener("touchmove", this.optHandleMove);
        dom.addEventListener("touchend", this.optHandleUp);
      }
    },
    getCenterInRange(centerNow, canvasWidth, canvasHeight) {
      let margin = 10;
      let halfW = canvasWidth / 2 - margin;
      let halfH = canvasHeight / 2 - margin;
      let rate = 1,
        ratex = 1,
        ratey = 1;
      if (centerNow.x > canvasWidth || centerNow.x < 0) {
        ratex = halfW / Math.abs(centerNow.x - halfW);
      }
      if (centerNow.y > canvasHeight || centerNow.y < 0) {
        ratey = halfH / Math.abs(centerNow.y - halfH);
      }
      rate = Math.min(ratex, ratey);
      return rate;
    },
    //算buf
    renderhandle() {
      let { series_pt, series_ct, ct_poor, pt_poor } = this;
      let { curImageNum, curViewMod } = this.imageData;
      let DWIUID = undefined;
      let loadSource = "reconSlicer";
      this.imageData.dataWithInfo = LOAD.getDataWithInfo(
        ct_poor,
        series_ct,
        curViewMod,
        curImageNum,
        DWIUID,
        this.AcrossPoint,
        loadSource,
      );
      //因为平移信息直接更新到了seriesInfo上，这里只传递旋转参数
      let regPara = undefined,
        regRotePara = series_pt.regRotePara;
      if (regRotePara && (regRotePara.rx || regRotePara.ry || regRotePara.rz)) {
        regPara = { dRote: regRotePara };
      }
      this.imageData.dataWithInfo2 = LOAD.getDataWithInfo(
        pt_poor,
        series_pt,
        curViewMod,
        curImageNum,
        DWIUID,
        this.AcrossPoint,
        loadSource,
      );
      let { scalePTtoCT, transPTtoCT } = LOAD.getFusionPara(
        this.imageData.dataWithInfo,
        this.imageData.dataWithInfo2,
        curViewMod,
        this.AcrossPoint,
      );
      this.imageData.scalePTtoCT = scalePTtoCT;
      this.imageData.transPTtoCT = transPTtoCT;

      //需要同时更新缩放的比例
      this.justReflash++;
    },
    asyncScale(dataWithInfo) {
      let { pixelSpacingW, pixelSpacingH } = dataWithInfo;
      let { baseSpacing, baseFactor, x, y } = this.imageData.scale;
      if (!pixelSpacingH || !pixelSpacingW || !baseSpacing || !baseFactor)
        return false;
      let a = Math.round((10000 * Math.abs(x)) / pixelSpacingW);
      let b = Math.round((10000 * Math.abs(y)) / pixelSpacingH);
      let c = Math.round((10000 * baseFactor) / baseSpacing);
      if (a === c && b === c) return false;

      let signX = Math.sign(x) || 1;
      let signY = Math.sign(y) || 1;

      let scaleNew = { ...this.imageData.scale };
      scaleNew.x = (signX * (baseFactor * pixelSpacingW)) / baseSpacing;
      scaleNew.y = (signY * (baseFactor * pixelSpacingH)) / baseSpacing;
      this.imageData.scale = { ...scaleNew };

      return true;
    },
    //调用ctxDrawImage渲染图像到render上，还需要渲染标注和放大镜
    //在每次刷新之前需要校验一下scale，保证参数中心点在里面
    reflashImg() {
      this.asyncScale(this.imageData.dataWithInfo);
      this.updateCenter();
      let {
        ww,
        wl,
        ww2,
        wl2,
        colormapIndex,
        colormapIndex2,
        scale,
        scalePTtoCT,
      } = this.imageData;

      //获取renderData
      let ct_renderData = null,
        pt_renderData = null;
      if (!ct_renderData) {
        //这里重新计算了用于渲染的CT
        let tarScale = { ...scale };
        ct_renderData = CIMG.getRenderData(
          this.imageData.dataWithInfo.origBuf,
          colormapIndex,
          ww,
          wl,
          tarScale,
        );
      }
      if (!pt_renderData) {
        //这里重新计算了用于渲染的PT
        let tarScale = { ...scale };
        tarScale.x = tarScale.x * scalePTtoCT.x;
        tarScale.y = tarScale.y * scalePTtoCT.y;
        pt_renderData = CIMG.getRenderData(
          this.imageData.dataWithInfo2.origBuf,
          colormapIndex2,
          ww2,
          wl2,
          tarScale,
        );
      }
      //在这里做融合

      //获取画布
      let ctx = this.resultCanvas.getContext("2d");
      // 清空画布，并填充背景颜色
      let color = "#000";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, this.resultCanvas.width, this.resultCanvas.height);

      this.rendNoMix(ct_renderData, pt_renderData, ctx);
      //在这里渲染圈圈
      this.drawCircle(ctx);
    },

    drawPTImage(pt_cimg, dataWithInfo, dataWithInfo2, canvasEle) {
      let { pixelSpacingW: wp_ct, pixelSpacingH: hp_ct } = dataWithInfo;
      let { pixelSpacingW: wp_pt, pixelSpacingH: hp_pt } = dataWithInfo2;

      //允许图像在调窗之后做一个缩放
      let { ifInterPro, interCImg } = pt_cimg;
      if (ifInterPro && interCImg) {
        let scale_self = {
          x: interCImg.width / pt_cimg.width,
          y: interCImg.height / pt_cimg.height,
        };
        wp_pt = wp_pt / scale_self.x;
        hp_pt = hp_pt / scale_self.y;
        pt_cimg = interCImg;
      }

      let scale = { ...this.imageData.scale };
      scale.x = scale.x * (wp_pt / wp_ct);
      scale.y = scale.y * (hp_pt / hp_ct);

      //PT的平移参数和旋转圆形一样
      let translate = {
        x: this.center.x - canvasEle.width / 2,
        y: this.center.y - canvasEle.height / 2,
      };
      //直接画
      let ctxTmp = canvasEle.getContext("2d");

      let rotate = 0;
      this.ctxDrawImage(
        ctxTmp,
        pt_cimg,
        scale,
        rotate,
        translate,
        canvasEle.width,
        canvasEle.height,
        0.5,
      );

      return canvasEle;
    },
    rendNoMix(ct_renderData, pt_renderData, ctx) {
      let { scale, dataWithInfo, dataWithInfo2 } = this.imageData;
      let ct_cimg, pt_cimg;
      pt_cimg = CIMG.getCimgFromRdata(this.hideCanvas2, pt_renderData);
      ct_cimg = CIMG.getCimgFromRdata(this.hideCanvas, ct_renderData);

      //在这里渲染CT图片(注意有可能是插值过的,但是旋转和平移一定为0)
      this.ctxDrawImage(
        ctx,
        ct_cimg,
        scale,
        0,
        { x: 0, y: 0 },
        this.resultCanvas.width,
        this.resultCanvas.height,
        1,
      );

      //在这里渲染PT图片
      this.drawPTImage(pt_cimg, dataWithInfo, dataWithInfo2, this.resultCanvas);
    },
    //在canvas上画图，图片是已经存好的canvas对象，注意有可能是缩放过的
    ctxDrawImage(
      canvasEle_ctx,
      image,
      scale,
      rotate,
      translate,
      canvasWidth,
      canvasHeight,
      opacity,
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
      //设置全局透明度
      canvasEle_ctx.globalAlpha = opacity;
      //首先做缩放。让canvas像素坐标变成图像坐标
      canvasEle_ctx.scale(scaleCur.x, scaleCur.y);
      // 平移到中心点
      let tempX =
        (canvasWidth / 2 + translate.x) / scaleCur.x - imageCur.width / 2;
      let tempY =
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
    //画外圈圆
    drawCircle(ctx) {
      let { x, y } = this.center;
      let opacity = 0.4;

      let baseColor = "#AB2526";
      let highLightColor = "#02eee6";
      ctx.save();
      ctx.translate(x, y);

      //在中间画一个十字
      ctx.globalAlpha = this.index === this.canvasNow ? 1 : opacity;
      ctx.strokeStyle = highLightColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(3, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -3);
      ctx.lineTo(0, 3);
      ctx.closePath();
      ctx.stroke();

      //把pt图像的边界画出来
      ctx.strokeStyle = baseColor;
      ctx.globalAlpha = opacity;
      let { width: ptImageWidth, height: ptImageHeight } =
        this.imageData.dataWithInfo2.origBuf;
      let ptHRWidth =
        (ptImageWidth * this.imageData.scale.x * this.imageData.scalePTtoCT.x) /
        2;
      let ptHRHeight =
        (ptImageHeight *
          this.imageData.scale.y *
          this.imageData.scalePTtoCT.y) /
        2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-ptHRWidth, -ptHRHeight);
      ctx.lineTo(ptHRWidth, -ptHRHeight);
      ctx.lineTo(ptHRWidth, ptHRHeight);
      ctx.lineTo(-ptHRWidth, ptHRHeight);
      ctx.closePath();
      ctx.stroke();

      //画一个圈圈
      ctx.globalAlpha = this.index === this.canvasNow ? 1 : opacity;
      let r = this.size.r;
      let transR; //弧度
      let curR = { rz: 0, ry: 0, rx: 0 };
      if (this.optTrans?.dRote) curR = this.optTrans.dRote;
      switch (this.index) {
        case 0: {
          transR = curR.rz;
          break;
        }
        case 1: {
          transR = curR.ry;
          break;
        }
        case 2: {
          transR = curR.rx;
          break;
        }
      }
      ctx.lineWidth = 1.5;
      ctx.rotate(transR);
      for (let i = 0, length = 120; i < length; i++) {
        let w = i % 5 ? 5 : 10;
        let unit = transR ? -transR / Math.abs(transR) : 1;
        let rotate = i ? (Math.PI / (length / 2)) * unit : 0;
        let curreR = rotate * i * unit;
        let color =
          transR && Math.abs(transR) >= Math.abs(curreR)
            ? highLightColor
            : baseColor;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.rotate(rotate);
        ctx.moveTo(0, -r);
        ctx.lineTo(0, -(r + w));
        if (i === 0) {
          ctx.moveTo(0, -(r + w));
          ctx.lineTo(-3, -(r + w - 3));
          ctx.moveTo(0, -(r + w));
          ctx.lineTo(3, -(r + w - 3));
        }
        ctx.stroke();
      }
      //恢复画布
      ctx.restore();
    },
    //滚轮翻页事件
    setWHEEL() {
      let dom = this.$refs.canvas_box;
      WHEEL(
        () => {
          this.wheelUp();
        },
        () => {
          this.wheelDown();
        },
        dom,
      );
    },
    wheelUp() {
      let { imageNum, curImageNum, curViewMod } = this.imageData;
      let dimStep = 1;
      let currentIndex = curImageNum - dimStep;
      if (currentIndex < 0) {
        currentIndex = Math.floor((imageNum - 1) / dimStep) * dimStep; //翻到最后一张
      }
      currentIndex = Number(currentIndex.toFixed(2));
      this.$emit("syncAP", { index: this.index, curImageNum: currentIndex });
    },
    wheelDown() {
      let { imageNum, curImageNum, curViewMod } = this.imageData;
      let dimStep = 1;
      let currentIndex = curImageNum + dimStep;
      if (currentIndex > imageNum - dimStep) {
        currentIndex = 0;
      }
      currentIndex = Number(currentIndex.toFixed(2));
      this.$emit("syncAP", { index: this.index, curImageNum: currentIndex });
    },
    //鼠标事件
    optHandleDown(e) {
      if (this.index !== this.canvasNow) {
        this.$emit("update:canvasNow", this.index);
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      this.optMouseDownFlag = e.button;
      this.point = { x: e.offsetX, y: e.offsetY };
    },
    optHandleMove(e) {
      let { index: curViewMod, isOn } = this;
      let res = { x: e.offsetX, y: e.offsetY }; //鼠标移动的值
      if (
        this.point.x !== null &&
        this.point.y !== null //判断鼠标是不是按下的状态
      ) {
        if (this.optMouseDownFlag === 0) {
          //左键操作
          //在这里降低帧率
          let optTrans = { ...this.optTrans };
          if (isOn) {
            //这里存下来的是全局角度,单位为弧度
            let angle = this.getAngle(this.center, res, this.point);
            switch (curViewMod) {
              case 0: {
                optTrans.dRote.rz = optTrans.dRote.rz + angle;
                optTrans.dRote.rz = optTrans.dRote.rz % (Math.PI * 2);
                break;
              }
              case 1: {
                optTrans.dRote.ry = optTrans.dRote.ry + angle;
                optTrans.dRote.ry = optTrans.dRote.ry % (Math.PI * 2);
                break;
              }
              case 2: {
                optTrans.dRote.rx = optTrans.dRote.rx + angle;
                optTrans.dRote.rx = optTrans.dRote.rx % (Math.PI * 2);
                break;
              }
            }
          } else {
            let translate = this.getParams(curViewMod);
            //平移
            let dx = res.x - this.point.x;
            let dy = res.y - this.point.y;
            Math.abs(dx) > Math.abs(dy) ? (dy = 0) : (dx = 0);
            //直接从dataWithInfo里面获取分辨率,这里需要用CT的分辨率
            let { pixelSpacingW, pixelSpacingH } = this.imageData.dataWithInfo;
            let scale = this.imageData.scale;
            let { x, y } = translate; //在上一次的基础上平移
            switch (curViewMod) {
              case 0: {
                optTrans.trans.x = (dx / scale.x) * pixelSpacingW + x;
                optTrans.trans.y = (dy / scale.y) * pixelSpacingH + y;
                break;
              }
              case 1: {
                optTrans.trans.x = (dx / scale.x) * pixelSpacingW + x;
                optTrans.trans.z = -(dy / scale.y) * pixelSpacingH + y;
                break;
              }
              case 2: {
                optTrans.trans.y = (dx / scale.x) * pixelSpacingW + x;
                optTrans.trans.z = -(dy / scale.y) * pixelSpacingH + y;
                break;
              }
            }
          }
          //只有在检测过变化再更新point
          this.point.x = res.x;
          this.point.y = res.y;
          //移动记录的是世界坐标系坐标，不需要考虑z方向取反
          this.$emit("update:optTrans", optTrans);
        } else if (this.optMouseDownFlag === 2) {
          let { scale: scaleOrg } = this.imageData;
          let rate = Math.exp((res.y - this.point.y) * 3 * Math.log(1.005));
          let scalePare = {
            x: scaleOrg.x * rate,
            y: scaleOrg.y * rate,
            baseFactor: scaleOrg.baseFactor * rate,
            baseSpacing: scaleOrg.baseSpacing,
          };
          this.imageData.scale = { ...scalePare };
          this.scaleInit = { ...scalePare };
          this.point.x = res.x;
          this.point.y = res.y;
          //刷新
          this.justReflash++;
        }

        //旋转
      } else if (this.index === this.canvasNow) {
        this.isOn = this.isOnCircle(res);
      }
    },
    optHandleUp() {
      this.optMouseDownFlag = undefined;
      this.point = { x: null, y: null };
    },
    //是否在圈上 可旋转
    isOnCircle(res) {
      let { x, y } = this.center;
      let { r } = this.size;
      let dis = Math.sqrt(
        (res.x - x) * (res.x - x) + (res.y - y) * (res.y - y),
      );
      if (dis >= r - 10 && dis <= r + 10) return true;
      else return false;
    },
    //每次旋转固定值，从而减少帧率
    getAngle(A, B, C) {
      let angleA = 0.06;
      let direct = (C.x - A.x) * (B.y - A.y) - (B.x - A.x) * (C.y - A.y);
      if (direct < 0) angleA = -angleA;
      return angleA;
    },
    getParams(curViewMod) {
      //全局参数换算到当前视图下的图像中,这里的单位为世界坐标系上的绝对毫秒
      let {
        trans: { x, y, z },
        dRote: { rx, ry, rz },
      } = this.optTrans;
      let res = {
        x: 0,
        y: 0,
        r: 0,
      };
      switch (curViewMod) {
        case 0: {
          res.x = x;
          res.y = y;
          res.r = rz;
          break;
        }
        case 1: {
          res.x = x;
          res.y = z;
          res.r = ry;
          break;
        }
        case 2: {
          res.x = y;
          res.y = z;
          res.r = rx;
          break;
        }
      }
      return res;
    },
  },
  watch: {
    justReflash() {
      this.reflashImg();
    },
    needLoad() {
      this.renderhandle();
    },
    resizeFlag() {
      this.setCanvasSize();
      this.renderhandle();
    },
    canvasNow() {
      this.isOn = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.reg_render {
  width: 100%;
  height: 100%;

  &.isOn {
    cursor: url(../../../../static/cursor/rotate.png), default;
  }

  canvas {
    position: absolute;
    left: 0;
    top: 0;
    background: transparent;
  }

  .hideCanvas {
    visibility: hidden;
  }

  div {
    position: absolute;
    width: 100%;
    height: 100%;
    padding: 14px;
    box-sizing: border-box;
    left: 0;
    top: 0;
    color: #54c0c7;
    display: flex;
    justify-content: space-between;
    pointer-events: none;
  }
}
</style>
