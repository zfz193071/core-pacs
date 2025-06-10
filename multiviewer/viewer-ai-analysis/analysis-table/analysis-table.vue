<template>
  <el-table
      class="analysis-table"
      :data="analysisElements"
      style="width: 100%"
      :row-key="(row) => row['id']"
      :expand-row-keys="expandList"
      ref="analysisTableRef"
      :default-sort="{ prop: 'probability', order: 'descending' }"
      :row-class-name="rowClassFunc"
      @row-click="clickRow" @expand-change="changeExpand">
    <el-table-column width="3">
      <template #header>
        <el-checkbox :value="selectAll" @change="changeSelectAll($event)" />
      </template>
      <template v-slot="{ row }">
        <el-checkbox
            :value="!!hiddenMap[row.id]"
            @change="changeAnalysis($event, row)" />
      </template>
    </el-table-column>
    <el-table-column type="expand" width="30">
      <template v-slot="data">
        <div class="report">
          <div class="title">报告：</div>
          <div class="content">{{ data.row["report"] }}</div>
          <img @click="copyTxt(data.row['report'])" src="~@/assets/images/copy@2x.png" alt="">
        </div>
        <div class="nccn">
          <div class="title">建议：</div>
          <div class="content">{{ data.row["nccn"] }}</div>
          <img @click="copyTxt(data.row['nccn'])" src="~@/assets/images/copy@2x.png" alt="">
        </div>
      </template>
    </el-table-column>
    <el-table-column
        prop="instanceNumber"
        label="index"
        sortable
        width="80">
      <template v-slot="{ row }">
        {{ row["instanceNumber"] + 1 }}
      </template>
    </el-table-column>
    <el-table-column
        prop="volume"
        label="体积"
        width="100"
        sortable>
      <template v-slot="{ row }">
        {{ row['volume'] }}mm³
      </template>
    </el-table-column>
    <el-table-column
        prop="category"
        sortable
        label="分类">
    </el-table-column>
    <el-table-column
        prop="level"
        sortable
        width="90"
        label="良恶性">
      <template v-slot="{ row }">
        <div v-if="row['level'] === '低风险'" class="normal-tag">{{ row['level'] }}</div>
        <div v-else-if="row['level'] === '中风险'" class="warning-tag">{{ row['level'] }}</div>
        <div v-else-if="row['level'] === '高风险'" class="danger-tag">{{ row['level'] }}</div>
        <div v-else class="tag">{{ row['level'] }}</div>
      </template>
    </el-table-column>
    <el-table-column
        prop="probability"
        sortable
        width="115"
        label="良恶性概率">
      <template v-slot="{ row }">
        {{ (row['probability'] * 100).toFixed(2) }}%
      </template>
    </el-table-column>
    <el-table-column
        prop="show"
        sortable
        width="75"
        label="操作">
      <template v-slot="{ row }">
        <div v-if="row['show']" class="show" @click.stop="$emit('hiddenItem', row)">
          <img src="~@/assets/images/show-selected@2x.png" alt="">
          <span>显示</span>
        </div>
        <div v-else class="hidden" @click.stop="$emit('showItem', row)">
          <img src="~@/assets/images/hidden@2x.png" alt="">
          <span>隐藏</span>
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>
<script>
export default {
  name: "analysis-table",
  props: {
    analysisElements: Array,
    hiddenMap: Object,
    currImageNum: Number,
  },
  data() {
    return {
      selectAll: false,
      expandList: [],
    }
  },

  methods: {

    /**
     * el-table下的每一row的class
     * @param row
     * @param rowIndex
     * @return {string}
     */
    rowClassFunc({row, rowIndex}) {
      return `ai-${row['id']}`;
    },

    /**
     * 全选/全取消
     * @param flag
     */
    changeSelectAll(flag) {
      this.selectAll = flag;
      if (flag) {
        for (const analysis of this.analysisElements) {
          this.$set(this.hiddenMap, analysis.id, analysis);
        }
      } else {
        for (const analysis of this.analysisElements) {
          this.$delete(this.hiddenMap, analysis.id);
        }
      }

    },

    /**
     * 选择/取消表格某一行
     * @param flag
     * @param row
     */
    changeAnalysis(flag, row) {
      if (flag) {
        this.$set(this.hiddenMap, row.id, row);
      } else {
        this.$delete(this.hiddenMap, row.id);
      }
    },

    /**
     * 点击表格某一行
     * @param row
     * @param column
     * @param event
     */
    clickRow(row, column, event) {
      const analysisTableRef = this.$refs["analysisTableRef"];
      analysisTableRef.toggleRowExpansion(row);
      this.$emit("skip2Num", row);
    },

    /**
     * 展开某一行的表格内容时触发
     * @param row
     * @param expandedRows
     */
    changeExpand(row, expandedRows) {
      const expandSet = [];
      for (const row of expandedRows) {
        expandSet.push(row.id);
      }
      this.expandList = expandSet;
    },

    /**
     * 拷贝文本内容
     * @param txt 复制内容
     */
    async copyTxt(txt) {
      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);
      textarea.style.position = "absolute";
      textarea.style.zIndex = "-1";
      textarea.style.opacity = "0";
      textarea.value = txt;
      textarea.select();
      document.execCommand("copy", true);
      document.body.removeChild(textarea);
      this.$layer("复制成功");
    },
  },

  watch: {
    hiddenMap(newest) {
      const n = Object.keys(newest).length;
      this.selectAll = n === this.analysisElements.length;
    },

    currImageNum(newest) {
      const analysisTableRef = this.$refs["analysisTableRef"];
      const el = this.analysisElements.find(el => el["instanceNumber"] === newest);
      if (!el) {
        this.$nextTick(() => {
          const tdElList = analysisTableRef.$el.querySelectorAll(`#aiAnalysis .el-table__body .el-table__row td`);
          for (const el of tdElList) {
            el.classList.remove("highlight");
          }
        })
        return;
      }

      this.$nextTick(() => {
        const tdElList = analysisTableRef.$el.querySelectorAll(`#aiAnalysis .el-table__body .el-table__row td`);
        for (const el of tdElList) {
          el.classList.remove("highlight");
        }

        const highlightList = analysisTableRef.$el.querySelectorAll(`.ai-${el["id"]} td`);
        for (const el of highlightList) {
          el.classList.add("highlight");
        }
      })
    }
  },
}
</script>

<style scoped lang="scss">
@import "analysis-table";
</style>
