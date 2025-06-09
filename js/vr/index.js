// import "@kitware/vtk.js"
import COLORMAP from "../../../../assets/js/colormap";
import _COLORPRESETS from "../../../../assets/js/MedicalColorPresets";
import CROSS from "../crosshair";
// import "@kitware/vtk.js/Rendering/Profiles/Volume";
// import "@kitware/vtk.js/Rendering/Profiles/Geometry";
// import "@kitware/vtk.js/Rendering/Profiles/Glyph";
import vtkImageCPRMapper from "@kitware/vtk.js/Rendering/Core/ImageCPRMapper";
import vtkCPRManipulator from "@kitware/vtk.js/Widgets/Manipulators/CPRManipulator";
import vtkFullScreenRenderWindow from "@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow";
import vtkPolyData from "@kitware/vtk.js/Common/DataModel/PolyData";
import vtkImageSlice from "@kitware/vtk.js/Rendering/Core/ImageSlice";
import vtkPiecewiseFunctionProxy from "@kitware/vtk.js/Proxy/Core/PiecewiseFunctionProxy";
import vtkPlane from "@kitware/vtk.js/Common/DataModel/Plane";
import vtkVolume from "@kitware/vtk.js/Rendering/Core/Volume";
import vtkVolumeMapper from "@kitware/vtk.js/Rendering/Core/VolumeMapper";
import vtkColorTransferFunction from "@kitware/vtk.js/Rendering/Core/ColorTransferFunction";
import vtkPiecewiseFunction from "@kitware/vtk.js/Common/DataModel/PiecewiseFunction";
import vtkCamera from "@kitware/vtk.js/Rendering/Core/Camera";
import vtkGenericRenderWindow from "@kitware/vtk.js/Rendering/Misc/GenericRenderWindow";
import vtkImageCroppingWidget from "@kitware/vtk.js/Widgets/Widgets3D/ImageCroppingWidget";
import store from "@/store/store.js";
import bus from "@/assets/js/bus.js";
import vtkWidgetManager from "@kitware/vtk.js/Widgets/Core/WidgetManager";
import {
  getPlanes,
  clampCroppingPlanes,
  getAxisBounds,
  LPSOrientation,
  LPSAxes,
} from "./crop";
import { bindInteractorStyles } from "./interactor";
import vtkAnnotatedCubeActor from "@kitware/vtk.js/Rendering/Core/AnnotatedCubeActor";
import vtkOrientationMarkerWidget from "@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget";
import { J } from "@kitware/vtk.js/macros2";

// const vtkDataArray = vtk.Common.Core.vtkDataArray;
// const VtkDataTypes = vtkDataArray.VtkDataTypes;
// const vtkImageData = vtk.Common.DataModel.vtkImageData;
// const vtkVolume = vtk.Rendering.Core.vtkVolume;
// const vtkVolumeMapper = vtk.Rendering.Core.vtkVolumeMapper;
// const vtkColorTransferFunction = vtk.Rendering.Core.vtkColorTransferFunction;
// const vtkPiecewiseFunction = vtk.Common.DataModel.vtkPiecewiseFunction;
// const vtkFullScreenRenderWindow = vtk.Rendering.Misc.vtkFullScreenRenderWindow;
// const vtkCamera = vtk.Rendering.Core.vtkCamera;
// const vtkPolyData = vtk.Common.DataModel.vtkPolyData;
// const vtkImageSlice = vtk.Rendering.Core.vtkImageSlice;

window.allRenderers = {};
function initProps(property, ww, wl, colormapIndex, opacity) {
  property.setRGBTransferFunction(0, newColorFunction(ww, wl, colormapIndex));
  property.setScalarOpacity(0, newOpacityFunction(ww, wl, opacity));
  property.setInterpolationTypeToLinear();
  property.setShade?.(true);
  property.setAmbient(0.2);
  property.setDiffuse(0.7);
  property.setSpecular?.(0.3);
  property.setSpecularPower?.(8.0);
}

