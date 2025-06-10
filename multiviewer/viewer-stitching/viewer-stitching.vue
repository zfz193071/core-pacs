<template>
  <div id="stitching" @mousewheel.stop>
    <div class="box" id="moveDom" :style="domStyle">
      <div class="head">
        <span>{{ $t("stitching.title") }}</span>
        <span @click.stop="back"></span>
      </div>
      <div class="content" @mousedown.stop>
        <div class="content-operation" :class="{ light: theme === 'light' }">
          <span class="content-operation-title">{{
            $t("stitching.operation")
          }}</span>
          <div class="content-operation-left">
            <!-- 方向 -->
            <div class="item">
              <span class="item-title">{{ $t("stitching.direction") }}</span>
              <div class="direction">
                <el-radio-group
                  v-model="params.direction"
                  @change="resizeFlag++"
                >
                  <el-radio label="vertical">{{
                    $t("stitching.vertical")
                  }}</el-radio>
                  <br />
                  <el-radio label="horizontal">{{
                    $t("stitching.horizontal")
                  }}</el-radio>
                </el-radio-group>
              </div>
            </div>
            <!-- 旋转 -->
            <div class="item">
              <span class="item-title">{{ $t("stitching.rotate") }}</span>
              <div class="rotate">
                <div class="rotate-input">
                  <span
                    >{{ $t("stitching.step")
                    }}{{ $t("stitching.angle") }}：</span
                  >
                  <input type="number" v-model="params.rotate" />
                </div>
                <div class="rotate-operate">
                  <div
                    class="rotate-operate-left"
                    @click="handleRotate('left')"
                  >
                    <div class="icon"></div>
                  </div>
                  <div
                    class="rotate-operate-right"
                    @click="handleRotate('right')"
                  >
                    <div class="icon"></div>
                  </div>
                </div>
              </div>
            </div>
            <!-- 缩放 -->
            <div class="item">
              <span class="item-title">{{ $t("stitching.scale") }}</span>
              <div class="scale">
                <div class="scale-input">
                  <span>{{ $t("stitching.scale") }}(%)：</span>
                  <input type="number" v-model="params.scale" />
                </div>
                <div class="scale-operate">
                  <div class="scale-operate-left" @click="handleZoom('in')">
                    <div class="icon"></div>
                  </div>
                  <div class="scale-operate-right" @click="handleZoom('out')">
                    <div class="icon"></div>
                  </div>
                </div>
              </div>
            </div>
            <!-- 平移 -->
            <div class="item">
              <span class="item-title">{{ $t("stitching.translate") }}</span>
              <div class="translate">
                <div class="translate-input">
                  <span>{{ $t("stitching.translate") }}(px)：</span>
                  <input type="number" v-model="params.translate" />
                </div>
                <div class="translate-operate-first">
                  <div
                    class="translate-operate-first-center"
                    @click="handleTranslate('top')"
                  >
                    <div class="icon"></div>
                  </div>
                </div>
                <div class="translate-operate-second">
                  <div
                    class="translate-operate-second-left"
                    @click="handleTranslate('left')"
                  >
                    <div class="icon"></div>
                  </div>
                  <div
                    class="translate-operate-second-center"
                    @click="handleTranslate('bottom')"
                  >
                    <div class="icon"></div>
                  </div>
                  <div
                    class="translate-operate-second-right"
                    @click="handleTranslate('right')"
                  >
                    <div class="icon"></div>
                  </div>
                </div>
              </div>
            </div>
            <!-- 融合 -->
            <div class="item">
              <span class="item-title">{{ $t("stitching.merge") }}</span>
              <div class="merge">
                <el-radio-group v-model="params.merge" @change="handleFlag++">
                  <el-radio label="progressive">{{
                    $t("stitching.progressive")
                  }}</el-radio>
                  <el-radio label="average">{{
                    $t("stitching.average")
                  }}</el-radio>
                  <br />
                  <el-radio label="max">{{ $t("stitching.max") }}</el-radio>
                  <el-radio label="min">{{ $t("stitching.min") }}</el-radio>
                </el-radio-group>
              </div>
            </div>
          </div>
          <div class="content-operation-right">
            <div class="btn" @click="handleUse">{{ $t("stitching.use") }}</div>
            <div class="btn" @click="handleReset">
              {{ $t("stitching.reset") }}
            </div>
          </div>
        </div>
        <div
          class="content-render"
          :class="{ horizontal: params.direction === 'horizontal' }"
        >
          <div class="stitching">
            <draggable
              class="draggable"
              v-model="list"
              animation="500"
              @end="resizeFlag++"
            >
              <transition-group class="draggable-transition">
                <div
                  class="stitching-item"
                  :class="{ picked: pickedId === item.stitchingId }"
                  @click="
                    pickedId = item.stitchingId;
                    handleFlag++;
                  "
                  v-for="item in list"
                  :key="item.stitchingId"
                >
                  <el-checkbox
                    v-if="pickedId === item.stitchingId"
                    :value="true"
                  ></el-checkbox>
                  <stitching-render
                    :imageData.sync="item.imageData"
                    :seriesInfo="item.seriesInfo"
                    :resizeFlag="resizeFlag"
                    :params="item.params"
                  ></stitching-render>
                </div>
              </transition-group>
            </draggable>
          </div>
          <div class="result">
            <result-render
              ref="resultRender"
              :resizeFlag="resizeFlag"
              :handleFlag="handleFlag"
              :mergeType="params.merge"
              :regPara="regPara"
              @setNewDataWithInfo="setNewDataWithInfo"
              :pickedId="pickedId"
              @setNewImageData="setNewImageData"
            ></result-render>
          </div>
        </div>
      </div>
      <div class="box-scale" @mousedown.stop="scaleFn"></div>
    </div>
  </div>
