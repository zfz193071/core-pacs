import CROSS from "./crosshair.js";
import { getRenderer } from "./rendererManager";
import {
  getRotationAxisAndAngle,
  rotateVectorAroundAxis,
  screenToWorld,
} from "./utils.js";
let ACTIVEOPT = {
  //调窗
  Window(that) {
    // if (that.imageData.isVR) {
    //   let cy = that.optCurrentPoint.y - that.optStartPoint.y;
    //   let cx = that.optCurrentPoint.x - that.optStartPoint.x;
    //   const xFactor = 260 / that.canvasSize.width; // 260是pwWidget的宽度
    //   const yFactor = 140 / that.canvasSize.height;
    //   that.$store.state.VRTrans.x = 130 + cx * xFactor;
    //   that.$store.state.VRTrans.y = 70 + cy * yFactor;
    //   that.$store.state.VRTrans.xFactor = xFactor;
    //   that.$store.state.VRTrans.yFactor = yFactor;
    //   console.log(that.$store.state.VRTrans, "window");
    //   that.$store.state.VRTrans = { ...that.$store.state.VRTrans };
    // }
    let isFloat = false;
    let isPT = that.seriesInfo.model === "PT";
    let temp = {
      ww: that.imageData.ww,
      wl: that.imageData.wl,
    };
    let currentWW = that.seriesInfo.ww;

    if (temp.ww % 1 !== 0 || temp.wl % 1 !== 0) {
      isFloat = true;
    }

    temp = this.WindowChage(that, temp, currentWW, isFloat, isPT);
    let imageData = { ...that.imageData, defaultFlag: false };
    if (that.seriesInfo.model === "MR") {
      for (const imageData of that.imageDatas) {
        imageData.defaultFlag = false;
      }
    }
    imageData.ww = temp.ww;
    imageData.wl = temp.wl;

    return imageData;
  },
  WindowChage(that, temp, currentWW, isFloat, isPT) {
    let cy = that.optCurrentPoint.y - that.optStartPoint.y;
    let cx = that.optCurrentPoint.x - that.optStartPoint.x;

    let stepL = parseFloat(
      (cy / that.canvasSize.height) * Math.abs(temp.wl) * 2,
    );
    if (Math.abs(cy) > 0 && Math.abs(stepL) < 1) {
      stepL = (cy / Math.abs(cy)) * 3;
    }
    let l = parseFloat(temp.wl + stepL);
    let w = parseFloat(temp.ww + (cx / that.canvasSize.width) * temp.ww * 2);

    if (l == temp.wl && Math.abs(cy) > 0) {
      l += cy / Math.abs(cy);
    }
    if (w == temp.ww && Math.abs(cx) > 0) {
      w -= cx / Math.abs(cx);
    }
    if (isFloat) {
      temp.ww = w;
      temp.wl = l;
    } else {
      temp.ww = Math.round(w);
      temp.wl = Math.round(l);
    }

    if (temp.ww < 0) {
      temp.ww = currentWW / 10000;
    } else if (temp.ww > 200000) {
      temp.ww = 200000;
    }

    if (temp.wl > 100000) {
      temp.wl = 100000;
    } else if (temp.wl < -100000) {
      temp.wl = -100000;
    }
    if (isPT) {
      temp.wl = temp.ww / 2;
    }
    that.optStartPoint.x = that.optCurrentPoint.x;
    that.optStartPoint.y = that.optCurrentPoint.y;
    return temp;
  },
  //平移
  Pan(that) {
    let imageData = { ...that.imageData };

    const existStartP = Object.keys(that.optStartPoint).length === 2;
    const existCurrP = Object.keys(that.optCurrentPoint).length === 2;
    if (!existStartP || !existCurrP) return imageData;
    if (imageData.dataWithInfo && imageData.dataWithInfo.isFromVTKClip) {
      //这个平移加在窗口上就可以了
      let scale = imageData.scale;
      let pixelSpacingNow = scale.baseSpacing / scale.baseFactor;
      let dis = {
        x: (that.optCurrentPoint.x - that.optStartPoint.x) * pixelSpacingNow,
        y: (that.optCurrentPoint.y - that.optStartPoint.y) * pixelSpacingNow,
      };
      that.$store.state.MPRTrans[imageData.curViewMod].x -= dis.x;
      that.$store.state.MPRTrans[imageData.curViewMod].y -= dis.y;
      console.log(
        "平移",
        JSON.stringify(that.$store.state.MPRTrans[imageData.curViewMod]),
      );
    } else {
      imageData.translate.x += that.optCurrentPoint.x - that.optStartPoint.x;
      imageData.translate.y += that.optCurrentPoint.y - that.optStartPoint.y;
    }

    return imageData;
  },
  //缩放
  Zoom(that) {
    let imageData = { ...that.imageData };

    const existStartP = Object.keys(that.optStartPoint).length === 2;
    const existCurrP = Object.keys(that.optCurrentPoint).length === 2;
    if (!existStartP || !existCurrP) return imageData;

    let factor = Math.exp(
      (that.optCurrentPoint.y - that.optStartPoint.y) * Math.log(1.005),
    );
    imageData.scale.y = imageData.scale.y * factor;
    imageData.scale.x = imageData.scale.x * factor;
    imageData.scale.baseFactor = imageData.scale.baseFactor * factor;
    that.optStartPoint.x = that.optCurrentPoint.x;
    that.optStartPoint.y = that.optCurrentPoint.y;
    return imageData;
  },
  //旋转
  Rotate(that) {
    let imageData = { ...that.imageData };
    if (imageData.isInMPR) return;

    const existStartP = Object.keys(that.optStartPoint).length === 2;
    const existCurrP = Object.keys(that.optCurrentPoint).length === 2;
    if (!existStartP || !existCurrP) return imageData;

    let { translate, rotate, scale, img, isVR } = imageData;
    if (isVR) {
      let dsAzimuth = that.optStartPoint.x - that.optCurrentPoint.x;
      let dsElevation = that.optCurrentPoint.y - that.optStartPoint.y;
      let cameraViewObj = { azimuth: 0, elevation: 0 };
      if (imageData.cameraView) {
        cameraViewObj = { ...imageData.cameraView };
      }
      cameraViewObj.azimuth = cameraViewObj.azimuth + dsAzimuth;
      cameraViewObj.elevation = cameraViewObj.elevation + dsElevation;
      imageData.cameraView = cameraViewObj;
    } else {
      var tempPoint1 = that.$coordinateCanvasToImage(
        translate,
        rotate,
        scale,
        img.width,
        img.height,
        that.canvasSize.width,
        that.canvasSize.height,
        that.optStartPoint,
      );
      var tempPoint2 = that.$coordinateCanvasToImage(
        translate,
        rotate,
        scale,
        img.width,
        img.height,
        that.canvasSize.width,
        that.canvasSize.height,
        that.optCurrentPoint,
      );
      var center = { x: img.width / 2, y: img.height / 2 };
      var angle2 = Math.atan2(tempPoint2.x - center.x, tempPoint2.y - center.y);
      var angle1 = Math.atan2(tempPoint1.x - center.x, tempPoint1.y - center.y);
      if (scale.x * scale.y < 0) {
        imageData.rotate += angle2 - angle1;
      } else {
        imageData.rotate += angle1 - angle2;
      }
    }

    return imageData;
  },
  //放大镜
  Magnify(that) {
    let imageData = { ...that.imageData };
    imageData.magnifyPoint.x = that.optCurrentPoint.x;
    imageData.magnifyPoint.y = that.optCurrentPoint.y;
    return imageData;
  },
  //翻页
  Page(that) {
    var cy = that.optCurrentPoint.y - that.optStartPoint.y;
    let num = 1;
    let { imageNum } = that.imageData;
    if (imageNum != undefined) {
      num = 1 + Math.floor(imageNum / 100);
    }
    if (cy < 0) {
      num = -num;
    }
    this.scrollHandle(that.currViewport, num);
  },
  //初始化或者更新cvp下AcrossPoint,不需要更新curImageNum
  ACross(that, point) {
    const cvp = that.currViewport;
    let canvasNow = cvp.canvasNow;
    let canvasSize = cvp.canvasSize[canvasNow];
    let imageData = cvp.imageDatas[canvasNow];
    let { translate, rotate, scale, crossPos, dataWithInfo } = imageData;
    let result = { ...crossPos };
    let { width: imageWidth, height: imageHeight } = dataWithInfo.origBuf;
    //如果传了point，说明是点击更新十字定位

    let result2D;
    if (!point) {
      //point不存在，为初始化十字定位
      result2D = imageData.crossPos;
      if (!result2D) {
        result2D = {
          x: Math.round(imageWidth / 2),
          y: Math.round(imageHeight / 2),
        };
      }
      //把当前的结果更新到全局的十字位置上
    } else {
      result2D = that.$coordinateCanvasToImage(
        translate,
        rotate,
        scale,
        imageWidth,
        imageHeight,
        canvasSize.width,
        canvasSize.height,
        point,
      );
    }
    result = { ...result, ...result2D };
    cvp.AcrossPoint = CROSS.asyncAcrossPoint(
      imageData,
      result,
      cvp.AcrossPoint,
    );
    let seriesInfo = cvp.seriesInfos[canvasNow];
    let newImageData = CROSS.asyncImageData(
      imageData,
      cvp.AcrossPoint,
      seriesInfo,
    );
    cvp.imageDatas.splice(canvasNow, 1, newImageData);
  },
  updateOtherImageDatas(cvp, canvasNow) {
    function updateSingleImageData(imageData, i) {
      let { crossPos } = imageData;
      cvp.AcrossPoint = CROSS.asyncAcrossPoint(
        imageData,
        crossPos,
        cvp.AcrossPoint,
      );
      let seriesInfo = cvp.seriesInfos[i];
      let newImageData = CROSS.asyncImageData(
        imageData,
        cvp.AcrossPoint,
        seriesInfo,
      );
      cvp.imageDatas.splice(i, 1, newImageData);
    }
    cvp.imageDatas.forEach((imageData, i) => {
      if (i !== canvasNow) {
        updateSingleImageData(imageData, i);
      }
    });
  },
  /**
   * 旋转十字设置全局的十字角度,不需要更新curImageNum
   * 依据拖拽起止点，计算世界坐标系下的旋转并应用于对应的 MPR 平面。
   * @param {Object} ctx - 上下文，通常为 this，包含 currViewport、updateOtherImageDatas 等。
   * @param {Object} end - 拖拽终点，{x, y}，canvas 坐标。
   * @param {Object} start - 拖拽起点，{x, y}，canvas 坐标。
   */
  RCross(ctx, end, start) {
    const cvp = ctx.currViewport;
    const canvasNow = cvp.canvasNow;
    const canvasSize = cvp.canvasSize[canvasNow];
    const { width: canvasWidth, height: canvasHeight } = canvasSize;
    const imageData = cvp.imageDatas[canvasNow];
    const { crossPos, curViewMod } = imageData;
    const AcrossPoint = cvp.AcrossPoint;
    const planes = AcrossPoint.planes;
    AcrossPoint.isPlaneRotated = true;

    const worldCenter = [AcrossPoint.x, AcrossPoint.y, AcrossPoint.z];
    const renderer = getRenderer(curViewMod);

    // 1. 计算拖拽起止点的世界坐标
    const worldStart = screenToWorld(
      start,
      renderer,
      canvasWidth,
      canvasHeight,
      worldCenter,
    );
    const worldEnd = screenToWorld(
      end,
      renderer,
      canvasWidth,
      canvasHeight,
      worldCenter,
    );

    // 2. 计算旋转轴和角度
    const { axis, angle } = getRotationAxisAndAngle(
      worldCenter,
      worldStart,
      worldEnd,
    );
    if (!axis || isNaN(angle) || Math.abs(angle) < 1e-6) return; // 不做旋转

    // 3. 执行旋转
    const currentPlaneName = CROSS.currentRotatePlaneName || planes[0].name;
    const currentPlane = planes.find((p) => p.name === currentPlaneName);

    if (CROSS.isOrthogonalRotation) {
      // 正交联动旋转
      const orthogonalPlane = planes.find(
        (a) =>
          a.name !== CROSS.currentUnRotatePlaneName &&
          a.name !== currentPlaneName,
      );
      this.rotatePlane(currentPlane, axis, angle);
      if (orthogonalPlane) {
        this.rotatePlane(orthogonalPlane, axis, angle);
      }
    } else {
      this.rotatePlane(currentPlane, axis, angle);
    }

    // 4. 刷新交叉点、数据同步及窗口数据
    cvp.AcrossPoint = CROSS.asyncAcrossPoint(
      imageData,
      crossPos,
      cvp.AcrossPoint,
    );
    const seriesInfo = cvp.seriesInfos[canvasNow];
    const newImageData = CROSS.asyncImageData(
      imageData,
      cvp.AcrossPoint,
      seriesInfo,
    );
    cvp.imageDatas.splice(canvasNow, 1, newImageData);
    this.updateOtherImageDatas(cvp, canvasNow);
  },

  /**
   * 对一个平面法向量和viewUp做旋转
   * @param {Object} plane - 平面对象，含 normal, viewUp
   * @param {number[]} axis - 旋转轴 [x, y, z]
   * @param {number} angle - 旋转角度（弧度）
   */
  rotatePlane(plane, axis, angle) {
    const newNormal = rotateVectorAroundAxis(plane.normal, axis, angle);
    plane.normal[0] = newNormal[0];
    plane.normal[1] = newNormal[1];
    plane.normal[2] = newNormal[2];

    const newViewUp = rotateVectorAroundAxis(plane.viewUp, axis, angle);
    plane.viewUp[0] = newViewUp[0];
    plane.viewUp[1] = newViewUp[1];
    plane.viewUp[2] = newViewUp[2];
  },

  //设置十字的层厚,不需要更新curImageNum
  TCross(that, end, start, startFindOptResult) {
    let cvp = that.currViewport;
    let canvasNow = cvp.canvasNow;
    let imageData = cvp.imageDatas[canvasNow];
    let { crossPos, scale, dataWithInfo } = imageData;
    if (!crossPos) return;
    let { pixelSpacingW, pixelSpacingH } = dataWithInfo;

    // 新增逻辑：取出 axes, axisPoint, start, offset
    let { imatrix, curThickAxes, axisPoint, offset } = startFindOptResult;
    // end 需要用 imatrix 去旋转到画布坐标
    let endCanvas = CROSS.screenToCanvas(end, imatrix);
    let startCanvas = CROSS.screenToCanvas(start, imatrix);

    // 1. 计算基准线的方向向量和法向量
    const { x1, y1, x2, y2 } = axisPoint;
    let dx = x2 - x1;
    let dy = y2 - y1;
    let len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1e-6) return;
    let ux = dx / len,
      uy = dy / len;
    let nx = -uy,
      ny = ux; // 法向量（垂直于基准线）

    // 2. 鼠标拖动向量
    let vx = endCanvas.x - startCanvas.x;
    let vy = endCanvas.y - startCanvas.y;

    // 3. 拖动在法向上的投影
    let proj = vx * nx + vy * ny;

    // 4. offset 叠加
    let newThickOnCanvas;
    if (typeof offset === "number") {
      newThickOnCanvas = Math.abs(offset + proj);
    } else {
      newThickOnCanvas = Math.abs(proj);
    }

    // 5. 根据 axes 选择物理单位转换因子
    let factor = 1;
    if (curThickAxes === "x") {
      factor = pixelSpacingH / scale.y;
    } else if (curThickAxes === "y") {
      factor = pixelSpacingW / scale.x;
    }

    let newThick = Math.round(2 * newThickOnCanvas * factor); // 2倍是厚度为全宽
    // 最小值处理
    if (newThick < 1) newThick = 0;

    // 6. 写入 crossPos
    let thickAxes = curThickAxes === "x" ? "mprThickX" : "mprThickY";
    crossPos[thickAxes] = newThick;

    // 7. 更新全局十字/图像刷新
    cvp.AcrossPoint = CROSS.asyncAcrossPoint(
      imageData,
      crossPos,
      cvp.AcrossPoint,
    );
    let seriesInfo = cvp.seriesInfos[canvasNow];
    let newImageData = CROSS.asyncImageData(
      imageData,
      cvp.AcrossPoint,
      seriesInfo,
    );
    cvp.imageDatas.splice(canvasNow, 1, newImageData);
  },

  // TCross(that, end, start, startFindOptResult) {
  //   let cvp = that.currViewport;
  //   let canvasNow = cvp.canvasNow;
  //   let imageData = cvp.imageDatas[canvasNow];
  //   let { crossPos, scale, dataWithInfo } = imageData;
  //   if (!crossPos) return;
  //   let { pixelSpacingW, pixelSpacingH } = dataWithInfo;

  //   let { imatrix, curThickAxes } = startFindOptResult;
  //   let endOnCanvas = CROSS.screenToCanvas(end, imatrix);
  //   let newThickOnCanvas,
  //     thickAxes,
  //     factor = 1;
  //   if (curThickAxes === "x") {
  //     newThickOnCanvas = Math.abs(endOnCanvas.y) * 2;
  //     factor = pixelSpacingH / scale.y;
  //     thickAxes = "mprThickX";
  //   } else {
  //     newThickOnCanvas = Math.abs(endOnCanvas.x) * 2;
  //     thickAxes = "mprThickY";
  //     factor = pixelSpacingW / scale.x;
  //   }
  //   if (newThickOnCanvas < 1) {
  //     newThickOnCanvas = 0;
  //   }
  //   let newThick = Math.round(newThickOnCanvas * factor); //物理世界的层厚，单位为mm
  //   crossPos[thickAxes] = newThick;
  //   //把当前的结果更新到全局的十字位置上
  //   cvp.AcrossPoint = CROSS.asyncAcrossPoint(
  //     imageData,
  //     crossPos,
  //     cvp.AcrossPoint,
  //   );
  //   //更新当前窗口的imagedata的DWIUID，触发刷新
  //   let seriesInfo = cvp.seriesInfos[canvasNow];
  //   let newImageData = CROSS.asyncImageData(
  //     imageData,
  //     cvp.AcrossPoint,
  //     seriesInfo,
  //   );
  //   cvp.imageDatas.splice(canvasNow, 1, newImageData);
  // },

  //所有的翻页都要进这个函数
  scrollHandle(currViewport, num, scrollBack = true) {
    //所有翻页都改为强制不回滚，2025年6月接一脉辽宁中心需求
    // 2025年6月，再接南昌中心需求，改为配置
    const otherShortcutKey = JSON.parse(
      localStorage.getItem("otherShortcutKey"),
    );
    if (otherShortcutKey.isRollback === "no") scrollBack = false;
    console.log("go into page", num);
    //翻页必须要一个确切的数字，上翻为负值，或者下翻为正值
    if (isNaN(num)) return;
    let cvp = currViewport;
    let canvasNow = cvp.canvasNow;
    let imageData = { ...cvp.imageDatas[canvasNow] };
    let seriesInfo = cvp.seriesInfos[canvasNow];
    let curAP = cvp.AcrossPoint;

    //VR不触发翻页
    if (imageData.isVR) return;

    //翻页都是在上一次操作的基础上进行的，需要先存在dataWithInfo
    if (!imageData.dataWithInfo) {
      return;
    }

    //普通的翻页，不会旋转十字，不计算volumedata
    let newCrossPos = { ...imageData.crossPos };
    if (!imageData.dataWithInfo.isFromVTKClip) {
      //需要回滚
      let newIndex = this.scrollToIndex(imageData, seriesInfo, num, scrollBack);
      if (!isNaN(newIndex)) {
        //均匀数据，直接同步十字
        if (!seriesInfo.isNotUniformSquence) {
          newCrossPos.index = newIndex;
          let dp = seriesInfo.volumeSpacing[imageData.curViewMod].d;
          let forceDisZ = dp * (newIndex - imageData.curImageNum);
          cvp.AcrossPoint = CROSS.asyncAcrossPoint(
            imageData,
            newCrossPos,
            curAP,
            forceDisZ,
          );
        } else {
          //保持十字和当前图像的相对位置不变
          cvp.AcrossPoint = CROSS.keepAcrossPoint(
            seriesInfo,
            newCrossPos,
            newIndex,
            curAP,
          );
        }
        imageData.curImageNum = newIndex;
        imageData.DWIUID = CROSS.encodeDWIUID(
          cvp.AcrossPoint,
          imageData.curViewMod,
          seriesInfo.currentSID,
          newIndex,
        );
      }
    } else {
      //能进入这里的一定是均匀数据，MPR的翻页
      //把翻页的结果更新到全局的十字位置上,不用考虑回滚
      let dp = seriesInfo.volumeSpacing[imageData.curViewMod].thickness;

      //这里的翻页不会折回，所以可以直接加上
      let forceDisZ = dp * num;
      cvp.AcrossPoint = CROSS.asyncAcrossPoint(
        imageData,
        newCrossPos,
        curAP,
        forceDisZ,
      );
      imageData = CROSS.asyncImageData(imageData, cvp.AcrossPoint, seriesInfo);
    }

    //更新当前窗口的imagedata，触发刷新
    cvp.imageDatas.splice(canvasNow, 1, imageData);
  },

  scrollToIndex(imageData, seriesInfo, num, ifScrollBack) {
    let { curViewMod, curImageNum, imageNum } = imageData;
    if (isNaN(curImageNum)) return undefined;
    let newIndex;
    if (seriesInfo.isNotUniformSquence) {
      newIndex = curImageNum + num;
    } else {
      let { d: dp, thickness } = seriesInfo.volumeSpacing[curViewMod];
      //BuDing20250606，接南昌中心需求，翻转的数据进MPR之前需保持原来的页码
      // if (seriesInfo.ifRevers && curViewMod === seriesInfo.initViewMod) {
      //   num = -num;
      // }
      let dimStep = Number((thickness / dp).toFixed(2));
      newIndex = curImageNum + num * dimStep;
    }

    if (ifScrollBack) {
      if (newIndex < 0) newIndex = imageNum + newIndex;
      if (newIndex > imageNum - 1) newIndex = newIndex - imageNum;
    } else {
      if (newIndex < 0) newIndex = 0;
      if (newIndex > imageNum - 1) newIndex = imageNum - 1;
    }
    return newIndex;
  },

  getAngle(vecA, vecB) {
    let angle = Math.atan2(vecB[1], vecB[0]) - Math.atan2(vecA[1], vecA[0]);
    return angle;
  },
  //同一数据张数的对应
  point2num(that, target, curViewMod1, curViewMod3, point, indexs) {
    let seriesInfo = that.seriesInfos[target];
    let imageNum = seriesInfo.volumeSize[curViewMod3].d;

    let { x, y } = point;
    let index = -1;
    if (curViewMod1 === curViewMod3) {
      return {
        index: indexs,
        x,
        y,
      };
    }
    switch (curViewMod3) {
      case 0: {
        y = y > imageNum - 1 || y < 0 ? -1 : y;
        index = y;
        if (curViewMod1 === 1) {
          y = indexs;
        } else if (curViewMod1 === 2) {
          y = x;
          x = indexs;
        }
        break;
      }
      case 1: {
        if (curViewMod1 === 0) {
          y = y > imageNum - 1 || y < 0 ? -1 : y;
          index = y;
          y = indexs;
        } else if (curViewMod1 === 2) {
          x = x > imageNum - 1 || x < 0 ? -1 : x;
          index = x;
          x = indexs;
        }
        break;
      }
      case 2: {
        x = x > imageNum - 1 || x < 0 ? -1 : x;
        index = x;
        if (curViewMod1 === 0) {
          x = y;
          y = indexs;
        } else if (curViewMod1 === 1) {
          x = indexs;
        }
        break;
      }
    }
    return { index, x, y };
  },
};

export default ACTIVEOPT;
