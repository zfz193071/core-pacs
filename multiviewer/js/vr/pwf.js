import vtkPiecewiseWidget from "../../../../assets/js/PiecewiseWidget";
import vtkColorTransferFunction from "@kitware/vtk.js/Rendering/Core/ColorTransferFunction";
import vtkPiecewiseFunction from "@kitware/vtk.js/Common/DataModel/PiecewiseFunction";
import _COLORPRESETS from "../../../../assets/js/MedicalColorPresets";

const widgetStyle = {
  dark: {
    backgroundColor: "rgba(64, 64, 64, 1)",
    histogramColor: "rgba(82, 83, 83, 1)",
  },
  blue: {
    backgroundColor: "rgba(42, 60, 98, 1)",
    histogramColor: "rgba(80, 94, 124, 1)",
  },
  light: {
    backgroundColor: "rgba(216, 216, 216, 1)",
    histogramColor: "rgba(204, 204, 204, 1)",
  },
};

function getShiftedOpacityFromPreset(preObj, effectiveRange, shift) {
  if (preObj.OpacityPoints) {
    const OpacityPoints = preObj.OpacityPoints;
    const points = [];
    for (let i = 0; i < OpacityPoints.length; i += 2) {
      points.push([OpacityPoints[i], OpacityPoints[i + 1]]);
    }

    const [xmin, xmax] = effectiveRange;
    const width = xmax - xmin;
    return points.map(([x, y]) => {
      return [(x - xmin) / width + shift, y];
    });
  }
  return null;
}

function applyPointsToPiecewiseFunction(pwf, points, range) {
  const width = range[1] - range[0];
  const rescaled = points.map(([x, y]) => [x * width + range[0], y]);
  pwf.removeAllPoints();
  rescaled.forEach(([x, y]) => pwf.addPoint(x, y));
  return rescaled;
}

export function onhandlePwfChange(that) {
  const opacityPoints = getShiftedOpacityFromPreset(
    that.colorPreset,
    that.imageDataRange,
    that.widget.getOpacityPointShift(),
  );
  applyPointsToPiecewiseFunction(
    that.pwfFunc,
    opacityPoints,
    that.imageDataRange,
  );
  const renderWindow = that.fullScreenRenderer.getRenderWindow();
  renderWindow.render();

  // if (!renderWindow.getInteractor().isAnimating()) {
  //   renderWindow.render();
  // }
}

function getOriginImageDataArray(that) {
  let rep = that.fullScreenRenderer.getRenderer();
  const volume = rep.getVolumes()[0];
  const mapper = volume.getMapper();
  const renderData = mapper.getInputData();
  const dataArray = renderData.getPointData().getScalars();
  return dataArray;
}

function getWWWLFromOpacityPoints(presetObj, oPoints) {
  const { OpacityPoints } = presetObj;
  const olen = OpacityPoints.length;
  let wlOld = (OpacityPoints[0] + OpacityPoints[olen - 2]) / 2,
    wwOld = OpacityPoints[olen - 2] - OpacityPoints[0];

  const len = oPoints.length;
  const scale =
    (oPoints[len - 2] - oPoints[0]) /
    (OpacityPoints[len - 2] - OpacityPoints[0]);
  const ww = wwOld * scale;
  const wl = oPoints[0] - (OpacityPoints[0] - wlOld) * scale;
  console.log(ww, wl);
  return [ww, wl];
}

export function initTransferFuncs(that) {
  that.pwfCleaner?.();
  let rep = that.fullScreenRenderer.getRenderer();
  const volume = rep.getVolumes()[0];
  const dataArray = getOriginImageDataArray(that);

  that.imageDataRange = dataArray.getRange();
  const lookupTable = vtkColorTransferFunction.newInstance();

  that.lookupTable = lookupTable;
  let presetName = that.imageData.presetName;
  let { piecewiseFunction, clearPWF } = changePreset(
    that,
    presetName,
    lookupTable,
  );
  that.pwfCleaner = clearPWF;
  that.pwfFunc = piecewiseFunction;
  const renderWindow = that.fullScreenRenderer.getRenderWindow();

  const property = volume.getProperty();
  property.setRGBTransferFunction(0, lookupTable);
  property.setScalarOpacity(0, piecewiseFunction);
  renderWindow.render();
  // renderWindow.getInteractor().requestAnimation(that.pwfFunc);
}

