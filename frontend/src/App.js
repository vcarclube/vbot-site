import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { MainContext } from "./helpers/MainContext";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Api from './Api';
import Utils from './Utils';
import { Home, Login, PageNotFound } from './pages';

function App() {

  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    load();
  }, [])

  const load = async () => {
    const { success: authSuccess } = await Utils.processRequest(Api.auth, {}, true);
    if (authSuccess) {
      const { data } = await Utils.processRequest(Api.get, {}, true);
      setAuthenticated(true);
      setUser(data?.data)
    } else {
      setAuthenticated(false);
      setUser(null);
    }
  }

  const logout = (reloadPage, callback) => {
    localStorage.removeItem("VBOT_ACCESS_TOKEN");
    if (callback) {
      callback();
    }
    if(reloadPage){
      window.location.reload();
    }
  }

  return (
    <MainContext.Provider value={{ authenticated, user, setUser, logout }}>
      <Router>
        <Routes>
          <Route path="/login" element={ <Login />} />
          <Route path="*" element={<PageNotFound />} />
          {/*==================PRIVATE-ROUTES===================*/}
          <Route exact path="/" element={user ? <Home /> : <Login />} />
        </Routes>
        <ToastContainer style={{ zIndex: 999999 }} />
      </Router>
    </MainContext.Provider>
  );
}

export default App;
