import { twoline2satrec, propagate } from "satellite.js";
import * as Cesium from "cesium";
const SatModel = new URL('@/assets/models/ISS_stationary.glb', import.meta.url).href;

class SatelliteEntity {

    constructor(tle = "", options = {}) {
        const id = tle.id;
        const name = tle.NAME;
        const tleLine1 = `1 ${tle.SatelliteNumber} ${tle.InternationalDesignator} ${tle.EpochYear}${tle.EpochDay}  ${tle.FirstTimeDerivative}  ${tle.SecondTimeDerivative}  ${tle.BSTAR} 0 ${tle.ElementNumber}`;
        const tleLine2 = `2 ${tle.SatelliteNumber} ${tle.Inclination} ${tle.RightAscension} ${tle.Eccentricity} ${tle.ArgumentOfPerigee} ${tle.MeanAnomaly} ${tle.MeanMotion} ${tle.RevolutionNumber}`;

        this.id = id;
        this.name = name.trim();
        this.tleLine1 = "1 58998U 24036A   24083.54243187  .00020300  00000+0  74334-3 0  9993";
        this.tleLine2 = "2 58998  53.1616 163.4567 0001500  78.9719 281.1449 15.28029318  5702";
        this.satrec = twoline2satrec(this.tleLine1, this.tleLine2);
        const circle = tleLine2.split(52, 64);

        this.totalSeconds = 86400;
        this.stepSeconds = 100;
        this.leadTime = parseInt(24 * 3600 / circle);
        this.trailTime = 0;

    }

    getPositionEci(time) {
        return propagate(this.satrec, time).position;
    }

    _getPositionProperty() {
        const start = Cesium.JulianDate.fromIso8601(new Date().toISOString());
        const positionProperty = new Cesium.SampledPositionProperty(Cesium.ReferenceFrame.INERTIAL);

        let now = Date.now();
        for (let i = 0; i < this.totalSeconds / this.stepSeconds; i++) {
            let sateTime = new Date(now + i * this.stepSeconds * 1000);
            let sateCoord = this.getPositionEci(sateTime);
            if (!sateCoord) continue;
            const cesiumTime = Cesium.JulianDate.addSeconds(start, i * this.stepSeconds, new Cesium.JulianDate());
            const cesiumPosition = { x: sateCoord.x * 1000, y: sateCoord.y * 1000, z: sateCoord.z * 1000 };
            positionProperty.addSample(cesiumTime, cesiumPosition);
        }
        return positionProperty;
    }

    createSatelliteEntity() {
        const start = Cesium.JulianDate.fromIso8601(new Date().toISOString());
        const stop = Cesium.JulianDate.addSeconds(start, this.totalSeconds, new Cesium.JulianDate());
        let satelliteEntity = {
            id: this.id,
            name: this.name,
            description: this.name,
            availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({ start: start, stop: stop })]),
            position: this._getPositionProperty(),
            point: {
                pixelSize: 8,
                color: Cesium.Color.fromRandom({ alpha: 1.0 }),
                scaleByDistance: new Cesium.NearFarScalar(1.5e3, 1, 8.0e8, 0.5),
            },
            // model: {
            //     uri: SatModel,
            //     minimumPixelSize: 100,
            //     maximumScale: 10000,
            // },
            path: new Cesium.PathGraphics({
                width: 1,
                show: false,
                leadTime: this.leadTime,
                trailTime: this.trailTime,
                material: Cesium.Color.LIME,
            }),
            label: {
                text: this.name,
                font: '12px sans-serif',
                showBackground: true,
                backgroundColor: new Cesium.Color(0.165, 0.165, 0.165, 0.5),
                backgroundPadding: new Cesium.Cartesian2(4, 4),
                outlineWidth: 1,
                verticalOrigin: Cesium.VerticalOrigin.TOP,
                horizontalOrigin: Cesium.VerticalOrigin.LEFT,
                pixelOffset: new Cesium.Cartesian2(0, 5),
                fillColor: Cesium.Color.WHITE,
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(10.0, 5000000),
            }
        }
        return satelliteEntity;
    }
}

export default SatelliteEntity