import React, { useEffect, useState } from "react";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { FaPlus, FaTrash, FaEdit, FaSearch, FaClipboardList, FaSave, FaBan, FaWhatsapp } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import "./Usuarios.css";

const roles = [
  { value: "recepcionista", label: "Recepcionista" },
  { value: "gerente", label: "Gerente" },
];

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    whatsapp: "",
    role: "recepcionista",
  });
  const [editId, setEditId] = useState(null);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    buscarUsuarios();
  }, []);

  const buscarUsuarios = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "usuarios"), where("role", "!=", "terapeuta"));
      const snap = await getDocs(q);
      const usuariosFiltrados = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsuarios(usuariosFiltrados);
    } catch (err) {
      alert("Erro ao buscar usuários: " + err.message);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.email || !form.cpf || !form.telefone || !form.whatsapp) {
      alert("Preencha todos os campos.");
      return;
    }
    try {
      if (editId) {
        await updateDoc(doc(db, "usuarios", editId), { ...form });
        setModalMessage("Usuário atualizado com sucesso!");
        setEditId(null);
      } else {
        await addDoc(collection(db, "usuarios"), {
          ...form,
          senha: form.cpf, // Senha padrão como CPF
          criadoEm: new Date().toISOString(),
        });
        setModalMessage("Usuário adicionado com sucesso!");
      }
      setForm({ nome: "", email: "", cpf: "", telefone: "", whatsapp: "", role: "recepcionista" });
      buscarUsuarios();
      setIsModalOpen(true);
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    }
  };

  const excluirUsuario = async (id) => {
    const usuario = usuarios.find((u) => u.id === id);
    if (usuario.email === "neuroapoio.clinicas@gmail.com") {
      alert("O usuário Denis (admin master) não pode ser deletado.");
      return;
    }
    if (!window.confirm("Excluir este usuário?")) return;
    try {
      await deleteDoc(doc(db, "usuarios", id));
      buscarUsuarios();
      setModalMessage("Usuário excluído com sucesso!");
      setIsModalOpen(true);
    } catch (err) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  const editarUsuario = (usuario) => {
    setForm({
      nome: usuario.nome,
      email: usuario.email,
      cpf: usuario.cpf,
      telefone: usuario.telefone,
      whatsapp: usuario.whatsapp,
      role: usuario.role || "recepcionista",
    });
    setEditId(usuario.id);
  };

  const abrirWhatsApp = (numero) => {
    const url = `https://wa.me/55${numero.replace(/\D/g, "")}`;
    window.open(url, "_blank");
  };

  const limparForm = () => {
    setForm({ nome: "", email: "", cpf: "", telefone: "", whatsapp: "", role: "recepcionista" });
    setEditId(null);
  };

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      u.email?.toLowerCase().includes(busca.toLowerCase()) ||
      u.cpf?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content usuarios-main">
        <div className="usuarios-header">
          <h1><FaClipboardList /> Usuários</h1>
          <p>Gerencie os usuários do sistema (excluindo terapeutas).</p>
        </div>

        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <FaTimes />
              </button>
              <h2><FaCheck /> Sucesso!</h2>
              <p>{modalMessage}</p>
              <div className="modal-actions">
                <button className="modal-ok-btn" onClick={() => setIsModalOpen(false)}>
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        <form className="usuario-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="nome"><strong>Nome</strong></label>
            <input
              id="nome"
              type="text"
              placeholder="Digite o nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="email"><strong>Email</strong></label>
            <input
              id="email"
              type="email"
              placeholder="Digite o email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="cpf"><strong>CPF</strong></label>
            <input
              id="cpf"
              type="text"
              placeholder="Digite o CPF (somente números)"
              value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: e.target.value })}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="telefone"><strong>Telefone</strong></label>
            <input
              id="telefone"
              type="text"
              placeholder="Digite o telefone"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="whatsapp"><strong>WhatsApp</strong></label>
            <input
              id="whatsapp"
              type="text"
              placeholder="Digite o WhatsApp"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="role"><strong>Role</strong></label>
            <select
              id="role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button className="add-btn" type="submit">
              {editId ? (
                <>
                  <FaSave /> Salvar
                </>
              ) : (
                <>
                  <FaPlus /> Adicionar
                </>
              )}
            </button>
            {editId && (
              <button className="cancel-btn" type="button" onClick={limparForm}>
                <FaBan /> Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="usuarios-filtros">
          <div className="busca-box">
            <FaSearch className="icon-search" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou CPF..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="usuarios-lista">
          {loading && <div className="loading">Carregando...</div>}
          {!loading && usuariosFiltrados.length === 0 && (
            <div className="vazio-state">
              <FaClipboardList className="empty-icon" />
              <p>Nenhum usuário encontrado.</p>
            </div>
          )}
          {usuariosFiltrados.map((usuario) => (
            <div key={usuario.id} className="usuario-card">
              <div className="card-header">
                <div className="card-info">
                  <strong>{usuario.nome}</strong>
                  <span className={`role role-${usuario.role}`}>{usuario.role}</span>
                </div>
                <div className="card-actions">
                  <button
                    className="action-btn action-whatsapp"
                    title="Abrir WhatsApp"
                    onClick={() => abrirWhatsApp(usuario.whatsapp)}
                  >
                    <FaWhatsapp />
                  </button>
                  <button className="action-btn action-edit" title="Editar" onClick={() => editarUsuario(usuario)}>
                    <FaEdit />
                  </button>
                  <button
                    className="action-btn action-delete"
                    title="Excluir"
                    onClick={() => excluirUsuario(usuario.id)}
                    disabled={usuario.email === "neuroapoio.clinicas@gmail.com"}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div className="card-details">
                <span><strong>Email:</strong> {usuario.email}</span>
                <span><strong>CPF:</strong> {usuario.cpf}</span>
                <span><strong>Telefone:</strong> {usuario.telefone}</span>
                <span><strong>WhatsApp:</strong> {usuario.whatsapp}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Usuarios;