function initPropsVR(property, range, bottom, top, presetName) {
  let transF, opF;
  let preObj = _COLORPRESETS.find((ele) => ele.Name === presetName);
  if (!preObj) {
    let colorPreset = JSON.parse(localStorage.colorPreset);
    preObj = colorPreset.find((ele) => ele.Name === presetName);
  }
  let rangeCT = getColorFunctionRangeFromPreset(preObj) || [bottom, top];
  // let rangeOP = getOpacityRangeFromPreset(preObj) || [bottom, top];

  transF = presetTransFunction(rangeCT, preObj);
  // 这里的range是volume的dataRange，而不是colorset的mappingRange
  opF = presetOpacityFunction(range, preObj, 0);
  let Ambient = null,
    Diffuse = null;
  const vrParams = store.state.vrParams;
  Ambient = vrParams.Ambient;
  Diffuse = vrParams.Diffuse;
  // if (localStorage.cvrParams) {
  //   let cvrParams = JSON.parse(localStorage.cvrParams);
  //   Ambient = cvrParams.Ambient;
  //   Diffuse = cvrParams.Diffuse;
  // }
  property.setAmbient(Ambient ? Ambient : 0.2);
  property.setDiffuse(Diffuse ? Diffuse : 0.7);
  property.setRGBTransferFunction(0, transF);
  property.setScalarOpacity(0, opF);
  property.setInterpolationTypeToLinear();
  property.setShade(true);
  property.setScalarOpacityUnitDistance(0, 1.4181691598216133); //可调
  property.setUseGradientOpacity(0, true);
  property.setGradientOpacityMinimumValue(0, 0);
  property.setGradientOpacityMaximumValue(0, (top - bottom) * 0.05);
  property.setGradientOpacityMinimumOpacity(0, 0.0);
  property.setGradientOpacityMaximumOpacity(0, 1.0);
  property.setSpecular(0.3);
  property.setSpecularPower(8.0);

  return {
    transF,
    opF,
  };
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
function presetTransFunction(rangeCT, preObj) {
  let fun = vtkColorTransferFunction.newInstance();
  fun.applyColorMap(preObj);
  fun.setMappingRange(...rangeCT);
  fun.updateRange();
  return fun;
}

function presetOpacityFunction(rangeOP, preObj, shift) {
  let fun = vtkPiecewiseFunction.newInstance();
  let pwfProxy = vtkPiecewiseFunctionProxy.newInstance({
    piecewiseFunction: fun,
  });
  let OpacityPoints = preObj.OpacityPoints;
  let points = [];
  for (let i = 0; i < OpacityPoints.length; i += 2) {
    points.push([OpacityPoints[i], OpacityPoints[i + 1]]);
  }

  let [xmin, xmax] = rangeOP;
  let width = xmax - xmin;
  let pointsNormalized = points.map(([x, y]) => {
    // 需要加上偏移量
    return [(x - xmin) / width + shift, y];
  });
  pwfProxy.setDataRange(...rangeOP);
  pwfProxy.setMode(vtkPiecewiseFunctionProxy.Mode.Points);
  pwfProxy.setPoints(pointsNormalized);
  return fun;
}

function newColorFunction(ww, wl, colormapIndex) {
  let _COLOR = COLORMAP[colormapIndex];
  let fun = vtkColorTransferFunction.newInstance();
  let bottom = wl - ww / 2;
  let top = wl + ww / 2;
  if (colormapIndex === "B&W") {
    fun.addRGBSegment(bottom, 0, 0, 0, top, 1.0, 1.0, 1.0);
  } else {
    for (let i = 0; i < 256; i++) {
      let value = ((i - 0) / 256) * (top - bottom) + bottom;
      let r = _COLOR[i][0] / 255;
      let g = _COLOR[i][1] / 255;
      let b = _COLOR[i][2] / 255;

      fun.addRGBPoint(value, r, g, b);
    }
  }
  return fun;
}

function newOpacityFunction(ww, wl, opacity) {
  let bottom = wl - ww / 2;
  let top = wl + ww / 2;
  let fun = vtkPiecewiseFunction.newInstance();
  fun.addPoint(bottom, opacity);
  fun.addPoint(top, opacity);
  return fun;
}

let contextLossListener;
function createListener(that) {
  return function () {
    console.error("context loss-------", that.fullScreenRenderer);
    that.$emit("renderError");

    // webgl context释放
    const gl = document.createElement("canvas").getContext("webgl");
    gl?.getExtension("WEBGL_lose_context").loseContext();

    that.canvasDOM &&
      that.canvasDOM.removeEventListener(
        "webglcontextlost",
        contextLossListener,
      );
  };
}

//预览图相关函数
function createVolumeThumbnailer(size, renderData) {
  const container = document.createElement("div");
  container.style.width = `${size}px`;
  container.style.height = `${size}px`;

  const scene = vtkGenericRenderWindow.newInstance({
    listenWindowResize: false,
    background: [0, 0, 0],
  });
  scene.setContainer(container);

  const pipeline = createRenderingPipeline();
  const { actor, mapper } = pipeline;
  const renderer = scene.getRenderer();
  if (renderData) {
    mapper.setInputData(renderData);
    if (!renderer.hasViewProp(actor)) {
      renderer.addVolume(actor);
    }
  } else {
    renderer.removeVolume(actor);
  }

  const camera = renderer.getActiveCamera();
  camera.setFocalPoint(0, 0, 0);
  camera.setPosition(0, -1, 0);
  camera.setViewUp(0, 0, 1);
  camera.azimuth(45);
  camera.elevation(45);
  renderer.resetCamera();
  // let distance = camera.getDistance();
  // let angle =
  //   (Math.atan(canvasSize.height / (2 * scale * distance)) * 360) / Math.PI;
  camera.setViewAngle(30);
  renderer.updateLightsGeometryToFollowCamera();

  return {
    scene,
    pipeline,
    updatePorp(presetName, bottom, top) {
      let property = actor.getProperty();
      const dataRange = mapper
        .getInputData()
        .getPointData()
        .getScalars()
        .getRange();
      return initPropsVR(property, dataRange, bottom, top, presetName);
    },
    destroy() {
      scene.delete();
      pipeline.actor.delete();
      pipeline.mapper.delete();
    },
  };
}

async function useVolumeThumbnailing(
  thumbnailer,
  presetIndex,
  bottom,
  top,
  thumbList,
) {
  let presetName = _COLORPRESETS[presetIndex].Name;
  let { transF, opF } = thumbnailer.updatePorp(presetName, bottom, top);
  const renWin = thumbnailer.scene.getRenderWindow();
  renWin.render();
  const src = await renWin.captureImages()[0];
  thumbList[presetIndex] = { name: presetName, src };
  transF.delete();
  opF.delete();
  if (thumbList.length !== _COLORPRESETS.length) {
    await useVolumeThumbnailing(
      thumbnailer,
      presetIndex + 1,
      bottom,
      top,
      thumbList,
    );
  }
}

//创建一个渲染过程
function createRenderingPipeline() {
  const actor = vtkVolume.newInstance();
  const mapper = vtkVolumeMapper.newInstance();
  actor.setMapper(mapper);
  return {
    actor,
    mapper,
  };
}

export async function setThumbnailerList(
  renderData,
  imageData,
  scale,
  canvasSize,
  thumbList,
) {
  const THUMBNAIL_SIZE = 60;
  const thumbnailer = createVolumeThumbnailer(
    THUMBNAIL_SIZE,
    renderData,
    scale,
    canvasSize,
  );
  let bottom = imageData.wl - imageData.ww / 2;
  let top = imageData.wl + imageData.ww / 2;
  return useVolumeThumbnailing(thumbnailer, 0, bottom, top, thumbList).then(
    (res) => {
      console.log("thumb done", res);
      // setTimeout(() => {
      thumbnailer.destroy();
      // });
      return res;
    },
  );
}

export function initRandomCubeVolume(that) {
  console.log("initRandomCubeVolume");

  let { volumeImageData, imageData, id, vtkBlendMod } = that;

  if (!id || !volumeImageData || !imageData) return;
  if (that.volumeActor) {
    that.volumeActor.delete();
    that.volumeActor = null;
  }
  if (that.fullScreenRenderer) {
    that.fullScreenRenderer.delete();
    that.fullScreenRenderer = null;
  }
  if (that.volumeMapper) {
    that.volumeMapper.delete();
    that.volumeMapper = null;
  }
  let curBL = vtkBlendMod;

  //   COMPOSITE_BLEND: 0,
  //   MAXIMUM_INTENSITY_BLEND: 1,
  //   MINIMUM_INTENSITY_BLEND: 2,
  //   AVERAGE_INTENSITY_BLEND: 3,
  //初始化第一个actor
  let pixcelSpacing = volumeImageData.getSpacing();
  let volumeMapper = vtkVolumeMapper.newInstance();
  volumeMapper.setInputData(volumeImageData);
  volumeMapper.setMaximumSamplesPerRay(4000);
  volumeMapper.setSampleDistance(
    Math.min(pixcelSpacing[0], pixcelSpacing[1], pixcelSpacing[2]) / 2,
  );
  volumeMapper.setBlendMode(curBL); //最大密度投影

  const dataRange = volumeMapper
    .getInputData()
    .getPointData()
    .getScalars()
    .getRange();
  that.volumeMapper = volumeMapper;
  that.dataRange = dataRange || [0, 0];
  let volumeActor = vtkVolume.newInstance();
  that.volumeActor = volumeActor;
  that.volumeActor.setMapper(volumeMapper);

  let view3d = document.getElementById(id);
  view3d.innerHTML = "";

  let bgColor = [0, 0, 0];
  if (imageData.colormapIndex == "B&W Inverse") {
    bgColor = [1, 1, 1];
  }

  let fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
    rootContainer: view3d,
    containerStyle: {
      height: "100%",
      overflow: "hidden",
    },
    background: bgColor,
  });
  that.fullScreenRenderer = fullScreenRenderer;
  // that.$store.state.fullScreenRenderer = that.fullScreenRenderer;
  that.canvasDOM = view3d.querySelector("canvas");
  contextLossListener = createListener(that);

  that.canvasDOM.addEventListener(
    "webglcontextlost",
    contextLossListener,
    false,
  );

  let { width, height } = that.canvasSize;
  that.fullScreenRenderer.getApiSpecificRenderWindow().setSize(width, height);
  console.log(that.canvasSize, "init vr");

  if (!that.isVR) {
    let interactor = that.fullScreenRenderer.getInteractor();
    interactor.unbindEvents();
  }
  that.renderWindow = that.fullScreenRenderer.getRenderWindow();
  that.renderer = that.fullScreenRenderer.getRenderer();

  return () => {
    volumeMapper.delete();
    volumeActor.delete();
    fullScreenRenderer.delete();
    volumeMapper = null;
    volumeActor = null;
    fullScreenRenderer = null;
  };
}

