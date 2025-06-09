import DATA from "../js/data";
import store from "@/store/store.js";

export async function createImgPoor(seriesInfo) {
  let volumeBuffer, volumeImageData;
  let data = [[], [], []];
  let registPara = undefined;
  if (!seriesInfo.isNotUniformSquence && seriesInfo.initViewMod === 0) {
    //只有横断面的均匀数据才在这里直接初始化,否则需要等加载完成在转成横断面
    // 如果是低配置设备，不初始化imagedata
    const useCompatibility =
      localStorage.getItem("useCompatibility") === "true";
    if (!store.state.isLowerConfigureDevice && !useCompatibility) {
      let resp = DATA.getInitVtkVolume(seriesInfo);
      volumeBuffer = resp.volumeBuffer;
      volumeImageData = resp.volumeImageData;
    }
    data = [
      new Array(seriesInfo.volumeSize[0].d),
      new Array(seriesInfo.volumeSize[1].d),
      new Array(seriesInfo.volumeSize[2].d),
    ];

    //加载一次配准参数，从云端同步数据
    registPara = await DATA.getRegistPara(seriesInfo.currentSID);
  }
  let instances = seriesInfo.instances;
  return {
    imageDone: false,
    data,
    volumeBuffer: volumeBuffer,
    volumeImageData: volumeImageData,
    num: instances.length,
    done: 0,
    info: seriesInfo,
    version: 0,
    registPara,
  };
}
export function formatSeriesList(series, study) {
  if (!series?.length) return [];
  let { instances } = series[0];
  if (instances) {
    return series.map((item) => {
      const firstInstance = item.instances[0];
      const thickbness = firstInstance.sliceThickness || "1";
      const modality = firstInstance.modality;
      const seriesId = item.uid.slice(-24);
      return {
        description: item.description,
        id: item.number,
        imageNumber:
          item.numberOfFrames > 1 ? item.numberOfFrames : item.instances.length,
        modality: modality,
        seriesId,
        studyId: study.sid,
        thickness: thickbness,
        thumbImage: "",
        isNotUniformSquence: item.isNotUniformSquence,
        visible: 1,
      };
    });
  } else {
    return series;
  }
}

export function getSplitInfo(type, key, value, num) {
  if (type === "split") {
    if (key === "id") {
      return value + `-${num}`;
    } else if (key === "desc") {
      return value + `-sub${num}`;
    }
  } else if (type === "add") {
    if (key === "id") {
      return value + `-new`;
    } else if (key === "desc") {
      return value + `-new series`;
    }
  }
}

export function getSplitData(data, initViewMod, newData) {
  const result = [];
  for (let i = 0; i < 3; i++) {
    if (i === initViewMod) {
      result[initViewMod] = newData;
    } else {
      result[i] = data[i];
    }
  }
  return result;
}

export function getSplitVolumeSize(volumeSize, h, initViewMod) {
  if (!volumeSize) return undefined;
  const result = [];
  volumeSize.forEach((item) => {
    result.push({ ...item });
  });
  if (initViewMod === 0) {
    for (let i = 0; i < 3; i++) {
      if (i === 0) result[i].d = h;
      else result[i].h = h;
    }
  } else if (initViewMod === 1) {
    for (let i = 0; i < 3; i++) {
      if (i === 0) result[i].h = h;
      else if (i === 1) result[i].d = h;
      else result[i].w = h;
    }
  }
  // 这里可能未来需要补充
  return result;
}
