import WHEEL from "../../../assets/js/wheel.js";
const domFn = {
  //缩放
  scaleFn(that, moveDom, e) {
    e = e || window.event;
    let disX = e.clientX;
    let disY = e.clientY;
    let maxW = document.body.offsetWidth;
    let maxH = document.body.offsetHeight;
    document.onmousemove = (e) => {
      e = e || window.event;
      let { offsetLeft, offsetTop, clientWidth, clientHeight } = moveDom;
      let width = e.clientX - disX + clientWidth;
      let height = e.clientY - disY + clientHeight;
      if (width < 800) width = 800;
      if (height < 763) height = 763;
      if (width > maxW - offsetLeft) width = maxW - offsetLeft;
      if (height > maxH - offsetTop) maxH - offsetTop;
      that.style = {
        ...that.style,
        width,
        height,
      };
      disX = e.clientX;
      disY = e.clientY;
    };
    document.onmouseup = () => {
      document.onmousemove = null;
      document.onmouseup = null;
      that.resizeFlag++;
    };
  },
  //平移
  follow_mouse(that, id) {
    let oBox = document.getElementById(id),
      disX = 0,
      disY = 0;
    let { clientWidth, clientHeight } = oBox;
    let { innerWidth, innerHeight } = window;
    oBox.onmousedown = (e) => {
      e = e || window.event;
      let { offsetLeft, offsetTop } = oBox;
      disX = e.clientX - offsetLeft;
      disY = e.clientY - offsetTop;

      document.onmousemove = (e) => {
        e = e || window.event;
        let x = e.clientX - disX;
        let y = e.clientY - disY;
        if (x < 0) x = 0;
        else if (x > innerWidth - clientWidth) x = innerWidth - clientWidth;
        if (y < 0) y = 0;
        else if (y > innerHeight - clientHeight) y = innerHeight - clientHeight;
        that.style = {
          ...that.style,
          left: x,
          top: y,
        };
      };
      document.onmouseup = function () {
        document.onmousemove = null;
        document.onmouseup = null;
      };
      return false;
    };
  },
  //滚轮翻页事件
  setWHEEL(that) {
    let dom = that.$refs.vrBox;
    WHEEL(
      () => {
        that.vrImageData.vrRotate -= 10;
      },
      () => {
        that.vrImageData.vrRotate += 10;
      },
      dom,
    );
  },
  //调整大小
  setSize(that) {
    let { width, height } = that.style;
    let top = 36 + 17,
      bottom = 80,
      border = 1 * 8,
      space = 40;
    let calcWidth = that.dataSelectShow ? width - 300 : width - 95;
    let h = Math.floor((height - top - bottom - border) / 2);
    let w = Math.floor((calcWidth - border) / 2);
    let r = Math.floor(Math.min(h, w) / 2 - space);
    that.size[0] = {
      width: w,
      height: h * 2 + 2,
      top: top,
      left: 15,
      r,
    };
    that.size[1] = {
      width: w,
      height: h,
      top: top,
      left: w + 2 + 15,
      r,
    };
    that.size[2] = {
      width: w,
      height: h,
      top: top + h + 2,
      left: w + 2 + 15,
      r,
    };
    that.resizeFlag++;
  },
};

export default domFn;
