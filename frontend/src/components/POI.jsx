import { useState, useEffect } from "react";
import "./POI.css";

export default function POI({ autenticado, setAutenticado }) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const [pois, setPois] = useState([]);
  const [filtroNome, setFiltroNome] = useState("");

  const [form, setForm] = useState({ nome: "", tipo: "", lat: "", lng: "" });
  const [editando, setEditando] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  useEffect(() => {
    async function carregar() {
      try {
        const resp = await fetch("http://localhost:5000/pois");
        const data = await resp.json();

        const convertidos = data.map((p) => ({
          id: p._id,
          nome: p.name,
          tipo: p.tipo,
          lat: p?.geometry?.coordinates?.[1] ?? null,
          lng: p?.geometry?.coordinates?.[0] ?? null,
        }));

        setPois(convertidos);
      } catch (err) {
        console.error("Erro ao carregar POIs:", err);
      }
    }

    carregar();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (usuario === "admin" && senha === "1234") {
      setAutenticado(true);
      setErro("");
    } else {
      setErro("Usuário ou senha inválidos");
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

    const resp = await fetch("http://localhost:5000/pois", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const novo = await resp.json();

    setPois((prev) => [
      ...prev,
      {
        id: novo._id,
        nome: novo.name,
        tipo: novo.tipo,
        lat: novo.geometry.coordinates[1],
        lng: novo.geometry.coordinates[0],
      },
    ]);

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

    const resp = await fetch(`http://localhost:5000/pois/${editando}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const atualizado = await resp.json();

    setPois((prev) =>
      prev.map((p) =>
        p.id === editando
          ? {
              id: atualizado._id,
              nome: atualizado.name,
              tipo: atualizado.tipo,
              lat: atualizado.geometry.coordinates[1],
              lng: atualizado.geometry.coordinates[0],
            }
          : p
      )
    );

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
    setPois((prev) => prev.filter((p) => p.id !== id));
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
