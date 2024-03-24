<template>
  <div id="cesiumContainer"></div>
  <div class="operate_container">
    <div class="menu_button" @click="drawer = !drawer" title="Satellite Category selection">
      <img src="../../assets/menu.svg" width="28" height="28" alt="Satellite Category selection" />
    </div>
    <div class="menu_button" @click="clearSatelliteOrbit" title="clear orbit">
      <img src="../../assets/hide.svg" width="24" height="24" alt="clear orbit" />
    </div>
    <div class="menu_button" @click="handleLogout" title="Logout">
      <img src="../../assets/logout.svg" width="24" height="24" alt="Logout" />
    </div>
    <div class="menu_button" @click="RedirecToGitHub" title="GitHub">
      <img src="../../assets/github.svg" width="24" height="24" alt="Github" />
    </div>
    <div class="menu_button" @click="uploadDialog = !uploadDialog" title="Add Satellite">
      <img src="../../assets/upload.svg" width="24" height="24" alt="Add Satellite" />
    </div>
    <div class="menu_button no-of-satellites" title="No of Satellites" >
      Number of Satellites to Render: <input type="number" v-model="noOfSatellites"  width="24" height="24" alt="No of Satellites" />
    </div>
  </div>
  <div v-if="selectedSatellite" id="satDataCard" class="card">
    <div class="card__product-img">
      <img class="card__img" alt="product-image"
        src="https://images.news18.com/ibnlive/uploads/2023/01/space-comms-future.jpg" />
    </div>
    <div class="card__content">
      <p class="card__name">{{ selectedSatellite.Name }}</p>
      <p class="card__description">
        <!-- convert to time on day month year : "1961-06-28T18:30:00.000Z to 28 June 1961" -->
        Launch Date: {{ selectedSatellite.LaunchDate || "N/A" }}
      </p>
      <p class="card__description">Owner: {{ selectedSatellite.Owner || "N/A" }}</p>
      <p class="card__description">
        Mass (kg): {{ selectedSatellite.Mass || "N/A" }}
      </p>
      <p class="card__description">
        Vmag: {{ selectedSatellite.Vmag || "N/A" }}
      </p>
      <p class="card__description">
        Launch Pad: {{ selectedSatellite.LaunchPad || "N/A" }}
      </p>
      <p class="card__description">
        Launch Vehicle: {{ selectedSatellite.LaunchVehicle || "N/A" }}
      </p>
      <p class="card__description">Type: {{ selectedSatellite.Type || "N/A" }}</p>
      <p class="card__description">RCS: {{ selectedSatellite.Rcs || "N/A" }}</p>
      <p class="card__description">
        Stable Date: {{ selectedSatellite.StableDate || "N/A" }}
      </p>
      <p class="card__description">
        Alternate Name: {{ selectedSatellite.AltName || "N/A" }}
      </p>
      <p class="card__description">
        Payload:
        {{
      selectedSatellite.Payload !== "0"
        ? selectedSatellite.Payload
        : "Unknown"
    }}
      </p>
    </div>
    <div class="card__footer">
      <div class="card__price">
        <span>Country:&nbsp;</span><img :src="selectedSatellite.Flag" alt="" />
        <span>&nbsp{{ selectedSatellite.CountryName || "Unknown" }}</span>
      </div>
      <p class="card__autor">
        Manufacturer:
        {{
      selectedSatellite.Manufacturer !== "0"
        ? selectedSatellite.Manufacturer
        : "Unknown"
    }}
      </p>
    </div>
    <el-button type="primary" @click="openSatEditDialog">Edit</el-button>
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

  <el-dialog title="Add New Satellite" v-model="uploadDialog" width="30%" center>
    <el-form :model="newSatellite">
      <el-form-item label="Satellite Name">
        <el-input v-model="newSatellite.name">TEST</el-input>
      </el-form-item>
      <el-form-item label="TLE Data">
        <el-input type="textarea" v-model="newSatellite.tleData"></el-input>
        <el-button type="primary" @click="checkForCollisions">Check</el-button>
        <el-alert
          title="TLE Data Format"
          type="info"
          class="tle-info"
          show-icon
        ><a href="https://celestrak.org/NORAD/elements/gp.php?GROUP=last-30-days&FORMAT=tle" target="_blank">Click here</a></el-alert>
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">Cancel</el-button>
      <el-button type="primary" @click="addNewSatelliteafterCheck" :disabled="newSatellite.collision == null">Add</el-button>
    </span>
  </el-dialog>
  <el-dialog title="Edit Satellite" v-model="editSatDialog" width="30%" center>
  <el-form :model="editedSatellite">
    <el-form-item label="Satellite Name">
      <el-input v-model="editedSatellite.Name"></el-input>
    </el-form-item>
    <el-form-item label="Payload">
      <el-input v-model="editedSatellite.Payload"></el-input>
    </el-form-item>
    <el-form-item label="Mass">
      <el-input v-model="editedSatellite.Mass"></el-input
    ></el-form-item>
    <el-form-item label="Vmag">
      <el-input v-model="editedSatellite.Vmag"></el-input>
    </el-form-item>
    <el-form-item label="Launch Date">
      <el-input v-model="editedSatellite.LaunchDate"></el-input>
    </el-form-item>
    <span slot="footer" class="dialog-footer">
    <el-button @click="editSatDialog = false">Cancel</el-button>
    <el-button type="primary" @click="updateSatelliteDone">Save</el-button>
  </span>
  </el-form>
