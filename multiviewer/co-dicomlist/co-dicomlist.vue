<template>
  <!-- 右侧dicom -->
  <transition name="tableRight-fade">
    <div class="table-slide" :style="style" v-show="dicomListShow">
      <div class="dicomHead">
        <div class="title">{{ $t("meta") }}</div>

        <!--   搜索input     -->
        <div class="search-box">
          <input
            type="text"
            @keyup="searchHandle"
            v-model="searchText"
            class="search"
            :placeholder="$t('metas.search')"
          />
        </div>

        <!--   input range    -->
        <div
          class="rangeBox"
          v-if="pagetype === 'pnd' || pagetype === 'multiviewer'"
        >
          <span>{{ $t("metas.imageNum") }}</span>
          <input
            type="range"
            v-model="imgNum"
            @input.stop="debounceChangeNum"
            :max="maxPageNum"
            min="1"
          />
          <div class="number-wrap">
            <span
              @click.stop.prevent="changeImgNum('add')"
              class="number-add icon-number-add"
            ></span>
            <span
              @click.stop.prevent="changeImgNum('reduce')"
              class="number-reduce icon-number-reduce"
            ></span>
            <input
              class="number"
              type="text"
              v-model="imgNum"
              @blur.stop="changeImgNum"
              :max="maxPageNum"
              min="1"
            />
          </div>
        </div>

        <!--    关闭    -->
        <a class="tableSlideArrow close" @click.stop.prevent="data_btn"></a>
      </div>
      <ul class="dicomlist_table_head">
        <li class="a">{{ $t("metas.name") }}</li>
        <li class="b">{{ $t("metas.label") }}</li>
        <li class="c">{{ $t("metas.content") }}</li>
      </ul>
      <div class="table-scroll scrollbar">
        <div class="dicomlist_table">
          <v-table
            v-if="oArr"
            :model="oArr"
            :search-text="searchText"
          ></v-table>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import vTable from "./co-dicomlist-table.vue";
import LANG from "../../../assets/js/lang.js";
import TAG_DICT from "../../../assets/js/dataDictionary.js";
import { mapState } from "vuex";
import { debounce } from "../js/utils";
import { getDataType } from "@/assets/js/YMDataHandler.js";
import RouteMapping from "@/assets/constant/route-mapping.js";
import { OBS } from "@/assets/js/utils";

