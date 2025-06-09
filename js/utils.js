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
