import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import authenticateToken from './auth.js';
import connection from './db.js';
import ParseTLE from './tle.js';
import checkCollision from './collision.js';

const app = express();


app.use(cors());
app.use(express.json());

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
  (SELECT Obj.id, Obj.NAME, Obj.User_Id, Orbit.SatelliteNumber, Orbit.InternationalDesignator, Orbit.EpochYear, Orbit.EpochDay, Orbit.FirstTimeDerivative, Orbit.SecondTimeDerivative, Orbit.BSTAR, Orbit.ElementNumber, Orbit.Inclination, Orbit.RightAscension, Orbit.Eccentricity, Orbit.ArgumentOfPerigee, Orbit.MeanAnomaly, Orbit.MeanMotion, Orbit.RevolutionNumber FROM ObjData Obj INNER JOIN OrbitData Orbit ON Obj.id = Orbit.ObjectId LIMIT ?)
  UNION ALL
  (SELECT Obj.id, Obj.NAME, Obj.User_Id, Orbit.SatelliteNumber, Orbit.InternationalDesignator, Orbit.EpochYear, Orbit.EpochDay, Orbit.FirstTimeDerivative, Orbit.SecondTimeDerivative, Orbit.BSTAR, Orbit.ElementNumber, Orbit.Inclination, Orbit.RightAscension, Orbit.Eccentricity, Orbit.ArgumentOfPerigee, Orbit.MeanAnomaly, Orbit.MeanMotion, Orbit.RevolutionNumber FROM ObjData Obj INNER JOIN OrbitData Orbit ON Obj.id = Orbit.ObjectId WHERE Obj.User_Id = ?)
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
  connection.query('SELECT Obj.id, Obj.NAME, Obj.User_Id, Orbit.SatelliteNumber, Orbit.InternationalDesignator, Orbit.EpochYear, Orbit.EpochDay, Orbit.FirstTimeDerivative, Orbit.SecondTimeDerivative, Orbit.BSTAR, Orbit.ElementNumber, Orbit.Inclination, Orbit.RightAscension, Orbit.Eccentricity, Orbit.ArgumentOfPerigee, Orbit.MeanAnomaly, Orbit.MeanMotion, Orbit.RevolutionNumber FROM ObjData Obj INNER JOIN OrbitData Orbit ON Obj.id = Orbit.ObjectId WHERE Obj.Type_Id = ? LIMIT ?', [satType, limit], (err, results) => {
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
    console.log(error);
    res.status(400).json({ error: 'Invalid TLE data' });
    return;
  }
  checkCollision(data)
    .then(result => {
      res.json(result);
    })
    .catch(error => {
      console.log(error);
      res.json({ error: 'An error occurred while checking for collision' });
    });
});

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
  connection.query('UPDATE ObjData SET Name = ?, Payload = ?, Mass = ?, Vmag = ?, LaunchDate = ? WHERE id = ?', [data.name, data.payload, data.mass, data.vmag, data.launchDate, id], (err, results) => {
    if (err) {
      console.log(err);
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