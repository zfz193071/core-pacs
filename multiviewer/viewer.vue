<template>
  <div id="viewer" ref="viewer">
    <!-- 工具层 -->
    <viewer-toolbar
      ref="toolbar"
      :viewportID="viewportID"
      :dicomTempShow.sync="dicomTempShow"
      :suvShow.sync="suvShow"
      :activeOpt.sync="activeOpt"
      :clickOpt.sync="clickOpt"
      :currViewport="currViewport"
      :canvasRange.sync="canvasRange"
      :imageData="
        currViewport.imageDatas &&
        currViewport.imageDatas.length >= 1 &&
        currViewport.imageDatas[currViewport.canvasNow]
      "
      :WindowLevelSetData="WindowLevelSetData"
      :canvasNow="currViewport.canvasNow"
      :imgPoor="imgPoor"
      :vertical="vertical"
      :roiShow.sync="roiShow"
      :posLineShow.sync="posLineShow"
      :isInCPR="isInCPR"
      :isInVR="isInVR"
      :isInMPR.sync="isInMPR"
      :isAutoLinkout="isAutoLinkout"
      :isManualLinkout="isManualLinkout"
      :seriesInfo="imageDataNow.series"
      :square.sync="square"
      :gridNum.sync="currViewport.gridNum"
      :layoutNum.sync="layoutNum"
      :isCatchShow.sync="isCatchShow"
      :ifMPRScaleSync.sync="ifMPRScaleSync"
      :hasAIAnalysis="hasAIAnalysis"
      :aiShow="aiShow"
      :rayplus_color.sync="rayplus_color"
      :rayplus_fontSize.sync="rayplus_fontSize"
      :shortcutsKey="shortcutsKey"
      :imgPoorPrecent="imgPoorPrecent"
      :viewportList="viewportList"
      @getStudyId="getStudyId"
      @gridNumReset="changeCurrGridNum"
      @changeSquare="changeSquare"
      @handleSeries="handleSeries"
      @handleShare="handleShare"
      @updateImageList="updateImageList"
    ></viewer-toolbar>

    <!-- 列表层 -->
    <co-serieslist
      :seriesListPos.sync="seriesListPos"
      :currentSID="currViewport.currentSID"
      :seriesIdNow.sync="currViewport.currentSID"
      :pagetype="pagetype"
      :imgPoor.sync="imgPoor"
      :vertical="vertical"
      :mprSID.sync="mprSID"
      :MinCurrentSID.sync="minViewport.currentSID"
      :canvasRange="canvasRange"
      :column.sync="column"
      :currViewport="currViewport"
      :loadSeriesID.sync="loadSeriesID"
      ref="serieslist"
      @seriesList="seriesList = $event"
      @changeSIDSync="changeSIDSync"
      @openGridModLayer="openGridModLayer"
      @initLayout="initLayout"
      @setCanvasRange="setCanvasRange"
    ></co-serieslist>

    <!-- 隐藏cavas -->
    <canvas ref="hideCanvas" class="hideCanvas"></canvas>
    <div
      ref="DOMOBJ"
      id="scrennshot_container"
      :style="{
        top: screenshotRange.top + 'px',
        left: screenshotRange.left + 'px',
        width: screenshotRange.width + 'px',
        height: screenshotRange.height + 'px',
      }"
    >
      <viewer-viewport
        :ref="'viewport-' + key"
        v-for="(vp, key) in viewportList"
        :key="'viewport-' + key"
        :viewportID="key"
        :viewport="vp"
        :currViewportID.sync="viewportID"
        :canvasRange="canvasRange"
        :seriesList="seriesList"
        :isAutoLinkout="isAutoLinkout"
        :isManualLinkout="isManualLinkout"
        :isInMPR="isInMPR"
        :isInCPR="isInCPR"
        :isInVR="isInVR"
        @changeSIDSync="changeSIDSync"
        @syncVPAcorssPoint="syncVPAcorssPoint"
        @updateManualLinkNum="updateManualLinkNum"
        @setSeriesInfo="setSeriesInfo"
      ></viewer-viewport>
      <template v-for="(viewport, vpID) in viewportList">
        <viewer-render
          v-on="$listeners"
          :currViewportID="viewportID"
          :viewportID="vpID"
          :currViewport="currViewport"
          :viewport="viewport"
          v-for="(item, index) in viewport['seriesInfos']"
          ref="render"
          :key="`render-${vpID}-${index}`"
          :activeOpt="activeOpt"
          :canvasSize="viewport['canvasSize'][index]"
          :imageData.sync="viewport['imageDatas'][index]"
          :seriesInfo="viewport['seriesInfos'][index]"
          :ifShowInfo="ifShowInfo"
          :imgPoor="imgPoor"
          :index="index"
          :seriesIdNow="currViewport.currentSID"
          :AcrossPoint="viewport['AcrossPoint']"
          :canvasNow.sync="viewport['canvasNow']"
          :currentSID="viewport['currentSID']"
          :ieditActive="viewport['ieditActive']"
          :ieditIndex="viewport['ieditIndex']"
          :ieditListData="ieditListData"
          :CPRVoiListData="viewport['CPRVoiListData']"
          :roiShow="roiShow"
          :posLineShow="posLineShow"
          :renderDataList.sync="viewport['renderDataList']"
          :dicomShow="dicomShow"
          :dicomShowAll="dicomShowAll"
          :dicomStyle="dicomStyle"
          :positionLine="positionLine"
          :pos="pos"
          :dicomTempShow="dicomTempShow"
          :vtkBlendMod="vtkBlendMod"
          :isInMPR="isInMPR"
          :isInCPR="isInCPR"
          :isInVR="isInVR"
          :useCompatibility="useCompatibility"
          :isAutoLinkout="isAutoLinkout"
          :isManualLinkout="isManualLinkout"
          @updateCurrViewportID="updateCurrViewportID"
          @forceLoadImg="forceLoadImg"
          @dropSeries="dropSeries"
          @renderError="renderError"
        ></viewer-render>
      </template>
      <viewer-catcher
        ref="catcher1"
        v-if="imageDataNow.series"
        :currViewportID="viewportID"
        :viewportSize="currViewport['viewportSize']"
        :viewportList="viewportList"
        :canvasSize="currCanvasSize"
        :imageData.sync="catcherImageData"
        :imageDatas.sync="currViewport['imageDatas']"
        :seriesInfo.sync="imageDataNow.series"
        :seriesInfos="currViewport['seriesInfos']"
        :gridNum.sync="currViewport['gridNum']"
        :AcrossPoint="currViewport['AcrossPoint']"
        :activeOpt.sync="activeOpt"
        :clickOpt.sync="clickOpt"
        :imgPoor="imgPoor"
        :canvasRange="canvasRange"
        :currViewport="currViewport"
        :isCatcherShow="isCatchShow"
        :mprThicknessSync.sync="mprThicknessSync"
        @dropSeries="dropSeries"
        :vtkBlendMod.sync="vtkBlendMod"
        :isInMPR="isInMPR"
        :isInCPR="isInCPR"
        :useCompatibility="useCompatibility"
        :catcherShortcutKey="catcherShortcutKey"
        :setvrShow.sync="setvrShow"
        :isAutoLinkout="isAutoLinkout"
        :isManualLinkout="isManualLinkout"
      ></viewer-catcher>
      <viewer-iedit
        ref="iedit"
        :roiStatus="roiStatus"
        :currViewport="currViewport"
        :ieditListData.sync="ieditListData"
        :CPRVoiListData.sync="currViewport['CPRVoiListData']"
        :ieditActive.sync="currViewport['ieditActive']"
        :iediting.sync="currViewport['iediting']"
        :viewportSize="currViewport['viewportSize']"
        :canvasSize="currCanvasSize"
        :seriesInfo="imageDataNow.series"
        :imageData="imageDataNow.imageData"
        :canvasNow="currViewport['canvasNow']"
        :activeOpt.sync="activeOpt"
        :imgPoor="imgPoor"
        :aiRemarkList="aiRemarkList"
        :hiddenIDList="hiddenIDList"
        :aiAnalysisResult="aiAnalysisResult"
        @saveMarks="saveMarks"
        @delMarks="delMarks"
        @updateRoi="updateRoi"
        @dropSeries="dropSeries"
      ></viewer-iedit>

      <div
        class="fullSrceenBg"
        v-if="
          canvasRange.fullVPID != undefined &&
          canvasRange.fullGridIndex != undefined
        "
        @click.stop="clickOpt = 'Full'"
      ></div>
    </div>

    <!-- 小窗口 -->
    <div
      id="minBox"
      :style="minStyle"
      v-if="minViewport.seriesInfos.length >= 1"
    >
      <dl @mousedown.stop="moveFn">
        <dt>
          {{ minViewport.seriesInfos[minViewport.canvasNow].description }}
        </dt>
        <dd @click.stop="minViewport.currentSID = null"></dd>
      </dl>
      <viewer-render
        ref="render"
        :isMini="true"
        :AcrossPoint="minViewport['AcrossPoint']"
        :currViewportID="viewportID"
        :currViewport="currViewport"
        :activeOpt.sync="activeOpt"
        :canvasSize="minCanvasSize"
        :imageData.sync="minViewport.imageDatas[minViewport.canvasNow]"
        :seriesInfo="minViewport.seriesInfos[minViewport.canvasNow]"
        :ifShowInfo="ifShowInfo"
        :imgPoor="imgPoor"
        :index="0"
        :canvasNow="0"
        :currentSID.sync="minViewport.currentSID"
        :dicomShow="dicomShow"
        :dicomShowAll="dicomShowAll"
        :dicomStyle="dicomStyle"
        :ieditListData="[]"
        :CPRVoiListData="{}"
        :roiShow="1"
        :posLineShow="true"
        :dicomTempShow="dicomTempShow"
        @forceLoadImg="forceLoadImg"
      ></viewer-render>
      <viewer-catcher
        ref="catcher3"
        :isMini="true"
        :currViewport="minViewport"
        :canvasSize="minCanvasSize"
        :seriesInfo="minViewport.seriesInfos[minViewport.canvasNow]"
        :imageData.sync="minViewport.imageDatas[minViewport.canvasNow]"
        :gridNum.sync="minViewport.gridNum"
        :canvasNow="minViewport.canvasNow"
        :MinCurrentSID.sync="minViewport.currentSID"
        :catcherShortcutKey="catcherShortcutKey"
        :minSize="minViewport.viewportSize"
        :activeOpt.sync="activeOpt"
        :clickOpt.sync="clickOpt"
        :imgPoor="imgPoor"
        :canvasRange="canvasRange"
        :vtkBlendMod.sync="vtkBlendMod"
        @changeVie="changeVie"
      ></viewer-catcher>
      <div
        class="corner"
        :class="'corner' + item"
        v-for="item in 4"
        :key="item"
        @mousedown.stop="scaleFn(item, $event)"
      ></div>
    </div>

    <!-- dicom元信息列表 -->
    <co-dicom-list
      v-if="dicomListShow"
      :zindex="dialogZIndex"
      :canvasRange="canvasRange"
      :useGBDecode="useGBDecode"
      :vertical.sync="vertical"
      :scrollIndex.sync="currViewport.imageDatas[currViewport.canvasNow]"
      :pagetype="pagetype"
      :dicomListShow.sync="dicomListShow"
      :path="currViewport.seriesInfos[currViewport.canvasNow].path"
      :curViewMod="currViewport.imageDatas[currViewport.canvasNow].curViewMod"
    ></co-dicom-list>

    <!-- 伪彩 -->
    <co-colormap
      v-if="colormapShow"
      :zindex="dialogZIndex"
      :canvasRange="canvasRange"
      :seriesListPos="seriesListPos"
      :colormapShow.sync="colormapShow"
      :imageData.sync="currViewport.imageDatas[currViewport.canvasNow]"
      :pagetype="pagetype"
      :renderDataList.sync="currViewport.renderDataList"
    ></co-colormap>

    <image-list
      v-if="showImageList"
      :showImageList.sync="showImageList"
      :canvasRange="canvasRange"
      ref="imageList"
      @forceLoadImg="forceLoadImg"
    ></image-list>

    <!-- 工具箱 -->
    <viewer-roi-edit
      v-show="roiEditBoxShow"
      :activeOpt.sync="activeOpt"
      :roiEditBoxShow.sync="roiEditBoxShow"
      :canvasRange="canvasRange"
      :clickOpt.sync="clickOpt"
      :rayplus_color.sync="rayplus_color"
    ></viewer-roi-edit>
    <!-- 模态框 -->
    <viewer-layer
      :showWarning.sync="showWarning"
      :showIcon="warningType.includes('Series')"
      :showTitle="showTitle"
      :showCancel="showLayerCancel"
      :warningType="warningType"
      :confirmText="confirmText"
      @confirm="layerConfirm"
    >
      <template v-if="warningType.includes('Series')">
        <layer-split
          :splitList="splitList"
          :showWarning="showWarning"
          @selectSplit="handleSplitList"
          @splitCallback="updateSeries"
          ref="layerSplit"
        />
      </template>
      <template v-if="warningType === 'shareCode'">
        <layer-code> </layer-code>
      </template>
    </viewer-layer>

    <!-- 标注列表 -->
    <viewer-roi-list
      v-if="roiListShow"
      :vertical="vertical"
      :seriesListPos="seriesListPos"
      :ieditListData.sync="ieditListData"
      :currentSID="currViewport.currentSID"
      :roiListShow.sync="roiListShow"
      @saveMarks="saveMarks"
      @delMarks="delMarks"
      @setMarkPosi="setMarkPosi"
    ></viewer-roi-list>

    <!-- 设置pt参数 -->
    <viewer-setParam
      v-if="paramShow"
      :vertical="vertical"
      :paramShow.sync="paramShow"
      :seriesInfo="imageDataNow.series"
      :currentSID="currViewport.currentSID"
      :imgPoor.sync="imgPoor"
      :ieditListData.sync="ieditListData"
      :roiShow.sync="roiShow"
    ></viewer-setParam>

    <!-- 设置窗宽窗位suv层厚 -->
    <viewer-setsuv
      v-if="
        currViewport.imageDatas &&
        currViewport.imageDatas[currViewport.canvasNow]
      "
      v-show="suvShow"
      :vertical="vertical"
      :canvasRange="canvasRange"
      :seriesListPos="seriesListPos"
      :seriesInfo="imageDataNow.series"
      :imageData="currViewport.imageDatas[currViewport.canvasNow]"
      :suvShow.sync="suvShow"
      :imgPoor="imgPoor"
      :mprLayerShow.sync="mprLayerShow"
      @changeValue="changeValue"
      @changeValue2="changeThickness"
    ></viewer-setsuv>

    <!-- 视图模板 -->
    <viewer-temp
      v-if="tempShow"
      :tempShow.sync="tempShow"
      :clickOpt.sync="clickOpt"
      :gridMod="currViewport.gridMod"
      :vertical="vertical"
      :seriesListPos="seriesListPos"
      :imageData="imageDataNow.imageData"
      :seriesInfo="imageDataNow.series"
    ></viewer-temp>

    <!--  viewer设置  -->
    <viewer-setting
      v-if="currViewport.seriesInfos && currViewport.seriesInfos.length"
      :zindex="dialogZIndex"
      :settingShow.sync="settingShow"
      :dicomShow.sync="dicomShow"
      :dicomShowAll.sync="dicomShowAll"
      :dicomStyle.sync="dicomStyle"
      :shortcutsKey="shortcutsKey"
      :WindowLevelSetData.sync="WindowLevelSetData"
      :seriesIdNow="currViewport.currentSID"
      :defaultData.sync="currViewport.seriesInfos[currViewport.canvasNow]"
      :imageData.sync="currViewport.imageDatas[currViewport.canvasNow]"
      :pagetype="currViewport.pagetype"
      :tempDataPT="tempDataPT"
      :positionLine.sync="positionLine"
      :pos.sync="pos"
      :theme.sync="theme"
      :seriesListPos.sync="seriesListPos"
      :catcherShortcutKey="catcherShortcutKey"
      :vrShortcutKey="vrShortcutKey"
      :controlShortcutKey="controlShortcutKey"
      :otherShortcutKey="otherShortcutKey"
      :prelayoutSetting="prelayoutSetting"
    ></viewer-setting>

    <!--  vr设置  -->
    <viewer-setvr
      v-show="setvrShow && isInVR"
      :setvrShow.sync="setvrShow"
      :canvasRange="canvasRange"
      :imgPoor="imgPoor"
      :seriesInfo="imageDataNow.series"
      :imageData="currViewport.imageDatas && currViewport.imageDatas[0]"
      :activeOpt="activeOpt"
      @changeVRPara="changeVRPara"
      @updateWWWL="updateCurrWWWL"
    ></viewer-setvr>
    <!-- 配准组件 -->
    <viewer-registration
      v-if="registrationShow"
      :registrationShow.sync="registrationShow"
      :imgPoor="imgPoor"
      :clickOpt.sync="clickOpt"
      :seriesList="seriesList"
      @updateRegParaAll="updateRegParaAll"
    ></viewer-registration>
    <!-- 图像拼接组件 -->
    <viewer-stitching
      v-if="imageStitchingShow"
      :imageStitchingShow.sync="imageStitchingShow"
      @forceLoadImg="forceLoadImg"
    ></viewer-stitching>
    <co-history-list
      :zindex="dialogZIndex"
      :historyShow.sync="historyShow"
      :canvasRange="canvasRange"
      @appendStudy="startAppendStudy"
    />

    <co-download-list
      :zindex="dialogZIndex"
      :downloadShow.sync="downloadShow"
      :canvasRange="canvasRange"
      :appendStudyList="appendStudyList"
    />

    <LoadingDialog
      :showDialog="showLoadingDialog"
      :loadingInfo="loadingInfo"
      @closeDialog="closeLoadingDialog"
    >
    </LoadingDialog>
  </div>
