import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import SpaceObjectType from './satObject.js';
import countryObjectType from './countryObject.js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import satellite from 'satellite.js';

const app = express();

const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});


function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(401);
    }

    req.user = user;
    next();
  });
}

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.get('/satdata', authenticateToken, (req, res) => {
  const limit = parseInt(req.query.limit);
  if (!limit) {
    limit = 10;
  }
  const User_Id = req.user.id;
  const query = `
  (SELECT Obj.id, Obj.NAME, Orbit.SatelliteNumber, Orbit.InternationalDesignator, Orbit.EpochYear, Orbit.EpochDay, Orbit.FirstTimeDerivative, Orbit.SecondTimeDerivative, Orbit.BSTAR, Orbit.ElementNumber, Orbit.Inclination, Orbit.RightAscension, Orbit.Eccentricity, Orbit.ArgumentOfPerigee, Orbit.MeanAnomaly, Orbit.MeanMotion, Orbit.RevolutionNumber FROM ObjData Obj INNER JOIN OrbitData Orbit ON Obj.id = Orbit.ObjectId LIMIT ?)
  UNION ALL
  (SELECT Obj.id, Obj.NAME, Orbit.SatelliteNumber, Orbit.InternationalDesignator, Orbit.EpochYear, Orbit.EpochDay, Orbit.FirstTimeDerivative, Orbit.SecondTimeDerivative, Orbit.BSTAR, Orbit.ElementNumber, Orbit.Inclination, Orbit.RightAscension, Orbit.Eccentricity, Orbit.ArgumentOfPerigee, Orbit.MeanAnomaly, Orbit.MeanMotion, Orbit.RevolutionNumber FROM ObjData Obj INNER JOIN OrbitData Orbit ON Obj.id = Orbit.ObjectId WHERE Obj.User_Id = ?)
`;
connection.query(query, [limit, User_Id], (err, results) => {
  if (err) {
    console.log(err);
    res.status(500).json({ error: 'An error occurred while fetching data' });
    return;
  }
  res.json(results);
});
});

app.get('/types', (req, res) => {
  connection.query('SELECT * FROM ObjType', (err, results) => {
    if (err) {
      res.status(500).json({ error: 'An error occurred while fetching data' });
      return;
    } else {
      const types = results.map(result => ({ value: result.Id, label: result.Type }));
      res.json(types);
    }
  });
});

app.get('/getSatByType', (req, res) => {
  const limit = parseInt(req.query.limit);
  if(!limit) {
    limit = 10;
  }
  const satType = req.query.type;
  connection.query('SELECT Obj.id, Obj.NAME, Orbit.SatelliteNumber, Orbit.InternationalDesignator, Orbit.EpochYear, Orbit.EpochDay, Orbit.FirstTimeDerivative, Orbit.SecondTimeDerivative, Orbit.BSTAR, Orbit.ElementNumber, Orbit.Inclination, Orbit.RightAscension, Orbit.Eccentricity, Orbit.ArgumentOfPerigee, Orbit.MeanAnomaly, Orbit.MeanMotion, Orbit.RevolutionNumber FROM ObjData Obj INNER JOIN OrbitData Orbit ON Obj.id = Orbit.ObjectId WHERE Obj.Type_Id = ? LIMIT ?', [satType, limit], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'An error occurred while fetching data' });
      return;
    }
    res.json(results);
  });
});

app.get('/satdata/:id', (req, res) => {
  const id = req.params.id;
  connection.query(`
  SELECT 
    Obj.*, 
    C.CountryName, 
    C.CountryCode, 
    M.Manufacturer, 
    T.Type, 
    O.Owner, 
    A.AltName, 
    L.LaunchPad, 
    V.LaunchVehicle 
  FROM 
    ObjData Obj 
    LEFT JOIN Country C ON Obj.Country_Id = C.Id 
    LEFT JOIN Manufacturer M ON Obj.Manufacturer_Id = M.Id 
    LEFT JOIN ObjType T ON Obj.Type_Id = T.Id 
    LEFT JOIN Owner O ON Obj.Owner_Id = O.Id 
    LEFT JOIN AltName A ON Obj.AltName_Id = A.Id 
    LEFT JOIN LaunchPad L ON Obj.LaunchPad_Id = L.Id 
    LEFT JOIN LaunchVehicle V ON Obj.Vehicle_Id = V.Id 
  WHERE 
    Obj.id = ?
`, [id], (err, results) => {
      if (err) {
      res.status(500).json({ error: 'An error occurred while fetching data' });
      return;
    }
    results.forEach(result => {
      result.Flag = getCountryCode(result.CountryCode);
    });
    res.json(results);
  });
});

