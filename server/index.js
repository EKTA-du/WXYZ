import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import SpaceObjectType from './satObject.js';
import countryObjectType from './countryObject.js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });


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

// CREATE TABLE `AltName` (
//   `Id` int NOT NULL AUTO_INCREMENT,
//   `AltName` text,
//   PRIMARY KEY (`Id`)
// );

// CREATE TABLE `Country` (
//   `Id` int NOT NULL AUTO_INCREMENT,
//   `CountryName` text,
//   PRIMARY KEY (`Id`)
// );

// CREATE TABLE `LaunchPad` (
//   `Id` varchar(4) NOT NULL DEFAULT 'p02',
//   `LaunchPad` text,
//   PRIMARY KEY (`Id`)
// );

// CREATE TABLE `LaunchVehicle` (
//   `Id` varchar(5) NOT NULL DEFAULT 'v283',
//   `LaunchVehicle` text,
//   PRIMARY KEY (`Id`)
// );

// CREATE TABLE `Manufacturer` (
//   `Id` varchar(4) NOT NULL DEFAULT 'm0',
//   `Manufacturer` text,
//   PRIMARY KEY (`Id`)
// );

// CREATE TABLE `ObjType` (
//   `Id` int NOT NULL AUTO_INCREMENT,
//   `Type` varchar(100) DEFAULT NULL,
//   PRIMARY KEY (`Id`)
// );

// CREATE TABLE `Owner` (
//   `Id` int NOT NULL AUTO_INCREMENT,
//   `Owner` text,
//   PRIMARY KEY (`Id`)
// );

// CREATE TABLE `User` (
//   `Id` int NOT NULL AUTO_INCREMENT,
//   `name` varchar(255) NOT NULL,
//   `Email` varchar(255) NOT NULL,
//   `password` varchar(255) NOT NULL,
//   PRIMARY KEY (`Id`),
//   UNIQUE KEY `email` (`Email`)
// );


// CREATE TABLE `ObjData` (
//   `Id` int NOT NULL,
//   `Name` varchar(100) DEFAULT NULL,
//   `Payload` varchar(100) DEFAULT NULL,
//   `Mass` int DEFAULT NULL,
//   `Vmag` double DEFAULT NULL,
//   `LaunchDate` date DEFAULT NULL,
//   `Owner_Id` int DEFAULT NULL,
//   `Country_Id` int DEFAULT NULL,
//   `Manufacturer_Id` varchar(45) DEFAULT NULL,
//   `Bus` varchar(100) DEFAULT NULL,
//   `LaunchMass` int DEFAULT NULL,
//   `DryMass` int DEFAULT NULL,
//   `Length` float DEFAULT NULL,
//   `Diameter` float DEFAULT NULL,
//   `Span` float DEFAULT NULL,
//   `Shape` varchar(100) DEFAULT NULL,
//   `Vehicle_Id` varchar(45) DEFAULT NULL,
//   `Type_Id` int DEFAULT NULL,
//   `Rcs` double DEFAULT NULL,
//   `StableDate` date DEFAULT NULL,
//   `AltName_Id` int DEFAULT NULL,
//   `LaunchPad_Id` varchar(45) DEFAULT NULL,
//   `User_Id` int DEFAULT NULL,
//   PRIMARY KEY (`Id`),
//   KEY `id` (`Id`),
//   KEY `Country_FK_idx` (`Country_Id`),
//   KEY `AltName_FK_idx` (`AltName_Id`),
//   KEY `LaunchPad_FK_idx` (`LaunchPad_Id`),
//   KEY `LaunchVehicle_FK_idx` (`Vehicle_Id`),
//   KEY `Manufacturer_FK_idx` (`Manufacturer_Id`),
//   KEY `Owner_FK_idx` (`Owner_Id`),
//   KEY `Type_FK_idx` (`Type_Id`),
//   KEY `User_FK_idx` (`User_Id`),
//   CONSTRAINT `AltName_FK` FOREIGN KEY (`AltName_Id`) REFERENCES `AltName` (`Id`),
//   CONSTRAINT `Country_FK` FOREIGN KEY (`Country_Id`) REFERENCES `Country` (`Id`),
//   CONSTRAINT `LaunchPad_FK` FOREIGN KEY (`LaunchPad_Id`) REFERENCES `LaunchPad` (`Id`),
//   CONSTRAINT `LaunchVehicle_FK` FOREIGN KEY (`Vehicle_Id`) REFERENCES `LaunchVehicle` (`Id`),
//   CONSTRAINT `Manufacturer_FK` FOREIGN KEY (`Manufacturer_Id`) REFERENCES `Manufacturer` (`Id`),
//   CONSTRAINT `Owner_FK` FOREIGN KEY (`Owner_Id`) REFERENCES `Owner` (`Id`),
//   CONSTRAINT `Type_FK` FOREIGN KEY (`Type_Id`) REFERENCES `ObjType` (`Id`),
//   CONSTRAINT `User_FK` FOREIGN KEY (`User_Id`) REFERENCES `User` (`Id`)
// );

