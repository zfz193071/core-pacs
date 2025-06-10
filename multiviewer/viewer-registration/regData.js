/*
 * @Author:
 * @Date: 2024-09-19 09:28:59
 * @LastEditTime: 2024-09-23 14:43:39
 * @LastEditors: ssy
 * @Description:
 */
import DATA from "../js/data.js";
import LOAD from "../js/loadImg.js";
import CROSS from "../js/crosshair.js";
import CLICKOPT from "../js/clickOpt.js";
let regData = {
  //初始化数据
  initData(that) {
    let { ct_poorObj, pt_poorObj, size } = that;
    //初始化PT图像中心
    //求原始体数据的立方体中心
    let series_pt = pt_poorObj.info;
    let series_ct = ct_poorObj.info;
    let { AcrossPoint } = CROSS.getInitAcrossPoint(series_ct);
    that.AcrossPoint = { ...AcrossPoint };
    that.imageDatas = [];
    for (let i = 0; i < 3; i++) {
      //初始化数据
      let imageData = this.setImageData(series_ct, i, size[i], series_pt);
      that.imageDatas.push(imageData);
    }
  },
  //初始化imageData
  setImageData(series, curViewMod, size, series_pt) {
    let imageNum = series.volumeSize[curViewMod].d;
    let curImageNum = Math.floor(imageNum / 2); //取到整数
    let obj = {
      ww: series.ww,
      wl: series.wl,
      rotate: 0,
      curImageNum: curImageNum,
      curViewMod: curViewMod,
      imageNum: imageNum,
      img: document.createElement("canvas"),
      translate: { x: 0, y: 0 },
      magnifyPoint: { x: -1, y: -1 },
      defaultFlag: true,
    };
    obj.scale = CLICKOPT.getFullScale(size, curViewMod, series, curImageNum);
    return {
      ...DATA.imageData,
      ...obj,
      ...{
        ww2: series_pt.ww,
        wl2: series_pt.wl,
        colormapIndex2: "Perfusion",
      },
    };
  },
};
export default regData;
