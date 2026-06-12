import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import "leaflet-routing-machine";
import "./Mapa.css";
import markerSvg from "../assets/marker.svg";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import CITY_TO_REGION from "../data/region.json";

const customIcon = L.icon({
  iconUrl: markerSvg,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -35],
});

const originIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  shadowSize: [41, 41],
});

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

function StatusBanner({ rotaAtiva, clicks }) {
  if (!rotaAtiva || clicks.length !== 1) return null;
  return (
    <div className="route-status-banner">
      <strong>Origem Definida!</strong> Clique no <strong>POI</strong> de destino.
    </div>
  );
}

function getRegionForCity(city) {
  for (const [region, cities] of Object.entries(CITY_TO_REGION)) {
    if (cities.includes(city)) {
      return region;
    }
  }
  return "Outra Região";
}



function RouteManager({ origem, destino, setRotaLayer }) {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !origem || !destino) return;

    if (routingControlRef.current) {
      try {
        routingControlRef.current.getPlan().setWaypoints([]);
      } catch (err) {}

      try {
        routingControlRef.current.remove(); 
      } catch (err) {}

      routingControlRef.current = null;
    }


    const routingControl = L.Routing.control({
      show: false,
      waypoints: [origem, destino],
      lineOptions: { styles: [{ color: "#2E8B57", weight: 5, opacity: 0.8 }] },
      show: true,
      routeWhileDragging: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      router: L.Routing.osrmv1({ serviceUrl: "https://router.project-osrm.org/route/v1" }),
    }).addTo(map);

    routingControlRef.current = routingControl;
    setRotaLayer(routingControl);

    return () => {
      if (routingControlRef.current) {
        try {
          routingControlRef.current.getPlan().setWaypoints([]);
        } catch (err) {}

        try {
          routingControlRef.current.remove();   
        } catch (err) {}

        routingControlRef.current = null;
        setRotaLayer(null);
      }
    };

  }, [map, origem, destino, setRotaLayer]);

  return null;
}

function RoutingControl({ view, rotaAtiva, clicks, setClicks, pois, setDestino, mapRef }) {
  useMapEvents({
    click: (e) => {
      if (!rotaAtiva || view !== "markers") return;

      if (clicks.length === 0) {
        setClicks([e.latlng]);
        setDestino(null);
      } else {
        setClicks([]);
        setDestino(null);
      }
    },
  });

  const handleMarkerClick = (e, poi) => {
    if (e.originalEvent) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    }

    if (!rotaAtiva || clicks.length !== 1) return;

    const [lng, lat] = poi.geometry.coordinates;
    setDestino(L.latLng(lat, lng));
  };

  if (view !== "markers") return null;

  return (
    <>
      {clicks.length === 1 && (
        <Marker position={clicks[0]} icon={originIcon}>
          <Popup>Ponto de Partida (Origem)</Popup>
        </Marker>
      )}

      {pois
        .filter((p) => p.geometry?.coordinates)
        .map((poi, i) => {
          const [lng, lat] = poi.geometry.coordinates;
          return (
            <Marker
              key={i}
              position={[lat, lng]}
              icon={customIcon}
              eventHandlers={{ click: (e) => handleMarkerClick(e, poi) }}
            >
              <Popup>
                <strong>{poi.nome}</strong>
                <br />
                Tipo: {poi.tipo}
                <br />
                Área: {poi.area}
              </Popup>
            </Marker>
          );
        })}
    </>
  );
}

function HeatmapLayer({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !points?.length) return;
    const heatPoints = points
      .filter((p) => p.geometry?.coordinates)
      .map((p) => {
        const [lng, lat] = p.geometry.coordinates;
        return [lat, lng, 0.8];
      });
    const heatLayer = L.heatLayer(heatPoints, { radius: 45, blur: 30, minOpacity: 0.35, maxZoom: 17 }).addTo(map);
    return () => map.removeLayer(heatLayer);
  }, [map, points]);
  return null;
}

function Choropleth({ geoData, points }) {
  if (!geoData?.features || !points?.length) return null;

  const counts = new Map();
  geoData.features.forEach((poly) => {
    const areaName = poly.properties?.EER13NM || poly.properties?.name;
    counts.set(areaName, points.filter((p) => p.region === areaName).length);
  });

  const totalPoints = points.length;
  
  const maxCount = Array.from(counts.values()).reduce((max, current) => Math.max(max, current), 0);
  
  const normalizer = maxCount > 0 ? maxCount : 1; 

  /**
   * Obtém a cor baseada na contagem normalizada (proporção da contagem máxima).
   * @param {number} count A contagem bruta de POIs na área.
   * @returns {string} O código de cor.
   */
  const getColor = (count) => {
    const normalizedDensity = count / normalizer; 

    if (normalizedDensity === 0) {
      return "#D3D3D3"; 
    } else if (normalizedDensity <= 0.25) {
      return "#C6DBEF";
    } else if (normalizedDensity <= 0.5) {
      return "#9ECAE1";
    } else if (normalizedDensity <= 0.75) {
      return "#6BAED6";
    } else {
      return "#2171B5"; 
    }
  };

  const style = (feature) => {
    const areaName = feature.properties?.EER13NM || feature.properties?.name;
    const count = counts.get(areaName) || 0;
    return { 
      fillColor: getColor(count), 
      weight: 1, 
      opacity: 1, 
      color: "white", 
      fillOpacity: 0.7 
    };
  };

  const onEach = (feature, layer) => {
    const name = feature.properties?.EER13NM;
    const count = counts.get(name) || 0;
    const normalizedValue = maxCount > 0 ? (count / maxCount) : 0;
    
    layer.bindTooltip(`${name} — ${count} ponto(s) (Densidade: ${normalizedValue.toFixed(2)})`, { 
      permanent: false, 
      sticky: true 
    });
    
    layer.on({
      mouseover: (e) => e.target.setStyle({ weight: 3, color: "#666", fillOpacity: 0.9 }),
      mouseout: (e) => e.target.setStyle({ weight: 1, color: "white", fillOpacity: 0.7 }),
    });
  };

  return <GeoJSON data={geoData} style={style} onEachFeature={onEach} />;
}

