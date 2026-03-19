import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaSearch,
  FaPlus,
  FaMinus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaCheck,
  FaUserMd,
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";
import "./Pacientes.css";

const Pacientes = () => {
  const { currentUserData, user, loading } = useAuth();
  const role = currentUserData?.role || "";
  const clinicaId = currentUserData?.clinicaId || "";
  const userUid = user?.uid || "";
  const navigate = useNavigate();

  const [busca, setBusca] = useState("");
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    idade: "",
    sexo: "",
    cid: "",
    queixa: "",
    observacao: "",
    escola: "",
    email: "",
    responsavel: "",
    docResponsavel: "",
    profissionalId: "",
    fotoUrl: "",
  });
  const [foto, setFoto] = useState(null);
  const [profissionais, setProfissionais] = useState([]);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  // BUSCA PACIENTES E PROFISSIONAIS
  const buscarPacientes = async () => {
    try {
      const q = query(collection(db, "pacientes"), where("clinicaId", "==", clinicaId));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLista(data);
    } catch (error) {
      console.error("Erro ao buscar pacientes:", error);
    }
  };

  const fetchProfissionais = async () => {
    try {
      const q = query(collection(db, "profissionais"), where("clinicaId", "==", clinicaId));
      const snap = await getDocs(q);
      const options = snap.docs.map((doc) => ({ id: doc.id, nome: doc.data().nome }));
      setProfissionais(options);
    } catch (error) {
      console.error("Erro ao buscar profissionais:", error);
    }
  };

  useEffect(() => {
    if (!loading && currentUserData) {
      buscarPacientes();
      fetchProfissionais();
    }
  }, [loading, currentUserData]);

  const handleFotoPreview = (file, setFormFunction) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormFunction((prev) => ({ ...prev, fotoUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // SUBMIT NOVO PACIENTE
  const handleSubmit = async (e) => {
    e.preventDefault();
    const profissionalId = role === "admin" ? form.profissionalId : userUid;
    try {
      await addDoc(collection(db, "pacientes"), {
        ...form,
        profissionalId,
        clinicaId,
        criadoEm: Timestamp.now(),
      });
      setForm({
        nome: "",
        idade: "",
        sexo: "",
        cid: "",
        queixa: "",
        observacao: "",
        escola: "",
        email: "",
        responsavel: "",
        docResponsavel: "",
        profissionalId: "",
        fotoUrl: "",
      });
      setFoto(null);
      setIsFormExpanded(false);
      buscarPacientes();
    } catch (error) {
      console.error("Erro ao cadastrar paciente:", error);
    }
  };

  // EDITAR PACIENTE
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPaciente) return;
    try {
      const pacienteRef = doc(db, "pacientes", selectedPaciente.id);
      await updateDoc(pacienteRef, editForm);
      setIsEditModalOpen(false);
      setSelectedPaciente(null);
      setEditForm(null);
      buscarPacientes();
    } catch (error) {
      console.error("Erro ao atualizar paciente:", error);
    }
  };

  // DELETAR PACIENTE
  const handleDelete = async () => {
    if (!selectedPaciente) return;
    try {
      await deleteDoc(doc(db, "pacientes", selectedPaciente.id));
      setIsDeleteModalOpen(false);
      setSelectedPaciente(null);
      buscarPacientes();
    } catch (error) {
      console.error("Erro ao excluir paciente:", error);
    }
  };

  // FECHAR MODAL CLICANDO FORA
  const handleOverlayClick = (e, closeFn) => {
    if (e.target.classList.contains("modal-overlay")) closeFn();
  };

  // ABRIR MODAIS
  const openEditModal = (paciente) => {
    setSelectedPaciente(paciente);
    setEditForm({ ...paciente });
    setIsEditModalOpen(true);
  };
  const openDeleteModal = (paciente) => {
    setSelectedPaciente(paciente);
    setIsDeleteModalOpen(true);
  };
  const closeModal = () => {
    setSelectedPaciente(null);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setEditForm(null);
  };

  // FILTRO
  const listaFiltrada = lista.filter(
    (p) =>
      (p.nome?.toLowerCase().includes(busca.toLowerCase()) || "") ||
      (p.cid?.toLowerCase().includes(busca.toLowerCase()) || "")
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const toggleForm = () => {
    setIsFormExpanded(!isFormExpanded);
  };

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        <div className="pacientes-header">
          <h1>Gerenciar Pacientes</h1>
          <p>Adicione ou visualize os pacientes da clínica.</p>
        </div>

        <div className="pacientes-section">
          <div className="form-toggle">
            <button onClick={toggleForm} className="toggle-form-btn">
              {isFormExpanded ? <FaMinus /> : <FaPlus />}
              {isFormExpanded ? "Fechar Cadastro" : "Adicionar Novo Paciente"}
            </button>
          </div>
          {isFormExpanded && (
            <div className={`form-container ${isFormExpanded ? "expanded" : "collapsed"}`}>
              <h2>Adicionar Novo Paciente</h2>
              <form className="form-paciente" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="nome">Nome Completo</label>
                  <input
                    id="nome"
                    name="nome"
                    value={form.nome}
                    onChange={handleChange}
                    placeholder="Digite o nome completo"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Digite o email"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="idade">Idade</label>
                  <input
                    id="idade"
                    name="idade"
                    value={form.idade}
                    onChange={handleChange}
                    placeholder="Digite a idade"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="sexo">Sexo</label>
                  <select id="sexo" name="sexo" value={form.sexo} onChange={handleChange}>
                    <option value="">Selecione o sexo</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="cid">CID</label>
                  <input
                    id="cid"
                    name="cid"
                    value={form.cid}
                    onChange={handleChange}
                    placeholder="Digite o CID"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="queixa">Queixa</label>
                  <input
                    id="queixa"
                    name="queixa"
                    value={form.queixa}
                    onChange={handleChange}
                    placeholder="Digite a queixa"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="observacao">Observações</label>
                  <textarea
                    id="observacao"
                    name="observacao"
                    value={form.observacao}
                    onChange={handleChange}
                    placeholder="Digite observações"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="escola">Escola</label>
                  <input
                    id="escola"
                    name="escola"
                    value={form.escola}
                    onChange={handleChange}
                    placeholder="Digite o nome da escola"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="responsavel">Responsável</label>
                  <input
                    id="responsavel"
                    name="responsavel"
                    value={form.responsavel}
                    onChange={handleChange}
                    placeholder="Digite o nome do responsável"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="docResponsavel">RG ou CPF do Responsável</label>
                  <input
                    id="docResponsavel"
                    name="docResponsavel"
                    value={form.docResponsavel}
                    onChange={handleChange}
                    placeholder="Digite o RG ou CPF"
                  />
                </div>
                {role === "admin" && (
                  <div className="form-group">
                    <label htmlFor="profissionalId">Profissional</label>
                    <select
                      id="profissionalId"
                      name="profissionalId"
                      value={form.profissionalId}
                      onChange={handleChange}
                    >
                      <option value="">Selecione o Profissional</option>
                      {profissionais.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="foto-upload">Foto do Paciente</label>
                  <input
                    id="foto-upload"
                    type="file"
                    onChange={(e) => {
                      setFoto(e.target.files[0]);
                      handleFotoPreview(e.target.files[0], setForm);
                    }}
                  />
                  {form.fotoUrl && (
                    <img
                      src={form.fotoUrl}
                      alt="Prévia da foto"
                      className="foto-preview"
                    />
                  )}
                </div>
                <button type="submit">Cadastrar Paciente</button>
              </form>
            </div>
          )}
        </div>

        <div className="pacientes-section">
          <h2>Lista de Pacientes</h2>
          <div className="busca-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nome ou CID"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div className="tabela-container">
            {listaFiltrada.length > 0 ? (
              <table className="tabela-pacientes">
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Nome</th>
                    <th>Idade</th>
                    <th>CID</th>
                    <th>Queixa</th>
                    <th>Responsável</th>
                    <th>Profissional</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {listaFiltrada.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {p.fotoUrl ? (
                          <img
                            src={p.fotoUrl}
                            alt="Foto"
                            width="40"
                            height="40"
                            style={{ borderRadius: "50%" }}
                          />
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{p.nome || "Não informado"}</td>
                      <td>{p.idade || "Não informado"}</td>
                      <td>{p.cid || "Não informado"}</td>
                      <td>{p.queixa || "Não informado"}</td>
                      <td>{p.responsavel || "Não informado"}</td>
                      <td>
                        {profissionais.find((prof) => prof.id === p.profissionalId)?.nome || "Não informado"}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn details-page-btn"
                            onClick={() => navigate(`/detalhe-paciente/${p.id}`)}
                            title="Detalhes Completos"
                            type="button"
                          >
                            <FaUserMd />
                          </button>
                          <button
                            className="action-btn edit-btn"
                            onClick={() => openEditModal(p)}
                            title="Editar"
                            type="button"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => openDeleteModal(p)}
                            title="Excluir"
                            type="button"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Nenhum paciente encontrado.</p>
            )}
          </div>
        </div>

        {/* MODAL DE EDIÇÃO */}
        {isEditModalOpen && selectedPaciente && editForm && (
          <div className="modal-overlay" onClick={(e) => handleOverlayClick(e, closeModal)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={closeModal}>
                <FaTimes style={{ color: "#FFFFFF" }} />
              </button>
              <h2>Editar Paciente</h2>
              <form className="form-paciente" onSubmit={handleEditSubmit}>
                <div className="form-group">
                  <label htmlFor="edit-nome">Nome Completo</label>
                  <input
                    id="edit-nome"
                    name="nome"
                    value={editForm.nome}
                    onChange={handleEditChange}
                    placeholder="Digite o nome completo"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-email">Email</label>
                  <input
                    id="edit-email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditChange}
                    placeholder="Digite o email"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-idade">Idade</label>
                  <input
                    id="edit-idade"
                    name="idade"
                    value={editForm.idade}
                    onChange={handleEditChange}
                    placeholder="Digite a idade"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-sexo">Sexo</label>
                  <select id="edit-sexo" name="sexo" value={editForm.sexo} onChange={handleEditChange}>
                    <option value="">Selecione o sexo</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-cid">CID</label>
                  <input
                    id="edit-cid"
                    name="cid"
                    value={editForm.cid}
                    onChange={handleEditChange}
                    placeholder="Digite o CID"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-queixa">Queixa</label>
                  <input
                    id="edit-queixa"
                    name="queixa"
                    value={editForm.queixa}
                    onChange={handleEditChange}
                    placeholder="Digite a queixa"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-observacao">Observações</label>
                  <textarea
                    id="edit-observacao"
                    name="observacao"
                    value={editForm.observacao}
                    onChange={handleEditChange}
                    placeholder="Digite observações"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-escola">Escola</label>
                  <input
                    id="edit-escola"
                    name="escola"
                    value={editForm.escola}
                    onChange={handleEditChange}
                    placeholder="Digite o nome da escola"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-responsavel">Responsável</label>
                  <input
                    id="edit-responsavel"
                    name="responsavel"
                    value={editForm.responsavel}
                    onChange={handleEditChange}
                    placeholder="Digite o nome do responsável"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-docResponsavel">RG ou CPF do Responsável</label>
                  <input
                    id="edit-docResponsavel"
                    name="docResponsavel"
                    value={editForm.docResponsavel}
                    onChange={handleEditChange}
                    placeholder="Digite o RG ou CPF"
                  />
                </div>
                {role === "admin" && (
                  <div className="form-group">
                    <label htmlFor="edit-profissionalId">Profissional</label>
                    <select
                      id="edit-profissionalId"
                      name="profissionalId"
                      value={editForm.profissionalId}
                      onChange={handleEditChange}
                    >
                      <option value="">Selecione o Profissional</option>
                      {profissionais.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="foto-upload-edit">Foto do Paciente</label>
                  <input
                    id="foto-upload-edit"
                    type="file"
                    onChange={(e) => {
                      setFoto(e.target.files[0]);
                      handleFotoPreview(e.target.files[0], setEditForm);
                    }}
                  />
                  {editForm.fotoUrl && (
                    <img
                      src={editForm.fotoUrl}
                      alt="Prévia da foto"
                      className="foto-preview"
                    />
                  )}
                </div>
                <button type="submit" className="modal-action-btn save-btn">
                  <FaCheck /> Salvar Alterações
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
        {isDeleteModalOpen && selectedPaciente && (
          <div className="modal-overlay" onClick={(e) => handleOverlayClick(e, closeModal)}>
            <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={closeModal}>
                <FaTimes style={{ color: "#FFFFFF" }} />
              </button>
              <h2>Confirmar Exclusão</h2>
              <p>Tem certeza que deseja excluir o paciente <strong>{selectedPaciente.nome}</strong>?</p>
              <p>Esta ação não pode ser desfeita.</p>
              <div className="modal-actions">
                <button className="modal-action-btn cancel-btn" onClick={closeModal}>
                  Cancelar
                </button>
                <button className="modal-action-btn delete-btn" onClick={handleDelete}>
                  <FaTrash /> Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Pacientes;
