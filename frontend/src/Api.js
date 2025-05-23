import axios from "axios";
import Environment from "./Environment";

const API_BASE = Environment.API_BASE;

const Api = {
    auth: async () => {
        return await axios.get(`${API_BASE}/users/auth`, Environment.HEADERS).then(async (response) => {
            return await response;
        }).catch(err => {
            return err;
        });
    },
    get: async () => {
        return await axios.get(`${API_BASE}/users/get`, Environment.HEADERS).then(async (response) => {
            return await response;
        }).catch(err => {
            return err;
        });
    },
    login: async ({ email, password }) => {
        return await axios.post(`${API_BASE}/users/login`, {email, password}).then(async (response) => {
            return await response;
        }).catch(err => {
            return err;
        });
    },
    getCampanhas: async ({}) => {
        return await axios.get(`${API_BASE}/campanhas`, Environment.HEADERS).then(async (response) => {
            return await response;
        }).catch(err => {
            return err;
        });
    }
}

export default Api;