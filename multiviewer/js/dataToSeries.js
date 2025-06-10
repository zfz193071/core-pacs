import DATA from "./data";
export function DataHandler(res, sid, isJH) {
  // const { id: PatientID, name: PatientName } = res.patient;
  let series = res.series;
  const study = Object.create(null); // 一脉项目study
  // 构建study
  study.date = res.date;
  study.time = res.time;
  study.pipeline = res.pipeline;
  study.uid = res.uid;
  study.description = res.description;
  study.id = res.id;
  study.sid = sid;
  study.seriesId = res.uid.slice(-24);
  study.patient = res.patient;
  study.stationName = res.stationName;
  study.deviceModel = res.deviceModel;
  study.accessionNumber = res.accessionNumber;
  // series排序
  series = series
    .sort((curr, next) => {
      return Number(curr.number) - Number(next.number);
    })
    .filter((item) => {
      const fristInstance = item.instances[0];
      return fristInstance.rows > 0 && fristInstance.columns > 0;
    });
  study.series = series;

  const result = [];
  // 一脉项目数据：组成series info
  series.forEach((is) => {
    const s = Object.create(null);
    s.uid = is.uid;
    s.description = is.description;
    s.number = is.number;
    s.bodyPart = is.bodyPart;
    s.SeriesDate = is.date;
    s.AcquisitionTime = is.time;
    s.manufacturer = is.manufacturer;
    s.manufacturerModelName = is.manufacturerModelName;
    s.instances = is.instances.map((ii) => {
      const oi = Object.create(null);
      oi.id = ii.id;
      //以下关键信息使用dicom的字段命名用作区分
      oi.PixelSpacing = ii.pixelSpacings;
      oi.ImagePositionPatient = ii.position;
      oi.ImageOrientationPatient = ii.orientation;

      oi.number = ii.number;
      oi.photometricInterpretation = ii.photometricInterpretation;
      oi.rescaleIntercept = ii.rescaleIntercept;
      oi.rescaleSlop = ii.rescaleSlop;
      oi.rows = ii.rows;
      oi.series = s;
      oi.bitsStored = ii.bitsStored;
      oi.bitsAllocated = ii.bitsAllocated;
      oi.bitsSigned = ii.bitsSigned;
      oi.highBit = ii.highBit;
      oi.columns = ii.columns;
      oi.fileName = ii.fileName;
      oi.uid = ii.uid;
      oi.imageTypes = ii.imageTypes;
      oi.modality = ii.modality;
      oi.sliceThickness = Number.parseFloat(
        ii.sliceThickness?.toString() || "1.0",
      );
      oi.windowCenter = ii.windowCenter;
      oi.windowWidth = ii.windowWidth;
      if (oi.photometricInterpretation === "MONOCHROME1") {
        oi.needInverse = true;
      }
      return oi;
    });
    is.seriesId = is.uid.slice(-24);

    if (s.instances.length === 0) return;

    // 图片地址
    let path = is.instances.map((item) => {
      return item.fileName;
    });

    let first = s.instances[0];

    let seriesInfo = {
      SeriesIndex: s.uid.slice(-24),
      SeriesDate: s.SeriesDate,
      AcquisitionTime: s.AcquisitionTime,
      manufacturerModelName: s.manufacturerModelName,
      manufacturer: s.manufacturer,
      StudyDate: res.date,
      PatientSex: res.patient.gender,
      PatientAge: res.patient.age,
      PatientID: res.patient.id,
      PatientName: res.patient.name,
      parts: s.bodyPart,
      path: path,
      seriesKeyId: is.seriesKeyId, //序列拆分接口需要的参数
      //这些信息可以直接读第一张图的信息
      model: first.modality,
      needInverse: first.needInverse,
      instances: s.instances,
      SID: s.number,
      ww: first.windowWidth,
      wl: first.windowCenter,
    };

    // 公共部分,在这里校验数据是否均匀
    seriesInfo = DATA.getInitSeriesInfo(seriesInfo);
    seriesInfo.currentSID = seriesInfo.SeriesIndex;

    // PT模态默认窗宽窗位读预设4号
    if (seriesInfo.model === "PT") {
      const { ww, wl } = DATA.suv2wwwl(seriesInfo, 7, 0);
      seriesInfo.ww = ww;
      seriesInfo.wl = wl;
    }
    //用于判断是否均匀
    is.isNotUniformSquence = seriesInfo.isNotUniformSquence;
    result.push({ seriesInfo });
  });
  return result;
}
