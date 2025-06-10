<template>
  <div class="prelayout-wrapper">
    <div class="box-title">{{ $t("settings.titles.layout") }}</div>
    <div class="content">
      <div class="item">
        {{ $t("settings.layout.model") }}:
        <el-select
          v-model="model"
          size="mini"
          :popper-append-to-body="false"
          @change="changeModel"
        >
          <el-option
            v-for="option of modelOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          >
          </el-option>
        </el-select>
      </div>
      <div class="item">
        {{ $t("settings.layout.layout") }}:
        <el-select
          v-model="layout"
          size="mini"
          :popper-append-to-body="false"
          @change="changeLayout"
        >
          <el-option
            v-for="option of layoutOptions"
            :key="option.value"
            :label="$t(`settings.layout.${getLangKey(option.value)}`)"
            :value="option.value"
          >
            <div class="layout-item">
              <svg-icon :name="option.icon" />
              <span>{{
                $t(`settings.layout.${getLangKey(option.value)}`)
              }}</span>
            </div>
          </el-option>
        </el-select>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "PreLayoutSetting",
  props: {
    prelayoutSetting: Array,
  },
  created() {
    this.layout = this.prelayoutSetting.find(
      (item) => item.model === "CT",
    ).layout;
  },
  data() {
    return {
      model: "CT",
      layout: "",
      modelOptions: [
        { label: "CT", value: "CT" },
        { label: "MR", value: "MR" },
        { label: "DX", value: "DX" },
        { label: "DR", value: "DR" },
        { label: "CR", value: "CR" },
        { label: "XA", value: "XA" },
        { label: "RF", value: "RF" },
        { label: "US", value: "US" },
        { label: "NM", value: "NM" },
        { label: "PT", value: "PT" },
        { label: "ES", value: "ES" },
        { label: "GM", value: "GM" },
        { label: "MG", value: "MG" },
      ],
      layoutOptions: [
        { label: "单布局", value: "layout1", icon: "layout-1" },
        { label: "二布局", value: "layout2", icon: "layout-2" },
        { label: "二布局2", value: "layout2.0", icon: "layout-2_1" },
        { label: "四布局", value: "layout4", icon: "layout-4" },
        { label: "六布局", value: "layout6", icon: "layout-6" },
        { label: "六布局2", value: "layout6.0", icon: "layout-6-2" },
        { label: "九布局", value: "layout9", icon: "layout-9" },
      ],
    };
  },
  methods: {
    getLangKey(key) {
      if (key.includes(".")) {
        return key.replace(".", "-");
      }
      return key;
    },
    changeModel(val) {
      const entry = this.prelayoutSetting.find((item) => item.model === val);
      this.layout = entry ? entry.layout : "";
    },
    changeLayout() {
      if (this.model) this.saveToStorage(this.model);
    },
    saveToStorage(model) {
      const index = this.prelayoutSetting.findIndex(
        (item) => item.model === model,
      );
      const entry = { model, layout: this.layout };
      this.prelayoutSetting.splice(index, 1, entry);
      localStorage.setItem(
        "prelayoutSetting",
        JSON.stringify(this.prelayoutSetting),
      );
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>
