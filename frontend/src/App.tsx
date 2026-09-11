import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./components/Home.jsx";
import Mapa from "./components/Mapa.jsx";
import POI from "./components/POI.jsx";
import Grafico from "./components/Graficos.jsx";
import { PoiProvider } from "./context/PoiContext";
import "./index.css";

export default function App() {
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    document.title = "Spooky Page";
  }, []);

  return (
    <PoiProvider>
      <BrowserRouter>
        <div className="background">
          <Navbar />

          <div className="page-content">
            <Routes>
              {/* Rota Inicial (Monstro) */}
              <Route path="/" element={<Home />} />

              {/* Rota do Mapa */}
              <Route 
                path="/mapa" 
                element={
                  <div className="mapa-container-page">
                    <Mapa />
                  </div>
                } 
              />
              
              {/* Rota dos Gráficos */}
              <Route 
                path="/graficos" 
                element={
                  <div className="grafico-container-page">
                    <Grafico />
                  </div>
                } 
              />
              
              {/* Rota de POIs */}
              <Route 
                path="/poi" 
                element={
                  <div className="poi-container-page">
                    <POI autenticado={autenticado} setAutenticado={setAutenticado} />
                  </div>
                } 
              />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </PoiProvider>
  );
}
