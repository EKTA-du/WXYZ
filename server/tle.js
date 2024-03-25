function ParseTLE(tleData) {
  const lines = tleData.split('\n');
  const tle1 = lines[0];
  const tle2 = lines[1];

  const satelliteNumber = tle1.slice(2, 8);
  const internationalDesignator = tle1.slice(9, 17).trim();
  const epochYear = tle1.slice(18, 19);
  const epochDay = tle1.slice(19, 32).trim();
  const firstTimeDerivative = tle1.slice(34, 43);
  const secondTimeDerivative = tle1.slice(44, 52);
  const bstar = tle1.slice(53, 61);
  const elementNumber = tle1.slice(65, 69);
  const inclination = tle2.slice(9, 16);
  const rightAscension = tle2.slice(18, 25);
  const eccentricity = `${tle2.slice(26, 33)}`;
  const argumentOfPerigee = tle2.slice(34, 42);
  const meanAnomaly = tle2.slice(43, 51);
  const meanMotion = tle2.slice(52, 63);
  const revolutionNumber = tle2.slice(64, 69);

  // console.log(
  //   `1 ${satelliteNumber} ${internationalDesignator} ${epochYear}${epochDay}  ${firstTimeDerivative}  ${secondTimeDerivative}  ${bstar} 0 ${elementNumber}\n` +
  //   `2 ${satelliteNumber} ${inclination} ${rightAscension} ${eccentricity} ${argumentOfPerigee} ${meanAnomaly} ${meanMotion} ${revolutionNumber}`
  // );

  return {
    SatelliteNumber: satelliteNumber,
    InternationalDesignator: internationalDesignator,
    EpochYear: epochYear,
    EpochDay: epochDay,
    FirstTimeDerivative: firstTimeDerivative,
    SecondTimeDerivative: secondTimeDerivative,
    BSTAR: bstar,
    ElementNumber: elementNumber,
    Inclination: inclination,
    RightAscension: rightAscension,
    Eccentricity: eccentricity,
    ArgumentOfPerigee: argumentOfPerigee,
    MeanAnomaly: meanAnomaly,
    MeanMotion: meanMotion,
    RevolutionNumber: revolutionNumber,
  };
}

export default ParseTLE;