export function initLight(renderer, lightFollowsCamera) {
  //光线
  if (renderer.getLights().length === 0) {
    renderer.createLight();
  }
  const light = renderer.getLights()[0];
  light.setFocalPoint([0, 0, 0]);
  light.setColor(1, 1, 1);
  light.setIntensity(1);
  light.setConeAngle(90);
  light.setPositional(true);
  renderer.setTwoSidedLighting(false);
  if (lightFollowsCamera) {
    light.setLightTypeToHeadLight();
    renderer.updateLightsGeometryToFollowCamera();
  } else {
    light.setLightTypeToSceneLight();
  }
}

export function initCPRViewer(that) {
  let { volumeImageData, imageData } = that;
  console.log("initCPRViewer");
  // if (!CPRVoiListData?.length) return;
  // const json = setCenterLineJSON(CPRVoiListData);

  let centerline = vtkPolyData.newInstance();

  let actor = vtkImageSlice.newInstance();
  let mapper = vtkImageCPRMapper.newInstance();
  mapper.setBackgroundColor(0, 0, 0, 0);
  actor.setMapper(mapper);
  let Scalars = volumeImageData.getPointData().getScalars();

  let range = Scalars.getRange();
  console.log("shift befor", range);
  that.windowLevelshift = 0;
  if (range[0] < 0) {
    that.windowLevelshift = 0 - range[0];
    let data = that.volumeBuffer;
    //完全拷贝
    let dataCopy = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
      dataCopy[i] = data[i] + that.windowLevelshift;
    }
    Scalars.setData(dataCopy, 1);
    console.log("shift after", Scalars.getRange());
  }
  mapper.setInputData(volumeImageData, 0);
  mapper.setInputData(centerline, 1);
  mapper.setWidth(400);
  mapper.setProjectionSlabNumberOfSamples(1);
  mapper.setProjectionSlabThickness(0);
  const cprManipulator = vtkCPRManipulator.newInstance({
    cprActor: actor,
  });

  that.CPRMapper = mapper;
  that.CPRCenterline = centerline;
  that.CPRActor = actor;
  that.CPRManipulator = cprManipulator;

  const property = that.CPRActor.getProperty();
  property.setColorLevel(imageData.wl + that.windowLevelshift);
  property.setColorWindow(imageData.ww);
  that.CPRActor.setProperty(property);

  that.renderer.addVolume(that.CPRActor);

  Vue.prototype.$loading(false);

  return () => {
    mapper.delete();
    actor.delete();
    centerline.delete();
    mapper = null;
    actor = null;
    centerline = null;
  };
}

