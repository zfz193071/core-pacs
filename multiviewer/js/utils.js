export function throttle(func, limit) {
  let timer;
  return function () {
    const args = arguments;
    const context = this;
    if (!timer) {
      func.apply(context, args);
      timer = setTimeout(() => {
        clearTimeout(timer);
        timer = null;
      }, limit);
    }
  };
}

export function debounce(func, delay, immediate = false) {
  let timer;
  return function () {
    const args = arguments;
    const context = this;
    if (timer) {
      clearTimeout(timer);
    }
    if (immediate && !timer) {
      func.apply(context, args);
      return;
    }
    timer = setTimeout(() => {
      func.apply(context, args);
      timer = null;
    }, delay);
  };
}

export function isLowerConfigureDevice() {
  const agent = navigator.userAgent;

  console.log(agent);

  //"'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0'"
  //'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
  // 判断是否非Chrome、edge浏览器
  if (!/Chrome\//.test(agent) && !/Edg\//.test(agent)) {
    return true;
  }

  // 判断版本是否高于109

  if (
    (agent.match(/Chrome\/(\d+)/) &&
      parseInt(agent.match(/Chrome\/(\d+)/)[1]) < 109) ||
    (agent.match(/Edg\/(\d+)/) && parseInt(agent.match(/Edg\/(\d+)/)[1]) < 109)
  ) {
    return true;
  }

  // 判断是否是32位浏览器
  if (/(win32)|(wow32)/.test(agent.toLowerCase())) {
    return true;
  }

  return false;
}

export function isInsideRange(ap, apRange) {
  const { x, y, z } = ap;
  let { x: xRange, y: yRange, z: zRange } = apRange;
  xRange = xRange.sort((a, b) => a - b);
  yRange = yRange.sort((a, b) => a - b);
  zRange = zRange.sort((a, b) => a - b);
  return (
    x >= xRange[0] &&
    x <= xRange[1] &&
    y >= yRange[0] &&
    y <= yRange[1] &&
    z >= zRange[0] &&
    z <= zRange[1]
  );
}

/**
 * 生成一条“无限长”（实际为较长固定长度）通过指定中心点、沿指定方向的直线段的两个端点。
 * 常用于三维空间中绘制一条不被边界裁剪的直线，例如医学MPR交叉线、辅助线等场景。
 *
 * @param {number[]} center - 直线的中心点坐标，数组形式 [x, y, z]。
 * @param {number[]} dir - 直线的方向向量，数组形式 [dx, dy, dz]。
 * @param {number} [extensionLength=200] - 线段在方向两端延伸的长度，默认200。
 * @returns {number[][]|null} - 返回线段的两个端点坐标数组 [point1, point2]，每个点为 [x, y, z]。若方向向量长度过小，返回 null。
 */
export function getLineWithoutBounds(center, dir, extensionLength = 200) {
  // 归一化方向向量，避免不同长度导致不一致
  const dirLength = Math.sqrt(dir[0] ** 2 + dir[1] ** 2 + dir[2] ** 2);
  if (dirLength < 1e-6) return null;

  const normDir = dir.map((d) => d / dirLength);

  // 延伸线段（看起来无限长）
  const point1 = center.map((c, i) => c - normDir[i] * extensionLength);
  const point2 = center.map((c, i) => c + normDir[i] * extensionLength);

  return [point1, point2];
}

/**
 * 计算旋转轴和角度
 * @param {number[]} center - 旋转中心 [x, y, z]
 * @param {number[]} start - 拖拽起点世界坐标
 * @param {number[]} end - 拖拽终点世界坐标
 * @returns {{axis: number[], angle: number}}
 */
export function getRotationAxisAndAngle(center, start, end) {
  const vecA = normalize([
    start[0] - center[0],
    start[1] - center[1],
    start[2] - center[2],
  ]);
  const vecB = normalize([
    end[0] - center[0],
    end[1] - center[1],
    end[2] - center[2],
  ]);
  const axis = normalize(cross(vecA, vecB));
  const dot = vecA[0] * vecB[0] + vecA[1] * vecB[1] + vecA[2] * vecB[2];
  const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
  if (axis.every((v) => Math.abs(v) < 1e-12)) return { axis: null, angle: 0 };
  return { axis, angle };
}

/**
 * 向量归一化
 * @param {number[]} v
 * @returns {number[]}
 */
export function normalize(v) {
  const len = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
  return len < 1e-12 ? [0, 0, 0] : [v[0] / len, v[1] / len, v[2] / len];
}

/**
 * 向量叉乘
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number[]}
 */
export function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/**
 * Rodrigues' rotation formula: 绕任意轴旋转向量
 * @param {number[]} v 向量
 * @param {number[]} axis 归一化轴
 * @param {number} rad 角度（弧度）
 * @returns {number[]}
 */
export function rotateVectorAroundAxis(v, axis, rad) {
  const [x, y, z] = v;
  const [u, v1, w] = axis;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);
  const dot = x * u + y * v1 + z * w;
  const crossVec = [v1 * z - w * y, w * x - u * z, u * y - v1 * x];
  return [
    u * dot * (1 - cosA) + x * cosA + crossVec[0] * sinA,
    v1 * dot * (1 - cosA) + y * cosA + crossVec[1] * sinA,
    w * dot * (1 - cosA) + z * cosA + crossVec[2] * sinA,
  ];
}

/**
 * 将 canvas 像素坐标转为世界坐标
 * @param {Object} pos - {x, y} 画布像素
 * @param {Object} renderer - 渲染器对象
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @param {number[]} worldCenter - 世界中心点
 * @returns {number[]} 世界坐标 [x, y, z]
 */
export function screenToWorld(
  pos,
  renderer,
  canvasWidth,
  canvasHeight,
  worldCenter,
) {
  const displayCoords = renderer.worldToNormalizedDisplay(
    worldCenter[0],
    worldCenter[1],
    worldCenter[2],
    canvasWidth / canvasHeight,
  );
  const screenPosNormalized = {
    x: pos.x / canvasWidth,
    y: 1 - pos.y / canvasHeight,
    z: displayCoords[2],
  };
  return renderer.normalizedDisplayToWorld(
    screenPosNormalized.x,
    screenPosNormalized.y,
    screenPosNormalized.z,
    1,
  );
}
