<template>
  <div id="cesiumContainer"></div>
  <div class="operate_container">
    <div
      class="menu_button"
      @click="drawer = !drawer"
      title="Satellite Category selection"
    >
      <img
        src="../../assets/menu.svg"
        width="28"
        height="28"
        alt="Satellite Category selection"
      />
    </div>
    <div class="menu_button" @click="clearSatelliteOrbit" title="clear orbit">
      <img
        src="../../assets/hide.svg"
        width="24"
        height="24"
        alt="clear orbit"
      />
    </div>
    <div class="menu_button" @click="handleLogout" title="Logout">
      <img src="../../assets/logout.svg" width="24" height="24" alt="Logout" />
    </div>
    <div class="menu_button" @click="RedirecToGitHub" title="GitHub">
      <img src="../../assets/github.svg" width="24" height="24" alt="Github" />
    </div>
  </div>
  <div v-if="selectedSatellite" id="satDataCard" class="card">
    <div class="card__product-img">
      <img
        class="card__img"
        alt="product-image"
        src="https://images.news18.com/ibnlive/uploads/2023/01/space-comms-future.jpg"
      />
    </div>
    <div class="card__content">
      <p class="card__name">{{ selectedSatellite.NAME }}</p>
      <p class="card__description">
        Launch Date: {{ selectedSatellite.launchDate }}
      </p>
      <p class="card__description">Owner: {{ selectedSatellite.owner }}</p>
      <p class="card__description">
        Launch Site: {{ selectedSatellite.launchSite }}
      </p>
      <p class="card__description">
        Launch Vehicle: {{ selectedSatellite.launchVehicle }}
      </p>
      <p class="card__description">Type: {{ selectedSatellite.type }}</p>
      <p class="card__description">RCS: {{ selectedSatellite.rcs }}</p>
      <p class="card__description">
        Stable Date: {{ selectedSatellite.stableDate }}
      </p>
      <p class="card__description">
        Alternate Name: {{ selectedSatellite.altName }}
      </p>
      <p class="card__description">
        Launch Pad: {{ selectedSatellite.launchPad }}
      </p>
      <p class="card__description">
        Payload:
        {{
          selectedSatellite.payload !== "0"
            ? selectedSatellite.payload
            : "Unknown"
        }}
      </p>
    </div>
    <div class="card__footer">
      <div class="card__price">
        <span>Country:&nbsp;</span><img :src="selectedSatellite.flag" alt="" />
        <span>&nbsp{{ selectedSatellite.country }}</span>
      </div>
      <p class="card__autor">
        Manufacturer:
        {{
          selectedSatellite.manufacturer !== "0"
            ? selectedSatellite.manufacturer
            : "Unknown"
        }}
      </p>
    </div>
  </div>

  <el-drawer v-model="drawer" title="All Satellites" direction="ltr">
    <el-checkbox-group v-model="checked" class="checkbox-group">
      <template v-for="sat in allSatellite" :key="sat.value">
        <el-checkbox :label="sat.value" :name="sat.value">{{
          sat.label
        }}</el-checkbox>
      </template>
    </el-checkbox-group>
  </el-drawer>
</template>

<script setup>
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

import { onMounted, ref, watch } from "vue";

import "./SatelliteTrack.scss";

import {
  getSatData,
  getSatelliteTypes,
  getSatDataByID,
  getSatDataByType,
} from "@/http/index";

import SatelliteEntity from "@/js/SatelliteEntity";

let allSatellite;

window.CESIUM_BASE_URL = "/cesium";

let viewer;
const totalSeconds = 86400;
const satelliteMap = new Map();
const drawer = ref(false);

const checked = ref([]);

const clickedSatelliteArray = [];

const selectedSatellite = ref(null);

Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN;