export function initMipViewer(that) {
  console.log("initMipViewer");
  let { imageData, canvasSize } = that;
  let { mipRotate, scale } = imageData;
  if (!mipRotate) mipRotate = 0;
  //添加actor
  if (that.volumeActor) {
    initProps(
      that.volumeActor.getProperty(),
      imageData.ww,
      imageData.wl,
      imageData.colormapIndex,
      1,
    );
    that.renderer.addVolume(that.volumeActor);
  }
  //初始化相机
  let camera = vtkCamera.newInstance();
  camera.setFocalPoint(0, 0, 0);
  camera.setViewUp(0, 0, -1);
  camera.setPosition(0, 1, 0);
  that.renderer.setActiveCamera(camera);
  that.renderer.resetCamera();
  let distance = that.renderer.getActiveCamera().getDistance();
  let { baseSpacing, baseFactor } = scale;
  let zommNow = baseFactor / baseSpacing || 1;
  let angle =
    (Math.atan(canvasSize.height / (2 * zommNow * distance)) * 360) / Math.PI;
  that.renderer.getActiveCamera().setViewAngle(angle);
  that.renderer.getActiveCamera().azimuth(mipRotate);

  //渲染
  renderAndCapture(that, "initMipViewer");
}

function initOrientationWidget(that) {
  const axe = vtkAnnotatedCubeActor.newInstance();

  axe.setDefaultStyle({
    text: "L",
    fontStyle: "bold",
    fontFamily: "Arial",
    fontColor: "white",
    faceColor: "red",
    faceRotation: 0,
    edgeThickness: 0.1,
    edgeColor: "black",
    resolution: 400,
  });
  // axes.setXPlusFaceProperty({ text: '+X' });
  axe.setXMinusFaceProperty({
    text: "R",
    faceColor: "red",
  });
  axe.setYPlusFaceProperty({
    text: "P",
    faceColor: "blue",
  });
  axe.setYMinusFaceProperty({
    text: "A",
    faceColor: "blue",
  });
  axe.setZPlusFaceProperty({
    text: "S",
    faceColor: "green",
  });
  axe.setZMinusFaceProperty({
    text: "I",
    faceColor: "green",
  });

  const orientationWidget = vtkOrientationMarkerWidget.newInstance({
    actor: axe,
    interactor: that.renderWindow.getInteractor(),
  });
  orientationWidget.setEnabled(true);
  orientationWidget.setViewportCorner(
    vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT,
  );
  orientationWidget.setMinPixelSize(50);
  orientationWidget.setMaxPixelSize(100);

  that.renderWindow.render();

  return () => {
    orientationWidget.delete();
    axe.delete();
  };
}

let planeBounds, boundLPSPlanes;

export function resetVRCropping(image, mapper, widget) {
  const planeInstances = getPlanes(boundLPSPlanes, image);

  if (widget && planeBounds && boundLPSPlanes) {
    const state = widget.getWidgetState().getCroppingPlanes();
    state.setPlanes(planeBounds);
  }
  // console.log(cropState.getPlanes(), that.volumeMapper, "planes");
  mapper.removeAllClippingPlanes();
  planeInstances.forEach((plane) => {
    mapper.addClippingPlane(plane);
  });
}

function isValidCroppingPlanes(planes, bounds) {
  return (
    planes.Sagittal[0] <= planes.Sagittal[1] - 0.5 &&
    planes.Coronal[0] <= planes.Coronal[1] - 0.5 &&
    planes.Axial[0] <= planes.Axial[1] - 0.5 &&
    planes.Sagittal[0] >= bounds.Sagittal[0] &&
    planes.Sagittal[1] <= bounds.Sagittal[1] &&
    planes.Coronal[0] >= bounds.Coronal[0] &&
    planes.Coronal[1] <= bounds.Coronal[1] &&
    planes.Axial[0] >= bounds.Axial[0] &&
    planes.Axial[1] <= bounds.Axial[1]
  );
}

