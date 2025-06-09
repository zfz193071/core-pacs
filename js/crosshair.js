import { mat4, vec3, vec4 } from "gl-matrix";
const colorS = "#3470d8";
const colorC = "#cd9700";
const colorT = "#8a00da";
const colorMip = "#c624c6";
const crossCD = 5;
const crossLL = 3000;
const findRange = 10;
const lineColors = {
  "transverse-xy": colorT,
  "coronal-xz": colorC,
  "sagittal-yz": colorS,
};
window.isOrthogonalRotation = true;
const CROSS = {
  dicAll: ["rotateT", "rotateC", "rotateS", "thickT", "thickC", "thickS"],
  dicForAngle: ["rotateT", "rotateC", "rotateS"],
  dicForThick: [
    { mprThickX: "thickC", mprThickY: "thickS" },
    { mprThickX: "thickT", mprThickY: "thickS" },
    { mprThickX: "thickT", mprThickY: "thickC" },
  ],
  curThicknessDic: ["thickT", "thickC", "thickS"],
  positionLine: {
    // 十字定位线的颜色和样式
    curViewMod0: {
      colorX: colorC,
      colorY: colorS,
    },
    curViewMod1: {
      colorX: colorT,
      colorY: colorS,
    },
    curViewMod2: {
      colorX: colorT,
      colorY: colorC,
    },
  },
  planes: [
    {
      name: "transverse-xy",
      normal: [0, 0, -1],
      viewUp: [0, 1, 0],
    },
    {
      name: "coronal-xz",
      normal: [0, 1, 0],
      viewUp: [0, 0, -1],
    },
    {
      name: "sagittal-yz",
      normal: [1, 0, 0],
      viewUp: [0, 0, -1],
    },
  ],
  getMarkButtonColor(curViewMod) {
    let dic = [colorT, colorC, colorS];
    return dic[curViewMod];
  },
  initPlanes(seriesInfo) {
    let planes = JSON.parse(JSON.stringify(CROSS.planes));
    //ssy 0608 mpr 坐标换算: 在这里把三个视图摆正了，用于解决部分磁共振数据初始带角度的情况
    if (!seriesInfo.isNotUniformSquence) {
      let volumeOrientation = seriesInfo.volumeOrientation;
      planes[0].normal = JSON.parse(JSON.stringify(volumeOrientation[0][2]));
      planes[0].viewUp = JSON.parse(JSON.stringify(volumeOrientation[0][1]));
      planes[1].normal = JSON.parse(JSON.stringify(volumeOrientation[1][2]));
      planes[1].viewUp = JSON.parse(JSON.stringify(volumeOrientation[1][1]));
      planes[2].normal = JSON.parse(JSON.stringify(volumeOrientation[2][2]));
      planes[2].viewUp = JSON.parse(JSON.stringify(volumeOrientation[2][1]));
    }
    return planes;
  },

  //只有均匀的数据走这个函数
  //这个函数在平移十字，旋转十字，翻页，调节层厚的时候被调用
  //其中newCrossPos中包含了新的十字在图像上的信息，主要是x,y,r,mprThickX,mprThickY
  //这里得到的十字中心点永远是世界坐标系上的点
  //forceDisZ是强制的z轴的位移,是以毫米为单位的世界坐标
  asyncAcrossPoint(imageData, newCrossPos, AcrossPoint, forceDisZ = null) {
    //参数不合法
    if (
      newCrossPos == undefined ||
      newCrossPos.x == undefined ||
      newCrossPos.y == undefined
    ) {
      return { ...AcrossPoint };
    }

    //参数不合法
    let { curViewMod, dataWithInfo } = imageData;
    if (!dataWithInfo) {
      return { ...AcrossPoint };
    }

    //参数不合法
    let { pixelSpacingH, pixelSpacingW, imgorient } = dataWithInfo;
    let curCrossPos = this.getCrossPosOnImg(imageData, AcrossPoint);
    if (!curCrossPos) return { ...AcrossPoint };

    let forceDisX = 0,
      forceDisY = 0;

    forceDisX = (newCrossPos.x - curCrossPos.x) * pixelSpacingW;
    forceDisY = (newCrossPos.y - curCrossPos.y) * pixelSpacingH;
    forceDisZ = forceDisZ || 0;
    //用orientation来计算偏移量
    let res = { ...AcrossPoint };
    let eW = imgorient[0],
      eH = imgorient[1],
      eD = imgorient[2];
    let dic = ["x", "y", "z"];
    for (let i = 0; i < 3; i++) {
      res[dic[i]] =
        res[dic[i]] + eW[i] * forceDisX + eH[i] * forceDisY + eD[i] * forceDisZ;
    }

    if (newCrossPos && newCrossPos.r != undefined) {
      res[CROSS.dicForAngle[curViewMod]] = newCrossPos.r;
    }
    if (newCrossPos && newCrossPos.mprThickX != undefined) {
      res[CROSS.dicForThick[curViewMod].mprThickX] = newCrossPos.mprThickX;
    }
    if (newCrossPos && newCrossPos.mprThickY != undefined) {
      res[CROSS.dicForThick[curViewMod].mprThickY] = newCrossPos.mprThickY;
    }

    //校验参数
    res = this.checkAcrossPoint(res);
    return res;
  },

  //非均匀数据翻页的时候，保持十字定位的相对位置不变
  keepAcrossPoint(seriesInfo, newCrossPos, newIndex, curAP) {
    let instance = seriesInfo.instances[newIndex];
    let ImagePositionPatient = instance.ImagePositionPatient;
    let leftTopPos = {
      x: ImagePositionPatient[0],
      y: ImagePositionPatient[1],
      z: ImagePositionPatient[2],
    };
    let pixelSpacing = instance.PixelSpacing;
    let orientation = instance.ImageOrientationPatient;
    let { x, y } = newCrossPos;
    let eW = [orientation[0], orientation[1], orientation[2]];
    let eH = [orientation[3], orientation[4], orientation[5]];

    let newAP = { ...curAP };
    let dic = ["x", "y", "z"];
    for (let i = 0; i < 3; i++) {
      newAP[dic[i]] =
        leftTopPos[dic[i]] +
        eW[i] * x * pixelSpacing[0] +
        eH[i] * y * pixelSpacing[1];
    }
    return newAP;
  },

  //根据十字位置设置当前的imageData的DWIUID，不管十字有没有旋转或者调节层厚，都生效
  //决定一个十字定位取到唯一的一张图像
  //如果图像不均匀，可以传入一个确切的index
  //这里传入的AcrossPoint是世界坐标系上绝对的点，会考虑坐标轴的旋转
  //forceStep表示强制步长，用于同视图数据的平铺翻页
  asyncImageData(imageData, AcrossPoint, seriesInfo, forceStep = 0) {
    let { curViewMod } = imageData;
    let imageDataResp = { ...imageData };
    let resp = {};
    resp = this.getCurImageNum(seriesInfo, AcrossPoint, curViewMod, forceStep);

    //如果图像
    //清空图像，因为imageData一般是用浅拷贝复制的，此处不清空，会导致数据混乱
    imageDataResp.img = undefined;
    imageDataResp.curImageNum = resp.curImageNum;
    imageDataResp.imageNum = resp.imageNum;
    imageDataResp.DWIUID = resp.DWIUID;
    if (this.ifAcrossRotated(AcrossPoint)) {
      imageDataResp.isSyncOthers = true;
    } else {
      imageDataResp.isSyncOthers = false;
    }
    //格式化
    console.log(
      "asyncImageData",
      curViewMod,
      resp.curImageNum,
      resp.imageNum,
      AcrossPoint.x,
      AcrossPoint.y,
      AcrossPoint.z,
      forceStep,
    );
    return imageDataResp;
  },

  //此处oreintation是世界坐标系的orientation,格式为[1,0,0,0,1,0],取近似值就可以了
  getPointDisToPlane(AP, LP, orientation) {
    let eZ = this.getEZ(orientation); //平面的法向量
    let eP = [AP.x - LP.x, AP.y - LP.y, AP.z - LP.z]; //十字点到平面上的点的向量
    let dis = Math.abs(this.dotProduct(eP, eZ)); //点到平面的距离
    dis = Number(dis.toFixed(4));
    return dis;
  },

  // 任何一个十字点只会得到一个唯一的id，但是不同的十字点可以得到相同的posZindex
  encodeDWIUID(AcrossPoint, curViewMod, currentSID, posZIndex) {
    let dic = [
      "x",
      "y",
      "z",
      "rotateT",
      "rotateC",
      "rotateS",
      "thickT",
      "thickC",
      "thickS",
    ];

    let str =
      currentSID +
      "/" +
      curViewMod.toString() +
      "/" +
      posZIndex.toString() +
      "/";
    for (let i = 0; i < dic.length; i++) {
      str = str + AcrossPoint[dic[i]].toString() + "/";
    }
    // let DWIUID = window.btoa(str);
    let DWIUID = str;
    return DWIUID;
  },

  decodeDWIUID(DWIUID) {
    // let str = window.atob(DWIUID);
    let str = DWIUID;
    let arr = str.split("/");
    let dic = [
      "currentSID",
      "curViewMod",
      "posZIndex",
      "x",
      "y",
      "z",
      "rotateT",
      "rotateC",
      "rotateS",
      "thickT",
      "thickC",
      "thickS",
    ];
    let currentSID = arr[0];
    let curViewMod = Number(arr[1]);
    let posZIndex = arr[2];
    let AcrossPoint = {};
    for (let i = 3; i < dic.length; i++) {
      AcrossPoint[dic[i]] = Number(arr[i]);
    }
    return { currentSID, curViewMod, posZIndex, AcrossPoint };
  },
  updateDWIUID(newAP, oldDWIUID) {
    let { currentSID, curViewMod, posZIndex } = this.decodeDWIUID(oldDWIUID);
    let newDWIUID = this.encodeDWIUID(newAP, curViewMod, currentSID, posZIndex);
    return newDWIUID;
  },

  isSameIndex(DWUID1, DWUID2) {
    let posZIndex1 = CROSS.decodeDWIUID(DWUID1).posZIndex;
    let posZIndex2 = CROSS.decodeDWIUID(DWUID2).posZIndex;
    if (posZIndex1 != undefined && posZIndex2 != undefined) {
      if (posZIndex1 == posZIndex2) {
        return true;
      }
    }
    return false;
  },
  distanceOfPoint(p1, p2) {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    const dz = p1[2] - p2[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },
  calcImageNumByNormal(AP, normal, seriesInfo, dp) {
    const origin = seriesInfo.ImagePositionPatient;
    const spacing = seriesInfo.volumeSpacing[0];
    const size = seriesInfo.volumeSize[0];
    const orientation = seriesInfo.volumeOrientation[0];

    //ssy 0608 mpr 坐标换算:这里是世界坐标系，需要用上初始的oreintation
    let ldx = ((size.w - 1) * spacing.w) / 2,
      ldy = ((size.h - 1) * spacing.h) / 2,
      ldz = ((size.d - 1) * spacing.d) / 2;
    const center = [
      origin[0] +
      ldx * orientation[0][0] +
      ldy * orientation[1][0] +
      ldz * orientation[2][0],
      origin[1] +
      ldx * orientation[0][1] +
      ldy * orientation[1][1] +
      ldz * orientation[2][1],
      origin[2] +
      ldx * orientation[0][2] +
      ldy * orientation[1][2] +
      ldz * orientation[2][2],
    ];
    ldx = ldx * 2;
    ldy = ldy * 2;
    ldz = ldz * 2;
    const rigthBottom = [
      origin[0] +
      ldx * orientation[0][0] +
      ldy * orientation[1][0] +
      ldz * orientation[2][0],
      origin[1] +
      ldx * orientation[0][1] +
      ldy * orientation[1][1] +
      ldz * orientation[2][1],
      origin[2] +
      ldx * orientation[0][2] +
      ldy * orientation[1][2] +
      ldz * orientation[2][2],
    ];

    const boxMin = [
      Math.min(origin[0], rigthBottom[0]),
      Math.min(origin[1], rigthBottom[1]),
      Math.min(origin[2], rigthBottom[2]),
    ];
    const boxMax = [
      Math.max(origin[0], rigthBottom[0]),
      Math.max(origin[1], rigthBottom[1]),
      Math.max(origin[2], rigthBottom[2]),
    ];

    // 1. 求直线和包围盒的交点
    let tNear = -Infinity,
      tFar = Infinity;
    for (let i = 0; i < 3; i++) {
      if (Math.abs(normal[i]) < 1e-6) {
        if (center[i] < boxMin[i] || center[i] > boxMax[i])
          return { curImageNum: 0, imageNum: 0 };
      } else {
        let t1 = (boxMin[i] - center[i]) / normal[i];
        let t2 = (boxMax[i] - center[i]) / normal[i];
        let tMin = Math.min(t1, t2);
        let tMax = Math.max(t1, t2);
        tNear = Math.max(tNear, tMin);
        tFar = Math.min(tFar, tMax);
        if (tNear > tFar) return { curImageNum: 0, imageNum: 0 };
      }
    }
    // 2. 交点
    let entryPoint = [
      center[0] + tNear * normal[0],
      center[1] + tNear * normal[1],
      center[2] + tNear * normal[2],
    ];
    let exitPoint = [
      center[0] + tFar * normal[0],
      center[1] + tFar * normal[1],
      center[2] + tFar * normal[2],
    ];

    // 3. AP在直线上的投影 AP'
    // 直线参数式: x = center + t * normal
    // 投影参数 t0 = ( (AP - center) · normal ) / ( normal · normal )
    const AP2center = [AP[0] - center[0], AP[1] - center[1], AP[2] - center[2]];
    const normalNorm2 =
      normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2];
    const t0 =
      (AP2center[0] * normal[0] +
        AP2center[1] * normal[1] +
        AP2center[2] * normal[2]) /
      normalNorm2;
    const AP_proj = [
      center[0] + t0 * normal[0],
      center[1] + t0 * normal[1],
      center[2] + t0 * normal[2],
    ];

    // 4. 距离
    let l1 = this.distanceOfPoint(entryPoint, AP_proj); // AP' 到 entryPoint
    let l2 = this.distanceOfPoint(entryPoint, exitPoint); // entryPoint 到 exitPoint

    // 5. 层数
    let curImageNum = Math.round(l1 / dp);
    let imageNum = Math.round(l2 / dp) + 1;
    return { curImageNum, imageNum };
  },

  //由一个世界坐标系的十字点得到一个图像切片
  //进入VTK的数据不走这个函数
  //forceStep表示强制步长，用于同视图数据的平铺翻页
  getCurImageNum(seriesInfo, AcrossPoint, curViewMod, forceStep = 0) {
    let curImageNum = undefined,
      imageNum = undefined;
    if (seriesInfo.isNotUniformSquence) {
      //不均匀的数据忽略视图，只能取初始的视图
      let { instances } = seriesInfo;
      imageNum = instances.length;
      //不插值，直接找到离当前十字位置最近的一张图
      //判断取那一张进行初始化
      curImageNum = 0;
      if (localStorage.getItem("imageInitialPosition") === "center") {
        curImageNum = Math.floor(imageNum / 2);
      }
      let ImagePositionPatient = instances[curImageNum].ImagePositionPatient;
      let cenPos = {
        x: ImagePositionPatient[0],
        y: ImagePositionPatient[1],
        z: ImagePositionPatient[2],
      };
      let minDis = this.getPointDisToPlane(
        AcrossPoint,
        cenPos,
        instances[curImageNum].ImageOrientationPatient,
      );
      for (let i = 0; i < imageNum; i++) {
        let orientation = instances[i].ImageOrientationPatient;
        let { 0: x, 1: y, 2: z } = instances[i].ImagePositionPatient;
        let curPos = { x, y, z };
        //取离十字定位最近的一个平面当做近似
        let curDis = this.getPointDisToPlane(AcrossPoint, curPos, orientation);
        if (curDis < minDis) {
          minDis = curDis;
          curImageNum = i;
        }
      }
    } else {
      //其他数据都直接当均匀数据处理,但是此处需要考虑初始orientation带旋转的情况
      let {
        volumeOrientation,
        volumeSpacing,
        volumeSize,
        ImagePositionPatient,
      } = seriesInfo;
      let imgOrientation = volumeOrientation[curViewMod];
      let eD = imgOrientation[2];
      if (this.ifAcrossRotated(AcrossPoint)) {
        eD = AcrossPoint.planes[curViewMod].normal;
        let center = [AcrossPoint.x, AcrossPoint.y, AcrossPoint.z];
        let dp = volumeSpacing[curViewMod].thickness;
        let resp = this.calcImageNumByNormal(center, eD, seriesInfo, dp);
        curImageNum = resp.curImageNum;
        imageNum = resp.imageNum;
        console.log("test curViewMod", curViewMod);
        console.log("test calcImageNumByNormal", curImageNum, imageNum);
      } else {
        //已知十字的位置，求curImageNum
        let positionDic = ["x", "y", "z"];
        let moveDis = [];
        for (let i = 0; i < 3; i++) {
          moveDis[i] = AcrossPoint[positionDic[i]] - ImagePositionPatient[i];
        }
        //求向量在z轴上的投影
        let disZ = this.dotProduct(moveDis, eD);
        imageNum = volumeSize[curViewMod].d;
        curImageNum = disZ / volumeSpacing[curViewMod].d;
        //这个处理是为了减少部分不必要的插值计算
        if (
          //
          Math.round(volumeSpacing[curViewMod].d * 100) ==
          Math.round(volumeSpacing[curViewMod].thickness * 100)
        ) {
          curImageNum = Math.round(curImageNum);
        }
        console.log("test other curImageNum", curImageNum, imageNum);
      }
    }

    //加上步进
    curImageNum = curImageNum + forceStep;
    if (curImageNum < 0) curImageNum = 0;
    if (curImageNum >= imageNum) curImageNum = imageNum - 1;

    let DWIUID = this.encodeDWIUID(
      AcrossPoint,
      curViewMod,
      seriesInfo.currentSID,
      curImageNum,
    );
    return { curImageNum, imageNum, DWIUID };
  },

  //校验十字定位的参数
  checkAcrossPoint(AcrossPoint) {
    let dic = [
      "x",
      "y",
      "z",
      "rotateT",
      "rotateC",
      "rotateS",
      "thickT",
      "thickC",
      "thickS",
    ];
    dic.forEach((item) => {
      if (AcrossPoint[item] === undefined) {
        AcrossPoint[item] = 0;
      }
      //r如果不是整数，则保留小数点后四位
      if (!Number.isInteger(AcrossPoint[item])) {
        AcrossPoint[item] = Number(
          (Math.round(AcrossPoint[item] * 10000) / 10000).toFixed(4),
        );
      }
    });

    return AcrossPoint;
  },

  //可以传初始矩阵，也可以不传
  getRotateAxes(registPara, curViewMod = 0, initAexs = undefined) {
    //横断面初始的世界坐标系，z轴是反的
    let axes = mat4.fromValues(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1);

    //如果有初始的坐标轴，拿来用（初始数据的世界坐标系）
    if (initAexs && initAexs.length == 9) {
      axes = mat4.fromValues(
        initAexs[0],
        initAexs[1],
        initAexs[2],
        0,
        initAexs[3],
        initAexs[4],
        initAexs[5],
        0,
        initAexs[6],
        initAexs[7],
        initAexs[8],
        0,
        0,
        0,
        0,
        1,
      );
    }

    if (registPara && registPara.dRote) {
      let { rx, ry, rz } = registPara.dRote;
      if (rx) {
        mat4.rotateX(axes, axes, -rx);
      }
      if (ry) {
        mat4.rotateY(axes, axes, ry);
      }
      if (rz) {
        mat4.rotateZ(axes, axes, -rz);
      }
    }

    //获取切片
    switch (curViewMod) {
      case 0: {
        break;
      }
      case 1: {
        //x-z
        //获得当前的截面
        mat4.rotateX(axes, axes, -Math.PI / 2);
        // 翻转Z轴
        mat4.scale(axes, axes, [1, -1, 1]);
        break;
      }
      case 2: {
        //y-z
        //获得当前的截面
        mat4.rotateY(axes, axes, -Math.PI / 2);
        mat4.rotateZ(axes, axes, Math.PI / 2);
        mat4.scale(axes, axes, [1, -1, 1]);
        break;
      }
    }

    return axes;
  },
  transMatrixForward(matrix, rAxes) {
    //这里需要用左乘
    let newMatrix = JSON.parse(JSON.stringify(matrix));

    let optMatrix = mat4.fromValues(
      matrix[0][0],
      matrix[0][1],
      matrix[0][2],
      0,
      matrix[1][0],
      matrix[1][1],
      matrix[1][2],
      0,
      matrix[2][0],
      matrix[2][1],
      matrix[2][2],
      0,
      0,
      0,
      0,
      1,
    );
    mat4.multiply(optMatrix, rAxes, optMatrix);
    newMatrix = [
      [optMatrix[0], optMatrix[1], optMatrix[2]],
      [optMatrix[4], optMatrix[5], optMatrix[6]],
      [optMatrix[8], optMatrix[9], optMatrix[10]],
    ];
    return newMatrix;
  },
  transPointForward(point, rAxes) {
    let pointVec = vec4.fromValues(point[0], point[1], point[2], 1);
    let rusult = vec4.create();
    mat4.multiply(rusult, rAxes, pointVec);
    return rusult;
  },

  transPointBackward(point, rAxes) {
    let pointVec = vec4.fromValues(point[0], point[1], point[2], 1);
    let rAxes_inv = mat4.create();

    //求矩阵的
    mat4.invert(rAxes_inv, rAxes);
    let rusult = vec4.create();
    mat4.multiply(rusult, rAxes, pointVec);
    return rusult;
  },

  getInitTranMatrix(seriesInfo) {
    let { volumeOrientation, volumeSpacing, ImagePositionPatient } = seriesInfo;
    let initDrict = volumeOrientation[0].flat(),
      initSpacing = volumeSpacing[0],
      initPos = ImagePositionPatient;
    let initMatrix = mat4.fromValues(
      initDrict[0] * initSpacing.w,
      initDrict[1] * initSpacing.w,
      initDrict[2] * initSpacing.w,
      0,
      initDrict[3] * initSpacing.h,
      initDrict[4] * initSpacing.h,
      initDrict[5] * initSpacing.h,
      0,
      initDrict[6] * initSpacing.d,
      initDrict[7] * initSpacing.d,
      initDrict[8] * initSpacing.d,
      0,
      initPos[0],
      initPos[1],
      initPos[2],
      1,
    );
    return initMatrix;
  },
  //世界坐标系转换到体素坐标系
  worldToVolume(seriesInfo, AcrossPoint, volumeAxesOnWorld = undefined) {
    //测试代码
    // let { volumeOrientation, volumeSpacing, ImagePositionPatient } = seriesInfo;
    // let disVec = [AcrossPoint.x - ImagePositionPatient[0], AcrossPoint.y - ImagePositionPatient[1], AcrossPoint.z - ImagePositionPatient[2]];
    // let indexX = this.dotProduct(disVec, volumeOrientation[0][0]) / volumeSpacing[0].w;
    // let indexY = this.dotProduct(disVec, volumeOrientation[0][1]) / volumeSpacing[0].h;
    // let indexZ = this.dotProduct(disVec, volumeOrientation[0][2]) / volumeSpacing[0].d;
    // let resp1= { i: indexX, j: indexY, k: indexZ }

    let initAexs = volumeAxesOnWorld;
    if (!initAexs) {
      initAexs = this.getInitTranMatrix(seriesInfo);
    }
    let initAexs_inv = mat4.create();
    mat4.invert(initAexs_inv, initAexs);
    let pointVec = vec4.fromValues(
      AcrossPoint.x,
      AcrossPoint.y,
      AcrossPoint.z,
      1,
    );
    let rusult = vec4.create();
    mat4.multiply(rusult, initAexs_inv, pointVec);
    let resp = { i: rusult[0], j: rusult[1], k: rusult[2] };
    return resp;
  },

  volumeToWorld(seriesInfo, point, volumeAxesOnWorld = undefined) {
    //测试代码
    // point = { i:120, j: 130, k: 1 };
    // let { volumeOrientation, volumeSpacing, ImagePositionPatient } = seriesInfo;
    // let dic = ["x", "y", "z"];
    // let resp1 = {};
    // for (let i = 0; i < 3; i++) {
    //   resp1[dic[i]] = ImagePositionPatient[i] + point.i * volumeOrientation[0][0][i] * volumeSpacing[0].w + point.j * volumeOrientation[0][1][i] * volumeSpacing[0].h + point.k * volumeOrientation[0][2][i] * volumeSpacing[0].d;
    // }
    let initAexs = volumeAxesOnWorld;
    if (!initAexs) {
      initAexs = this.getInitTranMatrix(seriesInfo);
    }
    let pointVec = vec4.fromValues(point.i, point.j, point.k, 1);
    let rusult = vec4.create();
    mat4.multiply(rusult, initAexs, pointVec);
    let resp = { x: rusult[0], y: rusult[1], z: rusult[2] };
    return resp;
  },
  //假设数据中心点坐标为[0,0,0]
  volumeToWorld_center0(seriesInfo, point) {
    let { volumeOrientation, volumeSpacing, volumeSize } = seriesInfo;
    let dic = ["x", "y", "z"];
    let resp = {};
    for (let i = 0; i < 3; i++) {
      resp[dic[i]] =
        (point.i - volumeSize[0].w / 2) *
        volumeOrientation[0][0][i] *
        volumeSpacing[0].w +
        (point.j - volumeSize[0].h / 2) *
        volumeOrientation[0][1][i] *
        volumeSpacing[0].h +
        (point.k - volumeSize[0].d / 2) *
        volumeOrientation[0][2][i] *
        volumeSpacing[0].d;
    }
    return resp;
  },
  //regPara，配准的交互信息
  getAxesForVTKSlicer(volumeImageData, AcrossPoint, curViewMod, regPara) {
    let volumeOrientation = volumeImageData.getDirection();
    let centInit = volumeImageData.getCenter();
    let sliceMove = [
      centInit[0] - AcrossPoint.x,
      centInit[1] - AcrossPoint.y,
      centInit[2] - AcrossPoint.z,
    ];
    //初始化为图像的坐标轴（这里将十字坐标系初始化到了图像左上角原点的坐标）
    const axes = mat4.fromValues(
      volumeOrientation[0],
      volumeOrientation[1],
      volumeOrientation[2],
      0,
      volumeOrientation[3],
      volumeOrientation[4],
      volumeOrientation[5],
      0,
      volumeOrientation[6],
      volumeOrientation[7],
      volumeOrientation[8],
      0,
      centInit[0],
      centInit[1],
      centInit[2],
      1,
    );
    //切片操作

    if (regPara) {
      //旋转操作必须绕图像中心
      if (regPara.dRote) {
        let { rx, ry, rz } = regPara.dRote;
        if (rx) {
          mat4.rotateX(axes, axes, -rx);
        }
        if (ry) {
          mat4.rotateY(axes, axes, ry);
        }
        if (rz) {
          mat4.rotateZ(axes, axes, -rz);
        }
      }
    }
    mat4.translate(axes, axes, sliceMove);

    //获取切片
    switch (curViewMod) {
      case 0: {
        break;
      }
      case 1: {
        //x-z
        //获得当前的截面
        mat4.rotateX(axes, axes, -Math.PI / 2);
        //翻转当前的y方向
        mat4.scale(axes, axes, [1, -1, 1]);
        break;
      }
      case 2: {
        //y-z
        //获得当前的截面
        mat4.rotateY(axes, axes, -Math.PI / 2);
        mat4.rotateZ(axes, axes, Math.PI / 2);
        //翻转当前的y方向
        mat4.scale(axes, axes, [1, -1, 1]);
        break;
      }
    }

    return axes;
  },
  getNewAxesFromPlane(center, normal, viewUp, curViewMod) {
    const zLen = Math.hypot(...normal);
    const newZ = normal.map((n) => n / zLen);

    const dot = viewUp[0] * newZ[0] + viewUp[1] * newZ[1] + viewUp[2] * newZ[2];
    const proj = newZ.map((n) => n * dot);
    const rawY = [
      viewUp[0] - proj[0],
      viewUp[1] - proj[1],
      viewUp[2] - proj[2],
    ];
    const yLen = Math.hypot(...rawY);
    const newY = rawY.map((n) => n / yLen);

    //ssy 0608 mpr 坐标换算: 为了解决图像视觉上x方向颠倒的问题，横断面和矢撞面的X轴做镜像翻转
    let scale = curViewMod === 1 ? 1 : -1;

    const newX = [
      scale * (newY[1] * newZ[2] - newY[2] * newZ[1]),
      scale * (newY[2] * newZ[0] - newY[0] * newZ[2]),
      scale * (newY[0] * newZ[1] - newY[1] * newZ[0]),
    ];
    return { newX, newY, newZ, newCenter: center };
  },

  //获取坐标轴
  getAxes(AcrossPoint, curViewMod) {
    let crossPosOnWorld = [AcrossPoint.x, AcrossPoint.y, AcrossPoint.z];
    let rotateAngelGlobal = [
      AcrossPoint.rotateT,
      -AcrossPoint.rotateC,
      -AcrossPoint.rotateS,
    ];
    //需要算上坐标原点和世界坐标系
    const axes = mat4.identity(new Float64Array(16));
    //mat formate，以当前图像的坐标轴为基准，进行旋转，所有矩阵的操作，都是以图像坐标系为基准的
    // 1 0 0 0
    // 0 1 0 0
    // 0 0 1 0
    // 0 0 0 1

    //把坐标系原点平移到当前定位需要的点，平移移动的是世界坐标系
    let moveToCross = crossPosOnWorld;
    mat4.translate(axes, axes, moveToCross);

    //获取切片
    switch (curViewMod) {
      case 0: {
        //x-y
        //旋转另外两个坐标轴
        mat4.rotateY(axes, axes, -rotateAngelGlobal[1]);
        mat4.rotateX(axes, axes, rotateAngelGlobal[2]);
        break;
      }
      case 1: {
        //x-z
        //旋转另外两个坐标轴
        mat4.rotateZ(axes, axes, rotateAngelGlobal[0]);
        mat4.rotateX(axes, axes, rotateAngelGlobal[2]);
        //获得当前的截面
        mat4.rotateX(axes, axes, -Math.PI / 2);
        //z轴镜像

        break;
      }
      case 2: {
        //y-z
        //旋转另外两个坐标轴
        mat4.rotateY(axes, axes, -rotateAngelGlobal[1]);
        mat4.rotateZ(axes, axes, rotateAngelGlobal[0]);
        //获得当前的截面
        mat4.rotateY(axes, axes, -Math.PI / 2);
        mat4.rotateZ(axes, axes, Math.PI / 2);
        break;
      }
    }
    return axes;
  },
  formatAxex(axes) {
    //第四列的值为
    let newX = [axes[0], axes[1], axes[2]];
    let newY = [axes[4], axes[5], axes[6]];
    let newZ = [axes[8], axes[9], axes[10]];
    let newCenter = [axes[12], axes[13], axes[14]];
    return { newX, newY, newZ, newCenter };
  },
  axisToViewMode(imgorient) {
    let arr_imgorient = imgorient.flat();
    let modeDic = [2, 1, 0]; //横断面 2-0, 冠状面1-0,矢状面 0-0
    let min = 2,
      minAx = 0;
    for (let i = 0; i < 3; i++) {
      let temp = Math.abs(arr_imgorient[i]) + Math.abs(arr_imgorient[i + 3]);
      if (temp < min) {
        min = temp;
        minAx = i;
      }
    }
    return modeDic[minAx] || 0;
  },

  //从一个平面的orientation中获取z轴
  //如果平面的orientation指向横断面，则 eX=[1,0,0],eY=[0,1,0] 那么z轴需要指向[0,0,-1],orientation=eY*eX
  //如果平面的orientation指向冠状面，则 eX=[1,0,0],eY=[0,0,-1] 那么z轴需要指向[0,1,0],orientation=eX*eY
  //如果平面的orientation指向矢状面，则 eX=[0,1,0],eY=[0,0,-1] 那么z轴需要指向[1,0,0],orientation=eY*eX
  //这个函数和重建有关
  getEZ(orientation) {
    let eX = [orientation[0], orientation[1], orientation[2]],
      eY = [orientation[3], orientation[4], orientation[5]];
    let initViewMod = this.axisToViewMode(orientation);
    let eZ;
    if (initViewMod == 1) {
      eZ = this.crossProduct(eX, eY);
    } else {
      eZ = this.crossProduct(eY, eX);
    }

    return eZ;
  },

  //从当前的orientation中获取切换视图之后的orientation

  getAxesOfImage(imgorient) {
    let eX = [imgorient[0], imgorient[1], imgorient[2]],
      eY = [imgorient[3], imgorient[4], imgorient[5]];

    let eZ = this.getEZ(imgorient);

    return [eX, eY, eZ];
  },

  getAxesOfVolume(initImgorient) {
    let eX = [initImgorient[0], initImgorient[1], initImgorient[2]],
      eY = [initImgorient[3], initImgorient[4], initImgorient[5]];
    let eZ = this.getEZ(initImgorient);
    let initViewMod = this.axisToViewMode(initImgorient);
    let volumeEX = eX,
      volumeEY = eY,
      volumeEZ = eZ;

    //冠状面 w-x,h-z,d-y
    if (initViewMod == 1) {
      volumeEX = eX;
      volumeEZ = eY;
      volumeEY = eZ;
    }
    //矢状面 w-y,h-z,d-x
    if (initViewMod == 2) {
      volumeEY = eX;
      volumeEZ = eY;
      volumeEX = eZ;
    }
    return [
      [volumeEX, volumeEY, volumeEZ],
      [volumeEX, volumeEZ, volumeEY],
      [volumeEY, volumeEZ, volumeEX],
    ];
  },
  //三维向量叉乘
  crossProduct(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  },

  //判断十字是否旋转过
  ifAcrossRotated(ArcossPoint) {
    let { isPlaneRotated } = ArcossPoint;
    if (isPlaneRotated) {
      return true;
    } else {
      return false;
    }
  },
  //判断十字是否被调节过层厚
  ifAcrossThicked(AcrossPoint) {
    let { thickT, thickC, thickS } = AcrossPoint;
    let flag = false;
    if (thickT || thickC || thickS) {
      flag = true;
    }
    return flag;
  },

  //向量点乘，v2是标准向量
  dotProduct(v1, v2) {
    return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
  },

  //AcrossPoint 始终是绝对的世界坐标系上的坐标，和角度相关
  //需要考虑非均匀数据，均匀数据，vtk重建之后的数据
  //需要的参数包括，图像的左上角原点，图像的分辨率，图像的orientation
  getCrossPosOnImg(imageData, AcrossPoint) {
    let { curViewMod, dataWithInfo, curImageNum } = imageData;
    if (
      AcrossPoint.x == undefined ||
      AcrossPoint.y == undefined ||
      AcrossPoint.z == undefined
    ) {
      return null;
    }
    let {
      pixelSpacingW: wp,
      pixelSpacingH: hp,
      leftTopPos,
      isFromVTKClip,
      imgorient,
    } = dataWithInfo;
    if (leftTopPos == undefined) {
      return null;
    }
    let crossPos = {};
    //用orientation来做
    let dis = [
      AcrossPoint.x - leftTopPos.x,
      AcrossPoint.y - leftTopPos.y,
      AcrossPoint.z - leftTopPos.z,
    ];
    let eW = imgorient[0],
      eH = imgorient[1];
    let projectW = this.dotProduct(dis, eW);
    let projectH = this.dotProduct(dis, eH);
    crossPos.x = Math.round(projectW / wp); //计算dis在eW和eH两个方向上的投影
    crossPos.y = Math.round(projectH / hp);
    if (!isFromVTKClip) {
      crossPos.index = curImageNum;
    } else {
      crossPos.index = undefined;
    }

    crossPos.r = AcrossPoint[CROSS.dicForAngle[curViewMod]] || 0;
    crossPos.mprThickX =
      AcrossPoint[CROSS.dicForThick[curViewMod].mprThickX] || 0;
    crossPos.mprThickY =
      AcrossPoint[CROSS.dicForThick[curViewMod].mprThickY] || 0;

    return crossPos;
  },

  getInitAcrossPoint(seriesInfo, imageNum) {
    //不管当前显示的是哪个面，从横断面初始化到Volume的中心
    let AcrossPoint = {
      x: 0,
      y: 0,
      z: 0,
      planes: CROSS.initPlanes(seriesInfo),
      isPlaneRotated: false,
      thickT: 0,
      thickC: 0,
      thickS: 0,
      CPRMode: "2",
      CPRRotate: 0,
      CPRThickness: 0,
      CPRProjectionMode: 0,
      CPRProjectionDirect: "Z",
    };
    let { instances, initViewMod } = seriesInfo;

    let totalNumber = instances.length;

    let startIndex = 0;
    //BuDing20250606，接南昌中心需求，翻转的数据进MPR之前需保持原来的页码
    // if (seriesInfo.ifRevers && !seriesInfo.isNotUniformSquence) {
    //   startIndex = totalNumber - 1;
    // }
    //初始化的时候，取到整数值
    let centerIndex = imageNum === undefined ? startIndex : imageNum;

    if (localStorage.getItem("imageInitialPosition") === "center") {
      centerIndex = Math.floor(totalNumber / 2);
    }
    let curInstance = instances[centerIndex];
    let ImagePositionPatient = curInstance.ImagePositionPatient;
    let pixelSpacingW = curInstance.PixelSpacing[1];
    let pixelSpacingH = curInstance.PixelSpacing[0];
    let width = curInstance.columns;
    let height = curInstance.rows;
    let orientation = curInstance.ImageOrientationPatient;
    let leftTopPos = {
      x: ImagePositionPatient[0],
      y: ImagePositionPatient[1],
      z: ImagePositionPatient[2],
    };
    let eX = [orientation[0], orientation[1], orientation[2]],
      eY = [orientation[3], orientation[4], orientation[5]];
    let x_step = Math.floor(width / 2) * pixelSpacingW;
    let y_step = Math.floor(height / 2) * pixelSpacingH;
    let dic = ["x", "y", "z"];
    for (let i = 0; i < 3; i++) {
      AcrossPoint[dic[i]] =
        leftTopPos[dic[i]] + eX[i] * x_step + eY[i] * y_step;
    }
    AcrossPoint = this.checkAcrossPoint(AcrossPoint);

    let APRange;

    if (instances.length > 2) {
      let leftTopPosition = instances[0].ImagePositionPatient;
      let leftTopAP = {
        x: leftTopPosition[0],
        y: leftTopPosition[1],
        z: leftTopPosition[2],
      };
      let xStep = width * pixelSpacingW;
      let yStep = height * pixelSpacingH;
      let rightBottomPos = instances[totalNumber - 1].ImagePositionPatient;
      let rightBottomAP = {
        x: rightBottomPos[0],
        y: rightBottomPos[1],
        z: rightBottomPos[2],
      };
      for (let i = 0; i < 3; i++) {
        rightBottomAP[dic[i]] =
          rightBottomAP[dic[i]] + eX[i] * xStep + eY[i] * yStep;
      }
      APRange = {
        x: [leftTopAP.x, rightBottomAP.x],
        y: [leftTopAP.y, rightBottomAP.y],
        z: [leftTopAP.z, rightBottomAP.z],
      };
    }

    let DWIUID = this.encodeDWIUID(
      AcrossPoint,
      initViewMod,
      seriesInfo.currentSID,
      centerIndex,
    );
    return {
      AcrossPoint,
      initViewMod,
      centerIndex,
      totalNumber,
      DWIUID,
      APRange,
    };
  },
  splitLineAtCenterGap(x1, y1, x2, y2, CD) {
    // 计算中点
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    // 单位方向向量
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / length;
    const uy = dy / length;

    // 推 CD 距离
    const gapX = ux * CD;
    const gapY = uy * CD;

    // 第一条线段：从起点到中心-CD
    const seg1 = {
      x1: x1,
      y1: y1,
      x2: mx - gapX,
      y2: my - gapY,
    };

    // 第二条线段：从中心+CD 到终点
    const seg2 = {
      x1: mx + gapX,
      y1: my + gapY,
      x2: x2,
      y2: y2,
    };

    return [seg1, seg2];
  },
  drawCross(crossCtx, imageData, canvasSize, isInMPR) {
    let { dataWithInfo, scale, translate, rotate, crossPos } = imageData;
    if (!crossPos) return null;
    let curViewMod = this.axisToViewMode(dataWithInfo.imgorient);
    let { mprThickX, mprThickY, r, x, y } = crossPos;
    let centerPosOnImage = { x: x, y: y };
    let { pixelSpacingW, pixelSpacingH, shadowPointsInfo, origBuf } =
      dataWithInfo;
    if (isInMPR && shadowPointsInfo) {
      curViewMod = imageData.curViewMod;
      const { allProjLines } = shadowPointsInfo;
      let lineArr = [];
      allProjLines.forEach((point) => {
        const { x1, y1, x2, y2, plane: name, axes } = point;
        const [seg1, seg2] = this.splitLineAtCenterGap(x1, y1, x2, y2, crossCD);
        let defaultDottSytle = [];

        lineArr.push({
          strokeStyle: lineColors[name],
          c: seg1,
          dottSytle: defaultDottSytle,
          axes,
          lineWidth: 1,
        });

        lineArr.push({
          strokeStyle: lineColors[name],
          c: seg2,
          dottSytle: defaultDottSytle,
          axes,
          lineWidth: 1,
        });
      });

      crossCtx.save();

      let mipRange = this.getMipRange(
        pixelSpacingW,
        pixelSpacingH,
        mprThickX,
        mprThickY,
        scale,
      );
      lineArr = this.addAcrossMipLine(lineArr, mipRange);
      //渲染
      for (let i = 0; i < lineArr.length; i++) {
        this.drawLine(crossCtx, lineArr[i]);
      }
      crossCtx.restore();
    } else {
      let { width: imageWidth, height: imageHeight } = origBuf;
      let { width: canvasWidth, height: canvasHeight } = canvasSize;
      let centerPosOnCanvas = this.coordinateImageToCanvas(
        translate,
        rotate,
        scale,
        imageWidth,
        imageHeight,
        canvasWidth,
        canvasHeight,
        centerPosOnImage,
      );
      crossCtx.save();
      crossCtx.translate(centerPosOnCanvas.x, centerPosOnCanvas.y);
      crossCtx.rotate(r); //此处旋转的是弧度

      let { colorX, colorY } = this.positionLine["curViewMod" + curViewMod];

      let lineArr = this.getAcrossAxesLine(colorX, colorY);

      let mipRange = this.getMipRange(
        pixelSpacingW,
        pixelSpacingH,
        mprThickX,
        mprThickY,
        scale,
      );
      lineArr = this.addOldAcrossMipLine(lineArr, mipRange);
      //渲染
      for (let i = 0; i < lineArr.length; i++) {
        this.drawLine(crossCtx, lineArr[i]);
      }
      crossCtx.restore();
    }
  },

  //画定位线,这个函数需要重构
  drawPosLine(crossCtx, imageData, seriesInfo, canvasSize, currViewport) {
    //如果当前视图缺失信息，不显示定位线
    if (seriesInfo.isMissInfo) return;

    let { canvasNow, imageDatas, seriesInfos } = currViewport;
    let imageData_now = imageDatas[canvasNow];
    let seriesInfo_now = seriesInfos[canvasNow];
    //isMissInfo=true无法显示定位线
    if (!imageData_now || !seriesInfo_now || seriesInfo_now.isMissInfo) return;

    let { dataWithInfo: DWI_now } = imageData_now;
    let { dataWithInfo: DWI_pos, scale, translate, rotate } = imageData;
    //缺失DWI无法显示定位线
    if (!DWI_now || !DWI_pos) return;

    let {
      pixelSpacingW: wp,
      pixelSpacingH: hp,
      imgorient: orientation_now,
      leftTopPos: LTP_now,
    } = DWI_now;
    let { width: imageWidth, height: imageHeight } = DWI_pos;
    let { imgorient: orientation_pos, leftTopPos: LTP_pos } = DWI_pos;
    //缺失信息无法显示定位线
    if (!orientation_now || !orientation_pos || !LTP_now || !LTP_pos) {
      return;
    }
    let viewMod_now = this.axisToViewMode(orientation_now);
    let viewMod_pos = this.axisToViewMode(orientation_pos);
    //视图相同不需要显示定位线
    if (viewMod_now === viewMod_pos) return;

    //获取需要画的定位线的颜色
    let color = CROSS.getMarkButtonColor(viewMod_now);

    crossCtx.save();
    crossCtx.strokeStyle = color;
    crossCtx.lineWidth = 2;
    //虚线显示
    crossCtx.setLineDash([5, 5]);

    //计算交线，两个平面的法向量叉乘，就可以得到交线的方向向量
    let N1 = orientation_now[2];
    let N2 = orientation_pos[2];
    let lineCross = this.crossProduct(N1, N2);
    //只有和选中canvas视图不同的窗口才显示定位线
    let pos1 = { ...LTP_now },
      pos2 = { ...LTP_now };
    //求pos1和pos2的
    let { width, height } = DWI_now;
    let dic = ["x", "y", "z"];
    for (let i = 0; i < 3; i++) {
      pos2[dic[i]] =
        pos1[dic[i]] +
        width * wp * orientation_now[0][i] +
        height * hp * orientation_now[1][i];
    }
    let AP = currViewport.AcrossPoint;
    let len1 = this.dotProduct(
      [AP.x - pos1.x, AP.y - pos1.y, AP.z - pos1.z],
      lineCross,
    );
    let len2 = this.dotProduct(
      [AP.x - pos2.x, AP.y - pos2.y, AP.z - pos2.z],
      lineCross,
    );

    pos1 = {
      x: AP.x - lineCross[0] * len1,
      y: AP.y - lineCross[1] * len1,
      z: AP.z - lineCross[2] * len1,
    };
    pos2 = {
      x: AP.x - lineCross[0] * len2,
      y: AP.y - lineCross[1] * len2,
      z: AP.z - lineCross[2] * len2,
    };
    let crossOnImg1 = this.getCrossPosOnImg(imageData, pos1);
    let crossOnImg2 = this.getCrossPosOnImg(imageData, pos2);
    let { width: canvasWidth, height: canvasHeight } = canvasSize;

    let crossOnCanvas1 = this.coordinateImageToCanvas(
      translate,
      rotate,
      scale,
      imageWidth,
      imageHeight,
      canvasWidth,
      canvasHeight,
      crossOnImg1,
    );
    let crossOnCanvas2 = this.coordinateImageToCanvas(
      translate,
      rotate,
      scale,
      imageWidth,
      imageHeight,
      canvasWidth,
      canvasHeight,
      crossOnImg2,
    );
    crossCtx.beginPath();
    crossCtx.moveTo(crossOnCanvas1.x, crossOnCanvas1.y);
    crossCtx.lineTo(crossOnCanvas2.x, crossOnCanvas2.y);
    crossCtx.stroke();
    crossCtx.restore();
  },
  //获取十字的渲染图像
  getCrossForCatcher(crossPos, imageData, canvasSize, screenPos = {}, isInMPR) {
    let { dataWithInfo, scale, translate, rotate } = imageData;
    let { pixelSpacingW, pixelSpacingH, origBuf, imgorient, shadowPointsInfo } =
      dataWithInfo; //x轴和y轴的图像分辨率
    if (!crossPos || !origBuf) return null;
    let curViewMod = this.axisToViewMode(imgorient);
    let circleShow = false,
      rectShow = false;
    let { mprThickX, mprThickY, r, x, y } = crossPos;
    let centerPosOnImage = { x: x, y: y };
    let { width: imageWidth, height: imageHeight } = origBuf;
    let { width: canvasWidth, height: canvasHeight } = canvasSize;
    let minDis = Math.min(canvasHeight, canvasWidth) / 6;
    let mixDis = 200;
    if (minDis > mixDis) minDis = mixDis;
    let circleDis = minDis * 2;
    let rectDis = minDis;
    const rForCircle = 8;
    const rForRect = 6;

    if (isInMPR && shadowPointsInfo) {
      let crossCanvas = document.createElement("canvas");
      crossCanvas.width = canvasWidth;
      crossCanvas.height = canvasHeight;
      let crossCtx = crossCanvas.getContext("2d");
      crossCtx.clearRect(0, 0, canvasWidth, canvasHeight);

      const transform = crossCtx.getTransform();
      const imatrix = transform.invertSelf();
      let canvasPos = {};
      if (Object.keys(screenPos).length > 0) {
        canvasPos = this.screenToCanvas(screenPos, imatrix);
      }
      curViewMod = imageData.curViewMod;
      circleShow = true;
      rectShow = true;
      const { allProjLines, currentUnRotatePlane, allLinesInfo } =
        shadowPointsInfo;
      let mipRange = this.getMipRange(
        pixelSpacingW,
        pixelSpacingH,
        mprThickX,
        mprThickY,
        scale,
      );
      let { rangeX: thicknessX, rangeY: thicknessY } = mipRange;

      let lineArr = [];
      allProjLines.forEach((point) => {
        const { x1, y1, x2, y2, plane: name, axes } = point;
        const [seg1, seg2] = this.splitLineAtCenterGap(x1, y1, x2, y2, crossCD);
        let defaultDottSytle = [];

        lineArr.push({
          strokeStyle: lineColors[name],
          c: seg1,
          dottSytle: defaultDottSytle,
          axes,
          lineWidth: 1,
          plane: name,
        });

        lineArr.push({
          strokeStyle: lineColors[name],
          c: seg2,
          dottSytle: defaultDottSytle,
          axes,
          lineWidth: 1,
          plane: name,
        });
      });

      lineArr = this.addAcrossMipLine(lineArr, mipRange);
      //渲染
      for (let i = 0; i < lineArr.length; i++) {
        this.drawLine(crossCtx, lineArr[i]);
      }
      const circleArr = [];
      if (circleShow) {
        for (const info of allLinesInfo) {
          const lineColor = lineColors[info.plane];
          // 计算两个圆的位置
          const circlePos1 = {
            x: info.midX + info.ux * circleDis,
            y: info.midY + info.uy * circleDis,
          };
          const circlePos2 = {
            x: info.midX - info.ux * circleDis,
            y: info.midY - info.uy * circleDis,
          };
          // 添加两个圆
          circleArr.push({
            c: { x: circlePos1.x, y: circlePos1.y, r: rForCircle },
            ifFill: false,
            plane: info.plane,
            strokeStyle: lineColor,
            fillStyle: lineColor,
          });
          circleArr.push({
            c: { x: circlePos2.x, y: circlePos2.y, r: rForCircle },
            ifFill: false,
            plane: info.plane,
            strokeStyle: lineColor,
            fillStyle: lineColor,
          });
        }
      }
      const rectArr = [];
      if (rectShow) {
        if (thicknessX > 1) {
          // 找到x轴投影线
          const xLineInfo = allLinesInfo.find((info) => info.axes === "x");
          if (xLineInfo) {
            const { ux, uy, x1, y1, x2, y2, plane, axes } = xLineInfo;
            const lineColor = lineColors[plane];
            const dx = x2 - x1,
              dy = y2 - y1;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len < 1e-6) return;
            const nx = -dy / len,
              ny = dx / len; // 法向量

            // 计算上侧和下侧厚度虚线的中心点
            // 上侧中心
            const upCenter = {
              x: (x1 + x2) / 2 + nx * thicknessX,
              y: (y1 + y2) / 2 + ny * thicknessX,
            };
            // 下侧中心
            const downCenter = {
              x: (x1 + x2) / 2 - nx * thicknessX,
              y: (y1 + y2) / 2 - ny * thicknessX,
            };

            // 上侧虚线两端点
            const up1 = { x: x1 + nx * thicknessX, y: y1 + ny * thicknessX };
            const up2 = { x: x2 + nx * thicknessX, y: y2 + ny * thicknessX };
            // 下侧虚线两端点
            const down1 = { x: x1 - nx * thicknessX, y: y1 - ny * thicknessX };
            const down2 = { x: x2 - nx * thicknessX, y: y2 - ny * thicknessX };

            [
              // 上侧rect
              {
                cx: upCenter.x + ux * rectDis,
                cy: upCenter.y + uy * rectDis,
                axisPoint: { x1: up1.x, y1: up1.y, x2: up2.x, y2: up2.y },
                offset: +thicknessX,
              },
              {
                cx: upCenter.x - ux * rectDis,
                cy: upCenter.y - uy * rectDis,
                axisPoint: { x1: up1.x, y1: up1.y, x2: up2.x, y2: up2.y },
                offset: +thicknessX,
              },
              // 下侧rect
              {
                cx: downCenter.x + ux * rectDis,
                cy: downCenter.y + uy * rectDis,
                axisPoint: {
                  x1: down1.x,
                  y1: down1.y,
                  x2: down2.x,
                  y2: down2.y,
                },
                offset: -thicknessX,
              },
              {
                cx: downCenter.x - ux * rectDis,
                cy: downCenter.y - uy * rectDis,
                axisPoint: {
                  x1: down1.x,
                  y1: down1.y,
                  x2: down2.x,
                  y2: down2.y,
                },
                offset: -thicknessX,
              },
            ].forEach(({ cx, cy, axisPoint, offset }) => {
              rectArr.push({
                c: { x: cx, y: cy, r: rForRect },
                ifFill: false,
                plane,
                strokeStyle: lineColor,
                fillStyle: lineColor,
                axisPoint, // 该厚度虚线的端点
                axes,
                offset,
              });
            });
          }
        }
        // y轴厚度虚线两端rect
        if (thicknessY > 1) {
          // 找到y轴投影线
          const yLineInfo = allLinesInfo.find((info) => info.axes === "y");
          if (yLineInfo) {
            const { ux, uy, x1, y1, x2, y2, plane, axes } = yLineInfo;
            const lineColor = lineColors[plane];
            const dx = x2 - x1,
              dy = y2 - y1;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len < 1e-6) return;
            const nx = -dy / len,
              ny = dx / len;
            let yThickSign = 1;
            if (curViewMod === 1) {
              // coronal
              yThickSign = -1;
            }

            // 厚度虚线的中心点
            const upCenter = {
              x: (x1 + x2) / 2 + nx * thicknessY * yThickSign,
              y: (y1 + y2) / 2 + ny * thicknessY * yThickSign,
            };
            const downCenter = {
              x: (x1 + x2) / 2 - nx * thicknessY * yThickSign,
              y: (y1 + y2) / 2 - ny * thicknessY * yThickSign,
            };
            // 两端点
            const up1 = {
              x: x1 + nx * thicknessY * yThickSign,
              y: y1 + ny * thicknessY * yThickSign,
            };
            const up2 = {
              x: x2 + nx * thicknessY * yThickSign,
              y: y2 + ny * thicknessY * yThickSign,
            };
            const down1 = {
              x: x1 - nx * thicknessY * yThickSign,
              y: y1 - ny * thicknessY * yThickSign,
            };
            const down2 = {
              x: x2 - nx * thicknessY * yThickSign,
              y: y2 - ny * thicknessY * yThickSign,
            };

            [
              {
                center: upCenter,
                axisPoint: { x1: up1.x, y1: up1.y, x2: up2.x, y2: up2.y },
                offset: +thicknessY * yThickSign,
              },
              {
                center: downCenter,
                axisPoint: {
                  x1: down1.x,
                  y1: down1.y,
                  x2: down2.x,
                  y2: down2.y,
                },
                offset: -thicknessY * yThickSign,
              },
            ].forEach(({ center, axisPoint, offset }) => {
              rectArr.push({
                c: {
                  x: center.x + ux * rectDis,
                  y: center.y + uy * rectDis,
                  r: rForRect,
                },
                ifFill: false,
                plane,
                strokeStyle: lineColor,
                fillStyle: lineColor,
                axisPoint,
                axes,
                offset,
              });
              rectArr.push({
                c: {
                  x: center.x - ux * rectDis,
                  y: center.y - uy * rectDis,
                  r: rForRect,
                },
                ifFill: false,
                plane,
                strokeStyle: lineColor,
                fillStyle: lineColor,
                axisPoint,
                axes,
                offset,
              });
            });
          }
        }
        // 如果x或y轴厚度不大于1，中心线两端画rect
        if (!(thicknessX > 1) || !(thicknessY > 1)) {
          for (const info of allLinesInfo) {
            const { ux, uy, midX, midY, plane, x1, y1, x2, y2, axes } = info;
            const lineColor = lineColors[plane];
            if (
              (axes === "x" && !(thicknessX > 1)) ||
              (axes === "y" && !(thicknessY > 1))
            ) {
              rectArr.push({
                c: {
                  x: midX + ux * rectDis,
                  y: midY + uy * rectDis,
                  r: rForRect,
                },
                ifFill: false,
                plane,
                strokeStyle: lineColor,
                fillStyle: lineColor,
                axisPoint: { x1, y1, x2, y2 },
                axes,
              });
              rectArr.push({
                c: {
                  x: midX - ux * rectDis,
                  y: midY - uy * rectDis,
                  r: rForRect,
                },
                ifFill: false,
                plane,
                strokeStyle: lineColor,
                fillStyle: lineColor,
                axisPoint: { x1, y1, x2, y2 },
                axes,
              });
            }
          }
        }
      }
      let findOptResult = {
        acrossPan: true,
      };
      let findAxes = this.checkAxes(canvasPos, lineArr, mipRange);
      findOptResult.findAxes = findAxes;
      //渲染
      for (let i = 0; i < lineArr.length; i++) {
        if (findAxes === lineArr[i].axes) {
          lineArr[i].lineWidth = 2;
        }
        this.drawLine(crossCtx, lineArr[i]);
      }
      for (let i = 0; i < circleArr.length; i++) {
        if (this.checkButton(canvasPos, circleArr[i].c)) {
          circleArr[i].ifFill = true;
          findOptResult.acrossRotate = true;
          findOptResult.acrossPan = false;
          window.currentRotatePlane = circleArr[i].plane;
          if (window.isOrthogonalRotation) {
            window.currentUnRotatePlane = currentUnRotatePlane;
          }
        }
        this.drawCircle(crossCtx, circleArr[i]);
      }
      for (let i = 0; i < rectArr.length; i++) {
        if (this.checkButton(canvasPos, rectArr[i].c)) {
          rectArr[i].ifFill = true;
          findOptResult.acrossThick = true;
          findOptResult.acrossPan = false;
          findOptResult.imatrix = imatrix;
          findOptResult.curThickAxes = rectArr[i].axes;
          findOptResult.axisPoint = rectArr[i].axisPoint;
          findOptResult.offset = rectArr[i].offset;
        }
        this.drawRect(crossCtx, rectArr[i]);
      }
      crossCanvas.findOptResult = findOptResult;
      crossCanvas.crossPos = crossPos;
      return crossCanvas;
    } else {
      let centerPosOnCanvas = this.coordinateImageToCanvas(
        translate,
        rotate,
        scale,
        imageWidth,
        imageHeight,
        canvasWidth,
        canvasHeight,
        centerPosOnImage,
      );

      let crossCanvas = document.createElement("canvas");
      crossCanvas.width = canvasWidth;
      crossCanvas.height = canvasHeight;
      let crossCtx = crossCanvas.getContext("2d");
      crossCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      crossCtx.translate(centerPosOnCanvas.x, centerPosOnCanvas.y);
      crossCtx.rotate(r); //此处旋转的是弧度
      const transform = crossCtx.getTransform();
      const imatrix = transform.invertSelf();

      let { colorX, colorY } = this.positionLine["curViewMod" + curViewMod];

      let lineArr = this.getAcrossAxesLine(colorX, colorY);

      let mipRange = this.getMipRange(
        pixelSpacingW,
        pixelSpacingH,
        mprThickX,
        mprThickY,
        scale,
      );
      lineArr = this.addOldAcrossMipLine(lineArr, mipRange);

      let canvasPos = {};
      if (Object.keys(screenPos).length > 0) {
        canvasPos = this.screenToCanvas(screenPos, imatrix);
      }

      let minDis = Math.min(canvasHeight, canvasWidth) / 6;
      let mixDis = 200;
      if (minDis > mixDis) minDis = mixDis;

      let findOptResult = {
        acrossPan: true,
      };
      let findAxes = this.checkOldAxes(canvasPos, mipRange);
      findOptResult.findAxes = findAxes;
      //渲染
      for (let i = 0; i < lineArr.length; i++) {
        if (findAxes === lineArr[i].axes) {
          lineArr[i].lineWidth = 2;
        }
        this.drawLine(crossCtx, lineArr[i]);
      }
      crossCanvas.findOptResult = findOptResult;
      crossCanvas.crossPos = crossPos;
      return crossCanvas;
    }
  },
  // getOldCrossForCatcher(
  //   crossPos,
  //   imageData,
  //   canvasSize,
  //   screenPos = {},
  //   isInMPR,
  // ) {
  //   let { dataWithInfo, scale, translate, rotate } = imageData;
  //   let { pixelSpacingW, pixelSpacingH, origBuf, imgorient } = dataWithInfo; //x轴和y轴的图像分辨率
  //   if (!crossPos || !origBuf) return null;
  //   let curViewMod = this.axisToViewMode(imgorient);
  //   if (isInMPR) {
  //     curViewMod = imageData.curViewMod;
  //   }
  //   let { mprThickX, mprThickY, r, x, y } = crossPos;
  //   let centerPosOnImage = { x: x, y: y };
  //   let { width: imageWidth, height: imageHeight } = origBuf;
  //   let { width: canvasWidth, height: canvasHeight } = canvasSize;
  //   let centerPosOnCanvas = this.coordinateImageToCanvas(
  //     translate,
  //     rotate,
  //     scale,
  //     imageWidth,
  //     imageHeight,
  //     canvasWidth,
  //     canvasHeight,
  //     centerPosOnImage,
  //   );

  //   let crossCanvas = document.createElement("canvas");
  //   crossCanvas.width = canvasWidth;
  //   crossCanvas.height = canvasHeight;
  //   let crossCtx = crossCanvas.getContext("2d");
  //   crossCtx.clearRect(0, 0, canvasWidth, canvasHeight);
  //   crossCtx.translate(centerPosOnCanvas.x, centerPosOnCanvas.y);
  //   crossCtx.rotate(r); //此处旋转的是弧度
  //   const transform = crossCtx.getTransform();
  //   const imatrix = transform.invertSelf();

  //   let { colorX, colorY } = this.positionLine["curViewMod" + curViewMod];

  //   let lineArr = this.getAcrossAxesLine(colorX, colorY);

  //   let mipRange = this.getMipRange(
  //     pixelSpacingW,
  //     pixelSpacingH,
  //     mprThickX,
  //     mprThickY,
  //     scale,
  //   );
  //   lineArr = this.addAcrossMipLine(lineArr, mipRange);

  //   let circleShow = false,
  //     rectShow = false;

  //   if (isInMPR) {
  //     circleShow = true;
  //     rectShow = true;
  //   }
  //   let canvasPos = {};
  //   if (Object.keys(screenPos).length > 0) {
  //     canvasPos = this.screenToCanvas(screenPos, imatrix);
  //   }

  //   let minDis = Math.min(canvasHeight, canvasWidth) / 6;
  //   let mixDis = 200;
  //   if (minDis > mixDis) minDis = mixDis;
  //   let circleDis = minDis * 2;
  //   let rectDis = minDis;

  //   let circleArr = [];
  //   if (circleShow) {
  //     circleArr = this.getAcrossRotateButton(circleDis, colorX, colorY);
  //   }

  //   let rectArr = [];
  //   if (rectShow) {
  //     rectArr = this.getAcrossMipButton(rectDis, colorX, colorY, mipRange);
  //   }
  //   let findOptResult = {
  //     acrossPan: true,
  //   };
  //   let findAxes = this.checkAxes(canvasPos, mipRange);
  //   findOptResult.findAxes = findAxes;
  //   //渲染
  //   for (let i = 0; i < lineArr.length; i++) {
  //     if (findAxes === lineArr[i].axes) {
  //       lineArr[i].lineWidth = 2;
  //     }
  //     this.drawLine(crossCtx, lineArr[i]);
  //   }
  //   for (let i = 0; i < circleArr.length; i++) {
  //     if (this.checkButton(canvasPos, circleArr[i].c)) {
  //       circleArr[i].ifFill = true;
  //       findOptResult.acrossRotate = true;
  //       findOptResult.acrossPan = false;
  //     }
  //     this.drawCircle(crossCtx, circleArr[i]);
  //   }
  //   for (let i = 0; i < rectArr.length; i++) {
  //     if (this.checkButton(canvasPos, rectArr[i].c)) {
  //       rectArr[i].ifFill = true;
  //       findOptResult.acrossThick = true;
  //       findOptResult.acrossPan = false;
  //       findOptResult.imatrix = imatrix;
  //       findOptResult.curThickAxes = rectArr[i].axes;
  //     }
  //     this.drawRect(crossCtx, rectArr[i]);
  //   }
  //   crossCanvas.findOptResult = findOptResult;
  //   crossCanvas.crossPos = crossPos;
  //   return crossCanvas;
  // },
  checkOldAxes(canvasPos, mipRange) {
    let { x, y } = canvasPos;
    let { rangeX, rangeY } = mipRange;
    let resp = null;
    if (x != undefined && y != undefined) {
      if (Math.abs(x) < findRange) {
        resp = "y";
      }
      if (Math.abs(y) < findRange) {
        resp = "x";
      }
      if (rangeX > 1 && Math.abs(Math.abs(y) - rangeX) < findRange) {
        resp = "x";
      }
      if (rangeY > 1 && Math.abs(Math.abs(x) - rangeY) < findRange) {
        resp = "y";
      }
    }
    return resp;
  },
  /**
   * 判断canvasPos距离哪条轴最近，并结合mipRange限制返回axes名称
   * @param {Object} canvasPos - {x, y}
   * @param {Array} lineArr - [{x1, y1, x2, y2, axes, ...}, ...]
   * @param {Object} mipRange - {rangeX, rangeY}
   * @returns {string|null}
   */
  checkAxes(canvasPos, lineArr, mipRange) {
    if (!canvasPos || !lineArr || !Array.isArray(lineArr)) return null;
    let minDist = Infinity;
    let resultAxes = null;
    let { x, y } = canvasPos;
    let { rangeX = 0, rangeY = 0 } = mipRange;

    for (let line of lineArr) {
      const { axes } = line;
      const { x1, y1, x2, y2 } = line.c;
      const dx = x2 - x1,
        dy = y2 - y1;
      const len2 = dx * dx + dy * dy;
      if (len2 < 1e-6) continue;
      let t = ((x - x1) * dx + (y - y1) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
      const px = x1 + t * dx;
      const py = y1 + t * dy;
      const dist = Math.hypot(x - px, y - py);

      // x/y轴需要同时满足区间距离和点到线距离
      if (
        axes === "x" &&
        rangeX > 1 &&
        Math.abs(Math.abs(y) - rangeX) < findRange
      ) {
        if (dist < minDist && dist < findRange) {
          minDist = dist;
          resultAxes = axes;
        }
        continue;
      }
      if (
        axes === "y" &&
        rangeY > 1 &&
        Math.abs(Math.abs(x) - rangeY) < findRange
      ) {
        if (dist < minDist && dist < findRange) {
          minDist = dist;
          resultAxes = axes;
        }
        continue;
      }
      // 其它轴，或x/y轴但不在区间时，正常距离判断
      if (
        (axes !== "x" && axes !== "y") ||
        (!(axes === "x" && rangeX > 1) && !(axes === "y" && rangeY > 1))
      ) {
        if (dist < minDist && dist < findRange) {
          minDist = dist;
          resultAxes = axes;
        }
      }
    }
    return resultAxes;
  },
  checkButton(canvasPos, centerPos) {
    let resp = false;
    if (canvasPos && centerPos) {
      let { x: fx, y: fy } = canvasPos;
      let { x: cx, y: cy, r: cr } = centerPos;
      if (Math.abs(cx - fx) <= cr && Math.abs(cy - fy) <= cr) {
        resp = true;
      }
    }
    return resp;
  },
  getNeedAxesOfPosLine(curViewMod_now, curViewMod_choosed) {
    //根据颜色匹配
    let colorDic = [colorT, colorC, colorS];
    let needColor = colorDic[curViewMod_choosed];
    let axesColor = this.positionLine["curViewMod" + curViewMod_now.toString()];
    if (axesColor.colorX == needColor) return "x";
    if (axesColor.colorY == needColor) return "y";
  },

  //mip的十字定位的样式
  getMIPLine(colorX, colorY) {
    let lineArr = [];
    let defaultDottSytle = [];
    lineArr = [
      {
        strokeStyle: colorX,
        c: { x1: -crossCD, y1: 0, x2: crossCD, y2: 0 },
        axes: "x",
        dottSytle: defaultDottSytle,
        lineWidth: 1,
      },
      {
        strokeStyle: colorY,
        c: { x1: 0, y1: -crossCD, x2: 0, y2: crossCD },
        axes: "y",
        dottSytle: defaultDottSytle,
        lineWidth: 1,
      },
    ];
    return lineArr;
  },
  //定位线的样式
  getPosLine(colorX, colorY) {
    let lineArr = [];
    let defaultDottSytle = [];
    lineArr = [
      {
        strokeStyle: colorX,
        c: { x1: -crossLL, y1: 0, x2: crossLL, y2: 0 },
        axes: "x",
        dottSytle: defaultDottSytle,
        lineWidth: 1,
      },
      {
        strokeStyle: colorY,
        c: { x1: 0, y1: -crossLL, x2: 0, y2: crossLL },
        axes: "y",
        dottSytle: defaultDottSytle,
        lineWidth: 1,
      },
    ];
    return lineArr;
  },
  //添加坐标轴
  getAcrossAxesLine(colorX, colorY) {
    let lineArr = [];
    let defaultDottSytle = [];
    //添加顺序为x-,x+,y-,y+
    lineArr = [
      {
        strokeStyle: colorX,
        c: { x1: -crossLL, y1: 0, x2: -crossCD, y2: 0 },
        axes: "x",
        dottSytle: defaultDottSytle,
        lineWidth: 1,
      },
      {
        strokeStyle: colorX,
        c: { x1: crossCD, y1: 0, x2: crossLL, y2: 0 },
        axes: "x",
        dottSytle: defaultDottSytle,
        lineWidth: 1,
      },
      {
        strokeStyle: colorY,
        c: { x1: 0, y1: -crossLL, x2: 0, y2: -crossCD },
        axes: "y",
        dottSytle: defaultDottSytle,
        lineWidth: 1,
      },
      {
        strokeStyle: colorY,
        c: { x1: 0, y1: crossCD, x2: 0, y2: crossLL },
        axes: "y",
        dottSytle: defaultDottSytle,
        lineWidth: 1,
      },
    ];
    return lineArr;
  },
  //添加层厚坐标轴
  addAcrossMipLine(lineArr, mipRange) {
    let { rangeX: thicknessX, rangeY: thicknessY } = mipRange;
    const thickLineDottSytle = [7, 5];
    // x轴厚度线
    if (thicknessX > 0) {
      lineArr
        .filter((l) => {
          return l.axes === "x";
        })
        .forEach((base) => {
          const { x1, y1, x2, y2 } = base.c;
          const dx = x2 - x1,
            dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len < 1e-6) return;
          const nx = -dy / len,
            ny = dx / len; // 顺时针法向

          // 上侧
          let ele1 = JSON.parse(JSON.stringify(base));
          ele1.dottSytle = thickLineDottSytle;
          ele1.c.x1 = x1 + nx * thicknessX;
          ele1.c.y1 = y1 + ny * thicknessX;
          ele1.c.x2 = x2 + nx * thicknessX;
          ele1.c.y2 = y2 + ny * thicknessX;
          lineArr.push(ele1);

          // 下侧
          let ele2 = JSON.parse(JSON.stringify(base));
          ele2.dottSytle = thickLineDottSytle;
          ele2.c.x1 = x1 - nx * thicknessX;
          ele2.c.y1 = y1 - ny * thicknessX;
          ele2.c.x2 = x2 - nx * thicknessX;
          ele2.c.y2 = y2 - ny * thicknessX;
          lineArr.push(ele2);
        });
    }

    // y轴厚度线
    if (thicknessY > 0) {
      lineArr
        .filter((l) => {
          return l.axes === "y";
        })
        .forEach((base) => {
          const { x1, y1, x2, y2 } = base.c;
          const dx = x2 - x1,
            dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len < 1e-6) return;
          const nx = -dy / len,
            ny = dx / len; // 顺时针法向

          // 左侧
          let ele1 = JSON.parse(JSON.stringify(base));
          ele1.dottSytle = thickLineDottSytle;
          ele1.c.x1 = x1 + nx * thicknessY;
          ele1.c.y1 = y1 + ny * thicknessY;
          ele1.c.x2 = x2 + nx * thicknessY;
          ele1.c.y2 = y2 + ny * thicknessY;
          lineArr.push(ele1);

          // 右侧
          let ele2 = JSON.parse(JSON.stringify(base));
          ele2.dottSytle = thickLineDottSytle;
          ele2.c.x1 = x1 - nx * thicknessY;
          ele2.c.y1 = y1 - ny * thicknessY;
          ele2.c.x2 = x2 - nx * thicknessY;
          ele2.c.y2 = y2 - ny * thicknessY;
          lineArr.push(ele2);
        });
    }

    return lineArr;
  },
  addOldAcrossMipLine(lineArr, mipRange) {
    let { rangeX, rangeY } = mipRange;
    let thickLineDottSytle = [7, 5];
    if (rangeX > 0) {
      for (let i = 0; i < 2; i++) {
        let ele1 = JSON.parse(JSON.stringify(lineArr[i]));
        ele1.dottSytle = thickLineDottSytle;
        ele1.c.y1 = -rangeX;
        ele1.c.y2 = -rangeX;
        lineArr.push(ele1);
        let ele2 = JSON.parse(JSON.stringify(ele1));
        ele2.c.y1 = rangeX;
        ele2.c.y2 = rangeX;
        lineArr.push(ele2);
      }
    }
    if (rangeY > 0) {
      for (let i = 2; i < 4; i++) {
        let ele1 = JSON.parse(JSON.stringify(lineArr[i]));
        ele1.dottSytle = thickLineDottSytle;
        ele1.c.x1 = -rangeY;
        ele1.c.x2 = -rangeY;
        lineArr.push(ele1);
        let ele2 = JSON.parse(JSON.stringify(ele1));
        ele2.c.x1 = rangeY;
        ele2.c.x2 = rangeY;
        lineArr.push(ele2);
      }
    }
    return lineArr;
  },
  //添加旋转按钮
  getAcrossRotateButton(circleDis, colorX, colorY) {
    const rForCircle = 8,
      circle = [];
    circle[0] = {
      c: { x: -circleDis, y: 0, r: rForCircle },
      ifFill: false,
      strokeStyle: colorX,
      fillStyle: colorX,
      axes: "x",
    };
    circle[1] = {
      c: { x: circleDis, y: 0, r: rForCircle },
      ifFill: false,
      strokeStyle: colorX,
      fillStyle: colorX,
      axes: "x",
    };
    circle[2] = {
      c: { x: 0, y: -circleDis, r: rForCircle },
      ifFill: false,
      strokeStyle: colorY,
      fillStyle: colorY,
      axes: "y",
    };
    circle[3] = {
      c: { x: 0, y: circleDis, r: rForCircle },
      ifFill: false,
      strokeStyle: colorY,
      fillStyle: colorY,
      axes: "y",
    };
    return circle;
  },
  //添加mip层厚按钮
  getAcrossMipButton(rectDis, colorX, colorY, mipRange) {
    const rForRect = 6,
      rect = [];
    let { rangeX, rangeY } = mipRange;
    if (rangeX > 1) {
      rect[0] = {
        c: { x: -rectDis, y: -rangeX, r: rForRect },
        ifFill: false,
        strokeStyle: colorX,
        fillStyle: colorX,
        axes: "x",
      };
      rect[1] = {
        c: { x: rectDis, y: -rangeX, r: rForRect },
        ifFill: false,
        strokeStyle: colorX,
        fillStyle: colorX,
        axes: "x",
      };
      rect[2] = {
        c: { x: -rectDis, y: rangeX, r: rForRect },
        ifFill: false,
        strokeStyle: colorX,
        fillStyle: colorX,
        axes: "x",
      };
      rect[3] = {
        c: { x: rectDis, y: rangeX, r: rForRect },
        ifFill: false,
        strokeStyle: colorX,
        fillStyle: colorX,
        axes: "x",
      };
    } else {
      rect[0] = {
        c: { x: -rectDis, y: 0, r: rForRect },
        ifFill: false,
        strokeStyle: colorX,
        fillStyle: colorX,
        axes: "x",
      };
      rect[1] = {
        c: { x: rectDis, y: 0, r: rForRect },
        ifFill: false,
        strokeStyle: colorX,
        fillStyle: colorX,
        axes: "x",
      };
    }
    let indexFromXtoY = rect.length;
    if (rangeY > 1) {
      rect[indexFromXtoY] = {
        c: { x: -rangeY, y: -rectDis, r: rForRect },
        ifFill: false,
        strokeStyle: colorY,
        fillStyle: colorY,
        axes: "y",
      };
      rect[indexFromXtoY + 1] = {
        c: { x: -rangeY, y: rectDis, r: rForRect },
        ifFill: false,
        strokeStyle: colorY,
        fillStyle: colorY,
        axes: "y",
      };
      rect[indexFromXtoY + 2] = {
        c: { x: rangeY, y: -rectDis, r: rForRect },
        ifFill: false,
        strokeStyle: colorY,
        fillStyle: colorY,
        axes: "y",
      };
      rect[indexFromXtoY + 3] = {
        c: { x: rangeY, y: rectDis, r: rForRect },
        ifFill: false,
        strokeStyle: colorY,
        fillStyle: colorY,
        axes: "y",
      };
    } else {
      rect[indexFromXtoY] = {
        c: { x: 0, y: -rectDis, r: rForRect },
        ifFill: false,
        strokeStyle: colorY,
        fillStyle: colorY,
        axes: "y",
      };
      rect[indexFromXtoY + 1] = {
        c: { x: 0, y: rectDis, r: rForRect },
        ifFill: false,
        strokeStyle: colorY,
        fillStyle: colorY,
        axes: "y",
      };
    }
    return rect;
  },
  //获取mip层厚在图像上的值
  getMipRange(pixelSpacingW, pixelSpacingH, mprThickX, mprThickY, scale) {
    let mipRange = { rangeX: 0, rangeY: 0 }; //单位为图像像素
    mipRange.rangeX = (mprThickX / 2 / pixelSpacingW) * scale.x;
    mipRange.rangeY = (mprThickY / 2 / pixelSpacingH) * scale.y;
    return mipRange;
  },
  //画一条直线
  drawLine(ctx, line) {
    let { c, dottSytle, strokeStyle, lineWidth } = line;
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.setLineDash(dottSytle);
    ctx.beginPath();
    ctx.moveTo(c.x1, c.y1);
    ctx.lineTo(c.x2, c.y2);
    ctx.stroke();
    ctx.closePath();
  },
  //画一个圆
  drawCircle(ctx, circle) {
    let { ifFill, strokeStyle, fillStyle, c, lineWidth } = circle;
    ctx.strokeStyle = strokeStyle;
    ctx.fillStyle = fillStyle;
    ctx.setLineDash([]);
    ctx.lineWidth = lineWidth ? lineWidth : 1;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();
    if (ifFill) {
      ctx.fill();
    }
  },
  //画一个矩形
  drawRect(ctx, rect) {
    let { ifFill, strokeStyle, fillStyle, c, lineWidth } = rect;
    ctx.strokeStyle = strokeStyle;
    ctx.fillStyle = fillStyle;
    ctx.setLineDash([]);
    ctx.lineWidth = lineWidth ? lineWidth : 1;
    ctx.beginPath();
    ctx.rect(c.x - c.r, c.y - c.r, 2 * c.r, 2 * c.r);
    ctx.stroke();
    ctx.closePath();
    if (ifFill) {
      ctx.fill();
    }
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
  transformImageAdvanced(
    { rotate = 0, scale = 1 },
    {
      width,
      height,
      data,
      pixelSpacingW = 1,
      pixelSpacingH = 1,
      isColor = false,
      min,
    },
  ) {
    // 预计算变换参数
    const radians = (rotate * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    // 原始图像中心点
    const centerX = width / 2;
    const centerY = height / 2;

    // 先计算变换后的包围盒（不依赖 newCenterX/newCenterY）
    const corners = [
      applyTransformForBoundingBox(0, 0),
      applyTransformForBoundingBox(width, 0),
      applyTransformForBoundingBox(0, height),
      applyTransformForBoundingBox(width, height),
    ];

    // 计算输出尺寸
    const minX = Math.min(...corners.map((p) => p.x));
    const maxX = Math.max(...corners.map((p) => p.x));
    const minY = Math.min(...corners.map((p) => p.y));
    const maxY = Math.max(...corners.map((p) => p.y));
    const newWidth = Math.ceil(maxX - minX);
    const newHeight = Math.ceil(maxY - minY);
    console.log("verticalConcatenate img", newWidth, newHeight);

    // 新图像中心点（此时已初始化）
    const newCenterX = newWidth / 2;
    const newCenterY = newHeight / 2;

    // 创建输出数组
    let valueMin = min;
    if (isColor) valueMin = 0;
    const DataType = data.constructor;
    const channels = isColor ? 4 : 1;
    const newData = new DataType(newWidth * newHeight * channels).fill(
      valueMin,
    );

    // 逆向变换参数
    const invScale = 1 / scale;
    const invDet = 1 / (cos * cos + sin * sin); // 行列式倒数
    const invCos = cos * invDet;
    const invSin = -sin * invDet;

    // 像素遍历逻辑
    for (let ty = 0; ty < newHeight; ty++) {
      for (let tx = 0; tx < newWidth; tx++) {
        // 转换到新坐标系
        const dx = (tx - newCenterX) * invScale;
        const dy = (ty - newCenterY) * invScale;

        // 逆向旋转
        const ox = dx * invCos - dy * invSin + centerX;
        const oy = dx * invSin + dy * invCos + centerY;

        // 采样原始图像
        if (ox >= 0 && ox < width && oy >= 0 && oy < height) {
          const srcIdx = Math.floor(oy) * width + Math.floor(ox);
          newData[ty * newWidth + tx] = data[srcIdx];
        }
      }
    }

    return {
      width: newWidth,
      height: newHeight,
      data: newData,
      pixelSpacingW: pixelSpacingW / scale,
      pixelSpacingH: pixelSpacingH / scale,
      isColor,
    };

    // 包围盒专用变换函数（不依赖 newCenter）
    function applyTransformForBoundingBox(px, py) {
      // 转换为相对中心坐标
      const dx = (px - centerX) * scale;
      const dy = (py - centerY) * scale;

      // 应用旋转
      return {
        x: dx * cos - dy * sin + centerX, // 保持原始坐标系
        y: dx * sin + dy * cos + centerY,
      };
    }
  },
  verticalConcatenate(origBufArr, paraArr, blendType) {
    console.time("verticalConcatenate");
    // 步骤1：批量执行变换
    let valueMin = 0;
    //假设所有图像的初始放置的中心点位置都是[0,0]
    console.time("verticalConcatenate transform");
    const transformedImages = origBufArr.map((img, i) => {
      if (img.min < valueMin) valueMin = img.min;
      const params = paraArr[i];
      //这一步的结果是绕中心做的操作，不计算平移量
      const transformed = this.transformImageAdvanced(params, img);
      return {
        ...transformed,
        offsetX: params.translate.x, // 记录原始平移量
        offsetY: params.translate.y,
      };
    });
    console.timeEnd("verticalConcatenate transform");

    // 步骤2：计算全局边界的世界坐标系位置，注意坐标原点是第0张图的中心点
    const globalBounds = transformedImages.reduce(
      (acc, img) => ({
        minX: Math.min(acc.minX, img.offsetX - img.width / 2),
        minY: Math.min(acc.minY, img.offsetY - img.height / 2),
        maxX: Math.max(acc.maxX, img.offsetX + img.width / 2),
        maxY: Math.max(acc.maxY, img.offsetY + img.height / 2),
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
    );

    // 步骤3：创建输出画布
    const outputWidth = Math.round(globalBounds.maxX - globalBounds.minX);
    const outputHeight = Math.round(globalBounds.maxY - globalBounds.minY);
    console.log("verticalConcatenate out", outputWidth, outputHeight);
    const DataType = transformedImages[0].data.constructor;
    const isColor = transformedImages.some((img) => img.isColor);
    if (isColor) valueMin = 0;
    const outputData = new DataType(
      outputWidth * outputHeight * (isColor ? 4 : 1),
    ).fill(valueMin);
    // 步骤4：像素合成

    const initCerter = [
      Math.floor(transformedImages[0].width / 2),
      Math.floor(transformedImages[0].height / 2),
    ];
    console.time("verticalConcatenate fusion");
    let lastEnd = 0,
      ranggeOverlap = 0;
    transformedImages.forEach((img) => {
      //当前图像的第一个点在画布上的位子
      const startX = initCerter[0] - Math.floor(img.width / 2) + img.offsetX;
      const startY = initCerter[1] - Math.floor(img.height / 2) + img.offsetY;
      if (startY < lastEnd) {
        ranggeOverlap = Math.round(lastEnd - startY);
      }

      lastEnd = startY + img.height;
      for (let y = 0; y < img.height; y++) {
        let factor = 1;
        //重叠区域才有混合
        if (y < ranggeOverlap) {
          factor = y / ranggeOverlap;
        }
        for (let x = 0; x < img.width; x++) {
          //这里没有缩放和旋转了，所以是1:1的
          const outX = startX + x;
          const outY = startY + y;
          if (
            outX < 0 ||
            outX >= outputWidth ||
            outY < 0 ||
            outY >= outputHeight
          )
            continue;

          const inputIdx = (y * img.width + x) * (isColor ? 4 : 1);
          const outputIdx = (outY * outputWidth + outX) * (isColor ? 4 : 1);

          // 混合逻辑
          if (isColor) {
            for (let c = 0; c < 4; c++) {
              outputData[outputIdx + c] = blendPixel(
                outputData[outputIdx + c],
                img.data[inputIdx + c],
                blendType,
                factor, // 渐进混合因子
              );
            }
          } else {
            outputData[outputIdx] = blendPixel(
              outputData[outputIdx],
              img.data[inputIdx],
              blendType,
              factor,
            );
          }
        }
      }
    });
    console.timeEnd("verticalConcatenate fusion");
    console.timeEnd("verticalConcatenate");
    return {
      width: outputWidth,
      height: outputHeight,
      data: outputData,
      pixelSpacingW: Math.min(
        ...transformedImages.map((img) => img.pixelSpacingW),
      ),
      pixelSpacingH: Math.min(
        ...transformedImages.map((img) => img.pixelSpacingH),
      ),
      isColor,
    };

    // 像素混合函数
    function blendPixel(existing, incoming, type, factor) {
      if (factor === 1) return incoming;

      switch (type) {
        case "average":
          return Math.round((existing + incoming) / 2);
        case "max":
          return Math.max(existing, incoming);
        case "min":
          return Math.min(existing, incoming);
        case "progressive":
          return Math.round(existing * (1 - factor) + incoming * factor);
        default:
          throw new Error("未知混合类型: " + type);
      }
    }
  },
  canvseToScreen(canvasPos, imatrix) {
    let { x, y } = canvasPos;
    const { a, b, c, d, e, f } = imatrix;

    const screenX = (c * y - d * x + d * e - c * f) / (b * c - a * d);
    const screenY = (y - screenX * b - f) / d;

    return {
      x: Math.round(screenX),
      y: Math.round(screenY),
    };
  },

  screenToCanvas(screenPos, imatrix) {
    let { x, y } = screenPos;
    const { a, b, c, d, e, f } = imatrix;

    return {
      x: Math.round(x * a + y * c + e),
      y: Math.round(x * b + y * d + f),
    };
  },
};

export default CROSS;
