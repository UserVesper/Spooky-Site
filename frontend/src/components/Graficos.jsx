import { useState, useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import "./Graficos.css";
import { usePoiContext } from "../context/PoiContext";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1", "#a4de6c", "#d0ed57", "#a288d8"];

export default function Grafico() {
  const { poisRaw, loading } = usePoiContext();
  const [opcao, setOpcao] = useState("area"); 
  const [currentPage, setCurrentPage] = useState(0); 
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [sortBy, setSortBy] = useState("quantidade");

  const pois = useMemo(() => 
    poisRaw.map((p) => ({
      id: p._id,
      nome: p.name,
      tipoNormalizado: p.properties?.['type:normalized'] || "Outro",
      areaNormalizada: p.properties?.['area:normalized'] || "Outra Localidade", 
    })),
    [poisRaw]
  );

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

    if (sortBy === "quantidade") {
      dados.sort((a, b) => b.quantidade - a.quantidade);
    } else {
      dados.sort((a, b) => a.area.localeCompare(b.area));
    }
    return dados;
  }, [filteredPois, sortBy]);

  const totalPages = useMemo(() => Math.ceil(allDadosArea.length / itemsPerPage), [allDadosArea, itemsPerPage]);

  const currentData = useMemo(() => {
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allDadosArea.slice(startIndex, endIndex);
  }, [allDadosArea, currentPage, itemsPerPage]);

  const dadosTipo = useMemo(() => {
    const contarPorTipo = pois.reduce((acc, p) => {
      const tipo = p.tipoNormalizado;
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});

    const sorted = Object.entries(contarPorTipo).map(([tipo, quantidade]) => ({ tipo, quantidade }));
    sorted.sort((a, b) => b.quantidade - a.quantidade);
    return sorted;
  }, [pois]);

  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 0));

  const chartDynamicHeight = Math.max(450, currentData.length * 36 + 60);

  if (loading) {
    return (
      <div className="grafico-container">
        <h2>GRÁFICOS ESTATÍSTICOS</h2>
        <p>Carregando dados dos POIs...</p>
      </div>
    );
  }

  return (
    <div className="grafico-container">
      <h2 className="grafico-title">GRÁFICOS ESTATÍSTICOS</h2>

      <div className="grafico-top-controls">
        <select 
          className="select-custom"
          onChange={(e) => setOpcao(e.target.value)} 
          value={opcao}
        >
          <option value="area">POIs por Área (Gráfico de Barras)</option>
          <option value="tipo">POIs por Categoria/Tipo (Donut)</option>
        </select>
      </div>

      {opcao === "area" && (
        <>
          <div className="grafico-filter-bar">
            <input
              type="text"
              placeholder="Filtrar localidade..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(0); 
              }}
              className="search-input"
            />

            <div className="filter-group">
              <label>Ordenar:</label>
              <select 
                value={sortBy} 
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(0);
                }}
                className="select-small"
              >
                <option value="quantidade">Mais POIs (Concentração)</option>
                <option value="nome">Nome (A - Z)</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Itens por página:</label>
              <select 
                value={itemsPerPage} 
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(0);
                }}
                className="select-small"
              >
                <option value={8}>8 itens</option>
                <option value={12}>12 itens</option>
                <option value={20}>20 itens</option>
              </select>
            </div>
          </div>

          <div className="pagination-bar">
            <button 
              className="page-btn" 
              onClick={handlePrevPage} 
              disabled={currentPage === 0}
            >
              &larr; Anterior
            </button>
            <span className="page-indicator">
              Página <strong>{currentPage + 1}</strong> de <strong>{totalPages || 1}</strong> ({allDadosArea.length} áreas)
            </span>
            <button 
              className="page-btn" 
              onClick={handleNextPage} 
              disabled={currentPage === totalPages - 1 || totalPages === 0}
            >
              Próxima &rarr;
            </button>
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={chartDynamicHeight}>
              <BarChart layout="vertical" data={currentData} margin={{ top: 20, right: 30, left: 130, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#332c4d" />
                <XAxis type="number" tick={{ fill: "#ccc" }} />
                <YAxis 
                  type="category" 
                  dataKey="area" 
                  tick={{ fill: "#fff", fontSize: 13 }} 
                  width={120} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(25, 20, 40, 0.95)", 
                    border: "1px solid rgba(255,255,255,0.15)", 
                    borderRadius: "8px", 
                    color: "#fff" 
                  }} 
                />
                <Bar 
                  dataKey="quantidade" 
                  fill="#7c5cff" 
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {opcao === "tipo" && (
        <div className="chart-wrapper donut-wrapper">
          <ResponsiveContainer width="100%" height={450}>
            <PieChart>
              <Pie
                data={dadosTipo}
                dataKey="quantidade"
                nameKey="tipo"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={140}
                paddingAngle={3}
                fill="#8884d8"
                label={({ tipo, percent }) => `${tipo}: ${(percent * 100).toFixed(0)}%`}
              >
                {dadosTipo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "rgba(25, 20, 40, 0.95)", 
                  border: "1px solid rgba(255,255,255,0.15)", 
                  borderRadius: "8px", 
                  color: "#fff" 
                }} 
              />
              <Legend wrapperStyle={{ color: "#fff", paddingTop: "20px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