export function initWidget(that) {
  console.log(that.widget, that.lookupTable, "widget init");
  if (that.widget) {
    that.widget.delete();
    that.widget = null;
  }
  if (that.lookupTable) {
    that.lookupTable.delete();
    that.lookupTable = null;
  }
  that.pwfCleaner?.();
  const widget = vtkPiecewiseWidget.newInstance({
    numberOfBins: 256,
    size: [279, 137],
  });
  that.widget = widget;
  widget.updateStyle({
    backgroundColor: widgetStyle[that.theme].backgroundColor,
    histogramColor: widgetStyle[that.theme].histogramColor,
    strokeColor: "rgb(0, 0, 0)",
    activeColor: "rgb(255, 255, 255)",
    handleColor: "rgb(50, 150, 50)",
    buttonDisableFillColor: "rgba(255, 255, 255, 0.5)",
    buttonDisableStrokeColor: "rgba(0, 0, 0, 0.5)",
    buttonStrokeColor: "rgba(0, 0, 0, 1)",
    buttonFillColor: "rgba(255, 255, 255, 1)",
    strokeWidth: 1,
    activeStrokeWidth: 3,
    buttonStrokeWidth: 1.5,
    handleWidth: 3,
    iconSize: 0,
    padding: 10,
  });
  // that.fullScreenRenderer.setResizeCallback(({ width, height }) => {
  //   widget.setSize(Math.min(269, width - 10), 117);
  // });
  let rep = that.fullScreenRenderer.getRenderer();
  const volume = rep.getVolumes()[0];
  const dataArray = getOriginImageDataArray(that);
  widget.setDataArray(dataArray.getData());

  that.imageDataRange = dataArray.getRange();
  const lookupTable = vtkColorTransferFunction.newInstance();

  that.lookupTable = lookupTable;
  let presetName = that.imageData.presetName;
  let { opPoints, piecewiseFunction, clearPWF } = changePreset(
    that,
    presetName,
    lookupTable,
  );
  that.pwfCleaner = clearPWF;
  that.pwfFunc = piecewiseFunction;
  widget.setColorTransferFunction(lookupTable);
  widget.setPointsMode();
  widget.setOpacityPoints(opPoints);
  widget.render();

  const renderWindow = that.fullScreenRenderer.getRenderWindow();

  // lookupTable.onModified(() => {
  //   console.log("modified");
  //   widget.render();
  //   renderWindow.render();
  // });
  const property = volume.getProperty();
  property.setRGBTransferFunction(0, lookupTable);
  property.setScalarOpacity(0, piecewiseFunction);
  renderWindow.render();
  let widgetContainer = that.$refs.widget;
  widgetContainer.innerHTML = "";
  widget.setContainer(widgetContainer);
  widget.bindMouseListeners();
  widget.onAnimation((start) => {
    if (start) {
      renderWindow.getInteractor().requestAnimation(widget);
    } else {
      renderWindow.getInteractor().cancelAnimation(widget);
    }
  });
  renderWindow.getInteractor().requestAnimation(that.pwfFunc);

  widget.onOpacityChange(() => {
    // let preObj = _COLORPRESETS.find((ele) => ele.Name === presetName);
    // if (!preObj) {
    //   preObj = that.colorPreset;
    // }
    // 这里应该用当前的preset
    // const opacityPoints = getShiftedOpacityFromPreset(
    //   that.colorPreset,
    //   that.imageDataRange,
    //   widget.getOpacityPointShift(),
    // );
    // const shiftedPoints = applyPointsToPiecewiseFunction(
    //   that.pwfFunc,
    //   opacityPoints,
    //   that.imageDataRange,
    // );
    // const [ww, wl] = getWWWLFromOpacityPoints(
    //   that.colorPreset,
    //   shiftedPoints.flat(),
    // );
    // that.$emit("updateWWWL", {
    //   ww,
    //   wl,
    // });
    // console.log(that.colorPreset, ww, wl, "opacity change");
    // // widget.applyOpacity(piecewiseFunction);
    // if (!renderWindow.getInteractor().isAnimating()) {
    //   renderWindow.render();
    // }
  });
}

export function updateTransferFuncs(that, preObj) {
  // that.pwfCleaner?.();
  // 更新preset的时候需要重置dataRange
  if (!that.fullScreenRenderer) return;
  const dataArray = getOriginImageDataArray(that);
  that.imageDataRange = dataArray.getRange();

  // const newPreObj = wwwlNewPresetObj(
  //   preObj,
  //   that.imageData.ww,
  //   that.imageData.wl,
  // );

  updatePreset(that, preObj, that.pwfFunc, that.lookupTable);
  // let { clearPWF, opPoints, piecewiseFunction } = changePreset(
  //   that,
  //   presetName,
  //   that.lookupTable,
  // );
  // that.pwfFunc = piecewiseFunction;

  // that.widget.setOpacityPoints(opPoints);
  // that.widget.updateStyle({
  //   backgroundColor: widgetStyle[that.theme].backgroundColor,
  //   histogramColor: widgetStyle[that.theme].histogramColor,
  // });
  // that.widget.render();

  const renderWindow = that.fullScreenRenderer.getRenderWindow();

  // lookupTable.onModified(() => {
  //   console.log("modified");
  //   widget.render();
  //   renderWindow.render();
  // });
  let rep = that.fullScreenRenderer.getRenderer();
  const volume = rep.getVolumes()[0];
  const property = volume.getProperty();
  property.setRGBTransferFunction(0, that.lookupTable);
  property.setScalarOpacity(0, that.pwfFunc);
  renderWindow.render();

  // that.pwfCleaner = clearPWF;
}

