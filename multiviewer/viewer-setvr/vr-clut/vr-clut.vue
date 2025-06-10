<template>
  <div>
    <div
      v-show="isCLUTActive"
      class="clutWrapper"
      :style="{
        width: clutSize.width + 'px',
        height: clutSize.height + 'px',
      }"
    >
      <!-- <div class="clutHeader"> -->
      <!-- <input type="file" name="files[]" @change = "readHis" :style="{position:'absolute', left:'5px', width:'300px'}"> -->
      <!-- <a class="clutClose" @click.stop.prevent="closeCLUTEditor"></a>
      </div> -->
      <div class="canvasBox" :style="{ background: canvasBgColor }">
        <canvas
          ref="bgCanvas"
          :class="optPointIndex >= 0 ? 'clutCursor' : ''"
        ></canvas>
        <div class="pointTag">
          <span></span>
          {{ $t("VR.value") }}:{{
            (
              (optCurrentPoint.x / clutSize.width) *
                ((hisMax - hisMin) * hisGap) +
              hisMin
            ).toFixed(2)
          }}
          {{ $t("VR.opacity") }}:{{
            (1 - (optCurrentPoint.y - 5) / 130).toFixed(2)
          }}
        </div>
      </div>
      <dl
        class="setOpt"
        :style="{
          left: clutList[optPointIndex >= 0 ? optPointIndex : 0]
            ? clutList[optPointIndex >= 0 ? optPointIndex : 0].position.left -
              35 +
              'px'
            : '0px',
          top: clutList[optPointIndex >= 0 ? optPointIndex : 0]
            ? clutList[optPointIndex >= 0 ? optPointIndex : 0].position.top +
              10 +
              'px'
            : '0px',
        }"
        v-show="optPointIndex >= 0"
      >
        <dt @click.stop="deleteClut"></dt>
        <dd>
          <!-- <input
            type="color"
            v-model="currentColor"
            @change.stop="changeColor"
          /> -->
          <input type="color" v-model="currentColor" />
        </dd>
      </dl>
    </div>
  </div>
</template>

<script>
import VR_PRESET from "./js/preclut.js";
import SERVER from "./js/server.js";