export default function Mapa({ geoData }) {
  const [pois, setPois] = useState([]);
  const [view, setView] = useState("markers");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroArea, setFiltroArea] = useState("");
  const [rotaAtiva, setRotaAtiva] = useState(false);
  const [rotaLayer, setRotaLayer] = useState(null);
  const [clicks, setClicks] = useState([]);
  const [destino, setDestino] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    async function carregarPOIs() {
      try {
        const resp = await fetch("http://localhost:5000/pois");
        const data = await resp.json();
        setPois(
          Array.isArray(data)
            ? data.map((p) => {
                const areaName = p.properties?.["area:normalized"] || "Outra Localidade";
                return {
                  id: p._id,
                  nome: p.name,
                  tipo: p.properties?.["type:normalized"] || "Outro",
                  area: areaName,
                  region: getRegionForCity(areaName), 
                  geometry: p.geometry,
                };
              })
            : []
        );

      } catch (err) {
        console.error("Erro ao carregar POIs:", err);
      }
    }
    carregarPOIs();
  }, []);

  const tiposDisponiveis = ["Todos", "Fantasmas", "Loja", "Maldições/Lendas", "Música/Sons", "Outros", "UFOs/Criptozoologia"];

  const pontosFiltrados = pois.filter((p) => {
    const okTipo = filtroTipo === "Todos" || p.tipo === filtroTipo;
    const okArea = filtroArea === "" || (p.area || "").toLowerCase().includes(filtroArea.toLowerCase());
    return okTipo && okArea;
  });

  const toggleRota = () => {
    const newState = !rotaAtiva;
    setRotaAtiva(newState);

    if (!newState) {
      if (rotaLayer && mapRef.current) {
        rotaLayer.remove();
        setRotaLayer(null);
      }
      setClicks([]);
      setDestino(null);
    } else {
      setView("markers");
    }
  };

  const origem = clicks.length === 1 ? clicks[0] : null;

  return (
    <div className="map-wrapper">
      <div className="side-buttons left">
        <h4>Filtrar por Tipo</h4>
        {tiposDisponiveis.map((tipo) => (
          <button key={tipo} className={filtroTipo === tipo ? "active" : ""} onClick={() => setFiltroTipo(tipo)}>
            {tipo}
          </button>
        ))}
        <h4>Pesquisar Área</h4>
        <input
          type="text"
          placeholder="Digite a área..."
          value={filtroArea}
          onChange={(e) => setFiltroArea(e.target.value)}
          style={{ width: "90%", marginBottom: "10px", padding: "5px" }}
        />
      </div>

      <StatusBanner rotaAtiva={rotaAtiva} clicks={clicks} />

      <MapContainer
        center={[54.5, -2]}
        zoom={6}
        className="leaflet-map"
        style={{ zIndex: 1 }}
        whenCreated={(map) => (mapRef.current = map)}
      >
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <RoutingControl
          view={view}
          rotaAtiva={rotaAtiva}
          clicks={clicks}
          setClicks={setClicks}
          pois={pontosFiltrados}
          setDestino={setDestino}
          mapRef={mapRef}
        />

        {origem && destino && (
          <RouteManager origem={origem} destino={destino} setRotaLayer={setRotaLayer} />
        )}

        {view === "heatmap" && <HeatmapLayer points={pontosFiltrados} />}
        {view === "choropleth" && geoData && <Choropleth geoData={geoData} points={pontosFiltrados} />}
      </MapContainer>

      <div className="side-buttons right">
        <h4>Visualização</h4>
        <button className={view === "markers" ? "active" : ""} onClick={() => setView("markers")}>
          Marcadores
        </button>
        <button className={view === "heatmap" ? "active" : ""} onClick={() => setView("heatmap")}>
          Heatmap
        </button>
        <button className={view === "choropleth" ? "active" : ""} onClick={() => setView("choropleth")}>
          Coroplético
        </button>

        <h4>Traçar Rota</h4>
        <button className={rotaAtiva ? "active" : ""} onClick={toggleRota}>
          {rotaAtiva ? "Cancelar Rota" : "Traçar Rota"}
        </button>
      </div>
    </div>
  );
}
