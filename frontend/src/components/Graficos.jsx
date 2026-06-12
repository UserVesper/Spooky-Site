import { useState, useEffect, useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import "./Graficos.css";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1", "#a4de6c"];
const ITEMS_PER_PAGE = 5;
const POIS_API_URL = "http://localhost:5000/pois";

export default function Grafico() {
  const [opcao, setOpcao] = useState("area"); 
  const [pois, setPois] = useState([]);
  const [currentPage, setCurrentPage] = useState(0); 
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const resp = await fetch(POIS_API_URL);
        const data = await resp.json();

        const convertidos = data.map((p) => ({
          id: p._id,
          nome: p.name,
          tipoNormalizado: p.properties?.['type:normalized'] || "Outro",
          areaNormalizada: p.properties?.['area:normalized'] || "Outra Localidade", 
        }));

        setPois(convertidos);
      } catch (err) {
        console.error("Erro ao carregar POIs:", err);
      }
    }

    carregar();
  }, []);

  const filteredPois = useMemo(() => {
    if (!searchTerm) return pois;
    return pois.filter(p => 
      p.areaNormalizada.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pois, searchTerm]);

  const allDadosArea = useMemo(() => {
    const contarPorArea = filteredPois.reduce((acc, p) => {
      const area = p.areaNormalizada;
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {});

    let dados = Object.entries(contarPorArea).map(([area, quantidade]) => ({
      area,
      quantidade,
    }));

    dados.sort((a, b) => a.area.localeCompare(b.area));
    return dados;
  }, [filteredPois]);

  const totalPages = useMemo(() => Math.ceil(allDadosArea.length / ITEMS_PER_PAGE), [allDadosArea]);

  const currentData = useMemo(() => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return allDadosArea.slice(startIndex, endIndex);
  }, [allDadosArea, currentPage]);

  const dadosTipo = useMemo(() => {
    const contarPorTipo = pois.reduce((acc, p) => {
      const tipo = p.tipoNormalizado;
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(contarPorTipo).map(([tipo, quantidade]) => ({ tipo, quantidade }));
  }, [pois]);

  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 0));

  const CHART_FIXED_HEIGHT = 300;

  return (
    <div className="grafico-container">
      <h2>GRÁFICOS ESTATÍSTICOS</h2>

      <select onChange={(e) => setOpcao(e.target.value)} value={opcao}>
        <option value="area">POIs por área (barra - Paginação)</option>
        <option value="tipo">POIs por tipo (donut)</option>
      </select>

      {opcao === "area" && (
        <>
          <input
            type="text"
            placeholder="Buscar cidade..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(0); 
            }}
            className="search-input"
          />

          <h3>Áreas por Concentração de POIs (Página {currentPage + 1} de {totalPages || 1})</h3>

          <div className="pagination-controls">
            <button onClick={handlePrevPage} disabled={currentPage === 0}>&larr; Anterior</button>
            <button onClick={handleNextPage} disabled={currentPage === totalPages - 1 || totalPages === 0}>Próxima &rarr;</button>
          </div>

          <ResponsiveContainer width="100%" height={CHART_FIXED_HEIGHT}>
            <BarChart layout="vertical" data={currentData} margin={{ top: 20, right: 30, left: 140, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis type="number" tick={{ fill: "#fff" }} />
              <YAxis type="category" dataKey="area" tick={{ fill: "#fff" }} width={130} />
              <Tooltip contentStyle={{ backgroundColor: "#2a2a2a", border: "none", color: "#fff" }} />
              <Bar dataKey="quantidade" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}

      {opcao === "tipo" && (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={dadosTipo}
              dataKey="quantidade"
              nameKey="tipo"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              fill="#8884d8"
              label
            >
              {dadosTipo.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: "#2a2a2a", border: "none" }} itemStyle={{ color: "#fff" }} />
            <Legend wrapperStyle={{ color: "#fff" }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