function initCesium() {
  Cesium.Timeline.prototype.makeLabel = function (time) {
    let minutes = 0 - new Date().getTimezoneOffset();
    let dataZone8 = Cesium.JulianDate.addMinutes(
      time,
      minutes,
      new Cesium.JulianDate()
    );
    return Cesium.JulianDate.toIso8601(dataZone8).slice(0, 19);
  };

  viewer = new Cesium.Viewer("cesiumContainer", {
    imageryProvider: new Cesium.IonImageryProvider({ assetId: 3812 }),
    baseLayerPicker: true,
    geocoder: false,
    navigationHelpButton: false,
    infoBox: false,
  });

  let minutes = 0 - new Date().getTimezoneOffset();
  viewer.animation.viewModel.timeFormatter = function (date, viewModel) {
    let dataZone8 = Cesium.JulianDate.addMinutes(
      date,
      minutes,
      new Cesium.JulianDate()
    );
    return Cesium.JulianDate.toIso8601(dataZone8).slice(11, 19);
  };
  viewer.animation.viewModel.dateFormatter = function (date, viewModel) {
    let dataZone8 = Cesium.JulianDate.addMinutes(
      date,
      minutes,
      new Cesium.JulianDate()
    );
    return Cesium.JulianDate.toIso8601(dataZone8).slice(0, 10);
  };

  Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(
    68.116,
    8.066,
    97.416,
    37.1
  );

  const imageryLayers = viewer.imageryLayers;
  const nightLayer = imageryLayers.get(0);
  const dayLayer = new Cesium.ImageryLayer(
    new Cesium.IonImageryProvider({ assetId: 3845 })
  );
  imageryLayers.add(dayLayer);
  imageryLayers.lowerToBottom(dayLayer);
  dayLayer.show = true;
  viewer.scene.globe.enableLighting = true;
  viewer.clock.shouldAnimate = true;
  nightLayer.dayAlpha = 0;  

  // viewer.resolutionScale = 1;

}

function initTimeLine() {
  const start = Cesium.JulianDate.fromIso8601(new Date().toISOString());
  const stop = Cesium.JulianDate.addSeconds(
    start,
    totalSeconds,
    new Cesium.JulianDate()
  );
  viewer.clock.startTime = start.clone();
  viewer.clock.stopTime = stop.clone();
  viewer.clock.currentTime = start.clone();
  viewer.timeline.zoomTo(start, stop);
  viewer.clock.multiplier = 1;
  viewer.clock.shouldAnimate = true;
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
}

function addCesiumEventListener() {
  let callback = viewer.screenSpaceEventHandler.getInputAction(
    Cesium.ScreenSpaceEventType.LEFT_CLICK
  );
  viewer.screenSpaceEventHandler.setInputAction(async function onLeftClick(
    movement
  ) {
    callback(movement);
    const pickedFeature = viewer.scene.pick(movement.position);
    if (pickedFeature && pickedFeature.id && pickedFeature.id.path) {
      const info = await getSatDataByID(pickedFeature.id.id);
      selectedSatellite.value = info[0];
      clickedSatelliteArray.forEach((item) => {
        if (item.id && item.id.path) {
          item.id.path.show = new Cesium.ConstantProperty(false);
        }
      });
      pickedFeature.id.path.show = new Cesium.ConstantProperty(true);
      pickedFeature.id.label.distanceDisplayCondition = undefined;
      clickedSatelliteArray.push(pickedFeature);
    } else {
      selectedSatellite.value = null;
    }
  },
  Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

async function getTleData(path) {
  if (!path || path == "all") return await getSatData();
  return await getSatDataByType(path);
}

async function addSatellite(data) {
  let satelliteSet = new Set();
  satelliteMap.forEach((satelliteSet) =>
    satelliteSet.forEach((sate) => viewer.entities.remove(sate))
  );
  if (data != "all" && data.length > 1) {
    data.forEach(async (path) => {
      const result = await getTleData(path);
      result.forEach((tle) => {
        let satellite = new SatelliteEntity(tle);
        let cesiumSateEntity = satellite.createSatelliteEntity();
        let result = viewer.entities.add(cesiumSateEntity);
        satelliteSet.add(result);
      });
      satelliteMap.set(path, satelliteSet);
    });
  } else {
    const result = await getTleData(data);
    result.forEach((tle) => {
      let satellite = new SatelliteEntity(tle);
      let cesiumSateEntity = satellite.createSatelliteEntity();
      let result = viewer.entities.add(cesiumSateEntity);
      satelliteSet.add(result);
    });
    satelliteMap.set(data, satelliteSet);
  }
}

function handleLogout() {
  ElMessageBox.confirm("Are you sure you want to log out?", "hint", {
    confirmButtonText: "Sure",
    cancelButtonText: "Cancel",
    type: "warning",
  })
    .then(() => {
      localStorage.removeItem("authToken");
      window.location.href = "/auth";
    })
    .catch(() => {
      console.log("Cancel");
    });
}

function RedirecToGitHub() {
  window.open("https://github.com/HackerDMK", "_blank");
}

watch(checked, (newValue) => {
  if (newValue.length === 0) {
    addSatellite("all");
  }
  addSatellite(newValue);
});

onMounted(async () => {
  initCesium();
  initTimeLine();
  addCesiumEventListener();
  allSatellite = await getSatelliteTypes();
  addSatellite("all");
});
</script>
