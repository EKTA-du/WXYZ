import satellite from 'satellite.js';
import connection from './db.js';

function checkCollision(tleData) {
  return new Promise((resolve, reject) => {
    const tleDataLine1 = `1 ${tleData.SatelliteNumber} ${tleData.InternationalDesignator} ${tleData.EpochYear}${tleData.EpochDay}  ${tleData.FirstTimeDerivative}  ${tleData.SecondTimeDerivative}  ${tleData.BSTAR} 0 ${tleData.ElementNumber}`;
    const tleDataLine2 = `2 ${tleData.SatelliteNumber} ${tleData.Inclination} ${tleData.RightAscension} ${tleData.Eccentricity} ${tleData.ArgumentOfPerigee} ${tleData.MeanAnomaly} ${tleData.MeanMotion} ${tleData.RevolutionNumber}`;
    const satrec = satellite.twoline2satrec(tleDataLine1, tleDataLine2);
    const now = new Date();
    const query = 'SELECT * FROM OrbitData';
    connection.query(query, (error, results) => {
      if (error) {
        reject(error);
        return;
      }
      for (const orbitData of results) {
        const {
          Inclination,
          RightAscension,
          Eccentricity,
          ArgumentOfPerigee,
          MeanAnomaly,
          MeanMotion,
        } = orbitData;
        const satrecDb = satellite.twoline2satrec(
          `1 ${orbitData.SatelliteNumber}U ${orbitData.InternationalDesignator} ${orbitData.EpochYear}${orbitData.EpochDay} ${orbitData.FirstTimeDerivative} ${orbitData.SecondTimeDerivative} ${orbitData.BSTAR} 0 ${orbitData.ElementNumber}`,
          `2 ${orbitData.SatelliteNumber} ${Inclination} ${RightAscension} ${Eccentricity} ${ArgumentOfPerigee} ${MeanAnomaly} ${MeanMotion} ${orbitData.RevolutionNumber}`
        );

        const positionTle = satellite.propagate(satrec, now).position;
        const positionDb = satellite.propagate(satrecDb, now).position;
        if (!positionTle || !positionDb) {
          continue;
        }
        // Calculate the distance between the two satellites
        const distance = Math.sqrt(
          Math.pow(positionTle.x - positionDb.x, 2) +
          Math.pow(positionTle.y - positionDb.y, 2) +
          Math.pow(positionTle.z - positionDb.z, 2)
        );
        // Check if the distance is within a certain threshold (e.g., 100 km)
        if (distance < 100) {
          // Collision detected
          resolve({
            collision: true,
            satelliteNumber: orbitData.SatelliteNumber,
          });
          return;
        }
      }
      resolve({ collision: false });
    });
  });
}


export default checkCollision;