<template>
  <div id="aiAnalysis" class="viewer-ai-analysis" v-show="aiShow">

    <!--  头部  -->
    <div class="header">
      <div class="close" @click.stop="$emit('update:aiShow', false)"></div>
      <div class="title">AI计算</div>
    </div>

    <!--  筛选  -->
    <div class="filter" @mousedown.stop>
      <div class="selectBox">
        <div class="input">{{ categoryFilter || "请选择分类" }}</div>
        <div class="selectBtn"></div>
        <ul class="scrollbar2">
          <li
              v-for="item in categoryGroup"
              @click.stop="sortByCategory(item)"
              :key="item"
          >{{ item }}
          </li>
        </ul>
      </div>

      <div class="selectBox">
        <div class="input">{{ levelFilter || "请选择良恶性" }}</div>
        <div class="selectBtn"></div>
        <ul class="scrollbar2">
          <li
              v-for="item in levelGroup"
              @click.stop="sortByLevel(item)"
              :key="item"
          >{{ item }}
          </li>
        </ul>
      </div>

      <div class="operation">
        <div class="show" @click="showAIAnalysis">
          <img src="~@/assets/images/show@2x.png" alt="">
          <span>显示</span>
        </div>
        <div class="hidden" @click="hiddenAIAnalysis">
          <img src="~@/assets/images/hidden@2x.png" alt="">
          <span>隐藏</span>
        </div>
        <div class="pink-up" @click="pickUpAll">
          <span>一键收起</span>
        </div>
      </div>
    </div>

    <!--  表单  -->
    <div class="table scrollbar" @mousedown.stop>
      <analysisTable
          ref="analysisTable"
          :currImageNum="imageData && imageData['curImageNum']"
          :analysisElements="analysisElementsCopy"
          :hiddenMap="hiddenMap"
          @showItem="showItem"
          @hiddenItem="hiddenItem"
          @skip2Num="$emit('skip2Num', $event)"></analysisTable>
    </div>
  </div>
</template>
<script>
import analysisTable from "./analysis-table/analysis-table.vue";