export function initVRCropping(that) {
  const cropWidget = vtkImageCroppingWidget.newInstance();

  const widgetManager = vtkWidgetManager.newInstance();
  widgetManager.setRenderer(that.renderer);
  const widget = widgetManager.addWidget(cropWidget);

  widgetManager.enablePicking();
  widgetManager.renderWidgets();

  // 去掉crop widget的3d属性
  widget.getRepresentations().forEach((rep) => {
    rep.getActors().forEach((actor) => {
      console.log(actor.getProperty().getPointSize(), "pointsize");
      actor.getProperty().setAmbient(1);
      actor.getProperty().setPointSize(0.5);
    });
  });

  cropWidget.setEdgeHandlesEnabled(false);
  cropWidget.setCornerHandlesEnabled(false);
  that.cropWidget = cropWidget;

  cropWidget.copyImageDataDescription(that.volumeImageData);
  const cropState = cropWidget.getWidgetState().getCroppingPlanes();

  cropWidget
    .getWidgetState()
    .setWorldToIndexT(that.volumeImageData.getWorldToIndex());
  cropWidget
    .getWidgetState()
    .setIndexToWorldT(that.volumeImageData.getIndexToWorld());
  cropWidget.getWidgetState().placeWidget(that.volumeImageData.getBounds());

  planeBounds = cropState.getPlanes();
  boundLPSPlanes = {
    Sagittal: getAxisBounds(planeBounds, "Sagittal", LPSOrientation),
    Coronal: getAxisBounds(planeBounds, "Coronal", LPSOrientation),
    Axial: getAxisBounds(planeBounds, "Axial", LPSOrientation),
  };

  let lastValidPlanes;
  cropState.onModified(() => {
    // const planes = getCroppingPlanes(
    //   that.volumeImageData,
    //   cropState.getPlanes(),
    // );
    const planes = cropState.getPlanes();
    const lpsPlanes = {
      Sagittal: getAxisBounds(planes, "Sagittal", LPSOrientation),
      Coronal: getAxisBounds(planes, "Coronal", LPSOrientation),
      Axial: getAxisBounds(planes, "Axial", LPSOrientation),
    };

    if (isValidCroppingPlanes(lpsPlanes, boundLPSPlanes)) {
      const croppingPlanes = clampCroppingPlanes(
        that.volumeImageData,
        lpsPlanes,
      );
      const planeInstances = getPlanes(croppingPlanes, that.volumeImageData);
      // console.log(cropState.getPlanes(), that.volumeMapper, "planes");
      that.volumeMapper.removeAllClippingPlanes();
      planeInstances.forEach((plane) => {
        that.volumeMapper.addClippingPlane(plane);
      });
      lastValidPlanes = lpsPlanes;
    } else {
      // LPSCroppingPlanes -> Bounds
      const planes = [0, 0, 0, 0, 0, 0];

      if (lastValidPlanes) {
        LPSAxes.forEach((axis) => {
          [
            planes[LPSOrientation[axis] * 2],
            planes[LPSOrientation[axis] * 2 + 1],
          ] = lastValidPlanes[axis];
        });
      }
      cropState.setPlanes(lastValidPlanes ? planes : planeBounds);
    }

    that.cropState = "crop";
  });

  that.renderer.resetCameraClippingRange();
  that.renderWindow.render(); // 确保渲染窗口更新

  return () => {
    cropWidget.delete();
    widgetManager.delete();
  };
}

// function bindInteractorStyles(that) {
//   const interactor = that.renderWindow.getInteractor();
//   const catcherDOM = document.getElementById("vrCursor");

//   interactor.setContainer(catcherDOM);

//   const interactorStyle = vtkInteractorStyleManipulator.newInstance();
//   interactor.setInteractorStyle(interactorStyle);

//   // 设置旋转中心
//   const bounds = that.volumeImageData.getBounds();
//   const center = vtkBoundingBox.getCenter(bounds);
//   interactorStyle.setCenterOfRotation(...center);

//   const rotateManipulator =
//     vtkMouseCameraTrackballRotateManipulator.newInstance();
//   rotateManipulator.setRotationFactor(2);
//   // // 设置使用focalPoint作为旋转中心
//   rotateManipulator.setButton(1);

//   interactorStyle.addMouseManipulator(rotateManipulator);

//   const panManipulator = vtkMouseCameraTrackballPanManipulator.newInstance();
//   panManipulator.setButton(3);
//   interactorStyle.addMouseManipulator(panManipulator);

//   const zoomManipulator = vtkMouseCameraTrackballZoomManipulator.newInstance();
//   zoomManipulator.setButton(2);
//   zoomManipulator.setScrollEnabled(true);
//   interactorStyle.addMouseManipulator(zoomManipulator);

//   return () => {
//     interactor.setContainer(null);
//     // interactorStyle.removeAllMouseManipulators();
//     rotateManipulator.delete();
//     panManipulator.delete();
//     zoomManipulator.delete();
//     interactorStyle.delete();
//     // interactor.unbindEvents();
//   };
// }

export function initVRViewer(that) {
  console.log("initVRViewer");
  //更新mapper 参数
  let Size = null,
    Radius = null,
    Blending = null,
    useLocalAmbientOcclusion = true;
  const vrParams = store.state.vrParams;
  Size = vrParams.Size;
  Radius = vrParams.Radius;
  Blending = vrParams.Blending;
  useLocalAmbientOcclusion = vrParams.useLocalAmbientOcclusion;
  // const lightFollowsCamera = vrParams.lightFollowsCamera;
  let volumeMapper = that.volumeMapper;
  let volumeActor = vtkVolume.newInstance();
  that.volumeActor = volumeActor;
  that.volumeActor.setMapper(volumeMapper);
  //添加actor
  if (that.volumeActor) {
    that.renderer.addVolume(that.volumeActor);
    wwwl(that);
  }
  bus.$emit("renderReady", that.fullScreenRenderer);

  //初始化光线
  // initLight(that.renderer, lightFollowsCamera);
  volumeMapper.setBlendMode(0);
  volumeMapper.setMaximumSamplesPerRay(4000);
  volumeMapper.setVolumetricScatteringBlending(Blending ? Blending : 0);
  volumeMapper.setGlobalIlluminationReach(0.5);
  if (useLocalAmbientOcclusion) {
    volumeMapper.setLocalAmbientOcclusion(true);
    volumeMapper.setLAOKernelRadius(Radius);
    volumeMapper.setLAOKernelSize(Size);
  } else {
    volumeMapper.setLocalAmbientOcclusion(false);
    volumeMapper.setLAOKernelRadius(0);
    volumeMapper.setLAOKernelSize(0);
  }

  //初始化相机

  let camera = that.renderer.getActiveCamera();
  camera.setFocalPoint(0, 0, 0);
  camera.setViewUp(0, 0, 1);
  camera.setPosition(0, -1, 0);
  // that.renderer.setActiveCamera(camera);
  that.renderer.resetCamera();
  that.renderer.resetCameraClippingRange();

  // let distance = camera.getDistance();
  // ensure correct lighting post camera manip
  // that.renderer.updateLightsGeometryToFollowCamera();
  // let { baseSpacing, baseFactor } = scale;
  // let zommNow = baseFactor / baseSpacing || 1;
  // let angle =
  //   (Math.atan(canvasSize.height / (2 * zommNow * distance)) * 360) / Math.PI;
  // that.renderer.getActiveCamera().setViewAngle(angle);
  // that.renderer.getActiveCamera().azimuth(0);
  // that.renderWindow.render();
  //渲染
  // renderAndCapture(that, "initVRViewer");
  const orientationWidgetCleaner = initOrientationWidget(that);

  const interactorCleaner = bindInteractorStyles(that);

  that.renderWindow.render();

  that.originCameraParams = {
    focalPoint: camera.getFocalPoint(),
    position: camera.getPosition(),
    viewUp: camera.getViewUp(),
    viewAngle: camera.getViewAngle(),
  };

  return () => {
    volumeActor.delete();
    volumeActor = null;
    orientationWidgetCleaner();
    interactorCleaner();
    // widgetCleaner();
    // camera.delete();
    // camera = null;
  };
}

