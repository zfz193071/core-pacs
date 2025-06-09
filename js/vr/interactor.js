import vtkInteractorStyleManipulator from "@kitware/vtk.js/Interaction/Style/InteractorStyleManipulator";
import vtkBoundingBox from "@kitware/vtk.js/Common/DataModel/BoundingBox";
import vtkMouseCameraTrackballRotateManipulator from "@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballRotateManipulator";
import vtkMouseCameraTrackballPanManipulator from "@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballPanManipulator";
import vtkMouseCameraTrackballZoomManipulator from "@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballZoomManipulator";

export function getMouseTypeByStore() {
  const mouseTypeStr = localStorage.getItem("vrShortcutKey");
  let result = {
    rotate: 1,
    pan: 3,
    zoom: 2,
  };
  const mouseMap = {
    left: 1,
    right: 3,
    middle: 2,
  };
  if (!mouseTypeStr) return result;

  const mouseType = JSON.parse(mouseTypeStr);
  result = {};
  Object.entries(mouseType).forEach(([key, value]) => {
    result[value.toLowerCase()] = mouseMap[key];
  });
  return result;
}

export function bindInteractorStyles(that) {
  const interactor = that.renderWindow.getInteractor();
  const catcherDOM = document.getElementById("vrCursor");

  const mouseType = getMouseTypeByStore();
  console.log(mouseType);
  interactor.setContainer(catcherDOM);

  const interactorStyle = vtkInteractorStyleManipulator.newInstance();
  that.interactorStyle = interactorStyle;

  interactor.setInteractorStyle(interactorStyle);

  // 设置旋转中心
  const bounds = that.volumeImageData.getBounds();
  const center = vtkBoundingBox.getCenter(bounds);
  interactorStyle.setCenterOfRotation(...center);

  const rotateManipulator =
    vtkMouseCameraTrackballRotateManipulator.newInstance();
  rotateManipulator.setRotationFactor(2);
  // // 设置使用focalPoint作为旋转中心
  rotateManipulator.setButton(mouseType.rotate);
  that.rotateManipulator = rotateManipulator;

  interactorStyle.addMouseManipulator(rotateManipulator);

  const panManipulator = vtkMouseCameraTrackballPanManipulator.newInstance();
  panManipulator.setButton(mouseType.pan);
  that.panManipulator = panManipulator;
  interactorStyle.addMouseManipulator(panManipulator);

  const zoomManipulator = vtkMouseCameraTrackballZoomManipulator.newInstance();
  zoomManipulator.setButton(mouseType.zoom);
  zoomManipulator.setScrollEnabled(true);
  that.zoomManipulator = zoomManipulator;
  interactorStyle.addMouseManipulator(zoomManipulator);

  return () => {
    // interactor.setContainer(null);
    // interactorStyle.removeAllMouseManipulators();
    interactor.delete();
    rotateManipulator.delete();
    panManipulator.delete();
    zoomManipulator.delete();
    interactorStyle.delete();
    // interactor.unbindEvents();
  };
}
