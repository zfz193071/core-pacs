import CROSS from "./crosshair";
import MATRIX from "./matrix";
let TRANSF = {
  volumeInfoTrans(seriesInfo, registPara, curViewMod) {
    let {
      ImagePositionPatient: IP,
      volumeOrientation,
      volumeSpacing,
      volumeSize,
    } = seriesInfo;
    let VO = volumeOrientation[0],
      VSpacing = volumeSpacing[0],
      VSize = volumeSize[0];
    let newIP = JSON.parse(JSON.stringify(IP)),
      newVO = JSON.parse(JSON.stringify(VO)),
      newVSize = JSON.parse(JSON.stringify(VSize)),
      newVSpacing = JSON.parse(JSON.stringify(VSpacing));

    let centerOnWorld = CROSS.volumeToWorld(seriesInfo, {
      i: VSize.w / 2,
      j: VSize.h / 2,
      k: VSize.d / 2,
    });
    //求原始立方体的初始顶点
    let eightPoint = [
      { i: 0, j: 0, k: 0 },
      { i: VSize.w, j: 0, k: 0 },
      { i: 0, j: volumeSize[1].h, k: 0 },
      { i: VSize.w, j: VSize.h, k: 0 },
      { i: 0, j: 0, k: VSize.d },
      { i: VSize.w, j: 0, k: VSize.d },
      { i: 0, j: VSize.h, k: VSize.d },
      { i: VSize.w, j: VSize.h, k: VSize.d },
    ];
    //求初始顶点相对于原始图像中心的坐标(世界坐标系下)
    let cEightPoint = [];
    for (let i = 0; i < 8; i++) {
      let ele = CROSS.volumeToWorld_center0(seriesInfo, eightPoint[i]);
      cEightPoint.push(ele);
    }

    //加入初始坐标，用于计算原始的volume加上配准参数之后，旋转到正位世界坐标系的旋转矩阵，取得横断面，冠状面和矢状面的切片
    let rotateAxes = CROSS.getRotateAxes(registPara, curViewMod, VO.flat());

    let roteMatrix_forward = [
      [rotateAxes[0], rotateAxes[1], rotateAxes[2]],
      [rotateAxes[4], rotateAxes[5], rotateAxes[6]],
      [rotateAxes[8], rotateAxes[9], rotateAxes[10]],
    ];
    let roteMatrix = MATRIX.matrix_inv(roteMatrix_forward);

    //图像中心点为原点
    let newEightPoint = [];
    for (let i = 0; i < 8; i++) {
      let oPos = [[cEightPoint[i].x], [cEightPoint[i].y], [cEightPoint[i].z]];
      let nPos = MATRIX.matrix_multiply(roteMatrix_forward, oPos);
      let ele = { x: nPos[0][0], y: nPos[1][0], z: nPos[2][0] };
      newEightPoint.push(ele);
    }
    //构建一个最小的立方体，包裹新数据
    let xMax = Math.max(
        newEightPoint[0].x,
        newEightPoint[1].x,
        newEightPoint[2].x,
        newEightPoint[3].x,
        newEightPoint[4].x,
        newEightPoint[5].x,
        newEightPoint[6].x,
        newEightPoint[7].x,
      ),
      yMax = Math.max(
        newEightPoint[0].y,
        newEightPoint[1].y,
        newEightPoint[2].y,
        newEightPoint[3].y,
        newEightPoint[4].y,
        newEightPoint[5].y,
        newEightPoint[6].y,
        newEightPoint[7].y,
      ),
      zMax = Math.max(
        newEightPoint[0].z,
        newEightPoint[1].z,
        newEightPoint[2].z,
        newEightPoint[3].z,
        newEightPoint[4].z,
        newEightPoint[5].z,
        newEightPoint[6].z,
        newEightPoint[7].z,
      ),
      xMin = Math.min(
        newEightPoint[0].x,
        newEightPoint[1].x,
        newEightPoint[2].x,
        newEightPoint[3].x,
        newEightPoint[4].x,
        newEightPoint[5].x,
        newEightPoint[6].x,
        newEightPoint[7].x,
      ),
      yMin = Math.min(
        newEightPoint[0].y,
        newEightPoint[1].y,
        newEightPoint[2].y,
        newEightPoint[3].y,
        newEightPoint[4].y,
        newEightPoint[5].y,
        newEightPoint[6].y,
        newEightPoint[7].y,
      ),
      zMin = Math.min(
        newEightPoint[0].z,
        newEightPoint[1].z,
        newEightPoint[2].z,
        newEightPoint[3].z,
        newEightPoint[4].z,
        newEightPoint[5].z,
        newEightPoint[6].z,
        newEightPoint[7].z,
      );

    //旋转后的图像在世界坐标系下的左上角原点,必须取这个点，因为要考虑转了180度的情况

    let minSP = Math.min(VSpacing.w, VSpacing.h, VSpacing.d);
    let SPMIN = 0.3;
    if (minSP < SPMIN) minSP = SPMIN; //重采样的最小分辨率不小于5
    newVSize = {
      w: parseInt((xMax - xMin) / minSP),
      h: parseInt((yMax - yMin) / minSP),
      d: parseInt((zMax - zMin) / minSP),
    };
    let SIZEMAX = 512;
    if (newVSize.w > SIZEMAX) newVSize.w = SIZEMAX;
    if (newVSize.h > SIZEMAX) newVSize.h = SIZEMAX;
    if (newVSize.d > SIZEMAX) newVSize.d = SIZEMAX;
    newVSpacing = {
      w: (xMax - xMin) / newVSize.w,
      h: (yMax - yMin) / newVSize.h,
      d: (zMax - zMin) / newVSize.d,
    };

    //新世界坐标系都是正位的，只需要考虑横断面矢状面和冠状面
    let newAxes = CROSS.getRotateAxes(undefined, curViewMod, undefined);
    newVO = [
      [newAxes[0], newAxes[1], newAxes[2]],
      [newAxes[4], newAxes[5], newAxes[6]],
      [newAxes[8], newAxes[9], newAxes[10]],
    ];

    let trans = { x: 0, y: 0, z: 0 };
    if (registPara && registPara.trans) {
      trans = { ...registPara.trans };
    }
    //新数据的中心点在世界坐标系下的位置
    let dic = ["x", "y", "z"];
    for (let i = 0; i < 3; i++) {
      newIP[i] =
        trans[dic[i]] +
        centerOnWorld[dic[i]] -
        (newVO[0][i] * newVSize.w * newVSpacing.w) / 2 -
        (newVO[1][i] * newVSize.h * newVSpacing.h) / 2 -
        (newVO[2][i] * newVSize.d * newVSpacing.d) / 2;
    }

    let newVolumeSpacing = [
      {
        w: newVSpacing.w,
        h: newVSpacing.h,
        d: newVSpacing.d,
      },
    ];
    let newVolumeSize = [
      {
        w: newVSize.w,
        h: newVSize.h,
        d: newVSize.d,
      },
    ];
    let eX = newVO[0],
      eY = newVO[1],
      eZ = newVO[2];
    let newVolumeOrientation = [[eX, eY, eZ]];
    //newVO 是新的世界坐标系下的图像方向，roteMatrix是原始图像到新图像的旋转矩阵
    return {
      ImagePositionPatient: newIP,
      volumeOrientation: newVolumeOrientation,
      volumeSize: newVolumeSize,
      volumeSpacing: newVolumeSpacing,
      roteMatrix,
    };
  },

  INITDWI() {
    return {
      pixelSpacingW: 1,
      pixelSpacingH: 1,
      pixelSpacingD: 1,
      leftTopPos: { x: 0, y: 0, z: 0 },
      imgorient: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      origBuf: {},
    };
  },
  sliceInfoTrans(newInfo, AcrossPoint) {
    //世界坐标到新数据的图像位置
    let crossOnVolume = CROSS.worldToVolume(newInfo, AcrossPoint);
    let DWI = this.INITDWI();
    DWI.pixelSpacingW = newInfo.volumeSpacing[0].w;
    DWI.pixelSpacingH = newInfo.volumeSpacing[0].h;
    DWI.pixelSpacingD = newInfo.volumeSpacing[0].d;
    DWI.imgorient = newInfo.volumeOrientation[0];
    let dForce = crossOnVolume.k;

    //这里取个整数
    DWI.curImageNum = Math.round(dForce);
    let dic = ["x", "y", "z"];
    for (let i = 0; i < 3; i++) {
      DWI.leftTopPos[dic[i]] =
        newInfo.ImagePositionPatient[i] +
        dForce * newInfo.volumeSpacing[0].d * DWI.imgorient[2][i];
    }
    return DWI;
  },

  sliceDataTrans(DWI, poorObj, newInfo) {
    //初始化一个arraybuffer
    let { volumeBuffer, info: origInfo, volumeImageData } = poorObj;
    let newBuf;
    let { volumeSpacing, volumeSize } = origInfo;
    let orgP = [volumeSpacing[0].w, volumeSpacing[0].h, volumeSpacing[0].d];
    let { w: width_0, h: height_0, d: depth_0 } = volumeSize[0];
    let length_o = width_0 * height_0;
    let minValue = volumeImageData.getPointData().getScalars().getRange()[0];

    let {
      volumeSize: newVSize,
      volumeSpacing: newVSpacing,
      roteMatrix,
    } = newInfo;
    let { w: width, h: height, d: depth } = newVSize[0];
    let { w: pw, h: ph, d: pd } = newVSpacing[0];
    let forceD = (DWI.curImageNum - depth / 2) * pd,
      hW = width / 2,
      hH = height / 2;
    //到这一步只给浮点数或者short整数
    let length = width * height;
    if (volumeBuffer.BYTES_PER_ELEMENT === 4) {
      newBuf = new Float32Array(length);
    } else if (volumeBuffer.BYTES_PER_ELEMENT === 2) {
      newBuf = new Int16Array(length);
    }

    //这个函数可以作为GPU运算的核函数
    function getValueForRote(
      roteMatrix,
      hW,
      pw,
      hH,
      ph,
      forceD,
      volumeBuffer,
      orgP,
      width,
      height,
      depth,
      length,
      minValue,
      i,
      j,
    ) {
      let value = minValue;
      let curPosX = (i - hW) * pw;
      let curPosY = (j - hH) * ph;
      let curPosZ = forceD;

      let mapPosX =
        roteMatrix[0][0] * curPosX +
        roteMatrix[0][1] * curPosY +
        roteMatrix[0][2] * curPosZ;
      let mapPosY =
        roteMatrix[1][0] * curPosX +
        roteMatrix[1][1] * curPosY +
        roteMatrix[1][2] * curPosZ;
      let mapPosZ =
        roteMatrix[2][0] * curPosX +
        roteMatrix[2][1] * curPosY +
        roteMatrix[2][2] * curPosZ;

      let a = mapPosX / orgP[0] + width / 2;
      let b = mapPosY / orgP[1] + height / 2;
      let c = -mapPosZ / orgP[2] + depth / 2;

      let a1 = Math.floor(a),
        b1 = Math.floor(b),
        c1 = Math.floor(c);
      let a2 = Math.ceil(a),
        b2 = Math.ceil(b),
        c2 = Math.ceil(c);

      if (
        a1 >= 0 &&
        a2 < width &&
        b1 >= 0 &&
        b2 < height &&
        c1 >= 0 &&
        c2 < depth
      ) {
        let idx1 = c1 * length + b1 * width;
        let idx2 = c1 * length + b2 * width;
        let idx3 = c2 * length + b1 * width;
        let idx4 = c2 * length + b2 * width;

        let v1 = volumeBuffer[idx1 + a1];
        let v2 = volumeBuffer[idx1 + a2];
        let v3 = volumeBuffer[idx2 + a1];
        let v4 = volumeBuffer[idx2 + a2];
        let v5 = volumeBuffer[idx3 + a1];
        let v6 = volumeBuffer[idx3 + a2];
        let v7 = volumeBuffer[idx4 + a1];
        let v8 = volumeBuffer[idx4 + a2];

        let x1 = a1 === a2 ? v1 : (a2 - a) * v1 + (a - a1) * v2;
        let x2 = a1 === a2 ? v3 : (a2 - a) * v3 + (a - a1) * v4;
        let x3 = a1 === a2 ? v5 : (a2 - a) * v5 + (a - a1) * v6;
        let x4 = a1 === a2 ? v7 : (a2 - a) * v7 + (a - a1) * v8;

        let y1 = b1 === b2 ? x1 : (b2 - b) * x1 + (b - b1) * x2;
        let y2 = b1 === b2 ? x3 : (b2 - b) * x3 + (b - b1) * x4;

        value = c1 === c2 ? y1 : (c2 - c) * y1 + (c - c1) * y2;
      }

      return value;
    }

    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        newBuf[j * width + i] = getValueForRote(
          roteMatrix,
          hW,
          pw,
          hH,
          ph,
          forceD,
          volumeBuffer,
          orgP,
          width_0,
          height_0,
          depth_0,
          length_o,
          minValue,
          i,
          j,
        );
      }
    }

    DWI.origBuf = {
      width,
      height,
      data: newBuf,
    };
    // try {
    //     //在二维切片的计算里，GPU计算的性能提升有限，暂时不使用这个方法
    //     throw ("GPU error")
    //     const gpulib = new GPU({ mode: "gpu" });
    //     const transDataForRote = gpulib.createKernel(function (roteMatrix, hW, pw, hH, ph, forceD, volumeBuffer, orgP, width_0, height_0, depth_0, length_o, minValue) {
    //         let i = this.thread.x;
    //         let j = this.thread.y;
    //         return getValueForRote(roteMatrix, hW, pw, hH, ph, forceD, volumeBuffer, orgP, width_0, height_0, depth_0, length_o, minValue, i, j)

    //     })
    //         .setOutput([width, height])
    //         .setFunctions([getValueForRote])
    //     console.time("gpu calcu") //约30到40毫秒
    //     let arr = transDataForRote(roteMatrix, hW, pw, hH, ph, forceD, volumeBuffer, orgP, width_0, height_0, depth_0, length_o, minValue);
    //     console.timeEnd("gpu calcu")
    //     // 这一步只需要不到1毫秒，可以忽略不计
    //     for (let i = 0; i < width; i++) {
    //         for (let j = 0; j < height; j++) {
    //             newBuf[j * width + i] = arr[j][i]
    //         }
    //     }
    // }
    // catch (error) {
    //     console.log("try gpu error && try cpu again", error)
    //     //CPU计算
    //     console.time("cpu calcu") //约10到20毫秒
    //     for (let j = 0; j < height; j++) {
    //         for (let i = 0; i < width; i++) {
    //             newBuf[j * width + i] = getValueForRote(roteMatrix, hW, pw, hH, ph, forceD, volumeBuffer, orgP, width_0, height_0, depth_0, length_o, minValue, i, j)
    //         }
    //     }
    //     console.timeEnd("cpu calcu")
    // }
  },

  getParaDWI(
    seriesInfo,
    poorObj,
    AcrossPoint,
    curViewMod,
    registPara = undefined,
  ) {
    let { volumeImageData } = poorObj;
    if (!registPara) {
      registPara = poorObj.registPara || undefined;
    }
    let DWI = this.INITDWI();
    //没有三维数据直接返回
    if (!volumeImageData) {
      return DWI;
    }
    //这里得到的是当前视图的原始数据
    //这里只计算了
    let newInfo = this.volumeInfoTrans(seriesInfo, registPara, curViewMod);

    DWI = this.sliceInfoTrans(newInfo, AcrossPoint);
    //确定一个数据的范围
    this.sliceDataTrans(DWI, poorObj, newInfo);
    DWI.width = DWI.origBuf?.width || 1;
    DWI.height = DWI.origBuf?.height || 1;
    return DWI;
  },
};

export default TRANSF;