export function initMprTandRViewer(that) {
  console.log("initMprTandRViewer");
  let { imageData } = that;

  //初始化平面
  //因为此处坐标系都是世界坐标，所以ct和pt可以共用一个vtkPlane
  let plane1 = vtkPlane.newInstance();
  let plane2 = vtkPlane.newInstance();
  that.clipPlane1 = plane1;
  that.clipPlane2 = plane2;

  //添加plane
  if (that.volumeMapper) {
    that.volumeMapper.addClippingPlane(that.clipPlane1);
    that.volumeMapper.addClippingPlane(that.clipPlane2);
  }

  //添加actor
  if (that.volumeActor) {
    initProps(
      that.volumeActor.getProperty(),
      imageData.ww,
      imageData.wl,
      imageData.colormapIndex,
      1,
    );
    that.renderer.addVolume(that.volumeActor);
  }

  updatePlane(that);

  return () => {
    plane1.delete();
    plane2.delete();
    plane1 = null;
    plane2 = null;
  };
}

export function updatePlane(that) {
  let {
    clipPlane1,
    clipPlane2,
    volumeImageData,
    imageData,
    AcrossPoint,
    canvasSize,
  } = that;
  let { curViewMod, scale } = imageData;
  if (clipPlane1 && clipPlane2 && volumeImageData) {
    let clipPlaneNormal1,
      clipPlaneNormal2,
      clipPlaneOrigin1 = [],
      clipPlaneOrigin2 = [];
    // const axes = CROSS.getAxes(AcrossPoint, curViewMod);
    let { newX, newY, newZ, newCenter } = CROSS.getNewAxesFromPlane(
      [AcrossPoint.x, AcrossPoint.y, AcrossPoint.z],
      AcrossPoint.planes[curViewMod].normal,
      AcrossPoint.planes[curViewMod].viewUp,
      curViewMod,
    );
    let curThickness =
      that.AcrossPoint[CROSS.curThicknessDic[curViewMod]] || 0.1;

    clipPlaneNormal1 = [newZ[0], newZ[1], newZ[2]];
    clipPlaneNormal2 = [-newZ[0], -newZ[1], -newZ[2]];
    for (let i = 0; i < 3; i++) {
      clipPlaneOrigin1[i] = newCenter[i] - (curThickness / 2) * newZ[i];
      clipPlaneOrigin2[i] = newCenter[i] + (curThickness / 2) * newZ[i];
    }
    that.clipPlane1.setNormal(clipPlaneNormal1);
    that.clipPlane1.setOrigin(clipPlaneOrigin1);
    that.clipPlane2.setNormal(clipPlaneNormal2);
    that.clipPlane2.setOrigin(clipPlaneOrigin2);

    //初始化相机

    let camera = that.renderer.getActiveCamera();
    if (!camera) camera = vtkCamera.newInstance();

    camera.setFocalPoint(0, 0, 0);
    camera.setViewUp(-newY[0], -newY[1], -newY[2]);

    //ssy 0608 mpr 坐标换算: 为了解决图像视觉上x方向颠倒的问题，做镜像翻转
    if (curViewMod === 1) {
      camera.setPosition(-newZ[0], -newZ[1], -newZ[2]);
    } else {
      camera.setPosition(newZ[0], newZ[1], newZ[2]);
    }
    that.renderer.setActiveCamera(camera);
    that.renderer.resetCamera();
    let distance = that.renderer.getActiveCamera().getDistance();
    let { baseSpacing, baseFactor } = scale;
    let zommNow = baseFactor / baseSpacing || 1;
    let angle =
      (Math.atan(canvasSize.height / (2 * zommNow * distance)) * 360) / Math.PI;
    that.renderer.getActiveCamera().setViewAngle(angle);

    //在这里加一个窗口的平移量
    let trans2D = that.$store.state.MPRTrans[imageData.curViewMod];
    let trans3D = {
      x: trans2D.x * newX[0] + trans2D.y * newY[0],
      y: trans2D.x * newX[1] + trans2D.y * newY[1],
      z: trans2D.x * newX[2] + trans2D.y * newY[2],
    };
    const position = camera.getPosition();
    const focalPoint = camera.getFocalPoint();
    let newPosi, newFocalpoint;
    newPosi = [
      position[0] + trans3D.x,
      position[1] + trans3D.y,
      position[2] + trans3D.z,
    ];
    newFocalpoint = [
      focalPoint[0] + trans3D.x,
      focalPoint[1] + trans3D.y,
      focalPoint[2] + trans3D.z,
    ];
    camera.setPosition(...newPosi);
    camera.setFocalPoint(...newFocalpoint);
    that.renderer.resetCameraClippingRange();
  }

  try {
    renderAndCapture(that, "updatePlane");
  } catch (e) {
    console.error(e, "render 失败", that.isInMPR);
    if (that.isInMPR) {
      that.$emit("renderError");
    }
    Vue.prototype.$loading(false);
  }
}

