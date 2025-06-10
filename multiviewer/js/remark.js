import CROSS from "./crosshair";
import MARK from "./mark";
import SVGMARK from "./svgmark";
import Find from "@/components/multiviewer/js/find";

const REMARK = {
  canvas: null,
  TEMP: null,
  forceEraser: false,
  selectCirleR: 3,
  selectCirleColor: "rgba(254,254,65,0.5)",
  selectCirleColorEdge: "rgba(254,254,65,1)",
  SVGMARK: SVGMARK,
  mousedownListener: null,
  mousemoveListener: null,
  mouseupListener: null,
  mouseleaveListener: null,

  //逆变换的坐标系变换，逆变换先做缩放平移，再做旋转，最后做镜像，镜像和旋转以图像中心为原点。
  coordinateCanvasToImage(
    trans,
    rota,
    scale,
    imageWidth,
    imageHeight,
    canvasWidth,
    canvasHeigt,
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
      y: canvasHeigt / 2 + trans.y,
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
    imagePoint.x = (r * Math.sin(rota + degree)) / scale.x;
    imagePoint.y = (r * Math.cos(rota + degree)) / scale.y;

    // 平移到以左上角为参考点的坐标
    imagePoint.x = imagePoint.x + imageWidth / 2;
    imagePoint.y = imagePoint.y + imageHeight / 2;
    return imagePoint;
  },
  coordinateImageToCanvas(
    trans,
    rota,
    scale,
    imageWidth,
    imageHeight,
    canvasWidth,
    canvasHeigt,
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
    if (rota != 0) {
      let degree = Math.atan2(tempX, tempY);
      let radius = Math.sqrt(tempX * tempX + tempY * tempY);
      tempX = radius * Math.sin(degree - rota);
      tempY = radius * Math.cos(degree - rota);
    }

    // 图像中心和canvas中心重合
    canvasPoint.x = tempX + trans.x + canvasWidth / 2;
    canvasPoint.y = tempY + trans.y + canvasHeigt / 2;

    return canvasPoint;
  },
  onEditMouseDown(e, that) {
    // 不要在CPR平面上画标注
    if (that.imageData.isCPR) return;
    let canvasPoint = this.getCanvasPoint(e);
    //如果是擦除标注工具
    if (that.labelStatus === "Rubber") {
      if (that.ieditActive) {
        const sid = that.seriesInfo.SeriesIndex;
        let listData = that.ieditListData[sid] || [];
        const active = listData.find((item) => item.ID === that.ieditActive);
        // 右键不能删除AI分析的标注
        if (active && active.ifNoneInfo) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        that.$emit("delMarks", that.ieditActive);
      }
      return;
    } else if (
      that.editMarkStore.type === "Angle" &&
      that.findRoiPointName === 2
    )
      return;
    else if (that.editMarkStore.type === "Text" && that.editExistRoi) {
      const textSelectPoint = that.editMarkStore.linePoint;
      const dis = Find.getPointDistance(canvasPoint, textSelectPoint);
      if (dis >= 6) {
        that.editExistRoi = false;
      } else {
        that.editExistRoi = true;
        that.findRoiPointName = 0;
      }
      this.draw(that);
      return;
    } else if (that.labelStatus === "CPRPoint") {
      const sid = that.seriesInfo.SeriesIndex;
      let listData = that.ieditListData[sid] || [];
      // 一个series的一个viewMod只能有一条CPR 标注
      if (
        listData.find(
          (item) =>
            item.type === "CPRPoint" &&
            item.curViewMod === that.imageData.curViewMod &&
            !item.CPRContinue,
        )
      )
        return;
    } else if (
      (that.labelStatus === "HeartChest" || that.labelStatus === "COBAngle") &&
      e.button === 0
    ) {
      if (that.editMarkStore.editPointList.length >= 4) {
        return;
      }
    } else if (that.ieditActive) return;
    that.startDraw = true;
    let findRoiPointName = null;
    /*如果在编辑层不存在标注*/

    //这里给一个svg专用的的临时变量
    let ifActiveSvg = false;
    if (!that.editExistRoi) {
      // 编辑层不存在标注
      this.newMark(that);
      ifActiveSvg = true;
      switch (that.editMarkStore.type) {
        case "pen": {
          findRoiPointName = null;
          that.editMarkStore.editPointList = [];
          break;
        }
        case "VOI_Circle": {
          that.editMarkStore.editPointList[0] = { ...canvasPoint };
          that.editMarkStore.editPointList[1] = { ...canvasPoint };
          that.editMarkStore.voi_id = that.$store.state.VOI.curEditItem._id;
          findRoiPointName = 1;
          break;
        }
        case "VOI_Rect": {
          for (let i = 0; i < 4; i++) {
            that.editMarkStore.editPointList[i] = { ...canvasPoint };
          }
          that.editMarkStore.voi_id = that.$store.state.VOI.curEditItem._id;
          findRoiPointName = 2;
          break;
        }
        case "Rect": {
          that.editMarkStore.editPointList[0] = { ...canvasPoint };
          findRoiPointName = 0;
          break;
        }
        case "CurveLine": {
          that.editMarkStore.curveLinePointList[0] = { ...canvasPoint };
          findRoiPointName = 0;
          break;
        }
        case "CurveRuler": {
          that.editMarkStore.editPointList[0] = { ...canvasPoint };
          findRoiPointName = 0;
          break;
        }
        case "Ruler":
        case "Arrow":
        case "Angle":
        case "Circle": {
          that.editMarkStore.editPointList[0] = { ...canvasPoint };
          findRoiPointName = 0;
          break;
        }
        case "Text": {
          that.editMarkStore.editPointList[0] = { ...canvasPoint };
          findRoiPointName = 0;
          that.textAreaTop = canvasPoint.y + this.selectCirleR;
          that.textAreaLeft = canvasPoint.x + this.selectCirleR;
          break;
        }
        case "Point": {
          that.editMarkStore.editPointList[0] = { ...canvasPoint };
          findRoiPointName = 0;
          break;
        }
        case "CPRPoint": {
          that.editMarkStore.editPointList[0] = { ...canvasPoint };
          findRoiPointName = 0;
          break;
        }
        case "HeartChest": {
          that.editMarkStore.editPointList[0] = { ...canvasPoint };
          findRoiPointName = 0;
          break;
        }
        case "COBAngle": {
          that.editMarkStore.editPointList[0] = { ...canvasPoint };
          findRoiPointName = 0;
          break;
        }
      }
      that.editExistRoi = true;
    }
    if (that.editExistRoi) {
      // 如果是CPR选点，则连续添加到editPointList
      if (that.editMarkStore.type === "CPRPoint") {
        if (that.editMarkStore.appendDirection) {
          that.editMarkStore.editPointList.unshift({ ...canvasPoint });
          that.findRoiPointName = 0;
        } else {
          that.editMarkStore.editPointList.push({ ...canvasPoint });
          that.findRoiPointName = that.editMarkStore.editPointList.length - 1;
        }
      }

      if (that.editMarkStore.type === "CurveRuler") {
        if (e.button === 0) {
          that.editMarkStore.editPointList.push({ ...canvasPoint });
          findRoiPointName = that.editMarkStore.editPointList.length - 1;
        } else {
          //非左键退出
          this.draw(that);
          that.editMarkStore = that.$clone(this.TEMP);
          that.iSure(that.editMarkStore, that.seriesInfo, that.imageData);
          that.startDraw = false;
          that.editExistRoi = false;
          return;
        }
      }
    }
    //非画笔工具
    if (findRoiPointName !== null) {
      that.findRoiPointName = findRoiPointName;
      this.draw(that);
    }
    //画笔工具
    if (that.editExistRoi && that.editMarkStore.type === "Pen") {
      //只有初次画才激活svg
      if (ifActiveSvg) {
        console.log("SVG:active SVG");
        //初始化网格
        let { scale, translate, rotate, img } = that.imageData;
        let { width: imageWidth, height: imageHeight } = img;
        SVGMARK.init(
          that.SVGM_SVG,
          that.canvas,
          imageWidth,
          imageHeight,
          translate,
          rotate,
          scale,
          canvasPoint,
        );
        //同步标注的状态
        // SVGMARK.syncFromExistROI(that.editMarkStore)   //暂时不需要，因为修改还没有写
      } else {
        //直接画
        this.draw(that);
        //激活标注移动
        that.findRoiPointName = -1;
      }
    }
    that.startDraw = true;
  },
  editMouseDown(e, that) {
    this.onEditMouseDown(e, that);
  },
  editMouseUp(e, that) {
    if (
      that.labelStatus === "Rubber" ||
      (that.labelStatus === "CurveRuler" && !that.ieditActive)
    )
      return;
    let canvasPoint = this.getCanvasPoint(e);
    if (that.startDraw == true) {
      if (
        that.labelStatus === "Circle" ||
        that.labelStatus === "Ruler" ||
        that.labelStatus === "Arrow"
      ) {
        if (that.editMarkStore.editPointList.length < 2) {
          that.editMarkStore.editPointList.push(canvasPoint);
          that.findRoiPointName = 1;
          return;
        }
      } else if (that.labelStatus === "Rect") {
        if (that.editMarkStore.editPointList.length < 2) {
          that.editMarkStore.editPointList.push(canvasPoint);
          that.findRoiPointName = 2;
          return;
        }
      } else if (that.labelStatus == "Angle") {
        //角度多一次交互
        if (that.editMarkStore.editPointList.length < 3) {
          that.editMarkStore.editPointList.push(canvasPoint);
          that.findRoiPointName = that.editMarkStore.editPointList.length - 1;
          return;
        }
      } else if (that.labelStatus == "Text" && that.editExistRoi) {
        that.findRoiPointName = undefined;
        return;
      } else if (that.labelStatus === "CPRPoint" && that.editExistRoi) {
        this.saveCPRPoint(that, canvasPoint);
        return;
      } else if (
        (that.labelStatus === "HeartChest" ||
          that.labelStatus === "COBAngle") &&
        that.editExistRoi
      ) {
        if (that.editMarkStore.editPointList.length < 4) {
          that.editMarkStore.editPointList.push(canvasPoint);
          that.findRoiPointName = that.editMarkStore.editPointList.length - 1;
          return;
        }
      }

      //在这里释放对控制点的吸附，公共函数
      that.findRoiPointName = undefined;
      if (that.labelStatus == "Pen" && SVGMARK._ifActive) {
        console.log("SVG:syncToROI");
        that.editMarkStore = SVGMARK.syncToROI(that.editMarkStore); //这里是canvas坐标
        SVGMARK.clearAll();
        this.draw(that); //同步坐标并刷新标注
        that.editMarkStore = that.$clone(this.TEMP);
        that.addROIInfo(that.editMarkStore, that.seriesInfo, that.imageData);
      } else {
        if (this.TEMP.imgData) this.TEMP.imgData = null;
        that.editMarkStore = that.$clone(this.TEMP);
      }
      that.iSure(that.editMarkStore, that.seriesInfo, that.imageData);

      that.startDraw = false;
      that.editExistRoi = false;
      return;
    }
  },

  /*获取当前鼠标点在canvas上的坐标*/
  getCanvasPoint(e) {
    let res = this.touchEvent(e);
    let canvasPoint = this.coordinateTrans(res.x, res.y);
    return canvasPoint;
  },
  coordinateTrans(coordinateX, coordinateY) {
    let vCanvasOrigin = this.canvas.getBoundingClientRect();
    let tempX = parseInt(coordinateX - vCanvasOrigin.left);
    let tempY = parseInt(coordinateY - vCanvasOrigin.top);
    return {
      x: tempX,
      y: tempY,
    };
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
  createMousedownListener(that) {
    let _this = this;
    return function (e) {
      if (
        (that.labelStatus === "CPRPoint" ||
          that.labelStatus === "CurveRuler") &&
        e.button === 2
      ) {
        return _this.editMouseDown(e, that);
      } else if (_this.mouseEventCheck(e, that)) {
        //不是左键按下
        const iedit = that.$refs.iedit;
        iedit.style["pointer-events"] = "none"; //暂时将右键和中键传下去,2s后恢复
        //清空标注操作
        that.clearIeditPara();
        setTimeout(function () {
          iedit.style["pointer-events"] = "auto";
        }, 2000);
        return;
      }
      return _this.editMouseDown(e, that);
    };
  },
  createMousemoveListener(that) {
    let _this = this;
    return function (e) {
      if (_this.mouseEventCheck(e, that)) {
        //不是左键按下
        return;
      }
      return _this.editMouseMove(e);
    };
  },
  createMouseupListener(that) {
    let _this = this;
    return function (e) {
      if (that.labelStatus === "CPRPoint" && e.button === 2) {
        _this.saveCPR(that);
        return;
      } else if (_this.mouseEventCheck(e, that)) {
        //不是左键按下
        return;
      }
      return _this.editMouseUp(e, that);
    };
  },
  createMouseleaveListener(that) {
    let _this = this;
    return function (e) {
      // CPR接触到边界的时候，直接结束draw状态，不然会有很多bug
      if (
        that.labelStatus === "CPRPoint" &&
        that.startDraw &&
        _this.CPROutofBoundary(e)
      ) {
        const point = _this.getCanvasPoint(e);
        _this.saveCPRPoint(that, point);
        _this.saveCPR(that);
        return;
      }
      return _this.editMouseUp(e, that);
    };
  },
  addEditMouseEvent(that) {
    this.canvas = that.canvas;
    let canvas = that.canvas;
    const mousedownListener = this.createMousedownListener(that);
    this.mousedownListener = mousedownListener;
    const mousemoveListener = this.createMousemoveListener(that);
    this.mousemoveListener = mousemoveListener;
    const mouseupListener = this.createMouseupListener(that);
    this.mouseupListener = mouseupListener;
    const mouseleaveListener = this.createMouseleaveListener(that);
    this.mouseleaveListener = mouseleaveListener;
    if ($IsPC) {
      canvas.addEventListener("mousedown", this.mousedownListener);
      canvas.addEventListener("mousemove", this.mousemoveListener);
      canvas.addEventListener("mouseup", this.mouseupListener);
      canvas.addEventListener("mouseleave", this.mouseleaveListener);
    } else {
      canvas.addEventListener("touchstart", (e) => {
        return this.editMouseDown(e, that);
      });
      canvas.addEventListener("touchmove", (e) => {
        return this.editMouseDown(e, that);
      });
      canvas.addEventListener("touchend", (e) => {
        return this.editMouseUp(e, that);
      });
    }
  },
  removeEditMouseEvent(that) {
    this.canvas = that.canvas;
    let canvas = that.canvas;
    if ($IsPC) {
      if (this.mousedownListener)
        canvas.removeEventListener("mousedown", this.mousedownListener);
      if (this.mousemoveListener)
        canvas.removeEventListener("mousemove", this.mousemoveListener);
      if (this.mouseupListener)
        canvas.removeEventListener("mouseup", this.mouseupListener);
      if (this.mouseleaveListener)
        canvas.removeEventListener("mouseleave", this.mouseleaveListener);
    } else {
      canvas.removeEventListener("touchstart", (e) => {
        return this.editMouseDown(e, that);
      });
      canvas.removeEventListener("touchmove", (e) => {
        return this.editMouseDown(e, that);
      });
      canvas.removeEventListener("touchend", (e) => {
        return this.editMouseUp(e, that);
      });
    }
    canvas.style.cursor = "";
  },

  //没有标注激活的时候，右键或者中键按下
  mouseEventCheck(e, that) {
    if ((e.button === 2 || e.button === 1) && !that.ieditActive) {
      // e.preventDefault();
      // e.stopPropagation();
      return true;
    } else {
      return false;
    }
  },
  CPROutofBoundary(e) {
    const { top, left, bottom, right } = e.target.getBoundingClientRect();
    if (
      e.clientX <= left ||
      e.clientX >= right - 5 ||
      e.clientY <= top ||
      e.clientY >= bottom - 5
    ) {
      return true;
    }
    return false;
  },
  // 保存CPR标注点位
  saveCPRPoint(that, canvasPoint) {
    const sid = that.seriesInfo.SeriesIndex;
    const CPRVoiListData = { ...that.CPRVoiListData };
    let curCPRVoiList = CPRVoiListData[sid];

    console.log(
      that.ieditActive,
      that.findRoiPointName,
      that.editMarkStore.editPointList,
      curCPRVoiList,
      "mouseup",
    );
    if (!that.ieditActive) {
      if (that.findRoiPointName === -1) return;
      if (!curCPRVoiList) {
        curCPRVoiList = [];
        CPRVoiListData[sid] = curCPRVoiList;
      }
      let len = this.TEMP.editPointList.length;
      const crossPoint = this.CPRTransPoint(
        this.TEMP.editPointList[len - 1],
        that,
      );
      curCPRVoiList.push(crossPoint);
      that.$emit("update:CPRVoiListData", CPRVoiListData);
    } else {
      if (that.editMarkStore.CPRContinue) {
        let len = this.TEMP.editPointList.length;

        if (that.editMarkStore.appendDirection) {
          const crossPoint = this.CPRTransPoint(
            this.TEMP.editPointList[0],
            that,
          );
          curCPRVoiList.unshift(crossPoint);
        } else {
          const crossPoint = this.CPRTransPoint(
            this.TEMP.editPointList[len - 1],
            that,
          );
          curCPRVoiList.push(crossPoint);
        }
        that.$emit("update:CPRVoiListData", CPRVoiListData);
        return;
      }
      let old = curCPRVoiList[that.findRoiPointName];
      let newVal = this.CPRTransPoint(
        this.TEMP.editPointList[that.findRoiPointName],
        that,
      );
      old = this.changeCPRPointByView(old, newVal, that.imageData.curViewMod);
      curCPRVoiList[that.findRoiPointName] = old;

      if (that.findRoiPointName === curCPRVoiList.length - 1) {
        that.editMarkStore.editPointList.push({ ...canvasPoint });
        that.findRoiPointName = that.editMarkStore.editPointList.length - 1;
        that.editMarkStore.CPRContinue = true;
        that.editMarkStore.appendDirection = 0;
        return;
      }

      if (that.findRoiPointName === 0) {
        that.editMarkStore.editPointList.unshift({ ...canvasPoint });
        that.findRoiPointName = 0;
        that.editMarkStore.CPRContinue = true;
        that.editMarkStore.appendDirection = 1;
        return;
      }
      that.editMarkStore.CPRContinue = false;
      that.editMarkStore.appendDirection = 0;
      that.$emit("update:CPRVoiListData", CPRVoiListData);
      this.saveCPR(that);
    }
  },
  // 标注函数

  //VOI的矩形框选
  registVOIRect(that) {
    this.editMouseMove = function (e) {
      if (that.startDraw) {
        let canvasPoint = this.getCanvasPoint(e);
        this.changeRect(that, canvasPoint);
        this.draw(that);
      }
    };
  },

  //VOI的圆形框选
  registVOICircle(that) {
    this.editMouseMove = function (e) {
      if (that.startDraw) {
        let canvasPoint = this.getCanvasPoint(e);
        this.changeCircle(that, canvasPoint);
        this.draw(that);
      }
    };
  },

  //ROI画笔
  registPen(that) {
    //画笔默认为增加模式
    this.editMouseMove = function (e) {
      if (that.startDraw) {
        let canvasPoint = this.getCanvasPoint(e);
        if (SVGMARK._ifActive) {
          SVGMARK.addPolygonPonitList(canvasPoint);
        } else {
          this.changePenROI(that, canvasPoint);
        }
      }
    };
  },
  // 矩形
  registRect(that) {
    this.editMouseMove = function (e) {
      if (that.startDraw) {
        let canvasPoint = this.getCanvasPoint(e);
        this.changeRect(that, canvasPoint);
        this.draw(that);
      }
    };
  },
  // 圆形
  registCircle(that) {
    this.editMouseMove = function (e) {
      if (that.startDraw) {
        let canvasPoint = this.getCanvasPoint(e);
        this.changeCircle(that, canvasPoint);
        this.draw(that);
      }
    };
  },

  // 曲线
  registCurveLine(that) {
    this.editMouseMove = function (e) {
      if (that.startDraw) {
        let canvasPoint = this.getCanvasPoint(e);
        if (that.ieditActive) {
          this.changeCurveLine(that, canvasPoint);
        } else {
          that.editMarkStore.curveLinePointList.push(canvasPoint);
        }
        this.draw(that);
      }
    };
  },
  // 曲线
  registCurveRuler(that) {
    this.editMouseMove = function (e) {
      if (that.startDraw) {
        let canvasPoint = this.getCanvasPoint(e);
        this.changeCurveRuler(that, canvasPoint);
        this.draw(that);
      }
    };
  },
  // 角度
  registAngle(that) {
    this.editMouseMove = function (e) {
      if (that.startDraw) {
        let canvasPoint = this.getCanvasPoint(e);
        let ctx = that.canvas2d;
        /*如果在编辑层不存在标注*/
        if (that.editExistRoi) {
          if (that.editMarkStore.editPointList.length == 2) {
            this.changeAngle(that, canvasPoint);
            ctx.clearRect(0, 0, that.canvas.width, that.canvas.height);
            ctx.save();
            ctx.strokeStyle = localStorage.rayplus_color;
            ctx.lineWidth = MARK.lineWidth;
            ctx.beginPath();
            let [point1, point2] = that.editMarkStore.editPointList;
            ctx.moveTo(point1.x, point1.y);
            ctx.lineTo(point2.x, point2.y);
            ctx.stroke();
            ctx.closePath();
            ctx.restore();
            this.drawSelectCirle(that);
          } else {
            this.changeAngle(that, canvasPoint);
            this.draw(that);
          }
        }
      }
    };
  },
  // 直尺
  registRuler(that) {
    this.editMouseMove = function (e) {
      if (that.startDraw) {
        let canvasPoint = this.getCanvasPoint(e);
        /*如果在编辑层存在标注*/
        if (that.editExistRoi) {
          /*如果在编辑层存在标注 整体进行位置变换*/
          this.changeLine(that, canvasPoint);
          this.draw(that);
        }
      }
    };
  },
  // 箭头
  registArrow(that) {
    this.registRuler(that);
  },
  // 文本
  registText(that) {
    this.editMouseMove = function (e) {
      if (that.startDraw && that.findRoiPointName == 0) {
        let canvasPoint = this.getCanvasPoint(e);
        that.editMarkStore.editPointList[0] = canvasPoint;
        that.textAreaTop = canvasPoint.y + this.selectCirleR;
        that.textAreaLeft = canvasPoint.x + this.selectCirleR;
        this.draw(that);
      }
    };
  },
  // 像素值
  registPoint(that) {
    this.editMouseMove = function (e) {
      if (that.startDraw) {
        let canvasPoint = this.getCanvasPoint(e);
        this.changeOne(that, canvasPoint);
        this.draw(that);
      }
    };
  },

  registCPRPoint(that) {
    this.editMouseMove = function (e) {
      if (that.startDraw) {
        let canvasPoint = this.getCanvasPoint(e);
        this.changeCPR(that, canvasPoint);
        this.draw(that);
      }
    };
  },

  registHeartChest(that) {
    this.editMouseMove = function (e) {
      if (that.startDraw) {
        let canvasPoint = this.getCanvasPoint(e);
        this.changeHeartChest(that, canvasPoint);
        this.draw(that);
      }
    };
  },

  registCOBAngle(that) {
    this.editMouseMove = function (e) {
      if (that.startDraw) {
        let canvasPoint = this.getCanvasPoint(e);
        this.changeCOBAngle(that, canvasPoint);
        this.draw(that);
      }
    };
  },

  // 橡皮擦
  registRubber(that) {
    that.clearIeditPara();
    this.editMouseMove = function (e) {
      return;
    };
  },
  newMark(that) {
    that.editMarkStore.type = that.labelStatus;
    that.editMarkStore.curViewMod = that.imageData.curViewMod;
    that.editMarkStore.curImageNum = that.imageData.curImageNum;
    that.editMarkStore.DWIUID = that.imageData.DWIUID;
    that.editMarkStore.model = that.seriesInfo.model;
    that.editMarkStore.posFlag = false;
    if (that.infoRangeDic[that.labelStatus]) {
      that.editMarkStore.infoWidth = that.infoRangeDic[that.labelStatus].width;
      that.editMarkStore.infoHeight =
        that.infoRangeDic[that.labelStatus].height;
    }
  },

  // 改变函数
  //被动改变linepoint
  changeLinePoint(that) {
    let { editPointList, polyPointList, posFlag } = that.editMarkStore;
    if (!posFlag) return;
    let pList = editPointList;
    if (polyPointList) {
      pList = polyPointList;
    }
    let sumx = 0,
      sumy = 0,
      maxx = 0;
    for (let i = 0; i < pList.length; i++) {
      let { x, y } = pList[i];
      sumx += x;
      sumy += y;
      maxx = x > maxx ? x : maxx;
    }
    let linePoint = {
      x: Math.round(sumx / pList.length),
      y: Math.round(sumy / pList.length),
    };
    that.editMarkStore.linePoint = linePoint;
  },
  //移动标注infos
  changePos(that, canvasPoint) {
    let { ieditTempPoint, editMarkStore, canvasSize } = that;
    let { infoPosition, infoWidth, infoHeight } = editMarkStore;
    let dx = canvasPoint.x - ieditTempPoint.x;
    let dy = canvasPoint.y - ieditTempPoint.y;
    infoPosition.x += dx;
    infoPosition.y += dy;
    if (infoPosition.x > canvasSize.width - 50) {
      infoPosition.x = canvasSize.width - 50;
    }
    if (infoPosition.y > canvasSize.height - 50) {
      infoPosition.y = canvasSize.height - 50;
    }
    that.ieditTempPoint = { ...canvasPoint };
    editMarkStore.posFlag = true;
  },
  // 整体移动点
  changeMove(that, canvasPoint, item = "editPointList") {
    let { ieditTempPoint, editMarkStore, canvasSize } = that;
    let { infoPosition, linePoint, infoWidth, infoHeight } = editMarkStore;
    let PointList = editMarkStore[item];
    let dx = canvasPoint.x - ieditTempPoint.x;
    let dy = canvasPoint.y - ieditTempPoint.y;
    for (let i = 0; i < PointList.length; i++) {
      PointList[i].x += dx;
      PointList[i].y += dy;
    }
    if (infoPosition) {
      infoPosition.x += dx;
      infoPosition.y += dy;
      if (infoPosition.x > canvasSize.width - infoWidth - 50) {
        infoPosition.x = canvasSize.width - infoWidth - 50;
      }
      if (infoPosition.y > canvasSize.height - infoHeight - 50) {
        infoPosition.y = canvasSize.height - infoHeight - 50;
      }
    }
    if (linePoint) {
      linePoint.x += dx;
      linePoint.y += dy;
    }
    that.ieditTempPoint = { ...canvasPoint };
  },
  // 单点
  changeOne(that, canvasPoint) {
    let { findRoiPointName, editMarkStore } = that;
    let { editPointList } = editMarkStore;
    if (findRoiPointName === -1) {
      this.changePos(that, canvasPoint);
    } else {
      editPointList[0] = canvasPoint;
    }
    this.changeLinePoint(that);
  },
  // CPR点位
  changeCPR(that, canvasPoint) {
    let { findRoiPointName, editMarkStore } = that;
    let { editPointList } = editMarkStore;
    if (findRoiPointName === -1) {
      this.changePos(that, canvasPoint);
    } else {
      editPointList[findRoiPointName] = canvasPoint;
    }
  },

  changeHeartChest(that, canvasPoint) {
    let { findRoiPointName, editMarkStore } = that;
    let { editPointList } = editMarkStore;
    if (findRoiPointName === -1) {
      this.changePos(that, canvasPoint);
    } else if (findRoiPointName === null) {
      editPointList = this.changeMove(that, canvasPoint);
    } else {
      editPointList[findRoiPointName] = canvasPoint;
    }
  },
  changeCOBAngle(that, canvasPoint) {
    let { findRoiPointName, editMarkStore } = that;
    let { editPointList } = editMarkStore;
    if (findRoiPointName === -1) {
      this.changePos(that, canvasPoint);
    } else if (findRoiPointName === null) {
      editPointList = this.changeMove(that, canvasPoint);
    } else {
      editPointList[findRoiPointName] = canvasPoint;
    }
  },
  saveCPR(that) {
    if (that.labelStatus === "CPRPoint" && that.startDraw) {
      if (this.TEMP.imgData) this.TEMP.imgData = null;
      that.editMarkStore = that.$clone(this.TEMP);
      that.iSure(that.editMarkStore, that.seriesInfo, that.imageData);
    }
  },
  // 曲线
  changeCurveLine(that, canvasPoint) {
    this.changeMove(that, canvasPoint, "curveLinePointList");
  },
  changeCurveRuler(that, canvasPoint) {
    let { findRoiPointName, editMarkStore } = that;
    let editPointList = editMarkStore.editPointList;
    if (findRoiPointName > -1) {
      editPointList[findRoiPointName] = canvasPoint;
    } else if (findRoiPointName === -1) {
      this.changePos(that, canvasPoint);
    }
    this.changeLinePoint(that);
  },
  //角度
  changeAngle(that, canvasPoint) {
    let { findRoiPointName, editMarkStore } = that;
    let editPointList = editMarkStore.editPointList;
    if (findRoiPointName === 0) {
      editPointList[0] = canvasPoint;
    } else if (findRoiPointName === 1) {
      editPointList[1] = canvasPoint;
    } else if (findRoiPointName === 2) {
      editPointList[2] = canvasPoint;
    } else if (findRoiPointName === -1) {
      this.changePos(that, canvasPoint);
    } else {
      this.changeMove(that, canvasPoint);
    }
    this.changeLinePoint(that);
  },
  // 直尺
  changeLine(that, canvasPoint) {
    let { findRoiPointName, editMarkStore } = that;
    let { editPointList } = editMarkStore;
    if (findRoiPointName === 0) {
      editPointList[0] = canvasPoint;
    } else if (findRoiPointName === 1) {
      editPointList[1] = canvasPoint;
    } else if (findRoiPointName === -1) {
      this.changePos(that, canvasPoint);
    } else {
      this.changeMove(that, canvasPoint);
    }
    this.changeLinePoint(that);
  },
  changePenROI(that, canvasPoint) {
    let { findRoiPointName, editMarkStore } = that;
    if (findRoiPointName === -1) {
      this.changePos(that, canvasPoint);
      this.draw(that);
    }
  },
  // 矩形，顺序是左上，右上，右下，左下
  changeRect(that, canvasPoint) {
    let { findRoiPointName, editMarkStore } = that;
    let editPointList = editMarkStore.editPointList;
    if (findRoiPointName === null) {
      editPointList = this.changeMove(that, canvasPoint);
    } else if (findRoiPointName === -1) {
      this.changePos(that, canvasPoint);
    } else {
      let tempPoint = { ...canvasPoint };
      editPointList[findRoiPointName] = tempPoint;
      let rotate = that.imageData.rotate;
      switch (findRoiPointName) {
        case 0:
        case 2: {
          if (editPointList.length < 2) return;
          let center = {
            x: (editPointList[0].x + editPointList[2].x) / 2,
            y: (editPointList[0].y + editPointList[2].y) / 2,
          };
          let R = that.getPointDistance(center, editPointList[0]);
          let theta0, theta1, theta3;
          theta0 =
            MARK.getRotateAngle(
              editPointList[0].x,
              editPointList[0].y,
              center.x,
              center.y,
            ) -
            rotate * 2;
          theta1 = Math.PI - theta0;
          editPointList[1] = {
            x: center.x + R * Math.cos(theta1),
            y: center.y + R * Math.sin(theta1),
          };
          theta3 = theta1 + Math.PI;
          editPointList[3] = {
            x: center.x + R * Math.cos(theta3),
            y: center.y + R * Math.sin(theta3),
          };
          break;
        }
        case 1:
        case 3: {
          let center = {
            x: (editPointList[1].x + editPointList[3].x) / 2,
            y: (editPointList[1].y + editPointList[3].y) / 2,
          };
          let R = that.getPointDistance(center, editPointList[1]);
          let theta0, theta1, theta2;
          theta1 =
            MARK.getRotateAngle(
              editPointList[1].x,
              editPointList[1].y,
              center.x,
              center.y,
            ) -
            rotate * 2;
          theta2 = Math.PI - theta1;
          editPointList[2] = {
            x: center.x + R * Math.cos(theta2),
            y: center.y + R * Math.sin(theta2),
          };
          theta0 = theta2 + Math.PI;
          editPointList[0] = {
            x: center.x + R * Math.cos(theta0),
            y: center.y + R * Math.sin(theta0),
          };
          break;
        }
      }
    }
    this.changeLinePoint(that);
  },
  // 圆形
  changeCircle(that, canvasPoint) {
    let { findRoiPointName, editMarkStore } = that;
    let editPointList = editMarkStore.editPointList;
    if ([0, 1].includes(findRoiPointName)) {
      editPointList[findRoiPointName] = canvasPoint;
    } else if (findRoiPointName === -1) {
      this.changePos(that, canvasPoint);
    } else {
      editPointList = this.changeMove(that, canvasPoint);
    }
    this.changeLinePoint(that);
  },

  //刷新
  draw(that) {
    let { scale, translate, rotate, img } = that.imageData;
    let { currentSID } = that.seriesInfo;
    that.canvas2d.clearRect(0, 0, that.canvas.width, that.canvas.height);
    let { width: imageWidth, height: imageHeight } = img;
    this.setInitPos(that);
    let editPointList = that.$clone(that.editMarkStore).editPointList;
    //在这里把canvas坐标变成了图像坐标, 保存在editListData中，以便渲染到其他地方
    let markObj = this.copyMarkObj(that, that.editMarkStore);
    switch (markObj.type) {
      case "Rect": {
        markObj = that.addRectInfo(markObj, that.seriesInfo, that.imageData);
        break;
      }
      case "Circle": {
        markObj = that.addCircleInfo(markObj, that.seriesInfo, that.imageData);
        break;
      }
      case "Ruler": {
        markObj = that.addRulerInfo(markObj, that.imageData);
        break;
      }
      case "CurveRuler": {
        markObj = that.addCurveRulerInfo(markObj, that.imageData);
        break;
      }
      case "Point": {
        markObj = that.addPointInfo(markObj, that.seriesInfo, that.imageData);
        break;
      }
      case "CPRPoint": {
        // markObj = that.addPointInfo(markObj, that.seriesInfo, that.imageData);
        break;
      }
      case "HeartChest": {
        markObj = that.addHeartChestInfo(markObj, that.imageData);
        break;
      }
      case "COBAngle": {
        markObj = that.addCOBAngleInfo(markObj, that.imageData);
        break;
      }
      case "Angle": {
        if (editPointList.length !== 3) break;
        markObj = that.addAngleInfo(markObj);
        break;
      }
      case "Text": {
        markObj = that.addTextInfo(markObj);
        break;
      }
    }
    this.TEMP = { ...markObj };

    //先把基础的图形画出来
    if (markObj.type !== "Text")
      MARK.markObjReflash(
        markObj,
        that.canvas,
        translate,
        rotate,
        scale,
        that.canvas.width,
        that.canvas.height,
        imageWidth,
        imageHeight,
        currentSID,
        0,
        that.findRoiPointName,
      );

    this.drawSelectCirle(that, editPointList);
  },
  // 控制点
  drawSelectCirle(that, editPointList) {
    const controlShortcutKey = JSON.parse(
      localStorage.getItem("controlShortcutKey"),
    );
    const { controlPoint } = controlShortcutKey;
    if (controlPoint === "NotDisplay") return;
    let { selectCirleR, selectCirleColor, selectCirleColorEdge } = this;
    that.canvas2d.save();
    for (let k in editPointList) {
      let point = editPointList[k];
      that.canvas2d.beginPath();
      that.canvas2d.arc(point.x, point.y, selectCirleR, 0, Math.PI * 2, true);
      that.canvas2d.fillStyle = selectCirleColor;
      that.canvas2d.strokeStyle = "transparent";
      if (k == that.findRoiPointName) {
        that.canvas2d.strokeStyle = selectCirleColorEdge;
      }
      if (controlPoint === "Fill") that.canvas2d.fill();
      that.canvas2d.stroke();
      that.canvas2d.closePath();
    }
    that.canvas2d.restore();
  },
  // 二维CPR控制点转三维Point
  CPRTransPoint(point, that) {
    const cvp = that.currViewport;
    let canvasNow = cvp.canvasNow;
    let imageData = { ...cvp.imageDatas[canvasNow] };
    let { crossPos } = imageData;
    let pos = { ...crossPos };
    // let tmp = this.canvasToImg(point, that);
    pos = { ...pos, ...point };
    const result = CROSS.asyncAcrossPoint(imageData, pos, cvp.AcrossPoint);
    return result;
  },
  // 三维CPR控制点转二维
  CPRTransPointToCanvas(crossPoint, that) {
    const crossPos = CROSS.getCrossPosOnImg(that.imageData, crossPoint);
    let { x, y } = crossPos;
    const result = { x, y };
    return result;
  },
  // 根据curViewMod更改CPR三维点位
  changeCPRPointByView(oldVal, newVal, viewMod) {
    const { x, y, z } = newVal;
    if (viewMod === 0) {
      oldVal.x = x;
      oldVal.y = y;
      oldVal.z !== newVal.z && (oldVal.z = z);
    } else if (viewMod === 1) {
      oldVal.x = x;
      oldVal.z = z;
      oldVal.y !== newVal.y && (oldVal.y = y);
    } else if (viewMod === 2) {
      oldVal.y = y;
      oldVal.z = z;
      oldVal.x !== newVal.x && (oldVal.x = x);
    }
    return oldVal;
  },
  // 二维转三维
  canvasToImg(point, that) {
    let { scale, translate, rotate, img } = that.imageData;
    let { width, height } = that.canvasSize;
    let { width: imageWidth, height: imageHeight } = img;
    return this.coordinateCanvasToImage(
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
  // 三维转二维
  imgToCanvas(point, that) {
    let { scale, translate, rotate, img } = that.imageData;
    let { width, height } = that.canvasSize;
    let { width: imageWidth, height: imageHeight } = img;
    return this.coordinateImageToCanvas(
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
  //标注里面所有的点canvas坐标转img坐标
  copyMarkObj(that, markObj, type = 0) {
    let fun = type ? "imgToCanvas" : "canvasToImg";
    console.log("go into copyMarkObj", fun);
    markObj = that.$clone(markObj);
    //所有的控制点相关的都是图像坐标
    let editPointList = [],
      curveLinePointList = [],
      polyPointList = [];
    if (markObj.polyPointList) {
      for (let i = 0; i < markObj.polyPointList.length; i++) {
        let polyPoint = this[fun](markObj.polyPointList[i], that);
        polyPointList.push(polyPoint);
      }
      markObj.polyPointList = polyPointList;
    }
    for (let i = 0; i < markObj.editPointList.length; i++) {
      let editPoint = this[fun](markObj.editPointList[i], that);
      editPointList.push(editPoint);
    }
    for (let i = 0; i < markObj.curveLinePointList.length; i++) {
      let editPoint = this[fun](markObj.curveLinePointList[i], that);
      curveLinePointList.push(editPoint);
    }
    markObj.editPointList = editPointList;
    markObj.curveLinePointList = curveLinePointList;
    if (markObj.infoPosition) {
      markObj.infoPosition = this[fun](markObj.infoPosition, that);
    }
    if (markObj.linePoint) {
      markObj.linePoint = this[fun](markObj.linePoint, that);
    }
    return markObj;
  },
  //初始化默认定位点
  setInitPos(that) {
    let { infoRangeDic, editMarkStore, canvasSize } = that;
    let { type, editPointList, posFlag } = editMarkStore;
    let { width, height } = infoRangeDic[type] || {};
    if (posFlag) return;
    let linePoint = null,
      infoPosition = null;
    let minx = -1,
      maxx = 0,
      sumy = 0,
      sumx = 0;
    switch (type) {
      case "Pen":
      case "Circle":
      case "Rect":
      case "Ruler":
      case "Angle":
      case "CurveRuler":
      case "HeartChest":
      case "COBAngle": {
        let pList = editPointList;
        if (type === "Pen") {
          pList = editMarkStore.polyPointList || [];
        }
        for (let i = 0; i < pList.length; i++) {
          let { x, y } = pList[i];
          sumx += x;
          sumy += y;
          maxx = x > maxx ? x : maxx;
          minx = minx === -1 ? (minx = x) : x < minx ? x : minx;
        }
        linePoint = {
          x: Math.round(sumx / pList.length),
          y: Math.round(sumy / pList.length),
        };
        if (type === "Pen" && pList.length > 0) {
          linePoint = pList[0];
        }
        infoPosition = {
          x: maxx + 10,
          y: Math.round(linePoint.y - height / 2),
        };
        break;
      }
      case "Point": {
        linePoint = { ...editPointList[0] };
        minx = maxx = linePoint.x;
        infoPosition = {
          x: linePoint.x + 10,
          y: Math.round(linePoint.y - height / 2),
        };
        break;
      }
      case "Text": {
        // 手动触发聚焦
        setTimeout(() => {
          if (that.$refs.textArea.classList.contains("canvasInputShow")) {
            that.$refs.textArea.focus();
          }
        }, 50);
        linePoint = { ...editPointList[0] };
        minx = maxx = linePoint.x;
        infoPosition = { x: linePoint.x + 10, y: linePoint.y };
        break;
      }
      default: {
        linePoint = { ...editPointList[0] };
        minx = maxx = linePoint.x;
        break;
      }
    }
    editMarkStore.linePoint = linePoint;
    if (infoPosition) {
      if (infoPosition.x + width > canvasSize.width) {
        infoPosition.x = minx - 10 - width;
      }
      if (infoPosition.y < 0) {
        infoPosition.y = 0;
      } else if (infoPosition.y + height > canvasSize.height) {
        infoPosition.y = canvasSize.height - height;
      }
    }

    editMarkStore.infoPosition = infoPosition;
    return { ...editMarkStore };
  },
};

export default REMARK;
