import { useState, useEffect } from "react";
import "./POI.css";
import { usePoiContext } from "../context/PoiContext";

export default function POI({ autenticado, setAutenticado }) {
  const { poisRaw, refetch } = usePoiContext();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const [filtroNome, setFiltroNome] = useState("");

  const [form, setForm] = useState({ nome: "", tipo: "", lat: "", lng: "" });
  const [editando, setEditando] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const pois = poisRaw.map((p) => ({
    id: p._id,
    nome: p.name,
    tipo: p.tipo,
    lat: p?.geometry?.coordinates?.[1] ?? null,
    lng: p?.geometry?.coordinates?.[0] ?? null,
  }));

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const resp = await fetch("http://localhost:5000/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usuario, password: senha }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setAutenticado(true);
        setErro("");
      } else {
        setErro(data.error || "Usuário ou senha inválidos");
      }
    } catch (err) {
      setErro("Erro ao conectar ao servidor");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.tipo) return;

    const payload = {
      name: form.nome,
      tipo: form.tipo,
      geometry: {
        type: "Point",
        coordinates: [parseFloat(form.lng), parseFloat(form.lat)],
      },
    };

    await fetch("http://localhost:5000/pois", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await refetch();
    setForm({ nome: "", tipo: "", lat: "", lng: "" });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.nome,
      tipo: form.tipo,
      geometry: {
        type: "Point",
        coordinates: [parseFloat(form.lng), parseFloat(form.lat)],
      },
    };

    await fetch(`http://localhost:5000/pois/${editando}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await refetch();
    setEditando(null);
    setForm({ nome: "", tipo: "", lat: "", lng: "" });
  };

  const handleEdit = (poi) => {
    setEditando(poi.id);
    setForm({
      nome: poi.nome,
      tipo: poi.tipo,
      lat: poi.lat,
      lng: poi.lng,
    });
  };

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/pois/${id}`, { method: "DELETE" });
    await refetch();
  };

  const poisFiltrados = pois.filter((p) =>
    p.nome.toLowerCase().includes(filtroNome.toLowerCase())
  );

  const totalPages = Math.ceil(poisFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPois = poisFiltrados.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filtroNome]);

  if (!autenticado) {
    return (
      <div className="login-overlay">
        <form onSubmit={handleLogin} className="login-form">
          <h2>Área restrita</h2>
          <input
            type="text"
            placeholder="Usuário"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <button type="submit">Entrar</button>
          {erro && <p className="erro">{erro}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="poi-container">
      <h2>Gerenciamento de POIs</h2>

      <input
        type="text"
        className="search-input"
        placeholder="Buscar por nome..."
        value={filtroNome}
        onChange={(e) => setFiltroNome(e.target.value)}
      />

      <form onSubmit={editando ? handleUpdate : handleAdd} className="poi-form">
        <input name="nome" type="text" placeholder="Nome" value={form.nome} onChange={handleChange} required />
        <input name="tipo" type="text" placeholder="Tipo" value={form.tipo} onChange={handleChange} required />
        <input name="lat" type="number" step="any" placeholder="Latitude" value={form.lat} onChange={handleChange} />
        <input name="lng" type="number" step="any" placeholder="Longitude" value={form.lng} onChange={handleChange} />

        <button type="submit">{editando ? "Atualizar" : "Adicionar"}</button>
      </form>

      <div className="poi-panel">
        <div className="poi-table-wrapper">
          <table className="poi-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Lat</th>
                <th>Lng</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {currentPois.map((poi) => (
                <tr key={poi.id}>
                  <td>{poi.id}</td>
                  <td>{poi.nome}</td>
                  <td>{poi.tipo}</td>
                  <td>{poi.lat}</td>
                  <td>{poi.lng}</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEdit(poi)}>
                      Editar
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(poi.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
            ◀ Anterior
          </button>

          <span className="page-info">
            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
          </span>

          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
            Próxima ▶
          </button>
        </div>
      </div>
    </div>
  );
}
