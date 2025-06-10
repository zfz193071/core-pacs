<template>
  <div class="table-wrapper">
    <ul class="table-header">
      <li class="table-row">
        <div class="checkbox" v-if="showCheck">
          <el-checkbox
            :indeterminate="isIndeterminate"
            v-model="selectAll"
            @change="handleCheckAllChange"
          />
        </div>
        <div
          class="table-cell"
          v-for="item in columnData"
          :key="item.name"
          :style="`width: ${item.width}px;`"
        >
          {{ $t(`historyTable.${item.name}`) }}
        </div>
      </li>
    </ul>
    <ul class="table-body">
      <li class="table-row" v-for="(item, index) in tableData" :key="item.id">
        <div class="checkbox" v-if="showCheck">
          <el-checkbox
            :value="item.checked"
            @change="setItemChecked(item, index)"
          />
        </div>
        <div
          class="table-cell"
          v-for="key in columnData.map((i) => i.name)"
          :key="key"
          :style="`width: ${getColumn(key).width}px;`"
        >
          <el-popover
            v-if="['examItem', 'patientName', 'description'].includes(key)"
            popper-class="history-popper"
            trigger="hover"
            :visible-arrow="false"
            :content="item[key] && item[key].toString()"
          >
            <div class="text-overflow" slot="reference">{{ item[key] }}</div>
          </el-popover>
          <div v-else class="text-overflow">{{ item[key] }}</div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "HistoryTable",
  props: {
    showCheck: {
      type: Boolean,
      default: false,
    },
    columnData: {
      type: Array,
      default: () => [],
    },
    tableData: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    selectAll: {
      get() {
        if (!this.tableData.length) {
          return false;
        }
        return this.tableData.every((i) => i.checked);
      },
      set(val) {
        this.tableData.forEach((i, index) => {
          i.checked = val;
          this.$set(this.tableData, index, i);
        });
      },
    },
    isIndeterminate() {
      return this.tableData.some((i) => i.checked) && !this.selectAll;
    },
  },
  methods: {
    getColumn(name) {
      return this.columnData.find((i) => i.name === name);
    },
    handleCheckAllChange() {
      this.tableData.forEach((i, index) => {
        i.checked = this.selectAll;
        this.$set(this.tableData, index, i);
      });
    },
    setItemChecked(item, index) {
      item.checked = !item.checked;
      this.$set(this.tableData, index, item);
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./table.scss";
</style>