</el-dialog>
  <loading v-model:active="isLoading"
                 :can-cancel="true"
                 :is-full-page="true"/>
</template>

<script setup>
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

import { onMounted, ref, watch } from "vue";

import "./SatelliteTrack.scss";
import Loading from 'vue-loading-overlay';
    import 'vue-loading-overlay/dist/css/index.css';
import {
  getSatData,
  getSatelliteTypes,
  getSatDataByID,
  getSatDataByType,
  checkCollision,
  addNewSatellite,
  updateSatellite
} from "@/http/index";

import SatelliteEntity from "@/js/SatelliteEntity";
import { ElMessageBox } from "element-plus";

let allSatellite;

window.CESIUM_BASE_URL = "/cesium";

let viewer;
const totalSeconds = 86400;
const satelliteMap = new Map();
const drawer = ref(false);
const noOfSatellites = ref(25);

const checked = ref([]);

const clickedSatelliteArray = [];

let isLoading = ref(false);
let editSatDialog = ref(false);
const editedSatellite = ref({});

const selectedSatellite = ref(null);
var uploadDialog = ref(false);
const newSatellite = ref({
  name: "",
  tleData: "",
  collision: null,
  secondSatelliteNumber: null,
});

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
      editedSatellite.value = { ...info[0] };
      clickedSatelliteArray.forEach((item) => {
        if (item.id && item.id.path) {
          item.id.path.show = new Cesium.ConstantProperty(false);
          item.id.model.show = new Cesium.ConstantProperty(false);
        }
      });
      pickedFeature.id.path.show = new Cesium.ConstantProperty(true);
      pickedFeature.id.model.show = new Cesium.ConstantProperty(true);
      pickedFeature.id.label.distanceDisplayCondition = undefined;
      clickedSatelliteArray.push(pickedFeature);
    } else {
      selectedSatellite.value = null;
    }
  },
    Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

async function getTleData(path, noOfSatellites) {
  if (!path || path == "all") return await getSatData(noOfSatellites);
  return await getSatDataByType(path, noOfSatellites);
}

