import { mat4, vec3, mat3 } from "gl-matrix";
import { radiansFromDegrees } from "@kitware/vtk.js/Common/Core/Math";
import vtkDataArray from "@kitware/vtk.js/Common/Core/DataArray";
import { wwwl } from "./index";

let worldCenter = [0, 0, 0];

function calculateVariance(data) {
  const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
  const squaredDifferences = data.map((value) => Math.pow(value - mean, 2));
  const variance =
    squaredDifferences.reduce((sum, value) => sum + value, 0) / data.length;
  return variance;
}

// 通过CPR点位的X,Y,Z方差，判断映射矩阵
function getWorldVectorsFromPoints(points, that) {
  const arrX = [],
    arrY = [],
    arrZ = [];
  for (let i = 0; i < points.length / 3; i++) {
    arrX.push(points[i * 3]);
    arrY.push(points[i * 3 + 1]);
    arrZ.push(points[i * 3 + 2]);
  }
  const varianceX = calculateVariance(arrX);
  const varianceY = calculateVariance(arrY);
  const varianceZ = calculateVariance(arrZ);

  const max = Math.max(varianceX, varianceY, varianceZ);
  // 映射矩阵的法方向是切线轴的反方向，反切方向是相机观察方向
  if (max === varianceX) {
    that.worldNormalVec = [1, 0, 0];
    that.worldBitangentVec = [0, -1, 0];
    that.AcrossPoint.CPRProjectionDirect = "X";
  } else if (max === varianceY) {
    that.worldNormalVec = [0, 1, 0];
    that.worldBitangentVec = [1, 0, 0];
    that.AcrossPoint.CPRProjectionDirect = "Y";
  } else {
    that.worldNormalVec = [0, 0, -1];
    that.worldBitangentVec = [0, -1, 0];
    that.AcrossPoint.CPRProjectionDirect = "Z";
  }
}

function updateDistanceAndDirection(that, worldBitangent, worldNormal) {
  // Directions and position in world space from the widget
  // 先使用默认向量
  if (!worldNormal) worldNormal = that.worldNormalVec;
  if (!worldBitangent) worldBitangent = that.worldBitangentVec;
  // widgetPlanes[crossViewType].normal = worldNormal;
  // widgetPlanes[crossViewType].viewUp = worldBitangent;
  const worldTangent = vec3.cross([], worldBitangent, worldNormal); // X
  vec3.normalize(worldTangent, worldTangent);
  const worldWidgetCenter = [...worldCenter];
  const distance = that.CPRManipulator.getCurrentDistance();

  // CPR mapper tangent and bitangent directions update
  // 获取一定距离到中心线的位置和方向
  const { orientation } =
    that.CPRMapper.getCenterlinePositionAndOrientation(distance);
  // modelDirections * baseDirections = worldDirections
  // => baseDirections = modelDirections^(-1) * worldDirections
  // 由获取的方向和距离重建模型坐标方位
  const modelDirections = mat3.fromQuat([], orientation);
  // 模型方向取反
  const inverseModelDirections = mat3.invert([], modelDirections);
  // 由正切、反切和法线方向重建世界坐标方位
  const worldDirections = mat3.fromValues(
    ...worldTangent,
    ...worldBitangent,
    ...worldNormal,
  );
  // 矩阵相乘，获得CPR方位矩阵
  const baseDirections = mat3.mul([], inverseModelDirections, worldDirections);

  that.CPRMapper.setDirectionMatrix(baseDirections);
  // Cross renderer update
  // 更新XY方向的 actor, 可以去掉这部分

  const width = that.CPRMapper.getWidth();
  const height = that.CPRMapper.getHeight();

  // CPR actor matrix update
  const worldActorTranslation = vec3.scaleAndAdd(
    [],
    worldWidgetCenter,
    worldTangent,
    -0.5 * width,
  );
  vec3.scaleAndAdd(
    worldActorTranslation,
    worldActorTranslation,
    worldNormal,
    distance - height,
  );
  const worldActorTransform = mat4.fromValues(
    ...worldTangent,
    0,
    ...worldNormal,
    0,
    ...vec3.scale([], worldBitangent, -1),
    0,
    ...worldActorTranslation,
    1,
  );

  that.CPRActor.setUserMatrix(worldActorTransform);

  // CPR camera reset
  const stretchCamera = that.renderer.getActiveCamera();
  const cameraDistance =
    (0.5 * height) /
    Math.tan(radiansFromDegrees(0.5 * stretchCamera.getViewAngle()));
  stretchCamera.setParallelScale(height);
  stretchCamera.setParallelProjection(true);
  const cameraFocalPoint = vec3.scaleAndAdd(
    [],
    worldWidgetCenter,
    worldNormal,
    distance - 0.5 * height,
  );
  const cameraPosition = vec3.scaleAndAdd(
    [],
    cameraFocalPoint,
    worldBitangent,
    -cameraDistance,
  );

  stretchCamera.setPosition(...cameraPosition);
  stretchCamera.setFocalPoint(...cameraFocalPoint);

  let cameraViewUp = worldNormal;
  if (that.AcrossPoint.CPRProjectionDirect === "X") {
    cameraViewUp = worldTangent;
    // cameraViewUp = vec3.rotateY([], worldTangent, [0, 0, 0], Math.PI / 2);
    // cameraViewUp = vec3.rotateZ([], cameraViewUp, [0, 0, 0], -Math.PI);
  } else if (that.AcrossPoint.CPRProjectionDirect === "Y") {
    cameraViewUp = worldTangent;
  }
  stretchCamera.setViewUp(cameraViewUp);
  that.renderer.resetCameraClippingRange();
  // interactor.render();

  that.renderWindow.render();
}

