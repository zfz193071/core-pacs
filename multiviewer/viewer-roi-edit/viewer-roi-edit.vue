<template>
  <!-- 标注工具pop -->
  <!-- <transition name="fade"> -->
  <div id="roiEditWindow" class="moveCursorParent" ref="roiEditWindow">
    <div class="boxTitle">
      <div id="roiEditWindowVLine" class="moveCursor"></div>
      <a id="roiEditWindowClose" @click.stop.prevent="roiEditBoxClose"></a>
    </div>
    <div class="boxContent">
      <a
        :class="[
          'LlefttoolbarItemcl',
          activeOpt == 'Pen' ? 'iPenButtonSelect' : 'iPenButton',
        ]"
        title="智能画笔，快捷键：T"
        @click.stop.prevent="Ipen"
      ></a>
      <a
        :class="[
          'LlefttoolbarItemcl',
          activeOpt == 'Circle' ? 'iCircleSelect' : 'iCircle',
        ]"
        title="圆形，快捷键：W"
        @click.stop.prevent="Icircle"
      ></a>
      <a
        :class="[
          'LlefttoolbarItemcl',
          activeOpt == 'Rect' ? 'iRectSelect' : 'iRect',
        ]"
        title="矩形，快捷键：Q"
        @click.stop.prevent="Irect"
      ></a>
      <a
        :class="[
          'LlefttoolbarItemcl',
          activeOpt == 'CurveLine' ? 'CurveLineSelect' : 'CurveLine',
        ]"
        title="曲线"
        @click.stop.prevent="LcurveLine"
      ></a>
      <a
        :class="[
          'LlefttoolbarItemcl',
          activeOpt == 'Arrow' ? 'ArrowSelect' : 'Arrow',
        ]"
        title="箭头"
        @click.stop.prevent="LArrow"
      ></a>
      <a
        :class="[
          'LlefttoolbarItemcl',
          activeOpt == 'Angle' ? 'AngleSelect' : 'Angle',
        ]"
        title="角度测量"
        @click.stop.prevent="Langel"
      ></a>
      <a
        :class="[
          'LlefttoolbarItemcl',
          activeOpt == 'Ruler' ? 'RulerSelect' : 'Ruler',
        ]"
        title="长度测量，快捷键：E"
        @click.stop.prevent="LRuler"
      ></a>
      <a
        :class="[
          'LlefttoolbarItemcl',
          activeOpt == 'Text' ? 'TextSelect' : 'Text',
        ]"
        title="文本"
        @click.stop.prevent="Ltext"
      ></a>
      <a
        :class="[
          'LlefttoolbarItemcl',
          activeOpt == 'Point' ? 'PointSelect' : 'Point',
        ]"
        title="像素值"
        @click.stop.prevent="LPoint"
      ></a>
      <a
        :class="[
          'LlefttoolbarItemcl',
          activeOpt == 'Rubber' ? 'RubberSelect' : 'Rubber',
        ]"
        title="橡皮檫"
        @click.stop.prevent="LRubber"
      ></a>
      <a
        :class="['LlefttoolbarItemcl', 'VOITool']"
        title="计算MTV"
        @click.stop.prevent="VOITool"
      ></a>
      <a
        class="LlefttoolbarItemcl setParam"
        title="设置SUV值计算参数"
        @click.stop.prevent="setParam"
      ></a>
      <div class="setColor" title="标注颜色">
        <p :style="{ background: rayplus_color }"></p>
        <ul>
          <li
            v-for="item in colors"
            :key="item"
            @click.stop.prevent="setColor(item)"
          >
            <p :style="{ background: item }"></p>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <!-- </transition> -->
</template>

<script>
export default {
  name: "viewer-roi-edit",
  data: function () {
    return {
      colors: ["#0c00ff", "#08f5b1", "#02eee6", "#AB2526", "#DE6D00"],
    };
  },
  props: {
    activeOpt: { type: String, required: true },
    roiEditBoxShow: { type: Boolean, required: true },
    canvasRange: { type: Object, required: true },
    clickOpt: { required: true },
    rayplus_color: {},
  },
  mounted() {
    this.$follow_mouse("roiEditWindow");
  },
  methods: {
    setColor(item) {
      this.$emit("update:rayplus_color", item);
      localStorage.rayplus_color = item;
    },
    Ipen() {
      this.$emit("update:activeOpt", "Pen");
    },
    Icircle() {
      this.$emit("update:activeOpt", "Circle");
    },
    Irect() {
      this.$emit("update:activeOpt", "Rect");
    },
    LcurveLine() {
      this.$emit("update:activeOpt", "CurveLine");
    },
    LArrow() {
      this.$emit("update:activeOpt", "Arrow");
    },
    Langel() {
      this.$emit("update:activeOpt", "Angle");
    },
    LRuler() {
      this.$emit("update:activeOpt", "Ruler");
    },
    Ltext() {
      this.$emit("update:activeOpt", "Text");
    },
    LRubber() {
      this.$emit("update:activeOpt", "Rubber");
    },
    VOITool() {
      this.$emit("update:clickOpt", "VOITool");
    },
    LPoint() {
      this.$emit("update:activeOpt", "Point");
    },
    roiEditBoxClose() {
      this.$emit("update:roiEditBoxShow", false);
    },
    setParam() {
      this.$emit("update:clickOpt", "setParam");
    },
  },
  watch: {
    roiEditBoxShow: function (newValue, oldValue) {
      if (newValue) {
        this.$refs.roiEditWindow.style.top = 290 + "px";
        this.$refs.roiEditWindow.style.left =
          this.canvasRange.RBLeftWidth + "px";
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./viewer-roi-edit.scss";
</style>