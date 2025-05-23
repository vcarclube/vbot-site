const DEVELOPMENT_MODE = true;

const Environment = {
    API_BASE: (DEVELOPMENT_MODE) ? "http://localhost:3001" : "http://localhost:3001",
    HEADERS: { 
        headers: { 
            VBOT_ACCESS_TOKEN : localStorage.getItem("VBOT_ACCESS_TOKEN")
        } 
    },
}

export default Environment;