<template>
  <ul class="table">
    <li class="table-li" v-show="model" v-for="(item, x) in list" :key="x">
      <div
        :class="item.isFolder ? 'table-folder' : ''"
        class="table-tr"
        @click="item.isFolder ? toggle(item) : ''"
      >
        <i
          v-if="item.isFolder"
          :class="item.isExpend ? 'active' : ''"
          class="table-icon icon-fold"
        ></i>
        <span class="table-td a">{{ item.name }}</span>
        <span class="table-td b">{{ item.tags }}</span>
        <span v-if="item.value" class="table-td c">{{ item.value }}</span>
        <span v-else class="table-td c">NULL</span>
      </div>
      <transition v-if="item.isFolder" name="slide">
        <v-table
          v-show="item.isExpend"
          class="table-more"
          :search-text="searchText"
          :model="item.items"
        ></v-table>
      </transition>
    </li>
  </ul>
</template>

<script>
export default {
  name: "vTable",
  props: ["model", "searchText"],
  computed: {
    list() {
      if (
        this.searchText == undefined ||
        this.searchText == "" ||
        this.searchText == null
      ) {
        return this.model;
      }
      this.model.forEach((item, index) => {
        if (item.isFolder) {
          item.isExpend = true;
        }
      });
      return this.model;
    },
  },
  data() {
    return {};
  },
  mounted() {},
  watch: {
    isDynamicFolder() {
      this.isOpen = true;
      this.folderIcon = "folder-open";
    },
  },
  methods: {
    toggle(item) {
      var recurFunc = (data) => {
        data.forEach((m) => {
          if (m.isFolder) m.isExpend = false;
          if (m.items) recurFunc(m.items);
        });
      };
      if (item.isFolder) recurFunc(item.items);
      item.isExpend = !item.isExpend;
    },
  },
};
</script>

<style scoped lang="scss">
@import "./css/co-dicomlist-table.scss";
</style>
