<template>
  <div class="theme" v-show="show">
    <div class="color">
      <div class="box-title">{{ $t("settings.titles.appearance") }}</div>
      <div class="left">
        <div class="title">{{ $t("settings.theme.chooseColor") }}：</div>
        <div
          class="item"
          :class="{ selected: theme.value === themeData }"
          v-for="theme of themeList"
          :key="theme.value"
          @click="themeData = theme.value"
        >
          <div class="bg" :style="{ backgroundColor: theme.color }"></div>
        </div>
      </div>

      <div class="right">
        <el-checkbox v-model="showText">{{
          $t("settings.theme.showToolbarText")
        }}</el-checkbox>
      </div>
    </div>

    <div class="series-list-position">
      <div class="box-title">{{ $t("settings.titles.seriesPos") }}</div>
      <div
        class="item"
        :class="{ isActive: seriesListPosData === 'LEFT' }"
        @click.stop="selectSeriesListPos('LEFT')"
      >
        <div class="image">
          <img
            src="~@/assets/images/series-list-left.png"
            draggable="false"
            alt=""
          />
        </div>
        <div class="desc">{{ $t("settings.theme.showLeft") }}</div>
      </div>
      <div
        class="item"
        :class="{ isActive: seriesListPosData === 'BOTTOM' }"
        @click.stop="selectSeriesListPos('BOTTOM')"
      >
        <div class="image">
          <img
            src="~@/assets/images/series-list-bottom.png"
            draggable="false"
            alt=""
          />
        </div>
        <div class="desc">{{ $t("settings.theme.showBottom") }}</div>
      </div>
    </div>

    <div class="series-list-position scale">
      <div class="box-title">{{ $t("settings.titles.scale") }}</div>
      <span>{{ $t("settings.theme.scaleRatio") }}：</span>
      <el-select
        v-model="scaleRatio"
        size="mini"
        :popper-append-to-body="false"
      >
        <el-option label="100%" :value="1"></el-option>
        <el-option label="125%" :value="1.25"></el-option>
        <el-option label="150%" :value="1.5"></el-option>
        <el-option label="175%" :value="1.75"></el-option>
        <el-option label="200%" :value="2"></el-option>
      </el-select>
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations } from "vuex";

export default {
  name: "Theme",
  props: {
    theme: String,
    seriesListPos: String,
    show: Boolean,
  },
  data() {
    return {
      themeData: "",
      seriesListPosData: "",
      themeList: [
        { color: "#333333", desc: "深灰", value: "dark" },
        { color: "#224993", desc: "蓝色", value: "blue" },
        { color: "#D8D8D8", desc: "灰白", value: "light" },
      ],
      scaleRatio: 1,
      showText: false,
    };
  },
  mounted() {
    const local = localStorage.getItem("scaleRatio");
    this.scaleRatio = local ? parseFloat(local) : this.$store.state.scaleRatio;
    const showText = localStorage.getItem("showToolbarText");
    if (showText === "true") this.showText = true;
  },
  computed: {
    ...mapState(["showToolbarText"]),
  },
  methods: {
    ...mapMutations(["changeTheme", "setScaleRatio", "setShowToolbarText"]),

    selectSeriesListPos(direction) {
      this.seriesListPosData = direction;
    },

    /**
     * 保存并切换主题色
     */
    save() {
      if (!this.themeData) {
        this.themeData = this.theme;
      }
      if (!this.seriesListPosData) {
        this.seriesListPosData = this.seriesListPos;
      }
      this.$emit("update:seriesListPos", this.seriesListPosData);
      this.$emit("update:theme", this.themeData);
      localStorage.setItem("theme", this.themeData);
      this.changeTheme(this.themeData);
      this.setScaleRatio(this.scaleRatio);
      localStorage.setItem("scaleRatio", this.scaleRatio);
      this.setShowToolbarText(this.showText);
      localStorage.setItem("showToolbarText", this.showText);
    },

    init() {
      this.themeData = this.theme;
      this.seriesListPosData = this.seriesListPos;
    },
  },

  watch: {
    show(newest) {
      if (newest) {
        this.init();
      }
    },
  },
};
</script>

<style lang="sass" scoped>
@import "theme"
</style>