export default {
  name: "viewer-ai-analysis",
  props: {
    aiShow: Boolean,
    analysis: [Object, null],
    isVertical: false,
    imageData: Object,
  },
  data() {
    return {
      analysisElements: [], // AI分析的结果数组(数据源不变)
      analysisElementsCopy: [], // 可变
      levelGroup: [], // 风险等级分组
      categoryGroup: [], // 种类分组

      // 筛选条件
      categoryFilter: "",
      levelFilter: "",

      hiddenMap: {}, // 隐藏选项
    }
  },
  mounted() {
    //窗口可拖动,横屏的时候暂时禁用，ssy
    if (this.isVertical) {
      const unwatch = this.$watch("aiShow", () => {
        if (!this.aiShow) return;
        this.$follow_mouse("aiAnalysis");
        unwatch();
      });
    }
  },

  methods: {
    /**
     * 根据分类排序
     * @param value
     */
    sortByCategory(value) {
      this.categoryFilter = value;
      if (value === "全部分类") {
        this.categoryFilter = "";
      }
      this.analysisElementsCopy = this.sortByFilter();
    },

    /**
     * 根据登记排序
     * @param value
     */
    sortByLevel(value) {
      this.levelFilter = value;
      if (value === "全部良恶性") {
        this.levelFilter = "";
      }
      this.analysisElementsCopy = this.sortByFilter();
    },

    /**
     * 排序函数
     * @return {*[]}
     */
    sortByFilter() {
      const elements = this.analysisElements.filter((el) => {
        let flag1 = false;
        if (this.categoryFilter === "") {
          flag1 = true;
        } else {
          flag1 = el["category"] === this.categoryFilter;
        }

        let flag2 = false;
        if (this.levelFilter === "") {
          flag2 = true;
        } else {
          flag2 = el["level"] === this.levelFilter;
        }
        return flag1 && flag2;
      });
      return elements;
    },

    /**
     * 显示某一项
     * @param item AI分析数组某一个元素
     */
    showItem(item) {
      const id = item.id;
      for (const [index, el] of this.analysisElements.entries()) {
        if (el.id === id) {
          el.show = 1;
          this.$set(this.analysisElements, index, { ...el });
          break;
        }
      }
      for (const [index, el] of this.analysisElementsCopy.entries()) {
        if (el.id === id) {
          el.show = 1;
          this.$set(this.analysisElements, index, { ...el });
          break;
        }
      }
      this.emitHiddenMap();
    },

    /**
     * 隐藏某一项
     * @param item AI分析数组某一个元素
     */
    hiddenItem(item) {
      const id = item.id;
      for (const [index, el] of this.analysisElements.entries()) {
        if (el.id === id) {
          el.show = 0;
          this.$set(this.analysisElements, index, { ...el });
          break;
        }
      }
      for (const [index, el] of this.analysisElementsCopy.entries()) {
        if (el.id === id) {
          el.show = 0;
          this.$set(this.analysisElements, index, { ...el });
          break;
        }
      }
      this.emitHiddenMap();
    },

    /**
     * 显示/全显示AI分析
     */
    showAIAnalysis() {
      const exist = this.hiddenMap;
      if (Object.keys(exist).length <= 0) { // 未选中任何
        return;
      }
      this.changeShowStatus(this.hiddenMap, 1);
      this.emitHiddenMap();
      this.hiddenMap = {};
    },

    /**
     * 显示/全隐藏AI分析
     */
    hiddenAIAnalysis() {
      const exist = this.hiddenMap;
      if (Object.keys(exist).length <= 0) { // 未选中任何
        return;
      }
      this.changeShowStatus(this.hiddenMap, 0);
      this.emitHiddenMap();
      this.hiddenMap = {};
    },

    /**
     * 全部收起
     */
    pickUpAll() {
      const ref = this.$refs.analysisTable;
      ref.expandList = [];
    },

    /**
     * Util：更改部分AI分析的显示状态
     * @param hiddenMap
     * @param status {0 | 1}
     */
    changeShowStatus(hiddenMap, status) {
      for (const el of this.analysisElements) {
        if (!hiddenMap[el.id]) continue;
        el.show = status;
      }

      for (const el of this.analysisElementsCopy) {
        if (!hiddenMap[el.id]) continue;
        el.show = status;
      }
    },

    /**
     * Util：更改所有的AI分析的显示状态
     * @param status {0 | 1}
     */
    changeAllShowStatus(status) {
      for (const el of this.analysisElements) {
        el.show = status;
      }

      for (const el of this.analysisElementsCopy) {
        el.show = status;
      }
    },

    /**
     * Util：搜集所有隐藏的AI分析数据，并发送
     */
    emitHiddenMap() {
      const hiddenMap = {};
      for (const el of this.analysisElements) {
        if (!el.show) {
          hiddenMap[el.id] = el;
        }
      }
      this.$emit("hiddenAnalysis", hiddenMap);
    },

    /**
     * 组件方法：初始化
     */
    init() {
      this.categoryFilter = "";
      this.levelFilter = "";
      this.$refs.analysisTable.expandList = [];
    },

  },

  watch: {
    analysis() {
      // 没有结果 或 结果无法分析
      if (!this.analysis || this.analysis["status"] !== 1) {
        return;
      }

      // 筛选数据
      const levelGroup = new Set();
      const categoryGroup = new Set();
      const analysisElements = this.analysis["elements"].map(el => {
        const level = el["level"];
        const category = el["category"];
        levelGroup.add(level);
        categoryGroup.add(category);
        el.show = 1; // 默认显示
        return el;
      });
      this.analysisElements = analysisElements;
      this.analysisElementsCopy = analysisElements;
      this.levelGroup = Array.from(levelGroup);
      this.levelGroup.unshift("全部良恶性");
      this.categoryGroup = Array.from(categoryGroup);
      this.categoryGroup.unshift("全部分类");
    }
  },

  components: {
    analysisTable,
  },
};
</script>
<style scoped lang="scss">
@import "viewer-ai-analysis";
</style>
