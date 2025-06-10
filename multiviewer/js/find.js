import REMARK from "./remark";
import CROSS from "./crosshair";
const FIND = {
  DIS: 4,
  init(that) {
    let DOM = that.$refs.DOMOBJ;
    DOM.addEventListener("mousemove", (e) => {
      return this._move(that, e);
    });
    DOM.addEventListener("mousedown", (e) => {
      return this._down(that, e);
    });
  },
  _move(that, e) {
    let { roiShow } = that;
    const cvp = that.currViewport;
    const { seriesInfos, iediting } = cvp;
    // console.log("ieditActive", cvp.ieditActive);
    if (iediting || roiShow < 0) return;
    let series = seriesInfos;
    if (!series.length) return;
    cvp.ieditActive = null;
    cvp.ieditIndex = null;
    this.findElement(that, e);
  },
  _down(that, e) {
    const cvp = that.currViewport;
    let { ieditActive } = cvp;
    if (ieditActive) {
      let { seriesInfos, canvasNow } = that.currViewport;
      let ieditListData = that.ieditListData;
      let seriesInfo = seriesInfos[canvasNow];
      let currentSID = seriesInfo.currentSID;
      let listData = ieditListData[currentSID] || [];
      if (e.button === 2) {
        const active = listData.find((item) => item.ID === ieditActive);
        // 右键不能删除AI分析的标注
        if (active && active.ifNoneInfo) {
          return;
        }
        if (active?.CPRContinue) return;
        that.delMarks(ieditActive);
      } else {
        for (let i = 0; i < listData.length; i++) {
          let { type, ID, ifNoneInfo } = listData[i];
          if (ID === ieditActive) {
            if (ifNoneInfo) return; // 左键不允许移动AI分析的标注
            let data = that.$clone(listData[i]);
            ieditListData[currentSID].splice(i, 1);
            that.activeOpt = type;
            that.ieditListData = ieditListData;
            this.setEditMarkStore(that, data, e);
            that.saveMarks(currentSID);
            that.roiShow++;
            break;
          }
        }
      }
    }
  },
  //点击选中标注 将对应标注复制给标注层editMarkStore
  setEditMarkStore(that, data, e) {
    const _this = that.$refs["iedit"];
    _this.ieditTempPoint = this.getCanvasPoint(that, e);
    //在这里把所有的image坐标变成了canvas坐标
    let editMarkStore = REMARK.copyMarkObj(_this, data, 1);
    _this.editMarkStore = editMarkStore;
    _this.findRoiPointName = that.currViewport.ieditIndex;
    _this.startDraw = true;
    _this.editExistRoi = true;
    if (editMarkStore.type === "Text") {
      const { x, y } = editMarkStore.editPointList[0];
      const radius = REMARK.selectCirleR;
      _this.textAreaTop = y + radius;
      _this.textAreaLeft = x + radius;
    }
    REMARK.draw(_this);
  },
  /*寻找渲染层元素*/
  findElement(that, e) {
    if (!that.roiStatus) return;
    const cvp = that.currViewport;
    const {
      canvasSize: size,
      canvasNow,

      seriesInfos,
      imageDatas,
    } = cvp;
    let ieditListData = that.ieditListData;
    let imageData = imageDatas[canvasNow];
    if (imageData.isCPR) return;
    let seriesInfo = seriesInfos[canvasNow];
    let canvasSize = size[canvasNow];
    let { curViewMod, DWIUID } = imageData;
    let listData = ieditListData[seriesInfo.currentSID] || [];

    listData = listData.filter(
      (res) =>
        res.curViewMod === curViewMod && CROSS.isSameIndex(DWIUID, res.DWIUID),
    );
    if (!listData.length) return false;
    let canvasPoint = this.getCanvasPoint(that, e);
    // let imagePoint = this.canvasToImg(that, canvasPoint, imageData, canvasSize);
    for (let i = 0; i < listData.length; i++) {
      let res = null;
      // CPR 点位查找
      if (listData[i].type === "CPRPoint") {
        const dis = curViewMod === seriesInfo.initViewMod ? 10 : 5;
        let cprRes = this.findSelectPoint(canvasPoint, listData[i], dis, that);
        if (cprRes) {
          res = cprRes.res;
          cvp.ieditIndex = cprRes.index;
          cvp.ieditActive = res.ID;
        }
        return;
      }
      //寻找控制点
      let res1 = this.findSelectPoint(canvasPoint, listData[i], this.DIS, that);
      if (res1) {
        res = res1.res;
        cvp.ieditIndex = res1.index;
      } else {
        //先寻找标注信息
        let res2 = this.findInfos(canvasPoint, listData[i], that);
        if (res2) {
          res = res2;
          cvp.ieditIndex = -1;
        } else {
          switch (listData[i].type) {
            case "CurveLine": {
              res = this.findCurveLine(canvasPoint, listData[i], that);
              break;
            }
            case "CurveRuler": {
              res = this.findCurveRuler(canvasPoint, listData[i], that);
              break;
            }
            case "Arrow":
            case "Ruler": {
              res = this.findArrow(canvasPoint, listData[i], that);
              break;
            }
            case "Point": {
              res = this.findPoint(canvasPoint, listData[i], that);
              break;
            }
            case "Angle": {
              res = this.findAngle(canvasPoint, listData[i], that);
              break;
            }
            case "Circle": {
              res = this.findCircle(canvasPoint, listData[i], that);
              break;
            }
            case "Rect": {
              res = this.findRect(canvasPoint, listData[i], that);
              break;
            }
            case "VOI_Rect": {
              //来自VOI的矩形边框，和普通的矩形一样查找
              res = this.findRect(canvasPoint, listData[i], that);
              break;
            }
            case "VOI_Circle": {
              //来自VOI的矩形边框，和普通的矩形一样查找
              res = this.findCircle(canvasPoint, listData[i], that);
              break;
            }
            case "HeartChest": {
              res = this.findHeartChest(canvasPoint, listData[i], that);
              break;
            }
            case "COBAngle": {
              res = this.findHeartChest(canvasPoint, listData[i], that);
              break;
            }
            case "Slice_VOI": {
              //VOI的切片不需要查找
              res = null;
              break;
            }
          }
        }
      }
      if (res) {
        cvp.ieditActive = res.ID;
        return;
      }
    }
  },
  /*寻找控制点*/
  findSelectPoint(canvasPoint, markObj, distance, that) {
    let list = markObj.editPointList;
    for (let k = 0; k < list.length; k++) {
      const cPoint = this.imgToCanvas(that, list[k]);
      let dis = this.getPointDistance(canvasPoint, cPoint);
      if (dis < distance) {
        return { res: markObj, index: k };
      }
    }
    return false;
  },
  //寻找infos
  findInfos(canvasPoint, markObj, that) {
    let { infoPosition, infoWidth, infoHeight, type } = markObj;
    let arr = [
      "Pen",
      "Circle",
      "Rect",
      "Angle",
      "Ruler",
      "Text",
      "Point",
      "HeartChest",
      "CurveRuler",
      "COBAngle",
    ];
    let res = null;
    if (arr.includes(type) && !markObj["ifNoneInfo"]) {
      let { x: minx, y: miny } = this.imgToCanvas(that, infoPosition);
      let { x, y } = canvasPoint;
      let maxx = minx + infoWidth;
      let maxy = miny + infoHeight;
      if (x >= minx && x <= maxx && y >= miny && y <= maxy) {
        res = markObj;
      }
    }
    return res;
  },
  findHeartChest(canvasPoint, markObj, that) {
    let list = markObj.editPointList;
    const p1 = this.imgToCanvas(that, list[0]);
    const p2 = this.imgToCanvas(that, list[1]);
    let dis = this.getDis(p1, p2, canvasPoint);
    if (dis < this.DIS) return markObj;
    const p3 = this.imgToCanvas(that, list[2]);
    const p4 = this.imgToCanvas(that, list[3]);
    let dis2 = this.getDis(p3, p4, canvasPoint);
    if (dis2 < this.DIS) return markObj;
    return false;
  },
  //曲线
  findCurveLine(canvasPoint, markObj, that) {
    let list = markObj.curveLinePointList;
    for (let i = 0; i < list.length; i++) {
      const p = this.imgToCanvas(that, list[i]);
      if (
        Math.abs(canvasPoint.x - p.x) + Math.abs(canvasPoint.y - p.y) <
        this.DIS
      ) {
        return markObj;
      }
    }
    return false;
  },
  findCurveRuler(canvasPoint, markObj, that) {
    let list = markObj.editPointList;
    for (let i = 0; i < list.length - 1; i++) {
      const p1 = this.imgToCanvas(that, list[i]);
      const p2 = this.imgToCanvas(that, list[i + 1]);
      let dis = this.getDis(p1, p2, canvasPoint);
      if (dis < this.DIS) return markObj;
    }
    return false;
  },
  //直尺和方向
  findArrow(canvasPoint, markObj, that) {
    let list = markObj.editPointList;
    const p1 = this.imgToCanvas(that, list[0]);
    const p2 = this.imgToCanvas(that, list[1]);
    let dis = this.getDis(p1, p2, canvasPoint);
    if (dis < this.DIS) return markObj;
    else return false;
  },
  //角度
  findAngle(canvasPoint, markObj, that) {
    let [point1, point2, point3] = markObj.editPointList;
    point1 = this.imgToCanvas(that, point1);
    point2 = this.imgToCanvas(that, point2);
    point3 = this.imgToCanvas(that, point3);
    let dis1 = this.getDis(point1, point2, canvasPoint);
    let dis2 = this.getDis(point2, point3, canvasPoint);
    if (dis1 < this.DIS || dis2 < this.DIS) return markObj;
    return false;
  },
  //点
  findPoint(canvasPoint, markObj, that) {
    let list = markObj.editPointList;
    const p = this.imgToCanvas(that, list[0]);
    let dis = this.getPointDistance(p, canvasPoint);
    if (dis < this.DIS) return markObj;
    else return false;
  },
  //矩形
  findRect(canvasPoint, markObj, that) {
    let [point1, point2, point3, point4] = markObj.editPointList;
    point1 = this.imgToCanvas(that, point1);
    point2 = this.imgToCanvas(that, point2);
    point3 = this.imgToCanvas(that, point3);
    point4 = this.imgToCanvas(that, point4);
    let dis1 = this.getDis(point1, point2, canvasPoint);
    let dis2 = this.getDis(point2, point3, canvasPoint);
    let dis3 = this.getDis(point3, point4, canvasPoint);
    let dis4 = this.getDis(point4, point1, canvasPoint);
    let DIS = this.DIS;
    if (dis1 < DIS || dis2 < DIS || dis3 < DIS || dis4 < DIS) return markObj;
    else return false;
  },
  //圆
  findCircle(canvasPoint, markObj, that) {
    let [point1, point2] = markObj.editPointList;
    if (!point2) return;
    point1 = this.imgToCanvas(that, point1);
    point2 = this.imgToCanvas(that, point2);
    //求a,b
    let a = (point1.x - point2.x) / 2;
    let b = (point1.y - point2.y) / 2;
    let { x, y } = canvasPoint;
    let m = (point1.x + point2.x) / 2;
    let n = (point1.y + point2.y) / 2;
    let res1 =
      Math.pow(x - m, 2) / Math.pow(a, 2) +
      Math.pow(y - n - this.DIS, 2) / Math.pow(b, 2);
    let res2 =
      Math.pow(x - m, 2) / Math.pow(a, 2) +
      Math.pow(y - n + this.DIS, 2) / Math.pow(b, 2);
    if ((res1 - 1) * (res2 - 1) <= 0) return markObj;
    else return false;
  },
  //计算两点之间距离
  getPointDistance(point1, point2) {
    let c =
      (point2.y - point1.y) * (point2.y - point1.y) +
      (point2.x - point1.x) * (point2.x - point1.x);
    return Math.sqrt(c);
  },
  // 获取点和直线之间的距离
  getDis(obj1, obj2, canvasPoint) {
    let dis = 100;
    let θ1 = this.getAngle(obj1, obj2, canvasPoint);
    let θ2 = this.getAngle(obj2, obj1, canvasPoint);

    if (θ1 > 90 || θ2 > 90) {
      let a = Math.sqrt(
        (canvasPoint.x - obj1.x) * (canvasPoint.x - obj1.x) +
          (canvasPoint.y - obj1.y) * (canvasPoint.y - obj1.y),
      );
      let b = Math.sqrt(
        (canvasPoint.x - obj2.x) * (canvasPoint.x - obj2.x) +
          (canvasPoint.y - obj2.y) * (canvasPoint.y - obj2.y),
      );
      dis = Math.min(a, b);
    } else if (obj1.x === obj2.x) {
      dis = Math.abs(canvasPoint.x - obj1.x);
    } else if (obj1.y === obj2.y) {
      dis = Math.abs(canvasPoint.y - obj1.y);
    } else {
      let k = (obj1.y - obj2.y) / (obj1.x - obj2.x);
      let b = (obj1.y * obj2.x - obj2.y * obj1.x) / (obj2.x - obj1.x);
      dis =
        Math.abs(k * canvasPoint.x - 1 * canvasPoint.y + b) /
        Math.sqrt(1 + k * k);
    }
    return dis;
  },
  //获取线和线之间的角度
  getAngle(startPoint, peakPoint, endPoint) {
    var ab = { x: startPoint.x - peakPoint.x, y: startPoint.y - peakPoint.y };
    var ac = { x: endPoint.x - peakPoint.x, y: endPoint.y - peakPoint.y };
    let angle =
      (Math.acos(
        (ab.x * ac.x + ab.y * ac.y) /
          (Math.sqrt(ab.x * ab.x + ab.y * ab.y) *
            Math.sqrt(ac.x * ac.x + ac.y * ac.y)),
      ) *
        180) /
      Math.PI;
    if (isNaN(angle)) angle = 0;
    angle = Math.round(angle * 100) / 100;
    return angle;
  },
  /*获取当前鼠标点在canvas上的坐标*/
  getCanvasPoint(that, e) {
    if (e.target.offsetParent.id !== "editWrapper") return { x: -100, y: -100 };
    let res = this.touchEvent(e);
    const cvp = that.currViewport;
    let canvasSize = cvp.canvasSize[cvp.canvasNow];

    let canvasPoint = {
      x: e.offsetX,
      y: e.offsetY,
    };
    return canvasPoint;
  },
  touchEvent(e) {
    let obj = {};
    if ($IsPC) {
      obj.x = e.clientX;
      obj.y = e.clientY;
    } else {
      if (e.touches.length) {
        obj.x = e.touches[0].pageX;
        obj.y = e.touches[0].pageY;
      } else {
        obj.x = e.changedTouches[0].pageX;
        obj.y = e.changedTouches[0].pageY;
      }
    }
    return obj;
  },
  canvasToImg(that, point, imageData, canvasSize) {
    let { scale, translate, rotate } = imageData;
    let { width, height } = canvasSize;
    let { width: imageWidth, height: imageHeight } = imageData.img;
    return that.$coordinateCanvasToImage(
      translate,
      rotate,
      scale,
      imageWidth,
      imageHeight,
      width,
      height,
      point,
    );
  },
  imgToCanvas(that, point) {
    let { imageDatas, canvasNow, canvasSize: size } = that.currViewport;
    let imageData = imageDatas[canvasNow];
    let canvasSize = size[canvasNow];

    let { scale, translate, rotate, img } = imageData;
    let { width, height } = canvasSize;
    let { width: imageWidth, height: imageHeight } = img;
    return that.$coordinateImageToCanvas(
      translate,
      rotate,
      scale,
      imageWidth,
      imageHeight,
      width,
      height,
      point,
    );
  },
};

export default FIND;
