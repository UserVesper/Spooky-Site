import { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "./Mapa.css";
import markerSvg from "../assets/marker.svg";
import CITY_TO_REGION from "../data/region.json";
import { usePoiContext } from "../context/PoiContext";
import { useDebounce } from "use-debounce";
import { Search, X, MapPin, Navigation, Flame, Map as MapIcon, Compass, ChevronLeft, ChevronRight, SlidersHorizontal, Layers } from "lucide-react";

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

const createCustomClusterIcon = (cluster) => {
  return L.divIcon({
    html: `<div><span>${cluster.getChildCount()}</span></div>`,
    className: "marker-cluster-custom",
    iconSize: L.point(40, 40, true),
  });
};

function StatusBanner({ rotaAtiva, clicks }) {
  if (!rotaAtiva || clicks.length !== 1) return null;
  return (
    <div className="route-status-banner">
      <Compass size={20} />
      <span><strong>Origem Definida!</strong> Clique num <strong>POI</strong> de destino.</span>
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
      try { routingControlRef.current.getPlan().setWaypoints([]); } catch (err) {}
      try { routingControlRef.current.remove(); } catch (err) {}
      routingControlRef.current = null;
    }

    const routingControl = L.Routing.control({
      waypoints: [origem, destino],
      lineOptions: { styles: [{ color: "#2575fc", weight: 5, opacity: 0.9 }] },
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
        try { routingControlRef.current.getPlan().setWaypoints([]); } catch (err) {}
        try { routingControlRef.current.remove(); } catch (err) {}
        routingControlRef.current = null;
        setRotaLayer(null);
      }
    };

  }, [map, origem, destino, setRotaLayer]);

  return null;
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

  const maxCount = Array.from(counts.values()).reduce((max, current) => Math.max(max, current), 0);
  const normalizer = maxCount > 0 ? maxCount : 1; 

  const getColor = (count) => {
    const normalizedDensity = count / normalizer; 
    if (normalizedDensity === 0) return "#D3D3D3"; 
    if (normalizedDensity <= 0.25) return "#C6DBEF";
    if (normalizedDensity <= 0.5) return "#9ECAE1";
    if (normalizedDensity <= 0.75) return "#6BAED6";
    return "#2171B5"; 
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

function RoutingEvents({ rotaAtiva, view, clicks, setClicks, setDestino }) {
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
  return null;
}

export default function Mapa() {
  const { poisRaw } = usePoiContext();
  const [view, setView] = useState("markers");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  
  const [filtroAreaText, setFiltroAreaText] = useState("");
  const [filtroArea] = useDebounce(filtroAreaText, 500);

  const [rotaAtiva, setRotaAtiva] = useState(false);
  const [rotaLayer, setRotaLayer] = useState(null);
  const [clicks, setClicks] = useState([]);
  const [destino, setDestino] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [painelEsquerdoAberto, setPainelEsquerdoAberto] = useState(true);
  const [painelDireitoAberto, setPainelDireitoAberto] = useState(true);
  const mapRef = useRef(null);

  const pois = useMemo(() => {
    return poisRaw.map((p) => {
      const areaName = p.properties?.["area:normalized"] || "Outra Localidade";
      return {
        id: p._id,
        nome: p.name,
        tipo: p.properties?.["type:normalized"] || "Outro",
        area: areaName,
        region: getRegionForCity(areaName),
        geometry: p.geometry,
      };
    });
  }, [poisRaw]);

  useEffect(() => {
    if (view === "choropleth" && !geoData && !geoLoading) {
      setGeoLoading(true);
      fetch("http://localhost:5000/geo/regions")
        .then((resp) => resp.json())
        .then((data) => {
          setGeoData(data);
          setGeoLoading(false);
        })
        .catch((err) => {
          console.error("Erro ao carregar GeoJSON:", err);
          setGeoLoading(false);
        });
    }
  }, [view, geoData, geoLoading]);

  const tiposDisponiveis = ["Todos", "Fantasmas", "Loja", "Maldições/Lendas", "Música/Sons", "Outros", "UFOs/Criptozoologia"];

  const pontosFiltrados = useMemo(() => {
    return pois.filter((p) => {
      const okTipo = filtroTipo === "Todos" || p.tipo === filtroTipo;
      const okArea = filtroArea === "" || (p.area || "").toLowerCase().includes(filtroArea.toLowerCase());
      return okTipo && okArea;
    });
  }, [pois, filtroTipo, filtroArea]);

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

  const handleMarkerClick = (e, poi) => {
    if (e.originalEvent) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    }
    if (!rotaAtiva || clicks.length !== 1) return;
    const [lng, lat] = poi.geometry.coordinates;
    setDestino(L.latLng(lat, lng));
  };

  const origem = clicks.length === 1 ? clicks[0] : null;

  return (
    <div className="map-wrapper">
      
      {/* Botão de Expandir Painel Esquerdo (quando minimizado) */}
      {!painelEsquerdoAberto && (
        <button 
          className="panel-toggle-btn panel-toggle-left"
          onClick={() => setPainelEsquerdoAberto(true)}
          title="Abrir Pesquisa e Filtros"
        >
          <SlidersHorizontal size={18} />
          <span>Filtros & Busca</span>
        </button>
      )}

      {/* Left Glass Panel (Filters) */}
      {painelEsquerdoAberto && (
        <div className="glass-panel side-panel-left animate-in">
          <div className="panel-header-row">
            <h4 className="panel-section-title"><MapIcon size={16} /> Pesquisar Área</h4>
            <button 
              className="panel-minimize-btn" 
              onClick={() => setPainelEsquerdoAberto(false)}
              title="Minimizar painel de filtros"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
          
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="modern-input"
              placeholder="Digite a cidade ou localidade..."
              value={filtroAreaText}
              onChange={(e) => setFiltroAreaText(e.target.value)}
            />
            {filtroAreaText && (
              <button className="search-clear" onClick={() => setFiltroAreaText("")}>
                <X size={16} />
              </button>
            )}
          </div>

          <h4 className="panel-section-title" style={{ marginTop: '12px' }}><MapPin size={16} /> Filtrar por Tipo</h4>
          <div className="chips-container">
            {tiposDisponiveis.map((tipo) => (
              <button 
                key={tipo} 
                className={`chip-btn ${filtroTipo === tipo ? "active" : ""}`} 
                onClick={() => setFiltroTipo(tipo)}
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>
      )}

      <StatusBanner rotaAtiva={rotaAtiva} clicks={clicks} />

      {/* Map */}
      <MapContainer
        center={[54.5, -2]}
        zoom={6}
        className="leaflet-map"
        whenCreated={(map) => (mapRef.current = map)}
      >
        <TileLayer 
          attribution="&copy; OpenStreetMap" 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        />

        <RoutingEvents 
          rotaAtiva={rotaAtiva} 
          view={view} 
          clicks={clicks} 
          setClicks={setClicks} 
          setDestino={setDestino} 
        />

        {origem && (
          <Marker position={origem} icon={originIcon}>
            <Popup>Ponto de Partida (Origem)</Popup>
          </Marker>
        )}

        {origem && destino && (
          <RouteManager origem={origem} destino={destino} setRotaLayer={setRotaLayer} />
        )}

        {/* View: Clusters */}
        {view === "markers" && (
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createCustomClusterIcon}
            maxClusterRadius={50}
          >
            {pontosFiltrados
              .filter((p) => p.geometry?.coordinates)
              .map((poi, i) => {
                const [lng, lat] = poi.geometry.coordinates;
                return (
                  <Marker
                    key={poi.id || i}
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
          </MarkerClusterGroup>
        )}

        {/* View: Heatmap */}
        {view === "heatmap" && <HeatmapLayer points={pontosFiltrados} />}

        {/* View: Choropleth */}
        {view === "choropleth" && geoData && <Choropleth geoData={geoData} points={pontosFiltrados} />}
        
        {/* Loading overlay for GeoJSON */}
        {view === "choropleth" && geoLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <span>Carregando regiões...</span>
          </div>
        )}
      </MapContainer>

      {/* Botão de Expandir Painel Direito (quando minimizado) */}
      {!painelDireitoAberto && (
        <button 
          className="panel-toggle-btn panel-toggle-right"
          onClick={() => setPainelDireitoAberto(true)}
          title="Abrir Estilo e Rotas"
        >
          <Layers size={18} />
          <span>Estilo & Rota</span>
        </button>
      )}

      {/* Right Glass Panel (Views and Routing) */}
      {painelDireitoAberto && (
        <div className="glass-panel side-panel-right animate-in">
          <div className="panel-header-row">
            <h4 className="panel-section-title"><Layers size={16} /> Estilo do Mapa</h4>
            <button 
              className="panel-minimize-btn" 
              onClick={() => setPainelDireitoAberto(false)}
              title="Minimizar painel de estilo"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          
          <button 
            className={`block-btn ${view === "markers" ? "active" : ""}`} 
            onClick={() => setView("markers")}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} /> Marcadores & Cluster
            </div>
          </button>
          
          <button 
            className={`block-btn ${view === "heatmap" ? "active" : ""}`} 
            onClick={() => setView("heatmap")}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={18} /> Heatmap
            </div>
          </button>
          
          <button 
            className={`block-btn ${view === "choropleth" ? "active" : ""}`} 
            onClick={() => setView("choropleth")}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapIcon size={18} /> Coroplético (Regiões)
            </div>
          </button>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }} />

          <h4 className="panel-section-title"><Navigation size={16} /> Navegação Espacial</h4>
          <button 
            className={`block-btn ${rotaAtiva ? "danger active" : ""}`} 
            onClick={toggleRota}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {rotaAtiva ? <X size={18} /> : <Navigation size={18} />}
              {rotaAtiva ? "Cancelar Rota" : "Traçar Rota"}
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
