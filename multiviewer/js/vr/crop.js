import { vec3, mat4 } from "gl-matrix";
import vtkPlane from "@kitware/vtk.js/Common/DataModel/Plane";
import IMGPRO from "./imgpro.js";
import { GPU } from "gpu.js";

export function arrayEquals(a, b) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
export const LPSAxes = ["Sagittal", "Coronal", "Axial"];
export const LPSOrientation = {
  Left: vec3.fromValues(1, 0, 0),
  Right: vec3.fromValues(-1, 0, 0),
  Posterior: vec3.fromValues(0, 1, 0),
  Anterior: vec3.fromValues(0, -1, 0),
  Superior: vec3.fromValues(0, 0, 1),
  Inferior: vec3.fromValues(0, 0, -1),

  Sagittal: 0,
  Coronal: 1,
  Axial: 2,
};

export function getAxisBounds(bounds, axis, directions) {
  const index = 2 * directions[axis];
  return bounds.slice(index, index + 2);
}

function clampRangeToBounds(range, bounds) {
  return [
    Math.max(bounds[0], Math.min(bounds[1], range[0])),
    Math.max(bounds[0], Math.min(bounds[1], range[1])),
  ];
}

export function getImageSpatialExtent(image) {
  if (image) {
    const extent = image.getSpatialExtent();
    return {
      Sagittal: getAxisBounds(extent, "Sagittal", LPSOrientation),
      Coronal: getAxisBounds(extent, "Coronal", LPSOrientation),
      Axial: getAxisBounds(extent, "Axial", LPSOrientation),
    };
  }

  return {
    Sagittal: [0, 0],
    Coronal: [0, 0],
    Axial: [0, 0],
  };
}

export const clampCroppingPlanes = (image, planes) => {
  const lpsBounds = getImageSpatialExtent(image);
  // if perf becomes an issue, change this to modify the planes arg
  return {
    Sagittal: clampRangeToBounds(planes.Sagittal, lpsBounds.Sagittal),
    Coronal: clampRangeToBounds(planes.Coronal, lpsBounds.Coronal),
    Axial: clampRangeToBounds(planes.Axial, lpsBounds.Axial),
  };
};

function convertCropBoundaryToPlane(croppingPlanes, image, axis, lowerUpper) {
  const indexToWorld = image.getIndexToWorld();
  const orientation = image.getDirection();

  const origin = [0, 0, 0];
  const axisIndex = LPSOrientation[axis];
  origin[axisIndex] = croppingPlanes[axis][lowerUpper];
  vec3.transformMat4(origin, origin, indexToWorld);

  // The lower bound normal is the associated column in the
  // image orientation matrix. The upper bound normal is the
  // lower bound normal, but negated.
  // 0|1 => 1|-1
  const neg = -(lowerUpper * 2 - 1);
  const normal = [
    ...orientation.slice(axisIndex * 3, axisIndex * 3 + 3).map((c) => c * neg),
  ];

  return { origin, normal };
}

function reorientBoundaryNormals(lowerPlane, upperPlane) {
  const lowerToUpper = lowerPlane.normal;
  vec3.sub(lowerToUpper, upperPlane.origin, lowerPlane.origin);
  vec3.normalize(lowerToUpper, lowerToUpper);
  vec3.negate(upperPlane.normal, lowerPlane.normal);
}

export const getPlanes = (croppingPlanes, image) => {
  const planes = [
    convertCropBoundaryToPlane(croppingPlanes, image, "Sagittal", 0),
    convertCropBoundaryToPlane(croppingPlanes, image, "Sagittal", 1),
    convertCropBoundaryToPlane(croppingPlanes, image, "Coronal", 0),
    convertCropBoundaryToPlane(croppingPlanes, image, "Coronal", 1),
    convertCropBoundaryToPlane(croppingPlanes, image, "Axial", 0),
    convertCropBoundaryToPlane(croppingPlanes, image, "Axial", 1),
  ];

  reorientBoundaryNormals(planes[0], planes[1]);
  reorientBoundaryNormals(planes[2], planes[3]);
  reorientBoundaryNormals(planes[4], planes[5]);

  return planes.map((plane) => vtkPlane.newInstance(plane));
};

export const getResetCroppingPlanes = (image) => {
  const extent = image.getSpatialExtent();
  return clampCroppingPlanes(image, {
    Sagittal: getAxisBounds(extent, "Sagittal", LPSOrientation),
    Coronal: getAxisBounds(extent, "Coronal", LPSOrientation),
    Axial: getAxisBounds(extent, "Axial", LPSOrientation),
  });
};

