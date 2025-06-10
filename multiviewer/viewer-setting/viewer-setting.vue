<template>
  <div
    id="setting"
    class="viewer-setting"
    v-show="settingShow"
    :style="{ transform: `scale(${scaleRatio})`, zIndex: index }"
  >
    <div class="header">
      <div class="title">{{ $t("setting") }}</div>
      <div class="close" @click="close"></div>
    </div>

    <div class="content" @mousedown.stop>
      <!--   菜单   -->
      <div class="left">
        <div
          class="item"
          :class="{ selected: currentContent === menu.value }"
          v-for="menu of menuMap"
          :key="menu.value"
          @click="currentContent = menu.value"
        >
          {{ $t(`settings.menu.${menu.value}`) }}
        </div>
      </div>

      <!--   菜单对应设置内容   -->
      <div class="right">
        <div class="container">
          <dic-info
            ref="infoRef"
            v-show="currentContent === MenuEnum.INFO"
            v-on="$listeners"
            :dicomShow="dicomShow"
            :dicomStyle="dicomStyle"
            :dicomShowAll="dicomShowAll"
            :pickedModel="pickedModel"
            @setDicomShowAll="setDicomShowAll"
          >
          </dic-info>
          <shortcut-key
            v-show="currentContent === MenuEnum.SHORTCUT_KEY"
            v-on="$listeners"
            :shortcutsKey="shortcutsKey"
          >
          </shortcut-key>
          <catcher-key
            v-show="currentContent === MenuEnum.CATCHER_KEY"
            :catcherShortcutKey="catcherShortcutKey"
            :vrShortcutKey="vrShortcutKey"
            :controlShortcutKey="controlShortcutKey"
            :otherShortcutKey="otherShortcutKey"
          />
          <!--     隐藏定位线     -->
          <position-line
            v-show="false"
            ref="positionLineRef"
            :show="currentContent === MenuEnum.POSITION_LINE"
            v-on="$listeners"
            :positionLine="positionLine"
            :pos="pos"
          ></position-line>
          <window
            v-show="currentContent === MenuEnum.WINDOW"
            v-on="$listeners"
            :currentContent="currentContent"
            :WindowLevelSetData="WindowLevelSetData"
            :seriesIdNow="seriesIdNow"
            :defaultData="defaultData"
            :imageData="imageData"
            :tempDataPT="tempDataPT"
          >
          </window>
          <theme
            ref="themeRef"
            v-on="$listeners"
            :show="currentContent === MenuEnum.THEME"
            :theme="theme"
            :seriesListPos="seriesListPos"
          ></theme>
          <language-switch
            v-show="currentContent === MenuEnum.LANGUAGE"
            v-on="$listeners"
            ref="languageRef"
          >
          </language-switch>
          <storage v-show="currentContent === MenuEnum.STORAGE" />
          <layout
            v-show="currentContent === MenuEnum.LAYOUT"
            :prelayoutSetting="prelayoutSetting"
          />
          <display-mode
            ref="displayModeRef"
            v-show="currentContent === MenuEnum.DISPLAY_MODE"
          />
        </div>
        <!--    保存取消按钮    -->
        <div class="operation" v-show="showOperation">
          <div class="sync-to-print" v-if="currentContent === MenuEnum.INFO">
            <el-select
              v-model="pickedModel"
              size="mini"
              :popper-append-to-body="false"
            >
              <el-option
                v-for="item in modelList"
                :key="item"
                :label="item"
                :value="item"
              ></el-option>
            </el-select>
            <span v-if="showSyncToPrint">{{ $t("syncToPrint") }}</span>
            <el-radio-group v-model="syncToPrint" v-if="showSyncToPrint">
              <el-radio :label="true">{{ $t("yes") }}</el-radio>
              <el-radio :label="false">{{ $t("no") }}</el-radio>
            </el-radio-group>
          </div>
          <div v-else></div>
          <div class="handle">
            <div class="save" @click="saveSetting">{{ $t("confirm") }}</div>
            <div class="cancel" @click="close">{{ $t("cancel") }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import DicInfo from "./dic-info/dic-info.vue";
import ShortcutKey from "./shortcut-key/shortcut-key.vue";
import Window from "./window/window.vue";
import Theme from "./theme/theme.vue";
import LanguageSwitch from "./language-switch/index.vue";
import Storage from "./storage/index.vue";
import Layout from "./layout/index.vue";
import DisplayMode from "./display-mode/index.vue";
import { MenuEnum } from "../viewer-setting/js/enum";
import PositionLine from "@/components/multiviewer/viewer-setting/position-line/position-line.vue";
import CatcherKey from "./catcher-key/catcher-key.vue";
import { mapState } from "vuex";
import DB from "../js/db";
import { getDataType } from "@/assets/js/YMDataHandler";
export default {
  name: "viewer-setting",
  props: {
    settingShow: Boolean,
    activeOpt: String,

    // DCM信息
    dicomStyle: Object,
    dicomShow: Object,
    dicomShowAll: Object,
    // 快捷键
    shortcutsKey: Object,

    // 鼠标快捷键
    catcherShortcutKey: Object,
    vrShortcutKey: Object,
    controlShortcutKey: Object,
    otherShortcutKey: Object,

    // 模态预设布局
    prelayoutSetting: Array,

    // 定位线
    positionLine: Object,
    pos: Object,

    // 主题
    theme: String,
    seriesListPos: String,

    // 窗宽窗位
    WindowLevelSetData: Array,
    seriesIdNow: String,
    defaultData: Object,
    windowWidthLevel: Object,
    imageData: Object,
    tempDataPT: Array,
    zindex: Number,
  },

  data() {
    return {
      menuMap: [
        {
          field: "信息显示",
          value: MenuEnum.INFO,
        },
        {
          field: "快捷键设置",
          value: MenuEnum.SHORTCUT_KEY,
        },
        {
          field: "鼠标设置",
          value: MenuEnum.CATCHER_KEY,
        },
        // 隐藏定位线
        // {
        //   field: "定位线",
        //   value: MenuEnum.POSITION_LINE,
        // },
        {
          field: "预设窗宽窗位",
          value: MenuEnum.WINDOW,
        },
        {
          field: "预设布局",
          value: MenuEnum.LAYOUT,
        },
        {
          field: "主题",
          value: MenuEnum.THEME,
        },
        {
          field: "语言",
          value: MenuEnum.LANGUAGE,
        },
        {
          field: "缓存",
          value: MenuEnum.STORAGE,
        },
        {
          field: "显示模式",
          value: MenuEnum.DISPLAY_MODE,
        },
      ],
      currentContent: MenuEnum.INFO,
      index: 1000,
      syncToPrint: false,
      pickedModel: "",
      modelList: ["CT", "MR", "DR", "DX", "XA", "CR", "MG", "OT", "SR"],
    };
  },

  computed: {
    ...mapState(["scaleRatio"]),
    MenuEnum() {
      return MenuEnum;
    },

    showOperation() {
      return [
        MenuEnum.INFO,
        MenuEnum.POSITION_LINE,
        MenuEnum.THEME,
        MenuEnum.DISPLAY_MODE,
      ].includes(this.currentContent);
    },
    showSyncToPrint() {
      const obj = getDataType();
      return obj.env === "JH" || obj.env === "STUDIES";
    },
  },

  mounted() {
    const syncToPrint = localStorage.getItem("syncToPrint");
    if (syncToPrint === "true") this.syncToPrint = true;
  },

  methods: {
    close() {
      this.$emit("update:settingShow", false);
      // this.$refs.infoRef.init();
      this.$refs.themeRef.init();
      this.$refs.positionLineRef.init();
    },
    /**
     * 保存所有设置
     */
    saveSetting() {
      this.$refs.infoRef.save(); // 信息设置
      this.$refs.positionLineRef.save(); // 定位线设置
      this.$refs.themeRef.save(); // 主题设置
      this.$refs.displayModeRef.save();
      localStorage.setItem("syncToPrint", this.syncToPrint);
      this.$nextTick(() => {
        this.close();
      });
      if (this.currentContent === MenuEnum.DISPLAY_MODE) {
        location.reload();
      }
    },
    setDicomShowAll(val) {
      this.$emit("update:dicomShowAll", val);
    },
  },

  watch: {
    settingShow(newest) {
      if (newest) {
        this.index = this.zindex;
        this.currentContent = this.$options.data().currentContent;
        this.$nextTick(() => {
          this.$follow_mouse("setting");
        });
        // 更新storageInfo
        if ("storage" in navigator) {
          navigator.storage.estimate().then(async (res) => {
            console.log(res, "res");
            const {
              quota,
              usageDetails: { indexedDB },
            } = res;
            const count = await DB.getCount();
            const enable = this.$store.state.cacheStorageInfo.enable;
            this.$store.commit("setCacheStorageInfo", {
              availableStorage: (quota / 1024 / 1024).toFixed(2),
              usedStorage: (indexedDB / 1024 / 1024).toFixed(2),
              seriesNum: count,
              enable,
            });
          });
        } else if ("webkitTemporaryStorage" in navigator) {
          navigator.webkitTemporaryStorage.queryUsageAndQuota(
            async (usedBytes, grantedBytes) => {
              const count = await DB.getCount();
              this.$store.commit("setCacheStorageInfo", {
                availableStorage: (grantedBytes / 1024 / 1024).toFixed(2),
                usedStorage: (usedBytes / 1024 / 1024).toFixed(2),
                seriesNum: count,
                enable: this.$store.state.cacheStorageInfo.enable,
              });
            },
          );
        } else {
          console.log("浏览器不支持获取存储信息...");
        }
      }
    },
    defaultData: {
      handler(val) {
        this.pickedModel = val.model;
      },
      deep: true,
      immediate: true,
    },
  },

  components: {
    CatcherKey,
    PositionLine,
    "dic-info": DicInfo,
    "shortcut-key": ShortcutKey,
    window: Window,
    theme: Theme,
    languageSwitch: LanguageSwitch,
    Storage,
    Layout,
    DisplayMode,
  },
};
</script>

<style scoped lang="scss">
@import "viewer-setting";
</style>
