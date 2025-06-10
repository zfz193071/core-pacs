<template>
  <div class="language-switch">
    <div class="color">
      <div class="box-title">{{ $t("settings.menu.language") }}</div>
      <el-radio-group v-model="language" @change="changeLanguage">
        <el-radio label="zh">{{ $t("settings.language.Chinese") }}</el-radio>
        <el-radio label="en">{{ $t("settings.language.English") }}</el-radio>
      </el-radio-group>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
export default {
  data() {
    return {
      language: "",
    };
  },
  computed: {
    ...mapState(["lang"]),
  },
  watch: {
    lang: {
      handler(val) {
        this.language = val;
      },
      immediate: true,
    },
  },
  methods: {
    changeLanguage(val) {
      if (val === "en") {
        this.$store.commit("setLang", "en");
        this.$i18n.locale = "en";
      } else {
        this.$store.commit("setLang", "zh");
        this.$i18n.locale = "zh";
      }
      localStorage.setItem("lang", this.$i18n.locale);
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>
