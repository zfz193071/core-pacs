import CROSS from "@/components/multiviewer/js/crosshair";

let MINOPT = {
  changeVie(that) {
    const mvp = that.minViewport;
    const { seriesInfos, imageDatas, canvasNow } = mvp;
    let { currentSID, volumeSize, isNotUniformSquence, initViewMod } =
      seriesInfos[canvasNow];
    let { curViewMod } = imageDatas[canvasNow];
    let cur = (curViewMod + 1) % 3;
    let poor = that.imgPoor[currentSID];
    if (currentSID.length === 24 && !poor.imageDone && cur !== initViewMod) {
      that.mprLayerShow2 = true;
      return;
    }
    if (volumeSize[initViewMod].d < 5) {
      //切片数量不足
      that.showWarning = true;
      that.warningType = "msgLess";
    } else if (that.warningTip && isNotUniformSquence) {
      //间隔不均匀
      that.warning.spacing = true;
    } else {
      this.changeViewMod(that, cur);
    }
  },
  //更新面
  changeViewMod(that, curViewMod) {
    const mvp = that.minViewport;
    let { seriesInfos, imageDatas, viewportSize: canvasSize, canvasNow } = mvp;

    const seriesInfo = seriesInfos[canvasNow];
    let imageData = imageDatas[canvasNow];

    imageData.curViewMod = curViewMod;
    imageData.rotate = 0;
    imageData.imageNum = seriesInfo.volumeSize[curViewMod].d;

    //正确计算调节过层厚的图像位置
    let { thickness, d: zPixelSpacing } = seriesInfo.volumeSpacing[curViewMod];
    let pageStep = Number((thickness / zPixelSpacing).toFixed(2));
    let NewTotal = Math.floor((imageData.imageNum * zPixelSpacing) / thickness); //向下取整
    let NewMid = Math.floor(NewTotal / 2);
    imageData.curImageNum = NewMid * pageStep;
    imageData.translate.x = 0;
    imageData.translate.y = 0;
    imageData = CROSS.asyncImageData(imageData, mvp.AcrossPoint, seriesInfo);
    that.$set(imageDatas, canvasNow, { ...imageData });
  },
  //拖动
  moveFn(that, e) {
    e = e || window.event;
    let { offsetLeft, offsetTop, clientWidth, clientHeight } = minBox;
    let maxW = document.body.offsetWidth;
    let maxH = document.body.offsetHeight;
    let disX = e.clientX - offsetLeft;
    let disY = e.clientY - offsetTop;
    document.onmousemove = (e) => {
      e = e || window.event;
      let x = e.clientX - disX;
      let y = e.clientY - disY;
      if (x < 0) x = 0;
      if (y < 0) y = 0;
      if (x > maxW - clientWidth) x = maxW - clientWidth;
      if (y > maxH - clientHeight) y = maxH - clientHeight;
      const mvp = that.minViewport;
      mvp.viewportSize.left = x;
      mvp.viewportSize.top = y;
    };
    document.onmouseup = () => {
      document.onmousemove = null;
      document.onmouseup = null;
    };
  },
  scaleFn(that, index, e) {
    e = e || window.event;
    let disX = e.clientX;
    let disY = e.clientY;
    let maxW = document.body.offsetWidth;
    let maxH = document.body.offsetHeight;

    let minW = 300;
    let minH = 300;
    document.onmousemove = (e) => {
      e = e || window.event;
      let {
        offsetLeft: left,
        offsetTop: top,
        clientWidth: width,
        clientHeight: height,
      } = minBox;
      let dx = e.clientX - disX;
      let dy = e.clientY - disY;
      const mvp = that.minViewport;
      switch (index) {
        case 1: {
          if (left + dx < 0) dx = -left;
          if (top + dy < 0) dy = -top;
          if (width - dx < minW) dx = width - minW;
          if (height - dy < minH) dy = height - minH;
          mvp.viewportSize = {
            left: left + dx,
            top: top + dy,
            width: width - dx,
            height: height - dy,
          };
          break;
        }
        case 2: {
          if (top + dy < 0) dy = -top;
          if (left + width + dx > maxW) dx = maxW - left - width;
          if (width + dx < minW) dx = minW - width;
          if (height - dy < minW) dy = minW - width;
          mvp.viewportSize = {
            left: left,
            top: top + dy,
            width: width + dx,
            height: height - dy,
          };
          break;
        }
        case 3: {
          if (left + width + dx > maxW) dx = maxW - left - width;
          if (width + dx < minW) dx = minW - width;
          if (top + height + dy > maxH) dy = maxH - top - height;
          if (height + dy < minH) dy = minH - height;
          mvp.viewportSize = {
            left: left,
            top: top,
            width: width + dx,
            height: height + dy,
          };
          break;
        }
        case 4: {
          if (left + dx < 0) dx = -left;
          if (width - dx < minW) dx = width - minW;
          if (top + height + dy > maxH) dy = maxH - top - height;
          if (height + dy < minH) dy = minH - height;
          mvp.viewportSize = {
            left: left + dx,
            width: width - dx,
            top: top,
            height: height + dy,
          };
          break;
        }
      }

      disX = e.clientX;
      disY = e.clientY;
    };
    document.onmouseup = () => {
      document.onmousemove = null;
      document.onmouseup = null;
    };
  },
};

export default MINOPT;