function createMapList(dx, dy, dz) {
  const mapList = new Uint8Array(dx * dy * dz).fill(1);
  return mapList;
}

function formatPointList(pointList) {
  const first = pointList[0];
  const last = pointList[pointList.length - 1];
  const newPointList = [...pointList];
  const dicX = Math.abs(first.x - last.x);
  const dicY = Math.abs(first.y - last.y);
  console.log(dicX, dicY, "dicX dicY");
  if (dicX > 5 || dicY > 5) {
    let i = 5;
    if (dicX > dicY) {
      const disY = dicY / dicX;
      while (i < dicX) {
        const dirX = last.x - first.x > 0 ? -1 : 1;
        const dirY = last.y - first.y > 0 ? -1 : 1;
        newPointList.push({
          x: last.x + i * dirX,
          y: last.y + i * dirY * disY,
        });
        i += 5;
      }
    } else {
      const disX = dicX / dicY;
      while (i < dicY) {
        const dirX = last.x - first.x > 0 ? -1 : 1;
        const dirY = last.y - first.y > 0 ? -1 : 1;
        newPointList.push({
          x: last.x + i * dirX * disX,
          y: last.y + i * dirY,
        });
        i += 5;
      }
    }
  }
  return newPointList;
}

function rayCastingWithEvenodd(p, poly) {
  // px，py为p点的x和y坐标
  const px = p.x;
  const py = p.y;
  let res = false;

  for (let i = 0, l = poly.length, j = l - 1; i < l; j = i, i++) {
    const sx = poly[i].x;
    const sy = poly[i].y;
    const tx = poly[j].x;
    const ty = poly[j].y;

    // 点与多边形顶点重合
    if ((sx === px && sy === py) || (tx === px && ty === py)) {
      return true;
    }

    // 点的射线和多边形的一条边重合，并且点在边上
    if (
      sy === ty &&
      sy === py &&
      ((sx > px && tx < px) || (sx < px && tx > px))
    ) {
      return true;
    }

    // 判断线段两端点是否在射线两侧
    if ((sy < py && ty >= py) || (sy >= py && ty < py)) {
      // 求射线和线段的交点x坐标，交点y坐标当然是py
      const x = sx + ((py - sy) * (tx - sx)) / (ty - sy);

      // 点在多边形的边上
      if (x === px) {
        return true;
      }

      // x大于px来保证射线是朝右的，往一个方向射，假如射线穿过多边形的边界，flag取反一下
      if (x > px) {
        res = !res;
      }
    }
  }

  return res;
}

function isTwoArrayIntersect(arr1, arr2) {
  return arr1[0] <= arr2[1] && arr1[1] >= arr2[0];
}

