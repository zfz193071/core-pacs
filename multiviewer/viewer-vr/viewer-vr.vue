<template>
  <div class="vr">
    <div
      class="view3d"
      :id="id"
      ref="view3d"
      :style="{
        width: canvasSize.width + 'px',
        height: canvasSize.height + 'px',
        background: bgColor,
      }"
    ></div>
  </div>
</template>
<script>
import { mapState } from "vuex";
import { debounce } from "../js/utils";
import {
  initRandomCubeVolume,
  rotateForVR,
  wwwl,
  zoom,
  initMprTandRViewer,
  updatePlane,
  initCPRViewer,
  initVRViewer,
  setThumbnailerList,
  initLight,
  initVRCropping,
  resetVRCropping,
} from "../js/vr/index";
import {
  setCenterLine,
  setCenterLineJSON,
  setCPRMode,
  setAngle,
  setCPRThickness,
  setCPRProjectionMode,
} from "../js/vr/cpr";
import { setMapList, resetData, setNewData, tabelRemove } from "../js/vr/crop";
import { getMouseTypeByStore } from "../js/vr/interactor";
import bus from "@/assets/js/bus.js";

let originBuffer = null;
export default {
  name: "vr",
  props: {
    imgPoor: { required: true, type: Object },
    imageData: {},
    seriesInfo: {},
    canvasSize: {},
    AcrossPoint: {},
    vtkBlendMod: { required: true, type: Number },
    CPRVoiListData: { required: true },
    isInMPR: { required: true, type: Boolean },
    isVRNow: { type: Boolean },
    activeOpt: String,
  },
  data() {
    return {
      id: {},
      canvasDOM: null,
      renderer: null,
      renderWindow: null,
      volumeActor: null,
      volumeActor_pt: null,
      fullScreenRenderer: null,
      isReady: false,
      CPRCenterline: null,
      CPRMapper: null,
      CPRActor: null,
      CPRManipulator: null,
      worldNormalVec: null,
      worldBittangentVec: null,
      bgColor: "",
      cleanQueue: [],
      originCameraParams: null,
    };
  },
  created() {
    this.id = this.$randomStr();

    // this.handleVRRotate = throttle(this.vrRotateFn, 10);
    this.handleRenderWithVRParams = debounce(this.renderWithVRParams, 500);

    // bus.$on("requestAnimation", () => {
    //   this.requestAnimation();
    // });
    // bus.$on("cancelAnimation", () => {
    //   this.cancelAnimation();
    // });
    bus.$on("changeBgColor", (color) => {
      this.bgColor = color;
    });

    bus.$on("confirmPenCrop", () => {
      const view = this.renderWindow.getViews()[0];
      const size = view.getSize();
      const pointList = this.$store.state.VRPenCropPointList;
      Vue.prototype.$loading(true);
      setTimeout(() => {
        try {
          let mapList = setMapList(
            this.volumeImageData,
            this.renderer,
            view,
            size,
            pointList,
          );
          if (mapList) {
            setNewData(mapList, this.volumeMapper);
          }
          mapList = null;
          this.renderWindow.render();
          this.cropState = "penCrop";
        } finally {
          Vue.prototype.$loading(false);
        }
      }, 10);
    });

    bus.$on("vrMouseTypeChange", () => {
      const types = getMouseTypeByStore();
      console.log("vrmousetype", types);
      this.rotateManipulator?.setButton(types.rotate);
      this.panManipulator?.setButton(types.pan);
      this.zoomManipulator?.setButton(types.zoom);
      this.renderWindow.render();
    });

    bus.$on("resetVR", () => {
      if (!this.originCameraParams) return;
      const camera = this.renderer.getActiveCamera();
      camera.setFocalPoint(...this.originCameraParams.focalPoint);
      camera.setPosition(...this.originCameraParams.position);
      camera.setViewUp(...this.originCameraParams.viewUp);

      // 先resetCamera，再设置angle
      this.renderer.resetCamera();

      this.renderer
        .getActiveCamera()
        .setViewAngle(this.originCameraParams.viewAngle);
      this.renderer.getActiveCamera().azimuth(0);
      this.renderer.updateLightsGeometryToFollowCamera();
      this.renderWindow.render();
    });
  },
  beforeDestroy() {
    this.cleanQueue.forEach((cleaner) => cleaner());

    // bus.$off("requestAnimation");
    // bus.$off("cancelAnimation");
    bus.$off("confirmPenCrop");
    bus.$off("changeBgColor");
    bus.$off("vrMouseTypeChange");
    bus.$off("resetVR");
    // bus.$off("updateLight");
    originBuffer = null;
  },
  computed: {
    ...mapState(["vrParams"]),
    wwwl() {
      if (this.imageData) {
        return {
          ww: this.imageData.ww,
          wl: this.imageData.wl,
          colormapIndex: this.imageData.colormapIndex,
        };
      }
      return {};
    },
    scale() {
      if (this.imageData) {
        //这里用到缩放因子
        let { baseSpacing, baseFactor } = this.imageData.scale;
        return baseFactor / baseSpacing || 1;
      }
      return {};
    },
    isCPR() {
      return this.imageData?.isCPR;
    },
    isVR() {
      return this.imageData?.isVR;
    },
    cameraView() {
      return this.imageData?.cameraView;
    },

    lightFollowsCamera() {
      return this.$store.state.vrParams.lightFollowsCamera;
    },
    vrPresetName() {
      return this.imageData?.presetName;
    },
    MPRTrans() {
      return this.$store.state.MPRTrans;
    },
  },
  methods: {
    stopVR() {
      //删除结点
      var view3d = document.getElementById(this.id);
      view3d.innerHTML = "";
    },
    reflashView() {
      // 未来重构，现在确保draw的时候能拿到真实canvasSize
      this.$nextTick(() => {
        this.drawView3d();
      });
    },
    async drawView3d() {
      let { currentSID } = this.seriesInfo; //找当前的数据就可以了
      let imgPoorObj = this.imgPoor[currentSID];

      this.volumeImageData = imgPoorObj && imgPoorObj.volumeImageData;
      this.volumeBuffer = imgPoorObj && imgPoorObj.volumeBuffer;

      //这里是因为每次进CPR，为了正确设置窗宽窗位，需要把最小值平移到>0之上
      this.volumeImageData
        .getPointData()
        .getScalars()
        .setData(this.volumeBuffer, 1);

      //清空现有
      try {
        const cleaner = initRandomCubeVolume(this);
        this.cleanQueue.push(cleaner);
      } catch (e) {
        console.log("error", e);
        this.$emit("renderError");
        Vue.prototype.$loading(false);
        return;
      }
      console.log("drawview3d", this.isCPR);
      if (this.isInMPR) {
        const mprCleaner = initMprTandRViewer(this);
        this.cleanQueue.push(mprCleaner);
        this.isReady = true;
      } else if (this.isCPR) {
        const cprCleaner = initCPRViewer(this);
        this.cleanQueue.push(cprCleaner);
        // CPR四视图切换情况下，需要重新设置中心线
        if (this.CPRVoiListData?.length > 1) {
          const json = setCenterLineJSON(this.CPRVoiListData);
          setCenterLine(json, this);
        }
        this.isReady = true;
      } else if (this.isVR) {
        const vrCleaner = initVRViewer(this);
        originBuffer = this.volumeImageData
          .getPointData()
          .getScalars()
          .getData()
          .slice();
        this.cleanQueue.push(vrCleaner);
        this.isReady = true;
        // 设置预览图
        let scale = this.imageData.scale.x * 2;
        imgPoorObj.thumbList = [];
        let renderData = this.volumeImageData;
        await setThumbnailerList(
          renderData,
          this.imageData,
          scale,
          this.canvasSize,
          imgPoorObj.thumbList,
        );
        this.$emit("vrLoaded");
        // 提前执行requestAnimation 计算，避免交互的时候卡顿
        // this.requestAnimation();
        // this.cancelAnimation();
        Vue.prototype.$loading(false);
      }
    },
    vrRotateFn(val, old) {
      if (!this.isVR || !val) return;
      if (
        !this.isReady ||
        !val ||
        Number.isNaN(val.azimuth) ||
        Number.isNaN(val.elevation) ||
        !old ||
        Number.isNaN(old.azimuth) ||
        Number.isNaN(old.elevation)
      )
        return false;
      // if (val.azimuth === 0 && val.elevation === 0) {
      //   //重置摄像头
      //   initCamera(this, this.scale, this.canvasSize);
      // } else {
      let dAzimuth = val.azimuth - old.azimuth;
      let dElevation = val.elevation - old.elevation;
      if (dAzimuth === 0 && dElevation === 0) {
        return false;
      }
      rotateForVR(this, dAzimuth, dElevation, this.scale, this.canvasSize);
      // }
    },
    renderWithVRParams() {
      console.log("renderWithVRParams", this.fullScreenRenderer);
      if (!this.fullScreenRenderer) return;
      let rep = this.fullScreenRenderer.getRenderer();

      initLight(rep, this.lightFollowsCamera);
      const interactor = this.renderWindow.getInteractor();
      interactor.setLightFollowCamera(this.lightFollowsCamera);

      const volume = rep.getVolumes()[0];
      const mapper = volume.getMapper();
      const property = volume.getProperty();
      property.setAmbient(this.vrParams.Ambient);
      property.setDiffuse(this.vrParams.Diffuse);
      if (this.vrParams.useLocalAmbientOcclusion) {
        mapper.setLocalAmbientOcclusion(true);
      } else {
        mapper.setLocalAmbientOcclusion(false);
      }
      mapper.setLAOKernelSize(this.vrParams.Size);
      mapper.setLAOKernelRadius(this.vrParams.size * 2 + 10);
      mapper.setLAOKernelRadius(this.vrParams.Radius);

      mapper.setVolumetricScatteringBlending(this.vrParams.Blending);
      // this.renderer.updateLightsGeometryToFollowCamera();
      // if (this.lightFollowsCamera)
      // else this.renderer.updateLightGeometry();
      this.renderWindow.render();
    },
    requestAnimation() {
      let fullScreenRenderer = this.fullScreenRenderer;
      if (!fullScreenRenderer) return;
      // let camera = this.renderer.getActiveCamera();
      this.renderWindow.getInteractor().requestAnimation("rotate");
      this.$store.state.animating = true;
    },
    cancelAnimation() {
      let fullScreenRenderer = this.fullScreenRenderer;
      if (!fullScreenRenderer) return;
      // let renderer = fullScreenRenderer.getRenderer();
      // let camera = renderer.getActiveCamera();
      const renderWindow = fullScreenRenderer.getRenderWindow();
      if (renderWindow.getInteractor().isAnimating()) {
        renderWindow.getInteractor().cancelAnimation("rotate");
        this.$store.state.animating = false;
      }
    },
    updateLight() {
      if (!this.fullScreenRenderer || !this.lightFollowsCamera) return;
      let rep = this.fullScreenRenderer.getRenderer();
      initLight(rep, this.lightFollowsCamera);
      this.renderWindow.render();
    },
    resetCropedData() {
      if (!originBuffer) throw Error("originBuffer is not defined");
      resetData(this.volumeMapper, originBuffer);
      resetVRCropping(
        this.volumeMapper.getInputData(),
        this.volumeMapper,
        this.cropWidget,
      );
      this.renderWindow.render();
      this.cropState = "";
    },
    formatVRShortcutKey(type, obj) {
      const buttons = [1, 2, 3];
      obj[type] = 1;
      for (let key in obj) {
        if (key !== type && obj[key] === obj[type]) {
          obj[key] = "";
          const values = Object.values(obj);
          for (let o of buttons) {
            if (!values.includes(o)) {
              obj[key] = o;
              break;
            }
          }
          break;
        }
      }
      return obj;
    },
    changeVRInteractorButton(val) {
      if (!this.interactorStyle) return;
      const type = val.toLowerCase();
      const mouseTypes = getMouseTypeByStore();
      this.formatVRShortcutKey(type, mouseTypes);
      this.interactorStyle.removeAllMouseManipulators();
      console.log(mouseTypes, type, "active change");
      switch (type) {
        case "rotate":
          this.rotateManipulator?.setButton(1);
          this.panManipulator?.setButton(mouseTypes.pan);
          this.zoomManipulator?.setButton(mouseTypes.zoom);
          break;
        case "pan":
          this.panManipulator?.setButton(1);
          this.rotateManipulator?.setButton(mouseTypes.rotate);
          this.zoomManipulator?.setButton(mouseTypes.zoom);
          break;
        case "zoom":
          this.zoomManipulator?.setButton(1);
          this.rotateManipulator?.setButton(mouseTypes.rotate);
          this.panManipulator?.setButton(mouseTypes.pan);
          break;
        case "window":
          if (mouseTypes.rotate !== 1) {
            this.rotateManipulator?.setButton(mouseTypes.rotate);
            this.interactorStyle.addMouseManipulator(this.rotateManipulator);
          }
          if (mouseTypes.pan !== 1) {
            this.panManipulator?.setButton(mouseTypes.pan);
            this.interactorStyle.addMouseManipulator(this.panManipulator);
          }
          if (mouseTypes.zoom !== 1) {
            this.zoomManipulator?.setButton(mouseTypes.zoom);
            this.interactorStyle.addMouseManipulator(this.zoomManipulator);
          }
          break;
        default:
          break;
      }

      if (val !== "window") {
        this.interactorStyle.addMouseManipulator(this.rotateManipulator);
        this.interactorStyle.addMouseManipulator(this.panManipulator);
        this.interactorStyle.addMouseManipulator(this.zoomManipulator);
      }
      this.renderWindow.render();
    },
  },
  watch: {
    scale: {
      handler(val, old) {
        if (this.isVR) return false;
        if (!this.isReady || val === old) return false;
        zoom(this, val, this.canvasSize);
      },
      deep: true,
    },
    wwwl: {
      handler(val, old) {
        if (
          !this.isReady ||
          (val.ww === old.ww &&
            val.wl == old.wl &&
            val.colormapIndex == old.colormapIndex)
        )
          return false;
        if (this.isVR) return false;
        wwwl(this);
      },
      deep: true,
    },
    vrPresetName() {
      if (this.isReady) wwwl(this);
    },
    // cameraView: {
    //   handler(val, old) {
    //     // this.vrRotateFn?.(val, old);
    //   },
    //   deep: true,
    // },
    AcrossPoint: {
      handler() {
        if (!this.isReady || this.isCPR || this.isVR) return false;
        updatePlane(this);
      },
      deep: true,
    },
    canvasSize: {
      handler(val) {
        const { width, height } = val;
        this.fullScreenRenderer
          ?.getApiSpecificRenderWindow()
          .setSize(width, height);

        if (this.isCPR && this.CPRVoiListData?.length > 1)
          this.renderWindow?.render();
        if (this.isInMPR) {
          this.renderWindow?.render();
        }
        if (this.isVR) {
          let distance = this.renderer.getActiveCamera().getDistance();
          // ensure correct lighting post camera manip
          this.renderer.updateLightsGeometryToFollowCamera();
          let zommNow = this.scale;
          console.log(this.scale, "canvasize change");
          let angle =
            (Math.atan(height / (2 * zommNow * distance)) * 360) / Math.PI;
          this.renderer.getActiveCamera().setViewAngle(angle);
          this.originCameraParams.viewAngle = angle;
          this.renderer.getActiveCamera().azimuth(0);
          this.renderWindow.render();
        }
      },
    },
    "AcrossPoint.CPRMode": {
      handler(val) {
        setCPRMode(val, this);
      },
    },
    "AcrossPoint.CPRRotate": {
      handler(val) {
        val = (parseInt(val) / 180) * Math.PI;
        setAngle(val, this);
      },
    },
    "AcrossPoint.CPRThickness": {
      handler(val) {
        setCPRThickness(parseFloat(val), this);
      },
    },
    "AcrossPoint.CPRProjectionMode": {
      handler(val) {
        setCPRProjectionMode(val, this);
      },
    },
    "imageData.curViewMod": {
      handler() {
        if (!this.isReady) return false;
        updatePlane(this);
      },
    },
    "imageData.tabelRemoveFlag": {
      handler() {
        Vue.prototype.$loading(true);
        Vue.prototype.$loading(true);
        setTimeout(() => {
          try {
            let threshhold = -50; //因为volume是算过斜率和截距之后的数据，所以可以用CT值来做阈值
            if (this.seriesInfo.parts.toLowerCase().indexOf("head") > -1) {
              threshhold = 50;
              //头部数据采用单独的阈值
            }
            console.log(
              "tabelRemove threshhold",
              this.seriesInfo.parts.toLowerCase(),
              threshhold,
            );
            let mapList = tabelRemove(this.volumeImageData, threshhold);
            if (mapList) {
              setNewData(mapList, this.volumeMapper);
            }
            mapList = null;
            this.renderWindow.render();
          } finally {
            Vue.prototype.$loading(false);
          }
        }, 10);
      },
    },
    MPRTrans: {
      handler() {
        if (!this.isReady) return false;
        console.log("平移 in VR");
        updatePlane(this);
      },
      deep: true,
    },
    "seriesInfo.currentSID": {
      handler() {
        this.reflashView();
      },
      deep: true,
      immediate: true,
    },
    isInMPR() {
      this.reflashView();
    },
    isCPR() {
      this.reflashView();
    },
    CPRVoiListData: {
      handler(val) {
        console.log(val, "cpr voilist change--");
        // if (!val?.length) return;
        const json = setCenterLineJSON(val);
        setCenterLine(json, this);
      },
      deep: true,
    },
    vtkBlendMod: {
      handler() {
        this.reflashView();
      },
      deep: true,
    },
    vrParams: {
      deep: true,
      handler(val) {
        console.log("param change");
        if (val.Radius > val.Size * 2 + 10) {
          val.Radius = val.Size * 2 + 10;
        }
        let param = JSON.stringify(val);
        localStorage.setItem("cvrParams", param);
        this.handleRenderWithVRParams();
      },
    },
    activeOpt(val) {
      if (val === "resetCrop") {
        this.resetCropedData();
      } else if (val === "Crop") {
        if (!this.cropWidget) {
          const vrCropCleaner = initVRCropping(this);
          this.cleanQueue.push(vrCropCleaner);
        } else {
          this.cropWidget.setVisibility(true);
          this.renderWindow.render();
        }
      } else if (this.cropWidget) {
        this.cropWidget.setVisibility(false);
        this.renderWindow.render();
      }
      if (this.isVR) {
        this.changeVRInteractorButton(val);
      }
    },
  },
};
</script>
<style lang="scss" scoped>
@import "./viewer-vr.scss";
</style>
