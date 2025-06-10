import CROSS from "./crosshair.js";
import vtkImageReslice from "@kitware/vtk.js/Imaging/Core/ImageReslice.js";
import TRANSF from "./transf.js";

let LOAD = {
  createDataArray(
    length,
    mode,
    isForceFloat = false,
    volumeBuffer = null,
    index,
    ifForceShort,
  ) {
    // ifForceShort = true;
    if (volumeBuffer) {
      let buf = volumeBuffer.buffer;
      if (mode === "PT" || isForceFloat) {
        let offset = length * index * 4;
        return new Float32Array(buf, offset, length);
      } else if (ifForceShort) {
        let offset = length * index * 2;
        return new Uint16Array(buf, offset, length);
      } else {
        let offset = length * index * 2;
        return new Int16Array(buf, offset, length);
      }
    }

    if (mode === "PT" || isForceFloat) {
      return new Float32Array(length);
    } else if (ifForceShort) {
      return new Uint16Array(length);
    } else {
      return new Int16Array(length);
    }
  },

  //初始化放大镜
  getMagnify(canvasCxt) {
    const wh = 200;
    let magnifydata = canvasCxt.createImageData(wh, wh);
    let [glasssize, color1, color2] = [wh, 100, 50];
    let tempxy;
    for (let hsx1 = 0; hsx1 < glasssize * glasssize; hsx1++) {
      magnifydata.data[hsx1 * 4] = 154;
      magnifydata.data[hsx1 * 4 + 3] = 255;
    }
    for (let hsx1 = 0; hsx1 < glasssize; hsx1++) {
      for (let hsx2 = 0; hsx2 < glasssize; hsx2++) {
        let hsr1 = hsx1 - (wh / 2 - 1);
        let hsr2 = hsx2 - (wh / 2 - 1);
        let hsr3 = Math.sqrt(hsr2 * hsr2 + hsr1 * hsr1);
        if (hsr3 > wh / 2) {
          magnifydata.data[(hsx1 * glasssize + hsx2) * 4 + 3] = 0;
          for (let hsx3 = 0; hsx3 < 4; hsx3++) {
            switch (hsx3) {
              case 0:
                tempxy = (hsx1 + 1) * glasssize + hsx2;
                break;
              case 1:
                tempxy = (hsx1 - 1) * glasssize + hsx2;
                break;
              case 2:
                tempxy = hsx1 * glasssize + hsx2 + 1;
                break;
              case 3:
                tempxy = hsx1 * glasssize + hsx2 - 1;
                break;
            }
            if (tempxy >= 0 && tempxy < glasssize * glasssize) {
              magnifydata.data[tempxy * 4] = color1;
              magnifydata.data[tempxy * 4 + 1] = color1;
              magnifydata.data[tempxy * 4 + 2] = color1;
            }
          }
        }
      }
    }
    for (let hsx1 = 0; hsx1 < glasssize; hsx1++) {
      magnifydata.data[hsx1 * glasssize * 4] = color1;
      magnifydata.data[hsx1 * glasssize * 4 + 1] = color1;
      magnifydata.data[hsx1 * glasssize * 4 + 2] = color1;
      magnifydata.data[(hsx1 * glasssize + glasssize - 1) * 4] = color1;
      magnifydata.data[(hsx1 * glasssize + glasssize - 1) * 4 + 1] = color1;
      magnifydata.data[(hsx1 * glasssize + glasssize - 1) * 4 + 2] = color1;
      magnifydata.data[hsx1 * 4] = color1;
      magnifydata.data[hsx1 * 4 + 1] = color1;
      magnifydata.data[hsx1 * 4 + 2] = color1;
      magnifydata.data[((glasssize - 1) * glasssize + hsx1) * 4] = color1;
      magnifydata.data[((glasssize - 1) * glasssize + hsx1) * 4 + 1] = color1;
      magnifydata.data[((glasssize - 1) * glasssize + hsx1) * 4 + 2] = color1;
    }
    for (let hsx1 = 0; hsx1 < glasssize; hsx1++) {
      magnifydata.data[(hsx1 * glasssize + (wh / 2 - 1)) * 4] = color2;
      magnifydata.data[(hsx1 * glasssize + (wh / 2 - 1)) * 4 + 1] = color2;
      magnifydata.data[(hsx1 * glasssize + (wh / 2 - 1)) * 4 + 2] = color2;
      magnifydata.data[(hsx1 * glasssize + wh / 2) * 4] = color2;
      magnifydata.data[(hsx1 * glasssize + wh / 2) * 4 + 1] = color2;
      magnifydata.data[(hsx1 * glasssize + wh / 2) * 4 + 2] = color2;
      magnifydata.data[((wh / 2 - 1) * glasssize + hsx1) * 4] = color2;
      magnifydata.data[((wh / 2 - 1) * glasssize + hsx1) * 4 + 1] = color2;
      magnifydata.data[((wh / 2 - 1) * glasssize + hsx1) * 4 + 2] = color2;
      magnifydata.data[((wh / 2) * glasssize + hsx1) * 4] = color2;
      magnifydata.data[((wh / 2) * glasssize + hsx1) * 4 + 1] = color2;
      magnifydata.data[((wh / 2) * glasssize + hsx1) * 4 + 2] = color2;
    }
    return magnifydata;
  },
  //放大镜
  drawMagnify(
    yx,
    yy,
    canvasCxt,
    magnifydata,
    imageData,
    canvasSize,
    buf,
    that,
  ) {
    const wh = 200;
    let tempdata = canvasCxt.createImageData(wh, wh);
    let px = yx,
      py = yy;
    let tempxy, tempxy2;
    for (let hsx1 = 0; hsx1 < wh * wh * 4; hsx1++) {
      tempdata.data[hsx1] = magnifydata.data[hsx1];
    }
    let tempimgdata = canvasCxt.getImageData(
      px - wh / 4,
      py - wh / 4,
      wh / 2,
      wh / 2,
    );
    let tempimgdata1 = canvasCxt.getImageData(px - wh / 2, py - wh / 2, wh, wh);
    let data0 = tempimgdata.data;
    let data1 = tempimgdata1.data;
    for (let hsx1 = 0; hsx1 < wh; hsx1++) {
      for (let hsx2 = 0; hsx2 < wh; hsx2++) {
        tempxy = hsx1 * wh + hsx2;
        if (tempdata.data[tempxy * 4] === 154) {
          tempxy2 = Math.floor(hsx1 / 2) * 100 + Math.floor(hsx2 / 2);
          tempdata.data[tempxy * 4] = data0[tempxy2 * 4];
          tempdata.data[tempxy * 4 + 1] = data0[tempxy2 * 4 + 1];
          tempdata.data[tempxy * 4 + 2] = data0[tempxy2 * 4 + 2];
        }
        if (tempdata.data[tempxy * 4 + 3] === 0) {
          tempdata.data[tempxy * 4] = data1[tempxy * 4];
          tempdata.data[tempxy * 4 + 1] = data1[tempxy * 4 + 1];
          tempdata.data[tempxy * 4 + 2] = data1[tempxy * 4 + 2];
          tempdata.data[tempxy * 4 + 3] = data1[tempxy * 4 + 3];
        }
      }
    }
    canvasCxt.putImageData(tempdata, px - wh / 2, py - wh / 2);
    return; //放大镜统一都不显示像素值
  },
  getDataWithInfo(
    poorObj,
    seriesInfo,
    curViewMod,
    curImageNum,
    DWIUID = undefined,
    AcrossPoint = null,
    loadSource = undefined,
    regPara = undefined, // 用于传递一个配准的参数
  ) {
    // loadSource 为 reconSlicer 时，使用 reconSlicer 加载数据
    if (!loadSource) {
      //按需要选择,不传十字定位，一定是org
      loadSource = "org";
      if (
        AcrossPoint &&
        seriesInfo.regRotePara &&
        poorObj.imageDone &&
        !seriesInfo.isNotUniformSquence
      ) {
        loadSource = "reconSlicer";
      }
    }
    try {
      if (loadSource === "org") {
        console.time("orgTime");
        let resp = this.getOrgDWI(poorObj, seriesInfo, curViewMod, curImageNum);
        console.timeEnd("orgTime");
        resp.DWIUID = DWIUID;
        return resp;
      }
      if (loadSource === "reconSlicer") {
        //这里只需要加一个旋转参数
        if (!regPara) {
          regPara = {
            dRote: seriesInfo.regRotePara,
          };
        }
        // console.time("slicerTime1"); //30到40ms
        // let curDWI = this.getVtkSlicerDWI(seriesInfo, poorObj, curViewMod, AcrossPoint, regPara);
        // //测试GPU的方法
        // console.timeEnd("slicerTime1");
        console.time("slicerTime2"); //10到20ms
        let curDWI = TRANSF.getParaDWI(
          seriesInfo,
          poorObj,
          AcrossPoint,
          curViewMod,
          regPara,
        );
        console.timeEnd("slicerTime2");
        curDWI.DWIUID = DWIUID;
        return curDWI;
      }
    } catch (e) {
      console.log("getDataWithInfo error", e);
      //默认返回空数据
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
    }
  },
  //regPara 为配准参数
  getVtkSlicerDWI(
    seriesInfo,
    poorObj,
    curViewMod,
    AcrossPoint,
    regPara = undefined,
  ) {
    let { volumeImageData, volumeBuffer } = poorObj;
    //平移参数加在volume Origin上
    let initOrigin = volumeImageData.getOrigin();
    let curOrigin = seriesInfo.ImagePositionPatient;
    volumeImageData.setOrigin(curOrigin);

    let axes = CROSS.getAxesForVTKSlicer(
      volumeImageData,
      AcrossPoint,
      curViewMod,
      regPara,
    );
    let outTyep = "Int16Array";
    if (volumeBuffer.BYTES_PER_ELEMENT === 4) outTyep = "Float32Array";
    const imageReslice = vtkImageReslice.newInstance();
    imageReslice.setInputData(volumeImageData);
    imageReslice.setOutputDimensionality(2);
    imageReslice.setBackgroundColor(255, 255, 255, 255);
    imageReslice.setSlabMode(1); //最大密度投影，最小密度投影，平均密度投影，求和密度投影
    imageReslice.setSlabNumberOfSlices(1); //在这里不处理层厚
    // 设置成一个统一的分辨率保证图像质量
    let spacing = seriesInfo.volumeSpacing[curViewMod];
    let minSpacing = Math.min(spacing.w, spacing.h, spacing.d);
    if (minSpacing > 1) {
      minSpacing = 1;
    }
    imageReslice.setOutputSpacing(minSpacing, minSpacing, minSpacing);
    imageReslice.setAutoCropOutput(true); //自动裁剪输出
    imageReslice.setInterpolationMode("Linear"); //设置插值模式,Linear或者Nearest
    imageReslice.setOutputScalarType(outTyep);
    imageReslice.setResliceAxes(axes);
    let obliqueSlice = imageReslice.getOutputData();
    let curDWI = this.slice2DWI(obliqueSlice, axes, AcrossPoint);

    //还原原始数据
    volumeImageData.setOrigin(initOrigin);

    return curDWI;
  },
  slice2DWI(slice, axes) {
    let dataArray = slice.getPointData().getScalars().getData();
    //渲染获得的数组
    let { newX, newY, newZ } = CROSS.formatAxex(axes);
    let leftTopOfCurrent = slice.getOrigin(); //图像左上角在当前坐标系上的坐标
    let leftTopPosArr = CROSS.transPointBackward(leftTopOfCurrent, axes);

    let leftTopPos = {
      x: leftTopPosArr[0],
      y: leftTopPosArr[1],
      z: leftTopPosArr[2],
    };
    let imgorient = [newX, newY, newZ];
    let curDWI = {
      pixelSpacingW: slice.getSpacing()[0],
      pixelSpacingH: slice.getSpacing()[1],
      pixelSpacingD: slice.getSpacing()[2],
      leftTopPos,
      origBuf: {
        width: slice.getDimensions()[0],
        height: slice.getDimensions()[1],
        data: dataArray,
      },
      imgorient,
    };
    return curDWI;
  },
  getOrgDWI(poorObj, seriesInfo, curViewMod, curImageNum) {
    let dataWithInfo = {
      //定义数据结构
      pixelSpacingW: 1,
      pixelSpacingH: 1,
      pixelSpacingD: 1,
      leftTopPos: { x: 0, y: 0, z: 0 }, //当前图像左上角在世界坐标系上的坐标
      origBuf: {}, //原始数据
    };

    let poor = poorObj.data;
    let ImageOrientationPatient = seriesInfo.ImageOrientationPatient;
    if (seriesInfo.isNotUniformSquence) {
      //不均匀，也不插值
      let instance = seriesInfo.instances[curImageNum];
      let { PixelSpacing, ImagePositionPatient } = instance;
      dataWithInfo.leftTopPos = {
        x: ImagePositionPatient[0],
        y: ImagePositionPatient[1],
        z: ImagePositionPatient[2],
      };
      ImageOrientationPatient = instance.ImageOrientationPatient;
      dataWithInfo.pixelSpacingW = PixelSpacing[1];
      dataWithInfo.pixelSpacingH = PixelSpacing[0];
      dataWithInfo.pixelSpacingD = 1;
      dataWithInfo.origBuf = this.getSliceDirect(poor, curImageNum);
      console.log(dataWithInfo.origBuf, "dataWithInfo.origBuf");
      //orientation单独求当前的图像
      dataWithInfo.imgorient = CROSS.getAxesOfImage(ImageOrientationPatient);
    } else {
      let {
        w: pixelSpacingW,
        h: pixelSpacingH,
        d: pixelSpacingD,
      } = seriesInfo.volumeSpacing[curViewMod];
      dataWithInfo = {
        ...dataWithInfo,
        pixelSpacingW,
        pixelSpacingH,
        pixelSpacingD,
      };
      dataWithInfo.leftTopPos = this.getLeftTopPosAbs(
        curViewMod,
        curImageNum,
        seriesInfo,
      );
      dataWithInfo.origBuf = this.getSliceFromVolume(
        poor,
        seriesInfo,
        curViewMod,
        {
          curImageNum,
        },
      );
      //imgorient从体数据中求
      dataWithInfo.imgorient = seriesInfo.volumeOrientation[curViewMod];
    }
    dataWithInfo.width = dataWithInfo.origBuf?.width || 1;
    dataWithInfo.height = dataWithInfo.origBuf?.height || 1;
    return dataWithInfo;
  },

  //非均匀数据不重建,直接取出数据,非均匀数据的initViewMod是0
  getSliceDirect(poor, curImageNum) {
    let poorNow = poor[0];
    return poorNow[curImageNum];
  },

  //从volumedata中取出数据
  getSliceFromVolume(
    poor,
    seriesInfo,
    curViewMod,
    { curImageNum, index1, index2, cindex },
  ) {
    let origBuf;
    let model = seriesInfo.model;
    let size = seriesInfo.volumeSize[curViewMod];
    let width = size.w,
      height = size.h,
      depth = size.d;
    let poorNow = poor[curViewMod];

    //如果是已经存在的数据，直接返回
    if (curImageNum && Number.isInteger(curImageNum) && poorNow[curImageNum]) {
      return poorNow[curImageNum];
    }

    //如果curImageNum存在且不是整数,这里会做插值运算，DataArray,直接用浮点数
    if (curImageNum && !Number.isInteger(curImageNum)) {
      cindex = curImageNum;
      index1 = Math.floor(curImageNum);
      index2 = Math.ceil(curImageNum);
      curImageNum = undefined;
    }

    let img_length = width * height;
    let isForceFloat = true;
    let ifForceShort = false;

    let buf = LOAD.createDataArray(
      img_length,
      model,
      isForceFloat,
      null,
      0,
      ifForceShort,
    );
    //超过范围是数据不需要处理
    if (
      (curImageNum && (curImageNum < 0 || curImageNum > depth - 1)) ||
      (cindex && (cindex < 0 || cindex > depth - 1))
    ) {
      origBuf = { width: width, height: height, data: buf };
      return origBuf;
    }

    let index2_cindex = index2 - cindex;
    let cindex_index1 = cindex - index1;
    if (index1 !== undefined && index2 !== undefined && cindex !== undefined) {
      if (index1 == cindex || index2 == cindex) {
        curImageNum = cindex; //这种情况不需要插值
        //如果是已经存在的数据，直接返回
        if (curImageNum && poorNow[curImageNum]) {
          buf = undefined; //释放数组避免内存泄露
          return poorNow[curImageNum];
        }
      }
      if (poorNow[index1] && poorNow[index2]) {
        //这种情况不要判断视图，可以直接插值得到结果
        for (let i = 0; i < width; i++) {
          for (let j = 0; j < height; j++) {
            let data1 = poorNow[index1].data[j * width + i];
            let data2 = poorNow[index2].data[j * width + i];
            buf[j * width + i] = index2_cindex * data1 + cindex_index1 * data2;
          }
        }
        origBuf = { width: width, height: height, data: buf };
        return origBuf;
      }
    }

    //走到这里就必须重建非原始视图的图像了，要么curImageNum为undefined,要么index1 index2 cindex为undefined
    let poor0 = poor[seriesInfo.initViewMod];
    size = seriesInfo.volumeSize[seriesInfo.initViewMod];
    //重置了长宽高方便后续的计算
    width = size.w;
    height = size.h;
    depth = size.d;
    //创建一个字典
    let disc = [
      [0, 1, 2],
      [1, 0, 2],
      [1, 2, 0],
    ];
    let newViewMod = disc[seriesInfo.initViewMod][curViewMod];
    switch (newViewMod) {
      case 0: {
        if (curImageNum !== undefined) {
          buf = undefined; //释放数组避免内存泄露
          return poor0[curImageNum];
        } else if (
          index1 !== undefined &&
          index2 !== undefined &&
          cindex !== undefined
        ) {
          for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
              let data1 = poor0[index1].data[j * width + i];
              let data2 = poor0[index2].data[j * width + i];
              buf[j * width + i] =
                index2_cindex * data1 + cindex_index1 * data2;
            }
          }
        }
        origBuf = { width: width, height: height, data: buf };
        break;
      }
      case 1: {
        if (seriesInfo.initViewMod == 2) {
          if (curImageNum !== undefined) {
            if (poorNow[curImageNum]) {
              buf = undefined; //释放数组避免内存泄露
              return poorNow[curImageNum];
            }
            for (let i = 0; i < width; i++) {
              for (let j = 0; j < depth; j++) {
                buf[i * depth + j] = poor0[j].data[curImageNum * width + i];
              }
            }
          } else if (
            index1 !== undefined &&
            index2 !== undefined &&
            cindex !== undefined
          ) {
            for (let i = 0; i < width; i++) {
              for (let j = 0; j < depth; j++) {
                let data1 = poor0[j].data[index1 * width + i];
                let data2 = poor0[j].data[index2 * width + i];
                buf[i * depth + j] =
                  index2_cindex * data1 + cindex_index1 * data2;
              }
            }
          }
          origBuf = { width: depth, height: width, data: buf };
        } else {
          if (curImageNum !== undefined) {
            if (poorNow[curImageNum]) {
              buf = undefined; //释放数组避免内存泄露
              return poorNow[curImageNum];
            }
            for (let i = 0; i < width; i++) {
              for (let j = 0; j < depth; j++) {
                buf[j * width + i] = poor0[j].data[curImageNum * width + i];
              }
            }
          } else if (
            index1 !== undefined &&
            index2 !== undefined &&
            cindex !== undefined
          ) {
            for (let i = 0; i < width; i++) {
              for (let j = 0; j < depth; j++) {
                let data1 = poor0[j].data[index1 * width + i];
                let data2 = poor0[j].data[index2 * width + i];
                buf[j * width + i] =
                  index2_cindex * data1 + cindex_index1 * data2;
              }
            }
          }
          origBuf = { width: width, height: depth, data: buf };
        }
        break;
      }
      case 2: {
        if (seriesInfo.initViewMod == 0) {
          if (curImageNum !== undefined) {
            if (poorNow[curImageNum]) {
              buf = undefined; //释放数组避免内存泄露
              return poorNow[curImageNum];
            }
            for (let i = 0; i < height; i++) {
              for (let j = 0; j < depth; j++) {
                buf[j * height + i] = poor0[j].data[i * width + curImageNum];
              }
            }
          } else if (
            index1 !== undefined &&
            index2 !== undefined &&
            cindex !== undefined
          ) {
            for (let i = 0; i < height; i++) {
              for (let j = 0; j < depth; j++) {
                let data1 = poor0[j].data[i * width + index1];
                let data2 = poor0[j].data[i * width + index2];
                buf[j * height + i] =
                  index2_cindex * data1 + cindex_index1 * data2;
              }
            }
          }
          origBuf = { width: height, height: depth, data: buf };
        } else {
          if (curImageNum !== undefined) {
            if (poorNow[curImageNum]) {
              buf = undefined; //释放数组避免内存泄露
              return poorNow[curImageNum];
            }
            for (let i = 0; i < height; i++) {
              for (let j = 0; j < depth; j++) {
                buf[i * depth + j] = poor0[j].data[i * width + curImageNum];
              }
            }
          } else if (
            index1 !== undefined &&
            index2 !== undefined &&
            cindex !== undefined
          ) {
            for (let i = 0; i < height; i++) {
              for (let j = 0; j < depth; j++) {
                let data1 = poor0[j].data[i * width + index1];
                let data2 = poor0[j].data[i * width + index2];
                buf[i * depth + j] =
                  index2_cindex * data1 + cindex_index1 * data2;
              }
            }
          }
          origBuf = { width: depth, height: height, data: buf };
        }
        break;
      }
    }
    return origBuf;
  },
  getFusionPara(dataWithInfo_ct, dataWithInfo_pt, curViewMod) {
    //这里是左上角的平移参数
    let scalePTtoCT = { x: 0, y: 0 },
      transPTtoCT = { x: 0, y: 0 };
    scalePTtoCT = {
      x: dataWithInfo_pt.pixelSpacingW / dataWithInfo_ct.pixelSpacingW,
      y: dataWithInfo_pt.pixelSpacingH / dataWithInfo_ct.pixelSpacingH,
    };
    let dic = ["x", "y", "z"];
    let dis = dic.map((item) => {
      return (
        dataWithInfo_pt.leftTopPos[item] - dataWithInfo_ct.leftTopPos[item]
      );
    });
    let eW = dataWithInfo_ct.imgorient[0],
      eH = dataWithInfo_ct.imgorient[1];
    let projectW = CROSS.dotProduct(dis, eW);
    let projectH = CROSS.dotProduct(dis, eH);
    transPTtoCT = {
      x: Math.round(projectW / dataWithInfo_ct.pixelSpacingW),
      y: Math.round(projectH / dataWithInfo_ct.pixelSpacingH),
    };
    return { scalePTtoCT, transPTtoCT };
  },
  getdistance(point1, point2) {
    let r = Math.sqrt(
      Math.pow(point1.x - point2.x, 2) +
        Math.pow(point1.y - point2.y, 2) +
        Math.pow(point1.z - point2.z, 2),
    );
    return r;
  },

  //十字定位关键步骤：视图内的栅格响应十字点位置的变化
  syncCross(cvp, isCurrViewport) {
    console.log("syncCross", cvp.viewportID);
    let imageDatas = cvp.imageDatas;
    let seriesInfos = cvp.seriesInfos;
    let AcrossPoint = cvp.AcrossPoint;
    let canvasNow = cvp.canvasNow;

    //所有的step需要以当前十字的定位所获取的imagedata为准

    //获取平铺的翻页参数
    let DWIList = {};
    let series_mod = [[], [], []];
    let forceStepAll = {};
    for (let i = 0; i < imageDatas.length; i++) {
      series_mod[imageDatas[i].curViewMod].push(i);
      if (imageDatas[i].dataWithInfo && imageDatas[i].dataWithInfo.DWIUID) {
        DWIList[imageDatas[i].dataWithInfo.DWIUID] = {
          dataWithInfo: { ...imageDatas[i].dataWithInfo },
        };
      }
    }

    for (let i = 0; i < 3; i++) {
      let modArr = series_mod[i];
      let zreoIndex = 0; //默认第一张不加forceStep
      for (let j = 0; j < modArr.length; j++) {
        let index = modArr[j];
        let forceStep = j - zreoIndex;
        forceStepAll[index] = forceStep;
      }
    }

    for (let i = 0; i < imageDatas.length; i++) {
      //不均匀的数据不需要被十字同步，但是可能会平铺
      if (i == canvasNow && isCurrViewport) {
        continue;
      }
      let imageData = { ...imageDatas[i] };
      let seriesInfo = seriesInfos[i];
      let forceStep = forceStepAll[i] || 0;
      let newImageData = CROSS.asyncImageData(
        imageData,
        AcrossPoint,
        seriesInfo,
        forceStep,
      );
      if (DWIList[newImageData.DWIUID]) {
        newImageData.dataWithInfo = DWIList[newImageData.DWIUID].dataWithInfo;
      }

      // MR 在synccross的时候使用单张窗宽窗位
      if (
        seriesInfo.model === "MR" &&
        newImageData.curViewMod === seriesInfo.initViewMod &&
        newImageData.defaultFlag
      ) {
        newImageData.ww =
          seriesInfo.instances[newImageData.curImageNum].windowWidth;
        newImageData.wl =
          seriesInfo.instances[newImageData.curImageNum].windowCenter;
      }
      imageDatas.splice(i, 1, newImageData);
    }
  },

  syncGeom(cvp) {
    console.log("syncGeom");
    let imageDatas = cvp.imageDatas;
    let canvasNow = cvp.canvasNow;
    let imageData_now = imageDatas[canvasNow];
    if (imageData_now.isCPR || imageData_now.isVR) return;
    let {
      scale: s_now,
      translate: t_now,
      rotate: r_now,
      curViewMod: c_now,
    } = imageData_now;
    let signX = Math.sign(s_now.x) || 1;
    let signY = Math.sign(s_now.y) || 1;
    for (let i = 0; i < imageDatas.length; i++) {
      if (i == canvasNow) {
        continue;
      }
      let newImageData = { ...imageDatas[i] };
      if (newImageData.isCPR || newImageData.isVR) continue;
      //同步scale
      newImageData.scale.baseFactor =
        (newImageData.scale.baseSpacing * s_now.baseFactor) / s_now.baseSpacing;
      //还需要同步符号,响应上下和左右翻转
      newImageData.scale.x = signX * Math.abs(newImageData.scale.x);
      newImageData.scale.y = signY * Math.abs(newImageData.scale.y);
      //同步旋转和平移，只有同视图的才需要
      if (newImageData.curViewMod === c_now) {
        newImageData.translate.x = t_now.x;
        newImageData.translate.y = t_now.y;
        newImageData.rotate = r_now;
      }

      imageDatas.splice(i, 1, newImageData);
    }
  },

  syncWWWL(cvp) {
    let imageDatas = cvp.imageDatas;
    let canvasNow = cvp.canvasNow;
    let imageData_now = imageDatas[canvasNow];
    // if (imageData_now.isVR) return;
    let { ww, wl, colormapIndex, colormapIndex2 } = imageData_now;
    for (let i = 0; i < imageDatas.length; i++) {
      if (imageDatas[i].isVR) break;
      if (i == canvasNow) {
        continue;
      }
      // if (imageDatas[i].isVR) continue;
      let newImageData = {
        ...imageDatas[i],
        ww,
        wl,
        colormapIndex,
        colormapIndex2,
      };
      imageDatas.splice(i, 1, newImageData);
    }
  },

  getLeftTopPosAbs(curViewMod, curImageNum, serieInfo) {
    let { ImagePositionPatient, volumeSpacing, volumeOrientation } = serieInfo;

    let { d: dSpacing } = volumeSpacing[curViewMod];
    let leftTopPos = { x: 0, y: 0, z: 0 };

    //重建数据
    let imgorient = volumeOrientation[curViewMod];
    let eZ = imgorient[2];
    let dic = ["x", "y", "z"];
    for (let i = 0; i < 3; i++) {
      leftTopPos[dic[i]] =
        ImagePositionPatient[i] + dSpacing * curImageNum * eZ[i];
    }

    return leftTopPos;
  },
  point2img(imageData, seriesInfo, AcrossPoint) {
    let { curViewMod } = imageData;
    if (
      AcrossPoint.x == undefined ||
      AcrossPoint.y == undefined ||
      AcrossPoint.z == undefined
    ) {
      return {};
    }
    let { volumeSpacing, volumeSize } = seriesInfo;
    let { w: wp, h: hp, d: dp, thickness } = volumeSpacing[curViewMod];
    let depth = volumeSize[curViewMod].d;

    let IP = seriesInfo.ImagePositionPatient;
    let x = IP[0],
      y = IP[1],
      z = IP[2];
    let res = {};
    let index_pos;
    switch (curViewMod) {
      case 0: {
        res.x = Math.round((AcrossPoint.x - x) / wp);
        res.y = Math.round((AcrossPoint.y - y) / hp);
        res.index = (z - AcrossPoint.z) / dp; //index可以不是整数
        index_pos = AcrossPoint.z;
        break;
      }
      case 1: {
        res.x = Math.round((AcrossPoint.x - x) / wp);
        res.y = Math.round((z - AcrossPoint.z) / hp);
        res.index = (AcrossPoint.y - y) / dp; //index可以不是整数
        index_pos = AcrossPoint.y;
        break;
      }
      case 2: {
        res.x = Math.round((AcrossPoint.y - y) / wp);
        res.y = Math.round((z - AcrossPoint.z) / hp);
        res.index = (AcrossPoint.x - x) / dp; //index可以不是整数
        index_pos = AcrossPoint.x;
        break;
      }
    }
    let pageStep = Number((thickness / dp).toFixed(2));
    let cruPage = Math.round(res.index / pageStep);
    let newSum = Math.floor(depth / pageStep);
    if (cruPage < 0) cruPage = 0;
    if (cruPage > newSum - 1) cruPage = newSum - 1;
    //十字定位的返回值，每次返回到当前图像的翻页位置
    res.index = Number((cruPage * pageStep).toFixed(2));
    return res;
  },
};

export default LOAD;
