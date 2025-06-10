<template>
  <div class="mouse-setting-wrapper">
    <div class="catcher-key">
      <div class="box-title">{{ $t("settings.titles.mouse") }}</div>
      <div class="content">
        <div class="item">
          {{ $t("settings.catcherKey.leftClick") }}:
          <el-select
            v-model="catcherShortcutKey.left"
            size="mini"
            :popper-append-to-body="false"
            @change="setCatcherShortcutKey"
          >
            <el-option
              v-for="opera of operations"
              :key="opera.value"
              :label="$t(`settings.catcherKey.${opera.value}`)"
              :value="opera.value"
            >
            </el-option>
          </el-select>
        </div>
        <div class="item">
          {{ $t("settings.catcherKey.middleClick") }}:
          <el-select
            v-model="catcherShortcutKey.middle"
            size="mini"
            :popper-append-to-body="false"
            @change="setCatcherShortcutKey"
          >
            <el-option
              v-for="opera of operations"
              :key="opera.value"
              :label="$t(`settings.catcherKey.${opera.value}`)"
              :value="opera.value"
            >
            </el-option>
          </el-select>
        </div>
        <div class="item">
          {{ $t("settings.catcherKey.rightClick") }}:
          <el-select
            v-model="catcherShortcutKey.right"
            size="mini"
            :popper-append-to-body="false"
            @change="setCatcherShortcutKey"
          >
            <el-option
              v-for="opera of operations"
              :key="opera.value"
              :label="$t(`settings.catcherKey.${opera.value}`)"
              :value="opera.value"
            >
            </el-option>
          </el-select>
        </div>
      </div>
    </div>
    <div class="catcher-key-vr">
      <div class="box-title">{{ $t("settings.titles.vrMouse") }}</div>
      <div class="content">
        <div class="item">
          {{ $t("settings.catcherKey.leftClick") }}:
          <el-select
            v-model="vrShortcutKey.left"
            size="mini"
            :popper-append-to-body="false"
            @change="setVRShortcutKey('left')"
          >
            <el-option
              v-for="opera of vrOperations"
              :key="opera.value"
              :label="$t(`settings.vrCatcherKey.${opera.value}`)"
              :value="opera.value"
            >
            </el-option>
          </el-select>
        </div>
        <div class="item">
          {{ $t("settings.catcherKey.middleClick") }}:
          <el-select
            v-model="vrShortcutKey.middle"
            size="mini"
            :popper-append-to-body="false"
            @change="setVRShortcutKey('middle')"
          >
            <el-option
              v-for="opera of vrOperations"
              :key="opera.value"
              :label="$t(`settings.vrCatcherKey.${opera.value}`)"
              :value="opera.value"
            >
            </el-option>
          </el-select>
        </div>
        <div class="item">
          {{ $t("settings.catcherKey.rightClick") }}:
          <el-select
            v-model="vrShortcutKey.right"
            size="mini"
            :popper-append-to-body="false"
            @change="setVRShortcutKey('right')"
          >
            <el-option
              v-for="opera of vrOperations"
              :key="opera.value"
              :label="$t(`settings.vrCatcherKey.${opera.value}`)"
              :value="opera.value"
            >
            </el-option>
          </el-select>
        </div>
      </div>
    </div>
    <div class="catcher-key-control">
      <div class="box-title">{{ $t("settings.titles.controlMouse") }}</div>
      <div class="content">
        <div class="item">
          {{ $t("settings.controlKey.controlPoint") }}:
          <el-select
            v-model="controlShortcutKey.controlPoint"
            size="mini"
            :popper-append-to-body="false"
            @change="setControlShortcutKey"
          >
            <el-option
              v-for="opera of controlOperations"
              :key="opera.value"
              :label="$t(`settings.controlKey.${opera.value}`)"
              :value="opera.value"
            >
            </el-option>
          </el-select>
        </div>
      </div>
    </div>
    <div class="catcher-key-rollback">
      <div class="box-title">
        {{ $t("settings.titles.otherShortcutKey") }}
      </div>
      <div class="content">
        <div class="item">
          {{ $t("settings.otherKey.pageTurningRollback") }}:
          <el-radio-group
            v-model="otherShortcutKey.isRollback"
            @change="setOtherShortKey"
          >
            <el-radio
              v-for="item in otherOperations"
              :key="item.value"
              :label="item.value"
              >{{ $t(`${item.value}`) }}</el-radio
            >
          </el-radio-group>
        </div>
        <div class="item">
          {{ $t("settings.otherKey.crossClickPositioning") }}:
          <el-radio-group
            v-model="otherShortcutKey.isCrossClickPositioning"
            @change="setOtherShortKey"
          >
            <el-radio
              v-for="item in otherOperations"
              :key="item.value"
              :label="item.value"
              >{{ $t(`${item.value}`) }}</el-radio
            >
          </el-radio-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import bus from "@/assets/js/bus";
export default {
  name: "catcher-key",
  props: {
    catcherShortcutKey: Object,
    vrShortcutKey: Object,
    controlShortcutKey: Object,
    otherShortcutKey: Object,
  },
  data() {
    return {
      vrOperations: [
        { field: "缩放", value: "Zoom" },
        { field: "平移", value: "Pan" },
        { field: "旋转", value: "Rotate" },
        { field: "调窗", value: "Window" },
      ],
      controlOperations: [
        { field: "填充", value: "Fill" },
        { field: "透明", value: "Transparent" },
        { field: "不显示", value: "NotDisplay" },
      ],
      otherOperations: [
        { field: "是", value: "yes" },
        { field: "否", value: "no" },
      ],
    };
  },
  computed: {
    operations() {
      return [
        { field: "翻页", value: "Page" },
        { field: "调窗", value: "Window" },
        { field: "缩放", value: "Zoom" },
        { field: "移动图像", value: "Pan" },
        { field: "旋转图像", value: "Rotate" },
        { field: "放大镜", value: "Magnify" },
      ];
    },
  },
  methods: {
    setCatcherShortcutKey() {
      if (!this.catcherShortcutKey.middle || !this.catcherShortcutKey.right)
        return;
      localStorage.setItem(
        "catcherShortcutKey",
        JSON.stringify(this.catcherShortcutKey),
      );
    },
    setControlShortcutKey() {
      localStorage.setItem(
        "controlShortcutKey",
        JSON.stringify(this.controlShortcutKey),
      );
    },
    setOtherShortKey() {
      localStorage.setItem(
        "otherShortcutKey",
        JSON.stringify(this.otherShortcutKey),
      );
    },
    formatVRShortcutKey(type) {
      const operations = ["Pan", "Zoom", "Rotate"];
      for (let key in this.vrShortcutKey) {
        if (
          key !== type &&
          this.vrShortcutKey[key] === this.vrShortcutKey[type]
        ) {
          this.vrShortcutKey[key] = "";
          const values = Object.values(this.vrShortcutKey);
          for (let o of operations) {
            if (!values.includes(o)) {
              this.vrShortcutKey[key] = o;
              break;
            }
          }
          break;
        }
      }
    },
    setVRShortcutKey(type) {
      if (!this.vrShortcutKey.middle || !this.vrShortcutKey.right) return;
      this.formatVRShortcutKey(type);
      localStorage.setItem("vrShortcutKey", JSON.stringify(this.vrShortcutKey));
      bus.$emit("vrMouseTypeChange");
    },
  },
};
</script>

<style scoped lang="scss">
@import "catcher-key";
</style>
