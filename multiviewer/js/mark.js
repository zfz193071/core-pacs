// type:
// ROI 矩形
// 曲线 9
// 箭头 10
// 角度 11
// 尺子 12
// 文本 13
// 结节 14
import REMARK from "./remark";
import FIND from "./find";
const MARK = {
  lineWidth: 2,
  color: "#08f5b1",
  // color: 'rgba(247,120,50,0.8)',
  // color_active: 'rgba(255,0,0,1)',
  color_active: "rgba(247,120,50,0.8)",
  fontSizeGroup: [
    { text: "大", key: "large", fontSize: "18px", scale: 1.4, top: 6.5 },
    { text: "中", key: "middle", fontSize: "14px", scale: 1.2, top: 3.5 },
    { text: "小", key: "small", fontSize: "12px", scale: 1, top: 0 },
  ],
  markObjReflash(
    markObj,
    bgCanvas,
    trans,
    rota,
    scale,
    canvasWidth,
    canvasHeight,
    imageWidth,
    imageHeight,
    currentSID,
    active,
    ieditIndex,
  ) {
    let {
      infoPosition,
      linePoint,
      editPointList,
      curveLinePointList,
      type,
      polyPointList,
    } = markObj;
    let editPointListCanvas = [],
      infoPositionCanvas = null,
      linePointCanvas = null,
      curveLinePointListCanvas = [],
      polyPointListCanvas = [];
    //所有的控制点相关的都是图像坐标
    for (let i = 0; i < editPointList.length; i++) {
      let editPoint = this.coordinateImageToCanvas(
        trans,
        rota,
        scale,
        imageWidth,
        imageHeight,
        canvasWidth,
        canvasHeight,
        editPointList[i],
      );
      editPointListCanvas.push(editPoint);
    }
    for (let i = 0; i < curveLinePointList.length; i++) {
      let editPoint = this.coordinateImageToCanvas(
        trans,
        rota,
        scale,
        imageWidth,
        imageHeight,
        canvasWidth,
        canvasHeight,
        curveLinePointList[i],
      );
      curveLinePointListCanvas.push(editPoint);
    }
    if (infoPosition) {
      infoPositionCanvas = this.coordinateImageToCanvas(
        trans,
        rota,
        scale,
        imageWidth,
        imageHeight,
        canvasWidth,
        canvasHeight,
        infoPosition,
      );
    }
    if (linePoint) {
      linePointCanvas = this.coordinateImageToCanvas(
        trans,
        rota,
        scale,
        imageWidth,
        imageHeight,
        canvasWidth,
        canvasHeight,
        linePoint,
      );
    }
    if (polyPointList) {
      for (let i = 0; i < polyPointList.length; i++) {
        let editPoint = this.coordinateImageToCanvas(
          trans,
          rota,
          scale,
          imageWidth,
          imageHeight,
          canvasWidth,
          canvasHeight,
          polyPointList[i],
        );
        polyPointListCanvas.push(editPoint);
      }
    }

    switch (type) {
      case "VOI_2Dslice":
        this.drawSliceOfVOI(
          markObj,
          bgCanvas,
          canvasWidth,
          canvasHeight,
          trans,
          rota,
          scale,
          infoPositionCanvas,
          linePointCanvas,
          currentSID,
          active,
          ieditIndex,
        );
        break;
      case "Pen":
        this.drawRoi(
          markObj,
          bgCanvas,
          canvasWidth,
          canvasHeight,
          polyPointListCanvas,
          infoPositionCanvas,
          linePointCanvas,
          currentSID,
          active,
          ieditIndex,
        );
        break;
      case "Circle":
        this.drawCircle(
          markObj,
          bgCanvas,
          canvasWidth,
          canvasHeight,
          rota,
          editPointListCanvas,
          infoPositionCanvas,
          linePointCanvas,
          currentSID,
          active,
          ieditIndex,
        );
        break;
      case "VOI_Rect":
        this.drawRect(
          markObj,
          bgCanvas,
          canvasWidth,
          canvasHeight,
          editPointListCanvas,
          infoPositionCanvas,
          linePointCanvas,
          currentSID,
          active,
          ieditIndex,
        );
        break;
      case "VOI_Circle":
        this.drawCircle(
          markObj,
          bgCanvas,
          canvasWidth,
          canvasHeight,
          rota,
          editPointListCanvas,
          infoPositionCanvas,
          linePointCanvas,
          currentSID,
          active,
          ieditIndex,
        );
        break;
      case "Rect":
        this.drawRect(
          markObj,
          bgCanvas,
          canvasWidth,
          canvasHeight,
          editPointListCanvas,
          infoPositionCanvas,
          linePointCanvas,
          currentSID,
          active,
          ieditIndex,
        );
        break;
      case "CurveLine":
        this.drawCurveLine(
          bgCanvas,
          curveLinePointListCanvas,
          active,
          ieditIndex,
        );
        break;
      case "Arrow":
        this.drawArrow(bgCanvas, editPointListCanvas, active);
        break;
      case "Angle":
        this.drawAngle(
          markObj,
          bgCanvas,
          canvasWidth,
          canvasHeight,
          editPointListCanvas,
          infoPositionCanvas,
          linePointCanvas,
          active,
          ieditIndex,
        );
        break;
      case "Ruler":
        this.drawRuler(
          markObj,
          bgCanvas,
          canvasWidth,
          canvasHeight,
          editPointListCanvas,
          infoPositionCanvas,
          linePointCanvas,
          active,
          ieditIndex,
        );
        break;
      case "CurveRuler":
        this.drawCurveRuler(
          markObj,
          bgCanvas,
          canvasWidth,
          canvasHeight,
          editPointListCanvas,
          infoPositionCanvas,
          linePointCanvas,
          active,
          ieditIndex,
        );
        break;
      case "Text":
        this.drawText(
          markObj,
          bgCanvas,
          canvasWidth,
          canvasHeight,
          infoPositionCanvas,
          ieditIndex,
        );
        break;
      case "Point":
        this.drawPoint(
          markObj,
          bgCanvas,
          linePointCanvas,
          infoPositionCanvas,
          editPointListCanvas,
          active,
          ieditIndex,
        );
        break;
      case "CPRPoint":
        this.drawCPRPoint(
          markObj,
          bgCanvas,
          linePointCanvas,
          infoPositionCanvas,
          editPointListCanvas,
          active,
          ieditIndex,
        );
        break;
      case "HeartChest":
        this.drawHeartChest(
          markObj,
          bgCanvas,
          linePointCanvas,
          infoPositionCanvas,
          editPointListCanvas,
          active,
          ieditIndex,
        );
        break;
      case "COBAngle":
        this.drawCOBAngle(
          markObj,
          bgCanvas,
          linePointCanvas,
          infoPositionCanvas,
          editPointListCanvas,
          active,
          ieditIndex,
        );
    }
    //划过选中 画控制点
    if (active) {
      this.drawSelectCirle(bgCanvas, editPointListCanvas, ieditIndex);
    }
  },
  // 控制点
  drawSelectCirle(bgCanvas, editPointList, ieditIndex) {
    const controlShortcutKey = JSON.parse(
      localStorage.getItem("controlShortcutKey"),
    );
    const { controlPoint } = controlShortcutKey;
    if (controlPoint === "NotDisplay") return;
    let { selectCirleR, selectCirleColor, selectCirleColorEdge } = REMARK;
    let ctx = bgCanvas.getContext("2d");
    ctx.save();
    for (let k = 0; k < editPointList.length; k++) {
      let point = editPointList[k];
      ctx.beginPath();
      ctx.arc(point.x, point.y, selectCirleR, 0, Math.PI * 2, true);
      ctx.fillStyle = selectCirleColor;
      ctx.strokeStyle = ieditIndex === k ? selectCirleColorEdge : "transparent";
      if (controlPoint === "Fill") ctx.fill();
      ctx.stroke();
      ctx.closePath();
    }
    ctx.restore();
  },
  // 画voi的二维标注
  drawSliceOfVOI(
    markObj,
    bgCanvas,
    canvasWidth,
    canvasHeight,
    translate,
    rotate,
    scaleCur,
    infoPositionCanvas,
    linePointCanvas,
    currentSID,
    active,
    ieditIndex,
  ) {
    let imageCur = document.createElement("canvas");
    let { ROIData } = markObj;
    imageCur.width = ROIData.width;
    imageCur.height = ROIData.height;
    let hdCtx = imageCur.getContext("2d");
    hdCtx.putImageData(ROIData, 0, 0);

    let canvasEle_ctx = bgCanvas.getContext("2d");
    //旋转平移缩放
    canvasEle_ctx.save();
    canvasEle_ctx.globalAlpha = 0.6;
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
    // let color = active ? this.color_active : localStorage.rayplus_color;
    // this.drawCompInfo(markObj, bgCanvas, infoPositionCanvas, canvasWidth, canvasHeight, currentSID, ieditIndex)
    // this.drawDash(canvasEle_ctx, markObj, infoPositionCanvas, linePointCanvas, color)
  },
  //画 roi的公共信息
  drawCompInfo(
    markObj,
    bgCanvas,
    infoPositionCanvas,
    canvasWidth,
    canvasHeight,
    currentSID,
    ieditIndex,
  ) {
    let { infoWidth, infoHeight } = markObj;

    let temp = { ...infoPositionCanvas };
    let ctx = bgCanvas.getContext("2d");
    ctx.fillStyle = "rgba(10,10,10,0)"; //透明填充
    ctx.fillRect(temp.x, temp.y, infoWidth, infoHeight);

    let selectFontItem = this.getSelectFontItem();
    ctx.font = `${selectFontItem.fontSize} Arial`;
    ctx.textAlign = "left";
    ctx.fillStyle = localStorage.rayplus_color;
    ctx.fillText(
      `${markObj.area}`,
      temp.x + 10,
      temp.y + 15 + selectFontItem.top,
    ); //面积
    ctx.fillText(
      `Max: ${markObj.max}`,
      temp.x + 10,
      temp.y + 30 + selectFontItem.top * 2,
    );
    ctx.fillText(
      `Min: ${markObj.min}`,
      temp.x + 10,
      temp.y + 45 + selectFontItem.top * 3,
    );
    ctx.fillText(
      `Mean: ${markObj.aver}`,
      temp.x + 10,
      temp.y + 60 + selectFontItem.top * 4,
    );
    ctx.fillText(
      `Variance: ${markObj.variance}`,
      temp.x + 10,
      temp.y + 75 + selectFontItem.top * 5,
    );

    if (ieditIndex === -1) this.drawInfoRect(ctx, temp, markObj);
    ctx.save();
    return temp;
  },
  //画虚线
  drawDash(ctx, markObj, infoPositionCanvas, linePointCanvas, color) {
    let { infoHeight, infoWidth } = markObj;
    let { x, y } = infoPositionCanvas;
    ctx.lineWidth = 1;
    ctx.strokeStyle = color;
    let point = [];
    point[0] = { x: x + infoWidth / 2, y: y };
    point[1] = { x: x + infoWidth, y: y + infoHeight / 2 };
    point[2] = { x: x + infoWidth / 2, y: y + infoHeight };
    point[3] = { x: x, y: y + infoHeight / 2 };
    let res = null;
    let min_dis = Infinity;
    for (let i = 0; i < point.length; i++) {
      let dis = FIND.getPointDistance(point[i], linePointCanvas);
      if (dis < min_dis) {
        min_dis = dis;
        res = point[i];
      }
    }
    ctx.beginPath();
    ctx.setLineDash([3]);
    ctx.moveTo(res.x, res.y);
    ctx.lineTo(linePointCanvas.x, linePointCanvas.y);
    ctx.stroke();
    ctx.closePath();
  },
  // 获取当前选择的字体对象参数
  getSelectFontItem() {
    let rayplus_fontSize = localStorage.rayplus_fontSize;
    let selectFontItem = this.fontSizeGroup.filter(
      (ele) => ele.key === rayplus_fontSize,
    );
    return selectFontItem[0] || this.fontSizeGroup[2];
  },
  //画标注高亮边框
  drawInfoRect(ctx, { x, y }, { infoWidth, infoHeight }) {
    ctx.beginPath();
    let selectFontItem = this.getSelectFontItem();
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.strokeStyle = this.color_active;
    ctx.strokeRect(
      x,
      y,
      infoWidth * selectFontItem.scale,
      infoHeight * selectFontItem.scale,
    );
    ctx.closePath();
  },
  //画矩形
  drawRect(
    markObj,
    bgCanvas,
    canvasWidth,
    canvasHeight,
    editPointListCanvas,
    infoPositionCanvas,
    linePointCanvas,
    currentSID,
    active,
    ieditIndex,
  ) {
    if (editPointListCanvas.length != 4) {
      return;
    }
    let ctx = bgCanvas.getContext("2d");
    ctx.save();
    let color = active
      ? this.color_active
      : markObj.type === "VOI_Rect" && markObj.color
        ? markObj.color
        : localStorage.rayplus_color;

    ctx.strokeStyle = color;
    ctx.lineWidth = this.lineWidth;
    let [point1, point2, point3, point4] = editPointListCanvas;
    ctx.beginPath();
    ctx.moveTo(point1.x, point1.y);
    ctx.lineTo(point2.x, point2.y);
    ctx.lineTo(point3.x, point3.y);
    ctx.lineTo(point4.x, point4.y);
    ctx.lineTo(point1.x, point1.y);
    ctx.stroke();
    ctx.closePath();

    if (markObj.type === "Rect" && !markObj["ifNoneInfo"]) {
      this.drawCompInfo(
        markObj,
        bgCanvas,
        infoPositionCanvas,
        canvasWidth,
        canvasHeight,
        currentSID,
        ieditIndex,
      );
      this.drawDash(ctx, markObj, infoPositionCanvas, linePointCanvas, color);
    }

    ctx.restore();
  },

  //画圆
  drawCircle(
    markObj,
    bgCanvas,
    canvasWidth,
    canvasHeight,
    rota,
    editPointListCanvas,
    infoPositionCanvas,
    linePointCanvas,
    currentSID,
    active,
    ieditIndex,
  ) {
    if (editPointListCanvas.length != 2) {
      return;
    }
    let [point1, point2] = editPointListCanvas;
    let centerPoint = {
      x: (point1.x + point2.x) / 2,
      y: (point1.y + point2.y) / 2,
    };
    let r = MARK.getPointDistance(point1, centerPoint);

    let ctx = bgCanvas.getContext("2d");
    //俩控制点 相对x轴倾斜角度
    let rote = this.getRotateAngle(
      point1.x,
      point1.y,
      centerPoint.x,
      centerPoint.y,
    );
    let a = Math.abs(Math.cos(rote - rota) * r);
    let b = Math.abs(Math.sin(rote - rota) * r);
    ctx.save();
    let color = active
      ? this.color_active
      : markObj.type === "VOI_Circle" && markObj.color
        ? markObj.color
        : localStorage.rayplus_color;

    ctx.strokeStyle = color;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.ellipse(centerPoint.x, centerPoint.y, a, b, rota, 0, Math.PI * 2, true);
    ctx.stroke();
    ctx.closePath();
    if (markObj.type === "Circle") {
      this.drawCompInfo(
        markObj,
        bgCanvas,
        infoPositionCanvas,
        canvasWidth,
        canvasHeight,
        currentSID,
        ieditIndex,
      );
      this.drawDash(ctx, markObj, infoPositionCanvas, linePointCanvas, color);
    }
    ctx.restore();
  },
  //获取两线夹角
  getRotateAngle(x1, y1, x2, y2) {
    let height = y1 - y2,
      width = x1 - x2;
    if (width == 0) {
      return y1 >= y2 ? Math.PI / 2 : (Math.PI * 3) / 2;
    } else {
      let tan = Math.atan(height / width),
        angle = tan;

      return tan > 0
        ? x1 > x2
          ? angle
          : angle + Math.PI
        : x1 > x2
          ? angle + Math.PI * 2
          : angle + Math.PI;
    }
  },
  hexToRgbA(hex, A) {
    var c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      c = hex.substring(1).split("");
      if (c.length == 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c = "0x" + c.join("");
      return (
        "rgba(" +
        [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",") +
        "," +
        A.toString() +
        ")"
      );
    }
    throw new Error("Bad Hex");
  },
  drawRoi(
    markObj,
    bgCanvas,
    canvasWidth,
    canvasHeight,
    polyPointListCanvas,
    infoPositionCanvas,
    linePointCanvas,
    currentSID,
    active,
    ieditIndex,
  ) {
    // if (markObj.max == null || markObj.min == null) {
    //   return
    // }
    let color = active ? this.color_active : localStorage.rayplus_color;
    let ctx = bgCanvas.getContext("2d");
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = this.hexToRgbA(color, 0.1);
    ctx.beginPath();
    ctx.moveTo(polyPointListCanvas[0].x, polyPointListCanvas[0].y);
    for (let i = 1; i < polyPointListCanvas.length; i++) {
      ctx.lineTo(polyPointListCanvas[i].x, polyPointListCanvas[i].y);
      // ctx.quadraticCurveTo(polyPointListCanvas[i + 2].x, polyPointListCanvas[i + 2].y, polyPointListCanvas[i + 1].x, polyPointListCanvas[i + 1].y)
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fill("evenodd");

    this.drawCompInfo(
      markObj,
      bgCanvas,
      infoPositionCanvas,
      canvasWidth,
      canvasHeight,
      currentSID,
      ieditIndex,
    );
    this.drawDash(ctx, markObj, infoPositionCanvas, linePointCanvas, color);
    ctx.restore();
  },
  //画点
  drawPoint(
    markObj,
    bgCanvas,
    linePointCanvas,
    infoPositionCanvas,
    editPointListCanvas,
    active,
    ieditIndex,
  ) {
    let point = editPointListCanvas[0];
    let val = markObj.value;
    let ctx = bgCanvas.getContext("2d");
    ctx.save();
    let { selectCirleR } = REMARK;
    let color = active ? this.color_active : localStorage.rayplus_color;

    //画圆
    ctx.strokeStyle = color;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.arc(point.x, point.y, selectCirleR, 0, Math.PI * 2, true);
    ctx.stroke();

    //画信息
    const temp = infoPositionCanvas;
    ctx.beginPath();
    ctx.fillStyle = "rgba(10,10,10,0)";
    ctx.fillRect(
      infoPositionCanvas.x,
      infoPositionCanvas.y,
      markObj.infoWidth,
      markObj.infoHeight,
    );
    let selectFontItem = this.getSelectFontItem();
    ctx.font = `${selectFontItem.fontSize} Arial`;
    ctx.textAlign = "left";
    ctx.fillStyle = localStorage.rayplus_color;
    ctx.fillText(markObj.value, temp.x + 10, temp.y + 20 + selectFontItem.top);

    if (ieditIndex === -1) this.drawInfoRect(ctx, infoPositionCanvas, markObj);
    this.drawDash(ctx, markObj, infoPositionCanvas, linePointCanvas, color);
    ctx.restore();
  },
  // 绘制CPR 选点
  drawCPRPoint(
    markObj,
    bgCanvas,
    linePointCanvas,
    infoPositionCanvas,
    editPointListCanvas,
    active,
    ieditIndex,
  ) {
    let val = markObj.value;
    let ctx = bgCanvas.getContext("2d");
    ctx.save();
    console.log("draw cprpoint", editPointListCanvas);
    let { selectCirleR } = REMARK;
    let color = localStorage.rayplus_color;

    //画圆
    for (let i = 0; i < editPointListCanvas.length; i++) {
      let point = editPointListCanvas[i];
      // CPR active 只高亮当前选中的控制点
      ctx.strokeStyle = ieditIndex === i && active ? this.color_active : color;
      ctx.lineWidth = this.lineWidth;
      ctx.beginPath();
      ctx.arc(point.x, point.y, selectCirleR, 0, Math.PI * 2, true);
      ctx.stroke();
    }

    //画连接线
    ctx.restore();
    ctx.beginPath();
    for (let i = 0; i < editPointListCanvas.length - 1; i++) {
      let point1 = editPointListCanvas[i];
      let point2 = editPointListCanvas[i + 1];
      ctx.strokeStyle = color;
      ctx.moveTo(point1.x, point1.y);
      ctx.lineTo(point2.x, point2.y);
      ctx.stroke();
    }
    ctx.closePath();

    ctx.save();
    //画信息
    // const temp = infoPositionCanvas;
    // if (temp) {
    //   ctx.beginPath();
    //   ctx.fillStyle = "rgba(10,10,10,0)";
    //   ctx.fillRect(
    //     infoPositionCanvas.x,
    //     infoPositionCanvas.y,
    //     markObj.infoWidth,
    //     markObj.infoHeight,
    //   );
    //   let selectFontItem = this.getSelectFontItem();
    //   ctx.font = `${selectFontItem.fontSize} Arial`;
    //   ctx.textAlign = "left";
    //   ctx.fillStyle = localStorage.rayplus_color;
    //   ctx.fillText(
    //     markObj.value,
    //     temp.x + 10,
    //     temp.y + 20 + selectFontItem.top,
    //   );

    //   if (ieditIndex === -1)
    //     this.drawInfoRect(ctx, infoPositionCanvas, markObj);
    //   this.drawDash(ctx, markObj, infoPositionCanvas, linePointCanvas, color);
    // }

    ctx.restore();
  },
  drawHeartChest(
    markObj,
    bgCanvas,
    linePointCanvas,
    infoPositionCanvas,
    editPointListCanvas,
    active,
    ieditIndex,
  ) {
    let ctx = bgCanvas.getContext("2d");
    ctx.save();

    let color = localStorage.rayplus_color;

    //画圆
    const controlShortcutKey = JSON.parse(
      localStorage.getItem("controlShortcutKey"),
    );
    const { controlPoint } = controlShortcutKey;
    const { selectCirleColor, selectCirleR } = REMARK;
    if (controlPoint !== "NotDisplay") {
      for (let i = 0; i < editPointListCanvas.length; i++) {
        let point = editPointListCanvas[i];
        // CPR active 只高亮当前选中的控制点
        ctx.strokeStyle =
          ieditIndex === i && active ? this.color_active : color;
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.arc(point.x, point.y, selectCirleR, 0, Math.PI * 2, true);
        ctx.fillStyle = selectCirleColor;
        if (controlPoint === "Fill") ctx.fill();
        ctx.stroke();
      }
    }

    //画连接线
    ctx.restore();
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = active ? this.color_active : color;
    for (let i = 0; i < editPointListCanvas.length; i++) {
      // 1-2和3-4之间实线，2-3,1-4之间虚线
      if (i === 0 && editPointListCanvas.length > 1) {
        ctx.beginPath();
        let point1 = editPointListCanvas[i];
        let point2 = editPointListCanvas[i + 1];
        ctx.setLineDash([]);
        ctx.moveTo(point1.x, point1.y);
        ctx.lineTo(point2.x, point2.y);
        ctx.stroke();
        ctx.closePath();
      }

      if (i === 1 && editPointListCanvas.length > 2) {
        ctx.beginPath();
        let point1 = editPointListCanvas[1];
        let point2 = editPointListCanvas[i + 1];
        ctx.setLineDash([3]);
        ctx.moveTo(point1.x, point1.y);
        ctx.lineTo(point2.x, point2.y);
        ctx.stroke();
        ctx.closePath();
      }

      if (i === 2 && editPointListCanvas.length > 3) {
        ctx.beginPath();
        let point1 = editPointListCanvas[i];
        let point2 = editPointListCanvas[i + 1];
        ctx.setLineDash([]);
        ctx.moveTo(point1.x, point1.y);
        ctx.lineTo(point2.x, point2.y);
        ctx.stroke();
        ctx.closePath();
      }

      if (i === 3) {
        ctx.beginPath();
        let point1 = editPointListCanvas[0];
        let point2 = editPointListCanvas[i];
        ctx.setLineDash([3]);
        ctx.moveTo(point1.x, point1.y);
        ctx.lineTo(point2.x, point2.y);
        ctx.stroke();
        ctx.closePath();
      }
    }
    ctx.restore();

    //画标注
    if (markObj.values) {
      let temp = infoPositionCanvas;
      ctx.beginPath();
      ctx.fillStyle = "rgba(10,10,10,0)";
      ctx.fillRect(temp.x, temp.y, markObj.infoWidth, markObj.infoHeight);
      ctx.stroke();
      let selectFontItem = this.getSelectFontItem();
      ctx.font = `${selectFontItem.fontSize} Arial`;
      ctx.textAlign = "left";
      ctx.fillStyle = localStorage.rayplus_color;
      ctx.fillText(
        markObj.values[0],
        temp.x + 10,
        temp.y + 15 + selectFontItem.top,
      );
      ctx.fillText(
        markObj.values[1],
        temp.x + 10,
        temp.y + 35 + selectFontItem.top,
      );
      ctx.closePath();
      if (ieditIndex === -1) this.drawInfoRect(ctx, temp, markObj);
      // this.drawDash(ctx, markObj, infoPositionCanvas, linePointCanvas, color);
    }
    ctx.setLineDash([]);
    ctx.restore();
  },
  drawCOBAngle(
    markObj,
    bgCanvas,
    linePointCanvas,
    infoPositionCanvas,
    editPointListCanvas,
    active,
    ieditIndex,
  ) {
    let ctx = bgCanvas.getContext("2d");
    ctx.save();

    let color = localStorage.rayplus_color;

    //画圆
    const controlShortcutKey = JSON.parse(
      localStorage.getItem("controlShortcutKey"),
    );
    const { controlPoint } = controlShortcutKey;
    const { selectCirleColor, selectCirleR } = REMARK;
    if (controlPoint !== "NotDisplay") {
      for (let i = 0; i < editPointListCanvas.length; i++) {
        let point = editPointListCanvas[i];
        // CPR active 只高亮当前选中的控制点
        ctx.strokeStyle =
          ieditIndex === i && active ? this.color_active : color;
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.arc(point.x, point.y, selectCirleR, 0, Math.PI * 2, true);
        ctx.fillStyle = selectCirleColor;
        if (controlPoint === "Fill") ctx.fill();
        ctx.stroke();
      }
    }
    //画连接线
    ctx.restore();
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = active ? this.color_active : color;
    if (editPointListCanvas.length === 2) {
      let point1 = editPointListCanvas[0];
      let point2 = editPointListCanvas[1];
      ctx.beginPath();
      ctx.moveTo(point1.x, point1.y);
      ctx.lineTo(point2.x, point2.y);
      ctx.stroke();
      ctx.closePath();
    }
    if (editPointListCanvas.length === 3) {
      let point1 = editPointListCanvas[0];
      let point2 = editPointListCanvas[1];
      let point3 = editPointListCanvas[2];
      ctx.beginPath();
      ctx.moveTo(point1.x, point1.y);
      ctx.lineTo(point2.x, point2.y);
      ctx.stroke();
      ctx.closePath();
      ctx.beginPath();
      ctx.setLineDash([3]);
      ctx.moveTo(point2.x, point2.y);
      ctx.lineTo(point3.x, point3.y);
      ctx.stroke();
      ctx.closePath();
    }
    if (editPointListCanvas.length === 4) {
      let point1 = editPointListCanvas[0];
      let point2 = editPointListCanvas[1];
      let point3 = editPointListCanvas[2];
      let point4 = editPointListCanvas[3];

      ctx.beginPath();
      ctx.moveTo(point1.x, point1.y);
      ctx.lineTo(point2.x, point2.y);
      ctx.stroke();
      ctx.closePath();

      ctx.beginPath();
      ctx.moveTo(point3.x, point3.y);
      ctx.lineTo(point4.x, point4.y);
      ctx.stroke();
      ctx.closePath();

      ctx.beginPath();
      ctx.setLineDash([3]);
      ctx.moveTo((point1.x + point2.x) / 2, (point1.y + point2.y) / 2);
      ctx.lineTo((point3.x + point4.x) / 2, (point3.y + point4.y) / 2);
      ctx.stroke();
      ctx.closePath();
    }
    ctx.restore();

    //画标注
    if (markObj.values) {
      let temp = infoPositionCanvas;
      ctx.beginPath();
      ctx.fillStyle = "rgba(10,10,10,0)";
      ctx.fillRect(temp.x, temp.y, markObj.infoWidth, markObj.infoHeight);
      ctx.stroke();
      let selectFontItem = this.getSelectFontItem();
      ctx.font = `${selectFontItem.fontSize} Arial`;
      ctx.textAlign = "left";
      ctx.fillStyle = localStorage.rayplus_color;
      ctx.fillText(
        markObj.values[0],
        temp.x + 10,
        temp.y + 15 + selectFontItem.top,
      );
      ctx.fillText(
        markObj.values[1],
        temp.x + 10,
        temp.y + 35 + selectFontItem.top,
      );
      ctx.closePath();
      if (ieditIndex === -1) this.drawInfoRect(ctx, temp, markObj);
      // this.drawDash(ctx, markObj, infoPositionCanvas, linePointCanvas, color);
    }
    ctx.setLineDash([]);
    ctx.restore();
  },
  drawRuler(
    markObj,
    bgCanvas,
    canvasWidth,
    canvasHeight,
    editPointListCanvas,
    infoPositionCanvas,
    linePointCanvas,
    active,
    ieditIndex,
  ) {
    if (editPointListCanvas.length != 2) {
      return;
    }
    let startPoint = editPointListCanvas[0];
    let endPoint = editPointListCanvas[1];
    let ctx = bgCanvas.getContext("2d");
    let r = Math.atan2(startPoint.y - endPoint.y, startPoint.x - endPoint.x);
    let arrowPoint1 = {
      x: startPoint.x + Math.floor(Math.cos(r + (1.0 / 2.0) * Math.PI) * 10),
      y: startPoint.y + Math.floor(Math.sin(r + (1.0 / 2.0) * Math.PI) * 10),
    };
    let arrowPoint2 = {
      x: endPoint.x + Math.floor(Math.cos(r + (1.0 / 2.0) * Math.PI) * 10),
      y: endPoint.y + Math.floor(Math.sin(r + (1.0 / 2.0) * Math.PI) * 10),
    };
    let color = active ? this.color_active : localStorage.rayplus_color;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    // ctx.lineTo(arrowPoint2.x, arrowPoint2.y);
    // ctx.moveTo(startPoint.x, startPoint.y);
    // ctx.lineTo(arrowPoint1.x, arrowPoint1.y);
    ctx.stroke();
    ctx.closePath();

    let temp = infoPositionCanvas;
    ctx.fillStyle = "rgba(10,10,10,0)";
    ctx.fillRect(temp.x, temp.y, markObj.infoWidth, markObj.infoHeight);
    ctx.stroke();
    let selectFontItem = this.getSelectFontItem();
    ctx.font = `${selectFontItem.fontSize} Arial`;
    ctx.textAlign = "left";
    ctx.fillStyle = localStorage.rayplus_color;
    ctx.fillText(markObj.length, temp.x + 10, temp.y + 20 + selectFontItem.top);

    if (ieditIndex === -1) this.drawInfoRect(ctx, temp, markObj);
    this.drawDash(ctx, markObj, infoPositionCanvas, linePointCanvas, color);
    ctx.restore();
  },
  drawCurveRuler(
    markObj,
    bgCanvas,
    canvasWidth,
    canvasHeight,
    editPointListCanvas,
    infoPositionCanvas,
    linePointCanvas,
    active,
    ieditIndex,
  ) {
    if (editPointListCanvas.length < 2) {
      return;
    }
    let startPoint = editPointListCanvas[0];
    let ctx = bgCanvas.getContext("2d");

    let color = active ? this.color_active : localStorage.rayplus_color;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    for (let i = 1; i < editPointListCanvas.length; i++) {
      let point = editPointListCanvas[i];
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();

    let temp = infoPositionCanvas;
    ctx.fillStyle = "rgba(10,10,10,0)";
    ctx.fillRect(temp.x, temp.y, markObj.infoWidth, markObj.infoHeight);
    ctx.stroke();
    let selectFontItem = this.getSelectFontItem();
    ctx.font = `${selectFontItem.fontSize} Arial`;
    ctx.textAlign = "left";
    ctx.fillStyle = localStorage.rayplus_color;
    ctx.fillText(markObj.length, temp.x + 10, temp.y + 20 + selectFontItem.top);

    if (ieditIndex === -1) this.drawInfoRect(ctx, temp, markObj);
    this.drawDash(ctx, markObj, infoPositionCanvas, linePointCanvas, color);
    ctx.restore();
  },
  drawArrow(bgCanvas, editPointListCanvas, active) {
    if (editPointListCanvas.length != 2) {
      return;
    }
    let startPoint = editPointListCanvas[0];
    let endPoint = editPointListCanvas[1];
    let ctx = bgCanvas.getContext("2d");
    let r = Math.atan2(startPoint.y - endPoint.y, startPoint.x - endPoint.x);
    let arrowPoint1 = {
      x: endPoint.x + Math.floor(Math.cos(r + (1.0 / 6.0) * Math.PI) * 10),
      y: endPoint.y + Math.floor(Math.sin(r + (1.0 / 6.0) * Math.PI) * 10),
    };
    let arrowPoint2 = {
      x: endPoint.x + Math.floor(Math.cos(r - (1.0 / 6.0) * Math.PI) * 10),
      y: endPoint.y + Math.floor(Math.sin(r - (1.0 / 6.0) * Math.PI) * 10),
    };
    ctx.save();
    ctx.strokeStyle = active ? this.color_active : localStorage.rayplus_color;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.lineTo(arrowPoint1.x, arrowPoint1.y);
    ctx.moveTo(endPoint.x, endPoint.y);
    ctx.lineTo(arrowPoint2.x, arrowPoint2.y);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  },
  /*画曲线*/
  drawCurveLine(bgCanvas, curveLinePointListCanvas, active) {
    let ctx = bgCanvas.getContext("2d");
    ctx.save();
    ctx.strokeStyle = active ? this.color_active : localStorage.rayplus_color;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    let [startPoint] = curveLinePointListCanvas;
    ctx.moveTo(startPoint.x, startPoint.y);
    for (let i = 1; i < curveLinePointListCanvas.length; i++) {
      if (curveLinePointListCanvas[i]) {
        let endPoint = curveLinePointListCanvas[i];
        ctx.lineTo(endPoint.x, endPoint.y);
      }
    }
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  },
  //角度
  drawAngle(
    markObj,
    bgCanvas,
    canvasWidth,
    canvasHeight,
    editPointListCanvas,
    infoPositionCanvas,
    linePointCanvas,
    active,
    ieditIndex,
  ) {
    if (editPointListCanvas.length != 3) return;
    let [point1, point2, point3] = editPointListCanvas;
    let ctx = bgCanvas.getContext("2d");
    ctx.save();
    let color = active ? this.color_active : localStorage.rayplus_color;
    ctx.strokeStyle = color;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.moveTo(point1.x, point1.y);
    ctx.lineTo(point2.x, point2.y);
    ctx.lineTo(point3.x, point3.y);
    ctx.stroke();
    ctx.closePath();

    let temp = infoPositionCanvas;

    ctx.fillStyle = "rgba(10,10,10,0)";
    ctx.fillRect(temp.x, temp.y, markObj.infoWidth, markObj.infoHeight);
    let selectFontItem = this.getSelectFontItem();
    ctx.font = `${selectFontItem.fontSize} Arial`;
    ctx.textAlign = "left";
    ctx.fillStyle = localStorage.rayplus_color;
    ctx.fillText(markObj.angle, temp.x + 10, temp.y + 20 + selectFontItem.top);

    if (ieditIndex === -1) this.drawInfoRect(ctx, temp, markObj);
    this.drawDash(ctx, markObj, infoPositionCanvas, linePointCanvas, color);

    ctx.restore();
  },
  //文本
  drawText(
    markObj,
    bgCanvas,
    canvasWidth,
    canvasHeight,
    infoPositionCanvas,
    ieditIndex,
  ) {
    if (!markObj.text) return;
    let temp = infoPositionCanvas;

    let ctx = bgCanvas.getContext("2d");
    ctx.save();
    ctx.strokeStyle = localStorage.rayplus_color;
    ctx.fillStyle = "rgba(10,10,10,0)";
    ctx.fillRect(temp.x, temp.y, markObj.infoWidth, markObj.infoHeight);

    ctx.fillStyle = localStorage.rayplus_color;
    let selectFontItem = this.getSelectFontItem();
    ctx.font = `${selectFontItem.fontSize} Arial`;
    ctx.textAlign = "left";
    for (let i = 0; i < markObj.textLineCount; i++) {
      ctx.fillText(
        markObj.textArray[i],
        temp.x + 10,
        temp.y + i * 20 + 20 + selectFontItem.top * i,
      );
    }
    if (ieditIndex === -1) this.drawInfoRect(ctx, temp, markObj);
    ctx.restore();
  },
  /*坐标换算*/
  coordinateCanvasToImage(
    trans,
    rota,
    scale,
    imageWidth,
    imageHeight,
    canvasWidth,
    canvasHeight,
    canvasPoint,
  ) {
    let imagePoint = {
      x: 0,
      y: 0,
    };
    let tempX = 0;
    let tempY = 0;

    let canvasCenter = {
      x: canvasWidth / 2 + trans.x,
      y: canvasHeight / 2 + trans.y,
    };

    // 此时，图像原点在canvas的中心
    imagePoint.x = canvasPoint.x;
    imagePoint.y = canvasPoint.y;

    // 原点逆时针转回原来的角度
    tempX = imagePoint.x - canvasCenter.x;
    tempY = imagePoint.y - canvasCenter.y;
    let degree = Math.atan2(tempX, tempY);
    let r = Math.sqrt(tempX * tempX + tempY * tempY);

    // 所求点据中心点的x,y方向图像距离
    imagePoint.x = (r * Math.sin((rota / 180) * Math.PI + degree)) / scale.x;
    imagePoint.y = (r * Math.cos((rota / 180) * Math.PI + degree)) / scale.y;

    // 平移到以左上角为参考点的坐标
    imagePoint.x = Math.round(imagePoint.x + imageWidth / 2);
    imagePoint.y = Math.round(imagePoint.y + imageHeight / 2);
    return imagePoint;
  },

  coordinateImageToCanvas(
    trans,
    rota,
    scale,
    imageWidth,
    imageHeight,
    canvasWidth,
    canvasHeight,
    imagePoint,
  ) {
    let canvasPoint = {
      x: 0,
      y: 0,
    };
    let tempX;
    let tempY;

    // 换算到图像中心
    tempX = imagePoint.x - imageWidth / 2;
    tempY = imagePoint.y - imageHeight / 2;

    // 再做缩放
    tempX = tempX * scale.x;
    tempY = tempY * scale.y;

    // 再做旋转
    let degree = Math.atan2(tempX, tempY);
    let radius = Math.sqrt(tempX * tempX + tempY * tempY);
    tempX = radius * Math.sin(degree - rota);
    tempY = radius * Math.cos(degree - rota);

    // 图像中心和canvas中心重合
    canvasPoint.x = tempX + trans.x + canvasWidth / 2;
    canvasPoint.y = tempY + trans.y + canvasHeight / 2;

    return canvasPoint;
  },
  getPointDistance(point1, point2) {
    return Math.sqrt(
      (point2.y - point1.y) * (point2.y - point1.y) +
        (point2.x - point1.x) * (point2.x - point1.x),
    );
  },
};

export default MARK;