export function setMapList(volumeData, renderer, view, size, pointList) {
  const [dx, dy, dz] = volumeData.getDimensions();

  const aspect = size[0] / size[1];

  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  pointList.map((p) => {
    const { x, y } = p;
    if (x < xMin) xMin = x;
    if (x > xMax) xMax = x;
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  });

  const screenMap = new Uint8Array(size[0] * size[1]).fill(0);
  try {
    console.time("rayCasting1 gpu");
    const gpulib = new GPU({ mode: "gpu" });
    const egde_n = [xMin, xMax, yMin, yMax];
    const pointListArr = pointList.map((point) => [point.x, point.y]);
    const ray_F = gpulib
      .createKernel(function (poly, egde_n, len) {
        let px = this.thread.x;
        let py = this.thread.y;

        if (
          px < egde_n[0] ||
          px > egde_n[1] ||
          py < egde_n[2] ||
          py > egde_n[3]
        )
          return 0;

        let res = 0;
        for (let m = 0, n = len - 1; m < len; n = m, m++) {
          const sx = poly[m][0];
          const sy = poly[m][1];
          const tx = poly[n][0];
          const ty = poly[n][1];
          // 点与多边形顶点重合
          if ((sx === px && sy === py) || (tx === px && ty === py)) {
            return 1;
          }
          if (
            sy === ty &&
            sy === py &&
            ((sx > px && tx < px) || (sx < px && tx > px))
          ) {
            return 1;
          }

          // 判断线段两端点是否在射线两侧
          if ((sy < py && ty >= py) || (sy >= py && ty < py)) {
            // 求射线和线段的交点x坐标，交点y坐标当然是py
            const x = sx + ((py - sy) * (tx - sx)) / (ty - sy);

            // 点在多边形的边上
            if (x === px) {
              return 1;
            }

            // x大于px来保证射线是朝右的，往一个方向射，假如射线穿过多边形的边界，flag取反一下
            if (x > px) {
              res = res ^ 1;
            }
          }
        }

        return res;
      })
      .setPipeline(true)
      .setOutput([size[0], size[1]]);

    const kernel = ray_F(pointListArr, egde_n, pointListArr.length);
    let arr = kernel.toArray();
    for (let i = 0; i < size[0]; i++) {
      for (let j = 0; j < size[1]; j++) {
        if (arr[j] && arr[j][i]) {
          screenMap[i + j * size[0]] = 1;
        }
      }
    }
    //释放上下文
    kernel.context.getExtension("WEBGL_lose_context").loseContext();
    kernel.delete();
    console.timeEnd("rayCasting1 gpu");
  } catch (e) {
    console.log("rayCasting1 gpu error", e);
    console.time("rayCasting1 cpu");
    for (let m = xMin; m < xMax; m++) {
      for (let n = yMin; n < yMax; n++) {
        if (rayCastingWithEvenodd({ x: m, y: n }, pointList)) {
          screenMap[m + n * size[0]] = 1;
        }
      }
    }
    console.timeEnd("rayCasting1 cpu");
  }

  let edgePointList = [
    [xMin, yMin],
    [xMax, yMin],
    [xMax, yMax],
    [xMin, yMax],
  ];

  let pickPoint = [];

  let di = 1000,
    si = 1 / di;

  for (let i = 0; i < edgePointList.length; i++) {
    const point = edgePointList[i];
    const display = [point[0] / size[0], (size[1] - point[1]) / size[1]];
    for (let j = 0; j < di; j++) {
      const world = renderer.normalizedDisplayToWorld(
        display[0],
        display[1],
        j * si,
        aspect,
      );
      const index = volumeData.worldToIndex(world);
      if (
        (index[0] >= 0 && index[0] < dx) ||
        (index[1] >= 0 && index[1] < dy) ||
        (index[2] >= 0 && index[2] < dz)
      ) {
        pickPoint.push(index);
      }
    }
  }

  let iMin = Infinity;
  let iMax = -Infinity;
  let jMin = Infinity;
  let jMax = -Infinity;
  let kMin = Infinity;
  let kMax = -Infinity;

  for (let i = 0; i < pickPoint.length; i++) {
    const index = pickPoint[i];
    if (index[0] < iMin) iMin = Math.floor(index[0]);
    if (index[0] > iMax) iMax = Math.ceil(index[0]);
    if (index[1] < jMin) jMin = Math.floor(index[1]);
    if (index[1] > jMax) jMax = Math.ceil(index[1]);
    if (index[2] < kMin) kMin = Math.floor(index[2]);
    if (index[2] > kMax) kMax = Math.ceil(index[2]);
  }

  iMin = Math.max(0, iMin);
  iMax = Math.min(dx - 1, iMax);
  jMin = Math.max(0, jMin);
  jMax = Math.min(dy - 1, jMax);
  kMin = Math.max(0, kMin);
  kMax = Math.min(dz - 1, kMax);

  const edge = [iMin, iMax, jMin, jMax, kMin, kMax];
  let minCubeSize = [iMax - iMin + 1, jMax - jMin + 1, kMax - kMin + 1];
  let scale = 1;
  if (dx * dy * dz > 512 * 512 * 250) {
    scale = 2;
    if (dx * dy * dz > 512 * 512 * 500) {
      scale = 4;
    }
  }
  if (scale > 1) {
    for (let i = 0; i < 3; i++) {
      minCubeSize[i] = Math.ceil(minCubeSize[i] / scale);
    }
  }
  console.log("cutVolume", edge.toString());
  console.log("minCubeSize", minCubeSize.toString(), "scale", scale);

  //摄像头矩阵
  const ViewMatrix = renderer.getActiveCamera().getViewMatrix();
  mat4.transpose(ViewMatrix, ViewMatrix);
  //投影矩阵
  const ProjectionMatrix = renderer
    .getActiveCamera()
    .getProjectionMatrix(aspect, -1.0, 1.0);
  mat4.transpose(ProjectionMatrix, ProjectionMatrix);

  const orientation = volumeData.getDirection(),
    origin = volumeData.getOrigin(),
    spacing = volumeData.getSpacing();
  const mapList = createMapList(dx, dy, dz);
  try {
    console.time("rayCasting gpu");
    const gpulib = new GPU({ mode: "gpu" });
    const map_F = gpulib
      .createKernel(
        function (
          screenMap,
          orientation,
          origin,
          spacing,
          ViewMatrix,
          ProjectionMatrix,
          size,
          edge,
          scale
        ) {
          let i = this.thread.x * scale + edge[0];
          let j = this.thread.y * scale + edge[2];
          let k = this.thread.z * scale + edge[4];

          let world1 =
            origin[0] +
            spacing[0] * i * orientation[0] +
            spacing[1] * j * orientation[3] +
            spacing[2] * k * orientation[6];
          let world2 =
            origin[1] +
            spacing[0] * i * orientation[1] +
            spacing[1] * j * orientation[4] +
            spacing[2] * k * orientation[7];
          let world3 =
            origin[2] +
            spacing[0] * i * orientation[2] +
            spacing[1] * j * orientation[5] +
            spacing[2] * k * orientation[8];

          let worldToView1 =
            world1 * ViewMatrix[0] +
            world2 * ViewMatrix[4] +
            world3 * ViewMatrix[8] +
            ViewMatrix[12];
          let worldToView2 =
            world1 * ViewMatrix[1] +
            world2 * ViewMatrix[5] +
            world3 * ViewMatrix[9] +
            ViewMatrix[13];
          let worldToView3 =
            world1 * ViewMatrix[2] +
            world2 * ViewMatrix[6] +
            world3 * ViewMatrix[10] +
            ViewMatrix[14];

          let viewToDisplay4 =
            worldToView1 * ProjectionMatrix[3] +
            worldToView2 * ProjectionMatrix[7] +
            worldToView3 * ProjectionMatrix[11] +
            ProjectionMatrix[15];
          let viewToDisplay1 =
            (worldToView1 * ProjectionMatrix[0] +
              worldToView2 * ProjectionMatrix[4] +
              worldToView3 * ProjectionMatrix[8] +
              ProjectionMatrix[12]) /
            viewToDisplay4;
          let viewToDisplay2 =
            (worldToView1 * ProjectionMatrix[1] +
              worldToView2 * ProjectionMatrix[5] +
              worldToView3 * ProjectionMatrix[9] +
              ProjectionMatrix[13]) /
            viewToDisplay4;

          let display0 = (viewToDisplay1 * size[0]) / 2 + size[0] / 2;
          let display1 = (viewToDisplay2 * size[1]) / 2 + size[1] / 2;
          let index =
            Math.floor(display0) + Math.floor(size[1] - display1) * size[0];

          if (screenMap[index] == 1) {
            return 0;
          } else {
            return 1;
          }
        },
      )
      .setPipeline(true)
      .setOutput(minCubeSize);
    const kernel = map_F(
      screenMap,
      orientation,
      origin,
      spacing,
      ViewMatrix,
      ProjectionMatrix,
      size,
      edge,
      scale
    );
    let arr = kernel.toArray();
    IMGPRO.upsamplingMapList_scale(mapList, arr, minCubeSize, edge, [dx, dy, dz], scale);
    //释放上下文
    kernel.context.getExtension("WEBGL_lose_context").loseContext();
    kernel.delete();
    console.timeEnd("rayCasting gpu");
    return mapList;
  } catch (e) {
    console.log("rayCasting gpu error", e);
    console.time("rayCasting cpu");

    let len = dx * dy;
    for (let i = 0; i < minCubeSize[0]; i++) {
      for (let j = 0; j < minCubeSize[1]; j++) {
        for (let k = 0; k < minCubeSize[2]; k++) {
          const world = volumeData.indexToWorld([i * scale + edge[0], j * scale + edge[2], k * scale + edge[4]]);
          const worldToView = vec3.transformMat4(
            vec3.create(),
            world,
            ViewMatrix,
          );
          const viewToDisplay = vec3.transformMat4(
            vec3.create(),
            worldToView,
            ProjectionMatrix,
          );
          const display = [
            (viewToDisplay[0] * size[0]) / 2 + size[0] / 2,
            (viewToDisplay[1] * size[1]) / 2 + size[1] / 2,
          ];

          const index =
            Math.floor(display[0]) + Math.floor(size[1] - display[1]) * size[0];
          if (screenMap[index]) {
            let indexNow = i * scale + edge[0] + (j * scale + edge[2]) * dx + (k * scale + edge[4]) * len;
            for (let m = 0; m < scale; m++) {
              for (let n = 0; n < scale; n++) {
                for (let p = 0; p < scale; p++) {
                  let newIndex = indexNow + m + n * dx + p * len;
                  mapList[newIndex] = 0;
                }
              }
            }
          }
        }
      }
    }
    console.timeEnd("rayCasting cpu");
    return mapList;
  }

  // 初版函数，使用worldToNormalizedDisplay 和使用投影矩阵直接计算性能相差约三倍，故废弃

  // console.time("rayCasting cpu_old");
  // for (let i = iMin; i <= iMax; i++) {
  //   for (let j = jMin; j <= jMax; j++) {
  //     for (let k = kMin; k <= kMax; k++) {
  //       const world = volumeData.indexToWorld([i, j, k]);
  //       const normalizeDis = renderer.worldToNormalizedDisplay(
  //         world[0],
  //         world[1],
  //         world[2],
  //         aspect,
  //       );
  //       const display = view.normalizedDisplayToDisplay(
  //         normalizeDis[0],
  //         normalizeDis[1],
  //         normalizeDis[2],
  //       );
  //       const index =
  //         Math.floor(display[0]) + Math.floor(size[1] - display[1]) * size[0];
  //       if (screenMap[index]) {
  //         mapList[i + j * dx + k * dx * dy] = 0;
  //       }
  //     }
  //   }
  // }
  // console.timeEnd("rayCasting cpu_old");
}

