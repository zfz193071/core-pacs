const domFn = {
  followMouse(that, id) {
    let oBox = document.getElementById(id);

    oBox.onmousedown = function (e) {
      e = e || window.event;
      let { clientWidth, clientHeight, offsetLeft, offsetTop } = oBox;
      let { innerWidth, innerHeight } = window;
      let disX = e.clientX - offsetLeft;
      let disY = e.clientY - offsetTop;
      document.onmousemove = function (e) {
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
        that.moveFlag++;
      };
      return false;
    };
  },
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
      if (width < 830) width = 830;
      if (height < 872) height = 872;
      if (width > maxW - offsetLeft) width = maxW - offsetLeft;
      if (height > maxH - offsetTop) height = maxH - offsetTop;
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
};

export default domFn;
