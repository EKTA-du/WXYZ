import express from 'express';
import mysql from 'mysql';
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
  host: 'localhost',
  user: 'spacetracker',
  password: 'spacetracker',
  database: 'space_tracker'
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
  console.log('Fetching TLE data from database');
  connection.query('SELECT id, NAME, TLE1, TLE2  FROM satdata2 LIMIT 20', (err, results) => {
    if (err) {
      return res.send(err);
    } else {
      res.setHeader('Content-Type', 'application/json');
      return res.json({
        data: results
      });
    }
  });
});

app.get('/types', (req, res) => {
  connection.query('SELECT DISTINCT type FROM satdata2', (err, results) => {
    if (err) {
    } else {
      const dbTypes = results.map(result => result.type);
      const validTypes = Object.keys(SpaceObjectType)
        .filter(type => dbTypes.includes(Number(type)))
        .map(type => ({ value: type, label: SpaceObjectType[type] }));
      res.json(validTypes);
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
  connection.query('SELECT * FROM satdata2 WHERE id = ?', [id], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'An error occurred while fetching data' });
      return;
    }
    results.forEach(result => {
      result.flag = getCountryCode(result.country);
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
  connection.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password], (err, results) => {
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
  connection.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, results) => {
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