export function rotateForMip(that, rot, scale, canvasSize) {
  that.renderer.resetCamera();
  let distance = that.renderer.getActiveCamera().getDistance();
  let angle =
    (Math.atan(canvasSize.height / (2 * scale * distance)) * 360) / Math.PI;
  that.renderer.getActiveCamera().setViewAngle(angle);
  that.renderer.getActiveCamera().azimuth(rot);
  renderAndCapture(that, "rotateForMip");
}

export function rotateForVR(that, dAzimuth, dElevation, scale, canvasSize) {
  var camera = that.renderer.getActiveCamera();
  camera.azimuth(dAzimuth);
  camera.elevation(dElevation);
  camera.orthogonalizeViewUp();
  // if (that.lightFollowsCamera) {
  //   that.renderer.updateLightsGeometryToFollowCamera();
  // }
  that.renderer.resetCamera();
  let distance = camera.getDistance();
  let angle =
    (Math.atan(canvasSize.height / (2 * scale * distance)) * 360) / Math.PI;
  camera.setViewAngle(angle);
  // that.renderer.setActiveCamera(camera);
  // zoom(that, scale, canvasSize);
}

export function zoom(that, scale, canvasSize) {
  // that.renderer.resetCamera();
  let distance = that.renderer.getActiveCamera().getDistance();
  let angle =
    (Math.atan(canvasSize.height / (2 * scale * distance)) * 360) / Math.PI;
  that.renderer.getActiveCamera().setViewAngle(angle);
  if (that.isVR) {
    that.renderWindow.render();
    return;
  }
  renderAndCapture(that, "zoom");
}

export function wwwl(that) {
  let imageData = that.imageData;
  let bgColor = [0, 0, 0, 0];
  if (imageData.colormapIndex == "B&W Inverse") {
    bgColor = [1, 1, 1];
  }
  that.fullScreenRenderer.setBackground(bgColor);
  if (that.isCPR && that.CPRVoiListData?.length > 1) {
    const property = that.CPRActor.getProperty();
    property.setColorLevel(imageData.wl + that.windowLevelshift);
    property.setColorWindow(imageData.ww);
    that.CPRActor.setProperty(property);
    that.renderWindow.render();
  } else if (that.isVR) {
    let bottom = imageData.wl - imageData.ww / 2;
    let top = imageData.wl + imageData.ww / 2;
    initPropsVR(
      that.volumeActor.getProperty(),
      that.dataRange,
      bottom,
      top,
      imageData.presetName,
    );
    // renderAndCapture(that, "wwwl");
  } else {
    initProps(
      that.volumeActor.getProperty(),
      imageData.ww,
      imageData.wl,
      imageData.colormapIndex,
      1,
    );
    renderAndCapture(that, "wwwl");
  }
}
function getLineWithoutBounds(center, dir, extensionLength = 200) {
  // 归一化方向向量，避免不同长度导致不一致
  const dirLength = Math.sqrt(dir[0] ** 2 + dir[1] ** 2 + dir[2] ** 2);
  if (dirLength < 1e-6) return null;

  const normDir = dir.map((d) => d / dirLength);

  // 延伸线段（看起来无限长）
  const point1 = center.map((c, i) => c - normDir[i] * extensionLength);
  const point2 = center.map((c, i) => c + normDir[i] * extensionLength);

  return [point1, point2];
}
function renderAndCapture(that, source) {
  console.time("rendervolume");
  that.renderWindow.render();
  let { width, height } = that.canvasSize;
  let dataLenght = width * height;
  let imageDataArr = new Uint8ClampedArray(dataLenght * 4);
  let origBuf = new ImageData(imageDataArr, width, height);
  origBuf.isColor = true;
  //获取当前的每像素世界坐标系pixelSpacing
  let { baseSpacing, baseFactor } = that.imageData.scale;
  let pixelSpacingNow = baseSpacing / baseFactor;

  //当前十字线在世界坐标系上的坐标
  let crossOnWorld = [
    that.AcrossPoint.x,
    that.AcrossPoint.y,
    that.AcrossPoint.z,
  ];
  const extensionLength = Math.max(Number(width), Number(height)) * 1.5;
  const curViewMod = that.imageData.curViewMod;
  window.allRenderers[curViewMod] = that.renderer;
  const planes = that.AcrossPoint.planes;
  const targetPlane = planes[curViewMod];
  const targetNormal = targetPlane.normal;
  const otherPlanes = planes.filter((_, index) => index !== curViewMod);
  const xAxisProjPlaneName = {
    "transverse-xy": "coronal-xz", // transverse视图时，coronal-xz是x轴投影线
    "coronal-xz": "transverse-xy", // coronal视图时，transverse-xy是x轴投影线
    "sagittal-yz": "transverse-xy", // sagittal视图时，transverse-xy是x轴投影线
  }[targetPlane.name];
  let shadowPointsInfo = {};
  const allProjLines = [];
  const allLinesInfo = [];
  otherPlanes.forEach((otherPlane) => {
    // 交线方向
    const dir = [
      targetNormal[1] * otherPlane.normal[2] -
      targetNormal[2] * otherPlane.normal[1],
      targetNormal[2] * otherPlane.normal[0] -
      targetNormal[0] * otherPlane.normal[2],
      targetNormal[0] * otherPlane.normal[1] -
      targetNormal[1] * otherPlane.normal[0],
    ];
    const magnitude = Math.sqrt(dir[0] ** 2 + dir[1] ** 2 + dir[2] ** 2);
    if (magnitude < 1e-6) {
      return;
    }

    const unitDir = dir.map((d) => d / magnitude);

    const clipped = getLineWithoutBounds(
      crossOnWorld,
      unitDir,
      extensionLength,
    );

    const [worldP1, worldP2] = clipped;

    const displayCoords1 = that.renderer.worldToNormalizedDisplay(
      worldP1[0],
      worldP1[1],
      worldP1[2],
      width / height,
    );

    const displayCoords2 = that.renderer.worldToNormalizedDisplay(
      worldP2[0],
      worldP2[1],
      worldP2[2],
      width / height,
    );

    let x1 = displayCoords1[0] * width;
    let y1 = (1 - displayCoords1[1]) * height;

    let x2 = displayCoords2[0] * width;
    let y2 = (1 - displayCoords2[1]) * height;
    const axes = otherPlane.name == xAxisProjPlaneName ? "x" : "y";

    // 计算线段中点
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    // 线段方向单位向量
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / length;
    const uy = dy / length;

    allLinesInfo.push({
      midX,
      midY,
      ux,
      uy,
      plane: otherPlane.name,
      x1,
      y1,
      x2,
      y2,
      axes,
    });
    allProjLines.push({ x1, y1, x2, y2, plane: otherPlane.name, axes });
  });
  shadowPointsInfo = {
    planes,
    allProjLines,
    allLinesInfo,
    currentUnRotatePlane: targetPlane.name,
  };
  let { newX, newY, newZ } = CROSS.getNewAxesFromPlane(
    crossOnWorld,
    targetPlane.normal,
    targetPlane.viewUp,
    curViewMod
  );
  // const axes = CROSS.getAxes(that.AcrossPoint, that.imageData.curViewMod);
  //十字相对于左下角的屏幕坐标，是一个0到1之间的值
  let displayCoordsOfCross = that.renderer.worldToNormalizedDisplay(
    crossOnWorld[0],
    crossOnWorld[1],
    crossOnWorld[2],
    width / height,
  );
  let CrossOnImage = {
    x: displayCoordsOfCross[0] * width,
    y: (1 - displayCoordsOfCross[1]) * height,
  };
  //转换为世界坐标
  let dic = ["x", "y", "z"];
  let leftTopPos = {};
  for (let i = 0; i < 3; i++) {
    leftTopPos[dic[i]] =
      crossOnWorld[i] -
      CrossOnImage.x * pixelSpacingNow * newX[i] -
      CrossOnImage.y * pixelSpacingNow * newY[i];
  }

  let dataWithInfo = {
    //定义数据结构
    pixelSpacingW: pixelSpacingNow,
    pixelSpacingH: pixelSpacingNow,
    pixelSpacingD: 1, //这个值用不上
    leftTopPos: leftTopPos, //当前图像左上角在世界坐标系上的坐标
    origBuf: origBuf, //原始数据
    isFromVTKClip: true,
    imgorient: [newX, newY, newZ],
    width,
    height,
    shadowPointsInfo,
  };
  console.log(
    "renderAndCapture",
    JSON.stringify(dataWithInfo.leftTopPos, pixelSpacingNow, [
      newX,
      newY,
      newZ,
    ]),
  );
  that.imageData.dataWithInfo = dataWithInfo;
  that.$emit("changeDWIFromVR");
  Vue.prototype.$loading(false);
  console.timeEnd("rendervolume");
  //获取截图,并生成对应的dataWithInfo
  // that.renderWindow.captureImages()[0].then((src) => {
  //   // 创建一个 canvas 元素
  //   var canvas = document.createElement('canvas');
  //   var context = canvas.getContext('2d');
  // let origBuf = context.getImageData(0, 0, img.width, img.height);
  // origBuf.isColor = true

  //   // 将 base64 字符串转换为图像
  //   var img = new Image();
  //   img.src = src;
  //   img.onload = () => {
  //     // 绘制图像
  //     canvas.width = img.width;
  //     canvas.height = img.height;
  //     context.drawImage(img, 0, 0);

  //     // 得到 ImageData 对象

  //   }
  // }
  // )
}

