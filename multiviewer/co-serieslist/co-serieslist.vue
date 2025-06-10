<template>
  <div style="width: 100%; height: calc(100% - 52px)">
    <div
      id="seriesList"
      ref="seriesList"
      v-show="seriesListPos === 'LEFT'"
      :class="{
        [`shrink-${scaleRatio * 100}`]: column === 2,
        vertical: vertical,
        [`series-${scaleRatio * 100}`]: column === 1,
      }"
      @mousewheel.stop
      @DOMMouseScroll.stop
    >
      <div style="display: none">{{ curenStoreSize }}</div>
      <!--  展开  -->
      <div :class="{ tab: true, 'rotate-180': column === 2 }">
        <div class="expand expand-bg" @click="tabHandler"></div>
      </div>

      <!--  列表展开  -->
      <div class="study-container" v-show="column === 1">
        <div class="box1" @mousedown.stop>
          <!-- 搜索框 -->
          <div class="search">
            <div class="input">
              <input
                type="text"
                v-model="searchWord"
                :placeholder="$t('series.keyword')"
              />
              <div class="suffix-icon icon-search"></div>
            </div>
            <div
              v-show="false"
              class="show-part icon-show"
              :class="{ 'show-all': ifShowHiddenData }"
              @click.stop.prevent="ifShowHiddenData = !ifShowHiddenData"
            ></div>
          </div>
        </div>

        <!--  series list  -->
        <ul class="navList no-scrollbar" @mousedown.stop>
          <template v-for="(studyInfo, studyID) in LISTDATA">
            <div
              class="study"
              :class="{
                selected: studyInfo.data.find(
                  (item) => item.seriesId === currentSID,
                ),
              }"
              :key="studyID"
            >
              <img class="avatar" src="~@/assets/images/user.png" alt="" />
              <div class="info">
                <div class="patient-name overflow-1">
                  {{ studyInfo.PatientName }}
                </div>
                <div class="row">
                  <div
                    class="patient-id icon-copy1 overflow-1"
                    :title="studyInfo.PatientID"
                    @click="copy(studyInfo.PatientID)"
                  >
                    {{ studyInfo.PatientID }}
                  </div>
                  <div class="study-date">
                    {{ studyInfo.StudyDate | studyDateFormat }}
                  </div>
                </div>
                <div class="row">
                  <div class="series-num">
                    {{ $t("series.seriesNum")
                    }}{{ getSeriesNum(studyInfo.data) }}
                  </div>
                  <div class="images-num">
                    {{ $t("series.imageNum") }}{{ studyInfo.imageTotalNumber }}
                  </div>
                </div>
              </div>
              <img
                class="switch"
                :class="{ shrink: studyInfo.ifShow }"
                src="~@/assets/images/tab2.png"
                alt=""
                @click="showStudy(studyID, !studyInfo.ifShow)"
              />
            </div>

            <!--     series 列表     -->
            <div
              draggable="true"
              class="series"
              :class="{
                selected: seriesListLiSelect(item),
                'is-pt': item.modality === 'PT',
              }"
              v-for="item of studyInfo.data"
              :key="item.seriesId"
              v-show="studyInfo.ifShow && item.hidden === false"
              @click.stop.prevent="clickChangeSeries(item)"
              @contextmenu.stop.prevent="changeMinSID(item)"
              @dragstart.stop="drageStart($event, item)"
              @dragend.stop="drageEnd"
              @mousedown.stop
            >
              <div class="content">
                <div class="row1">
                  <div class="modality" :class="item.modality">
                    {{ item.modality }}
                  </div>
                  <div class="sid">SID:{{ item.id }}</div>
                  <el-tooltip
                    v-if="item.isNotUniformSquence"
                    effect="light"
                    popper-class="warning-popper"
                    :content="$t('series.isNotUniform')"
                    placement="top"
                  >
                    <div class="warning"></div>
                  </el-tooltip>
                </div>
                <div class="row2 overflow-1" :title="item.description">
                  {{ item.description }}
                </div>
                <div class="row3">
                  <div class="thickness">
                    T:{{ item.thickness | fixedFormat }}
                  </div>
                  <div class="number">N:{{ item.imageNumber }}</div>
                </div>
                <div
                  v-show="false"
                  class="icon"
                  :class="[item.visible ? 'hidden-icon' : 'show-icon']"
                  @click.stop.prevent="troggleItemHidden(item)"
                ></div>
              </div>
              <div class="cover" :data-sid="item.seriesId">
                <div class="img">
                  <img
                    v-show="!thumbnailImages[item.seriesId]"
                    src=""
                    alt=""
                    @error="errorImgHandler"
                  />
                  <img
                    v-show="
                      thumbnailImages[item.seriesId] &&
                      thumbnailImages[item.seriesId] !== 'canvas'
                    "
                    :src="thumbnailImages[item.seriesId]"
                    alt=""
                  />
                  <canvas
                    v-show="
                      thumbnailImages[item.seriesId] &&
                      thumbnailImages[item.seriesId] === 'canvas'
                    "
                    class="thumbnail"
                  ></canvas>
                </div>
                <div
                  v-if="getDeleS(item.seriesId)"
                  class="close"
                  @click.stop="deleteImgStore(item.seriesId)"
                ></div>
                <div class="progress" v-if="imgPoor">
                  <div
                    :style="{ width: getWidth(item.seriesId) }"
                    :class="getStyle(item.seriesId)"
                  ></div>
                </div>
              </div>
            </div>
          </template>
        </ul>
      </div>

      <!--  列表收缩  -->
      <!-- <div class="study-container" v-show="column !== 1"> -->
      <div class="shrink-container" v-show="column !== 1" @mousedown.stop>
        <div class="item">
          <div class="shrink-expand icon-expand" @click="tabHandler"></div>
          <div class="hover-list scrollbar2">
            <div class="box1">
              <!-- 搜索框 -->
              <div class="search">
                <div class="input">
                  <input
                    type="text"
                    v-model="searchWord"
                    :placeholder="$t('series.keyword')"
                  />
                  <div class="suffix-icon icon-search"></div>
                </div>
                <div
                  v-show="false"
                  class="show-part icon-show"
                  :class="{ 'show-all': ifShowHiddenData }"
                  @click.stop.prevent="ifShowHiddenData = !ifShowHiddenData"
                ></div>
              </div>
            </div>

            <!--  series list  -->
            <ul class="navList no-scrollbar">
              <template v-for="(studyInfo, studyID) in LISTDATA">
                <div
                  class="study"
                  :class="{ selected: studySelected(studyID) }"
                  :key="studyID"
                >
                  <img class="avatar" src="~@/assets/images/user.png" alt="" />
                  <div class="info">
                    <div class="patient-name overflow-1">
                      {{ studyInfo.PatientName }}
                    </div>
                    <div class="row">
                      <div
                        class="patient-id icon-copy1 overflow-1"
                        :title="studyInfo.PatientID"
                        @click="copy(studyInfo.PatientID)"
                      >
                        {{ studyInfo.PatientID }}
                      </div>
                      <div class="study-date">
                        {{ studyInfo.StudyDate | studyDateFormat }}
                      </div>
                    </div>
                    <div class="row">
                      <div class="series-num">
                        {{ $t("series.seriesNum")
                        }}{{ getSeriesNum(studyInfo.data) }}
                      </div>
                      <div class="images-num">
                        {{ $t("series.imageNum")
                        }}{{ studyInfo.imageTotalNumber }}
                      </div>
                    </div>
                  </div>
                  <img
                    class="switch"
                    :class="{ shrink: studyInfo.ifShow }"
                    src="~@/assets/images/tab2.png"
                    alt=""
                    @click="showStudy(studyID, !studyInfo.ifShow)"
                  />
                </div>

                <!--     series 列表     -->
                <div
                  draggable="true"
                  class="series"
                  :class="{
                    selected: seriesListLiSelect(item),
                    'is-pt': item.modality === 'PT',
                  }"
                  v-for="item of studyInfo.data"
                  :key="item.seriesId"
                  v-show="studyInfo.ifShow && item.hidden === false"
                  @click.stop.prevent="clickChangeSeries(item)"
                  @contextmenu.stop.prevent="changeMinSID(item)"
                  @dragstart.stop="drageStart($event, item)"
                  @dragend.stop="drageEnd"
                >
                  <div class="content">
                    <div class="row1">
                      <div class="modality" :class="item.modality">
                        {{ item.modality }}
                      </div>
                      <div class="sid">SID:{{ item.id }}</div>
                      <el-tooltip
                        v-if="item.isNotUniformSquence"
                        effect="light"
                        popper-class="warning-popper"
                        :content="$t('series.isNotUniform')"
                        placement="top"
                      >
                        <div class="warning"></div>
                      </el-tooltip>
                    </div>
                    <div class="row2 overflow-1" :title="item.description">
                      {{ item.description }}
                    </div>
                    <div class="row3">
                      <div class="thickness">
                        T:{{ item.thickness | fixedFormat }}
                      </div>
                      <div class="number">N:{{ item.imageNumber }}</div>
                    </div>
                    <div
                      v-show="false"
                      class="icon"
                      :class="[item.visible ? 'hidden-icon' : 'show-icon']"
                      @click.stop.prevent="troggleItemHidden(item)"
                    ></div>
                  </div>
                  <div class="cover" :data-sid="item.seriesId">
                    <div class="img">
                      <img
                        v-show="!thumbnailImages[item.seriesId]"
                        src=""
                        alt=""
                        @error="errorImgHandler"
                      />
                      <img
                        v-show="
                          thumbnailImages[item.seriesId] &&
                          thumbnailImages[item.seriesId] !== 'canvas'
                        "
                        :src="thumbnailImages[item.seriesId]"
                        alt=""
                      />
                      <canvas
                        v-show="
                          thumbnailImages[item.seriesId] &&
                          thumbnailImages[item.seriesId] === 'canvas'
                        "
                        class="thumbnail"
                      ></canvas>
                    </div>
                    <div
                      v-if="getDeleS(item.seriesId)"
                      class="close"
                      @click.stop="deleteImgStore(item.seriesId)"
                    ></div>
                    <div class="progress" v-if="imgPoor">
                      <div
                        :style="{ width: getWidth(item.seriesId) }"
                        :class="getStyle(item.seriesId)"
                      ></div>
                    </div>
                  </div>
                </div>
              </template>
            </ul>
          </div>
        </div>
      </div>
      <!-- </div> -->
    </div>
    <div
      id="seriesList"
      :class="`series-list-bottom series-bottom-${scaleRatio * 100}`"
      :style="{ height: seriesListShow ? '145px' : '30px' }"
      ref="seriesList"
      v-show="seriesListPos === 'BOTTOM'"
      @mousewheel.stop
      @DOMMouseScroll.stop
    >
      <div class="arrow" @click="handleArrow">
        <svg-icon v-show="seriesListShow" name="arrow-bottom"></svg-icon>
        <svg-icon v-show="!seriesListShow" name="arrow-top"></svg-icon>
      </div>
      <div class="header">
        <div
          class="study-list no-scrollbar"
          id="studyList"
          @mousewheel.stop="(e) => scrollByX(e, '#studyList')"
        >
          <div
            class="study-info"
            v-for="studyInfo of studyInfoList"
            :key="studyInfo.studyId"
            :class="{ 'study-active': activeStudy.includes(studyInfo.studyId) }"
            @click="triggerStudy(studyInfo.studyId)"
          >
            <img class="user" src="~@/assets/images/user.png" alt="" />
            <div class="patient-name overflow-1" :title="studyInfo.PatientName">
              {{ studyInfo.PatientName }}
            </div>
            <div class="study-date overflow-1">{{ studyInfo.StudyDate }}</div>
            <div class="patient-id overflow-1" :title="studyInfo.PatientID">
              {{ studyInfo.PatientID }}
            </div>
            <div class="icon-copy1" @click="copy(studyInfo.PatientID)"></div>
            <div class="series-num">
              {{ $t("series.seriesNum") }}{{ studyInfo.seriesNum }}
            </div>
            <div class="image-num">
              {{ $t("series.imageNum") }}{{ studyInfo.imageNum }}
            </div>
            <img
              v-show="false"
              class="close-study"
              src="~@/assets/images/close7.png"
              alt=""
            />
          </div>
        </div>
        <div class="search">
          <div class="input">
            <input
              type="text"
              v-model="searchWord"
              :placeholder="$t('series.keyword')"
            />
            <div class="suffix-icon icon-search"></div>
          </div>
        </div>
      </div>

      <!--  series list列表  -->
      <div
        class="container x-scrollbar"
        @mousewheel.stop="(e) => scrollByX(e, '.x-scrollbar')"
      >
        <div
          class="series-container"
          v-for="(sutdy, index) of LISTDATA"
          :key="index"
        >
          <div class="list" v-show="!sutdy.hidden">
            <div
              class="series"
              draggable="true"
              :class="{ selected: seriesListLiSelect(s) }"
              v-for="s of sutdy.data"
              :key="s.seriesId"
              v-show="s.hidden === false"
              @click.stop.prevent="clickChangeSeries(s)"
              @contextmenu.stop.prevent="changeMinSID(s)"
              @dragstart.stop="drageStart($event, s)"
              @dragend.stop="drageEnd"
              @mousedown.stop
            >
              <div class="cover" :data-sid="s.seriesId">
                <div class="img">
                  <img
                    v-show="!thumbnailImages[s.seriesId]"
                    src=""
                    alt=""
                    @error="errorImgHandler"
                  />
                  <img
                    v-show="
                      thumbnailImages[s.seriesId] &&
                      thumbnailImages[s.seriesId] !== 'canvas'
                    "
                    :src="thumbnailImages[s.seriesId]"
                    alt=""
                  />
                  <canvas
                    v-show="
                      thumbnailImages[s.seriesId] &&
                      thumbnailImages[s.seriesId] === 'canvas'
                    "
                    class="thumbnail"
                  ></canvas>
                </div>
                <div class="model-and-id">
                  <div :class="s.modality">{{ s.modality }}</div>
                  <div class="divide">|</div>
                  <div class="id overflow-1" :title="s.id">{{ s.id }}</div>
                </div>
                <div class="description-box">
                  <div class="description overflow-1" :title="s.description">
                    {{ s.description }}
                  </div>
                  <el-tooltip
                    v-if="s.isNotUniformSquence"
                    effect="light"
                    popper-class="warning-popper"
                    content="非均匀数据，不可进行三维重建"
                    placement="top"
                  >
                    <div class="warning"></div>
                  </el-tooltip>
                </div>
              </div>
              <div class="desc">
                <div class="thickness">{{ s.thickness | fixedFormat }}mm</div>
                <div class="image-num">{{ s.imageNumber }}</div>
              </div>

              <!--      进度条      -->
              <div
                class="progress"
                v-if="imgPoor"
                v-show="getWidth(s.seriesId) !== '100%'"
              >
                <div class="progress-bar">
                  <div
                    class="complete"
                    :style="{ width: getWidth(s.seriesId) }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../../../assets/api/index.js";
