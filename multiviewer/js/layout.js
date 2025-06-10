const LAYOUT = {
  oneGrid(that, dom) {
    let { RBLeftWidth, RBTopWidth, RBRightWidth, RBBottomWidth } =
      that.canvasRange;
    let WIDTH = dom.clientWidth - RBLeftWidth - RBRightWidth;
    let HEIGHT = dom.clientHeight - RBTopWidth - RBBottomWidth;
    let width = Math.round(WIDTH);
    let height = Math.round(HEIGHT);
    let temp = {
      top: 0,
      left: 0,
      width: width,
      height: height,
      zindex: 0,
    };
    let canvasSize = [temp];
    return canvasSize;
  },
  oneGridForGrid(that, viewportDOM) {
    let { RBLeftWidth, RBTopWidth, RBRightWidth, RBBottomWidth } =
      that.canvasRange;
    const { left, top } = viewportDOM.getBoundingClientRect();
    const width = Math.round(viewportDOM.clientWidth);
    const height = Math.round(viewportDOM.clientHeight);
    const size = {
      top: top - RBTopWidth,
      left: left - RBLeftWidth,
      width,
      height,
    };
    return [size];
  },

  twoGridForGrid(that, viewportDOM) {
    return this.setSizeForGrid(1, 2, that, viewportDOM);
  },
  twoGridForGrid2(that, viewportDOM) {
    return this.setSizeForGrid(2, 1, that, viewportDOM);
  },
  threeGridForGrid(that, viewportDOM) {
    return this.setSizeForGrid(1, 3, that, viewportDOM);
  },
  three2GridForGrid(that, viewportDOM) {
    return this.setSizeForGrid(3, 1, that, viewportDOM);
  },
  three3GridForGrid(that, viewportDOM) {
    // 行 行
    // 口 ⎡⎤
    // 口 ⎣⎦
    let { RBLeftWidth, RBTopWidth, RBRightWidth, RBBottomWidth } =
      that.canvasRange;
    let {
      left,
      top,
      width: viewportW,
      height: viewportH,
    } = viewportDOM.getBoundingClientRect();
    left = left - RBLeftWidth;
    top = top - RBTopWidth;
    const width = Math.round(viewportW / 2);
    const height = Math.round(viewportH / 2);
    const canvasSize = [];

    // 一行
    for (let i = 0; i < 2; i++) {
      const renderTop = top + height * i;
      canvasSize.push({ left, top: renderTop, width, height, zindex: 0 });
    }
    // 第二行
    canvasSize.push({
      left: left + width,
      top,
      width,
      height: viewportH,
      zindex: 0,
    });
    return canvasSize;
  },
  fourGridForGrid(that, viewportDOM) {
    return this.setSizeForGrid(2, 2, that, viewportDOM);
  },
  four2GridForGrid(that, viewportDOM) {
    // 两列，左边一列满高度，右边一列高度三等分
    let { RBLeftWidth, RBTopWidth } = that.canvasRange;
    let {
      left,
      top,
      width: viewportW,
      height: viewportH,
    } = viewportDOM.getBoundingClientRect();
    left = left - RBLeftWidth;
    top = top - RBTopWidth;
    const width = Math.round(viewportW / 2);
    const height = Math.round(viewportH / 3);
    const canvasSize = [];

    canvasSize[0] = {
      left,
      top,
      width,
      height: viewportH,
      zindex: 0,
    };

    for (let i = 1; i < 4; i++) {
      const renderTop = top + height * (i - 1);
      canvasSize[i] = {
        left: left + width,
        top: renderTop,
        width,
        height,
        zindex: 0,
      };
    }
    return canvasSize;
  },
  four3GridForGrid(that, viewportDOM) {
    // 两行，上面一行满宽度，下面一行宽度三等分
    let { RBLeftWidth, RBTopWidth } = that.canvasRange;
    console.log(that.canvasRange, "canvasrange");
    let {
      left,
      top,
      width: viewportW,
      height: viewportH,
    } = viewportDOM.getBoundingClientRect();
    left = left - RBLeftWidth;
    top = top - RBTopWidth;
    const width = Math.round(viewportW / 3);
    const height = Math.round(viewportH / 2);
    const canvasSize = [];

    canvasSize[0] = {
      left,
      top,
      width: viewportW,
      height,
      zindex: 0,
    };

    for (let i = 1; i < 4; i++) {
      const renderLeft = left + width * (i - 1);
      canvasSize[i] = {
        left: renderLeft,
        top: height,
        width,
        height,
        zindex: 0,
      };
    }
    return canvasSize;
  },
  fiveGridForGrid(that, viewportDOM) {
    let { RBLeftWidth, RBTopWidth, RBRightWidth, RBBottomWidth } =
      that.canvasRange;
    let {
      left,
      top,
      width: viewportW,
      height: viewportH,
    } = viewportDOM.getBoundingClientRect();
    left = left - RBLeftWidth;
    top = top - RBTopWidth;
    const width = Math.round(viewportW / 3);
    const height = Math.round(viewportH / 2);
    const canvasSize = [];
    for (let i = 0; i < 4; i++) {
      let x = i % 2;
      let y = Math.floor(i / 2);
      let renderLeft = left + x * width;
      let renderTop = top + height * y;
      let obj = {
        left: renderLeft,
        top: renderTop,
        width,
        height,
        zindex: 0,
      };
      canvasSize.push(obj);
    }
    canvasSize.push({
      left: left + width * 2,
      top,
      width: width,
      height: viewportH,
      zindex: 0,
    });

    return canvasSize;
  },
  sixGridForGrid(that, viewportDOM) {
    return this.setSizeForGrid(3, 2, that, viewportDOM);
  },
  sixGrid2ForGrid(that, viewportDOM) {
    return this.setSizeForGrid(2, 3, that, viewportDOM);
  },
  nineGridForGrid(that, viewportDOM) {
    return this.setSizeForGrid(3, 3, that, viewportDOM);
  },
  twelveGridForGrid(that, viewportDOM) {
    return this.setSizeForGrid(3, 4, that, viewportDOM);
  },
  eighteenGridForGrid(that, viewportDOM) {
    return this.setSizeForGrid(3, 6, that, viewportDOM);
  },
  twentyGridForGrid(that, viewportDOM) {
    return this.setSizeForGrid(5, 4, that, viewportDOM);
  },
  twelveFourGridForGrid(that, viewportDOM) {
    return this.setSizeForGrid(6, 4, that, viewportDOM);
  },
  thirtyGridForGrid(that, viewportDOM) {
    return this.setSizeForGrid(6, 5, that, viewportDOM);
  },
  setSizeForGrid(column, row, that, viewerDOM, index) {
    let { RBLeftWidth, RBTopWidth, RBRightWidth, RBBottomWidth } =
      that.canvasRange;
    let { left, top, width, height } = viewerDOM.getBoundingClientRect();
    left = left - RBLeftWidth;
    top = top - RBTopWidth;
    const canvasSize = [];
    const widthPer = Math.round(width / row);
    const heightPer = Math.round(height / column);

    for (let i = 0; i < column; i++) {
      for (let j = 0; j < row; j++) {
        const renderTop = top + heightPer * i;
        const renderLeft = left + widthPer * j;
        canvasSize.push({
          top: renderTop,
          left: renderLeft,
          width: widthPer,
          height: heightPer,
          zindex: 0,
        });
      }
    }
    return canvasSize;
  },

  twoGrid(that, dom, index) {
    let canvasSize = this.setSize(1, 2, that, dom, index);
    return canvasSize;
  },
  twoGrid2(that, dom, index) {
    let canvasSize = this.setSize(2, 1, that, dom, index);
    return canvasSize;
  },
  threeGrid(that, dom, index) {
    let canvasSize = this.setSize(1, 3, that, dom, index);
    return canvasSize;
  },
  fourGrid(that, dom, index) {
    let canvasSize = this.setSize(2, 2, that, dom, index);
    return canvasSize;
  },

  sixGrid(that, dom, index) {
    let canvasSize = this.setSize(3, 2, that, dom, index);
    return canvasSize;
  },
  sixGrid2(that, dom, index) {
    let canvasSize = this.setSize(2, 3, that, dom, index);
    return canvasSize;
  },
  nineGrid(that, dom, index) {
    let canvasSize = this.setSize(3, 3, that, dom, index);
    return canvasSize;
  },

  twelveGrid(that, dom, index) {
    let canvasSize = this.setSize(3, 4, that, dom, index);
    return canvasSize;
  },

  eighteenGrid(that, dom, index) {
    let canvasSize = this.setSize(3, 6, that, dom, index);
    return canvasSize;
  },

  twentyGrid(that, dom, index) {
    let canvasSize = this.setSize(5, 4, that, dom, index);
    return canvasSize;
  },
  twelveFourGrid(that, dom, index) {
    let canvasSize = this.setSize(6, 4, that, dom, index);
    return canvasSize;
  },
  thirtyGrid(that, dom, index) {
    let canvasSize = this.setSize(6, 5, that, dom, index);
    return canvasSize;
  },
  //等分函数
  setSize(h, w, that, dom, index) {
    let { RBLeftWidth, RBTopWidth, RBRightWidth, RBBottomWidth } =
      that.canvasRange;
    let WIDTH = dom.clientWidth - RBLeftWidth - RBRightWidth;
    let HEIGHT = dom.clientHeight - RBTopWidth - RBBottomWidth;
    let canvasSize = [];

    let width = Math.round(WIDTH / w);
    let height = Math.round(HEIGHT / h);

    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        let left = width * j;
        let top = height * i;
        let obj = {
          left,
          top,
          width,
          height,
          zindex: 0,
        };
        canvasSize.push(obj);
      }
    }
    if (index > -1) {
      canvasSize[index] = this.getFullScreen(
        RBLeftWidth,
        RBTopWidth,
        WIDTH,
        HEIGHT,
      );
    }
    that.fullScreen_scale = Math.max(w, h);
    return canvasSize;
  },

  getFullScreen(width, height) {
    let margin = 30;
    let resp = {
      left: margin,
      top: margin,
      width: width - 2 * margin,
      height: height - 2 * margin,
      zindex: 20,
    };
    return resp;
  },
};

export default LAYOUT;