export default {
  name: "co-dicom-list",
  components: {
    vTable,
  },
  data() {
    return {
      LANG,
      imgNum: 10,
      searchText: "",
      oDicomMsg: null,
      dicomArr: [],
      newArr: [],
      index: 1000,
      oArr: [],
      dicomUrl: "",
      dicomStartNumber: 0,
    };
  },
  props: {
    vertical: Boolean,
    useGBDecode: Boolean,
    scrollIndex: {
      type: null,
      required: true,
    },
    pagetype: {
      type: String,
      required: true,
    },
    dicomListShow: {
      type: Boolean,
      required: true,
    },
    path: {
      type: null,
      required: true,
    },
    curViewMod: {
      type: Number,
      required: true,
    },
    canvasRange: Object,
    zindex: Number,
  },
  mounted() {
    if (this.pagetype === "pnd" || this.pagetype === "multiviewer") {
      // 判断是不是横截面，不是横截面默认显示第一章dicom文件信息
      this.dicomStartNumber = Math.floor(this.maxPageNum / 2);
    }
    this.dicomUrl = this.path[this.dicomStartNumber];
    this.imgNum = this.dicomStartNumber + 1;
    // this.getUrl();
    this.debounceChangeNum = debounce(() => {
      this.changeImgNum();
    }, 200);
    this.index = this.zindex;
  },
  computed: {
    ...mapState(["scaleRatio"]),
    style() {
      return {
        height: `calc((100% - ${this.canvasRange.RBTopWidth}px - ${this.canvasRange.RBBottomWidth}px))`,
        top: `${this.canvasRange.RBTopWidth}px`,
        // transform: `scale(${this.scaleRatio})`,
        // transformOrigin: "100% 0",
        zIndex: this.index,
      };
    },
    maxPageNum() {
      return this.path.length;
    },
  },
  methods: {
    init() {
      this.oArr = JSON.parse(JSON.stringify(this.newArr));
    },
    // 通过传入根节点获得树的深度，是 calDepth 的调用者。
    getTreeDepth(node) {
      if (undefined == node || null == node) {
        return 0;
      }
      // 返回结果
      let r = 0;
      // 树中当前层节点的集合。
      let currentLevelNodes = [node];
      // 判断当前层是否有节点
      while (currentLevelNodes.length > 0) {
        // 当前层有节点，深度可以加一。
        r++;
        // 下一层节点的集合。
        let nextLevelNodes = new Array();
        // 找到树中所有的下一层节点，并把这些节点放到 nextLevelNodes 中。
        for (let i = 0; i < currentLevelNodes.length; i++) {
          let e = currentLevelNodes[i];
          if (this.isHasChildren(e)) {
            nextLevelNodes = nextLevelNodes.concat(e.items);
          }
        }
        // 令当前层节点集合的引用指向下一层节点的集合。
        currentLevelNodes = nextLevelNodes;
      }
      return r;
    },
    traverseTree(node, callback) {
      if (!node) {
        return;
      }
      var stack = [];
      stack.push(node);
      var tmpNode;
      while (stack.length > 0) {
        tmpNode = stack.pop();
        callback(tmpNode);
        if (tmpNode.items && tmpNode.items.length > 0) {
          for (let i = tmpNode.items.length - 1; i >= 0; i--) {
            stack.push(tmpNode.items[i]);
          }
        }
      }
    },
    // 对子节点进行搜索。
    searchEach(node, value) {
      let depth = this.getTreeDepth(node);
      let self = this;
      for (let i = 0; i < depth - 1; i++) {
        // 记录【删除不匹配搜索内容的叶子节点】操作的次数。
        // 如果这个变量记录的操作次数为0，表示树形结构中，所有的
        // 叶子节点(不包含只有根节点的情况)都匹配搜索内容。那么就没有必要再
        // 在循环体里面遍历树了.
        let spliceCounter = 0;
        // 遍历树形结构
        this.traverseTree(node, (n) => {
          if (self.isHasChildren(n)) {
            let children = n.items;
            let length = children.length;
            // 找到不匹配搜索内容的叶子节点并删除。为了避免要删除的元素在数组中的索引改变，从后向前循环,
            // 找到匹配的元素就删除。
            for (let j = length - 1; j >= 0; j--) {
              let e3 = children[j];
              if (
                !self.isHasChildren(e3) &&
                !new RegExp(value.toLowerCase(), "ig").test(
                  e3.name.toLowerCase(),
                )
              ) {
                children.splice(j, 1);
                spliceCounter++;
              }
            } // end for (let j = length - 1; j >= 0; j--)
          }
        }); // end this.traverseTree(node, n=>{

        // 所有的叶子节点都匹配搜索内容，没必要再执行循环体了。
        if (spliceCounter == 0) {
          break;
        }
      }
    },
    // 判断树形结构中的一个节点是否具有孩子节点
    isHasChildren(node) {
      let flag = false;
      if (node.children && node.children.length > 0) {
        flag = true;
      }
      return flag;
    },
    searchHandle() {
      // 把树形结构还原成搜索以前的。
      this.init();
      if (this.searchText == "") {
        return;
      }
      if (this.oArr && this.oArr.length > 0) {
        this.oArr.forEach((n, i, a) => {
          // 对子节点遍历
          this.searchEach(n, this.searchText);
        });

        // 没有叶子节点的根节点也要清理掉
        let length = this.oArr.length;
        for (let i = length - 1; i >= 0; i--) {
          let e2 = this.oArr[i];
          if (
            !this.isHasChildren(e2) &&
            e2.name.toLowerCase().indexOf(this.searchText.toLowerCase()) <= -1
          ) {
            this.oArr.splice(i, 1);
          }
        }
      }
    },
    changeImgNum(type) {
      if (type === "add" && this.imgNum < this.maxPageNum) {
        this.imgNum++;
      } else if (type === "reduce" && this.imgNum > 1) {
        this.imgNum--;
      }
      if (this.imgNum > this.maxPageNum) {
        this.imgNum = this.maxPageNum;
      } else if (this.imgNum < 1) {
        this.imgNum = 1;
      }
      let url = this.path[this.imgNum - 1];
      this.dicomUrl = url;
    },
    data_btn() {
      /*右侧dicom弹窗*/
      this.$emit("update:dicomListShow", false);
    },
    async getUrl() {
      let url = this.dicomUrl;
      const { env } = getDataType();
      const { imageLoader } = RouteMapping[env?.toLocaleLowerCase() || "jh"];
      if (imageLoader === "wadouri") {
        let _this = this;
        let xhr = new XMLHttpRequest();
        try {
          xhr.open("get", url, true);
        } catch (err) {
          console.log(err);
        }
        xhr.responseType = "arraybuffer";
        xhr.onreadystatechange = function (res) {
          if (xhr.readyState == 4) {
            if (xhr.status == 200) {
              let byteArray = new Uint8Array(xhr.response);
              _this.dumpByteArray(byteArray);
              _this.searchHandle();
            } else {
              console.log("error");
            }
          }
        };
        xhr.send();
      } else {
        const obs = new OBS();
        try {
          const blob = await obs.getObject(url, "arraybuffer");
          let byteArray = new Uint8Array(blob);
          this.dumpByteArray(byteArray);
          this.searchHandle();
        } catch (e) {
          console.error(e);
        }
      }
    },
    dumpByteArray(byteArray) {
      let dataSet = dicomParser.parseDicom(byteArray);
      this.oArr = this.dumpDataSet(dataSet);
      this.newArr = this.oArr;
    },
    dumpDataSet(dataSet) {
      let elements = dataSet.elements;
      let output = [];
      for (let i in elements) {
        let tagObj = {};
        let tagMessage = this.getTag(i);
        let group = i.substring(1, 5);
        let element = i.substring(5, 9);
        if (tagMessage === undefined) {
          // 如果在字典库当中没有找到对应数据就跳过(可能字段以废弃或者字典库没更新)
          continue;
        }
        if (elements[i].items) {
          tagObj.items = [];
          tagObj.isFolder = true;
          for (let j = 0, len = elements[i].items.length; j < len; j++) {
            let newElements = elements[i].items[j].dataSet;
            tagObj.items = this.dumpDataSet(newElements);
          }
        }
        tagObj.tags = group + "," + element;
        tagObj.isExpend = false;
        tagObj.element = i;
        tagObj.name = tagMessage.name;
        tagObj.vr = tagMessage.vr;
        tagObj.length = elements[i].length;
        tagObj.value = this.getValue(dataSet, {
          ...elements[i],
          vr: tagMessage.vr,
        });
        output.push(tagObj);
      }
      return output;
    },
    getTag(tag) {
      let group = tag.substring(1, 5);
      let element = tag.substring(5, 9);
      let tagIndex = ("(" + group + "," + element + ")").toUpperCase();
      let array = TAG_DICT[tagIndex];
      return array;
    },
    decodeStr(element, byteArray) {
      const decodeType = this.useGBDecode ? "gb2312" : "utf-8";
      const origin = byteArray.slice(
        element.dataOffset,
        element.dataOffset + element.length,
      );
      const decoder = new TextDecoder(decodeType);
      return decoder.decode(origin);
    },
    // 根据tag解析得到value值
    getValue(dataSet, element) {
      const buffer = dataSet.byteArray.buffer;
      if (element.vr === undefined && element.tag === undefined) {
        if (element.length === 2) {
          return dataSet.uint16(element.tag);
        } else if (element.length === 4) {
          return dataSet.uint32(element.tag);
        }
      } else {
        let vr = element.vr;
        if (this.isStringVr(vr)) {
          let str = this.decodeStr(element, buffer);
          return str;
        } else if (vr == "US") {
          return dataSet.uint16(element.tag);
        } else if (vr === "SS") {
          return dataSet.int16(element.tag);
        } else if (vr == "UL") {
          return dataSet.uint32(element.tag);
        } else if (vr === "SL") {
          return dataSet.int32(element.tag);
        } else if (vr == "FD") {
          return dataSet.double(element.tag);
        } else if (vr == "FL") {
          return dataSet.float(element.tag);
        } else if (
          vr === "OB" ||
          vr === "OW" ||
          vr === "UN" ||
          vr === "OF" ||
          vr === "UT"
        ) {
          let str = dataSet.string(element.tag);
          return str;
        } else {
          // If it is some other length and we have no string
          return null;
        }
      }
    },
    isStringVr(vr) {
      const dic = [
        "OW|OB",
        "AT",
        "FL",
        "FD",
        "OB",
        "OF",
        "OW",
        "SI",
        "SQ",
        "SS",
        "UL",
        "US",
      ];
      if (dic.includes(vr)) {
        return false;
      }
      return true;
    },
  },

  watch: {
    dicomListShow() {
      this.searchText = null;
      return;
    },
    dicomUrl() {
      // this.init();
      // 初始化搜索
      // 取消滑动时清空搜索框的设定
      // this.searchText = "";
      this.getUrl();
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./css/co-dicomlist.scss";
</style>