// CREATE TABLE `OrbitData` (
//   `ObjectId` int NOT NULL,
//   `SatelliteNumber` varchar(50) DEFAULT NULL,
//   `InternationalDesignator` text,
//   `EpochYear` int DEFAULT NULL,
//   `EpochDay` double DEFAULT NULL,
//   `FirstTimeDerivative` double DEFAULT NULL,
//   `SecondTimeDerivative` text,
//   `BSTAR` text,
//   `ElementNumber` int DEFAULT NULL,
//   `Inclination` double DEFAULT NULL,
//   `RightAscension` double DEFAULT NULL,
//   `Eccentricity` int DEFAULT NULL,
//   `ArgumentOfPerigee` double DEFAULT NULL,
//   `MeanAnomaly` double DEFAULT NULL,
//   `MeanMotion` double DEFAULT NULL,
//   `RevolutionNumber` int DEFAULT NULL,
//   PRIMARY KEY (`ObjectId`),
//   CONSTRAINT `OBJDATA_FK` FOREIGN KEY (`ObjectId`) REFERENCES `ObjData` (`Id`)
// );

// CREATE TABLE `Collisions` (
//   `ID` int NOT NULL,
//   `User_ID` int DEFAULT NULL,
//   `Object1` int DEFAULT NULL,
//   `Object2` int DEFAULT NULL,
//   `CollisionTime` datetime DEFAULT NULL,
//   PRIMARY KEY (`ID`),
//   KEY `User_FK_idx` (`User_ID`),
//   KEY `Collision_FK1` (`Object1`),
//   KEY `Collision_FK2` (`Object2`),
//   CONSTRAINT `Collision_FK1` FOREIGN KEY (`Object1`) REFERENCES `ObjData` (`Id`),
//   CONSTRAINT `Collision_FK2` FOREIGN KEY (`Object2`) REFERENCES `ObjData` (`Id`),
//   CONSTRAINT `User_Collision_FK` FOREIGN KEY (`User_ID`) REFERENCES `User` (`Id`)
// );



app.get('/satdata', authenticateToken, (req, res) => {
  console.log('Fetching TLE data from database');
  connection.query('SELECT Obj.id, Obj.NAME, Orbit.SatelliteNumber, Orbit.InternationalDesignator, Orbit.EpochYear, Orbit.EpochDay, Orbit.FirstTimeDerivative, Orbit.SecondTimeDerivative, Orbit.BSTAR, Orbit.ElementNumber, Orbit.Inclination, Orbit.RightAscension, Orbit.Eccentricity, Orbit.ArgumentOfPerigee, Orbit.MeanAnomaly, Orbit.MeanMotion, Orbit.RevolutionNumber FROM ObjData Obj INNER JOIN OrbitData Orbit ON Obj.id = Orbit.ObjectId LIMIT 1', (err, results) => {
    if (err) {
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
  const satType = req.query.type;
  connection.query('SELECT id, NAME, TLE1, TLE2 FROM satdata2 WHERE type = ? LIMIT 50', [satType], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'An error occurred while fetching data' });
      return;
    }
    // add country flag property to the result
    results.forEach(result => {
      result.flag = getCountryCode(result.country);
    });
    res.json(results);
  });
});

app.get('/satdata/:id', (req, res) => {
  const id = req.params.id;
  connection.query('SELECT Obj.*  FROM ObjData Obj WHERE Obj.Id = ?', [id], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'An error occurred while fetching data' });
      return;
    }
    results.forEach(result => {
      // result.flag = getCountryCode(result.country);
    });
    res.json(results);
  });
});

function getCountryCode(countryName) {
  const countryCode = countryObjectType[countryName];
  if (countryCode) {
    return `https://flagsapi.com/${countryCode}/shiny/16.png`;
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
    if (err) {
      res.status(500).json({ error: 'An error occurred while logging in' });
      return;
    }
    if (results.length > 0) {
      const token = jwt.sign({ id: results[0].id }, JWT_SECRET, { expiresIn: '1h' });
      res.status(200).json({ message: 'User logged in successfully', token: token });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  });
});


app.listen(5174, () => {
  console.log('Server is running on port 5174');
});

export default app;