import axios from "axios";
import Environment from "./Environment";

const API_BASE = Environment.API_BASE;

const Api = {

    // Métodos genéricos
    generic_get: async (url, headers, params) => {
        try {
            const response = await axios.get(url, { params }, headers);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error };
        }
    },

    generic_post: async (url, headers, data) => {
        try {
            const response = await axios.post(url, data, headers);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error };
        }
    },

    generic_put: async (url, headers, data) => {
        try {
            const response = await axios.put(url, data, headers);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error };
        }
    },

    generic_delete: async (url, headers) => {
        try {
            const response = await axios.delete(url, headers);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error };
        }
    },
    // Métodos genéricos

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
        return await axios.post(`${API_BASE}/users/login`, { email, password }).then(async (response) => {
            return await response;
        }).catch(err => {
            return err;
        });
    },
    // Leads
    getLeads: async () => {
        return await axios.get(`${API_BASE}/leads/all`, Environment.HEADERS).then(async (response) => {
            return await response;
        }).catch(err => {
            return err;
        });
    },

    getLead: async (id) => {
        try {
            const response = await axios.get(`${API_BASE}/leads/${id}`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error };
        }
    },

    createLead: async (leadData) => {
        try {
            const response = await axios.post(`${API_BASE}/leads/save`, leadData, Environment.HEADERS);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error };
        }
    },

    updateLead: async (id, leadData) => {
        try {
            const response = await axios.put(`${API_BASE}/leads/${id}`, leadData, Environment.HEADERS);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error };
        }
    },

    deleteLead: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE}/leads/delete/${id}`, Environment.HEADERS);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error };
        }
    },

    importLeads: async (leadsData, grupoNome) => {
        try {
            const response = await axios.post(`${API_BASE}/leads/import`, { leads: leadsData, grupoNome: grupoNome }, Environment.HEADERS);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Erro ao importar leads' };
        }
    },

    // Métodos para campanhas
    getCampanhas: async () => {
        try {
            const response = await axios.get(`${API_BASE}/campanhas`, Environment.HEADERS);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Erro ao buscar campanhas' };
        }
    },

    getCampanha: async (id) => {
        try {
            const response = await axios.get(`${API_BASE}/campanhas/${id}`, Environment.HEADERS);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Erro ao buscar campanha' };
        }
    },

    createCampanha: async (data) => {
        try {
            const response = await axios.post(`${API_BASE}/campanhas`, data, Environment.HEADERS);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Erro ao criar campanha' };
        }
    },

    updateCampanha: async (id, data) => {
        try {
            const response = await axios.put(`${API_BASE}/campanhas/${id}`, data, Environment.HEADERS);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Erro ao atualizar campanha' };
        }
    },

    updateCampanhaStatus: async (id, status) => {
        try {
            const response = await axios.put(`${API_BASE}/campanhas/${id}/status`, { status }, Environment.HEADERS);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Erro ao atualizar status da campanha' };
        }
    },

    deleteCampanha: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE}/campanhas/${id}`, Environment.HEADERS);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Erro ao remover campanha' };
        }
    },

    getGruposLeads: async () => {
        try {
            const response = await axios.get(`${API_BASE}/campanhas/leads/grupos`, Environment.HEADERS);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Erro ao buscar grupos de leads' };
        }
    },
}

export default Api;