function getCountryCode(CountryCode) {
  if (CountryCode) {
    return `https://flagsapi.com/${CountryCode}/shiny/16.png`;
  } else {
    return null;
  }
};

app.post('/signup', (req, res) => {
  const { name, email, password } = req.body;
  connection.query('INSERT INTO User (name, email, password) VALUES (?, ?, ?)', [name, email, password], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ error: 'An error occurred while signing up' });
      return;
    }
    res.status(200).json({ message: 'User signed up successfully' });
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  connection.query('SELECT * FROM User WHERE email = ? AND password = ?', [email, password], (err, results) => {
    console.log(results);
    if (err) {
      res.status(500).json({ error: 'An error occurred while logging in' });
      return;
    }
    if (results.length > 0) {
      const token = jwt.sign({ id: results[0].Id }, JWT_SECRET, { expiresIn: '1h' });
      res.status(200).json({ message: 'User logged in successfully', token: token });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  });
});


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


function gmst(date) {
  const jd = satellite.jday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
  return satellite.gstime(jd);
}


app.post('/checkCollision', authenticateToken, (req, res) => {
  const tleData = req.body.tleData;
  if (!tleData) {
    res.status(400).json({ error: 'Missing TLE data' });
    return;
  }
  let data;
  try {
    data = ParseTLE(tleData);
  } catch (error) {
    res.status(400).json({ error: 'Invalid TLE data' });
    return;
  }
  checkCollision(data)
    .then(result => {
      res.json(result);
    })
    .catch(error => {
      res.json({ error: 'An error occurred while checking for collision' });
    });
});

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

app.post('/addNewSatellite', authenticateToken, (req, res) => {
  const {
    name,
    tleData,
    collision,
    secondSatelliteId,
  } = req.body;
  const userId = req.user.id;
  const tle = ParseTLE(tleData);
  connection.beginTransaction(function (err) {
    if (err) {
      throw err;
    }
    connection.query('INSERT INTO ObjData (Name, User_Id) VALUES (?, ?)', [name, userId], function (err, result) {
      if (err) {
        connection.rollback(function () {
          throw err;
        });
      }
      const ObjectId = result.insertId;
      //insert into OrbitData
      connection.query('INSERT INTO OrbitData (ObjectId, SatelliteNumber, InternationalDesignator, EpochYear, EpochDay, FirstTimeDerivative, SecondTimeDerivative, BSTAR, ElementNumber, Inclination, RightAscension, Eccentricity, ArgumentOfPerigee, MeanAnomaly, MeanMotion, RevolutionNumber) VALUES (?, ?, ? ,? ,? ,? ,? ,? ,? ,? ,? ,? ,? ,? ,? ,?)', [ObjectId, tle.SatelliteNumber, tle.InternationalDesignator, tle.EpochYear, tle.EpochDay, tle.FirstTimeDerivative, tle.SecondTimeDerivative, tle.BSTAR, tle.ElementNumber, tle.Inclination, tle.RightAscension, tle.Eccentricity, tle.ArgumentOfPerigee, tle.MeanAnomaly, tle.MeanMotion, tle.RevolutionNumber], function (err, result) {
        if (err) {
          connection.rollback(function () {
            throw err;
          });
        }
        if (collision) {
          connection.query('INSERT INTO Collisions (Object1, Object2, CollisionTime, User_ID) VALUES (?, ?, ?, ?)', [ObjectId, secondSatelliteId, new Date(), userId], function (err, result) {
            if (err) {
              connection.rollback(function () {
                throw err;
              });
            }
            connection.commit(function (err) {
              if (err) {
                connection.rollback(function () {
                  throw err;
                });
              }
              res.json({ message: 'Satellite added successfully' });
            });
          });
        } else {
          connection.commit(function (err) {
            if (err) {
              connection.rollback(function () {
                throw err;
              });
            }
            res.json({ message: 'Satellite added successfully' });
          });
        }
      }
      );
    }
    );
  }
  );
});

app.put('/updateSatellite', authenticateToken, (req, res) => {
  const { id, data } = req.body;
  console.log(id, data);
  connection.query('UPDATE ObjData SET Name = ?, Payload = ?, Mass = ?, Vmag = ?, LaunchDate = ? WHERE id = ?', [data.name, data.payload, data.mass, data.vmag, data.launchDate, id], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'An error occurred while updating data' });
      return;
    }
    res.json({ message: 'Satellite updated successfully' });
  }
  );
} 
);


app.listen(5174, () => {
  console.log('Server is running on port 5174');
});

export default app;