export function setNewData(mapList, mapper) {
  const volumeData = mapper.getInputData();
  const range = volumeData.getPointData().getScalars().getRange();
  console.log(range, "range");
  let buffer = volumeData.getPointData().getScalars().getData().slice();
  console.time("newdata");
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = mapList[i] ? buffer[i] : range[0];
  }
  volumeData.getPointData().getScalars().setData(buffer);
  volumeData.modified();
  console.timeEnd("newdata");
  buffer = null;
  // mapper.setInputData(volumeData);
}

export function resetData(mapper, buffer) {
  mapper.getInputData().getPointData().getScalars().setData(buffer);
  mapper.getInputData().modified();
}

export function tabelRemove(volumeData, threshhold) {
  let volumeSize = volumeData.getDimensions();
  console.log("tabelRemove in VR", volumeSize);
  console.time("tabelRemove");
  let buffer = volumeData.getPointData().getScalars().getData().slice();
  let ifNeedResampling = false, twice = false;
  if (buffer.length > 512 * 512 * 200) {
    ifNeedResampling = true;
    if (buffer.length > 512 * 512 * 400) {
      twice = true;
    }
  }
  if (ifNeedResampling) {
    let { newVolume, newSize } = IMGPRO.downsamplinVolume(buffer, volumeSize);
    buffer = newVolume;
    volumeSize = newSize;
    if (twice) {
      let temp = IMGPRO.downsamplinVolume(buffer, volumeSize);
      buffer = temp.newVolume;
      volumeSize = temp.newSize;
    }
  }
  const [dx, dy, dz] = volumeSize;

  let islands = IMGPRO.keepLargestIsland(buffer, volumeSize, threshhold);
  let mapList = new Uint8Array(dx * dy * dz).fill(255);
  if (islands.islandNumber > 0) {
    IMGPRO.fillHole(islands.islandBinaries, volumeSize, mapList);
    //释放内存
    islands.islandBinaries = null;
    //膨胀一个像素
    mapList = IMGPRO.dilate3D(mapList, volumeSize);
  }
  if (ifNeedResampling) {
    //升采样
    volumeSize = volumeData.getDimensions();
    if (twice) {
      let tempSize = [volumeSize[0] / 2, volumeSize[1] / 2, volumeSize[2] / 2];
      mapList = IMGPRO.upsamplingMapList(mapList, tempSize)
    }
    mapList = IMGPRO.upsamplingMapList(mapList, volumeSize);
  }
  console.timeEnd("tabelRemove");
  // //测试
  // IMGPRO.volumeToImage(mapList, volumeSize)
  // console.log("tabelRemove mapList:", mapList)
  return mapList;
}
