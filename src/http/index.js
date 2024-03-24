import axios from "axios";

const api = axios.create();

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

async function getSatData(path = "") {
    const res = await api.get(`http://localhost:5174/satdata`);
    if (res.status === 200) {
        return Promise.resolve(res.data);
    } else {
        return Promise.reject(res.statusText);
    }
}

async function getSatelliteTypes() {
    const res = await api.get(`http://localhost:5174/types`);
    if (res.status === 200) {
        return Promise.resolve(res.data);
    } else {
        return Promise.reject(res.statusText);
    }
}

async function getSatDataByID(id) {
    const res = await api.get(`http://localhost:5174/satdata/${id}`);
    if (res.status === 200) {
        console.log(res.data);
        return Promise.resolve(res.data);
    } else {
        return Promise.reject(res.statusText);
    }
}

async function getCountryFlags(countryName) {
    return axios.get(`http://localhost:5174/flag/${countryName}`).then(res => {
        if (res.status === 200) {
            return Promise.resolve(res.data);
        } else {
            return Promise.reject(res.statusText);
        }
    });
}

async function getSatDataByType(type) {
    return axios.get(`http://localhost:5174/getSatByType?type=${type}`).then(res => {
        if (res.status === 200) {
            return Promise.resolve(res.data);
        } else {
            return Promise.reject(res.statusText);
        }
    });
}

async function userSignup(data) {
    const res = await axios.post(`http://localhost:5174/signup`, data);
    if (res.status === 200) {
        return Promise.resolve(res.data);
    } else {
        return Promise.reject(res.statusText);
    }
}

async function userLogin(data) {
    const res = await axios.post(`http://localhost:5174/login`, data);
    if (res.status === 200) {
        return Promise.resolve(res.data);
    } else {
        return Promise.reject(res.statusText);
    }
}


export { getSatData, getSatelliteTypes, getSatDataByID, getCountryFlags, getSatDataByType, userSignup, userLogin };