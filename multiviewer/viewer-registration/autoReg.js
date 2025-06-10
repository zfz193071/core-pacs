import CIMG from "../js/cimg";
import LOAD from "../js/loadImg";
import DATA from "../js/data";
import { jNMI } from "./nmi";

const AUTOREG = {
  regXYZCenter(series_ct, pt_poorObj, optTrans) {
    //这里浮动图像需要用原始数据配准
    let series_pt = pt_poorObj.info;
    let {
      ImagePositionPatient: ipp_ct,
      volumeSize: iso_ct,
      volumeSpacing: pso_ct,
    } = series_ct;
    let {
      ImagePositionPatient: ipp_pt,
      volumeSize: iso_pt,
      volumeSpacing: pso_pt,
    } = series_pt;
    //取横断面的坐标
    let curViewMod = 0;
    let { w: width_ct, h: height_ct, d: depth_ct } = iso_ct[curViewMod];
    let { w: width_pt, h: height_pt, d: depth_pt } = iso_pt[curViewMod];
    let { w: psw_ct, h: psh_ct, d: psd_ct } = pso_ct[curViewMod];
    let { w: psw_pt, h: psh_pt, d: psd_pt } = pso_pt[curViewMod];

    let center_ct = {
      x: ipp_ct[0] + (psw_ct * width_ct) / 2,
      y: ipp_ct[1] + (psh_ct * height_ct) / 2,
      z: ipp_ct[2] - (psd_ct * depth_ct) / 2,
    };
    let center_pt = {
      x: ipp_pt[0] + (psw_pt * width_pt) / 2,
      y: ipp_pt[1] + (psh_pt * height_pt) / 2,
      z: ipp_pt[2] - (psd_pt * depth_pt) / 2,
    };

    optTrans.trans.x = center_ct.x - center_pt.x;
    optTrans.trans.y = center_ct.y - center_pt.y;
    optTrans.trans.z = center_ct.z - center_pt.z;
    return optTrans;
  },
  regZ(series_ct, ct_poor, pt_poor, newOptTrans, imageData) {
    //这里浮动图像需要用原始数据配准
    let series_pt = DATA.updataSeriesInfo(pt_poor.info, newOptTrans);
    let {
      ImagePositionPatient: ipp_ct,
      volumeSize: iso_ct,
      volumeSpacing: pso_ct,
    } = series_ct;
    let {
      ImagePositionPatient: ipp_pt,
      volumeSize: iso_pt,
      volumeSpacing: pso_pt,
    } = series_pt;

    //冠状面和矢状面各对齐一次，冠状面和矢状面的缩放系数需要调节成一样
    let maxCanvasSize = 150,
      scaleCTObj = [];
    let { w: o_width_ct, h: o_height_ct, d: o_depth_ct } = iso_ct[0];
    let { w: o_psw_ct, h: o_psh_ct, d: o_psd_ct } = pso_ct[0];
    let minPS = Math.min(o_psw_ct, o_psh_ct, o_psd_ct);
    //令canvas分辨率与最小分辨率相同，求三个方向的最大尺寸
    let wMax = (o_width_ct * o_psw_ct) / minPS,
      hMax = (o_height_ct * o_psh_ct) / minPS,
      dMax = (o_depth_ct * o_psd_ct) / minPS;
    let maxDim = Math.max(wMax, hMax, dMax);
    let factor = maxCanvasSize / maxDim;

    scaleCTObj[0] = {
      x: (o_psw_ct / minPS) * factor,
      y: (o_psh_ct / minPS) * factor,
    };
    scaleCTObj[1] = {
      x: (o_psw_ct / minPS) * factor,
      y: (o_psd_ct / minPS) * factor,
    };
    scaleCTObj[2] = {
      x: (o_psh_ct / minPS) * factor,
      y: (o_psd_ct / minPS) * factor,
    };

    //用一个变量存储融合结果
    let canvasTransResult = { abs_x: 0, abs_y: 0, abs_z: 0 };
    for (let curViewMod = 1; curViewMod < 3; curViewMod++) {
      let { w: width_ct, h: height_ct, d: depth_ct } = iso_ct[curViewMod];
      let { w: width_pt, h: height_pt, d: depth_pt } = iso_pt[curViewMod];
      let { w: psw_ct, h: psh_ct, d: psd_ct } = pso_ct[curViewMod];
      let { w: psw_pt, h: psh_pt, d: psd_pt } = pso_pt[curViewMod];
      let index_ct = depth_ct / 2;
      let index_pt = depth_pt / 2;
      let dataWithInfo_ct = LOAD.getDataWithInfo(
        ct_poor,
        series_ct,
        curViewMod,
        index_ct,
      );
      let dataWithInfo_pt = LOAD.getDataWithInfo(
        pt_poor,
        series_pt,
        curViewMod,
        index_pt,
      );

      //获取融合参数，这里的trans是用原始的ImagePositionPatient算的
      let { scalePTtoCT } = LOAD.getFusionPara(
        dataWithInfo_ct,
        dataWithInfo_pt,
        curViewMod,
      );

      let scale = scaleCTObj[curViewMod];

      let colormapIndex = "B&W";
      let { ww, wl, ww2, wl2 } = imageData;
      let ct_renderData = CIMG.getRenderData(
        dataWithInfo_ct.origBuf,
        colormapIndex,
        ww,
        wl,
        scale,
      );
      let tarScale = { x: scale.x * scalePTtoCT.x, y: scale.y * scalePTtoCT.y };
      let colormapIndex2 = "PET";
      let pt_renderData = CIMG.getRenderData(
        dataWithInfo_pt.origBuf,
        colormapIndex2,
        ww2,
        wl2,
        tarScale,
      );
      let hidCanvas = document.createElement("canvas");
      let hidCanvas2 = document.createElement("canvas");
      let pt_cimg = CIMG.getCimgFromRdata(hidCanvas, pt_renderData);
      let ct_cimg = CIMG.getCimgFromRdata(hidCanvas2, ct_renderData);

      let miMainCanvase = document.createElement("canvas");
      miMainCanvase.width = width_ct * scale.x;
      miMainCanvase.height = height_ct * scale.y;
      let miMainCtx = miMainCanvase.getContext("2d");
      let color = "#000";
      miMainCtx.fillStyle = color;

      //画磁共振的图像
      miMainCtx.fillRect(0, 0, miMainCanvase.width, miMainCanvase.height);
      this.ctxDrawImage(
        miMainCtx,
        ct_cimg,
        scale,
        0,
        { x: 0, y: 0 },
        miMainCanvase.width,
        miMainCanvase.height,
        1,
      );
      let miDataCT = miMainCtx.getImageData(
        0,
        0,
        miMainCanvase.width,
        miMainCanvase.height,
      );

      let arrLen = miMainCanvase.width * miMainCanvase.height;
      let arrCT = new Uint8ClampedArray(arrLen);
      let arrPT = new Uint8ClampedArray(arrLen);
      for (let i = 0; i < arrLen; i++) {
        arrCT[i] = miDataCT.data[i * 4];
      }
      this.saveCanvas(miMainCanvase, `CT${curViewMod}miZero.png`);

      //算中心点的互信息
      let maxCurTrans = { x: 0, y: 0 },
        maxValue = -1,
        miZero = 0;
      let transCur = { x: 0, y: 0 };
      //这里是关键，矢状面的平移是在冠状面的结果上进行的
      if (curViewMod === 2) {
        transCur.y = canvasTransResult.abs_z;
      }
      miMainCtx.fillRect(0, 0, miMainCanvase.width, miMainCanvase.height);
      this.drawPTImage(
        pt_cimg,
        dataWithInfo_ct,
        dataWithInfo_pt,
        miMainCanvase,
        scale,
        transCur,
      );
      let miDataPT = miMainCtx.getImageData(
        0,
        0,
        miMainCanvase.width,
        miMainCanvase.height,
      );
      for (let i = 0; i < arrLen; i++) {
        arrPT[i] = miDataPT.data[i * 4];
      }
      miZero = jNMI(arrCT, arrPT);
      this.saveCanvas(miMainCanvase, `PT${curViewMod}miZero.png`);
      maxValue = miZero;

      let rangeAC;
      //冠状面向y方向平的最大范围
      if (curViewMod === 1) {
        rangeAC = (height_pt * scale.y * psh_pt) / psh_ct;
      }
      //矢状面向x方向平移的最大范围
      if (curViewMod === 2) {
        rangeAC = (width_pt * scale.x * psw_pt) / psw_ct;
      }

      let range, step, centerIndex;

      for (let b = 0; b < 2; b++) {
        //第一次快速遍历
        if (b == 0) {
          centerIndex = 0;
          range = 20;
          step = rangeAC / range; //这里限定一个最大的范围，但实际应该很难触发
          if (step < 1) step = 1;
        }
        //第二次遍历，
        if (b == 1) {
          //上次循环结束的

          if (curViewMod === 1) {
            centerIndex = maxCurTrans.y;
          }
          if (curViewMod === 2) {
            centerIndex = maxCurTrans.x;
          }
          //上次循环的步进
          range = step;
          step = 1; //
        }
        let dic = [1, -1];
        //向上向下各遍历一次
        for (let a = 0; a < 2; a++) {
          let drector = dic[a];
          for (let k = 1; k < range; k++) {
            if (curViewMod === 1) {
              transCur.y = step * k * drector + centerIndex;
            }
            if (curViewMod === 2) {
              transCur.x = step * k * drector + centerIndex;
            }
            miMainCtx.fillRect(0, 0, miMainCanvase.width, miMainCanvase.height);
            this.drawPTImage(
              pt_cimg,
              dataWithInfo_ct,
              dataWithInfo_pt,
              miMainCanvase,
              scale,
              transCur,
            );
            let miDataPT = miMainCtx.getImageData(
              0,
              0,
              miMainCanvase.width,
              miMainCanvase.height,
            );
            for (let i = 0; i < arrLen; i++) {
              arrPT[i] = miDataPT.data[i * 4];
            }

            let node2com = jNMI(arrCT, arrPT);
            this.saveCanvas(
              miMainCanvase,
              `PT${curViewMod}-${step * k * drector + centerIndex}.png`,
            );

            if (node2com > maxValue) {
              maxValue = node2com;
              maxCurTrans = { ...transCur };
            }
            if (node2com < miZero || node2com < maxValue) {
              //如果当前的互信息比原点处还小，直接退出循环
              break;
            }
          }
        }

        if (curViewMod === 1) {
          canvasTransResult.abs_z = maxCurTrans.y;
        }
        if (curViewMod === 2) {
          canvasTransResult.abs_y = maxCurTrans.x;
        }
      }
    }

    newOptTrans.dRote = {
      rx: 0,
      ry: 0,
      rz: 0,
    };

    newOptTrans.trans.z =
      newOptTrans.trans.z -
      (canvasTransResult.abs_z / scaleCTObj[1].y) * o_psd_ct;
    newOptTrans.trans.y =
      newOptTrans.trans.y +
      (canvasTransResult.abs_y / scaleCTObj[2].x) * o_psh_ct;
    return newOptTrans;
  },
  drawPTImage(
    pt_cimg,
    dataWithInfo,
    dataWithInfo2,
    canvasEle,
    scaleCT,
    transCur = { x: 0, y: 0 },
    opacity = 1,
  ) {
    let { pixelSpacingW: wp_ct, pixelSpacingH: hp_ct } = dataWithInfo;
    let { pixelSpacingW: wp_pt, pixelSpacingH: hp_pt } = dataWithInfo2;

    //允许图像在调窗之后做一个缩放
    let { ifInterPro, interCImg } = pt_cimg;
    if (ifInterPro && interCImg) {
      let scale_self = {
        x: interCImg.width / pt_cimg.width,
        y: interCImg.height / pt_cimg.height,
      };
      wp_pt = wp_pt / scale_self.x;
      hp_pt = hp_pt / scale_self.y;
      pt_cimg = interCImg;
    }

    let scale = { ...scaleCT };
    scale.x = scale.x * (wp_pt / wp_ct);
    scale.y = scale.y * (hp_pt / hp_ct);
    //这里不会出现需要旋转的情况
    let rotate = 0;

    //trans为0的时候图像中心和canvas中心是对齐的
    let translate = {
      x: transCur.x,
      y: transCur.y,
    };
    //直接画
    let ctxTmp = canvasEle.getContext("2d");

    this.ctxDrawImage(
      ctxTmp,
      pt_cimg,
      scale,
      rotate,
      translate,
      canvasEle.width,
      canvasEle.height,
      opacity,
    );

    return canvasEle;
  },
  ctxDrawImage(
    canvasEle_ctx,
    image,
    scale,
    rotate,
    translate,
    canvasWidth,
    canvasHeight,
    opacity,
  ) {
    let scaleCur = { ...scale },
      imageCur = image;
    //允许图像在调窗之后做一个缩放
    let { ifInterPro, interCImg } = image;
    //允许图像在调窗之后做一个缩放
    if (ifInterPro && interCImg) {
      let scale_self = {
        x: interCImg.width / image.width,
        y: interCImg.height / image.height,
      };
      scaleCur.x = scale.x / scale_self.x;
      scaleCur.y = scale.y / scale_self.y;
      imageCur = interCImg;
    }
    //旋转平移缩放
    canvasEle_ctx.save();
    //设置全局透明度
    canvasEle_ctx.globalAlpha = opacity;
    //首先做缩放。让canvas像素坐标变成图像坐标
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
  },

  regY(ele0, ele1) {
    console.time("nmi regY");
    let regTrans = 0;
    const MaxTrans = ele0.height;

    let nmiMax = 0;

    // 从ele1中取一段50*50的图像
    const widthNow = 250,
      heightNow = 50;
    const scaleX1 = Math.floor(ele1.width / widthNow);
    const accHeight = heightNow * scaleX1;
    const step = Math.floor(accHeight / 4);
    const MaxInterN = Math.floor(ele0.height / step);
    const centerNow = widthNow / 2;
    const center1 = ele1.width / 2;
    //取ele1 的头部50*采样倍率行
    let arr1 = new Uint16Array(widthNow * heightNow).fill(ele1.min);
    for (let j = 0; j < heightNow; j++) {
      for (let i = 0; i < widthNow; i++) {
        const x1 = Math.floor(center1 + (j - centerNow) * scaleX1);
        arr1[j * heightNow + i] = ele1.data[j * scaleX1 * ele1.width + x1];
      }
    }
    const center0 = ele0.width / 2;
    let arr0 = new Uint16Array(widthNow * heightNow);
    for (let k = 0; k < MaxInterN; k++) {
      const curStart = k * step;
      const curEnd = curStart + accHeight;
      if (curEnd > ele0.height - 1) {
        break;
      }
      arr0.fill(ele0.min);
      for (let i = 0; i < widthNow; i++) {
        const x0 = Math.floor(center0 + (i - centerNow) * scaleX1);
        // 检查x坐标是否在有效范围内
        if (x0 >= 0 && x0 < ele0.width) {
          for (let j = 0; j < heightNow; j++) {
            const y0 = curStart + j * scaleX1;
            arr0[j * widthNow + i] = ele0.data[y0 * ele0.width + x0];
          }
        }
      }
      const curTrans = -(ele0.height - curStart);
      const nmi = jNMI(arr0, arr1);
      console.log("nmi", k, nmi, nmiMax, curTrans, curStart);
      if (nmi > nmiMax) {
        nmiMax = nmi;
        regTrans = curTrans;
      }
    }
    console.timeEnd("nmi regY");
    return regTrans;
  },

  //测试中间结果
  saveCanvas(canvasEle, name) {
    return;
    // let imgURL = canvasEle.toDataURL("image/png");
    // let dlLink = document.createElement("a");
    // dlLink.download = name;
    // dlLink.href = imgURL;
    // dlLink.dataset.downloadurl = ["image/png", dlLink.download, dlLink.href].join(':');
    // document.body.appendChild(dlLink);
    // dlLink.click()
    // document.body.removeChild(dlLink);
  },
};

export default AUTOREG;
