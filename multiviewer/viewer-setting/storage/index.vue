<template>
  <div class="storage-wrapper">
    <div class="block">
      <div class="box-title">{{ $t("settings.cache.title") }}</div>
      <div class="item" v-for="info of storageInfo" :key="info.name">
        <span
          >{{ $t(`settings.cache.${info.name}`) }}:
          {{ cacheStorageInfo[info.name] }} {{ info.unit }}</span
        >
      </div>
      <div class="item enable-storage">
        <el-checkbox
          :disabled="disabledCache"
          :value="cacheStorageInfo.enable"
          @change="changeEnable"
        >
          {{ $t("settings.cache.openAutoCache") }}
        </el-checkbox>
      </div>
      <div class="item clean-storage" @click="removeStorage">
        <svg-icon name="remove-storage" />
        <span>{{ $t("settings.cache.clearCache") }}</span>
      </div>
      <div class="tip" v-if="isLowerConfigureDevice || useCompatibility">
        <div class="warning"></div>
        <div v-if="isLowerConfigureDevice">
          {{ $t("settings.cache.deviceTip") }}
        </div>
        <div v-else>{{ $t("settings.cache.modeTip") }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import DB from "../../js/db.js";
export default {
  name: "SettingStorage",
  data() {
    return {
      enable: true,
      storageInfo: [
        { label: "可用空间", name: "availableStorage", unit: "MB" },
        { label: "已用空间", name: "usedStorage", unit: "MB" },
        { label: "缓存Series数量", name: "seriesNum", unit: "条" },
      ],
    };
  },
  computed: {
    ...mapState(["cacheStorageInfo", "isLowerConfigureDevice"]),
    useCompatibility() {
      return localStorage.getItem("useCompatibility") === "true";
    },
    disabledCache() {
      return this.isLowerConfigureDevice || this.useCompatibility;
    },
  },
  methods: {
    changeEnable(val) {
      const info = {
        ...this.cacheStorageInfo,
        enable: val,
      };
      this.$store.commit("setCacheStorageInfo", info);
      localStorage.setItem("cacheStorageInfo", JSON.stringify(info));
    },
    removeStorage() {
      DB.dropDB().then(() => {
        const info = {
          ...this.cacheStorageInfo,
          usedStorage: 0,
          seriesNum: 0,
        };
        this.$store.commit("setCacheStorageInfo", info);
        localStorage.setItem("cacheStorageInfo", JSON.stringify(info));
        Vue.prototype.$notify({
          title: "成功",
          content: "清除缓存成功",
          type: "success",
        });
      });
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>
