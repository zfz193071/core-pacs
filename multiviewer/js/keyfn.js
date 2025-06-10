/*
 * @Author:
 * @Date: 2023-05-04 08:38:19
 * @LastEditTime: 2023-11-28 14:40:50
 * @LastEditors: ssy
 * @Description:
 */
const KEYFN = {
  init(that) {
    document.onkeydown = (e) => {
      const shortcutsKey = that["shortcutsKey"];

      const keyCode = e.keyCode || e.which || e.charCode;
      let nodeName = e.target.nodeName;
      if (nodeName === "INPUT" || nodeName === "TEXTAREA") {
        return;
      }

      for (const field in shortcutsKey) {
        const keyInfo = shortcutsKey[field];
        if (keyInfo.key !== keyCode) continue;
        if (!keyInfo.enable) continue;

        switch (field) {
          case "D0":
          case "D1":
          case "D2":
          case "D3":
          case "D4":
          case "D5":
          case "D6":
          case "D7":
          case "D8":
          case "D9":
            that.setWWWLByHotKey(field);
            break;

          case "imgSave": {
            let toolbar = that.$refs.toolbar;
            toolbar["oneSave"]();
            break;
          }

          case "Window":
          case "Ruler":
          case "Rect":
          case "Pen":
          case "Circle":
          case "Pan":
          case "Page":
          case "Angle":
            that.activeOpt = field;
            break;

          case "ACross":
          case "delMark":
          case "tempShow":
          case "Reset":
            that.clickOpt = field;
            break;

          case "Up":
          case "Down": {
            let { catcher1, catcher3 } = that.$refs;
            let { minseriesInfo } = that;
            let dom = null;
            if (minseriesInfo) dom = catcher3;
            else dom = catcher1;
            dom.throttledScrollPreNextChange(field);
            break;
          }
          case "Top":
          case "Bottom": {
            let { catcher1, catcher3 } = that.$refs;
            let { minseriesInfo } = that;
            let dom = null;
            if (minseriesInfo) dom = catcher3;
            else dom = catcher1;
            if (field === "Top") dom.scrollToTop();
            else dom.scrollToBottom();
            break;
          }
          case "Delete": {
            const { canvasNow, imageDatas, seriesInfos } = that.currViewport;
            const imageData = imageDatas[canvasNow];
            const seriesInfo = seriesInfos[canvasNow];
            const listData = that.ieditListData[seriesInfo.currentSID]?.filter(
              (item) => {
                return (
                  !item.ifNoneInfo &&
                  item.createType !== "AIAnaysis" &&
                  item.curViewMod === imageData.curViewMod &&
                  item.curImageNum === imageData.curImageNum
                );
              },
            );
            if (listData && listData.length) {
              const ID = listData[listData.length - 1].ID;
              that.delMarks(ID);
            }
          }
        }
      }
    };
  },
};

export default KEYFN;
