import SERVER from "./server.js";
const REMARK = {
  gCanvasEdit: {},
  // gCanvasEditCxt: {},
  bg: {},
  ctxBg: {},
  gCanvasEditCxt: { x: 0, y: 0 },
  gMouseDownPoint: { x: 0, y: 0 },
  gMouseCurrentPoint: { x: 0, y: 0 },
  gMouseUpPoint: { x: 0, y: 0 },
  currentPoint: { x: 0, y: 0 },
  prePoint: { x: 0, y: 0 },

  fSelectedFlag: 0,

  drawFlag: 0, //0表示没有画笔，1表示智能画笔，2表示笔刷，3表示橡皮擦

  markResult: [],

  //操作使用的网格
  // --网格数组
  grid: {
    width: 0,
    height: 0,
    division: 0,
    imageWidth: 0,
    imageHeight: 0,
    bg: {},
    translatePoint: { x: 0, y: 0 },
    rotateDegree: 0,
    scaleLevel: { x: 0, y: 0 },
    reverseFlag: 0,
    flipFlag: 0,
    data: [],
  },

  gridInit(
    gridDivision,
    imageWidth,
    imageHeight,
    translatePoint,
    rotateDegree,
    scaleLevel,
    reverseFlag,
    flipFlag,
  ) {
    this.grid.division = gridDivision;
    this.grid.imageWidth = imageWidth;
    this.grid.imageHeight = imageHeight;
    this.grid.data = [];
    this.gCanvasEditCxt = this.gCanvasEdit.getContext("2d");
    this.gCanvasEditCxt.translate(0, 0);
    this.gCanvasEditCxt.scale(1, 1);
    this.gCanvasEditCxt.rotate(0);

    this.grid.height = parseInt(this.gCanvasEdit.height / this.grid.division);
    this.grid.width = parseInt(this.gCanvasEdit.width / this.grid.division);

    this.grid.translatePoint = translatePoint;
    this.grid.rotateDegree = rotateDegree;
    this.grid.scaleLevel = scaleLevel;
    this.grid.reverseFlag = reverseFlag;
    this.grid.flipFlag = flipFlag;

    // 剪裁需要初始化的区域
    let pointList = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ];
    pointList[0] = this.coordinateImageToCanvas(
      translatePoint,
      rotateDegree,
      scaleLevel,
      imageWidth,
      imageHeight,
      this.gCanvasEdit.width,
      this.gCanvasEdit.height,
      { x: 0, y: 0 },
    );
    pointList[1] = this.coordinateImageToCanvas(
      translatePoint,
      rotateDegree,
      scaleLevel,
      imageWidth,
      imageHeight,
      this.gCanvasEdit.width,
      this.gCanvasEdit.height,
      { x: imageWidth, y: 0 },
    );
    pointList[2] = this.coordinateImageToCanvas(
      translatePoint,
      rotateDegree,
      scaleLevel,
      imageWidth,
      imageHeight,
      this.gCanvasEdit.width,
      this.gCanvasEdit.height,
      { x: 0, y: imageHeight },
    );
    pointList[3] = this.coordinateImageToCanvas(
      translatePoint,
      rotateDegree,
      scaleLevel,
      imageWidth,
      imageHeight,
      this.gCanvasEdit.width,
      this.gCanvasEdit.height,
      { x: imageWidth, y: imageHeight },
    );
    let edge = {
      left: this.grid.width,
      right: 0,
      top: this.grid.height,
      bottom: 0,
    };

    for (let i = 0; i < 4; i++) {
      if (edge.left > pointList[i].x) {
        edge.left = pointList[i].x - 1;
      }
      if (edge.right < pointList[i].x) {
        edge.right = pointList[i].x + 1;
      }
      if (edge.top > pointList[i].y) {
        edge.top = pointList[i].y - 1;
      }
      if (edge.bottom < pointList[i].y) {
        edge.bottom = pointList[i].y + 1;
      }
    }

    for (let j = 0; j < this.grid.height; j++) {
      for (let i = 0; i < this.grid.width; i++) {
        let gridPoint = {
          x: i * this.grid.division,
          y: j * this.grid.division,
          markFlag: 0,
          edgeFlag: 0,
          edgeDirection: [0, 0, 0, 0, 0, 0, 0, 0],
          imageFlag: 0,
          imageX: 0,
          imageY: 0,
        };
        let canvasPoint = { x: gridPoint.x, y: gridPoint.y };
        if (
          i > edge.left &&
          i < edge.right &&
          j > edge.top &&
          j < edge.bottom
        ) {
          let imagePoint = this.coordinateCanvasToImage(
            translatePoint,
            rotateDegree,
            scaleLevel,
            imageWidth,
            imageHeight,
            this.gCanvasEdit.width,
            this.gCanvasEdit.height,
            canvasPoint,
          );
          gridPoint.imageX = imagePoint.x;
          gridPoint.imageY = imagePoint.y;

          if (
            gridPoint.imageX >= 0 &&
            gridPoint.imageX < this.grid.imageWidth &&
            gridPoint.imageY >= 0 &&
            gridPoint.imageY < this.grid.imageHeight
          ) {
            gridPoint.imageFlag = 1;
          }
        }
        this.grid.data.push(gridPoint);
      }
    }

    REMARK.gCanvasEdit.style.cursor = "url('static/cursor/pen.png'),default";
  },
  gridClear() {
    this.gCanvasEditCxt.clearRect(
      0,
      0,
      this.gCanvasEdit.width,
      this.gCanvasEdit.height,
    );
    for (let j = 0; j < this.grid.height; j++) {
      for (let i = 0; i < this.grid.width; i++) {
        let index = j * this.grid.width + i;
        this.grid.data[index].markFlag = 0;
        this.grid.data[index].edgeFlag = 0;
        this.grid.data[index].edgeDirection = [0, 0, 0, 0, 0, 0, 0, 0];
      }
    }
  },

  gridResultReflash() {
    this.gCanvasEditCxt.strokeStyle = "red";
    this.gCanvasEditCxt.fillStyle = "#f15a5a";

    for (let j = 0; j < this.grid.height; j++) {
      for (let i = 0; i < this.grid.width; i++) {
        let index = j * this.grid.width + i;
        let indexUp = (j - 1) * this.grid.width + i;
        let indexDown = (j + 1) * this.grid.width + i;
        let indexLeft = j * this.grid.width + (i - 1);
        let indexRight = j * this.grid.width + (i + 1);
        let indexOne = (j - 1) * this.grid.width + i - 1;
        let indexTwo = (j - 1) * this.grid.width + i + 1;
        let indexThree = (j + 1) * this.grid.width + i + 1;
        let indexFour = (j + 1) * this.grid.width + i - 1;
        let lengthEdge = 1;
        let lengthDiagonal = 1.414;
        if (this.grid.data[index].markFlag > 0) {
          // this.gCanvasEditCxt.fillRect(this.grid.data[index].x, this.grid.data[index].y, 1, 1);
          //网格显示
          if (i % 5 == 0 && j % 5 == 0) {
            this.gCanvasEditCxt.fillRect(
              this.grid.data[index].x,
              this.grid.data[index].y,
              2,
              2,
            );
          }
          if (
            this.grid.data[index].edgeFlag > 0 &&
            this.grid.data[index].edgeFlag < 3
          ) {
            if (
              this.grid.data[index].edgeFlag < 3 &&
              this.grid.data[index].edgeDirection[0] == 0 &&
              this.grid.data[indexUp].edgeFlag > 0 &&
              this.grid.data[indexUp].edgeFlag < 3
            ) {
              this.gCanvasEditCxt.beginPath();
              this.gCanvasEditCxt.moveTo(
                this.grid.data[indexUp].x,
                this.grid.data[indexUp].y,
              );
              this.gCanvasEditCxt.lineTo(
                this.grid.data[index].x,
                this.grid.data[index].y,
              );
              this.gCanvasEditCxt.stroke();
              this.grid.data[index].edgeFlag += 1;
              this.grid.data[indexUp].edgeFlag += 1;
              this.grid.data[indexUp].edgeDirection[2] = 1;
            }
            if (
              this.grid.data[index].edgeFlag < 3 &&
              this.grid.data[index].edgeDirection[5] == 0 &&
              this.grid.data[indexTwo].edgeFlag > 0 &&
              this.grid.data[indexTwo].edgeFlag < 3
            ) {
              this.gCanvasEditCxt.beginPath();
              this.gCanvasEditCxt.moveTo(
                this.grid.data[indexTwo].x,
                this.grid.data[indexTwo].y,
              );
              this.gCanvasEditCxt.lineTo(
                this.grid.data[index].x,
                this.grid.data[index].y,
              );
              this.gCanvasEditCxt.stroke();
              this.grid.data[index].edgeFlag += 1;
              this.grid.data[indexTwo].edgeFlag += 1;
              this.grid.data[indexTwo].edgeDirection[7] = 1;
            }
            if (
              this.grid.data[index].edgeFlag < 3 &&
              this.grid.data[index].edgeDirection[1] == 0 &&
              this.grid.data[indexRight].edgeFlag > 0 &&
              this.grid.data[indexRight].edgeFlag < 3
            ) {
              this.gCanvasEditCxt.beginPath();
              this.gCanvasEditCxt.moveTo(
                this.grid.data[indexRight].x,
                this.grid.data[indexRight].y,
              );
              this.gCanvasEditCxt.lineTo(
                this.grid.data[index].x,
                this.grid.data[index].y,
              );
              this.gCanvasEditCxt.stroke();
              this.grid.data[index].edgeFlag += 1;
              this.grid.data[indexRight].edgeFlag += 1;
              this.grid.data[indexRight].edgeDirection[3] = 1;
            }
            if (
              this.grid.data[index].edgeFlag < 3 &&
              this.grid.data[index].edgeDirection[6] == 0 &&
              this.grid.data[indexThree].edgeFlag > 0 &&
              this.grid.data[indexThree].edgeFlag < 3
            ) {
              this.gCanvasEditCxt.beginPath();
              this.gCanvasEditCxt.moveTo(
                this.grid.data[indexThree].x,
                this.grid.data[indexThree].y,
              );
              this.gCanvasEditCxt.lineTo(
                this.grid.data[index].x,
                this.grid.data[index].y,
              );
              this.gCanvasEditCxt.stroke();
              this.grid.data[index].edgeFlag += 1;
              this.grid.data[indexThree].edgeFlag += 1;
              this.grid.data[indexThree].edgeDirection[4] = 1;
            }
            if (
              this.grid.data[index].edgeFlag < 3 &&
              this.grid.data[index].edgeDirection[2] == 0 &&
              this.grid.data[indexDown].edgeFlag > 0 &&
              this.grid.data[indexDown].edgeFlag < 3
            ) {
              this.gCanvasEditCxt.beginPath();
              this.gCanvasEditCxt.moveTo(
                this.grid.data[indexDown].x,
                this.grid.data[indexDown].y,
              );
              this.gCanvasEditCxt.lineTo(
                this.grid.data[index].x,
                this.grid.data[index].y,
              );
              this.gCanvasEditCxt.stroke();
              this.grid.data[index].edgeFlag += 1;
              this.grid.data[indexDown].edgeFlag += 1;
              this.grid.data[indexDown].edgeDirection[0] = 1;
            }
            if (
              this.grid.data[index].edgeFlag < 3 &&
              this.grid.data[index].edgeDirection[7] == 0 &&
              this.grid.data[indexFour].edgeFlag > 0 &&
              this.grid.data[indexFour].edgeFlag < 3
            ) {
              this.gCanvasEditCxt.beginPath();
              this.gCanvasEditCxt.moveTo(
                this.grid.data[indexFour].x,
                this.grid.data[indexFour].y,
              );
              this.gCanvasEditCxt.lineTo(
                this.grid.data[index].x,
                this.grid.data[index].y,
              );
              this.gCanvasEditCxt.stroke();
              this.grid.data[index].edgeFlag += 1;
              this.grid.data[indexFour].edgeFlag += 1;
              this.grid.data[indexFour].edgeDirection[0] = 1;
              this.grid.data[indexFour].edgeDirection[5] = 1;
            }
            if (
              this.grid.data[index].edgeFlag < 3 &&
              this.grid.data[index].edgeDirection[3] == 0 &&
              this.grid.data[indexLeft].edgeFlag > 0 &&
              this.grid.data[indexLeft].edgeFlag < 3
            ) {
              this.gCanvasEditCxt.beginPath();
              this.gCanvasEditCxt.moveTo(
                this.grid.data[indexLeft].x,
                this.grid.data[indexLeft].y,
              );
              this.gCanvasEditCxt.lineTo(
                this.grid.data[index].x,
                this.grid.data[index].y,
              );
              this.gCanvasEditCxt.stroke();
              this.grid.data[index].edgeFlag += 1;
              this.grid.data[indexLeft].edgeFlag += 1;
              this.grid.data[indexLeft].edgeDirection[1] = 1;
            }
            if (
              this.grid.data[index].edgeFlag < 3 &&
              this.grid.data[index].edgeDirection[4] == 0 &&
              this.grid.data[indexOne].edgeFlag > 0 &&
              this.grid.data[indexOne].edgeFlag < 3
            ) {
              this.gCanvasEditCxt.beginPath();
              this.gCanvasEditCxt.moveTo(
                this.grid.data[indexOne].x,
                this.grid.data[indexOne].y,
              );
              this.gCanvasEditCxt.lineTo(
                this.grid.data[index].x,
                this.grid.data[index].y,
              );
              this.gCanvasEditCxt.stroke();
              this.grid.data[index].edgeFlag += 1;
              this.grid.data[indexOne].edgeFlag += 1;
              this.grid.data[indexOne].edgeDirection[6] = 1;
            }
          }
        }
      }
    }
  },
  //得到直线上的点
  get_line_x(startX, startY, endX, endY, y) {
    if (endY == startY) {
      return startX;
    }
    return ((endX - startX) / (endY - startY)) * (y - startY) + startX;
  },
  get_line_y(startX, startY, endX, endY, x) {
    if (endX == startX) {
      return startY;
    }
    return ((endY - startY) / (endX - startX)) * (x - startX) + startY;
  },
  changePointIndex(index, pFlag) {
    for (let i = -3; i < 3; i++) {
      for (let j = -3; j < 3; j++) {
        this.grid.data[index + i * this.grid.width + j].markFlag = pFlag;
      }
    }
  },
  //改变直线上所有的点
  changePoint(startX, startY, endX, endY, pFlag) {
    if (Math.abs(endY - startY) > Math.abs(endX - startX)) {
      if (startY < endY) {
        for (let i = startY; i <= endY; i++) {
          let x = parseInt(this.get_line_x(startX, startY, endX, endY, i));
          let index = i * this.grid.width + x;
          this.changePointIndex(index, pFlag);
        }
      } else {
        for (let i = startY; i >= endY; i--) {
          let x = parseInt(this.get_line_x(startX, startY, endX, endY, i));
          let index = i * this.grid.width + x;
          this.changePointIndex(index, pFlag);
        }
      }
    } else {
      if (startX < endX) {
        for (let i = startX; i <= endX; i++) {
          let y = parseInt(this.get_line_y(startX, startY, endX, endY, i));
          let index = y * this.grid.width + i;
          this.changePointIndex(index, pFlag);
        }
      } else {
        for (let i = startX; i >= endX; i--) {
          let y = parseInt(this.get_line_y(startX, startY, endX, endY, i));
          let index = y * this.grid.width + i;
          this.changePointIndex(index, pFlag);
        }
      }
    }
  },
  // 修改区域
  gridChangeRange(pStartPoint, pEndPoint, pFlag) {
    // 剪裁区域
    let startX = parseInt(pStartPoint.x / this.grid.division);
    let endX = parseInt(pEndPoint.x / this.grid.division);
    let startY = parseInt(pStartPoint.y / this.grid.division);
    let endY = parseInt(pEndPoint.y / this.grid.division);
    this.changePoint(startX, startY, endX, endY, pFlag);
  },
  // 判断当前点在内部还是在外部
  checkPoint(pPoint) {
    let indexX = parseInt(pPoint.x / this.grid.division);
    let indexY = parseInt(pPoint.y / this.grid.division);
    // 判断当前点是否在边界附近
    if (
      6 * this.grid.division < indexX &&
      indexX < this.grid.width - 6 * this.grid.division &&
      6 * this.grid.division < indexY &&
      indexY < this.grid.height - 6 * this.grid.division
    ) {
      if (this.grid.data[indexY * this.grid.width + indexX].markFlag > 0)
        return 2;
      for (
        let j = indexY - 6 * this.grid.division;
        j < indexY + 6 * this.grid.division;
        j++
      ) {
        for (
          let i = indexX - 6 * this.grid.division;
          i < indexX + 6 * this.grid.division;
          i++
        ) {
          if (this.grid.data[j * this.grid.width + i].edgeFlag > 0) {
            return 3;
          }
        }
      }
    }
    return 1;
  },

  // 网格梯度刷新
  // 检测梯度
  getGridEdge() {
    for (let j = 1; j < this.grid.height - 1; j++) {
      for (let i = 1; i < this.grid.width - 1; i++) {
        // 填充空洞
        if (
          this.grid.data[(j - 1) * this.grid.width + i].markFlag == 1 &&
          this.grid.data[(j + 1) * this.grid.width + i].markFlag == 1 &&
          this.grid.data[j * this.grid.width + i - 1].markFlag == 1 &&
          this.grid.data[j * this.grid.width + i + 1].markFlag == 1
        ) {
          this.grid.data[j * this.grid.width + i].markFlag = 1;
        }
        if (
          this.grid.data[(j - 1) * this.grid.width + i].markFlag == 0 &&
          this.grid.data[(j + 1) * this.grid.width + i].markFlag == 0 &&
          this.grid.data[j * this.grid.width + i - 1].markFlag == 0 &&
          this.grid.data[j * this.grid.width + i + 1].markFlag == 0
        ) {
          this.grid.data[j * this.grid.width + i].markFlag = 0;
        }
        if (
          this.grid.data[(j - 1) * this.grid.width + i - 1].markFlag == 1 &&
          this.grid.data[(j + 1) * this.grid.width + i + 1].markFlag == 1 &&
          this.grid.data[(j + 1) * this.grid.width + i - 1].markFlag == 1 &&
          this.grid.data[(j - 1) * this.grid.width + i + 1].markFlag == 1
        ) {
          this.grid.data[j * this.grid.width + i].markFlag = 1;
        }
        if (
          this.grid.data[(j - 1) * this.grid.width + i - 1].markFlag == 0 &&
          this.grid.data[(j + 1) * this.grid.width + i + 1].markFlag == 0 &&
          this.grid.data[(j + 1) * this.grid.width + i - 1].markFlag == 0 &&
          this.grid.data[(j - 1) * this.grid.width + i + 1].markFlag == 0
        ) {
          this.grid.data[j * this.grid.width + i].markFlag = 0;
        }
        this.grid.data[j * this.grid.width + i].edgeFlag = 0;
        if (this.grid.data[j * this.grid.width + i].markFlag > 0) {
          if (
            Math.abs(
              this.grid.data[j * this.grid.width + i].markFlag * 4 -
                this.grid.data[j * this.grid.width + i - 1].markFlag -
                this.grid.data[j * this.grid.width + i + 1].markFlag -
                this.grid.data[(j - 1) * this.grid.width + i].markFlag -
                this.grid.data[(j + 1) * this.grid.width + i].markFlag,
            ) > 0
          ) {
            this.grid.data[j * this.grid.width + i].edgeFlag = 1;
          }
        }
      }
    }
  },

  // 变换，加载保存过的图像
  imageToGrid(imageData, imageWidth, imageHeight) {
    for (let j = 0; j < this.grid.height; j++) {
      for (let i = 0; i < this.grid.width; i++) {
        let imageIndex =
          this.grid.data[j * this.grid.width + i].imageY * imageWidth +
          this.grid.data[j * this.grid.width + i].imageX;
        if (
          imageData.data[imageIndex * 4 + 2] > 0 &&
          this.grid.data[j * this.grid.width + i].imageFlag > 0
        ) {
          this.grid.data[j * this.grid.width + i].markFlag = 1;
        }
      }
    }
  },
  // 逆变换，每次鼠标抬起的时候做，变换以后的结果用来计算显示所用的数值，
  gridToImage(imageWidth, imageHeight) {
    let imageData = new Array(imageHeight * imageWidth);
    for (let i = 0; i < imageHeight * imageWidth; i++) {
      imageData[i] = 0;
    }
    // 填充范围
    let addX = (this.grid.division / this.grid.scaleLevel.x) * 1.414;
    let addY = (this.grid.division / this.grid.scaleLevel.y) * 1.414;

    for (let j = 0; j < this.grid.height; j++) {
      for (let i = 0; i < this.grid.width; i++) {
        let index = j * this.grid.width + i;
        if (this.grid.data[index].markFlag > 0) {
          if (
            this.grid.data[index].imageFlag > 0 &&
            this.grid.data[index].markFlag > 0
          ) {
            let positionX = this.grid.data[index].imageX;
            let positionY = this.grid.data[index].imageY;
            for (let b = positionY; b <= positionY + addY; b++) {
              for (let a = positionX; a <= positionX + addX; a++) {
                if (b < this.grid.imageHeight && a < this.grid.imageWidth) {
                  imageData[b * imageWidth + a] = 255;
                }
              }
            }
          }
        }
      }
    }
    return imageData;
  },

  // 变换坐标系
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
    let imagePoint = { x: 0, y: 0 };
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
    canvasHeigt,
    imagePoint,
  ) {
    let canvasPoint = { x: 0, y: 0 };
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
    canvasPoint.y = tempY + trans.y + canvasHeigt / 2;

    return canvasPoint;
  },

  getEigthNB(width) {
    let eightNB = [];
    eightNB[0] = -width + 1;
    eightNB[1] = 1;
    eightNB[2] = width + 1;
    eightNB[3] = width;
    eightNB[4] = width - 1;
    eightNB[5] = -1;
    eightNB[6] = -width - 1;
    eightNB[7] = -width;
    return eightNB;
  },
  getFourNB(width) {
    let fourNB = [];
    fourNB[0] = 1;
    fourNB[1] = width;
    fourNB[2] = -1;
    fourNB[3] = -width;
    return fourNB;
  },

  editMouseDown(event) {
    event.preventDefault();
    event.stopPropagation();
    let res = REMARK.getCanvasPoint(event);
    REMARK.gMouseDownPoint = { x: res.x, y: res.y };
    // 有标签被选中的状态，编辑当前网格
    if (REMARK.fSelectedFlag == 1) {
      REMARK.drawFlag = REMARK.checkPoint(REMARK.gMouseDownPoint);
      REMARK.gCanvasEdit.style.cursor = "url('static/cursor/pen.png'),default";
    } else {
      // 使用当前画笔
      REMARK.fSelectedFlag = 1;
      REMARK.drawFlag = 1;
      REMARK.gCanvasEdit.style.cursor = "url('static/cursor/pen.png'),default";
    }
    REMARK.prePoint.x = REMARK.gMouseDownPoint.x + 1;
    REMARK.prePoint.y = REMARK.gMouseDownPoint.y + 1;
  },
  editMouseMove(event) {
    event.preventDefault();
    event.stopPropagation();
    let res = REMARK.getCanvasPoint(event);
    REMARK.gMouseCurrentPoint = {
      x: res.x,
      y: res.y,
    };
    REMARK.currentPoint.x = REMARK.gMouseCurrentPoint.x;
    REMARK.currentPoint.y = REMARK.gMouseCurrentPoint.y;

    if (REMARK.drawFlag == 0) {
      if (REMARK.checkPoint(REMARK.currentPoint) == 2) {
        REMARK.gCanvasEdit.style.cursor =
          "url('static/cursor/penadd.png'),default";
      } else if (REMARK.checkPoint(REMARK.currentPoint) == 3) {
        REMARK.gCanvasEdit.style.cursor =
          "url('static/cursor/penredu.png'),default";
      } else {
        REMARK.gCanvasEdit.style.cursor =
          "url('static/cursor/pen.png'),default";
      }
      return;
    } else {
      REMARK.gCanvasEditCxt.fillStyle = "#f15a5a";
      REMARK.gCanvasEditCxt.strokeStyle = "red";
      if (REMARK.drawFlag == 1) {
        REMARK.gCanvasEdit.style.cursor =
          "url('static/cursor/pen.png'),default";

        if (
          REMARK.gMouseCurrentPoint.x == REMARK.gMouseDownPoint.x &&
          REMARK.gMouseCurrentPoint.y == REMARK.gMouseDownPoint.y
        )
          return;

        if (
          Math.abs(REMARK.currentPoint.x - REMARK.prePoint.x) +
            Math.abs(REMARK.currentPoint.y - REMARK.prePoint.y) <
          4
        )
          return;
        if (
          (REMARK.currentPoint.x - REMARK.prePoint.x) *
            (REMARK.currentPoint.y - REMARK.gMouseDownPoint.y) -
            (REMARK.currentPoint.x - REMARK.gMouseDownPoint.x) *
              (REMARK.currentPoint.y - REMARK.prePoint.y) ==
          0
        )
          return;

        // 求最小外接矩形
        let Xmin = REMARK.grid.data[REMARK.grid.data.length - 1].x,
          Xmax = REMARK.grid.data[0].x,
          Ymin = REMARK.grid.data[REMARK.grid.data.length - 1].y,
          Ymax = REMARK.grid.data[0].y;
        let Xlist = [
          REMARK.gMouseDownPoint.x,
          REMARK.prePoint.x,
          REMARK.currentPoint.x,
        ];
        let Ylist = [
          REMARK.gMouseDownPoint.y,
          REMARK.prePoint.y,
          REMARK.currentPoint.y,
        ];
        for (let a = 0; a < 3; a++) {
          if (Xlist[a] > Xmax) Xmax = Xlist[a];
          if (Ylist[a] > Ymax) Ymax = Ylist[a];
          if (Xlist[a] < Xmin) Xmin = Xlist[a];
          if (Ylist[a] < Ymin) Ymin = Ylist[a];
        }
        let indexXLeft = Math.floor(Xmin / REMARK.grid.division);
        let indexXRight = Math.ceil(Xmax / REMARK.grid.division);
        let indexYUp = Math.floor(Ymin / REMARK.grid.division);
        let indexYDown = Math.ceil(Ymax / REMARK.grid.division);

        for (let j = indexYUp; j < indexYDown + 1; j++) {
          for (let i = indexXLeft; i < indexXRight + 1; i++) {
            // 判断点在三角形内部
            let gridPointX = REMARK.grid.data[j * REMARK.grid.width + i].x;
            let gridPointY = REMARK.grid.data[j * REMARK.grid.width + i].y;
            let MA = {
              x: 0,
              y: 0,
            };
            let MB = {
              x: 0,
              y: 0,
            };
            let MC = {
              x: 0,
              y: 0,
            };
            MA.x = REMARK.gMouseDownPoint.x - gridPointX;
            MA.y = REMARK.gMouseDownPoint.y - gridPointY;
            MB.x = REMARK.prePoint.x - gridPointX;
            MB.y = REMARK.prePoint.y - gridPointY;
            MC.x = REMARK.currentPoint.x - gridPointX;
            MC.y = REMARK.currentPoint.y - gridPointY;
            let MAMB = MA.x * MB.y - MA.y * MB.x;
            let MBMC = MB.x * MC.y - MB.y * MC.x;
            let MCMA = MC.x * MA.y - MC.y * MA.x;

            if (
              (MAMB > 0 && MBMC >= 0 && MCMA >= 0) ||
              (MAMB < 0 && MBMC <= 0 && MCMA <= 0)
            ) {
              // 内部点取反
              if (REMARK.grid.data[j * REMARK.grid.width + i].markFlag == 0) {
                REMARK.grid.data[j * REMARK.grid.width + i].markFlag = 1;
                // REMARK.gCanvasEditCxt.fillRect(REMARK.grid.data[j*REMARK.grid.width+i].x, REMARK.grid.data[j*REMARK.grid.width+i].y, 1 ,1);
                if (i % 5 == 0 && j % 5 == 0) {
                  REMARK.gCanvasEditCxt.fillRect(
                    REMARK.grid.data[j * REMARK.grid.width + i].x,
                    REMARK.grid.data[j * REMARK.grid.width + i].y,
                    2,
                    2,
                  );
                }
              } else {
                REMARK.grid.data[j * REMARK.grid.width + i].markFlag = 0;
                // REMARK.gCanvasEditCxt.clearRect(REMARK.grid.data[j*REMARK.grid.width+i].x, REMARK.grid.data[j*REMARK.grid.width+i].y, 1 ,1);
                if (i % 5 == 0 && j % 5 == 0) {
                  REMARK.gCanvasEditCxt.clearRect(
                    REMARK.grid.data[j * REMARK.grid.width + i].x,
                    REMARK.grid.data[j * REMARK.grid.width + i].y,
                    2,
                    2,
                  );
                }
              }
            }
          }
        }

        // 连接两次绘制的点
        REMARK.gCanvasEditCxt.beginPath();
        REMARK.gCanvasEditCxt.moveTo(REMARK.prePoint.x, REMARK.prePoint.y);
        REMARK.gCanvasEditCxt.lineTo(
          REMARK.currentPoint.x,
          REMARK.currentPoint.y,
        );
        REMARK.gCanvasEditCxt.stroke();
        REMARK.prePoint.x = REMARK.currentPoint.x;
        REMARK.prePoint.y = REMARK.currentPoint.y;
      }
      // 增加区域
      else if (REMARK.drawFlag == 2) {
        REMARK.gCanvasEdit.style.cursor =
          "url('static/cursor/penadd.png'),default";
        if (
          Math.abs(REMARK.currentPoint.x - REMARK.prePoint.x) +
            Math.abs(REMARK.currentPoint.y - REMARK.prePoint.y) <
          1
        )
          return;

        REMARK.gridChangeRange(REMARK.prePoint, REMARK.currentPoint, 1);
        // 检测梯度
        REMARK.getGridEdge();
        // 清除canvas
        REMARK.gCanvasEditCxt.clearRect(
          0,
          0,
          REMARK.gCanvasEdit.width,
          REMARK.gCanvasEdit.height,
        );
        // 刷新结果
        REMARK.gridResultReflash();

        REMARK.prePoint.x = REMARK.currentPoint.x;
        REMARK.prePoint.y = REMARK.currentPoint.y;
      }
      // 减少区域
      else if (REMARK.drawFlag == 3) {
        REMARK.gCanvasEdit.style.cursor =
          "url('static/cursor/penredu.png'),default";

        if (
          Math.abs(REMARK.currentPoint.x - REMARK.prePoint.x) +
            Math.abs(REMARK.currentPoint.y - REMARK.prePoint.y) <
          1
        )
          return;

        REMARK.gridChangeRange(REMARK.prePoint, REMARK.currentPoint, 0);

        // 检测梯度
        REMARK.getGridEdge();
        // 清除canvas
        REMARK.gCanvasEditCxt.clearRect(
          0,
          0,
          REMARK.gCanvasEdit.width,
          REMARK.gCanvasEdit.height,
        );
        // 刷新结果
        REMARK.gridResultReflash();
        REMARK.prePoint.x = REMARK.currentPoint.x;
        REMARK.prePoint.y = REMARK.currentPoint.y;
      }
    }
  },
  editMouseUp(event) {
    event.preventDefault();
    event.stopPropagation();
    if (event.button == 2) return;
    if (REMARK.fSelectedFlag == 0) {
      return;
    }
    let res = REMARK.getCanvasPoint(event);
    REMARK.gMouseUpPoint = {
      x: res.x,
      y: res.y,
    };
    REMARK.drawFlag = 0;
    // 检测梯度
    REMARK.getGridEdge();
    // 清除canvas
    REMARK.gCanvasEditCxt.clearRect(
      0,
      0,
      REMARK.gCanvasEdit.width,
      REMARK.gCanvasEdit.height,
    );
    // 刷新结果
    REMARK.gridResultReflash();
    if (
      Math.abs(REMARK.gMouseDownPoint.x - REMARK.gMouseUpPoint.x) < 2 &&
      Math.abs(REMARK.gMouseDownPoint.y - REMARK.gMouseUpPoint.y) < 2
    ) {
      REMARK.markResult = REMARK.gridToImage(
        REMARK.grid.imageWidth,
        REMARK.grid.imageHeight,
      );
      REMARK.fSelectedFlag = 0;
      if (REMARK.markResult.length > 0) {
        let message = SERVER.messageHeader + "UDW2C" + "CutIn";
        let message2 = "";
        let pointNum = 0;
        for (let i = 0; i < SERVER.currentImgSrc.height; i++) {
          for (let j = 0; j < SERVER.currentImgSrc.width; j++) {
            if (REMARK.markResult[i * SERVER.currentImgSrc.width + j] > 0) {
              message2 += SERVER.int32ToStr(j);
              message2 += SERVER.int32ToStr(i);
              pointNum += 1;
            }
          }
        }
        if (pointNum != 0) {
          message = message + SERVER.int16ToStr(pointNum) + message2;
          // SERVER.sendBin(message);
        }
      }
      REMARK.gridClear();
    }
    REMARK.gMouseDownPoint = { x: 0, y: 0 };
    REMARK.gMouseCurrentPoint = { x: 0, y: 0 };
    REMARK.prePoint = { x: 0, y: 0 };
    REMARK.currentPoint = { x: 0, y: 0 };
  },
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
  addEditMouseEvent(canvas) {
    this.canvas = canvas;
    if ($IsPC) {
      canvas.addEventListener("mousedown", this.editMouseDown);
      canvas.addEventListener("mousemove", this.editMouseMove);
      canvas.addEventListener("mouseup", this.editMouseUp);
      canvas.addEventListener("mouseleave", this.editMouseUp);
    } else {
      canvas.addEventListener("touchstart", this.editMouseDown);
      canvas.addEventListener("touchmove", this.editMouseMove);
      canvas.addEventListener("touchend", this.editMouseUp);
    }
  },
  removeEditMouseEvent(canvas) {
    if ($IsPC) {
      canvas.removeEventListener("mousedown", this.editMouseDown);
      canvas.removeEventListener("mousemove", this.editMouseMove);
      canvas.removeEventListener("mouseup", this.editMouseUp);
      canvas.removeEventListener("mouseleave", this.editMouseUp);
    } else {
      canvas.removeEventListener("touchstart", this.editMouseDown);
      canvas.removeEventListener("touchmove", this.editMouseMove);
      canvas.removeEventListener("touchend", this.editMouseUp);
    }
    canvas.style.cursor = "";
  },
};

export default REMARK;