let hisData = null;
export default {
  name: "clutEditor",
  props: {
    clutSize: {
      //传输曲线窗口的大小
      type: Object,
      required: true,
    },
    isCLUTActive: {
      //传输曲线的状态
      type: Boolean,
      required: true,
      default: function () {
        return false;
      },
    },
    isCLUTPreActive: {
      type: Boolean,
      required: true,
      default: function () {
        return false;
      },
    },
    windowWidthLevel: {
      type: Object,
      required: true,
      default: function () {
        return { windowWidth: 100, windowLevel: 100 };
      },
    },
    hisUpdateFlag: {
      type: Number,
      default: -1,
    },
    colorPreset: {},
    imageDataArray: {},
    imageDataRange: {},
    requestAnimation: Function,
    cancelAnimation: Function,
  },
  data() {
    return {
      SERVER,
      clutList: [],
      defaultClutList: [],
      hisBuf: [],
      hisMin: -4000,
      hisMax: 4000,
      hisGap: 1,
      hisLine: new Array(0),
      reader: new FileReader(),
      hisValueMax: 0,
      valueTagPosition: { top: 400, left: -200 },
      canvas: {},
      clutListPre: [],
      VR_PRESET,
      currentWWWL: { windowWidth: 100, windowLevel: 100 },
      optMouseDownFlag: false,
      optStartPoint: {},
      optCurrentPoint: { x: 0, y: 0 },
      optEndPoint: {},
      optPointIndex: -1,
      currentColor: "#ffffff",
      currentClutIndex: -1,
      presetTop: 61,
      presetLeft: 201,
      dropFlag: false,
      bgCanvas: null,
      publicPath: process.env.BUILD_ENV === "test" ? "/miiaviewer/" : "/",
    };
  },
  created() {
    // 解析控制点文件
    this.parsePresetFile();
    this.hisMin = -4000;
    this.hisMax = 4000;
    for (let i = 0; i < VR_PRESET.length; i++) {
      let src = this.setSrc(VR_PRESET[i].name);
      let obj = Object.assign({}, VR_PRESET[i]);
      obj.src = src;
      this.VR_PRESET.splice(i, 1, obj);
    }
    console.log(this.publicPath, "env");
    this.worker = new Worker(this.publicPath + "js/worker.js");
    this.worker.onmessage = (e) => {
      hisData = e.data;
      // this.drawHistogram();
      this.reflashCanvas();
    };
  },
  mounted() {
    // this.$follow_mouse("presetWrapper");
    let dom = this.$refs.bgCanvas;
    this.bgCanvas = dom;
    if ($IsPC) {
      dom.addEventListener("mousedown", (e) => {
        return this.optHandleDown(e);
      });
      dom.addEventListener("mousemove", (e) => {
        return this.optHandleMove(e);
      });
      dom.addEventListener("mouseup", (e) => {
        return this.optHandleUp(e);
      });
      dom.addEventListener("mouseleave", (e) => {
        return this.optHandleUp(e);
      });
    } else {
      dom.addEventListener("touchstart", (e) => {
        return this.optHandleDown(e);
      });
      dom.addEventListener("touchmove", (e) => {
        return this.optHandleMove(e);
      });
      dom.addEventListener("touchend", (e) => {
        return this.optHandleUp(e);
      });
    }
  },
  computed: {
    canvasBgColor() {
      const theme = this.$store.state.theme;
      if (theme === "light") return "#d8d8d8";
      else if (theme === "dark") return "#404040";
      else return "#2A3C62";
    },
    histogramColor() {
      const theme = this.$store.state.theme;
      if (theme === "light") return "#CCCCCC";
      else if (theme === "dark") return "#666666";
      else return "#505E7C";
    },
  },
  watch: {
    histogramColor() {
      this.reflashCanvas();
    },
    imageDataArray(val) {
      this.worker.postMessage(val);
      console.log("worker postmessage");
    },
    currentColor() {
      this.clutList[this.optPointIndex].color = this.currentColor;
      this.reflashCanvas();
      this.sendClutToServer();
    },
    "colorPreset.Name": {
      handler() {
        this.clutList =
          this.colorPreset.list.length > 0
            ? this.colorPreset.list
            : JSON.parse(JSON.stringify(this.defaultClutList));
        if (this.clutList < 0) {
          this.optPointIndex = -1;
        }
        this.reflashCanvas();
      },
    },
    "colorPreset.list": {
      handler() {
        this.clutList = [...this.colorPreset.list];
        // if (this.clutList < 0) {
        //   this.optPointIndex = -1;
        // }
        this.reflashCanvas();
      },
    },
    windowWidthLevel: {
      handler: function () {
        this.reflashClut();
      },
      deep: true,
    },
    clutSize: {
      handler: function () {
        this.creatHisLine();
        this.reflashClut();
      },
      deep: true,
    },
    hisUpdateFlag: {
      handler: function () {
        this.hisBuf = SERVER.hisBuf; //直方图的初始数组
        this.hisMin = SERVER.hisMin; //直方图最小值 默认为0
        this.hisMax = SERVER.hisMin + SERVER.hisLength * SERVER.hisGap; //直方图最大值 默认为直方图数组总长度-1
        this.hisGap = SERVER.hisGap; //默认为1
        if (this.hisBuf.length > 0) {
          this.creatHisLine();
        }
        this.reflashClut();
      },
      deep: true,
    },
    isCLUTActive: {
      handler: function () {
        if (this.isCLUTActive == true) {
          this.getHisBuf();
        }
        this.reflashClut();
      },
      deep: true,
    },
    // clutList: {
    //   handler() {
    //     this.$emit("setColorPreset", this.clutList);
    //   },
    //   deep: true,
    // },
  },
  methods: {
    drawHistogram() {
      if (!hisData) return;
      const canvas = this.bgCanvas;
      const ctx = canvas.getContext("2d");
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const histogram = hisData;

      const keys = Object.keys(histogram).map((key) => parseInt(key));
      const min = this.hisMin;
      const max = this.hisMax;
      const binCount = max - min + 1;

      const barWidth = canvasWidth / binCount;
      let maxCount = -Infinity;
      for (let v of Object.values(histogram)) {
        if (v > maxCount) {
          maxCount = v;
        }
      }
      const scaleY = canvasHeight / maxCount;

      // ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = this.histogramColor;

      keys
        .sort((a, b) => a - b)
        .forEach((key) => {
          const x = (key - min) * barWidth;
          const y = canvasHeight - histogram[key] * scaleY;
          const height = histogram[key] * scaleY;
          ctx.fillRect(x, y, barWidth - 1, height);
        });
      console.log("drawHistogram done");
    },
    setSrc(name) {
      return require(`./images/${name}.png`);
    },
    // changeColor: function () {
    //   if (this.optPointIndex >= 0) {
    //     this.clutList[this.optPointIndex].color = this.currentColor;
    //     this.reflashCanvas();
    //     this.sendClutToServer();
    //   }
    // },
    touchEvent(e) {
      let parent = this.$getPoint(this.bgCanvas);
      let dom = this.$touchEvent(e);
      return {
        x: dom.x - parent.left,
        y: dom.y - parent.top,
      };
    },
    optHandleDown: function (e) {
      e.preventDefault();
      e.stopPropagation();
      this.canvas = this.$refs.bgCanvas;
      this.optStartPoint = this.touchEvent(e);
      this.optMouseDownFlag = true;
      this.requestAnimation();
      for (let i = 0; i < this.clutList.length; i++) {
        if (
          Math.pow(this.clutList[i].position.left - this.optStartPoint.x, 2) +
            Math.pow(this.clutList[i].position.top - this.optStartPoint.y, 2) <
          49
        ) {
          this.optPointIndex = i;
          this.currentColor = this.clutList[this.optPointIndex].color;

          this.reflashCanvas();
          this.sendClutToServer();
          return;
        }
      }
      if (this.optPointIndex >= 0) {
        this.optPointIndex = -1;
        this.optMouseDownFlag = false;
      } else {
        let lengthTemp = this.clutList.length;
        if (lengthTemp == 0) {
          let element = {
            position: { top: this.optStartPoint.x, left: this.optStartPoint.y },
            opacity: 1 - (this.optStartPoint.y - 5) / 130,
            color: "#eeeeee",
            value:
              (this.optStartPoint.x / this.canvas.width) *
                ((this.hisMax - this.hisMin) * this.hisGap) +
              this.hisMin,
          };
          this.clutList.splice(0, 0, element);
          this.optPointIndex = 0;
        } else if (
          this.optStartPoint.x > this.clutList[lengthTemp - 1].position.left
        ) {
          let element = {
            position: { top: this.optStartPoint.x, left: this.optStartPoint.y },
            opacity: 1 - (this.optStartPoint.y - 5) / 130,
            color: this.clutList[lengthTemp - 1].color,
            value:
              (this.optStartPoint.x / this.canvas.width) *
                ((this.hisMax - this.hisMin) * this.hisGap) +
              this.hisMin,
          };
          this.clutList.splice(lengthTemp, 0, element);
          this.optPointIndex = lengthTemp;
        } else if (this.optStartPoint.x < this.clutList[0].position.left) {
          let element = {
            position: { top: this.optStartPoint.x, left: this.optStartPoint.y },
            opacity: 1 - (this.optStartPoint.y - 5) / 130,
            color: this.clutList[0].color,
            value:
              (this.optStartPoint.x / this.canvas.width) *
                ((this.hisMax - this.hisMin) * this.hisGap) +
              this.hisMin,
          };
          this.clutList.splice(0, 0, element);
          this.optPointIndex = 0;
        } else {
          for (let i = 0; i < lengthTemp - 1; i++) {
            if (
              this.optStartPoint.x > this.clutList[i].position.left &&
              this.optStartPoint.x < this.clutList[i + 1].position.left
            ) {
              let element = {
                position: {
                  top: this.optStartPoint.x,
                  left: this.optStartPoint.y,
                },
                opacity: 1 - (this.optStartPoint.y - 5) / 130,
                color: this.clutList[i].color,
                value:
                  (this.optStartPoint.x / this.canvas.width) *
                    ((this.hisMax - this.hisMin) * this.hisGap) +
                  this.hisMin,
              };
              this.clutList.splice(i + 1, 0, element);
              this.optPointIndex = i + 1;
              break;
            }
          }
        }
      }
      if (this.optPointIndex > 0) {
        this.currentColor = this.clutList[this.optPointIndex].color;
      }
      this.reflashCanvas();
      this.sendClutToServer();
    },
    optHandleMove: function (e) {
      e.preventDefault();
      e.stopPropagation();
      this.canvas = this.$refs.bgCanvas;
      this.optCurrentPoint = this.touchEvent(e);
      if (this.optMouseDownFlag) {
        if (this.optCurrentPoint.y > 4 && this.optCurrentPoint.y < 136) {
          this.clutList[this.optPointIndex].position.left =
            this.optCurrentPoint.x;
          this.clutList[this.optPointIndex].position.top =
            this.optCurrentPoint.y;
          this.clutList[this.optPointIndex].value =
            (this.optCurrentPoint.x / this.canvas.width) *
              ((this.hisMax - this.hisMin) * this.hisGap) +
            this.hisMin;
          this.clutList[this.optPointIndex].opacity =
            1 - (this.optCurrentPoint.y - 5) / 130;

          if (this.optPointIndex == 0) {
            if (
              this.clutList[this.optPointIndex].value >
              this.clutList[this.optPointIndex + 1].value
            ) {
              this.clutList[this.optPointIndex].value =
                this.clutList[this.optPointIndex + 1].value;
            }
          } else if (this.optPointIndex == this.clutList.length) {
            if (
              this.clutList[this.optPointIndex].value <
              this.clutList[this.optPointIndex - 1].value
            ) {
              this.clutList[this.optPointIndex].value =
                this.clutList[this.optPointIndex - 1].value;
            }
          } else {
            if (
              this.optPointIndex < this.clutList.length - 1 &&
              this.clutList[this.optPointIndex].value >
                this.clutList[this.optPointIndex + 1].value
            ) {
              this.clutList[this.optPointIndex].value =
                this.clutList[this.optPointIndex + 1].value;
            }
            if (
              this.optPointIndex > 0 &&
              this.clutList[this.optPointIndex].value <
                this.clutList[this.optPointIndex - 1].value
            ) {
              this.clutList[this.optPointIndex].value =
                this.clutList[this.optPointIndex - 1].value;
            }
          }
        }
        this.reflashCanvas();
        SERVER.imageScaleType = 0;
        this.$emit("setColorPreset", this.clutList);
        // this.sendClutToServer();
      }
      if (this.optCurrentPoint.y < 5) {
        this.optCurrentPoint.y = 5;
      }
      if (this.optCurrentPoint.y > 135) {
        this.optCurrentPoint.y = 135;
      }
    },
    optHandleUp: function (e) {
      this.optMouseDownFlag = false;
      this.$emit("setColorPreset", this.clutList);
      this.cancelAnimation();
      // this.sendClutToServer();
    },
    getHisBuf: function () {
      let message = SERVER.messageHeader + "UDW2C" + "GETHS";
      // SERVER.sendBin(message);
    },
    sendClutToServer: function () {
      // this.$emit("setColorPreset", this.clutList);
      if (SERVER.timerFlag == 1 && SERVER.imageScaleType != 1) return;
      SERVER.timerFlag = 1;
      setTimeout(function () {
        SERVER.timerFlag = 0;
      }, 100);
      let num = 1;

      let message =
        SERVER.messageHeader +
        "UDW2C" +
        "SETTR" +
        SERVER.imageScaleType +
        SERVER.int16ToStr(this.clutList.length);

      for (let i = 0; i < this.clutList.length; i++) {
        let temp = "";
        temp += SERVER.float2Str(this.clutList[i].value);
        let rgb = SERVER.hex2rgb(this.clutList[i].color);
        let rgbString = String.fromCharCode(rgb[0], rgb[1], rgb[2]);
        temp += rgbString;
        temp += SERVER.float2Str(this.clutList[i].opacity);
        message += temp;
      }
      // SERVER.sendBin(message);
      SERVER.imageScaleType = 1;
    },
    changePreset: function (index) {
      this.clutList = [];
      this.defaultClutList = [];
      for (let i = 0; i < this.clutListPre[index].length; i++) {
        this.clutList[i] = {
          position: { top: 0, left: 0 },
          opacity: 0,
          color: "",
          value: 0,
        };
        this.clutList[i].opacity = this.clutListPre[index][i].opacity;
        this.clutList[i].color = this.clutListPre[index][i].color;
        this.clutList[i].value = this.clutListPre[index][i].value;
        this.defaultClutList[i] = {
          position: { top: 0, left: 0 },
          opacity: 0,
          color: "",
          value: 0,
        };
        this.defaultClutList[i].opacity = this.clutListPre[index][i].opacity;
        this.defaultClutList[i].color = this.clutListPre[index][i].color;
        this.defaultClutList[i].value = this.clutListPre[index][i].value;
        let rgb = SERVER.hex2rgb(this.clutList[i].color);
      }
      // 重置窗宽窗位
      let temp = {
        windowWidth: this.hisMax - this.hisMin,
        windowLevel: this.hisMin + (this.hisMax - this.hisMin) / 2,
      };
      this.currentWWWL.windowWidth = temp.windowWidth;
      this.currentWWWL.windowLevel = temp.windowLevel;
      this.$emit("update:windowWidthLevel", temp);

      this.currentClutIndex = index;
      // 发送更改设置新的信号
      let message = SERVER.messageHeader + "UDW2C" + "SETPS";

      let ambient = SERVER.float2Str(parseFloat(VR_PRESET[index].ambient)); //float
      let diffuse = SERVER.float2Str(parseFloat(VR_PRESET[index].diffuse)); //float
      let specular = SERVER.float2Str(parseFloat(VR_PRESET[index].specular)); //float
      let specularPower = SERVER.float2Str(
        parseFloat(VR_PRESET[index].specularPower),
      ); //float
      let interpolation = String.fromCharCode(
        parseInt(VR_PRESET[index].interpolation),
      ); //uchar
      let shade = String.fromCharCode(parseInt(VR_PRESET[index].shade)); //uchar

      message +=
        ambient + diffuse + specular + specularPower + interpolation + shade;
      message += SERVER.int16ToStr(this.clutList.length);

      for (let i = 0; i < this.clutList.length; i++) {
        message += SERVER.float2Str(this.clutList[i].value);
        let rgb = SERVER.hex2rgb(this.clutList[i].color);
        let rgbString = String.fromCharCode(rgb[0], rgb[1], rgb[1]);
        message += rgbString;
        message += SERVER.float2Str(this.clutList[i].opacity);
      }
      // SERVER.sendBin(message);
    },
    reflashClut: function (num) {
      if (this.clutList.length < 1) return;
      let trans1 =
        this.windowWidthLevel.windowLevel - this.currentWWWL.windowLevel;
      for (let i = 0; i < this.clutList.length; i++) {
        this.clutList[i].value += trans1;
      }
      let temp = this.clutList[parseInt(this.clutList.length / 2)].value;
      for (let i = 0; i < this.clutList.length; i++) {
        this.clutList[i].value =
          temp +
          ((this.clutList[i].value - temp) *
            this.windowWidthLevel.windowWidth) /
            this.currentWWWL.windowWidth;
      }

      this.currentWWWL.windowWidth = this.windowWidthLevel.windowWidth;
      this.currentWWWL.windowLevel = this.windowWidthLevel.windowLevel;
      this.optPointIndex = -1;
      this.reflashCanvas();

      this.sendClutToServer();
    },
    closeCLUTEditor: function () {
      let temp = !this.isCLUTActive;
      this.$emit("update:isCLUTActive", temp);
    },
    closeCLUTTable: function () {
      let temp = !this.isCLUTPreActive;
      this.$emit("update:isCLUTPreActive", temp);
    },
    readHis: function (e) {
      let file = e.target.files[0];
      this.reader.readAsArrayBuffer(file);
      this.reader.onload = this.copyHis;
    },
    copyHis: function (e) {
      let reader = e.target;
      this.hisBuf = new Int32Array(reader.result);
      this.hisMin = -3024;
      this.hisMax = this.hisMin + this.hisBuf.length;

      this.creatHisLine();
      this.drawHis();
      let temp = {
        windowWidth: this.hisMax - this.hisMin,
        windowLevel: this.hisMin + (this.hisMax - this.hisMin) / 2,
      };
      this.currentWWWL.windowWidth = temp.windowWidth;
      this.currentWWWL.windowLevel = temp.windowLevel;
      this.$emit("update:windowWidthLevel", temp);
    },
    creatHisLine: function () {
      if (this.hisBuf.length < 1) return;
      this.hisLine.length = 0;
      this.hisValueMax = 0;
      let leftMargin = 10;
      let rightMargin = 10;
      let viewWidth = this.clutSize.width - leftMargin - rightMargin;
      let division = (this.hisMax - this.hisMin) / viewWidth;
      let gap = parseInt(division);
      let pointOBj = { x: 0, y: 0, count: 0 };
      let element0 = { x: leftMargin - 1, y: 0, count: 0 };
      this.hisLine.push(element0); //为了保证闭合的时候最左端一定是0
      let current = 0;
      let num = 0;
      for (let i = this.hisMin + 3; i < this.hisMax - 3; i++) {
        let j = parseInt((i - this.hisMin) / division);
        if (j > current && num > 0) {
          let element = {
            x: pointOBj.x,
            y: pointOBj.y,
            count: parseInt(pointOBj.count / num),
          };
          this.hisLine.push(element);
          if (element.count > this.hisValueMax) {
            this.hisValueMax = element.count;
          }
          current = j;
          pointOBj.y = 0;
          pointOBj.count = 0;
          num = 0;
        }
        for (let a = -gap; a < gap + 1; a++) {
          pointOBj.count += this.hisBuf[i + a - this.hisMin];
          num += 1;
        }
        pointOBj.x = leftMargin + current;
      }
      let element = { x: pointOBj.x, y: pointOBj.y, count: pointOBj.count };
      let element1 = { x: pointOBj.x + 1, y: pointOBj.y, count: 0 };
      this.hisLine.push(element);
      this.hisLine.push(element1); //为了保证闭合的时候右端一定为0
    },
    reflashCanvas: function () {
      this.canvas = this.$refs.bgCanvas;
      if (!this.isCLUTActive) {
        return;
      }
      if (this.canvas == undefined) {
        return;
      }
      this.canvas.width = this.clutSize.width;
      // this.canvas.left = 5;
      this.canvas.height = this.clutSize.height;
      let cxt = this.canvas.getContext("2d");
      cxt.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // if (this.hisValueMax > 0 && this.hisLine.length > 0) {
      //   this.drawHis();
      // }
      if (this.clutList.length > 0) {
        this.drawHistogram();
        this.drawClut();
      }
    },
    drawHis: function () {
      this.canvas = this.$refs.bgCanvas;
      let cxt = this.canvas.getContext("2d");
      cxt.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.hisLine[0].y =
        this.canvas.height -
        (this.hisLine[0].count / this.hisValueMax) * (this.canvas.height - 5);
      cxt.strokeStyle = "#8a9baf";
      cxt.fillStyle = "#4c5868";
      cxt.beginPath();
      cxt.moveTo(this.hisLine[0].x, this.hisLine[0].y);
      for (let i = 1; i < this.hisLine.length; i++) {
        this.hisLine[i].y =
          this.canvas.height -
          (this.hisLine[i].count / this.hisValueMax) * (this.canvas.height - 5);
        cxt.lineTo(this.hisLine[i].x, this.hisLine[i].y);
      }
      cxt.closePath();
      cxt.stroke();
      cxt.fill();
    },
    drawClut: function () {
      this.canvas = this.$refs.bgCanvas;
      let cxt = this.canvas.getContext("2d");
      let grd = cxt.createLinearGradient(0, 0, this.canvas.width, 0);
      for (let i = 0; i < this.clutList.length; i++) {
        this.clutList[i].position.left =
          ((this.clutList[i].value - this.hisMin) /
            ((this.hisMax - this.hisMin) * this.hisGap)) *
          this.canvas.width;
        this.clutList[i].position.top =
          (1 - this.clutList[i].opacity) * 130 + 5;
        let temp = this.clutList[i].position.left / this.canvas.width;
        if (temp > 1) {
          temp = 1;
        }
        if (temp < 0) {
          temp = 0;
        }
        grd.addColorStop(temp, this.clutList[i].color);
      }
      cxt.globalAlpha = 0.8;
      cxt.beginPath();
      this.clutList[0]
        ? cxt.moveTo(
            this.clutList[0].position.left,
            this.clutList[0].position.top,
          )
        : null;
      for (let i = 1; i < this.clutList.length; i++) {
        cxt.lineTo(
          this.clutList[i].position.left,
          this.clutList[i].position.top,
        );
      }
      this.clutList[0]
        ? cxt.lineTo(
            this.clutList[this.clutList.length - 1].position.left,
            this.canvas.height,
          )
        : null;
      this.clutList[0]
        ? cxt.lineTo(this.clutList[0].position.left, this.canvas.height)
        : null;
      cxt.closePath();
      cxt.fillStyle = grd;
      cxt.fill();
      cxt.globalAlpha = 1;
      for (let i = 0; i < this.clutList.length; i++) {
        cxt.beginPath();
        cxt.arc(
          this.clutList[i].position.left,
          this.clutList[i].position.top,
          5,
          0,
          2 * Math.PI,
        );
        cxt.fillStyle = this.clutList[i].color;
        cxt.closePath();
        cxt.fill();
        if (i === this.optPointIndex) {
          cxt.lineWidth = 2;
          cxt.strokeStyle = "#ffff00";
        } else {
          cxt.lineWidth = 1;
          cxt.strokeStyle = "#4ffdff";
        }

        cxt.stroke();
      }
    },
    parsePresetFile: function () {
      // 每次都要拷贝
      let testList = VR_PRESET;
      for (let i = 0; i < testList.length; i++) {
        try {
          testList[i].colorTransfer.pixelValue =
            testList[i].colorTransfer.pixelValue.split(" ");
          testList[i].colorTransfer.color =
            testList[i].colorTransfer.color.split(" ");
          testList[i].scalarOpacity.opacity =
            testList[i].scalarOpacity.opacity.split(" ");
          testList[i].scalarOpacity.pixelValue =
            testList[i].scalarOpacity.pixelValue.split(" ");
        } catch (e) {
          console.log(e);
        }

        let clutListCur = [];
        // 解析像素点值和颜色值
        for (let j = 0; j < testList[i].colorTransfer.num; j++) {
          testList[i].colorTransfer.pixelValue[j] = parseFloat(
            testList[i].colorTransfer.pixelValue[j],
          );
          try {
            testList[i].colorTransfer.color[j] =
              testList[i].colorTransfer.color[j].split("(")[1];
            testList[i].colorTransfer.color[j] =
              testList[i].colorTransfer.color[j].split(")")[0];
            testList[i].colorTransfer.color[j] =
              testList[i].colorTransfer.color[j].split(",");
          } catch (e) {
            console.log(e);
          }
          let rgb3 = [];
          for (let k = 0; k < 3; k++) {
            rgb3[k] = parseFloat(testList[i].colorTransfer.color[j][k]);
          }
          testList[i].colorTransfer.color[j] = rgb3;
        }
        // 解析像素点值和透明度值
        for (let j = 0; j < testList[i].scalarOpacity.num; j++) {
          testList[i].scalarOpacity.pixelValue[j] = parseFloat(
            testList[i].scalarOpacity.pixelValue[j],
          );
          testList[i].scalarOpacity.opacity[j] = parseFloat(
            testList[i].scalarOpacity.opacity[j],
          );
        }
        // 交叉生成所有的控制点
        let a = 0;
        let b = 0;
        while (a < testList[i].colorTransfer.num) {
          let cPoint = {
            position: { top: 0, left: 0 },
            opacity: -1000000,
            color: testList[i].colorTransfer.color[a],
            value: testList[i].colorTransfer.pixelValue[a],
          };
          while (b < testList[i].scalarOpacity.num) {
            if (
              testList[i].colorTransfer.pixelValue[a] ==
              testList[i].scalarOpacity.pixelValue[b]
            ) {
              cPoint.opacity = testList[i].scalarOpacity.opacity[b];
              b++;
              break;
            } else if (
              testList[i].colorTransfer.pixelValue[a] <
              testList[i].scalarOpacity.pixelValue[b]
            ) {
              break;
            } else {
              let ncPoint = {
                position: { top: 0, left: 0 },
                opacity: testList[i].scalarOpacity.opacity[b],
                color: [-1000000, -1000000, -1000000],
                value: testList[i].scalarOpacity.pixelValue[b],
              };
              clutListCur.push(ncPoint);
              b++;
            }
          }
          clutListCur.push(cPoint);
          a++;
        }

        while (b < testList[i].scalarOpacity.num) {
          let ncPoint = {
            position: { top: 0, left: 0 },
            opacity: testList[i].scalarOpacity.opacity[b],
            color: testList[i].colorTransfer.color[a - 1],
            value: testList[i].scalarOpacity.pixelValue[b],
          };
          clutListCur.push(ncPoint);
          b++;
        }
        // 透明度曲线插值
        for (let j = 1; j < clutListCur.length - 1; j++) {
          if (clutListCur[j].opacity == -1000000) {
            for (let r = 1; r < testList[i].scalarOpacity.num; r++) {
              if (
                clutListCur[j].value < testList[i].scalarOpacity.pixelValue[r]
              ) {
                clutListCur[j].opacity =
                  testList[i].scalarOpacity.opacity[r - 1] +
                  ((testList[i].scalarOpacity.opacity[r] -
                    testList[i].scalarOpacity.opacity[r - 1]) *
                    (clutListCur[j].value -
                      testList[i].scalarOpacity.pixelValue[r - 1])) /
                    (testList[i].scalarOpacity.pixelValue[r] -
                      testList[i].scalarOpacity.pixelValue[r - 1]);
                break;
              }
            }
            if (clutListCur[j].opacity == -1000000) {
              clutListCur[j].opacity =
                testList[i].scalarOpacity.opacity[
                  testList[i].scalarOpacity.num - 1
                ];
            }
          }
          // 颜色曲线插值
          if (clutListCur[j].color[0] == -1000000) {
            for (let r = 1; r < testList[i].colorTransfer.num; r++) {
              if (
                clutListCur[j].value < testList[i].colorTransfer.pixelValue[r]
              ) {
                clutListCur[j].color[0] =
                  testList[i].colorTransfer.color[r - 1][0] +
                  ((testList[i].colorTransfer.color[r][0] -
                    testList[i].colorTransfer.color[r - 1][0]) *
                    (clutListCur[j].value -
                      testList[i].colorTransfer.pixelValue[r - 1])) /
                    (testList[i].colorTransfer.pixelValue[r] -
                      testList[i].colorTransfer.pixelValue[r - 1]);
                clutListCur[j].color[1] =
                  testList[i].colorTransfer.color[r - 1][1] +
                  ((testList[i].colorTransfer.color[r][1] -
                    testList[i].colorTransfer.color[r - 1][1]) *
                    (clutListCur[j].value -
                      testList[i].colorTransfer.pixelValue[r - 1])) /
                    (testList[i].colorTransfer.pixelValue[r] -
                      testList[i].colorTransfer.pixelValue[r - 1]);
                clutListCur[j].color[2] =
                  testList[i].colorTransfer.color[r - 1][2] +
                  ((testList[i].colorTransfer.color[r][2] -
                    testList[i].colorTransfer.color[r - 1][2]) *
                    (clutListCur[j].value -
                      testList[i].colorTransfer.pixelValue[r - 1])) /
                    (testList[i].colorTransfer.pixelValue[r] -
                      testList[i].colorTransfer.pixelValue[r - 1]);
                break;
              }
            }
            if (clutListCur[j].color[0] == -1000000) {
              clutListCur[j].color[0] =
                testList[i].colorTransfer.color[
                  testList[i].colorTransfer.num - 1
                ][0];
              clutListCur[j].color[1] =
                testList[i].colorTransfer.color[
                  testList[i].colorTransfer.num - 1
                ][1];
              clutListCur[j].color[2] =
                testList[i].colorTransfer.color[
                  testList[i].colorTransfer.num - 1
                ][2];
            }
          }
        }
        // 颜色值转换 对齐左边界
        for (let j = 0; j < clutListCur.length; j++) {
          let rgb3 = [0, 0, 0];
          for (let k = 0; k < 3; k++) {
            rgb3[k] = parseInt(clutListCur[j].color[k] * 255);
            rgb3[k] = rgb3[k].toString(16);
            if (rgb3[k].length == 1) {
              rgb3[k] = "0" + rgb3[k];
            }
          }
          clutListCur[j].color = "#" + rgb3[0] + rgb3[1] + rgb3[2];
          clutListCur[j].position.left = 0;
        }
        this.clutListPre.push(clutListCur);
      }
      this.changePreset(0);
    },
    deleteClut() {
      if (this.clutList.length == 1) {
        return;
      }
      this.clutList.splice(this.optPointIndex, 1);
      this.optPointIndex = -1;
      this.optMouseDownFlag = false;
      this.reflashCanvas();
      this.sendClutToServer();
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./clut.scss";
</style>