export function setCenterLineJSON(points) {
  const position = points.reduce(
    (pre, cur) => pre.concat([cur.x, cur.y, cur.z]),
    [],
  );
  const len = position.length / 3;
  let orientation = mat4.identity([]);
  let i = 1;
  while (i < len) {
    orientation = orientation.concat(mat4.identity([]));
    i++;
  }
  return {
    position,
    orientation,
  };
}

export function setCenterLine(json, that) {
  const position = json.position;

  // Set positions of the centerline (model coordinates)
  const centerlinePoints = Float32Array.from(position);
  const nPoints = centerlinePoints.length / 3;
  that.CPRCenterline.getPoints().setData(centerlinePoints, 3);

  // Set polylines of the centerline
  const centerlineLines = new Uint16Array(1 + nPoints);
  centerlineLines[0] = nPoints;
  for (let i = 0; i < nPoints; ++i) {
    centerlineLines[i + 1] = i;
  }
  that.CPRCenterline.getLines().setData(centerlineLines);

  // Create a rotated basis data array to oriented the CPR
  that.CPRCenterline.getPointData().setTensors(
    vtkDataArray.newInstance({
      name: "Orientation",
      numberOfComponents: 16,
      values: Float32Array.from(json.orientation),
    }),
  );
  that.CPRCenterline.modified();
  if (position.length < 6) {
    that.renderWindow.render();
    return;
  }

  const midPointDistance = that.CPRMapper.getHeight() / 2;
  const { worldCoords } = that.CPRManipulator.distanceEvent(midPointDistance);
  if (worldCoords) worldCenter = [...worldCoords];

  getWorldVectorsFromPoints(position, that);
  updateDistanceAndDirection(that);

  // widgetState[`getAxis${crossPlane}in${stretchPlane}`]().setManipulator(
  //   cprManipulator
  // );
  // widgetState[`getAxis${stretchPlane}in${crossPlane}`]().setManipulator(
  //   planeManipulator
  // );
  // widget.setManipulator(cprManipulator);

  that.renderWindow.render();
}

export function setCPRMode(mode, that) {
  if (!that.CPRVoiListData || that.CPRVoiListData.length < 2) return;
  if (mode === "1") {
    that.CPRMapper.useStretchedMode();
    updateDistanceAndDirection(that);
  } else if (mode === "2") {
    that.CPRMapper.useStraightenedMode();
    updateDistanceAndDirection(that);
  }
  that.AcrossPoint.CPRRotate = 0;
}

export function setAngle(angle, that) {
  // Compute normal and bitangent directions from angle
  if (!that.CPRVoiListData || that.CPRVoiListData.length < 2) return;
  const origin = [0, 0, 0];
  const normalDir = [...that.worldNormalVec];
  const bitangentDir = [...that.worldBitangentVec];

  if (that.AcrossPoint.CPRProjectionDirect === "Z")
    vec3.rotateZ(bitangentDir, bitangentDir, origin, angle);
  else if (that.AcrossPoint.CPRProjectionDirect === "Y")
    vec3.rotateY(bitangentDir, bitangentDir, origin, angle);
  else vec3.rotateX(bitangentDir, bitangentDir, origin, angle);

  // Get orientation from distance
  const distance = that.CPRManipulator.getCurrentDistance();
  const { orientation } =
    that.CPRMapper.getCenterlinePositionAndOrientation(distance);
  const modelDirections = mat3.fromQuat([], orientation || [0, 0, 0, 1]);

  // Set widget normal and viewUp from orientation and directions
  const worldBitangent = vec3.transformMat3([], bitangentDir, modelDirections);
  const worldNormal = vec3.transformMat3([], normalDir, modelDirections);
  // const widgetPlanes = widgetState.getPlanes();
  // widgetPlanes[stretchViewType].normal = worldBitangent;
  // widgetPlanes[stretchViewType].viewUp = worldNormal;
  // widgetState.setPlanes(widgetPlanes);

  updateDistanceAndDirection(that, worldBitangent, worldNormal);
}
export function setCPRThickness(thickness, that) {
  if (!that.CPRVoiListData || that.CPRVoiListData.length < 2) return;
  let { volumeSpacing, volumeSize } = that.seriesInfo;
  if (!volumeSpacing || !volumeSize) return;
  //求立方体的对角线长度
  let { w: lw, h: lh, d: ld } = volumeSize[0];
  let { w: pw, h: ph, d: pd } = volumeSpacing[1];
  let spacing = [pw, ph, pd],
    dimensions = [lw, lh, ld];
  let diagonal = vec3.len(vec3.mul([], spacing, dimensions));
  let thickRatio = thickness / diagonal;

  let samples = Math.ceil(thickness / pw);
  if (samples % 2 === 0) {
    samples += 1;
  }

  that.CPRMapper.setProjectionSlabThickness(thickRatio);
  that.CPRMapper.setProjectionSlabNumberOfSamples(samples);
  wwwl(that);
}

export function setCPRProjectionMode(mode, that) {
  if (!that.CPRVoiListData || that.CPRVoiListData.length < 2) return;
  that.CPRMapper.setProjectionMode(mode);
  that.renderWindow.render();
}
