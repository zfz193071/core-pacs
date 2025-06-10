<template>
  <div class="layerBox" v-show="showWarning">
    <div class="layers" :class="{ shareCode: warningType === 'shareCode' }">
      <div class="layers_title" v-if="showTitle">{{ $t("tip") }}</div>
      <div class="layers_content" v-if="showContent">
        <svg-icon class="icon-warn" v-if="showIcon" name="tip-warning" />
        <p>{{ $t(`dialog.${warningType}`) }}</p>
      </div>
      <div class="layers-slot">
        <slot></slot>
      </div>
      <div class="layers_btn">
        <div class="btns">
          <p class="cancel" v-if="showCancel" @click.stop="back">
            {{ $t("cancel") }}
          </p>
          <p class="confirm" @click.stop="$emit('confirm')">
            {{ confirmText || $t("confirm") }}
          </p>
        </div>
      </div>
    </div>
    <!-- <div class="layers" v-if="warning.reformationFail">
      <div class="layers_title">提示</div>
      <div class="layers_content">
        <p>{{ LANG.reformationFail[LANG.index] }}</p>
      </div>
      <div class="layers_btn">
        <span></span>
        <div class="btns">
          <span></span>
          <p @click.stop="$emit('confirm')">
            {{ LANG.ok[LANG.index] }}
          </p>
        </div>
      </div>
    </div>
    <div class="layers" v-if="warning.spacing">
      <div class="layers_title">提示</div>
      <div class="layers_content">
        <p>{{ LANG.msgBreak[LANG.index] }}</p>
      </div>
      <div class="layers_btn">
        <div>
          <input type="checkbox" v-model="warning.checked" />
          {{ LANG.noMore[LANG.index] }}
        </div>
        <div class="btns">
          <p @click.stop="contin">{{ LANG.continue[LANG.index] }}</p>
          <p @click.stop="back">{{ LANG.cancel[LANG.index] }}</p>
        </div>
      </div>
    </div>
    <div class="layers" v-if="warning.deleRoi">
      <div class="layers_title"></div>
      <div class="layers_content">
        <p>{{ LANG.delMark[LANG.index] }}</p>
      </div>
      <div class="layers_btn">
        <div class="btns deleBtns">
          <p @click.stop="deleteContin">{{ LANG.ok[LANG.index] }}</p>
          <p @click.stop="warning.deleRoi = false">
            {{ LANG.cancel[LANG.index] }}
          </p>
        </div>
      </div>
    </div> -->
  </div>
</template>

<script>
export default {
  name: "viewer-layer",
  props: {
    showTitle: { type: Boolean, required: true },
    showWarning: { type: Boolean, required: true },
    warningType: String,
    confirmText: String,
    showIcon: Boolean,
    showCancel: Boolean,
  },
  computed: {
    showContent() {
      return this.warningType !== "shareCode";
    },
  },
  methods: {
    back() {
      this.$emit("update:showWarning", false);
      // let obj = {
      //   spacing: false,
      //   quantity: false,
      //   fun: null,
      //   checked: false,
      //   deleRoi: false,
      // };
      // this.$emit("update:warning", obj);
      // this.$emit("update:activeOpt", "Pan");
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./viewer-layer.scss";
</style>