</template>

<script>
import LAYOUT from "./js/layout.js"; //布局
import DATA from "./js/data.js"; // 数据获取以及处理
import CLICKOPT from "./js/clickOpt.js"; //各种点击事件
import NETLOADER from "./js/netloader.js"; //网络DICOM加载相关
import FIND from "./js/find.js";
import KEYFN from "./js/keyfn";
import MINOPT from "./js/minOpt";
import MOD from "./js/mod.js";
import bus from "../../assets/js/bus";

//公共组件
import seriesList from "./co-serieslist/co-serieslist.vue"; //sereie列表
import dicomList from "./co-dicomlist/co-dicomlist.vue"; //dicom信息列表
import colormap from "./co-colormap/co-colormap.vue"; //伪彩
import ImageList from "./co-image-list/index.vue";
import historyList from "./co-history/index.vue";
import downloadList from "./co-download/index.vue";

//独有组件
import toolBar from "./viewer-toolbar/viewer-toolbar.vue"; //工具
import render from "./viewer-render/viewer-render"; //渲染
import catcher from "./viewer-catcher/viewer-catcher.vue"; //捕获
import layer from "./viewer-layer/viewer-layer.vue"; //弹框
import roiEdit from "./viewer-roi-edit/viewer-roi-edit"; //工具箱
import ieditCanvas from "./viewer-iedit/viewer-iedit"; // 标注
import roiList from "./viewer-roi-list/viewer-roi-list.vue"; // 标注列表
import setParam from "./viewer-setParam/viewer-setParam"; //pt参数设置
import setsuv from "./viewer-setsuv/viewer-setsuv";
import setvr from "./viewer-setvr/viewer-setvr.vue"; //vr参数设置
import registration from "./viewer-registration/viewer-registration.vue";
import viewerStitching from "./viewer-stitching/viewer-stitching.vue";
import viewerSetting from "./viewer-setting/viewer-setting.vue";
import ViewerViewport from "./viewer-viewport/viewer-viewport.vue";
import { mapMutations, mapState } from "vuex";
import Layout from "./js/layout.js";
import CROSS from "@/components/multiviewer/js/crosshair";
import ViewerTemp from "@/components/multiviewer/viewer-temp/viewer-temp.vue";
import Mod from "./js/mod.js";
import DB from "./js/db.js";
import {
  createImgPoor,
  getSplitInfo,
  getSplitData,
  getSplitVolumeSize,
} from "./fetch/seriesdata.js";
import {
  getDataType,
  getYMData,
  getDataHandler,
} from "../../assets/js/YMDataHandler.js";
import { tempDataPT, shortcutsKey, positionLine } from "./js/constant.js";
import { isInsideRange } from "./js/utils";
import LoadingDialog from "./loading-diaolog/index.vue";
import LayerSplit from "./viewer-layer/layer-split.vue";
import LayerCode from "./viewer-layer/layer-code.vue";
import { createFullSeries } from "./js/fullSeries.js";
import ACTIVEOPT from "./js/activeOpt.js";
export default {
  name: "multi-viewer",
  components: {
    "viewer-temp": ViewerTemp,
    // mullist,
    "co-serieslist": seriesList,
    "co-dicom-list": dicomList,
    "co-colormap": colormap,
    ImageList,
    "co-history-list": historyList,
    "co-download-list": downloadList,

    "viewer-toolbar": toolBar,
    "viewer-render": render,
    "viewer-catcher": catcher,
    "viewer-layer": layer,
    "viewer-roi-edit": roiEdit,
    "viewer-setParam": setParam,

    "viewer-iedit": ieditCanvas,
    "viewer-roi-list": roiList,
    // "viewer-dic-list": dicList,
    "viewer-setsuv": setsuv,
    // "viewer-ai-analysis": viewerAiAnalysis,
    "viewer-setting": viewerSetting,
    "viewer-viewport": ViewerViewport,
    "viewer-setvr": setvr,
    "viewer-registration": registration,
    "viewer-stitching": viewerStitching,
    LoadingDialog,
    LayerSplit,
    LayerCode,
  },
  data() {
    return {
      pagetype: "multiviewer",
      vertical: false, //横竖屏
      square: false,
      hideCanvas: null,
      // 状态部分
      activeOpt: "Page", //状态
      clickOpt: "default", //点击事件
      rayplus_color: "#08f5b1",
      rayplus_fontSize: "fontS",
      useGBDecode: false, // DICOM LIST是否使用GB2312编码
      layoutNum: 1, // 布局数
      layoutNumBefore: 0,
      // 数据部分
      // imgPoor: {}, //图像数据源，包括原始的dicom信息和pixceldata
      mprSID: null,

      // 窗口大小
      column: 1,
      // （更改）表示左侧series list的宽度
      right_width: {
        1: 260,
        2: 34,
      },
      seriesListPos: "LEFT", // LEFT：左侧、BOTTOM：下方

      //mpr
      ifMPRScaleSync: false, //是否在十字状态下同步缩放

      wwwlForReg: {}, //配准的窗宽窗位及融合比例
      renderDataList: {},
      vtkBlendMod: 1,
      //registration
      registrationShow: false,
      //stitching
      imageStitchingShow: false,
      //min
      minViewport: {
        gridNum: 1,
        currentSID: "0",
        canvasNow: 0,
        seriesInfos: [],
        imageDatas: [],

        viewportSize: {
          left: 200,
          top: 100,
          width: 500,
          height: 482,
        },
      },
      mprLayerShow2: false, //下载进度弹窗

      viewportID: "", // 当前选中视口的ID
      viewportList: {}, // 视口配置（{key: value} Map集合）
      viewportListBefore: [],
      viewportHelper: {
        // 辅助布局增多时，检测重复以及检测是否闭环
        seriesIdList: [],
        isCycle: false,
      },
      setvrShow: false,

      //变换窗口所需参数
      canvasRange: {
        RBBorder: 2,
        RBLeftWidth: 200,
        RBTopWidth: 0,
        RBRightWidth: 131,
        RBBottomWidth: 0,
      },
      // 截图窗口数据
      screenshotRange: {
        top: 0,
        left: 0,
        widt: 0,
        height: 0,
      },
      ifFullScreen: false,
      fullScreen_scale: 2, //全屏缩放系数

      warning: {
        //模态框提示
        spacing: false, //间隔不均匀
        quantity: false, //切片数量不足
        reformationFail: false, // 三维重建失败
        fun: null, //保存函数
        checked: false, //已选?
        deleRoi: false, //删除标注?
      },
      showTitle: true,
      showWarning: false,
      warningType: "msgLess", //警告类型
      warningTip: true, //需要再提示？
      // 显示隐藏flag
      ifShowInfo: false, //信息隐藏
      loadingShow: false, // loading?
      roiShow: 1,
      posLineShow: false,
      mprLayerShow: false, //下载进度弹窗

      dicomListShow: false, //dicom信息
      colormapShow: false, //伪彩
      showImageList: false,
      historyShow: false,
      downloadShow: false,
      windowLevelSetShow: false, //窗宽窗位
      WindowLevelSetData: [], //窗宽窗位的数据列表
      roiEditBoxShow: false, //工具箱
      paramShow: false,
      tempShow: false,
      suvShow: false, //设置窗宽窗位suv弹框

      // 标注相关
      ieditListData: {}, // 标注信息
      roiStatus: false, // 是否标注
      ieditActive: null, //高亮标注
      ieditIndex: null, //选中控制点
      iediting: false, //标注中？
      roiListShow: false, // 标注列表显隐
      isCatchShow: true,
      CPRVoiListData: {}, // CPR三维标注信息
      isInCPR: false, // 启用CPR入口
      isInMPR: false, // 启用MPR入口
      isInVR: false, // 启用VR入口

      //VOI相关
      isVoiToolShow: false, //VOI工具显隐

      // 控制dicom信息显隐
      dicomTempShow: true, // 临时隐藏dicom信息
      dicomShow: {
        part: true, // 部位/模态
        imgNum: true, // 图像张数
        patientName: true, // 患者姓名
        patientId: true, // 患者ID
        pixel: true, // 分辨率
        thickness: true, // 层厚
        wwwl: true, // 窗宽窗位
        TB: true, // T/B
        vendor: true, // 厂商
        modelName: true, // 型号
        orientation: true, // 方位
        rulerImg: true, // 直尺
        pseudo: true, // 伪彩
        seriesTime: true,
        age: true,
        sex: true,
        description: true,
        institutionName: true,
        SID: true, //序列ID
      },
      dicomShowAll: {},
      // dicom样式
      dicomStyle: {
        color: "#576D8A",
        fontSize: { text: "小", key: "fontS", fontSize: "10px", rule: "1px" },
      },

      //PTsuv模板
      tempDataPT,

      // AI分析数据
      hasAIAnalysis: false,
      aiShow: false,
      aiAnalysisResult: {},
      aiRemarkList: [], // AI分析的矩形标记[坐标1, 2, 3, 4]构成一个矩形
      hiddenIDList: [], // 隐藏ID的数组

      // 设置
      settingShow: false,
      shortcutsKey,
      catcherShortcutKey: {
        // 捕获层的快捷键
        middle: "Window",
        right: "Zoom",
        left: "Page",
      },
      vrShortcutKey: {
        middle: "Zoom",
        right: "Pan",
        left: "Rotate",
      },
      controlShortcutKey: {
        controlPoint: "Fill",
      },
      otherShortcutKey: {
        isRollback: "yes",
        isCrossClickPositioning: "yes",
      },
      prelayoutSetting: [
        { model: "CT", layout: "" },
        { model: "MR", layout: "" },
        { model: "CR", layout: "" },
        { model: "DR", layout: "" },
        { model: "DX", layout: "" },
      ],
      positionLine,
      pos: {
        // 定位线
        color: "#B6B636",
        dottedLine: [],
      },

      // 融合历史列表
      linkLayout: 1,
      theme: "dark", // 主题颜色

      initLayoutNum: 4, // 初始状态下的布局数量
      isInitLayout: false, // 是否初始化布局

      seriesList: [],
      currCanvasSize: {},

      // gridMod下切换series数据
      mprLayerShow3: false,
      loadSeriesID: "", // 待加载完毕的series
      mixSidList: {},

      priorSid: "", // 当前优先加载的series
      splitList: [], // 待拆分序列
      isThumbnailLoaded: false, // 缩略图是否加载完成
      appendStudyList: [], // 追加进来的studylist
      dialogZIndex: 1000, // 弹框层级
      mprThicknessSync: false, // MPR同步层厚
      useCompatibility: false, //是否是兼容模式
      isLoadFullSeries: false, //是否加载全影像序列

      isAutoLinkout: false, // 是否自动关联
      isManualLinkout: false, // 是否手动关联
    };
  },
  beforeDestroy() {
    window.onresize = null;
  },
  beforeRouteEnter(to, from, next) {
    const ua = window.navigator.userAgent.toLowerCase();
    const isMobile =
      /Android|iPhone|iPad|iPad Pro|iPad mini|iPad Air|Windows\sPhone|Windows\s(RT|Tablet)|BlackBerry\sPlayBook|BlackBerry\s(10|20)|Mobile\sSafari|webOS|Kindle\sFire|Silk|Opera\sMini|Opera\sMobi|POLARIS|Symbian|HUAWEI|Xiaomi|LG|Nokia|SonyEricsson/i.test(
        ua,
      );
    if (isMobile === false) {
      next();
      return;
    }

    const baseURL = location.origin + process.env.BASE_URL;
    const sliceIndex = location.href.indexOf(baseURL) + baseURL.length;
    const queryPath = location.href.slice(sliceIndex);
    location.href = `${baseURL}YMViewer/${queryPath}`;
  },
  created() {
    // 从配置文件中读取相关设置
    try {
      const settingParams = window.__deployments.VUE_APP_SETTING_PARAMS;
      if (settingParams?.useCompatibility) {
        localStorage.setItem(
          "useCompatibility",
          settingParams.useCompatibility,
        );
      }
    } catch (error) {
      console.error(error);
    }
    let {
      dicomShowAll,
      square,
      column,
      rayplus_color,
      dicomStyle,
      rayplus_fontSize,
      lang,
      showToolbarText,
      showRegImages,
    } = localStorage;
    if (square === "true") this.square = true;
    if (column) this.column = column * 1;
    if (dicomStyle) this.dicomStyle = JSON.parse(dicomStyle);
    if (dicomShowAll) this.dicomShowAll = JSON.parse(dicomShowAll);
    if (rayplus_color) {
      this.rayplus_color = rayplus_color;
    } else {
      localStorage.rayplus_color = this.rayplus_color;
    }
    if (rayplus_fontSize) {
      this.rayplus_fontSize = rayplus_fontSize;
    } else {
      localStorage.rayplus_fontSize = this.rayplus_fontSize;
    }
    if (lang) {
      this.$store.commit("setLang", lang);
      this.$i18n.locale = lang;
    }
    if (showToolbarText === "true") {
      this.$store.commit("setShowToolbarText", true);
    }
    if (showRegImages === "true") {
      this.$store.commit("setShowRegImages", true);
    }
    DB.init();
    DB.autoClean().then((res) => {
      console.log(res, "clean");
    });

    // 获取AI分析结果
    // const studyID = localStorage.getItem("rayplus_studyId");
    // this.getAIAnalysisHTTP(studyID); // （待对接另外的接口）

    // 读取自定义快捷键
    const customShortcutsKeyStr = localStorage.getItem("customShortcutsKey");
    if (customShortcutsKeyStr) {
      const customShortcutsKey = JSON.parse(customShortcutsKeyStr);
      for (const field in customShortcutsKey) {
        const keyInfo = customShortcutsKey[field];
        if (!(field in this.shortcutsKey)) continue;
        this.shortcutsKey[field].enable = keyInfo.enable;
        this.shortcutsKey[field].key = keyInfo.key;
        this.shortcutsKey[field].keyName = keyInfo.keyName;
      }
    } else {
      localStorage.setItem(
        "customShortcutsKey",
        JSON.stringify(this.shortcutsKey),
      );
    }

    // 读取十字定位线
    const positionLineStr = localStorage.getItem("positionLine");
    if (positionLineStr) {
      const positionLine = JSON.parse(positionLineStr);
      for (const field in positionLine) {
        const data = positionLine[field];
        if (!(field in this.positionLine)) continue;
        this.positionLine[field] = data;
      }
    } else {
      localStorage.setItem("positionLine", JSON.stringify(this.positionLine));
    }

    // 读取主题
    const theme = localStorage.getItem("theme");
    if (theme) {
      this.theme = theme;
      this.changeTheme(this.theme);
    } else {
      localStorage.setItem("theme", this.theme);
      this.changeTheme(this.theme);
    }

    // 读取定位线
    const pos = localStorage.getItem("pos");
    if (pos) {
      this.pos = JSON.parse(pos);
    } else {
      localStorage.setItem("pos", JSON.stringify(this.pos));
    }

    const posLineShow = localStorage.getItem("posLineShow");
    if (posLineShow) {
      this.posLineShow = posLineShow === "true" ? true : false;
    } else {
      localStorage.setItem("posLineShow", this.posLineShow);
    }
    // 读取series list位置
    const seriesListPos = localStorage.getItem("seriesListPos");
    if (seriesListPos) {
      this.seriesListPos = seriesListPos;
    } else {
      localStorage.setItem("seriesListPos", this.seriesListPos);
    }

    const catcherShortcutKeyStr = localStorage.getItem("catcherShortcutKey");
    if (catcherShortcutKeyStr) {
      this.catcherShortcutKey = JSON.parse(catcherShortcutKeyStr);
      this.activeOpt = this.catcherShortcutKey.left || "Page";
    } else {
      localStorage.setItem(
        "catcherShortcutKey",
        JSON.stringify(this.catcherShortcutKey),
      );
    }

    const vrShortcutKeyStr = localStorage.getItem("vrShortcutKey");
    if (vrShortcutKeyStr) {
      this.vrShortcutKey = JSON.parse(vrShortcutKeyStr);
    } else {
      localStorage.setItem("vrShortcutKey", JSON.stringify(this.vrShortcutKey));
    }

    const controlShortcutKey = localStorage.getItem("controlShortcutKey");
    if (controlShortcutKey) {
      this.controlShortcutKey = JSON.parse(controlShortcutKey);
    } else {
      localStorage.setItem(
        "controlShortcutKey",
        JSON.stringify(this.controlShortcutKey),
      );
    }

    const otherShortcutKey = localStorage.getItem("otherShortcutKey");
    if (otherShortcutKey) {
      this.otherShortcutKey = JSON.parse(otherShortcutKey);
    } else {
      localStorage.setItem(
        "otherShortcutKey",
        JSON.stringify(this.otherShortcutKey),
      );
    }

    const cacheStorageInfo = localStorage.getItem("cacheStorageInfo");
    if (cacheStorageInfo) {
      this.$store.commit("setCacheStorageInfo", JSON.parse(cacheStorageInfo));
    }

    const prelayout = localStorage.getItem("prelayoutSetting");
    if (prelayout) {
      this.prelayoutSetting = JSON.parse(prelayout);
    } else {
      localStorage.setItem(
        "prelayoutSetting",
        JSON.stringify(this.prelayoutSetting),
      );
    }

    const scale = localStorage.getItem("scaleRatio");
    if (scale) {
      this.$store.commit("setScaleRatio", parseFloat(scale));
    }

    const useCompatibility = localStorage.getItem("useCompatibility");
    if (useCompatibility) {
      this.useCompatibility = useCompatibility === "true";
    } else {
      localStorage.setItem("useCompatibility", this.useCompatibility);
    }

    this.initViewerData();
  },
  computed: {
    ...mapState(["imgPoor", "studyInfos", "scaleRatio", "showToolbarText"]),
    confirmText() {
      if (this.warningType.includes("Series")) return this.$t("upload");
      if (this.warningType === "shareCode") return this.$t("close");
      return "";
    },
    showLayerCancel() {
      return ["uploadSeries", "addSeriesToUpload"].includes(this.warningType);
    },
    showLoadingDialog() {
      return this.mprLayerShow || this.mprLayerShow2 || this.mprLayerShow3;
    },

    currentSIDPrecent() {
      const imgData = this.imgPoor[this.currViewport?.currentSID];
      if (!imgData) return 0;
      const done = imgData.done;
      const num = imgData.num;
      const progress = Math.floor((done / num) * 100);

      //这里更新dcmNetWork的currViewportSID还有视图的sidList
      const currViewportList = [];
      for (let key in this.viewportList) {
        currViewportList.push(this.viewportList[key].currentSID);
      }
      const update = {
        currViewportSID: imgData.info.currentSID,
        currViewportList,
      };
      this.$store.commit("setDcmNetWork", {
        ...this.$store.state.dcmNetWork,
        ...update,
      });
      return progress;
    },

    miniCurrentSIDPrecent() {
      const minCurrentSID = this.minViewport.currentSID;
      const imgData = this.imgPoor[minCurrentSID];
      if (!imgData) return 0;
      const done = imgData.done;
      const num = imgData.num;
      if (
        this.$store.state.dcmNetWork.miniViewportSID != imgData.info.currentSID
      ) {
        //这里更新dcmNetWork的miniViewportSID
        let dcmNetWork = { ...this.$store.state.dcmNetWork };
        dcmNetWork.miniViewportSID = imgData.info.currentSID;
        this.$store.commit("setDcmNetWork", dcmNetWork);
      }
      return Math.floor((done / num) * 100);
    },

    loadSeriesPrecent() {
      const loadSeriesID = this.loadSeriesID;
      const imgData = this.imgPoor[loadSeriesID];
      if (!imgData) return 0;
      const done = imgData.done;
      const num = imgData.num;
      return Math.floor((done / num) * 100);
    },
    loadingInfo() {
      if (this.mprLayerShow) {
        return {
          percent: this.currentSIDPrecent,
          total: this.imgPoor[this.currViewport.currentSID].num,
          done: this.imgPoor[this.currViewport.currentSID].imageDone,
        };
      } else if (this.mprLayerShow2) {
        return {
          percent: this.miniCurrentSIDPrecent,
          total: this.imgPoor[this.minViewport.currentSID].num,
          done: this.imgPoor[this.minViewport.currentSID]["imageDone"],
        };
      } else if (this.mprLayerShow3) {
        return {
          percent: this.loadSeriesPrecent,
          total: this.imgPoor[this.loadSeriesID].num,
          done: this.imgPoor[this.loadSeriesID]["imageDone"],
        };
      } else return {};
    },
    imageDataNow() {
      const cvp = this.currViewport;
      if (!cvp || !cvp.imageDatas || cvp.imageDatas.length <= 0) return {};

      const { canvasNow, seriesInfos, imageDatas } = cvp;
      const seriesInfo = seriesInfos[canvasNow];
      const imageData = imageDatas[canvasNow];
      const curViewMod = imageData.curViewMod;
      return {
        canvasNow,
        curViewMod,
        imageData,
        series: seriesInfo,
      };
    },
    currViewport: {
      get() {
        if (Object.keys(this.viewportList).length <= 0) return {};
        const cvp = this.viewportList[this.viewportID];
        if (cvp && cvp.imageDatas.length >= 1) {
          this.currCanvasSize = cvp.canvasSize[cvp.canvasNow];
        }
        return cvp;
      },
      //允许更新
      set(newVal) {
        if (Object.keys(this.viewportList).length <= 0) return {};
        this.viewportList[this.viewportID] = newVal;
      },
    },
    catcherImageData: {
      get() {
        return (
          this.currViewport.imageDatas &&
          this.currViewport.imageDatas.length >= 1 &&
          this.currViewport.imageDatas[this.currViewport.canvasNow]
        );
      },
      set(val) {
        this.$set(
          this.currViewport.imageDatas,
          this.currViewport.canvasNow,
          val,
        );
      },
    },
    minStyle() {
      let { width, top, left, height } = this.minViewport.viewportSize;
      let res = {
        width: width + "px",
        height: height + "px",
        left: left + "px",
        top: top + "px",
      };
      return res;
    },
    minCanvasSize() {
      let { width, height } = this.minViewport.viewportSize;
      let res = {
        left: 0,
        top: 26,
        width: width,
        height: height - 26,
      };
      return res;
    },

    /**
     * 床宽窗位预设0-10
     * @returns {T}
     * @constructor
     */
    WWWL10() {
      const WWWL10 = this.tempDataPT.find((item) => item.id === "D4"); // Suv 0-10
      return WWWL10;
    },

    /**
     * imgPoor完成进度百分比
     */
    imgPoorPrecent() {
      let total = 0;
      let complete = 0;

      if (!this.isInitLayout) return 0;

      for (const seriesId in this.imgPoor) {
        const imgPoor = this.imgPoor[seriesId];
        complete += imgPoor.done;
        total += imgPoor.num;
      }
      let precent = (complete / total) * 100;
      if (isNaN(precent)) {
        return 0;
      }
      return Math.floor(precent);
    },
  },
  mounted() {
    const loadingEle = document.getElementById("pageLoading");
    loadingEle && (loadingEle.style.display = "none");

    this.hideCanvas = this.$refs.hideCanvas;
    window.onresize = () => {
      if (this.activeOpt === "ACross") this.activeOpt = "Page";
      let toolbar = this.$refs.toolbar;
      if (toolbar.Screenshot) {
        toolbar.Screenshot.cancelScreenShot();
      }
      this.setCanvasRange();
      this.reSize();
      this.setScreenshotRange();
      const cvp = this.currViewport;
      const { imageDatas } = cvp;
      for (let i = 0; i < imageDatas.length; i++) {
        let imageData = { ...imageDatas[i] };
        imageDatas.splice(i, 1, { ...imageData });
      }
    };
    this.setCanvasRange("init");
    this.setScreenshotRange();
    FIND.init(this);
    KEYFN.init(this);

    // 初始化栅格
    const { viewportID: randomStr, viewportData: initViewPortData } =
      this.getViewportItem();
    this.viewportList = { [randomStr]: initViewPortData };
    this.viewportID = randomStr;
    // this.initLayoutToFour_temp();

    // 初始化为四窗口布局

    // console.log("viewportList", this.viewportList);
  },
  methods: {
    ...mapMutations(["setImgPoor"]),
    splitSeries() {
      const { imageData, series } = this.imageDataNow;
      const { curImageNum } = imageData;
      if (curImageNum === 0) {
        this.showWarning = true;
        this.warningType = "cannotSplit";
        return;
      }
      const { SeriesIndex, initViewMod } = series;

      if (!this.imgPoor[SeriesIndex].imageDone) {
        // 未加载完成
        this.mprLayerShow = true;
        return;
      }

      // 设置侧边栏内容
      const studyDatas = this.$refs.serieslist.LISTDATA;
      let studyData, studyKey;
      for (let key in studyDatas) {
        const data = studyDatas[key].data.find(
          (item) => item.seriesId === SeriesIndex,
        );
        if (data) {
          studyKey = key;
          studyData = data;
          break;
        }
      }
      const data = Object.assign(Object.create(null), studyData);
      if (data?.isUpload === "no") {
        this.showWarning = true;
        this.warningType = "splitNotUpload";
        return;
      }
      let leftSID = data.seriesId + "-1" + new Date().getTime();
      let rightSID = data.seriesId + "-2" + new Date().getTime();
      const dataLeft = {
        ...data,
        description: getSplitInfo("split", "desc", data.description, 1),
        imageNumber: curImageNum,
        id: getSplitInfo("split", "id", data.id, 1),
        seriesId: leftSID,
        seriesKeyId: data?.seriesKeyId ? data.seriesKeyId : series.seriesKeyId,
        isUpload: "no",
      };
      const dataRight = {
        ...data,
        imageNumber: data.imageNumber - curImageNum,
        description: getSplitInfo("split", "desc", data.description, 2),
        id: getSplitInfo("split", "id", data.id, 2),
        seriesId: rightSID,
        seriesKeyId: data?.seriesKeyId ? data.seriesKeyId : series.seriesKeyId,
        isUpload: "no",
      };

      // 设置imgPoor内容
      const imgPoor = this.imgPoor[SeriesIndex];
      const poor = Object.assign(Object.create(null), imgPoor);
      console.log(poor, curImageNum, "poor");
      const tmpDatas = poor.data[initViewMod];
      let splitLeftIns = tmpDatas.slice(0, curImageNum);
      let splitRightIns = tmpDatas.slice(curImageNum);
      let leftPath = poor.info.path.slice(0, curImageNum);
      let rightPath = poor.info.path.slice(curImageNum);
      let leftInstance = poor.info.instances.slice(0, curImageNum);
      let rightInstance = poor.info.instances.slice(curImageNum);

      let poorLeft = {
        ...poor,
        num: splitLeftIns.length,
        done: splitLeftIns.length,
        data: getSplitData(poor.data, initViewMod, splitLeftIns),
        info: {
          ...poor.info,
          SeriesIndex: leftSID,
          currentSID: leftSID,
          path: [...leftPath],
          instances: [...leftInstance],
        },
        volumeImageData: undefined,
        volumeBuffer: undefined,
      };

      let poorRight = {
        ...poor,
        num: splitRightIns.length,
        done: splitRightIns.length,
        data: getSplitData(poor.data, initViewMod, splitRightIns),
        info: {
          ...poor.info,
          SeriesIndex: rightSID,
          currentSID: rightSID,
          path: [...rightPath],
          instances: [...rightInstance],
        },
        volumeImageData: undefined,
        volumeBuffer: undefined,
      };

      // 原始序列即使是非均匀，拆分后有可能是均匀，所以需要重新计算seriesInfo

      let newPosSeriesInfoL = DATA.getInitSeriesInfo(poorLeft.info);
      poorLeft.info = newPosSeriesInfoL;

      let newPosSeriesInfoR = DATA.getInitSeriesInfo(poorRight.info);
      poorRight.info = newPosSeriesInfoR;
      console.log(poorLeft.info, "poorl after");

      console.log(poorRight.info, "poorR after");

      // // 重建volume
      if (
        !poorLeft.info.isNotUniformSquence &&
        poorLeft.info.instances.length >= 5
      ) {
        if (poorLeft.info.initViewMod === 0) {
          let resp = DATA.getVolumeSlice(
            poorLeft.info,
            poor.volumeBuffer,
            curImageNum,
            true,
          );
          poorLeft.volumeBuffer = resp.volumeBuffer;
          poorLeft.volumeImageData = resp.volumeImageData;
        } else if (poorLeft.info.initViewMod) {
          DATA.checkVTKData(poorLeft);
        }
      }

      if (
        !poorRight.info.isNotUniformSquence &&
        poorRight.info.instances.length >= 5
      ) {
        if (poorRight.info.initViewMod === 0) {
          let resp = DATA.getVolumeSlice(
            poorRight.info,
            poor.volumeBuffer,
            curImageNum,
          );
          poorRight.volumeBuffer = resp.volumeBuffer;
          poorRight.volumeImageData = resp.volumeImageData;
        } else if (poorRight.info.initViewMod) {
          DATA.checkVTKData(poorRight);
        }
      }
      console.log(poorLeft, "volume");

      // 在计算完真正的seriesInfo后再更新seriesList
      const lists = this.$refs.serieslist.LISTS;
      dataLeft.isNotUniformSquence = poorLeft.info.isNotUniformSquence;
      dataRight.isNotUniformSquence = poorRight.info.isNotUniformSquence;
      lists[studyKey].data.push(dataLeft, dataRight);
      this.$set(lists, studyKey, lists[studyKey]);
      const tmpPoor = {
        ...this.imgPoor,
        [leftSID]: poorLeft,
        [rightSID]: poorRight,
      };
      this.$store.commit("setImgPoor", tmpPoor);
      // 展示弹框
      this.splitList = [
        {
          studyInfo: dataLeft,
          imgInfo: poorLeft,
          checked: false,
        },
        {
          studyInfo: dataRight,
          imgInfo: poorRight,
          checked: false,
        },
      ];
      this.showWarning = true;
      this.warningType = "uploadSeries";
    },
    addSeries() {
      const { imageData, series } = this.imageDataNow;
      const { curImageNum } = imageData;
      const { SeriesIndex, initViewMod } = series;

      // 设置侧边栏内容
      const studyDatas = this.$refs.serieslist.LISTDATA;
      let studyData, studyKey;
      for (let key in studyDatas) {
        const data = studyDatas[key].data.find(
          (item) => item.seriesId === SeriesIndex,
        );
        if (data) {
          studyKey = key;
          studyData = data;
          break;
        }
      }
      const data = Object.assign(Object.create(null), studyData);
      if (data?.isUpload === "no") {
        this.showWarning = true;
        this.warningType = "addNotUpload";
        return;
      }
      const desc = `${data.description}-${curImageNum + 1}/${data.imageNumber}`;
      const newSeriesId = data.seriesId + "-n" + new Date().getTime();
      const newData = {
        ...data,
        description: getSplitInfo("add", "desc", desc),
        imageNumber: 1,
        id: getSplitInfo("add", "id", data.id),
        seriesId: newSeriesId,
        seriesKeyId: data?.seriesKeyId ? data.seriesKeyId : series.seriesKeyId,
        isUpload: "no",
      };
      const lists = this.$refs.serieslist.LISTS;
      lists[studyKey].data.push(newData);
      this.$set(lists, studyKey, lists[studyKey]);
      // 设置imgPoor内容
      const imgPoor = this.imgPoor[SeriesIndex];
      const poor = Object.assign(Object.create(null), imgPoor);
      const tmpDatas = poor.data[initViewMod];

      const imgData = [tmpDatas[curImageNum]];
      const instances = [poor.info.instances[curImageNum]];
      const path = [poor.info.path[curImageNum]];

      let poorNew = {
        ...poor,
        num: 1,
        done: 1,
        data: getSplitData(poor.data, initViewMod, imgData),
        info: {
          ...poor.info,
          SeriesIndex: newSeriesId,
          currentSID: newSeriesId,
          path,
          instances,
          volumeSize: getSplitVolumeSize(
            poor.info.volumeSize,
            1,
            poor.info.initViewMod,
          ),
        },
        volumeImageData: undefined,
        volumeBuffer: undefined,
      };

      console.log(poorNew, "poornew");

      const tmpPoor = {
        ...this.imgPoor,
        [newSeriesId]: poorNew,
      };
      this.$store.commit("setImgPoor", tmpPoor);
      // 展示弹框
      this.splitList = [
        {
          studyInfo: newData,
          imgInfo: poorNew,
          checked: false,
        },
      ];
      this.showWarning = true;
      this.warningType = "addSeriesToUpload";
    },
    handleSeries(type) {
      console.log(type, "handle sereis");
      if (type === "split") {
        this.splitSeries();
      } else if (type === "add") {
        this.addSeries();
      }
    },
    handleShare() {
      this.showTitle = false;
      this.showWarning = true;
      this.warningType = "shareCode";
    },
    handleSplitList(list) {
      this.splitList = list;
    },
    // 上传后，更新图像id和seriesKeyId
    updateSeries(updateList) {
      const { series } = this.imageDataNow;
      const { SeriesIndex } = series;
      const studyDatas = this.$refs.serieslist.LISTDATA;
      let studyKey;
      for (let key in studyDatas) {
        const data = studyDatas[key].data.find(
          (item) => item.seriesId === SeriesIndex,
        );
        if (data) {
          studyKey = key;
          break;
        }
      }
      updateList.forEach((item) => {
        this.$refs?.serieslist?.LISTS?.[studyKey]?.data.forEach((j) => {
          if (item.timestamp === j.seriesId) {
            j.seriesKeyId = item.seriesKeyId;
            j.isUpload = "yes";
          }
        });
        this.imgPoor?.[item.timestamp]?.info?.instances?.forEach((v, i) => {
          v.id = item.instances[i].id;
        });
      });
      this.showWarning = false;
    },
    forceLoadImg(index, series) {
      const obj = getDataType();
      const type = obj.env?.toLocaleLowerCase() || "jh";
      NETLOADER.forceLoadStart(type, index, series);
    },
    // 刷新截图列表
    updateImageList() {
      if (this.showImageList) {
        this.$refs.imageList.getImgList();
      }
    },
    closeLoadingDialog() {
      console.log("close dialog");
      this.mprLayerShow && (this.mprLayerShow = false);
      this.mprLayerShow2 && (this.mprLayerShow2 = false);
      this.mprLayerShow3 && (this.mprLayerShow3 = false);
    },
    startAppendStudy(list) {
      const tempList = list
        .filter((item) => {
          return !this.studyInfos[item.id];
        })
        .map((item) => ({ ...item }));
      this.appendStudyList = this.appendStudyList.concat([...tempList]);

      this.appendStudyList.forEach((item) => {
        item.checked = false;
      });
      const envObj = getDataType();
      this.appendStudy(envObj, tempList);
      this.isLoadFullSeries = false;
    },
    async appendStudy(envObj, list) {
      if (!list.length) return;
      const id = list[0].studyInstanceUid;
      envObj.id = id;
      const { accessionNumber, orgId, keyName } = this.$route.query;
      if (orgId === "undefined" || !orgId) {
        envObj.orgId = "";
      } else {
        envObj.orgId = orgId;
      }
      if (accessionNumber === "undefined" || !accessionNumber) {
        envObj.accessionNumber = "";
      } else {
        envObj.accessionNumber = accessionNumber;
      }
      if (keyName === "undefined" || !keyName) {
        envObj.keyName = "";
      } else {
        envObj.keyName = keyName;
      }
      const data = await getYMData(envObj);
      data.forEach(async (item) => {
        const { seriesInfo } = item;
        const poor = await createImgPoor(seriesInfo);
        this.setImgPoor({
          ...this.imgPoor,
          [seriesInfo.SeriesIndex]: poor,
        });
      });
      this.forceLoadImg(0, {});
      list.shift();
      this.appendStudy(envObj, list);
    },
    async initViewerData() {
      const obj = getDataType();
      console.log("当前环境：", obj);

      const data = await getDataHandler(obj, this.$route.query);
      if (!data) return;
      const imgPoor = {};
      const studyKeys = Object.keys(this.studyInfos);
      const series = studyKeys.reduce((pre, cur) => {
        return pre.concat(this.studyInfos[cur].series);
      }, []);

      // 判断dicom list是否需要使用GB编码
      const patientName = this.studyInfos[studyKeys[0]]?.patient?.name;
      if (/[\u4e00-\u9fa5]/.test(patientName)) this.useGBDecode = true;

      data.reduce(async (pre, cur, index) => {
        await pre;
        const { seriesInfo } = cur;
        imgPoor[seriesInfo.SeriesIndex] = await createImgPoor(seriesInfo);
        this.setImgPoor(imgPoor);

        if (!this.isInitLayout) {
          const keys = Object.keys(imgPoor);
          if (!keys.length) return;
          // const series = val[keys[0]].studyInfo.series;
          this.initLayoutBySeries(series, keys);
        }
        // 获取标注信息
        DATA.getMarks(this, seriesInfo, seriesInfo.SeriesIndex);
        return cur;
      }, 0);
    },
    initLayout(seriesIDs, isCycle) {
      const vpSizeList = this.getViewportSize(this.initLayoutNum);
      if (!vpSizeList) throw new Error(`未定义的布局: ${this.initLayoutNum}`);
      let vpKeyList = Object.keys(this.viewportList);
      // let initial = this.viewportList[vpKeyList[0]];
      for (let i = 0; i < vpSizeList.length; i++) {
        const vp = this.viewportList[vpKeyList[i]];
        const vpSize = vpSizeList[i];
        if (vp) {
          vp.viewportSize = vpSize;
          vp.currentSID = seriesIDs[i];
          const res = DATA.currentSID(this);
          // const currStudyId = this.$refs.serieslist.selectStudy._id;
          // const currSeriesList = this.seriesList[currStudyId]["data"];
          // const sid = currSeriesList[0].seriesId;
          const { imageData_now: imageData, seriesInfo_now: seriesInfo } = res;
          // const seriesInfo = this.imgPoor[seriesIDs[0]].info;
          vp.seriesInfos = [{ ...seriesInfo }];

          const initCurrSeries = vp.seriesInfos[0];
          let {
            AcrossPoint,
            initViewMod,
            centerIndex,
            totalNumber,
            DWIUID,
            APRange,
          } = CROSS.getInitAcrossPoint(initCurrSeries);
          imageData.curViewMod = initViewMod;
          imageData.curImageNum = centerIndex;
          imageData.imageNum = totalNumber;
          imageData.DWIUID = DWIUID;
          vp.AcrossPoint = AcrossPoint;
          vp.imageDatas = [imageData];
          vp.APRange = APRange;
          // 重复调用了，后面reSize的时候会获取，注释掉
          // this.setFullScaleForNow(vp);
        } else {
          // 初始化新视口;
          const lastViewport = this.initViewport({
            canvasSize: [vpSize],
            identifiedSID: seriesIDs[i],
          });
          lastViewport.viewportSize = vpSize;

          if (this.viewportListBefore.length) {
            this.setViewportBefore(lastViewport, i);
          }
          const viewportID = lastViewport.viewportID;
          this.$set(this.viewportList, viewportID, lastViewport);
        }
      }
      this.viewportHelper.seriesIdList = seriesIDs;
      this.viewportHelper.isCycle = isCycle;
      // 从MPR退出，不调整scale的大小
      if (!this.viewportListBefore.length) {
        this.reSize();
      } else {
        this.reSizeWithoutSetFull();
      }
      this.layoutNum = this.initLayoutNum;
      //强制启动一个loading进程
      this.forceLoadImg();
    },
    // 读取进入MPR之前的viewport数据
    setViewportBefore(lastViewport, index) {
      const dataBeforeMPR = this.viewportListBefore[index];
      if (dataBeforeMPR.gridNum > 1) {
        for (let i = 0; i < Math.floor(dataBeforeMPR.gridNum) - 1; i++) {
          // 增加多出来的新数据
          const imageData = {
            ...lastViewport.imageDatas[0],
            translate: { x: 0, y: 0 },
            magnifyPoint: { x: -1, y: -1 },
            img: document.createElement("canvas"),
            dataWithInfo: {
              pixelSpacingX: null,
              pixelSpacingY: null,
              pixelSpacingZ: null,
            },
          };
          lastViewport.imageDatas.push(imageData);
          lastViewport.seriesInfos.push({ ...lastViewport.seriesInfos[0] });
        }
      }
      lastViewport.gridNum = dataBeforeMPR.gridNum;
      lastViewport.AcrossPoint = dataBeforeMPR.AcrossPoint;
      lastViewport.imageDatas.forEach((v, i) => {
        const imageData = dataBeforeMPR.imageDatas[i];
        v.curImageNum = imageData.curImageNum;
        v.imageNum = imageData.imageNum;
        v.curViewMod = imageData.curViewMod;
        v.colormapIndex = imageData.colormapIndex;
        v.rotate = imageData.rotate;
        v.scale = imageData.scale;
        v.translate = imageData.translate;
        v.ww = imageData.ww;
        v.wl = imageData.wl;
        v.defaultFlag = imageData.defaultFlag;
        v.DWIUID = imageData.DWIUID;
      });
    },
    //在这里更新配准参数
    updateRegParaAll() {
      this.toOriginViewportList();
    },
    toOriginViewportList() {
      this.viewportList = {};
      const keys = Object.keys(this.imgPoor);
      if (!keys.length) return;
      let series = [];
      for (let key in this.studyInfos) {
        series = series.concat(this.studyInfos[key].series);
      }
      this.initLayoutBySeries(series, keys);
      this.viewportID = Object.keys(this.viewportList)[0];
    },

    ...mapMutations(["changeTheme"]),

    updateCurrWWWL(obj) {
      this.currViewport.imageDatas[0].ww = obj.ww;
      this.currViewport.imageDatas[0].wl = obj.wl;
    },
    updateRoi(fn) {
      if (fn) {
        fn();
      }
      this.roiShow++;
    },
    //横竖屏 参数更新
    setCanvasRange(flag) {
      const toolbar = this.$refs.toolbar.$el;
      const toolbarHeight = toolbar.offsetHeight;
      const seriesList = this.$refs.serieslist;
      let RBRightWidth, RBLeftWidth, RBTopWidth, RBBottomWidth;
      RBRightWidth = 0;
      RBBottomWidth = 0;
      if (this.isVertical()) {
        // RBLeftWidth = 0;
        this.vertical = true;
      } else {
        // const seriesWidth = seriesList.$el.children[0].offsetWidth;
        // RBLeftWidth = seriesWidth + 1;
        this.vertical = false;
      }
      RBTopWidth = toolbarHeight;
      const seriesWidth = seriesList.$el.children[0].offsetWidth;
      RBLeftWidth = seriesWidth + 1;

      // series list在底部时，左侧、右侧都没有任何内容
      if (this.seriesListPos === "BOTTOM") {
        const seriesHeight = seriesList.$el.children[1].offsetHeight;
        RBBottomWidth = seriesHeight;
        RBLeftWidth = 0;
      }

      if (this.square) {
        //算中间区域的宽高
        let { clientWidth, clientHeight } = this.$refs.viewer;
        let width = clientWidth - RBLeftWidth - RBRightWidth;
        let height = clientHeight - RBBottomWidth - RBTopWidth;
        if (width > height) {
          //空白填充
          let w = Math.round((width - height) / 2);
          RBLeftWidth = RBLeftWidth + w;
          RBRightWidth = RBRightWidth + w;
        } else {
          let h = Math.round((height - width) / 2);
          RBTopWidth = RBTopWidth + h;
          RBBottomWidth = RBBottomWidth + h;
        }
      }
      this.canvasRange.RBRightWidth = RBRightWidth;
      this.canvasRange.RBLeftWidth = RBLeftWidth;
      this.canvasRange.RBTopWidth = RBTopWidth;
      this.canvasRange.RBBottomWidth = RBBottomWidth;
      if (flag === "AIshow" && !this.vertical) {
        //只在横屏状态下做调整
        this.canvasRange.RBRightWidth = 630;
      }

      // 设置viewportSize
      const vpNum = Object.keys(this.viewportList).length;
      if (vpNum >= 1) {
        const vpSizeList = this.getViewportSize(vpNum);
        for (const vpID in this.viewportList) {
          const vp = this.viewportList[vpID];
          vp.viewportSize = vpSizeList.shift();
        }
      }
    },

    getGridFuncName(num) {
      let obj = {
        1: "oneGridForGrid",
        2: "twoGridForGrid",
        "2.0": "twoGridForGrid2",
        3: "threeGridForGrid",
        4: "fourGridForGrid",
        5: "fiveGridForGrid",
        6: "sixGridForGrid",
        9: "nineGridForGrid",
        12: "twelveGridForGrid",
        18: "eighteenGridForGrid",
        20: "twentyGridForGrid",
        24: "twelveFourGridForGrid",
        30: "thirtyGridForGrid",
        "3.0": "three2GridForGrid",
        3.1: "three3GridForGrid",
        3.2: "three3GridForGrid",
        "4.0": "four2GridForGrid",
        4.1: "four3GridForGrid",
        "6.0": "sixGrid2ForGrid",
      };
      return obj[num];
    },
    reSize() {
      const vpNum = Object.keys(this.viewportList).length;
      if (vpNum <= 0) return;

      this.$nextTick(() => {
        let { fullGridIndex, fullVPID } = this.canvasRange;
        for (const vpID in this.viewportList) {
          let dom = document.querySelector("#viewport-" + vpID);
          if (!dom) return;

          const vpData = this.viewportList[vpID];
          const vpGridNum = vpData.gridNum;
          const funcName = this.getGridFuncName(vpGridNum);
          const canvasSizeList = LAYOUT[funcName](this, dom);
          //在这里调用全屏
          vpData.canvasSize = canvasSizeList;
          if (
            fullGridIndex != undefined &&
            fullVPID != undefined &&
            vpID == fullVPID
          ) {
            vpData.canvasSize[fullGridIndex] = LAYOUT.getFullScreen(
              this.screenshotRange.width,
              this.screenshotRange.height,
            );
          }
          //在这里调整scale的大小
          this.setFullScaleForNow(vpData);
        }
      });
    },
    // setFullScaleForNow在nextTick里面调用，所以不能在reSize里面判断是否执行
    reSizeWithoutSetFull() {
      const vpNum = Object.keys(this.viewportList).length;
      if (vpNum <= 0) return;

      this.$nextTick(() => {
        let { fullGridIndex, fullVPID } = this.canvasRange;
        for (const vpID in this.viewportList) {
          let dom = document.querySelector("#viewport-" + vpID);
          if (!dom) return;

          const vpData = this.viewportList[vpID];
          const vpGridNum = vpData.gridNum;
          const funcName = this.getGridFuncName(vpGridNum);
          const canvasSizeList = LAYOUT[funcName](this, dom);
          //在这里调用全屏
          vpData.canvasSize = canvasSizeList;
          if (
            fullGridIndex != undefined &&
            fullVPID != undefined &&
            vpID == fullVPID
          ) {
            vpData.canvasSize[fullGridIndex] = LAYOUT.getFullScreen(
              this.screenshotRange.width,
              this.screenshotRange.height,
            );
          }
        }
      });
    },
    renderError() {
      console.log("render error");
      this.showWarning = true;
      this.warningType = "reformationFail";
    },
    layerConfirm() {
      if (
        this.warningType === "uploadSeries" ||
        this.warningType === "addSeriesToUpload"
      ) {
        this.$refs.layerSplit.handleUpload();
        return;
      }
      if (this.warningType === "shareCode") {
        this.showTitle = true;
      }
      if (this.warningType === "reformationFail") {
        if (this.isInMPR) this.isInMPR = false;
        else if (this.isInCPR) this.isInCPR = false;
        else if (this.isInVR) this.isInVR = false;
      }
      this.showWarning = false;
    },

    saveMarks(seriesId, fn) {
      DATA.saveMarks(this, seriesId, fn);
    },
    delMarks(ID) {
      DATA.delMarks(this, ID);
    },
    //标注定位
    setMarkPosi(item) {
      let { currentSID, curViewMod, AcrossPoint } = CROSS.decodeDWIUID(
        item.DWIUID,
      );
      let { canvasNow, series } = this.imageDataNow;
      if (series.currentSID === currentSID) {
        //设定十字的位置和状态
        this.currViewport.AcrossPoint = {
          ...this.currViewport.AcrossPoint,
          ...AcrossPoint,
        };
        CLICKOPT.changeViewMod(this, canvasNow, curViewMod);
      }
    },
    //修改vr参数
    changeVRPara(para) {
      const cvp = this.currViewport;
      const canvasNow = cvp.canvasNow;
      const imageDatas = cvp.imageDatas;
      // 当前viewport下所有的imageData都使用一个presetName

      let imageData = imageDatas[canvasNow];
      imageDatas.forEach((item) => (item.presetName = para.presetName));
      // imageData.presetName = para.presetName;
      imageDatas.splice(canvasNow, 1, { ...imageData });
    },
    changeThickness({ thickness }) {
      let newthickness = Number(thickness);
      let seriesInfos, canvasNow;
      const cvp = this.currViewport;
      seriesInfos = cvp.seriesInfos;
      canvasNow = cvp.canvasNow;

      let seriesInfo = seriesInfos[canvasNow];

      //建立一个数组存所有的需要被更改的层厚
      let infoNeedBeChange = [];
      infoNeedBeChange.push(seriesInfo);

      //如果是融合数据，融合的对应原始信息也要改层厚
      let SID = seriesInfo.currentSID;

      //当前可见的其他同SID的seriesInfo也要给被改层厚

      for (let i = 0; i < seriesInfos.length; i++) {
        if (seriesInfos[i].currentSID === SID) {
          infoNeedBeChange.push(seriesInfos[i]);
        }
      }

      //一次性改完所有需要改层厚的数据
      for (let i = 0; i < infoNeedBeChange.length; i++) {
        let { pixelSpacing } = infoNeedBeChange[i];
        for (let mod = 0; mod < 3; mod++) {
          pixelSpacing[mod].thickness = newthickness;
        }
      }
    },
    //修改窗宽窗位
    changeValue(ww, wl) {
      let imageData;
      const cvp = this.currViewport;
      const { imageDatas, canvasNow } = cvp;
      imageData = { ...imageDatas[canvasNow], defaultFlag: false };

      imageData.ww = ww;
      imageData.wl = wl;

      imageDatas.splice(canvasNow, 1, { ...imageData });
    },
    getStudyId(seriesId) {
      let serieslist = this.$refs.serieslist;
      let res = serieslist.getStudyId(seriesId);
      return res;
    },
    delAllMark() {
      const cvp = this.currViewport;
      const ieditlist = this.ieditListData[cvp.currentSID];
      DATA.delAllMarks(this, ieditlist);
    },
    setWWWLByHotKey(id) {
      CLICKOPT.setWWWLByOneKey(this, id);
    },
    //拖动
    moveFn(e) {
      MINOPT.moveFn(this, e);
    },
    scaleFn(index, e) {
      MINOPT.scaleFn(this, index, e);
    },
    changeVie() {
      MINOPT.changeVie(this);
    },
    /**
     * 隐藏指定的AI分析标注
     * @param hiddenMap
     */
    hiddenAnalysis(hiddenMap) {
      const anaylysisIDList = Object.keys(hiddenMap).map(Number);
      this.hiddenIDList = anaylysisIDList;

      // 刷新render组件
      this.$nextTick(() => {
        this.$refs["render"][0].reflashImg();
      });
    },

    /**
     * 跳转到指定页面
     * @param analysis
     */
    skip2Num(analysis) {
      const instanceNumber = analysis.instanceNumber;
      const imageData = { ...this.imageDatas[this.canvasNow] };
      imageData.curImageNum = instanceNumber;
      // console.log("跳转页面", imageData.curImageNum); // debug
      this.$set(this.imageDatas, this.canvasNow, imageData);
    },

    /**
     * 当前是否属于竖屏模式
     * @return {boolean}
     */
    isVertical() {
      let { innerWidth } = window;
      const vertialFlag = innerWidth <= 1175;
      return vertialFlag;
    },

    setScreenshotRange() {
      let { clientWidth, clientHeight } = document.body;
      this.screenshotRange.top = this.canvasRange.RBTopWidth;
      this.screenshotRange.left = this.canvasRange.RBLeftWidth;
      this.screenshotRange.width =
        clientWidth -
        this.canvasRange.RBLeftWidth -
        this.canvasRange.RBRightWidth;
      this.screenshotRange.height =
        clientHeight -
        this.canvasRange.RBBottomWidth -
        this.canvasRange.RBTopWidth;
    },

    getViewportItem() {
      const randomStr = this.$randomStr();
      const initViewPortData = {
        // 确定必须要保留的字段
        type: "single",
        gridNum: 1,
        gridMod: 0, // 0隐藏, 3MPR, PET3, PET4, PET12, ...
        viewportSize: LAYOUT.oneGrid(this, this.$refs.viewer)[0],
        AcrossPoint: undefined,
        seriesInfos: [],
        imageDatas: [],
        canvasNow: 0,
        canvasSize: [],
        currentSID: "0",
        // 标注
        iediting: false, // 是否标注中
        ieditActive: null, // hover激活标注的ID
        ieditIndex: null, // -1为标注信息
        CPRVoiListData: {}, // CPR三维标注

        // 未确定
        renderDataList: {},
        //把id存到对象里方便引用
        viewportID: randomStr,
        addIntoSynic: false,
        addIntoSynicDisable: false,
        manualLinkNum: undefined, // 记录添加到关联翻页的对齐页码，注意这里是显示页码
        regFlag: false, // 配准按钮开关
      };
      return {
        viewportID: randomStr,
        viewportData: initViewPortData,
      };
    },

    changeSIDSync(sid) {
      const cvp = this.currViewport;
      this.priorSid = sid;

      if (this.isInCPR || this.isInMPR || this.isInVR) {
        this.isInCPR = false;
        this.isInMPR = false;
        this.isInVR = false;
        this.$nextTick(() => {
          this.changeSIDSync(sid);
        });
        return;
      }

      // 布局正在使用模板且单模切换
      if (sid.length < 32 && cvp.gridMod && !this.imgPoor[sid].imageDone) {
        // 未加载完等待加载
        this.openGridModLayer(sid);
        return;
      }

      // 拖拽当前series直接返回
      if (cvp.currentSID && cvp.currentSID === sid) return;

      cvp.currentSID = sid;
      const resp = DATA.currentSID(this);
      let { seriesInfo_now, imageData_now } = resp;
      if (!seriesInfo_now || !imageData_now) return;
      console.log("go into then changeSIDSync", seriesInfo_now.isMissInfo);

      // 缺失信息的数据，不开启布局之间的联动
      if (seriesInfo_now.isMissInfo) {
        this.viewportList[this.viewportID]["addIntoSynicDisable"] = true;
      } else {
        this.viewportList[this.viewportID]["addIntoSynicDisable"] = false;
      }
      this.viewportList[this.viewportID]["addIntoSynic"] = false;

      //注意在这里把所有的imagedatas都重置好了之后，才触发render的更新
      const { imageDatas, seriesInfos, canvasNow } = cvp;
      let {
        AcrossPoint,
        initViewMod,
        centerIndex,
        totalNumber,
        DWIUID,
        APRange,
      } = CROSS.getInitAcrossPoint(seriesInfo_now);
      cvp.AcrossPoint = AcrossPoint;
      cvp.APRange = APRange;
      imageData_now.curViewMod = initViewMod;
      imageData_now.curImageNum = centerIndex;
      imageData_now.imageNum = totalNumber;
      imageData_now.DWIUID = DWIUID;
      this.$set(imageDatas, canvasNow, imageData_now);
      this.$set(seriesInfos, canvasNow, seriesInfo_now);
      //在这里初始化imageData_now的大小
      this.setFullScaleForNow(cvp);
      for (let i = 0; i < imageDatas.length; i++) {
        const seriesInfo = { ...seriesInfos[canvasNow] };
        const imageData = {
          ...imageDatas[canvasNow],
          scale: { ...imageDatas[canvasNow]["scale"] },
          translate: { ...imageDatas[canvasNow]["translate"] },
          magnifyPoint: { ...imageDatas[canvasNow]["magnifyPoint"] },
          dataWithInfo: { ...imageDatas[canvasNow]["dataWithInfo"] },
          img: document.createElement("canvas"),
        };
        this.$set(seriesInfos, i, seriesInfo);
        this.$set(imageDatas, i, imageData);
      }

      // 模板视图下
      Mod.gridMod(this, cvp.gridMod);
      // 融合
      console.log("then changeSIDSync finished");
      // 切换序列时，根据viewport.regFlag的值来判定是否展示配准后的图像
      this.setSeriesInfo(this.viewportID);
    },
    getCurManualLinkNum(viewport) {
      //总是以第0个窗口做对齐
      const { imageDatas, seriesInfos } = viewport;
      let imageData = imageDatas[0];
      let seriesInfo = seriesInfos[0];

      let { curImageNum, imageNum, curViewMod } = imageData;
      let { volumeSpacing } = seriesInfo;
      let showCur = curImageNum;
      let showTotal = imageNum;
      if (volumeSpacing) {
        let { d: dp, thickness } = volumeSpacing[curViewMod];
        let dimStep = Number((thickness / dp).toFixed(2));
        showTotal = Math.floor(imageNum / dimStep);
        showCur = Math.floor(curImageNum / dimStep);
      }
      return {
        showCur,
        showTotal,
      };
    },

    updateManualLinkNum(viewportID) {
      const viewportNow = this.viewportList[viewportID];
      const { showCur: showCur_now, showTotal: showTotal_now } =
        this.getCurManualLinkNum(viewportNow);
      const vpKeyList = Object.keys(this.viewportList);
      const vpNum = vpKeyList.length;
      const linkRecord = [];
      for (let i = 0; i < vpNum; i++) {
        if (viewportID == vpKeyList[i]) continue;
        const vp = this.viewportList[vpKeyList[i]];
        if (vp.addIntoSynic) {
          linkRecord.push({
            viewportID: vp.viewportID,
          });
        }
      }
      if (linkRecord.length == 0) {
        viewportNow.manualLinkNum = showCur_now;
      } else if (linkRecord.length == 1) {
        //需要更新当前
        viewportNow.manualLinkNum = showCur_now;
        //还需要更新之前添加的那一个
        const viewportBefore = this.viewportList[linkRecord[0].viewportID];
        const { showCur: showCur_before, showTotal: showTotal_before } =
          this.getCurManualLinkNum(viewportBefore);
        viewportBefore.manualLinkNum = showCur_before;
      } else {
        //linkRecord.length>1 的情况
        const viewportBefore = this.viewportList[linkRecord[0].viewportID];
        const { showCur: showCur_before, showTotal: showTotal_before } =
          this.getCurManualLinkNum(viewportBefore);
        const step = viewportBefore.manualLinkNum - showCur_before; //计算相对于初始添加当前翻动了多少页
        let num = showCur_now + step; //计算当前翻动了多少页
        if (num < 0) num = 0;
        if (num > showTotal_now - 1) num = showTotal_now - 1;
        //更新当前添加
        viewportNow.manualLinkNum = num;
      }
      //打印更新结果, 这个函数的作用是为了保证加入同步的vp都相对一个初始值，以便后续处理翻页
      //   for (let i = 0; i < vpNum; i++) {
      //     const vp = this.viewportList[vpKeyList[i]];
      //     if (vp.addIntoSynic) {
      //       console.log(i, vp.viewportID, "manualLinkNum:", vp.manualLinkNum);
      //     }
      //   }
    },
    syncVPAcorssPoint() {
      console.log("go into sync acrosspoint for all viewport");
      const vpKeyList = Object.keys(this.viewportList);
      const vpNum = vpKeyList.length;
      let curAP = this.currViewport.AcrossPoint;

      //当前视口在同步列表里，才需要进一步计算
      if (this.currViewport.addIntoSynic) {
        //同步十字位置
        if (this.isAutoLinkout) {
          console.log("go into sync acrosspoint for all viewport");
          for (let i = 0; i < vpNum; i++) {
            if (this.viewportID == vpKeyList[i]) continue;
            const viewport = this.viewportList[vpKeyList[i]];
            // 判断当前AP是否在目标viewport的范围内，如果不在范围内，则不同步AP
            if (viewport.APRange && !isInsideRange(curAP, viewport.APRange)) {
              continue;
            }
            if (this.viewportList[vpKeyList[i]].addIntoSynic) {
              this.viewportList[vpKeyList[i]].AcrossPoint = {
                ...this.viewportList[vpKeyList[i]].AcrossPoint,
                x: curAP.x,
                y: curAP.y,
                z: curAP.z, //只同步十字中心点的位置,这里始终是世界坐标系下的绝对坐标
              };
            }
          }
        }

        //同步页码
        if (this.isManualLinkout) {
          console.log("go into syncPageManual for all viewport");
          const { showCur } = this.getCurManualLinkNum(this.currViewport);
          let curStep = showCur - this.currViewport.manualLinkNum; //计算从打节点到当前视口的翻页数
          for (let i = 0; i < vpNum; i++) {
            if (this.viewportID == vpKeyList[i]) continue;
            const viewport = this.viewportList[vpKeyList[i]];
            const { showCur: showCurNow, showTotal } =
              this.getCurManualLinkNum(viewport);
            let targetNum = viewport.manualLinkNum + curStep; //计算目标视口的翻页数
            if (targetNum < 0) targetNum = 0; //不能小于0
            if (targetNum > showTotal - 1) targetNum = showTotal - 1; //不能大于总数
            const pageStep = targetNum - showCurNow; //计算翻页数
            if (viewport.addIntoSynic) {
              ACTIVEOPT.scrollHandle(viewport, pageStep);
            }
          }
        }
      }

      //所有的十字作坐标更新一下，触发render的强制刷新，更新定位线
      for (let i = 0; i < vpNum; i++) {
        if (this.viewportID == vpKeyList[i]) continue;
        this.viewportList[vpKeyList[i]].AcrossPoint = {
          ...this.viewportList[vpKeyList[i]].AcrossPoint,
          forcePosLineReflash: new Date().getTime(),
          curViewMod: curAP.curViewMod,
        };
      }
    },

    // 点击配准开关，更新seriesInfo
    setSeriesInfo(id) {
      let viewport = this.viewportList[id];
      let currentSID = viewport.currentSID;
      let registPara = viewport.regFlag
        ? this.imgPoor[currentSID].registPara
        : null;
      let arr = [],
        arr1 = [];
      for (let i = 0; i < viewport.seriesInfos.length; i++) {
        arr[i] = DATA.updataSeriesInfo(
          this.imgPoor[currentSID].info,
          registPara,
        );
        // 更新imageData
        let imageData = { ...viewport.imageDatas[i] };
        arr1[i] = CROSS.asyncImageData(imageData, viewport.AcrossPoint, arr[i]);
      }
      this.viewportList[id].seriesInfos = arr;
      this.viewportList[id].imageDatas = arr1;
    },

    /**
     * 根据布局个数，返回对应个数的viewport尺寸数组
     * @param num {string | number} 布局个数
     * @return {[]}
     */
    getViewportSize(num) {
      switch (num) {
        case 1:
          return Layout.oneGrid(this, this.$refs.viewer);
        case 2:
          return Layout.twoGrid(this, this.$refs.viewer);
        case "2.0":
          return Layout.twoGrid2(this, this.$refs.viewer);
        case 3:
          return Layout.threeGrid(this, this.$refs.viewer);
        case 4:
          return Layout.fourGrid(this, this.$refs.viewer);
        case 6:
          return Layout.sixGrid(this, this.$refs.viewer);
        case "6.0":
          return Layout.sixGrid2(this, this.$refs.viewer);
        case 9:
          return Layout.nineGrid(this, this.$refs.viewer);
        case 12:
          return Layout.twelveGrid(this, this.$refs.viewer);
        case 18:
          return Layout.eighteenGrid(this, this.$refs.viewer);
        case 20:
          return Layout.twentyGrid(this, this.$refs.viewer);
        case 24:
          return Layout.twelveFourGrid(this, this.$refs.viewer);
        case 30:
          return Layout.thirtyGrid(this, this.$refs.viewer);
      }
    },

    /**
     * 更改vieport布局个数
     * @param num {number | string} 布局个数名称
     */
    changeLayout(num) {
      const vpSizeList = this.getViewportSize(num);
      let vpKeyList = Object.keys(this.viewportList); // viewportID数组
      const vpNum = vpKeyList.length;
      console.log(vpKeyList, "当前vpKeyList");

      // 由多变少
      if (vpSizeList.length < vpNum) {
        // 将vpKeyList第一个设置为this.viewportID，其他的按顺序排列在后
        let retainKey = [];
        const currIndex = vpKeyList.findIndex((key) => key === this.viewportID);
        retainKey = vpKeyList.slice(currIndex);
        if (retainKey.length !== vpKeyList.length) {
          retainKey.push(
            ...vpKeyList.slice(0, vpKeyList.length - retainKey.length),
          );
        }
        vpKeyList = retainKey;

        const copyViewList = {};
        for (let j = 0; j < vpKeyList.length; j++) {
          const vpSize = vpSizeList[j];
          const vpID = vpKeyList[j];
          const vpData = this.viewportList[vpID];
          if (j < num) {
            vpData.viewportSize = vpSize;
            copyViewList[vpID] = vpData;
          }
        }
        this.viewportList = copyViewList;

        this.reSize();
        return;
      }

      // 由少变多
      this.initViewportHepler();
      for (let i = 0; i < vpSizeList.length; i++) {
        const vpSize = vpSizeList[i];
        const vpID = vpKeyList[i];
        if (vpID) {
          // 更改视口尺寸
          const vpData = this.viewportList[vpID];
          vpData.viewportSize = vpSize;
        } else {
          // 初始化新视口
          const lastViewport = this.initViewport(
            this.viewportList[vpKeyList[i - 1]],
          );
          lastViewport.viewportSize = vpSize;
          const viewportID = lastViewport.viewportID;
          this.$set(this.viewportList, viewportID, lastViewport);
          vpKeyList.push(viewportID);
        }
      }
      this.destoryViewportHelper();
      this.reSize();
      this.layoutNum = num;
    },

    initViewport(data) {
      const { viewportData: initViewport } = this.getViewportItem();
      // const currStudyId = this.$refs.serieslist.selectStudy._id;
      // const currSeriesList = this.seriesList[currStudyId]["data"];
      initViewport.canvasNow = 0;
      initViewport.gridNum = 1;
      initViewport.canvasSize = [{ ...data.canvasSize[0] }];

      let nextIndex = -1;
      const seriesIds = Object.keys(this.imgPoor);

      const { identifiedSID } = data;

      if (identifiedSID) {
        nextIndex = seriesIds.findIndex((item) => item === identifiedSID);
        if (nextIndex === -1) throw TypeError("nextIndex不应该为-1错误");
      } else {
        // 获取seriesList列表中的下一个series的index
        let dataSeriesId = data.currentSID;

        let index = seriesIds.findIndex((item) => item === dataSeriesId);
        nextIndex = index + 1;
        if (index === seriesIds.length - 1) nextIndex = 0;
        // for (let i = 0; i < seriesIds.length; i++) {
        //   // const series = currSeriesList[i];
        //   if (seriesIds[i] !== dataSeriesId) continue;
        //   nextIndex = i + 1;
        //   if (i === seriesIds.length - 1) nextIndex = 0;
        //   break;
        // }
        if (nextIndex === -1) throw TypeError("nextIndex不应该为-1错误");
        if (!this.viewportHelper.isCycle) {
          // 未闭合需要获取下一个为未在viewport中出现的seriesID
          let nextSID = seriesIds[nextIndex];
          while (this.viewportHelper.seriesIdList.includes(nextSID)) {
            nextIndex++;
            if (nextIndex >= seriesIds.length) nextIndex = 0;
            if (!seriesIds[nextIndex]) throw TypeError("nextIndex越界错误");
            nextSID = seriesIds[nextIndex];
          }
        }
      }
      // 此时的sid 要么是有闭合允许存在重复，要么未闭合则不能出现重复sid
      const nextSID = seriesIds[nextIndex];
      const registPara = this.imgPoor[nextSID].registPara;
      console.log("set registPara to seriesInfo", nextSID, registPara);

      const nextSeriesInfo = DATA.updataSeriesInfo(
        this.imgPoor[nextSID].info,
        null,
      );
      initViewport.currentSID = nextSID;
      initViewport.seriesInfos = [{ ...nextSeriesInfo, registPara }];
      const initCurrSeries = initViewport.seriesInfos[0];

      // 8位彩图:不开启布局之间的联动
      // 缺失信息的数据，不开启布局之间的联动
      if (initCurrSeries.isMissInfo) {
        initViewport.addIntoSynicDisable = true;
      } else {
        initViewport.addIntoSynicDisable = false;
      }
      initViewport.addIntoSynic = false;

      let imageData = {
        ...DATA.imageData,
        scale: { x: 1, y: 1 },
        translate: { x: 0, y: 0 },
        magnifyPoint: { x: -1, y: -1 },
        img: document.createElement("canvas"),
        curViewMod: initCurrSeries.initViewMod,
        ww: initCurrSeries.ww,
        wl: initCurrSeries.wl,
        dataWithInfo: {
          pixelSpacingX: null,
          pixelSpacingY: null,
          pixelSpacingZ: null,
        },
      };

      // 反转伪彩
      if (initCurrSeries.needInverse) {
        imageData.colormapIndex = "B&W Inverse";
        imageData.colormapSaveIndex = "B&W Inverse";
      }
      let {
        AcrossPoint,
        initViewMod,
        centerIndex,
        totalNumber,
        DWIUID,
        APRange,
      } = CROSS.getInitAcrossPoint(initCurrSeries);
      initViewport.AcrossPoint = AcrossPoint;
      initViewport.APRange = APRange;
      imageData.curViewMod = initViewMod;
      imageData.curImageNum = centerIndex;
      imageData.imageNum = totalNumber;
      imageData.DWIUID = DWIUID;

      // 初始化窗宽窗位
      if (["PT", "NM", "OA"].includes(initCurrSeries.model)) {
        imageData.colormapIndex = "B&W Inverse";
        imageData.colormapSaveIndex = "B&W Inverse";
        if (initCurrSeries.model === "PT") {
          //更新SUV值对应的快捷键表
          DATA.upDateSUVTable(this, initCurrSeries);
        }
      } else if (initCurrSeries.model === "MR") {
        if (initCurrSeries.dynamic) {
          imageData.ww = initCurrSeries.dynamic.ww;
          imageData.wl = initCurrSeries.dynamic.wl;
        }
        // 先设置curImageNum，再来执行这一步
        DATA.getOneWLS(imageData, initCurrSeries);
      }

      initViewport.imageDatas = [imageData];
      initViewport.CPRVoiListData = {};
      initViewport.iediting = false;
      initViewport.ieditActive = null;
      initViewport.ieditIndex = null;
      // 初始化vieport数据的时候不需要获取scale，后面reSize的时候会获取，注释掉
      // this.setFullScaleForNow(initViewport);

      // 记录viewportHelper
      this.viewportHelper.seriesIdList.push(nextSID);
      this.validateViewportHelper();
      // console.log(JSON.stringify(this.viewportHelper));
      return initViewport;
    },

    initViewportHepler() {
      // 记录所有sid
      for (const viewportId in this.viewportList) {
        const viewport = this.viewportList[viewportId];
        this.viewportHelper.seriesIdList.push(viewport.currentSID);
      }
      this.validateViewportHelper();
      console.log("初始化");
    },

    validateViewportHelper() {
      // 判读是否闭合
      // const currStudyId = this.$refs.serieslist.selectStudy._id;
      if (
        Object.keys(this.viewportHelper.seriesIdList).length >=
        Object.keys(this.imgPoor).length
      ) {
        this.viewportHelper.isCycle = true;
      }
    },

    destoryViewportHelper() {
      this.viewportHelper = {
        seriesIdList: [],
        isCycle: false,
      };
    },

    setFullScaleForNow(vpData) {
      let { seriesInfos, imageDatas, canvasNow, canvasSize } = vpData;
      if (canvasNow === undefined || imageDatas.length <= 0) return;
      //用新的canvasSize对当前数据做大小的归一化
      let scale = CLICKOPT.getFullScale(
        canvasSize[canvasNow],
        imageDatas[canvasNow].curViewMod,
        seriesInfos[canvasNow],
        imageDatas[canvasNow].curImageNum,
      );
      imageDatas[canvasNow].scale = scale;
    },

    /**
     * 更改栅格数
     */
    changeCurrGridNum() {
      const vpData = this.currViewport;
      let { gridNum, seriesInfos, imageDatas, canvasNow } = vpData;
      let length = seriesInfos.length;
      const dom = document.querySelector("#viewport-" + this.viewportID);
      const funcName = this.getGridFuncName(gridNum);
      const canvasSizeList = LAYOUT[funcName](this, dom);
      vpData.canvasSize = canvasSizeList;

      // 停留在全屏切换珊格时，取消全屏
      const canvasRange = this.canvasRange;
      if (
        canvasRange.fullVPID != undefined &&
        canvasRange.fullGridIndex != undefined
      ) {
        canvasRange.fullVPID = undefined;
        canvasRange.fullGridIndex = undefined;
      }
      this.canvasRange = { ...canvasRange };

      // 由多变少:以当前选中的imageDatas[canvasNow]为起点，数量为gridNum
      if (gridNum < length) {
        vpData.canvasNow = 0;
        let endIndex = canvasNow + gridNum;
        if (endIndex > length) endIndex = length;
        vpData.seriesInfos = seriesInfos.slice(canvasNow, canvasNow + gridNum);
        if (vpData.seriesInfos.length < gridNum) {
          const seriesList = seriesInfos.slice(
            0,
            gridNum - vpData.seriesInfos.length,
          );
          vpData.seriesInfos.push(...seriesList);
        }
        vpData.imageDatas = imageDatas.slice(canvasNow, canvasNow + gridNum);
        if (vpData.imageDatas.length < gridNum) {
          const imagesList = imageDatas.slice(
            0,
            gridNum - vpData.imageDatas.length,
          );
          vpData.imageDatas.push(...imagesList);
        }
      } else {
        // 由少变多
        let seriesInfoNow = { ...seriesInfos[canvasNow] };
        let imageDataNow = { ...imageDatas[canvasNow] };
        for (let i = 0; i < Math.floor(gridNum); i++) {
          // 更新已存在的面
          if (i < length) {
            continue;
          }

          // 增加多出来的新数据
          const imageData = {
            ...imageDataNow,
            translate: { x: 0, y: 0 },
            magnifyPoint: { x: -1, y: -1 },
            img: document.createElement("canvas"),
            dataWithInfo: {
              pixelSpacingX: null,
              pixelSpacingY: null,
              pixelSpacingZ: null,
            },
          };
          seriesInfos.push(seriesInfoNow);
          imageDatas.push(imageData);
        }
      }
      this.setFullScaleForNow(vpData);
    },

    changeSquare() {
      this.square = !this.square;
      localStorage.setItem("square", this.square);
      this.setCanvasRange();
    },

    /**
     * 切换选中布局的ID
     * @param currentSID {string?}
     */
    updateCurrViewportID({ currentSID, viewportID, canvasNow }) {
      const lastViewportId = this.viewportID;
      this.viewportID = viewportID;
      const viewport = this.viewportList[this.viewportID];
      if (currentSID) {
        viewport.currentSID = currentSID;
        this.priorSid = currentSID;
      }
      if (canvasNow >= 0) {
        viewport.canvasNow = canvasNow;
      }
    },

    /**
     * 拖拽Series处理
     * @param canvasNow {number?}
     * @param currentSID {string}
     * @param viewportID {string?}
     */
    dropSeries({ canvasNow, currentSID, viewportID }) {
      const cvp = this.currViewport;
      const nextSid = currentSID;
      if (cvp.gridMod && !this.imgPoor[nextSid].imageDone) {
        // 未加载完等待加载
        this.openGridModLayer(nextSid);
        return;
      }

      // 将currviewport更改为指定的viewport
      if (viewportID && canvasNow >= 0) {
        // 拖拽到render
        this.viewportID = viewportID;
        const viewport = this.viewportList[viewportID];
        viewport.canvasNow = canvasNow;
      }

      this.$nextTick(() => {
        this.changeSIDSync(currentSID);
      });
    },

    /**
     * 切换模板
     * @param val
     */
    changeGridMod(val) {
      console.log("go into gridMod", val);
      MOD.gridMod(this, val);
    },

    openGridModLayer(nextSid) {
      this.loadSeriesID = nextSid;
      const poor = this.imgPoor[this.loadSeriesID];
      const seriesInfo = poor.info;
      this.mprLayerShow3 = true;
    },
    getInitLayoutNum(model) {
      const prelayout = this.prelayoutSetting.find(
        (item) => item.model === model,
      );
      if (!prelayout) return;
      const layout = prelayout.layout;
      if (!layout) return;
      if (layout.includes(".")) {
        return layout.slice(6);
      } else {
        return Number(layout.slice(6));
      }
    },
    // 判断一共有多少个series，如果总series大于initLayout，那么达到initLayout再进行加载
    // 如果小于initLayout，那么等所有imgPoor都初始化完毕在进行加载
    initLayoutBySeries(series, keys) {
      const model = series?.[0].instances?.[0].modality;
      // 根据配置项获取对应模态的初始布局数
      const presetLayoutNum = this.getInitLayoutNum(model);
      if (presetLayoutNum) {
        this.initLayoutNum = presetLayoutNum;
      }
      if (this.layoutNumBefore) {
        this.initLayoutNum = this.layoutNumBefore;
      }
      if (series.length > this.initLayoutNum) {
        const ready = series
          .slice(0, this.initLayoutNum)
          .every((item) => keys.includes(item.seriesId));
        // 需要在imgpoor的length 大于 initLayoutNum的时候才开始加载
        // 这是为了确保preloadimg的正确执行
        if (ready && keys.length > this.initLayoutNum) {
          let seriesIds;
          if (this.viewportListBefore.length) {
            // 读取进入mpr之前视图对应的seriesId
            seriesIds = this.viewportListBefore.map((item) => item.currentSID);
          } else {
            seriesIds = series
              .slice(0, this.initLayoutNum)
              .map((item) => item.seriesId);
          }
          this.initLayout(seriesIds, false);
          this.isInitLayout = true;
        }
      } else {
        if (keys.length >= series.length) {
          let result;
          if (this.viewportListBefore.length) {
            // 读取进入mpr之前视图对应的seriesId
            result = this.viewportListBefore.map((item) => item.currentSID);
          } else {
            result = series.map((item) => item.seriesId);
          }
          // 如果series数量小于初始布局数，且对应模态没有默认布局配置时，沿用之前的布局逻辑
          // 也就是series有几个，初始布局就为多少
          if (!presetLayoutNum && !this.layoutNumBefore) {
            this.initLayoutNum = result.length;
          } else {
            // 如果有默认布局配置，idList需要进行拼接
            const times = Math.floor(this.initLayoutNum / keys.length);
            for (let i = 1; i < times; i++) {
              result = result.concat([...result]);
            }
            result = result.concat(
              result.slice(0, this.initLayoutNum - times * keys.length),
            );
          }
          this.initLayout(result, true);
          this.isInitLayout = true;
        }
      }
    },
    resetVR() {
      bus.$emit("resetVR");
    },
  },
  watch: {
    priorSid(val) {
      let { currentSID: MinCurrentSID } = this.minViewport;
      let mixSidList = [val];

      if (MinCurrentSID && MinCurrentSID.length >= 16) {
        mixSidList.unshift(MinCurrentSID);
      }
      this.mixSidList.value = mixSidList;
    },
    "minViewport.currentSID": {
      handler() {
        DATA.MinCurrentSID(this);
      },
    },
    isInMPR() {
      if (this.isInMPR === false) {
        const cvp = this.currViewport;
        if (this.activeOpt == "ACross") {
          this.activeOpt = "Page";
        }
        this.dicomShow.orientation = true;

        //重置AcrossPoint层厚
        let AcrossPoint = { ...cvp.AcrossPoint };
        // AcrossPoint.rotateC = 0;
        // AcrossPoint.rotateS = 0;
        // AcrossPoint.rotateT = 0;
        AcrossPoint.planes = [];
        AcrossPoint.isPlaneRotated = false;
        AcrossPoint.thickC = 0;
        AcrossPoint.thickS = 0;
        AcrossPoint.thickT = 0;
        cvp.AcrossPoint = AcrossPoint;

        CLICKOPT.resetFn(this);
        this.toOriginViewportList();
        // reSize方法里面有nextTick,执行完reSize之后再清空
        setTimeout(() => {
          this.viewportListBefore = [];
        }, 10);
      } else {
        const cvp = this.currViewport;
        let AcrossPoint = { ...cvp.AcrossPoint };
        AcrossPoint.isPlaneRotated = true;
      }
    },
    isInCPR(val) {
      if (val) {
        if (Object.keys(this.viewportList).length > 1) {
          this.changeLayout(1);
        }
        let imageDatas = this.currViewport.imageDatas;
        let imageData = imageDatas[0];
        let seriesInfo = this.currViewport.seriesInfos[0];
        imageData.isCPR = 1;
        if (imageData.curViewMod !== seriesInfo.initViewMod) {
          CLICKOPT.changeViewMod(this, 0, seriesInfo.initViewMod);
        }
        // imageDatas.splice(0, 1, { ...imageData });
        // imageDatas.splice(0, 1, { ...imageData });
        this.currViewport.gridNum = "4.0";
        // this.currViewport.gridMod = 0;
        this.changeCurrGridNum();

        // 调整imageData的viewMod
        for (let i = 1; i < imageDatas.length; i++) {
          imageDatas[i].curViewMod = i - 1;
          imageDatas[i].isCPR = 0;
        }
        this.currViewport.canvasNow = 1;
        this.activeOpt = "CPRPoint";
        // this.$nextTick(() => {
        this.setCanvasRange();
        // });
        console.log(this.currViewport, "currViewport");
      } else {
        this.activeOpt = "Page";
        // 取消CPR的时候切换视图
        this.toOriginViewportList();
        // reSize方法里面有nextTick,执行完reSize之后再清空
        setTimeout(() => {
          this.viewportListBefore = [];
        }, 10);
      }
    },
    isInVR(val) {
      if (val) {
        if (Object.keys(this.viewportList).length > 1) {
          this.changeLayout(1);
        }
        let imageDatas = this.currViewport.imageDatas;
        let imageData = imageDatas[0];
        let seriesInfo = this.currViewport.seriesInfos[0];
        imageData.isVR = 1;
        imageData.presetName = "CT-Bone";
        if (imageData.curViewMod !== seriesInfo.initViewMod) {
          CLICKOPT.changeViewMod(this, 0, seriesInfo.initViewMod);
        }
        this.currViewport.gridNum = "4.0";

        // 调整imageData的viewMod
        this.changeCurrGridNum();
        for (let i = 1; i < imageDatas.length; i++) {
          imageDatas[i].curViewMod = i - 1;
          imageDatas[i].isVR = 0;
        }
        imageDatas.splice(0, 1, { ...imageData });
        this.currViewport.canvasNow = 1;
        this.activeOpt = this.vrShortcutKey.left;
        this.setCanvasRange();
      } else {
        this.activeOpt = "Page";
        // 取消VR的时候切换视图
        this.toOriginViewportList();
        this.setvrShow = false;
        // reSize方法里面有nextTick,执行完reSize之后再清空
        setTimeout(() => {
          this.viewportListBefore = [];
        }, 10);
      }
    },
    //点击事件
    clickOpt() {
      CLICKOPT.clickOpt(this);
      // for (const id in this.viewportList) {
      //   console.log(this.viewportList[id], this.clickOpt);
      // }
      this.$nextTick(() => {
        this.clickOpt = "default";
      });
    },
    //选中事件
    activeOpt(val) {
      console.log(val, "acti");
      switch (val) {
        case "VOI_Rect":
        case "VOI_Circle":
        case "Pen":
        case "Circle":
        case "Rect":
        case "CurveLine":
        case "Arrow":
        case "Angle":
        case "Ruler":
        case "Text":
        case "Rubber":
        case "Point":
        case "CPRPoint":
        case "HeartChest":
        case "COBAngle":
        case "CurveRuler":
        case "PenCrop": {
          this.roiStatus = true;
          break;
        }
        default: {
          this.roiStatus = false;
          break;
        }
      }
    },
    "catcherShortcutKey.left": {
      handler(val) {
        this.activeOpt = val || "Page";
      },
    },
    "vrShortcutKey.left": {
      handler(val) {
        if (this.isInVR) this.activeOpt = val || "Rotate";
      },
    },
    scaleRatio() {
      this.$nextTick(() => {
        this.setCanvasRange();
      });
    },
    showToolbarText() {
      this.$nextTick(() => {
        this.setCanvasRange();
      });
    },
    canvasRange: {
      handler() {
        this.reSize();
        this.setScreenshotRange();
      },
      deep: true,
    },
    column() {
      localStorage.column = this.column;
      this.$nextTick(() => {
        this.setCanvasRange();
      });
    },
    rayplus_color() {
      this.updateRoi();
    },
    rayplus_fontSize() {
      this.updateRoi();
    },
    ["imageDataNow.curViewMod"](newVal) {
      console.log("AcrossPoint curViewMod changed");
      this.currViewport.AcrossPoint.curViewMod = newVal || 0;
    },
    currentSIDPrecent(neweast) {
      if (neweast === 100 && this.mprLayerShow) {
        setTimeout(() => {
          this.mprLayerShow = false;
        }, 1000);
      }
    },
    miniCurrentSIDPrecent(neweast) {
      if (neweast === 100 && this.mprLayerShow2) {
        setTimeout(() => {
          this.mprLayerShow2 = false;
        }, 1000);
      }
    },
    canvasNow(neweast) {
      this.currViewport.canvasNow = neweast;
    },

    seriesListPos(neweast) {
      localStorage.setItem("seriesListPos", neweast);
      this.$nextTick(() => {
        this.setCanvasRange();
      });
    },
    // 图像全部加载完成后，生成全影像序列
    imgPoorPrecent(val) {
      const loadFullSeries = localStorage.getItem("loadFullSeries");
      if (val === 100 && !this.isLoadFullSeries && loadFullSeries === "true") {
        this.isLoadFullSeries = true;
        createFullSeries(this);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./viewer.scss";
</style>
<style lang="scss">
:root {
  --lightColour: #cccccc; // 浅黑色
  --active: #3b8be4; //文字选中颜色
  --border: #f6f7f8; //边框颜色
}
</style>