function getOpacityRangeFromPreset(preObj) {
  if (preObj.EffectiveRange) {
    return [...preObj.EffectiveRange];
  }
  return null;
}

function getColorFunctionRangeFromPreset(preObj) {
  const { AbsoluteRange, RGBPoints } = preObj;
  if (AbsoluteRange && RGBPoints) {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < RGBPoints.length; i += 4) {
      min = Math.min(min, RGBPoints[i]);
      max = Math.max(max, RGBPoints[i]);
    }
    return [min, max];
  }
  return null;
}

export function changePreset(that, presetName, lookupTable, mappingRange) {
  let preObj = _COLORPRESETS.find((ele) => ele.Name === presetName);
  if (!preObj) {
    preObj = that.colorPreset;
  }
  const newPreObj = wwwlNewPresetObj(
    preObj,
    that.imageData.ww,
    that.imageData.wl,
  );
  let opRange = getOpacityRangeFromPreset(newPreObj);
  const piecewiseFunction = vtkPiecewiseFunction.newInstance();
  // const piecewiseFunctionProxy = vtkPiecewiseFunctionProxy.newInstance({
  //   piecewiseFunction: piecewiseFunction,
  // });
  // let opPoints = resetOpacityFunction(
  //   piecewiseFunction,
  //   that.imageDataRange,
  //   preObj,
  //   0,
  //   0,
  // );
  let opPoints = getShiftedOpacityFromPreset(newPreObj, that.imageDataRange, 0);
  applyPointsToPiecewiseFunction(
    piecewiseFunction,
    opPoints,
    that.imageDataRange,
  );
  lookupTable.applyColorMap(newPreObj);
  const ctRange = getColorFunctionRangeFromPreset(newPreObj);
  that.fullMappingRange = ctRange;
  that.rgbPoints = preObj.RGBPoints;
  if (!mappingRange || mappingRange.length < 0) {
    that.mappingRange = ctRange;
    mappingRange = ctRange;
  } else {
    that.mappingRange = mappingRange;
  }
  lookupTable.setMappingRange(...mappingRange);
  lookupTable.updateRange();

  let presetPara = {
    presetName,
    opRange,
    opPoints,
    piecewiseFunction,
    clearPWF() {
      piecewiseFunction.delete();
      // piecewiseFunctionProxy.delete();
    },
  };
  return presetPara;
}

// 调窗的时候用来调节volume datarange范围
export function updatePreset(that, preObj, pwfFunc, lookupTable, dis) {
  if (!pwfFunc || !lookupTable) return;

  if (dis) {
    that.imageDataRange[0] -= dis;
    that.imageDataRange[1] += dis;
  }
  console.log(that.imageDataRange, "range");
  let opPoints = getShiftedOpacityFromPreset(preObj, that.imageDataRange, 0);
  applyPointsToPiecewiseFunction(pwfFunc, opPoints, that.imageDataRange);
  lookupTable.applyColorMap(preObj);
  const ctRange = getColorFunctionRangeFromPreset(preObj);
  that.fullMappingRange = ctRange;
  that.rgbPoints = preObj.RGBPoints;
  that.mappingRange = ctRange;

  lookupTable.setMappingRange(...that.mappingRange);
  lookupTable.updateRange();

  const renderWindow = that.fullScreenRenderer.getRenderWindow();
  renderWindow.render();

  return opPoints;
}

export function changeColorRange(that, lookupTable, range) {
  // changePreset(that, presetName, lookupTable, range);
  that.mappingRange = range;
  lookupTable.setMappingRange(...range);
  lookupTable.updateRange();
  that.widget.render();
  that.fullScreenRenderer.getRenderWindow().render();
}

export function wwwlNewPresetObj(presetObj, ww, wl) {
  let newPresetObj = JSON.parse(JSON.stringify(presetObj));

  // let newRange = [wl - ww / 2, wl + ww / 2];
  // newPresetObj.EffectiveRange = newRange;
  //缩放起始点
  const len = presetObj.OpacityPoints.length;
  let wlOld =
      (presetObj.OpacityPoints[0] + presetObj.OpacityPoints[len - 2]) / 2,
    wwOld = presetObj.OpacityPoints[len - 2] - presetObj.EffectiveRange[0];
  let scale = ww / wwOld;
  for (let i = 0; i < newPresetObj.OpacityPoints.length; i += 2) {
    newPresetObj.OpacityPoints[i] =
      wl + (presetObj.OpacityPoints[i] - wlOld) * scale;
  }

  for (let i = 0; i < newPresetObj.RGBPoints.length; i += 4) {
    newPresetObj.RGBPoints[i] = wl + (presetObj.RGBPoints[i] - wlOld) * scale;
  }
  return newPresetObj;
}

export function getWWWLFromEffectiveRange(presetObj) {
  const len = presetObj.OpacityPoints.length;
  let wl = (presetObj.OpacityPoints[0] + presetObj.OpacityPoints[len - 2]) / 2,
    ww = presetObj.OpacityPoints[len - 2] - presetObj.EffectiveRange[0];
  return [ww, wl];
}
