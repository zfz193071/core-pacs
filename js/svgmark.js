const SVGMARK = {
  //操作使用的网格
  _SVGEle: null,
  drawFlag: 0, //0表示没有画笔，1表示智能画笔，2表示笔刷，3表示橡皮擦
  roiColor: "rgba(22,255,255,0.1)",
  edgeColor: "rgba(22,255,255,1)",
  _canvas: {
    width: 0,
    height: 0,
  },
  _image: {
    width: 0,
    height: 0,
    translate: { x: 0, y: 0 },
    rotate: 0,
    scale: { x: 0, y: 0 },
  },
  _polyPointListCanvas: [],

  startPointForOpt: {},

  _ifActive: false,

  //网格初始化：和canvas大小有关
  init(
    svgEle,
    canvasEle,
    imageWidth,
    imageHeight,
    translate,
    rotate,
    scale,
    canvasPoint,
  ) {
    this._SVGEle = svgEle;
    this._canvas = canvasEle;

    this._image.translate = translate;
    this._image.rotate = rotate;
    this._image.scale = scale;

    this._image.width = imageWidth;
    this._image.height = imageHeight;
    this.startPointForOpt = { ...canvasPoint };
    this._polyPointListCanvas = [];
    this._polyPointListCanvas.push({ ...this.startPointForOpt });
    this._ifActive = true;
  },

  clearAll() {
    this.startPointForOpt = {};
    this._polyPointListCanvas = [];
    this._ifActive = false;
    this.svgClear();
  },

  listCanvasToImage(
    trans,
    rota,
    scale,
    imageWidth,
    imageHeight,
    canvasWidth,
    canvasHeight,
    orgList,
  ) {
    let newList = [];
    for (let i = 0; i < orgList.length; i++) {
      let oldPoint = orgList[i];
      let newPoint = this.coordinateCanvasToImage(
        trans,
        rota,
        scale,
        imageWidth,
        imageHeight,
        canvasWidth,
        canvasHeight,
        oldPoint,
      );
      newList.push(newPoint);
    }
    return newList;
  },
  listImageToCanvas(
    trans,
    rota,
    scale,
    imageWidth,
    imageHeight,
    canvasWidth,
    canvasHeight,
    orgList,
  ) {
    let newList = [];
    for (let i = 0; i < orgList.length; i++) {
      let oldPoint = orgList[i];
      let newPoint = this.coordinateImageToCanvas(
        trans,
        rota,
        scale,
        imageWidth,
        imageHeight,
        canvasWidth,
        canvasHeight,
        oldPoint,
      );
      newList.push(newPoint);
    }
    return newList;
  },

  syncFromExistROI(editMarkStore) {
    let polyPointListImage = editMarkStore.polyPointList;
    if (polyPointListImage && polyPointListImage.length > 0) {
      if (editMarkStore.polyPointList) {
        this._image.polyPointList = editMarkStore.polyPointList;
      }
      let {
        width: imageWidth,
        height: imageHeight,
        translate,
        rotate,
        scale,
      } = this._image;
      let { width: canvasWidth, height: canvasHeight } = this._canvas;
      this._polyPointListCanvas = this.listImageToCanvas(
        translate,
        rotate,
        scale,
        imageWidth,
        imageHeight,
        canvasWidth,
        canvasHeight,
        polyPointListImage,
      );
    }
  },

  syncToROI(editMarkStore) {
    let polyPointListCanvas = this._polyPointListCanvas;
    if (polyPointListCanvas && polyPointListCanvas.length > 0) {
      editMarkStore.polyPointList = polyPointListCanvas;
      // let { width: imageWidth, height: imageHeight, translate, rotate, scale } = this._image
      // let { width: canvasWidth, height: canvasHeight } = this._canvas
      // editMarkStore.polyPointList = this.listCanvasToImage(translate, rotate, scale, imageWidth, imageHeight, canvasWidth, canvasHeight, polyPointListCanvas)
    }

    return { ...editMarkStore };
  },

  newPlygonEle() {
    let polygonEle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon",
    );
    polygonEle.style.fill = this.roiColor;
    polygonEle.style.stroke = this.edgeColor;
    polygonEle.style.stroke.width;
    polygonEle.style["fill-rule"] = "evenodd";
    polygonEle.points.clear();
    //清空现有点
    return polygonEle;
  },

  svgClear() {
    if (this._SVGEle) {
      let childArr = this._SVGEle.getElementsByTagName("polygon");
      for (let i = 0; i < childArr.length; i++) {
        childArr[i].remove();
      }
    }
  },
  rayCastingWithEvenodd(p, poly) {
    // px，py为p点的x和y坐标
    let px = p.x,
      py = p.y,
      flag = false;

    //这个for循环是为了遍历多边形的每一个线段
    for (let i = 0, l = poly.length, j = l - 1; i < l; j = i, i++) {
      let sx = poly[i].x, //线段起点x坐标
        sy = poly[i].y, //线段起点y坐标
        tx = poly[j].x, //线段终点x坐标
        ty = poly[j].y; //线段终点y坐标

      // 点与多边形顶点重合
      if ((sx === px && sy === py) || (tx === px && ty === py)) {
        return true;
      }

      // 点的射线和多边形的一条边重合，并且点在边上
      if (
        sy === ty &&
        sy === py &&
        ((sx > px && tx < px) || (sx < px && tx > px))
      ) {
        return true;
      }

      // 判断线段两端点是否在射线两侧
      if ((sy < py && ty >= py) || (sy >= py && ty < py)) {
        // 求射线和线段的交点x坐标，交点y坐标当然是py
        let x = sx + ((py - sy) * (tx - sx)) / (ty - sy);

        // 点在多边形的边上
        if (x === px) {
          return true;
        }

        // x大于px来保证射线是朝右的，往一个方向射，假如射线穿过多边形的边界，flag取反一下
        if (x > px) {
          flag = !flag;
        }
      }
    }

    // 射线穿过多边形边界的次数为奇数时点在多边形内
    return flag ? true : false;
  },
  rayCastingWithNonzero(p, poly) {
    // px，py为p点的x和y坐标
    let px = p.x,
      py = p.y,
      flag = false;

    //这个for循环是为了遍历多边形的每一个线段
    for (let i = 0, l = poly.length, j = l - 1; i < l; j = i, i++) {
      let sx = poly[i].x, //线段起点x坐标
        sy = poly[i].y, //线段起点y坐标
        tx = poly[j].x, //线段终点x坐标
        ty = poly[j].y; //线段终点y坐标

      // 点与多边形顶点重合
      if ((sx === px && sy === py) || (tx === px && ty === py)) {
        return true;
      }

      // 点的射线和多边形的一条边重合，并且点在边上
      if (
        sy === ty &&
        sy === py &&
        ((sx > px && tx < px) || (sx < px && tx > px))
      ) {
        return true;
      }

      // 判断线段两端点是否在射线两侧
      if ((sy < py && ty >= py) || (sy >= py && ty < py)) {
        // 求射线和线段的交点x坐标，交点y坐标当然是py
        let x = sx + ((py - sy) * (tx - sx)) / (ty - sy);

        // 点在多边形的边上
        if (x === px) {
          return true;
        }

        // x大于px来保证射线是朝右的，往一个方向射，只要射线穿过边界就是true
        if (x > px) {
          flag = true;
        }
      }
    }

    // 射线穿过多边形边界的次数为奇数时点在多边形内
    return flag ? true : false;
  },
  intRect(minRect, imageWidth, imageHeight) {
    minRect.top = Math.floor(minRect.top);
    if (minRect.top < 0) {
      minRect.top = 0;
    }
    minRect.left = Math.floor(minRect.left);
    if (minRect.left < 0) {
      minRect.left = 0;
    }
    minRect.right = Math.ceil(minRect.right);
    if (minRect.right > imageWidth - 1) {
      minRect.right = imageWidth - 1;
    }
    minRect.bottom = Math.ceil(minRect.bottom);
    if (minRect.bottom > imageHeight - 1) {
      minRect.bottom = imageHeight - 1;
    }
    return minRect;
  },
  getRangeOfList(imageWidth, imageHeight, orgList) {
    let range = { top: imageHeight, bottom: 0, left: imageWidth, right: 0 };
    for (let i = 0; i < orgList.length; i++) {
      let newPoint = orgList[i];
      if (newPoint.x < range.left) {
        range.left = newPoint.x;
      }
      if (newPoint.y < range.top) {
        range.top = newPoint.y;
      }
      if (newPoint.x > range.right) {
        range.right = newPoint.x;
      }
      if (newPoint.y > range.bottom) {
        range.bottom = newPoint.y;
      }
    }
    range = this.intRect(range);

    return range;
  },
  getPolyMarkInfo(orgdataObj, polyList) {
    console.time("getPolyMarkInfo");
    let { width: imageWidth, height: imageHeight, data: buf } = orgdataObj;
    let valueList = [],
      max = null,
      min = null,
      dataLength = 0,
      count = 0,
      aver = 0,
      variance = 0;
    let range = this.getRangeOfList(imageWidth, imageHeight, polyList);
    console.log("range", JSON.stringify(range));
    for (let j = range.top; j < range.bottom; j++) {
      for (let i = range.left; i < range.right; i++) {
        let point = { x: i, y: j };
        //用evenodd画多边形
        if (this.rayCastingWithEvenodd(point, polyList)) {
          let pos = j * imageWidth + i;
          let B = buf[pos];
          valueList.push(B);
          if (max == null) {
            max = B;
          } else if (B > max) {
            max = B;
          }
          if (min == null) {
            min = B;
          } else if (B < min) {
            min = B;
          }
          dataLength = dataLength + B;
          count++;
        }
      }
    }
    aver = dataLength / count;
    for (let i = 0; i < valueList.length; i++) {
      variance = variance + (valueList[i] - aver) * (valueList[i] - aver);
    }
    variance = Math.sqrt(variance / count);
    let infoObj = {
      min,
      max,
      aver,
      variance,
      count,
      markLength: polyList.length,
    };
    console.timeEnd("getPolyMarkInfo");
    console.log("getPolyMarkInfo", JSON.stringify(infoObj));
    return infoObj;
  },

  //更新SVG的polygon达到渲染的目的
  reflashSVG(canvasPoint) {
    //清空子节点
    this.svgClear();
    let polygonEle = this.newPlygonEle();
    let pointList = this._polyPointListCanvas;
    //把坐标点渲染出来
    for (let i = 0; i < pointList.length; i++) {
      //创建svgpoint
      let svgpoint = this._SVGEle.createSVGPoint();
      svgpoint.x = pointList[i].x;
      svgpoint.y = pointList[i].y;
      polygonEle.points.appendItem(svgpoint);
    }

    if (canvasPoint) {
      let svgpoint = this._SVGEle.createSVGPoint();
      //当前的点有可能没有添加进svg，但是还是需要渲染，从而增加画面流畅程度
      svgpoint.x = canvasPoint.x;
      svgpoint.y = canvasPoint.y;
      polygonEle.points.appendItem(svgpoint);
    }
    this._SVGEle.appendChild(polygonEle);

    //测试代码：输出svg勾画的结果
    // let { width: imageWidth, height: imageHeight, translate, rotate, scale } = this._image
    // let { width: canvasWidth, height: canvasHeight } = this._canvas
    // let newList = this.listCanvasToImage(translate, rotate, scale, imageWidth, imageHeight, canvasWidth, canvasHeight, pointList)
    // let range = this.getRangeOfList(imageWidth, imageHeight, newList)
    // console.log(newList.length)
    // console.log(JSON.stringify(range))
    // console.log(JSON.stringify(newList))
  },
  addPolygonPonitList(canvasPoint) {
    //避免把重复的点添加进去了，减少毛刺计算量
    let polyPointList = this._polyPointListCanvas;
    let length = polyPointList.length;
    let {
      width: imageWidth,
      height: imageHeight,
      translate,
      rotate,
      scale,
    } = this._image;
    let { width: canvasWidth, height: canvasHeight } = this._canvas;
    let ifAdd = true;
    if (polyPointList.length > 3) {
      let last = polyPointList[length - 1];
      let cpList = [canvasPoint, last];
      let imList = this.listCanvasToImage(
        translate,
        rotate,
        scale,
        imageWidth,
        imageHeight,
        canvasWidth,
        canvasHeight,
        cpList,
      );
      if (
        Math.round(imList[0].x) == Math.round(imList[1].x) &&
        Math.round(imList[0].y) == Math.round(imList[1].y)
      ) {
        ifAdd = false;
      }
    }
    if (ifAdd) {
      this._polyPointListCanvas.push(canvasPoint);
    }

    this.reflashSVG(canvasPoint);
  },
  //返回浮点数的坐标换算
  //逆变换的坐标系变换，逆变换先做缩放平移，再做旋转，最后做镜像，镜像和旋转以图像中心为原点。
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
};

export default SVGMARK;
