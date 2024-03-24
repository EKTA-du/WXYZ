import axios from "axios";

const api = axios.create();

const SERVER_URL = import.meta.env.VITE_APP_SERVER_URL;

api.interceptors.request.use(config => {
    const token = localStorage.getItem("authToken");
    config.headers.Authorization = token ? `Bearer ${token}` : "";
    return config;
});

api.interceptors.response.use(
    res => {
        return res;
    },
    err => {
        if (err.response.status === 401) {
            localStorage.removeItem("authToken");
            window.location.href = "/auth";
        }
        return Promise.reject(err);
    }
);

async function getSatData(noOfSatellites) {
    const res = await api.get(`${SERVER_URL}/satdata?limit=${noOfSatellites}`);
    if (res.status === 200) {
        return Promise.resolve(res.data);
    } else {
        return Promise.reject(res.statusText);
    }
}

async function getSatelliteTypes() {
    const res = await api.get(`${SERVER_URL}/types`);
    if (res.status === 200) {
        return Promise.resolve(res.data);
    } else {
        return Promise.reject(res.statusText);
    }
}

async function getSatDataByID(id) {
    const res = await api.get(`${SERVER_URL}/satdata/${id}`);
    if (res.status === 200) {
        console.log(res.data);
        return Promise.resolve(res.data);
    } else {
        return Promise.reject(res.statusText);
    }
}

async function getCountryFlags(countryName) {
    return axios.get(`${SERVER_URL}/flag/${countryName}`).then(res => {
        if (res.status === 200) {
            return Promise.resolve(res.data);
        } else {
            return Promise.reject(res.statusText);
        }
    });
}

async function getSatDataByType(type, noOfSatellites) {
    return axios.get(`${SERVER_URL}/getSatByType?type=${type}&limit=${noOfSatellites}`).then(res => {
        if (res.status === 200) {
            return Promise.resolve(res.data);
        } else {
            return Promise.reject(res.statusText);
        }
    });
}

async function userSignup(data) {
    const res = await axios.post(`${SERVER_URL}/signup`, data);
    if (res.status === 200) {
        return Promise.resolve(res.data);
    } else {
        return Promise.reject(res.statusText);
    }
}

async function userLogin(data) {
    const res = await axios.post(`${SERVER_URL}/login`, data);
    if (res.status === 200) {
        return Promise.resolve(res.data);
    } else {
        return Promise.reject(res.statusText);
    }
}

async function checkCollision(data) {
    const res = await api.post(`${SERVER_URL}/checkCollision`, data);
    if (res.status === 200) {
        return Promise.resolve(res.data);
    } else {
        return Promise.reject(res.statusText);
    }
}

async function addNewSatellite(data) {
    const res = await api.post(`${SERVER_URL}/addNewSatellite`, data);
    if (res.status === 200) {
        return Promise.resolve(res.data);
    } else {
        return Promise.reject(res.statusText);
    }
}

async function updateSatellite(data) {
    const res = await api.put(`${SERVER_URL}/updateSatellite`, data);
    if (res.status === 200) {
        return Promise.resolve(res.data);
    } else {
        return Promise.reject(res.statusText);
    }
}

export { getSatData, getSatelliteTypes, getSatDataByID, getCountryFlags, getSatDataByType, userSignup, userLogin, checkCollision, addNewSatellite, updateSatellite };