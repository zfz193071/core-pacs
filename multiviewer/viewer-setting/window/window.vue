<template>
  <div class="window">
    <div class="box-title">{{ $t("settings.titles.window") }}</div>
    <div class="tip_box_block">
      <input
        type="text"
        :placeholder="$t('settings.window.tip')"
        :style="{ borderColor: nameBorderStyle }"
        v-model="WindowLevelSetName"
      />
      <input
        type="text"
        :placeholder="isPTMode ? 'max' : 'WW'"
        :style="{ borderColor: inputWWBorderStyle }"
        v-model="WindowLevelSetWW"
      />
      <input
        type="text"
        :placeholder="isPTMode ? 'min' : 'WL'"
        :style="{ borderColor: inputWLBorderStyle }"
        v-model="WindowLevelSetWL"
      />
      <button
        class="WindowLevelSetConserve"
        @click.stop.prevent="WindowLevelSetConserve"
      >
        {{ $t("save") }}
      </button>
      <button
        class="WindowLevelSetCancel"
        @click.stop.prevent="WindowLevelSetCancel"
      >
        {{ $t("cancel") }}
      </button>
    </div>

    <div v-if="isPTMode" class="tip_box_content scrollbar2">
      <table>
        <thead>
          <tr>
            <th>{{ $t("settings.window.shortcutKey") }}</th>
            <th>{{ $t("settings.window.name") }}</th>
            <th>{{ $t("settings.window.min") }}</th>
            <th>{{ $t("settings.window.max") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in WindowLevelSetData"
            :key="index"
            @click.stop.prevent="WindowLevelSetClick(item)"
          >
            <!--     最大范围、用户自定义窗宽窗位不能修改     -->
            <template v-if="index === 0 || !item.default">
              <td>
                <div class="item small">{{ item.hotkey || "无" }}</div>
              </td>
              <td class="td1">
                <div class="item">{{ item.name }}</div>
              </td>
              <td>
                <div class="item small">min:{{ item.min }}</div>
              </td>
              <td>
                <div class="item">
                  max:{{ item.max }}
                  <div
                    class="del rubbish"
                    v-show="!item.default"
                    @click.stop.prevent="WindowLevelSetDelete(item)"
                  ></div>
                </div>
              </td>
            </template>

            <!--     允许修改内容     -->
            <template v-else>
              <td>
                <div class="item small">{{ item.hotkey || "无" }}</div>
              </td>
              <td class="td1">
                <div class="item" @click.stop="startInput(index, 'name')">
                  <template
                    v-if="
                      inputInfo.index === index && inputInfo.field === 'name'
                    "
                  >
                    <input
                      type="text"
                      :class="{ error: inputInfo.error }"
                      autofocus
                      v-model="inputInfo.value"
                      @blur="blurInput"
                    />
                  </template>
                  <template v-else>
                    {{ item.name }}
                  </template>
                </div>
              </td>
              <td>
                <div class="item small">
                  <div
                    class="item small"
                    @click.stop="startInput(index, 'min')"
                  >
                    <template
                      v-if="
                        inputInfo.index === index && inputInfo.field === 'min'
                      "
                    >
                      <input
                        type="text"
                        :class="{ error: inputInfo.error }"
                        autofocus
                        v-model="inputInfo.value"
                        @blur="blurInput"
                      />
                    </template>
                    <template v-else> min:{{ item.min }} </template>
                  </div>
                </div>
              </td>
              <td>
                <div class="item">
                  <div class="item" @click.stop="startInput(index, 'max')">
                    <template
                      v-if="
                        inputInfo.index === index && inputInfo.field === 'max'
                      "
                    >
                      <input
                        type="text"
                        :class="{ error: inputInfo.error }"
                        autofocus
                        v-model="inputInfo.value"
                        @blur="blurInput"
                      />
                    </template>
                    <template v-else> max:{{ item.max }} </template>
                  </div>
                </div>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="tip_box_content scrollbar2">
      <table>
        <thead>
          <tr>
            <th>{{ $t("settings.window.shortcutKey") }}</th>
            <th>{{ $t("settings.window.name") }}</th>
            <th>{{ $t("settings.window.min") }}</th>
            <th>{{ $t("settings.window.max") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in WindowLevelSetData"
            :key="index"
            @click.stop.prevent="WindowLevelSetClick(item)"
          >
            <!--     最大范围、默认不能修改     -->
            <template v-if="index === 0 || index === 1 || !item.default">
              <td>
                <div class="item small">{{ item.hotkey || "无" }}</div>
              </td>
              <td class="td1">
                <div class="item">
                  {{ item.name }}
                </div>
              </td>
              <td>
                <div class="item small">WW:{{ wwwl(item).ww }}</div>
              </td>
              <td>
                <div class="item">WL:{{ wwwl(item).wl }}</div>
                <div
                  class="del rubbish"
                  v-show="!item.default"
                  @click.stop.prevent="WindowLevelSetDelete(item)"
                ></div>
              </td>
            </template>

            <!--     允许修改内容     -->
            <template v-else>
              <td>
                <div class="item small">{{ item.hotkey || "无" }}</div>
              </td>
              <td class="td1">
                <div class="item" @click.stop="startInput(index, 'name')">
                  <template
                    v-if="
                      inputInfo.index === index && inputInfo.field === 'name'
                    "
                  >
                    <input
                      type="text"
                      :class="{ error: inputInfo.error }"
                      autofocus
                      v-model="inputInfo.value"
                      @blur="blurInput"
                    />
                  </template>
                  <template v-else>
                    {{ item.name }}
                  </template>
                </div>
              </td>
              <td>
                <div class="item small" @click.stop="startInput(index, 'ww')">
                  <template
                    v-if="inputInfo.index === index && inputInfo.field === 'ww'"
                  >
                    <input
                      type="text"
                      :class="{ error: inputInfo.error }"
                      autofocus
                      v-model="inputInfo.value"
                      @blur="blurInput"
                    />
                  </template>
                  <template v-else> WW:{{ wwwl(item).ww }} </template>
                </div>
              </td>
              <td>
                <div class="item" @click.stop="startInput(index, 'wl')">
                  <template
                    v-if="inputInfo.index === index && inputInfo.field === 'wl'"
                  >
                    <input
                      type="text"
                      :class="{ error: inputInfo.error }"
                      autofocus
                      v-model="inputInfo.value"
                      @blur="blurInput"
                    />
                  </template>
                  <template v-else> WL:{{ wwwl(item).wl }} </template>
                </div>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import LANG from "@/assets/js/lang";
import api from "@/assets/api";
import { MenuEnum } from "../js/enum";
import DATA from "@/components/multiviewer/js/data";

const InputInfo = {
  closing: false,
  error: "",
  index: -1,
  value: "",
  field: "",
};
const inputWWBorderStyle = "var(--gary2)";
const inputWLBorderStyle = "var(--gary2)";
const nameBorderStyle = "var(--gary2)";
export default {
  name: "window",
  props: {
    currentContent: { type: String, required: true },
    WindowLevelSetData: { required: true },
    seriesIdNow: { required: true },
    defaultData: { type: Object, required: true },
    windowWidthLevel: { type: Object },
    imageData: { type: Object },
    tempDataPT: { required: false },
  },

  data() {
    return {
      LANG,
      tempDataCT: [
        {
          id: "D0",
          default: true,
          name: this.$t("maxRange"),
          ww: 0,
          wl: 0,
          hotkey: "0",
          key: "maxRange",
        },
        {
          id: "D1",
          default: true,
          name: this.$t("defaultWWWL"),
          ww: 0,
          wl: 0,
          hotkey: "1",
          key: "defaultWWWL",
        },
        {
          id: "D2",
          default: true,
          name: this.$t("headWWWL"),
          ww: 85,
          wl: 40,
          hotkey: "2",
          key: "headWWWL",
        },
        {
          id: "D3",
          default: true,
          name: this.$t("MediastinumWWWL"),
          ww: 400,
          wl: 40,
          hotkey: "3",
          key: "MediastinumWWWL",
        },
        {
          id: "D4",
          default: true,
          name: this.$t("vascellumWWWL"),
          ww: 350,
          wl: 40,
          hotkey: "4",
          key: "vascellumWWWL",
        },
        {
          id: "D5",
          default: true,
          name: this.$t("lungWWWL"),
          ww: 1500,
          wl: -700,
          hotkey: "5",
          key: "lungWWWL",
        },
        {
          id: "D6",
          default: true,
          name: this.$t("boneWWWL"),
          ww: 1600,
          wl: 500,
          hotkey: "6",
          key: "boneWWWL",
        },
      ],
      tempDataMR: [
        {
          id: "D0",
          default: true,
          name: this.$t("maxRange"),
          ww: 0,
          wl: 0,
          hotkey: "0",
          key: "maxRange",
        },
        {
          id: "D1",
          default: true,
          name: this.$t("defaultWWWL"),
          ww: 0,
          wl: 0,
          hotkey: "1",
          key: "defaultWWWL",
        },
        {
          id: "D2",
          default: true,
          name: "Range1",
          ww: 500,
          wl: 250,
          hotkey: "2",
          key: "Range1",
        },
        {
          id: "D3",
          default: true,
          name: "Range2",
          ww: 600,
          wl: 300,
          hotkey: "3",
          key: "Range2",
        },
        {
          id: "D4",
          default: true,
          name: "Range3",
          ww: 800,
          wl: 400,
          hotkey: "4",
          key: "Range3",
        },
        {
          id: "D5",
          default: true,
          name: "Range4",
          ww: 1000,
          wl: 500,
          hotkey: "5",
          key: "Range4",
        },
        {
          id: "D6",
          default: true,
          name: "Range5",
          ww: 1200,
          wl: 600,
          hotkey: "6",
          key: "Range5",
        },
      ],
      selefData: [],
      TrSelectIdNow: "D0",
      inputWWBorderStyle,
      inputWLBorderStyle,
      nameBorderStyle,

      // 自定义窗宽窗位
      WindowLevelSetName: "",
      WindowLevelSetWW: "",
      WindowLevelSetWL: "",

      // 窗宽窗位输入框信息
      inputInfo: {
        ...InputInfo,
      },

      mode: "local", // local: 本地存储, DB: 数据库存储
    };
  },

  created() {
    this.getWWWL();
  },

  computed: {
    MenuEnum() {
      return MenuEnum;
    },

    /**
     * 是否是PT模式
     * @return {boolean}
     */
    isPTMode() {
      return this.defaultData.model === "PT";
    },

    /**
     * 当前模态
     * @return {{ct, pt}|{model}}
     */
    currentModel() {
      return {
        model: this.defaultData.model,
      };
    },

    currSeries() {
      let series = this.defaultData;
      return series;
    },
  },

  methods: {
    wwwl(item) {
      let { ww, wl } = item;
      return {
        ww: this.$num2e(ww),
        wl: this.$num2e(wl),
      };
    },
    getWWWL() {
      if (this.mode === "local") {
        const selfDataStr = localStorage.getItem("windowLevelSet");
        let selfData = [];
        if (selfDataStr) {
          selfData = JSON.parse(selfDataStr);
        }
        this.selefData = selfData;
        this.WindowLevelSetEnter();
      } else if (this.mode === "DB") {
        api.getWWWL().then((res) => {
          if (res.code === 1) {
            let data = res.data;
            this.selefData = [...data];
            this.WindowLevelSetEnter();
          }
        });
      }
    },

    /**
     * 更新默认窗宽窗位HTTP
     * @param ww/max（PT）
     * @param wl/min（PT）
     * @param hotkey
     * @param name
     */
    async updWwwlHTTP(ww, wl, name, hotkey) {
      let model = "";
      model = this.currentModel.model;

      if (this.mode === "local") {
        const param = {
          name: `${model}:HotKey:${hotkey}:${name}`,
          ww,
          wl,
          _id: this.$randomStr(),
        };
        const exist = this.selefData.find(({ name }) => {
          return name.includes(`${model}:HotKey:${hotkey}`);
        });
        if (exist) {
          // 存在修改数据
          exist.name = param.name;
          exist.ww = param.ww;
          exist.wl = param.wl;
        } else {
          // 不存在添加
          this.selefData.push(param);
        }
        localStorage.setItem("windowLevelSet", JSON.stringify(this.selefData));
      } else if (this.mode === "DB") {
        const res = await api.replaceWWWL({
          model: model,
          ww,
          wl,
          hotkey,
          name,
        });
        if (res.code !== 1) {
          throw new Error(res);
        }
      }
    },

    /**
     * 开始时，计算窗宽窗位
     */
    WindowLevelSetEnter() {
      let { ww, wl, dynamic, model } = this.defaultData;
      let temp = [...this.tempDataCT];
      let ifPT = false;
      if (model === "MR") {
        temp = [...this.tempDataMR];
      }
      if (model === "PT" || model === "NM") {
        temp = [...this.tempDataPT];
        ifPT = true;
      }
      if (!ifPT) {
        temp[1].ww = ww;
        temp[1].wl = wl;
        if (dynamic) {
          temp[0].ww = dynamic.ww;
          temp[0].wl = dynamic.wl;
        } else {
          temp[0].ww = 1000;
          temp[0].wl = 500;
        }
      } else {
        const series = this.currSeries;
        const maxRangeWWWL = temp[0];
        const defaultWWWL = temp[1];
        const maxSuv = DATA.wwwl2suv(maxRangeWWWL.ww, maxRangeWWWL.wl, series);
        const defaultSuv = DATA.wwwl2suv(
          defaultWWWL.ww,
          defaultWWWL.wl,
          series,
        );
        this.$set(maxRangeWWWL, "min", maxSuv.B);
        this.$set(maxRangeWWWL, "max", Math.round(maxSuv.T));
        this.$set(defaultWWWL, "min", defaultSuv.B);
        this.$set(defaultWWWL, "max", Math.round(defaultSuv.T));
      }
      let WindowLevelSetData = this.$clone(temp);

      let curModel = this.currentModel.model;

      // 自定义默认窗宽窗位
      if (ifPT) {
        const currModelWWWL = this.selefData.filter((item) =>
          item.name.includes(`${curModel}:HotKey:`),
        );
        for (const item of currModelWWWL) {
          const index = Number(item.name.split(":")[2]);
          const name = item.name.split(":")[3];
          // console.log(name, item.ww, item.wl); // debug
          const { ww, wl } = DATA.suv2wwwl(this.currSeries, item.ww, item.wl);
          WindowLevelSetData[index]["min"] = item.wl;
          WindowLevelSetData[index]["max"] = item.ww;
          WindowLevelSetData[index]["wl"] = wl;
          WindowLevelSetData[index]["ww"] = ww;
          WindowLevelSetData[index]["name"] = name;
        }
      } else {
        const currModelWWWL = this.selefData.filter((item) =>
          item.name.includes(`${curModel}:HotKey:`),
        );
        for (const item of currModelWWWL) {
          // console.log("debug 初始化窗宽窗位", item); // debug
          const index = Number(item.name.split(":")[2]);
          const name = item.name.split(":")[3];
          WindowLevelSetData[index]["wl"] = item.wl;
          WindowLevelSetData[index]["ww"] = item.ww;
          WindowLevelSetData[index]["name"] = name;
        }
      }

      // 自定义窗宽窗位（不支持快捷键类型）
      let selfWWWL = this.$clone(this.selefData)
        .filter(
          (item) =>
            !item.name.includes(":HotKey:") && item.name.startsWith(curModel),
        )
        .map((item) => ({ ...item, name: item.name.split(":")[1] }));
      if (ifPT) {
        selfWWWL = selfWWWL.map((item) => {
          const min = item.wl;
          const max = item.ww;
          item.min = min;
          item.max = max;
          let series = this.currSeries;
          const { ww, wl } = DATA.suv2wwwl(series, max, min);
          item.ww = ww;
          item.wl = wl;
          return item;
        });
      }
      WindowLevelSetData = this.$clone([...WindowLevelSetData, ...selfWWWL]);
      this.$emit("update:WindowLevelSetData", WindowLevelSetData);
    },

    /**
     * 添加自定义窗宽窗位
     */
    WindowLevelSetConserve() {
      this.inputWWBorderStyle = inputWWBorderStyle;
      this.inputWLBorderStyle = inputWLBorderStyle;
      this.nameBorderStyle = nameBorderStyle;
      const dangerColor = "red";

      let name = this.WindowLevelSetName;
      let ww = this.WindowLevelSetWW * 1;
      let wl = this.WindowLevelSetWL * 1;
      if (name === "") {
        this.nameBorderStyle = dangerColor;
        return;
      }
      if (this.WindowLevelSetWW === "" || isNaN(ww)) {
        this.inputWWBorderStyle = dangerColor;
        return;
      }
      if (this.WindowLevelSetWL === "" || isNaN(wl)) {
        this.inputWLBorderStyle = dangerColor;
        return;
      }
      if (this.isPTMode && wl < 0) {
        this.inputWLBorderStyle = dangerColor;
        return;
      }

      // KEY名
      let curModel = "";

      curModel = this.currentModel.model;
      let params = {
        name: `${curModel}:${name}`,
        ww: ww,
        wl: wl,
      };
      console.log("create preset ww wl", params);

      if (this.mode === "local") {
        // localStroage存储
        params._id = this.$randomStr();
        this.selefData.push(params);
        localStorage.setItem("windowLevelSet", JSON.stringify(this.selefData));
        this.WindowLevelSetCancel();
        this.getWWWL();
      } else if (this.mode === "DB") {
        // DB存储
        api.addWWWL(params).then((res) => {
          if (res.code === 1) {
            let data = res.data;
            this.WindowLevelSetCancel();
            this.getWWWL();
          } else {
            if (this.LANG.index) {
              alert("Failed to add！");
            } else {
              alert("添加失败！");
            }
          }
        });
      }
    },

    /**
     * 取消添加窗宽窗位
     */
    WindowLevelSetCancel() {
      this.WindowLevelSetName = "";
      this.WindowLevelSetWW = "";
      this.WindowLevelSetWL = "";
      this.inputWWBorderStyle = inputWWBorderStyle;
      this.inputWLBorderStyle = inputWLBorderStyle;
      this.nameBorderStyle = nameBorderStyle;
    },

    /**
     * 设置当前选中的窗宽窗位
     * @param item
     */
    WindowLevelSetClick(item) {
      this.TrSelectIdNow = item._id || item.id;
      this.updateWWWL(item.ww, item.wl);
    },
    updateWWWL(ww, wl) {
      let imageData = { ...this.imageData, defaultFlag: false };
      imageData.ww = ww;
      imageData.wl = wl;
      this.$emit("update:imageData", { ...imageData });
    },

    /**
     * 删除窗宽窗位
     * @param {Object} 预设窗宽窗位信息
     */
    WindowLevelSetDelete(item) {
      if (this.mode === "local") {
        this.selefData = this.selefData.filter((data) => item._id !== data._id);
        localStorage.setItem("windowLevelSet", JSON.stringify(this.selefData));
        for (let i = 0; i < this.WindowLevelSetData.length; i++) {
          if (this.WindowLevelSetData[i]._id !== item._id) continue;
          this.WindowLevelSetData.splice(i, 1);
        }
        if (item._id === this.TrSelectIdNow) {
          this.TrSelectIdNow = "D0";
        }
        this.getWWWL();
      } else if (this.mode === "DB") {
        let params = { _id: item._id };
        api.delWWWL(params).then((res) => {
          if (res.code === 1) {
            for (let i = 0; i < this.WindowLevelSetData.length; i++) {
              if (this.WindowLevelSetData[i]._id === item._id) {
                this.WindowLevelSetData.splice(i, 1);
              }
            }
            if (item._id === this.TrSelectIdNow) {
              this.TrSelectIdNow = "D0";
            }
            this.getWWWL();
          } else {
            if (this.LANG.index) {
              alert("Failed to delete！");
            } else {
              alert("删除失败！");
            }
          }
        });
      }
    },

    /**
     * 显示input输入，开始更改ww、wl内容
     * @param index
     * @param field
     */
    startInput(index, field) {
      if (this.inputInfo.index === index && this.inputInfo.field === field)
        return;
      if (
        this.inputInfo.index >= 0 &&
        this.inputInfo.field &&
        this.inputInfo.error
      )
        return;
      if (this.inputInfo.closing) return;
      const data = this.WindowLevelSetData[index];

      this.inputInfo.index = index;
      this.inputInfo.field = field;
      if (field === "name") {
        this.inputInfo.value = data.name;
      } else if (field === "ww") {
        this.inputInfo.value = data.ww;
      } else if (field === "wl") {
        this.inputInfo.value = data.wl;
      } else if (field === "min") {
        this.inputInfo.value = data.min;
      } else if (field === "max") {
        this.inputInfo.value = data.max;
      }

      this.$nextTick(() => {
        const inputEl = document.querySelector(
          ".window .tip_box_content table input",
        );
        inputEl.focus();
      });
    },

    /**
     * input失焦
     */
    async blurInput() {
      let { field, index, value } = this.inputInfo;
      const data = this.WindowLevelSetData[index];

      if (["ww", "wl", "min", "max"].includes(field)) {
        value = Number(value);
        if (isNaN(value)) {
          this.inputInfo.error = "输入非数字";
          return;
        }
        data[field] = value;
      } else if (field === "name") {
        data.name = value;
      }

      if (field === "min") {
        const { ww, wl } = DATA.suv2wwwl(this.currSeries, data.max, value);
        data.ww = ww;
        data.wl = wl;
      } else if (field === "max") {
        const { ww, wl } = DATA.suv2wwwl(this.currSeries, value, data.min);
        data.ww = ww;
        data.wl = wl;
      }

      const ww = data.ww;
      const wl = data.wl;
      const min = data.min;
      const max = data.max;
      const hotkey = data.hotkey;
      const name = data.name;
      this.inputInfo.closing = true;
      if (this.isPTMode) {
        await this.updWwwlHTTP(max, min, name, hotkey);
      } else {
        await this.updWwwlHTTP(ww, wl, name, hotkey);
      }

      // 初始化数据
      this.inputInfo = { ...InputInfo };
    },
  },

  watch: {
    defaultData: {
      handler() {
        setTimeout(() => {
          this.getWWWL();
        }, 50);
        this.TrSelectIdNow = "D0";
      },
      deep: true,
      immediate: true,
    },
    async currentContent(newest) {
      if (newest !== MenuEnum.WINDOW) return;
      await this.getWWWL();
    },
  },
};
</script>

<style scoped lang="scss">
@import "window";
</style>