async function addSatellite(data, noOfSatellites) {
  let satelliteSet = new Set();
  satelliteMap.forEach((satelliteSet) =>
    satelliteSet.forEach((sate) => viewer.entities.remove(sate))
  );
  if (data != "all" && data.length > 1) {
    data.forEach(async (path) => {
      const result = await getTleData(path, noOfSatellites);
      result.forEach((tle) => {
        let satellite = new SatelliteEntity(tle);
        let cesiumSateEntity = satellite.createSatelliteEntity();
        let result = viewer.entities.add(cesiumSateEntity);
        satelliteSet.add(result);
      });
      satelliteMap.set(path, satelliteSet);
    });
  } else {
    const result = await getTleData(data, noOfSatellites);
    result.forEach((tle) => {
      try{
        let satellite = new SatelliteEntity(tle);
        let cesiumSateEntity = satellite.createSatelliteEntity();
        let result = viewer.entities.add(cesiumSateEntity);
        satelliteSet.add(result);
      } catch (e) {
        console.log(e);
      }
    });
    satelliteMap.set(data, satelliteSet);
  }
}

function openSatEditDialog() {
  editSatDialog.value = true;
}

async function updateSatelliteDone() {
  isLoading.value = true;
  const res = await updateSatellite({
    id: selectedSatellite.value.Id,
    data : {
      name: editedSatellite.value.Name || selectedSatellite.value.Name,
      payload: editedSatellite.value.Payload || selectedSatellite.value.Payload,
      mass: editedSatellite.value.Mass || selectedSatellite.value.Mass,
      vmag: editedSatellite.value.Vmag || selectedSatellite.value.Vmag,
      launchDate: editedSatellite.value.LaunchDate || selectedSatellite.value.LaunchDate,
    }
  });
  
  if (res.error) {
    alert("Error Updating Satellite");
    isLoading.value = false;
    return;
  }
  alert("Satellite Updated Successfully");
  isLoading.value = false;
  selectedSatellite.value.Name = editedSatellite.value.Name || selectedSatellite.value.Name;
  selectedSatellite.value.Payload = editedSatellite.value.Payload || selectedSatellite.value.Payload;
  selectedSatellite.value.Mass = editedSatellite.value.Mass || selectedSatellite.value.Mass;
  selectedSatellite.value.Vmag = editedSatellite.value.Vmag || selectedSatellite.value.Vmag;
  editSatDialog.value = false;
}

function clearSatelliteOrbit() {
  clickedSatelliteArray.forEach((item) => {
    if (item.id && item.id.path) {
      item.id.path.show = new Cesium.ConstantProperty(false);
      // item.id.model.show = new Cesium.ConstantProperty(false);
      // item.id.point.show = new Cesium.ConstantProperty(true);
    }
  });
  clickedSatelliteArray.length = 0;
  selectedSatellite.value = null;
}

function addNewSatelliteafterCheck() {
  isLoading.value = true;
  addNewSatellite({
    name: newSatellite.value.name,
    tleData: newSatellite.value.tleData,
    collision: newSatellite.value.collision,
    secondSatelliteNumber: newSatellite.value.secondSatelliteNumber,
  });
  uploadDialog = false;
  newSatellite.value = {
    name: "",
    tleData: "",
    collision: null,
  };
  isLoading.value = false;
}

async function checkForCollisions() {
  isLoading.value = true;
  const res = await checkCollision({
    name: newSatellite.value.name,
    tleData: newSatellite.value.tleData,
  });

  const error = res.error;
  if(error) {
    alert('Invalid TLE Data');
    return;
  }
  const collision = res.collision;
  const satelliteNumber = res.satelliteNumber;
  if (collision) {
    newSatellite.value.collision = true;
    newSatellite.value.secondSatelliteNumber = satelliteNumber;
    alert(`Collision Detected with Satellite Number: ${satelliteNumber}, you can still add the satellite for testing`);
  } else {
    newSatellite.value.collision = false;
    newSatellite.value.secondSatelliteNumber = null;
    alert("No Collision Detected");
  }
  isLoading.value = false;
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
  addSatellite("all", noOfSatellites.value);
});

watch(noOfSatellites, (newValue) => {
  viewer.entities.removeAll();
  addSatellite("all", newValue);
});
</script>
