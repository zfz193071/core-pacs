<template>
  <div class="mprBox" v-show="showDialog">
    <div class="mprLayer" :class="{ done: loadingInfo.done }">
      <div class="title">
        <div class="title_icon"></div>
        {{
          loadingInfo.done
            ? $t("dialog.imageLoad.done")
            : $t("dialog.imageLoad.loading")
        }}
        <div class="close" @click.stop="$emit('closeDialog')"></div>
      </div>
      <div class="content">
        <el-progress
          :percentage="loadingInfo.percent"
          :show-text="false"
          :stroke-width="9"
          :class="{ success: loadingInfo.percent === 100 }"
        ></el-progress>
        <div class="progress-info">
          <div class="precent">{{ loadingInfo.percent }}%</div>
          <div class="total">
            {{ $t("dialog.imageLoad.total") }}：{{ loadingInfo.total }}
          </div>
        </div>
        <p>
          {{
            loadingInfo.percent === 100
              ? $t("dialog.imageLoad.doneText")
              : $t("dialog.imageLoad.loadingText")
          }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "LoadingDialog",
  props: {
    showDialog: {
      type: Boolean,
      default: false,
    },
    loadingInfo: {
      type: Object,
      default: () => ({}),
    },
  },
};
</script>

<style lang="scss" scoped>
@import "~@/assets/css/common";
.mprBox {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: $popZIndex;

  .mprLayer {
    width: 391px;
    height: 152px;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 0 9px 0 rgba(0, 0, 0, 0.12);
    box-sizing: border-box;
    padding: 20px 20px 20px 28px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    overflow: hidden;
    font-size: 14px;
    &.done {
      .title {
        color: #44d7b6;
        .title_icon {
          background-image: url(~@/assets/images/done.png);
        }
      }
    }

    .title {
      position: relative;
      padding-left: 40px;
      line-height: 30px;
      color: #3b8be4;

      // before
      .title_icon {
        position: absolute;
        left: 0;
        top: 0;
        width: 30px;
        height: 30px;
        background-size: contain;
        background-repeat: no-repeat;
        background-image: url(~@/assets/images/loading.png);
      }

      // after
      .close {
        cursor: pointer;
        position: absolute;
        right: 0;
        top: 10px;
        width: 10px;
        height: 10px;
        background-size: contain;
        background-repeat: no-repeat;
        background-image: url(~@/assets/images/close4.png);
      }
    }

    .content {
      display: flex;
      flex-direction: column;
      justify-content: center;
      color: #6c6966;

      .el-progress {
        margin-top: 16px;
      }
      ::v-deep {
        .el-progress.success {
          .el-progress-bar .el-progress-bar__inner {
            background-color: #44d7b6;
          }
        }
      }
      .progress-info {
        margin-top: 5px;
        display: flex;
        flex-wrap: nowrap;
        justify-content: space-between;
      }
      p {
        margin-top: 13px;
      }
    }
  }

  .shdow {
    position: absolute;
    // background-color: #000;
    overflow: hidden;
    box-sizing: border-box;
    border: 2px solid #1e252f;
  }
}
</style>