import { mapState } from "vuex";
import { formatSeriesList } from "../fetch/seriesdata.js";
import CIMG from "../js/cimg.js";
export default {
  name: "co-serieslist",
  // components: { mullist },
  props: {
    /*当前的sid 双向绑定*/
    seriesIdNow: { required: true },
    pagetype: { required: true },
    imgPoor: {},
    vertical: { required: false },
    mprSID: {},
    MinCurrentSID: {},
    mulList: {},
    canvasRange: {},
    currentSID: String,
    column: Number,
    currViewport: { required: true },
    loadSeriesID: String,
    seriesListPos: String,
  },
  data: function () {
    return {
      data: {},
      searchWord: "", //关键词
      LISTS: {},
      studyList: [],
      selectStudy: {},
      ifShowHiddenData: false,
      studyListShow: false,
      storageMax: 3000,
      activeStudy: [],
      seriesListShow: true,
      thumbList: {},
    };
  },

  mounted() {
    this.useDrag();
  },

  computed: {
    ...mapState(["studyInfos", "scaleRatio"]),

    thumbnailImages() {
      //遍历imgPoor
      for (let key in this.imgPoor) {
        let poorObj = this.imgPoor[key];
        let currentSID = poorObj.info.currentSID;
        if (!this.thumbList[currentSID]) {
          let thumbImage = CIMG.creatThumbailImage(poorObj);
          if (thumbImage) {
            this.thumbList[currentSID] = thumbImage;
          }
        }
      }
      return this.thumbList;
    },
    LISTDATA() {
      let { LISTS, selectStudy, searchWord, ifShowHiddenData } = this;
      let res = {};
      for (const studyID in LISTS) {
        const study = LISTS[studyID];
        const { PatientID, PatientName, StudyDate, ifShow } = study;
        res[studyID] = {
          ifShow,
          hidden: false,
          PatientID,
          PatientName,
          StudyDate,
          imageTotalNumber: 0,
          data: [],
        };

        for (const series of study.data) {
          if (searchWord === "") {
            series.hidden = false;
            res[studyID].data.push(series);
            continue;
          }

          if (
            series &&
            series.description.toLowerCase().includes(searchWord.toLowerCase())
          ) {
            series.hidden = false;
          } else {
            series.hidden = true;
          }
          res[studyID].data.push(series);
        }

        // 如果一个study的series都被过滤了，直接移除这个study
        if (res[studyID].data.every((item) => item.hidden)) {
          delete res[studyID];
          continue;
        }

        if (this.seriesListPos && !this.activeStudy.includes(studyID)) {
          res[studyID].hidden = true;
          continue;
        }

        res[studyID]["imageTotalNumber"] = study.data.reduce((curr, next) => {
          let num = curr;
          if (!next?.isFullSeries) {
            num += next.imageNumber;
          }
          return num;
        }, res[studyID]["imageTotalNumber"]);
      }
      return res;
    },
    studyInfoList() {
      const list = [];
      for (const studyId in this.LISTS) {
        const studyInfo = this.LISTS[studyId];
        let studyDate = studyInfo.StudyDate;
        if (studyDate.includes("年")) {
          studyDate = studyDate.replace("年", "/");
        }
        if (studyDate.includes("月")) {
          studyDate = studyDate.replace("月", "/");
        }
        if (studyDate.includes("日")) {
          studyDate = studyDate.replace("日", "");
        }
        const imageNum = studyInfo.data.reduce((curr, next) => {
          let num = curr;
          if (!next?.isFullSeries) {
            num += next.imageNumber;
          }
          return num;
        }, 0);
        list.push({
          studyId: studyId,
          PatientID: studyInfo.PatientID,
          PatientName: studyInfo.PatientName,
          StudyDate: studyDate,
          seriesNum: studyInfo.data.filter((v) => !v?.isFullSeries).length,
          imageNum,
        });
      }
      return list;
    },
    LENGTH() {
      let len = Object.keys(this.LISTDATA);
      return len.length;
    },
    curenStoreSize() {
      let sizeT = 0;
      for (let key in this.imgPoor) {
        let item = this.imgPoor[key];
        const volumeBuffer = item.volumeBuffer;
        if (!volumeBuffer) continue;
        sizeT += volumeBuffer.byteLength;
      }
      // console.log("当前占用内存:", sizeT / 1024 / 1024, "M"); // debug
      return sizeT / 1024 / 1024;
    },
  },
  methods: {
    getSeriesNum(data) {
      return data.filter((v) => !v?.isFullSeries).length;
    },
    handleArrow() {
      this.seriesListShow = !this.seriesListShow;
      this.$nextTick(() => {
        this.$emit("setCanvasRange");
      });
    },
    getStorageSize(addNum = 0) {
      let sizeT = this.curenStoreSize;
      console.log(`getStorageSize-storedSize:${sizeT}`);
      let addSize = (addNum * 512 * 512 * 4) / 1024 / 1024;
      sizeT = sizeT + addSize;
      console.log(`getStorageSize-withAddSize:${sizeT}`);
      return sizeT;
    },

    /**
     * 是否当前series被选中
     * @param item series
     * @return {boolean}
     */
    seriesListLiSelect(item) {
      const cvp = this.currViewport;
      if (!cvp.imageDatas[cvp.canvasNow]) return false;
      return item.seriesId === this.seriesIdNow;
    },

    /**
     * 当前study是否被选中
     * @param studyID
     * @return {*}
     */
    studySelected(studyID) {
      return false;
    },

    /**
     * 隐藏Series
     * @param item series
     */
    troggleItemHidden(item) {
      let visible = item.visible === 1 ? 0 : 1;
      let params = {
        _id: item.seriesId,
        show: visible,
      };
      api.show(params).then((res) => {
        if (res.code == 1) {
          item.visible = visible;
          this.LISTS = { ...this.LISTS };
        }
      });
    },

    clickChangeSeries(series) {
      const cvp = this.currViewport;
      const mixSID = cvp.mixSID;
      const sid = series.seriesId;
      this.$emit("changeSIDSync", sid);
    },

    triggerStudy(studyId) {
      if (this.activeStudy.includes(studyId)) {
        this.activeStudy = this.activeStudy.filter((item) => item !== studyId);
      } else {
        this.activeStudy.push(studyId);
      }
    },

    /**
     * 使用小窗口显示当前的series
     * @param series
     */
    changeMinSID(series) {
      let currentSID = series.seriesId;
      if (this.MinCurrentSID !== currentSID) {
        this.$emit("update:MinCurrentSID", currentSID);
      }
    },
    selectSeries(series) {
      let modality = series.modality;
      let mixSID = { ...this.mixSID };
      if (modality === "CT" || modality === "MR") {
        mixSID.ct = series.seriesId;
        mixSID.ctImageNumber = series.imageNumber;
        mixSID.ctModel = modality;
        mixSID.hasDone = false;
      } else if (modality === "PT" || modality === "NM" || modality === "OT") {
        mixSID.pt = series.seriesId;
        mixSID.ptImageNumber = series.imageNumber;
        mixSID.ptModel = modality;
        mixSID.hasDone = false;
      }
      this.$emit("clickMixSID", mixSID);
    },
    loadMix(item) {
      let {
        ct: { SeriesIndex: ct, model: ctModel, study_id: ctStudy_id },
        pt: { SeriesIndex: pt, model: ptModel, study_id: ptStudy_id },
      } = item;

      let mixSID = {
        ct,
        pt,
        ctModel,
        ptModel,
        hasDone: false,
      };
      this.loadMixFn(mixSID, ctStudy_id, ptStudy_id);
    },
    loadMixFn(mixSID, ctStudy_id, ptStudy_id) {
      let selectStudys = null;
      if (this.LISTS[ptStudy_id]) {
        selectStudys = this.studyList.filter((res) => res._id === ptStudy_id);
      } else if (this.LISTS[ctStudy_id]) {
        selectStudys = this.studyList.filter((res) => res._id === ctStudy_id);
      }
      if (selectStudys && selectStudys.length)
        this.selectStudy = selectStudys[0];
      this.$emit("update:mixSID", mixSID);
    },
    getWidth(id) {
      try {
        let { done, num } = this.imgPoor[id];
        return (done * 100) / num + "%";
      } catch (e) {
        return "0%";
      }
    },
    getStyle(id) {
      //这个函数本来用来标记是否加载的本地数据，本版本暂时废弃。ssy:20240328
      let res = {};
      try {
        res.png = true;
      } catch (e) {
        console.log(e);
      }
      return res;
    },
    deleteImgStore(id) {
      const exist = this.getDeleS(id);
      if (!exist) return;

      let imgPoor = { ...this.imgPoor };
      let item = imgPoor[id];
      //清空存储
      if (item) {
        let { data } = imgPoor[id];

        // 清空imgPoor.data
        for (let i = 0; i < data.length; i++) {
          let arrC = data[i];
          for (let j = 0; j < arrC.length; j++) {
            if (arrC[j]) {
              if (arrC[j].data && !(arrC[j] instanceof ImageData)) {
                arrC[j].data = null;
              }
              arrC[j] = null;
            }
          }
        }

        // 如果是16bit连续片段还需要删除volumebuffer...
        const seriesInfo = item.info;
        if (!seriesInfo.isNotUniformSquence) {
          item.volumeBuffer = null;
          item.volumeImageData = null;
        }

        item.imageDone = false;
        item.done = 0;
      }
      this.$emit("update:imgPoor", imgPoor);
    },
    getDeleS(id) {
      return false; // 暂时不允许删除image缓存
      // let flag = false;
      // if (this.imgPoor[id]) {
      //   if (this.imgPoor[id]["done"]) {
      //     flag = true;
      //   }
      //   if (this.MinCurrentSID && id == this.MinCurrentSID) {
      //     flag = false;
      //   }
      //   if (this.seriesIdNow && id == this.seriesIdNow) {
      //     flag = false;
      //   }
      //   if (this.mixSID) {
      //     if (this.mixSID.pt && id == this.mixSID.pt) {
      //       flag = false;
      //     }
      //     if (this.mixSID.ct && id == this.mixSID.ct) {
      //       flag = false;
      //     }
      //   }
      // }
      // return flag;
    },
    getStudyId(series_id) {
      let res = null;
      for (let key in this.LISTS) {
        let series = this.LISTS[key]["data"];
        for (let item of series) {
          let { studyId, seriesId } = item;
          if (series_id === seriesId) {
            res = studyId;
            break;
          }
        }
      }
      return res;
    },

    isStudySelected(studyID) {
      const mixSID = this.mixSID;
      if (mixSID && mixSID.hasDone) {
        return this.LISTS[studyID]["data"].some(
          (item) => mixSID.ct === item.seriesId || mixSID.pt === item.seriesId,
        );
      } else {
        return this.LISTS[studyID]["data"].some(
          (item) => item.seriesId === this.seriesIdNow,
        );
      }
    },

    /**
     * 隐藏Study
     * @param studyID
     * @param isShow 为true显示
     */
    showStudy(studyID, isShow) {
      this.LISTS[studyID]["ifShow"] = isShow;
      this.LISTS = { ...this.LISTS };
    },

    /**
     * series列表模式，1：正常的宽模式，2：窄模式
     */
    tabHandler() {
      if (this.column === 1) {
        this.$emit("update:column", 2);
      } else {
        this.$emit("update:column", 1);
      }
      this.useDrag();
    },

    /**
     * 判断当前series是否是viewport中的融合之一，或已选择融合之一
     * @param item series
     * @return {*|boolean}
     */
    isMixSelect(item) {
      const cvp = this.currViewport;
      if (!cvp.imageDatas[cvp.canvasNow]) return false;
      const { canvasNow, imageDatas, currentSID } = cvp;
      const mixSID = this.mixSID;
      return mixSID.ct === item.seriesId || mixSID.pt === item.seriesId;
    },

    /**
     * 复制文本
     * @param text
     */
    async copy(text) {
      this.$layer("复制成功");
      const res = await navigator.permissions.query({
        name: "clipboard-write",
      });
      if (res.state === "granted") {
        return await navigator.clipboard.writeText(text);
      } else {
        const el = document.createElement("textarea");
        el.value = text;
        el.setAttribute("readonly", "");
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        return Promise.resolve(true);
      }
    },

    /**
     * 根据环境启用拖拽功能
     */
    useDrag() {
      this.$nextTick(() => {
        document.onmousemove = null;
        document.onmouseup = null;
        const el = document.querySelector("#seriesList");
        el.onmousedown = null;
        if (this.seriesListPos === "BOTTOM") {
          el.style.left = 0;
          el.style.bottom = 0;
          return;
        }
        if (!this.vertical) {
          el.style.left = 0;
          el.style.top = "52px";
          return;
        }
        el.style.top = "104px";
        this.$follow_mouse("seriesList");
      });
    },

    drageStart(event, series) {
      event.target.classList.add("dragging");
      event.dataTransfer.setData("series", JSON.stringify(series));
    },

    drageEnd(event) {
      event.target.classList.remove("dragging");
    },

    errorImgHandler(evt) {
      evt.target.src = require("@/assets/images/mask.png");
    },
    scrollByX(e, domStr) {
      this.$nextTick(() => {
        let eventDelta = -e.wheelDelta || -e.deltaY * 40;
        let scrollDiv = document.querySelector(domStr);
        scrollDiv.scrollLeft = scrollDiv.scrollLeft + eventDelta / 2;
      });
    },
  },

  filters: {
    fixedFormat(thickness) {
      if (!thickness) return "--";
      return Number(thickness).toFixed(2);
    },
    studyDateFormat(time) {
      if (time.includes("年")) {
        time = time.replace("年", "/");
      }
      if (time.includes("月")) {
        time = time.replace("月", "/");
      }
      if (time.includes("日")) {
        time = time.replace("日", "");
      }
      return time;
    },
  },

  watch: {
    studyInfos(val) {
      //取第一个series的studyInfo，此处写的比较绕，建议重构
      const keys = [];
      // 初始的study，不是后面追加的study，始终放在第一个
      for (let key in val) {
        if (val[key].isOrigin) {
          keys.unshift(key);
        } else {
          keys.push(key);
        }
      }
      const list = {};
      keys.forEach((key) => {
        const study = val[key];
        const seriesList = formatSeriesList(study.series, study);
        const res = {
          PatientID: study.PatientID || study.patient.id,
          PatientName: study.PatientName || study.patient.name,
          StudyDate: study.date || study.StudyDate,
          data: seriesList,
          ifShow: true,
        };
        res.StudyDate = this.$moment(res.StudyDate).format("YYYY年MM月DD日");
        // 避免list自动按照id排序
        if (!this.LISTS[study.id + "x"]) {
          //避免追加查看时，清除掉新增/拆分的序列
          list[study.id + "x"] = res;
        }
        this.activeStudy.push(val[key].id + "x");
      });
      this.LISTS = { ...this.LISTS, ...list };
    },

    vertical(newest) {
      this.useDrag();
    },
    seriesListPos() {
      this.useDrag();
    },
    LISTDATA: {
      handler() {
        this.$commen.$emit("updateList", this.LISTDATA);
        this.$emit("seriesList", this.LISTDATA);
      },
      deep: true,
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./co-serieslist.scss";
</style>
