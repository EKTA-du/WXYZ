# SPACE OBJECT TRACKER (Satellite Tracker)

A **5th Semester DBMS Mini-project** submitted in partial fulfillment of the requirements for the degree of Bachelor of Engineering in Computer Science and Engineering at Visvesvaraya Technological University.

**The Space Object Tracker** is a sophisticated web application that leverages cutting-edge technologies such as Vue.js, Cesium, and Three.js for the frontend, and Node.js with Express and a MySQL database for the backend.

## Table of Contents

1. [Requirements](#requirements)
2. [Libraries](#libraries)
3. [Setup](#setup)
4. [ER Diagram](#er-diagram)
5. [Schema Diagram](#schema-diagram)
6. [What is TLE?](#what-is-tle)
7. [Snapshots](#snapshots)

## Requirements

- **Frontend**: Vue.js
- **Backend**: Node.js
- **Database**: MySQL

## Libraries

- **CesiumJS**
- **ThreeJS**

## Setup

1. **Clone this repository:**
    ```sh
    git clone git@github.com:HackerDMK/SatelliteTracker.git
    ```

2. **Setup the database:**
    - Use the SQL file stored in the `database` folder to set up the database.
    - Create a `.env` file with the following values:
        ```env
        JWT_SECRET=
        DB_HOST=
        DB_USER=
        DB_PASSWORD=
        DB_NAME=
        VITE_CESIUM_ION_TOKEN=
        VITE_APP_SERVER_URL=
        ```

3. **Install and run the frontend:**
    ```sh
    npm install
    npm run dev:frontend
    ```

4. **Install and run the backend:**
    ```sh
    cd server
    npm install
    npm run dev:backend
    ```

To run both the frontend and backend simultaneously, use the command:
```sh
npm run dev
```

## ER Diagram

![ER Diagram](https://github.com/HackerDMK/SatelliteTracker/blob/main/Images/ER_Diagram.png)

## Schema Diagram

![Schema Diagram](https://github.com/HackerDMK/SatelliteTracker/blob/main/Images/Schema_Diagram.png)

## What is TLE?

Two-Line Elements (TLE) is a standardized format used to describe the orbit of a satellite. It consists of a set of data that includes important orbital parameters, such as the satellite’s position, velocity, and other relevant information at a specific epoch or time. The TLE format was developed to provide a compact and standardized way to convey essential orbital data for tracking and predicting the motion of satellites. It is widely used by various organizations, including satellite operators, space agencies, and tracking networks.

### TLE Format

- **Line 1** includes:
  - Satellite’s name or identification number
  - International Designator
  - Epoch time (specific time at which the orbital parameters are valid)
  - Orbital elements such as inclination, right ascension of the ascending node, and eccentricity.
![TLE1](https://github.com/HackerDMK/SatelliteTracker/blob/main/Images/TLE1.png)

- **Line 2** includes:
  - Argument of perigee
  - Mean anomaly
  - Mean motion
  - Revolution number
![TLE2](https://github.com/HackerDMK/SatelliteTracker/blob/main/Images/TLE2.png)

These parameters allow for precise calculation of the satellite’s position and velocity at any given time. TLE data is generated based on observations from ground-based tracking stations, radar systems, or other tracking methods. It's important to note that TLE data is time-sensitive and must be updated regularly to maintain accuracy.

![TLE Example](https://github.com/HackerDMK/SatelliteTracker/blob/main/Images/TLE_Main.png)

## Snapshots

![SigninPage](https://github.com/HackerDMK/SatelliteTracker/blob/main/Images/SignIn.png)
![Dashboard](https://github.com/HackerDMK/SatelliteTracker/blob/main/Images/Dashboard.png)
![2D_View](https://github.com/HackerDMK/SatelliteTracker/blob/main/Images/2D_View.png)
![Sat_Info](https://github.com/HackerDMK/SatelliteTracker/blob/main/Images/Sat_Info.png)
![Sat_View](https://github.com/HackerDMK/SatelliteTracker/blob/main/Images/Sat_View.png)
