import store from "@/store/store.js";
export function createFullSeries(that) {
  //设置侧边栏内容
  const studyDatas = that.$refs.serieslist.LISTDATA;
  for (let key in studyDatas) {
    const studyList = studyDatas[key].data;
    const studyKey = key;
    const dataAll = Object.create(null);
    dataAll.description = "full series";
    dataAll.imageNumber = studyList.reduce((a, b) => a + b.imageNumber, 0);
    dataAll.id = studyList.reduce((a, b) => a + Number(b.id), 0);
    dataAll.isNotUniformSquence = true;
    dataAll.isFullSeries = true;
    dataAll.modality = studyList[0].modality;
    dataAll.seriesId = studyList[0].seriesId + "-all" + new Date().getTime();
    dataAll.studyId = studyList[0].studyId;
    dataAll.thickness = "";
    dataAll.thumbImage = "";
    dataAll.visible = 1;
    // 过滤当前study的series
    const poorList = Object.values(store.state.imgPoor).filter((v) =>
      studyList.map((item) => item.seriesId).includes(v.info.SeriesIndex),
    );
    // 当前study的模态不一样、只有一个序列、已经加载过全影像序列，跳出当前循环
    if (
      !isAllItemsSame(poorList.map((v) => v.info.model)) ||
      poorList.find((v) => v.info.isFullSeries) ||
      studyList.length === 1
    )
      continue;
    const poor = poorList[0];
    let poorAll = {
      num: poorList.reduce((a, b) => a + b.num, 0),
      done: poorList.reduce((a, b) => a + b.done, 0),
      imageDone: true,
      data: createAllData(poorList),
      info: {
        ...poor.info,
        isFullSeries: true, //每个study只加载一次全影像序列
        curViewMod: 0,
        initViewMod: 0,
        ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
        ImagePositionPatient: [0, 0, 0],
        dynamic: {},
        isMissInfo: true,
        isNotSameSquence: true,
        isNotUniformSquence: true,
        rescaleIntercept: 1,
        rescaleSlop: 1,
        orgVolumeSize: undefined,
        timestamp: new Date().getTime(),
        seriesInstanceUid: poor.info.seriesInstanceUid + new Date().getTime(),
        SID: dataAll.id,
        SeriesIndex: dataAll.seriesId,
        currentSID: dataAll.seriesId,
        description: "full series",
        path: poorList.map((v) => v.info["path"]).flat(),
        instances: poorList.map((v) => v.info["instances"]).flat(),
        volumeOrientation: undefined,
        volumeSize: undefined,
        volumeSpacing: undefined,
      },
      volumeImageData: undefined,
      volumeBuffer: undefined,
    };
    const lists = that.$refs.serieslist.LISTS;
    lists[studyKey].data.unshift(dataAll);
    that.$set(lists, studyKey, lists[studyKey]);
    const tempPoor = {
      ...store.state.imgPoor,
      [dataAll.seriesId]: poorAll,
    };
    store.commit("setImgPoor", tempPoor);
  }
}

function isAllItemsSame(arr) {
  if (arr.length === 0) {
    return true;
  }
  const firstItem = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] != firstItem) {
      return false;
    }
  }
  return true;
}

function createAllData(poorList) {
  const data = [[], [], []];
  const dataList = poorList.map((v) => v.data[v.info.curViewMod]);
  data[0] = dataList.flat();
  return data;
}
