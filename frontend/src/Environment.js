const DEVELOPMENT_MODE = false;

const Environment = {
    API_BASE: (DEVELOPMENT_MODE) ? "http://localhost:3001" : "https://vcar-clube-vbot-backend.pvuzyy.easypanel.host",
    HEADERS: { 
        headers: { 
            VBOT_ACCESS_TOKEN : localStorage.getItem("VBOT_ACCESS_TOKEN")
        } 
    },
}

export default Environment;