// src/pages/Notificacoes.jsx

import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  FaBell,
  FaPlus,
  FaTimes,
  FaPaperPlane,
  FaEye,
  FaEyeSlash,
  FaTrash,
  FaEdit,
  FaFilter,
  FaSearch,
  FaFileAlt,
  FaUsers,
  FaComments,
} from "react-icons/fa";
import "./Notificacoes.css";

const Notificacoes = () => {
  const { currentUserData, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [nomeUsuario, setNomeUsuario] = useState("");
  const [nomeClinica, setNomeClinica] = useState("");
  const [role, setRole] = useState("");
  const [notificacoes, setNotificacoes] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotificacao, setSelectedNotificacao] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState("todas");
  const [filtroStatus, setFiltroStatus] = useState("todas");
  const [busca, setBusca] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    titulo: "",
    mensagem: "",
    prioridade: "normal",
    tipoDestinatario: "todos",
    tipoSelecaoEspecifica: "pacientes",
    destinatariosEspecificos: [],
    buscaDestinatario: "",
  });

  const clinicaId = currentUserData?.clinicaId;

  useEffect(() => {
    if (!authLoading && currentUserData) {
      setNomeUsuario(currentUserData.nome || "");
      setRole(currentUserData.role || "");
      setNomeClinica(currentUserData.nomeClinica || "");
      if (currentUserData.role === "admin") {
        fetchNotificacoes();
        fetchPacientes();
        fetchProfissionais();
      }
    }
    // eslint-disable-next-line
  }, [authLoading, currentUserData]);

  const fetchNotificacoes = async () => {
    if (!clinicaId) return;
    try {
      const q = query(
        collection(db, "notificacoes"),
        where("clinicaId", "==", clinicaId),
        orderBy("criadoEm", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotificacoes(data);
    } catch (error) {
      setErrorMessage("Erro ao buscar notificações: " + error.message);
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const fetchPacientes = async () => {
    if (!clinicaId) return;
    try {
      const q = query(collection(db, "pacientes"), where("clinicaId", "==", clinicaId));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPacientes(data);
    } catch (error) {
      setErrorMessage("Erro ao buscar pacientes: " + error.message);
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const fetchProfissionais = async () => {
    if (!clinicaId) return;
    try {
      const q = query(collection(db, "profissionais"), where("clinicaId", "==", clinicaId));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProfissionais(data);
    } catch (error) {
      setErrorMessage("Erro ao buscar profissionais: " + error.message);
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let destinatariosFinais = [];
      let tipoNotificacao = "geral";

      if (form.tipoDestinatario === "todos") {
        destinatariosFinais = [...pacientes.map(p => p.id), ...profissionais.map(p => p.id)];
      } else if (form.tipoDestinatario === "profissionais") {
        destinatariosFinais = profissionais.map(p => p.id);
      } else if (form.tipoDestinatario === "pacientes") {
        destinatariosFinais = pacientes.map(p => p.id);
      } else if (form.tipoDestinatario === "especifico") {
        tipoNotificacao = "especifico";
        destinatariosFinais = form.destinatariosEspecificos;
      }

      const novaNotificacao = {
        titulo: form.titulo,
        mensagem: form.mensagem,
        tipo: tipoNotificacao,
        publicoAlvo: form.tipoDestinatario,
        destinatarios: destinatariosFinais,
        prioridade: form.prioridade,
        clinicaId: clinicaId,
        criadoEm: new Date().toISOString(),
        criadoPor: currentUserData.uid,
        nomeAdmin: currentUserData.nome,
        leituras: [],
        status: "ativa",
      };

      await addDoc(collection(db, "notificacoes"), novaNotificacao);
      setSuccessMessage("Notificação enviada com sucesso!");
      setForm({
        titulo: "",
        mensagem: "",
        prioridade: "normal",
        tipoDestinatario: "todos",
        tipoSelecaoEspecifica: "pacientes",
        destinatariosEspecificos: [],
        buscaDestinatario: "",
      });
      setIsModalOpen(false);
      fetchNotificacoes();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage("Erro ao criar notificação: " + error.message);
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleDestinatarioEspecificoChange = (id) => {
    const novosDestinatarios = form.destinatariosEspecificos.includes(id)
      ? form.destinatariosEspecificos.filter(destId => destId !== id)
      : [...form.destinatariosEspecificos, id];
    setForm({ ...form, destinatariosEspecificos: novosDestinatarios });
  };

  const handleCancel = () => {
    setForm({
      titulo: "",
      mensagem: "",
      prioridade: "normal",
      tipoDestinatario: "todos",
      tipoSelecaoEspecifica: "pacientes",
      destinatariosEspecificos: [],
      buscaDestinatario: "",
    });
    setIsModalOpen(false);
    setSelectedNotificacao(null);
  };

  const toggleNotificacaoStatus = async (id, statusAtual) => {
    try {
      const notifRef = doc(db, "notificacoes", id);
      await updateDoc(notifRef, { status: statusAtual === "ativa" ? "inativa" : "ativa" });
      fetchNotificacoes();
    } catch (error) {
      setErrorMessage("Erro ao alterar status: " + error.message);
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const deleteNotificacao = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta notificação?")) {
      try {
        await deleteDoc(doc(db, "notificacoes", id));
        fetchNotificacoes();
        setSuccessMessage("Notificação excluída com sucesso!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (error) {
        setErrorMessage("Erro ao excluir notificação: " + error.message);
        setTimeout(() => setErrorMessage(""), 3000);
      }
    }
  };

  const notificacoesFiltradas = notificacoes.filter(notif => {
    const matchTipo = filtroTipo === "todas" || notif.tipo === filtroTipo;
    const matchStatus = filtroStatus === "todas" || notif.status === filtroStatus;
    const matchBusca =
      busca === "" ||
      notif.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      notif.mensagem.toLowerCase().includes(busca.toLowerCase());
    return matchTipo && matchStatus && matchBusca;
  });

  const getPrioridadeColor = (prioridade) => {
    switch (prioridade) {
      case "baixa": return "#28a745";
      case "normal": return "#007bff";
      case "alta": return "#ffc107";
      case "urgente": return "#dc3545";
      default: return "#007bff";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getNomeDestinatario = (id) => {
    const paciente = pacientes.find(p => p.id === id);
    if (paciente) return paciente.nome;
    const profissional = profissionais.find(p => p.id === id);
    if (profissional) return profissional.nome;
    return "Desconhecido";
  };

  const getDestinatariosInfo = (notif) => {
    if (notif.publicoAlvo === "todos") return "Todos (Clientes e Profissionais)";
    if (notif.publicoAlvo === "profissionais") {
      const nomes = notif.destinatarios.map(id => getNomeDestinatario(id)).join(", ");
      return `Profissional${notif.destinatarios.length > 1 ? "es" : ""}: ${nomes || "Não especificado"}`;
    }
    if (notif.publicoAlvo === "pacientes") {
      const nomes = notif.destinatarios.map(id => getNomeDestinatario(id)).join(", ");
      return `Cliente${notif.destinatarios.length > 1 ? "s" : ""}: ${nomes || "Não especificado"}`;
    }
    if (notif.publicoAlvo === "especifico") {
      const tipo = notif.destinatarios.every(id => pacientes.some(p => p.id === id)) ? "Cliente" : "Profissional";
      const nomes = notif.destinatarios.map(id => getNomeDestinatario(id)).join(", ");
      return `${tipo}${notif.destinatarios.length > 1 ? "s" : ""}: ${nomes || "Não especificado"}`;
    }
    return "Não especificado";
  };

  const filteredPacientes = pacientes.filter(p =>
    p.nome.toLowerCase().includes(form.buscaDestinatario.toLowerCase())
  );

  const filteredProfissionais = profissionais.filter(p =>
    p.nome.toLowerCase().includes(form.buscaDestinatario.toLowerCase())
  );

  if (authLoading) {
    return <div className="loading-container">Carregando...</div>;
  }

  if (role !== "admin") {
    return (
      <div className="access-denied">
        <h2>Acesso Negado</h2>
        <p>Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="notificacoes-page">
      <div className="notificacoes-container">
          <div className="notificacoes-header">
            <h1><FaBell /> Gerenciar Notificações</h1>
            <p>Envie avisos e comunicados para pacientes e profissionais da clínica</p>
          </div>

          {(successMessage || errorMessage) && (
            <div className={`alert ${successMessage ? "alert-success" : "alert-error"}`}>
              <FaBell className="alert-icon" />
              <span>{successMessage || errorMessage}</span>
              <button className="alert-close" onClick={() => { setSuccessMessage(""); setErrorMessage(""); }}>
                <FaTimes />
              </button>
            </div>
          )}

          <div className="controls-section">
            <div className="search-filter-bar">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar por título ou mensagem..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
              <div className="filters">
                <div className="filter-group">
                  <FaFilter className="filter-icon" />
                  <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                    <option value="todas">Todos os tipos</option>
                    <option value="geral">Geral</option>
                    <option value="especifico">Específico</option>
                  </select>
                </div>
                <div className="filter-group">
                  <FaFilter className="filter-icon" />
                  <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                    <option value="todas">Todos os status</option>
                    <option value="ativa">Ativa</option>
                    <option value="inativa">Inativa</option>
                  </select>
                </div>
              </div>
            </div>
            <button className="nova-notificacao-btn" onClick={() => { setIsModalOpen(true); setSelectedNotificacao(null); }}>
              <FaPlus /> Nova Notificação
            </button>
          </div>

          <div className="notificacoes-table-container">
            <table className="notificacoes-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Mensagem</th>
                  <th>Destinatário</th>
                  <th>Tipo</th>
                  <th>Prioridade</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {notificacoesFiltradas.length > 0 ? (
                  notificacoesFiltradas.map((notif) => (
                    <tr key={notif.id} onClick={() => { setSelectedNotificacao(notif); setIsModalOpen(true); }} className="notificacao-row">
                      <td>{notif.titulo}</td>
                      <td>{notif.mensagem}</td>
                      <td>{getDestinatariosInfo(notif)}</td>
                      <td><span className={`tipo tipo-${notif.tipo}`}>{notif.tipo === "geral" ? "Geral" : "Específico"}</span></td>
                      <td><span className={`prioridade prioridade-${notif.prioridade}`}>{notif.prioridade.toUpperCase()}</span></td>
                      <td>{formatDate(notif.criadoEm)}</td>
                      <td>{notif.status === "ativa" ? "Ativa" : "Inativa"}</td>
                      <td>
                        <button
                          className={`action-btn ${notif.status === "ativa" ? "toggle-inativa" : "toggle-ativa"}`}
                          onClick={(e) => { e.stopPropagation(); toggleNotificacaoStatus(notif.id, notif.status); }}
                          title={notif.status === "ativa" ? "Marcar como inativa" : "Marcar como ativa"}
                        >
                          {notif.status === "ativa" ? <FaEyeSlash /> : <FaEye />}
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={(e) => { e.stopPropagation(); deleteNotificacao(notif.id); }}
                          title="Excluir notificação"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="empty-state">
                      <FaBell className="empty-icon" />
                      <h3>Nenhuma notificação encontrada</h3>
                      <p>Crie sua primeira notificação para começar a se comunicar com os pacientes.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {isModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content">
                <button className="modal-close-btn" onClick={handleCancel}>
                  <FaTimes />
                </button>
                {!selectedNotificacao ? (
                  <form className="notificacao-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                      <div className="form-field">
                        <label><FaFileAlt className="form-icon" /> Título da Notificação</label>
                        <input
                          type="text"
                          name="titulo"
                          value={form.titulo}
                          onChange={handleChange}
                          placeholder="Ex: Comunicado importante sobre horários"
                          required
                        />
                      </div>
                      <div className="form-field">
                        <label><FaBell className="form-icon" /> Prioridade</label>
                        <select name="prioridade" value={form.prioridade} onChange={handleChange}>
                          <option value="baixa">Baixa</option>
                          <option value="normal">Normal</option>
                          <option value="alta">Alta</option>
                          <option value="urgente">Urgente</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-field">
                      <label><FaUsers className="form-icon" /> Público Alvo</label>
                      <select name="tipoDestinatario" value={form.tipoDestinatario} onChange={handleChange}>
                        <option value="todos">Todos (Pacientes e Profissionais)</option>
                        <option value="profissionais">Apenas Profissionais</option>
                        <option value="pacientes">Apenas Pacientes</option>
                        <option value="especifico">Selecionar Específicos</option>
                      </select>
                    </div>
                    {form.tipoDestinatario === "especifico" && (
                      <>
                        <div className="form-field">
                          <label><FaFilter className="form-icon" /> Tipo de Seleção Específica</label>
                          <select
                            name="tipoSelecaoEspecifica"
                            value={form.tipoSelecaoEspecifica}
                            onChange={handleChange}
                          >
                            <option value="pacientes">Pacientes</option>
                            <option value="profissionais">Profissionais</option>
                          </select>
                        </div>
                        <div className="form-field">
                          <label><FaSearch className="form-icon" /> Buscar e Selecionar</label>
                          <input
                            type="text"
                            name="buscaDestinatario"
                            value={form.buscaDestinatario}
                            onChange={handleChange}
                            placeholder="Buscar por nome..."
                          />
                          <div className="destinatarios-list">
                            {form.tipoSelecaoEspecifica === "pacientes" && filteredPacientes.length > 0 && (
                              <h4>Pacientes:</h4>
                            )}
                            {form.tipoSelecaoEspecifica === "pacientes" && filteredPacientes.length > 0 ? (
                              filteredPacientes.map((paciente) => (
                                <label key={paciente.id} className="destinatario-item">
                                  <input
                                    type="checkbox"
                                    checked={form.destinatariosEspecificos.includes(paciente.id)}
                                    onChange={() => handleDestinatarioEspecificoChange(paciente.id)}
                                  />
                                  <span className="destinatario-nome">{paciente.nome}</span>
                                  <span className="destinatario-info">
                                    {paciente.idade ? `${paciente.idade} anos` : "Idade não informada"}
                                  </span>
                                </label>
                              ))
                            ) : form.tipoSelecaoEspecifica === "pacientes" && (
                              <p>Nenhum paciente encontrado.</p>
                            )}
                            {form.tipoSelecaoEspecifica === "profissionais" && filteredProfissionais.length > 0 && (
                              <h4>Profissionais:</h4>
                            )}
                            {form.tipoSelecaoEspecifica === "profissionais" && filteredProfissionais.length > 0 ? (
                              filteredProfissionais.map((profissional) => (
                                <label key={profissional.id} className="destinatario-item">
                                  <input
                                    type="checkbox"
                                    checked={form.destinatariosEspecificos.includes(profissional.id)}
                                    onChange={() => handleDestinatarioEspecificoChange(profissional.id)}
                                  />
                                  <span className="destinatario-nome">{profissional.nome}</span>
                                  <span className="destinatario-info">
                                    {profissional.especialidade || "Especialidade não informada"}
                                  </span>
                                </label>
                              ))
                            ) : form.tipoSelecaoEspecifica === "profissionais" && (
                              <p>Nenhum profissional encontrado.</p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    <div className="form-field">
                      <label><FaComments className="form-icon" /> Mensagem</label>
                      <textarea
                        name="mensagem"
                        value={form.mensagem}
                        onChange={handleChange}
                        placeholder="Digite sua mensagem aqui..."
                        rows="5"
                        required
                      />
                    </div>
                    <div className="form-actions">
                      <button type="button" className="cancel-btn" onClick={handleCancel}>
                        <FaTimes /> Cancelar
                      </button>
                      <button type="submit" className="submit-btn">
                        <FaPaperPlane /> Enviar Notificação
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="modal-details">
                    <h2><FaBell /> Detalhes da Notificação</h2>
                    <h3>{selectedNotificacao.titulo}</h3>
                    <p><strong>Mensagem:</strong> {selectedNotificacao.mensagem}</p>
                    <p><strong>Tipo:</strong> {selectedNotificacao.tipo === "geral" ? "Geral" : "Específico"}</p>
                    <p><strong>Prioridade:</strong> <span style={{ color: getPrioridadeColor(selectedNotificacao.prioridade) }}>{selectedNotificacao.prioridade.toUpperCase()}</span></p>
                    <p><strong>Data de Criação:</strong> {formatDate(selectedNotificacao.criadoEm)}</p>
                    <p><strong>Status:</strong> {selectedNotificacao.status === "ativa" ? "Ativa" : "Inativa"}</p>
                    <p><strong>Criado por:</strong> {selectedNotificacao.nomeAdmin}</p>
                    {selectedNotificacao.tipo === "especifico" && (
                      <div>
                        <p><strong>Destinatários:</strong></p>
                        <ul>
                          {selectedNotificacao.destinatarios.map((id) => (
                            <li key={id}>{getNomeDestinatario(id)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p><strong>Leituras:</strong> {selectedNotificacao.leituras?.length || 0}</p>
                    <p><strong>Total de Destinatários:</strong> {selectedNotificacao.destinatarios?.length || 0}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
    </div>
  );
};

export default Notificacoes;
