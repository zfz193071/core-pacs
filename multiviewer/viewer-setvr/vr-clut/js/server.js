import LANG from "../../../../../assets/js/lang";
const SERVER = {
  off: 0,
  websocket: null,
  SID: 0,
  wsUrl: null, //本地测试：'ws://localhost:3365' 测试：wss://106.15.103.194/websocket/RayVlRentest
  ifConnected: true,
  ifOnLoading: false,
  playKey: -1,
  playNumber: -1,
  currentImgSrc: new Image(),
  imgReflashFlag: -1,
  imgType: "N",
  imageScaleType: 1,
  messageHeader: "RAYSDVRR", //消息头
  checkTagW2C: "UDW2C",
  checkTagW2S: "UDW2S",
  checkTagC2W: "UDC2W",
  checkTagS2W: "UDS2W",
  timerFlag: 0,
  hisBuf: [],
  hisLength: 0,
  hisMin: 0,
  hisGap: 0,
  hisUpdateFlag: -1,
  connectMaskingShow: false,
  messageData: "",
  back: {
    one: 0,
    all: 0,
  },
  closeWebsocket: function () {
    let message = SERVER.messageHeader + SERVER.checkTagW2C + "PREND";
    SERVER.sendBin(message);
  },
  openWebsocket: function () {
    try {
      this.websocket = new WebSocket(this.wsUrl);
      this.websocket.onopen = this.wsOnOpen;
      this.websocket.onmessage = this.wsOnMsg;
      this.websocket.onclose = this.wsOnClose;
    } catch (exception) {
      alert("connect error");
    }
  },
  wsOnOpen: function () {
    if (SERVER.playKey == -1) {
      alert("建立连接：服务器错误");
      return;
    }
    let message = SERVER.messageHeader + SERVER.checkTagW2S + "JSCLI";
    message += SERVER.playKey;
    if (SERVER.playNumber != -1) {
      message += SERVER.int32ToStr(SERVER.playNumber);
    }
    SERVER.ifOnLoading = true;
    SERVER.message = LANG.loading[LANG.index];
    console.log("建立连接：等待link ok");
    SERVER.sendBin(message);
  },
  wsOnClose: function () {},
  // 解析消息
  wsOnMsg: function (event) {
    let msgReader = new FileReader();
    if (event.type == "message") {
      msgReader.onloadend = function () {
        let checkRayStr = this.result.substr(0, 8);
        // 校验前8位
        if (checkRayStr != SERVER.messageHeader) return;
        // 校验消息来源
        checkRayStr = this.result.substr(8, 5);

        //处理消息
        switch (checkRayStr) {
          case SERVER.checkTagS2W:
            SERVER.msgUDS2W(this.result);
            return;
          case SERVER.checkTagC2W:
            SERVER.msgUDC2W(this.result, event.data);
            return;
        }
      };
    }
    msgReader.readAsBinaryString(event.data);
    return;
  },
  msgUDS2W: function (msgData) {
    let messageType = msgData.substr(13, 5);
    if (messageType == "CLOSE") {
      SERVER.ifOnLoading = false;
      SERVER.ifConnected = false;
      let tempId = parseInt(SERVER.str2int32I(msgData.substr(18, 4)));
      console.log("关闭连接：", tempId);
      switch (tempId) {
        case 20004:
          console.log(tempId, "连接超时,请刷新页面!");
          break;
        case 20002:
          console.log(tempId, "被下线");
          SERVER.off++;
          break;
        case 20003:
          console.log(tempId, "选择数据错误");
          break;
        case 20010:
          console.log(tempId, "连接应用管理器失败!");
          break;
        case 20020:
          console.log(tempId, "启动应用失败");
          SERVER.off++;
          break;
        case 20032:
          console.log(tempId, "数据下载失败");
          break;
        case 20034:
          console.log(tempId, "数据生成启动失败");
          break;
        case 20033:
          console.log(tempId, "数据生成处理失败");
          break;
      }
      return;
    }

    if (messageType == "LINOK") {
      console.log("已连接，正在加载");
      SERVER.ifOnLoading = true;

      SERVER.askFirstImage();

      return;
    }
  },
  msgUDC2W: function (msgData, eventData) {
    let checkRayStr = msgData.substr(13, 5);
    if (checkRayStr == "IMAGE") {
      if (SERVER.ifOnLoading == true) {
        SERVER.ifOnLoading = false;
        SERVER.ifConnected = true;
      }
      let parseStart = 18;
      let imgType = msgData.substr(parseStart, 1);
      parseStart += 1;
      let imgLength = SERVER.str2int32(msgData.substr(parseStart, 4));
      if (imgLength == 0) return;
      SERVER.currentImgSrc.src = window.URL.createObjectURL(
        eventData.slice(
          parseStart + 4,
          parseStart + 4 + imgLength,
          "image/png",
        ),
      );
      SERVER.currentImgSrc.onload = function () {
        SERVER.currentImgSrc.crossOrigin = "Anonymous";
        SERVER.imgReflashFlag += 1;
        SERVER.imgType = imgType;
      };
      return;
    }
    switch (checkRayStr) {
      case "GETHS": {
        let parseStart = 18;
        SERVER.hisLength = SERVER.str2int16(msgData.substr(parseStart, 2));
        parseStart += 2;
        SERVER.hisMin = SERVER.str2int32I(msgData.substr(parseStart, 4));
        parseStart += 4;
        SERVER.hisGap = SERVER.str2int32(msgData.substr(parseStart, 4));
        parseStart += 4;
        for (let i = 0; i < SERVER.hisLength; i++) {
          SERVER.hisBuf.push(SERVER.str2int32I(msgData.substr(parseStart, 4)));
          parseStart += 4;
        }
        SERVER.hisUpdateFlag += 1;
        break;
      }
      case "RMVBS": {
        let parseStart = 18;
        let flag = msgData.substr(parseStart, 1);
        if (flag.charCodeAt(0) == 0) {
          SERVER.messageData = "去骨成功";
          SERVER.back = {
            one: 1,
            all: SERVER.back.all + 1,
          };
        } else if (flag.charCodeAt(0) == 1) {
          SERVER.messageData = "未找到高密度体素，请重试";
        } else if (flag.charCodeAt(0) == 2) {
          // alert('计算中')
        }
        break;
      }

      case "CUTIN": {
        let parseStart = 18;
        let flag = msgData.substr(parseStart, 1);
        if (flag.charCodeAt(0) == 0) {
          SERVER.messageData = "裁剪成功";
          SERVER.back = {
            one: 1,
            all: SERVER.back.all + 1,
          };
        } else if (flag.charCodeAt(0) == 1) {
          SERVER.messageData = "裁剪失败";
        }
        break;
      }

      case "UNCUT": {
        let parseStart = 18;
        let flag = msgData.substr(parseStart, 1);
        if (flag.charCodeAt(0) == 0) {
          SERVER.back = {
            one: 0,
            all: SERVER.back.all - 1,
          };
        }
        break;
      }

      case "RSCUT": {
        let parseStart = 18;
        let flag = msgData.substr(parseStart, 1);
        if (flag.charCodeAt(0) == 0) {
          SERVER.back = {
            one: 0,
            all: 0,
          };
        }
        break;
      }
    }
  },
  //请求第一帧图像
  askFirstImage: function () {
    let message = SERVER.messageHeader + SERVER.checkTagW2C;
    message += "ASKFI";
    SERVER.sendBin(message);
  },
  sendBin: function (message) {
    let buffer = new ArrayBuffer(message.length);
    let view = new DataView(buffer);
    for (let i = 0; i < message.length; i++) {
      view.setUint8(i, message.charCodeAt(i));
    }
    if (this.websocket == null) {
      console.log("当前为未连接状态");
      return;
    }
    if (this.websocket.readyState == 1) {
      this.websocket.send(buffer);
    } else if (this.websocket.readyState == 3) {
      console.log("连接已超时，请刷新页面");
    }
  },
  int32ToStr: function (num) {
    let buffer = new ArrayBuffer(4);
    let tempdataview = new DataView(buffer);
    tempdataview.setUint32(0, num);
    let tempmouse = String.fromCharCode.apply(null, new Uint8Array(buffer));
    return tempmouse;
  },
  str2int32: function (str) {
    let buffer = new ArrayBuffer(4);
    let temp = new DataView(buffer);
    for (let i = 0; i < str.length; i++) {
      temp.setUint8(i, str.charCodeAt(i));
    }
    let tempLength = temp.getUint32(0);
    return tempLength;
  },
  str2int32I: function (str) {
    let buffer = new ArrayBuffer(4);
    let temp = new DataView(buffer);
    for (let i = 0; i < str.length; i++) {
      temp.setUint8(i, str.charCodeAt(i));
    }
    let tempLength = temp.getInt32(0);
    return tempLength;
  },
  int16ToStr: function (num) {
    let buffer = new ArrayBuffer(2);
    let tempdataview = new DataView(buffer);
    tempdataview.setUint16(0, num);
    let tempmouse = String.fromCharCode.apply(null, new Uint8Array(buffer));
    return tempmouse;
  },
  str2int16: function (str) {
    let buffer = new ArrayBuffer(4);
    let dataview = new DataView(buffer);
    dataview.setUint8(0, 0);
    dataview.setUint8(1, 0);
    dataview.setUint8(2, str.charCodeAt(0));
    dataview.setUint8(3, str.charCodeAt(1));
    return dataview.getUint32(0);
  },
  float2Str: function (num) {
    let buffer = new ArrayBuffer(4);
    let dataview = new DataView(buffer);
    dataview.setFloat32(0, num);
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
  },
  hex2rgb: function (str) {
    let ret = [];
    if (str.length === 4) {
      str =
        "#" +
        str.substr(1, 1) +
        str.substr(1, 1) +
        str.substr(2, 1) +
        str.substr(2, 1) +
        str.substr(3, 1) +
        str.substr(3, 1);
    }
    ret.push(parseInt("0x" + str.substr(1, 2)));
    ret.push(parseInt("0x" + str.substr(3, 2)));
    ret.push(parseInt("0x" + str.substr(5, 2)));
    return ret;
  },
};

export default SERVER;