</template>

<script>
import domFn from "./js/domFn";
import { mapState, mapMutations } from "vuex";
import stitchingRender from "./stitchingRender.vue";
import resultRender from "./resultRender.vue";
import draggable from "vuedraggable";
import seriesApi from "@/assets/api/series";
import moment from "moment";
import { createImgPoor, formatSeriesList } from "../fetch/seriesdata";
import { DataHandler } from "../js/dataToSeries";
import AUTOREG from "../viewer-registration/autoReg";
export default {
  components: { stitchingRender, resultRender, draggable },
  props: {
    imageStitchingShow: { type: Boolean, required: true },
  },
  data() {
    return {
      style: {
        width: 830,
        height: 872,
        left: (window.innerWidth - 830) / 2,
        top: (window.innerHeight - 872) / 2,
      },
      resizeFlag: 0, //弹窗缩放
      moveFlag: 0, //弹窗拖拽
      handleFlag: 0, //拼接操作
      params: {
        direction: "vertical",
        rotate: 1,
        scale: 1,
        translate: 1,
        merge: "progressive",
      },
      pickedId: "",
      newImageData: null,
      regPara: [],
    };
  },
  computed: {
    ...mapState(["theme", "studyInfos", "imageStitchingList", "imgPoor"]),
    studyKey() {
      const studyInfos = this.studyInfos;
      const keys = Object.keys(studyInfos);
      if (keys.length > 1) {
        keys.sort((a, b) => {
          return moment(studyInfos[a].date).isAfter(moment(studyInfos[b].date))
            ? -1
            : 1;
        });
      }
      let studyKey = keys[0];
      return studyKey;
    },
    domStyle() {
      const { width, height, top, left } = this.style;
      let res = {
        width: width + "px",
        height: height + "px",
        top: top + "px",
        left: left + "px",
      };
      return res;
    },
    list: {
      get() {
        return this.imageStitchingList;
      },
      set(val) {
        this.setImageStitching(val);
      },
    },
  },
  watch: {
    // 把弹窗的样式存到localStorage
    resizeFlag() {
      this.setRegPara();
      this.setDialogStyle();
    },
    moveFlag() {
      this.setDialogStyle();
    },
    // 把操作的参数存到localStorage
    params: {
      handler() {
        this.setParams();
      },
      deep: true,
    },
    style: {
      handler(val) {
        if (val.top < 0) val.top = 0;
        if (val.left < 0) val.left = 0;
      },
      deep: true,
    },
  },
  created() {
    this.getParams();
    this.getDialogStyle();
    this.pickedId = this.list[0].stitchingId;
  },
  mounted() {
    domFn.followMouse(this, "moveDom");
    this.pickedId = this.list[0].stitchingId;
    this.$nextTick(() => {
      this.setRegPara();
    });
  },
  methods: {
    ...mapMutations(["setImageStitching", "setImgPoor"]),
    // 返回
    back() {
      this.$emit("update:imageStitchingShow", false);
    },
    // 弹窗缩放
    scaleFn(e) {
      const moveDom = document.getElementById("moveDom");
      domFn.scaleFn(this, moveDom, e);
    },
    setRegPara() {
      console.log("setRegPara");
      this.regPara = [];
      for (let i = 0; i < this.list.length; i++) {
        this.regPara[i] = 0;
        if (i > 0) {
          let ele0 = this.list[i - 1]?.imageData?.dataWithInfo?.origBuf;
          let ele1 = this.list[i]?.imageData?.dataWithInfo?.origBuf;
          if (ele0 && ele1) {
            this.regPara[i] =
              this.regPara[i - 1] + ele0.height / 2 + ele1.height / 2;
            let regTrans = AUTOREG.regY(ele0, ele1);
            if (regTrans) this.regPara[i] += regTrans;
          }
        }
      }
    },
    // 旋转
    handleRotate(direction) {
      if (!this.pickedId) return;
      const index = this.list.findIndex((v) => v.stitchingId === this.pickedId);
      const rotate =
        direction === "left" ? -this.params.rotate : this.params.rotate;
      this.list[index].params.rotate += Number(rotate);
      this.list[index].params.rotate %= 360;
      this.handleFlag++;
    },
    // 缩放
    handleZoom(type) {
      if (!this.pickedId) return;
      const index = this.list.findIndex((v) => v.stitchingId === this.pickedId);
      const scale = Number(this.params.scale) / 100;
      if (type === "in") {
        this.list[index].params.scale -= this.list[index].params.scale * scale;
      } else {
        this.list[index].params.scale += this.list[index].params.scale * scale;
      }
      this.handleFlag++;
    },
    // 平移
    handleTranslate(direction) {
      if (!this.pickedId) return;
      const index = this.list.findIndex((v) => v.stitchingId === this.pickedId);
      switch (direction) {
        case "top":
          this.list[index].params.translate.y -= Number(this.params.translate);
          break;
        case "left":
          this.list[index].params.translate.x -= Number(this.params.translate);
          break;
        case "bottom":
          this.list[index].params.translate.y += Number(this.params.translate);
          break;
        case "right":
          this.list[index].params.translate.x += Number(this.params.translate);
          break;
      }
      this.handleFlag++;
    },
    getDialogStyle() {
      const style = localStorage.getItem("stitchingStyle");
      if (style) {
        this.style = JSON.parse(style);
      }
    },
    setDialogStyle() {
      const box = document.getElementById("moveDom");
      const top = Number(window.getComputedStyle(box).top.slice(0, -2));
      const left = Number(window.getComputedStyle(box).left.slice(0, -2));
      localStorage.setItem(
        "stitchingStyle",
        JSON.stringify({ ...this.style, ...{ top, left } }),
      );
    },
    getParams() {
      const params = localStorage.getItem("stitchingParams");
      if (params) {
        this.params = JSON.parse(params);
      }
    },
    setParams() {
      localStorage.setItem("stitchingParams", JSON.stringify(this.params));
    },
    setNewImageData(val) {
      this.newImageData = val;
    },
    // 将拼接后的图像转为序列
    handleUse() {
      this.$loading();
      setTimeout(async () => {
        const newDataWithInfo =
          this.$refs.resultRender.getFusionResult("original");
        const firstInstance = this.list[0].seriesInfo.instances[0];
        const buffer = Buffer.from(
          newDataWithInfo.origBuf.data.buffer,
        ).toString("base64");
        const params = {
          studyId: this.studyKey,
          base64: buffer,
          sliceThickness: 1,
          spacingBetweenSlices: 1,
          pixelSpacing: [
            newDataWithInfo.pixelSpacingW.toString(),
            newDataWithInfo.pixelSpacingH.toString(),
          ],
          columns: newDataWithInfo.width,
          rows: newDataWithInfo.height,
          windowWidth: this.newImageData.ww,
          windowCenter: this.newImageData.wl,
          rescaleType: "",
          rescaleSlope: 1,
          rescaleIntercept: 0,
          imagePosition: [0, 0, 0],
          ImagePositionPatient: firstInstance.ImagePositionPatient,
          imageOrientation: [1, 0, 0, 0, 1, 0],
          imageOrientationPatient: firstInstance.ImageOrientationPatient,
          sliceLocation: 1,
          bitsAllocated: 16,
          bitsStored: 16,
          highBit: 15,
          PixelRepresentation: null,
        };
        const res = await seriesApi.stitchingImageToSeries(params);
        if (res.code === 200) {
          const studyInfos = this.studyInfos[this.studyKey];
          const info = {
            accessionNumber: studyInfos.accessionNumber,
            date: studyInfos.date,
            description: studyInfos.description,
            deviceModel: studyInfos.deviceModel,
            id: studyInfos.id,
            patient: studyInfos.patient,
            pipeline: studyInfos.pipeline,
            series: [res.data],
            seriesId: studyInfos.seriesId,
            sid: studyInfos.sid,
            stationName: studyInfos.stationName,
            time: studyInfos.time,
            uid: studyInfos.uid,
          };
          const data = DataHandler(info, info.uid, true);
          const newData = formatSeriesList([res.data], studyInfos);
          const lists = this.$parent.$refs.serieslist.LISTS;
          lists[this.studyKey + "x"].data.push(newData[0]);
          this.$set(lists, this.studyKey + "x", lists[this.studyKey + "x"]);
          const imgPoor = this.imgPoor;
          const tasks = data.map((item) => {
            return new Promise((resolve) => {
              const { seriesInfo } = item;
              createImgPoor(seriesInfo).then((result) => {
                imgPoor[seriesInfo.SeriesIndex] = result;
                this.setImgPoor(imgPoor);
                resolve();
              });
            });
          });
          await Promise.all(tasks);
          this.$emit("forceLoadImg", 0, {});
          this.$loading(false);
        } else {
          if (res.code === 401) {
            this.$layer("无权限，操作失败", undefined, "warn");
          } else if (res.code === 2002) {
            this.$layer("登录已过期", undefined, "warn");
          } else {
            this.$layer("系统异常", undefined, "warn");
          }
          this.$loading(false);
        }
      }, 50);
    },
    // 重置
    handleReset() {
      this.list.forEach((v) => {
        v.params = {
          rotate: 0,
          scale: 1,
          translate: {
            x: 0,
            y: 0,
          },
        };
      });
      this.handleFlag++;
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./viewer-stitching.scss";
</style>