export function request3DAnimation(fullScreenRenderer, enabled) {
  // let params = {};
  // if (localStorage.cvrParams) {
  //   params = JSON.parse(localStorage.cvrParams);
  // }
  let renderer = fullScreenRenderer.getRenderer();
  const volume = renderer.getVolumes()[0];
  const mapper = volume.getMapper();
  const property = volume.getProperty();

  if (renderer.getLights().length === 0) {
    renderer.createLight();
  }
  const light = renderer.getLights()[0];
  if (enabled) {
    light.setPositional(true);
  } else {
    light.setPositional(false);
  }
  mapper.setGlobalIlluminationReach(enabled ? 0.5 : 0);
  // property.setUseGradientOpacity(0, !enabled);

  const vrParams = store.state.vrParams;
  if (enabled) {
    mapper.setVolumetricScatteringBlending(
      vrParams.Blending ? vrParams.Blending : 0,
    );
  } else {
    mapper.setVolumetricScatteringBlending(0);
  }

  // Local ambient occlusion
  if (enabled) {
    vrParams.useLocalAmbientOcclusion
      ? mapper.setLocalAmbientOcclusion(true)
      : mapper.setLocalAmbientOcclusion(false);
    mapper.setLAOKernelSize(vrParams.Size ? vrParams.Size : 3);
    mapper.setLAOKernelRadius(vrParams.Radius ? vrParams.Radius : 6);
  } else {
    mapper.setLocalAmbientOcclusion(false);
    mapper.setLAOKernelSize(0);
    mapper.setLAOKernelRadius(0);
  }
  property.setAmbient(vrParams.Ambient ? vrParams.Ambient : 0.2);
  property.setDiffuse(vrParams.Diffuse ? vrParams.Diffuse : 0.7);
  let renderWindow = fullScreenRenderer.getRenderWindow();
  if (!renderWindow.getInteractor().isAnimating()) {
    renderWindow.render();
  }
}
