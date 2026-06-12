import { useState, useEffect } from "react";
import Navbar from "./components/Navbar.jsx";
import Mapa from "./components/Mapa.jsx";
import Zombie from "./components/Zombie.jsx";
import MummyDown from "./components/Mummy_down.jsx";
import MummyUp from "./components/Mummy_up.jsx";
import POI from "./components/POI.jsx";
import Grafico from "./components/Graficos.jsx";
import "./index.css";
import { geoJSONFake } from "./data/geoJSONFake.js";   // Inglaterra
import { geoJSON_Sco } from "./data/geoJSON_Sco.js";   // Escócia
import { geoJSON_Ni } from "./data/geoJSON_Ni.js";     // Irlanda do Norte
import { geoJSON_Gb } from "./data/geoJSON_Gb.js";     // País de Gales

const mergeGeoJSON = (...geojsons: any[]) => ({
  type: "FeatureCollection",
  features: geojsons.flatMap(g => g.features),
});

const fullGeo = mergeGeoJSON(
  geoJSONFake,
  geoJSON_Sco,
  geoJSON_Ni,
  geoJSON_Gb
);


export default function App() {
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    document.title = "Spooky Page";
  }, []);

  return (
    <div className="background">
      <Navbar />
      <Zombie />

      <section id="mapa" className="section">
        <MummyUp />
        <Mapa geoData={fullGeo} />
        <MummyDown />
      </section>

      <section id="grafico" className="section">
        <Grafico />
      </section>

      <section id="poi" className="section"> 
        <POI autenticado={autenticado} setAutenticado={setAutenticado} />
      </section>
    </div>
  );
}
