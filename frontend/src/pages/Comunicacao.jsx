import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db, storage } from "../firebase";
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
  FaPaperclip,
  FaImage,
  FaFile,
  FaVideo,
  FaPlusSquare,
  FaUsers,
  FaComments,
  FaFileAlt,
  FaEnvelope,
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import "./Comunicacao.css";

const Comunicacao = () => {
  const { currentUserData, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [mensagens, setMensagens] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMensagem, setSelectedMensagem] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("todas");
  const [busca, setBusca] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    titulo: "",
    mensagem: "",
    destinatariosEspecificos: [],
    buscaDestinatario: "",
    prioridade: "normal",
    anexos: [],
    arquivos: [],
  });

  const clinicaId = currentUserData?.clinicaId;

  useEffect(() => {
    if (!authLoading && currentUserData) {
      setRole(currentUserData.role || "");
      if (currentUserData.role === "terapeuta" || currentUserData.role === "admin") {
        fetchMensagens();
        fetchPacientes();
      }
    }
  }, [authLoading, currentUserData]);

  const fetchMensagens = async () => {
    if (!clinicaId) return;
    try {
      const q = query(
        collection(db, "mensagens"),
        where("clinicaId", "==", clinicaId),
        orderBy("criadoEm", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMensagens(data);
      console.log("Notificações brutas do Firestore:", data);
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
      setErrorMessage("Erro ao buscar mensagens: " + error.message);
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

  const handleFileChange = (e) => {
    // Desativado temporariamente - apenas visual
    console.log("Upload de arquivos desativado até configuração do Firebase Storage.");
  };

  const uploadFiles = async (mensagemId) => {
    // Função desativada temporariamente
    return [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Determina se a mensagem é para todos os pacientes (se nenhum específico foi selecionado)
      const isSendingToAll = form.destinatariosEspecificos.length === 0;
      
      // Define a lista de destinatários com base na seleção
      const destinatariosArray = isSendingToAll 
        ? pacientes.map(p => p.id) // Se for para todos, usa todos os IDs de pacientes
        : form.destinatariosEspecificos; // Caso contrário, usa os IDs específicos selecionados

      const mensagemData = {
        titulo: form.titulo,
        mensagem: form.mensagem,
        // Novo campo para indicar o público-alvo
        publicoAlvo: isSendingToAll ? "todos" : "especificos", 
        destinatarios: destinatariosArray,
        prioridade: form.prioridade,
        clinicaId: clinicaId,
        remetenteId: currentUserData.uid,
        remetenteNome: currentUserData.nome,
        criadoEm: new Date().toISOString(),
        leituras: [],
        status: "ativa",
      };

      const docRef = await addDoc(collection(db, "mensagens"), mensagemData);
      // Upload de arquivos desativado
      setSuccessMessage("Mensagem enviada com sucesso!");
      setForm({
        titulo: "",
        mensagem: "",
        destinatariosEspecificos: [],
        buscaDestinatario: "",
        prioridade: "normal",
        anexos: [],
        arquivos: [],
      });
      setIsModalOpen(false);
      fetchMensagens();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage("Erro ao enviar mensagem: " + error.message);
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
      destinatariosEspecificos: [],
      buscaDestinatario: "",
      prioridade: "normal",
      anexos: [],
      arquivos: [],
    });
    setIsModalOpen(false);
  };

  const toggleMensagemStatus = async (id, statusAtual) => {
    try {
      const mensagemRef = doc(db, "mensagens", id);
      await updateDoc(mensagemRef, { status: statusAtual === "ativa" ? "inativa" : "ativa" });
      fetchMensagens();
    } catch (error) {
      setErrorMessage("Erro ao alterar status: " + error.message);
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const deleteMensagem = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta mensagem?")) {
      try {
        await deleteDoc(doc(db, "mensagens", id));
        fetchMensagens();
        setSuccessMessage("Mensagem excluída com sucesso!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (error) {
        setErrorMessage("Erro ao excluir mensagem: " + error.message);
        setTimeout(() => setErrorMessage(""), 3000);
      }
    }
  };

  const mensagensFiltradas = mensagens.filter(mens => {
    const matchStatus = filtroStatus === "todas" || mens.status === filtroStatus;
    const matchBusca =
      busca === "" ||
      mens.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      mens.mensagem.toLowerCase().includes(busca.toLowerCase());
    return matchStatus && matchBusca;
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
    return paciente ? paciente.nome : "Desconhecido";
  };

  const getDestinatariosInfo = (mens) => {
    // Se o campo publicoAlvo for "todos", exibe "Todos os Clientes"
    if (mens.publicoAlvo === "todos") {
      return "Todos os Clientes";
    } 
    // Se o campo publicoAlvo for "especificos", ou se for uma mensagem antiga
    // que não tem o campo publicoAlvo (ou tem "pacientes"),
    // então lista os nomes dos destinatários específicos.
    else if (mens.publicoAlvo === "especificos" || !mens.publicoAlvo || mens.publicoAlvo === "pacientes") {
      if (!mens.destinatarios || mens.destinatarios.length === 0) {
        return "Nenhum destinatário"; // Caso não haja destinatários por algum motivo
      }
      const nomes = mens.destinatarios.map(id => getNomeDestinatario(id)).join(", ");
      return nomes || "Não especificado";
    }
    // Fallback para qualquer outro caso inesperado, embora os dois acima devam cobrir tudo
    return "Informação indisponível";
  };

  const filteredPacientes = pacientes.filter(p =>
    p.nome.toLowerCase().includes(form.buscaDestinatario.toLowerCase())
  );

  if (authLoading) {
    return <div className="loading-container">Carregando...</div>;
  }

  if (role !== "terapeuta" && role !== "admin") {
    return (
      <div className="access-denied">
        <h2>Acesso Negado</h2>
        <p>Apenas terapeutas e administradores podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        <div className="comunicacao-header">
          <h1><FaComments /> Comunicação</h1>
          <p>Gerencie mensagens e comunicações com pacientes</p>
        </div>

        {successMessage && (
          <div className="alert alert-success">
            <FaBell className="alert-icon" />
            <span>{successMessage}</span>
            <button className="alert-close" onClick={() => setSuccessMessage("")}>
              <FaTimes />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-error">
            <FaBell className="alert-icon" />
            <span>{errorMessage}</span>
            <button className="alert-close" onClick={() => setErrorMessage("")}>
              <FaTimes />
            </button>
          </div>
        )}

        <div className="comunicacao-controls">
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
                <label><FaFilter /> Status:</label>
                <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                  <option value="todas">Todas</option>
                  <option value="ativa">Ativas</option>
                  <option value="inativa">Inativas</option>
                </select>
              </div>
            </div>
          </div>

          <button className="btn-nova-mensagem" onClick={() => { setSelectedMensagem(null); setIsModalOpen(true); }}>
            <FaPlus /> Nova Mensagem
          </button>
        </div>

        <div className="mensagens-container">
          <div className="table-container">
            <table className="mensagens-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Mensagem</th>
                  <th>Destinatário</th>
                  <th>Prioridade</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {mensagensFiltradas.length > 0 ? (
                  mensagensFiltradas.map((mens) => (
                    <tr key={mens.id} className="mensagem-row">
                      <td>{mens.titulo}</td>
                      <td>{mens.mensagem.substring(0, 50) + (mens.mensagem.length > 50 ? "..." : "")}</td>
                      <td>{getDestinatariosInfo(mens)}</td>
                      <td><span className={`prioridade prioridade-${mens.prioridade}`}>{mens.prioridade.toUpperCase()}</span></td>
                      <td>{formatDate(mens.criadoEm)}</td>
                      <td>{mens.status === "ativa" ? "Ativa" : "Inativa"}</td>
                      <td>
                        <button
                          className={`action-btn toggle-ver ${mens.status === "ativa" ? "toggle-ativa" : "toggle-inativa"}`}
                          onClick={(e) => { e.stopPropagation(); setSelectedMensagem(mens); setIsModalOpen(true); }}
                          title="Ver detalhes"
                        >
                          <FaPlusSquare />
                        </button>
                        <button
                          className={`action-btn ${mens.status === "ativa" ? "toggle-inativa" : "toggle-ativa"}`}
                          onClick={(e) => { e.stopPropagation(); toggleMensagemStatus(mens.id, mens.status); }}
                          title={mens.status === "ativa" ? "Marcar como inativa" : "Marcar como ativa"}
                        >
                          {mens.status === "ativa" ? <FaEyeSlash /> : <FaEye />}
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={(e) => { e.stopPropagation(); deleteMensagem(mens.id); }}
                          title="Excluir mensagem"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      <FaEnvelope className="empty-icon" />
                      <h3>Nenhuma mensagem encontrada</h3>
                      <p>Crie sua primeira mensagem para começar a se comunicar com os clientes.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {isModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content">
                <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                  <FaTimes />
                </button>
                <h2><FaEnvelope /> {selectedMensagem ? "Detalhes da Mensagem" : "Nova Mensagem"}</h2>
                {selectedMensagem ? ( // Renderiza detalhes se selectedMensagem existe
                  <div className="modal-details">
                    <h3>{selectedMensagem.titulo}</h3>
                    <p><strong>Mensagem:</strong> {selectedMensagem.mensagem}</p>
                    <p><strong>Prioridade:</strong> <span style={{ color: getPrioridadeColor(selectedMensagem.prioridade) }}>{selectedMensagem.prioridade.toUpperCase()}</span></p>
                    <p><strong>Data de Criação:</strong> {formatDate(selectedMensagem.criadoEm)}</p>
                    <p><strong>Status:</strong> {selectedMensagem.status === "ativa" ? "Ativa" : "Inativa"}</p>
                    <p><strong>Remetente:</strong> {selectedMensagem.remetenteNome}</p>
                    <p><strong>Destinatário(s):</strong> {getDestinatariosInfo(selectedMensagem)}</p>
                    <div className="anexos-section">
                      <p><strong>Anexos:</strong></p>
                      {selectedMensagem.anexos && selectedMensagem.anexos.length > 0 ? (
                        <ul>
                          {selectedMensagem.anexos.map((url, index) => (
                            <li key={index}>
                              <a href={url} target="_blank" rel="noopener noreferrer" className="anexo-link">
                                {url.split('/').pop()}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="no-anexos">Nenhum anexo disponível. (Upload desativado até configuração do Firebase Storage)</p>
                      )}
                    </div>
                    <p><strong>Leituras:</strong> {selectedMensagem.leituras?.length || 0}</p>
                  </div>
                ) : ( // Renderiza o formulário se selectedMensagem é null (nova mensagem)
                  <form className="mensagem-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                      <div className="form-field">
                        <label><FaFileAlt className="form-icon" /> Título da Mensagem</label>
                        <input
                          type="text"
                          name="titulo"
                          value={form.titulo}
                          onChange={handleChange}
                          placeholder="Ex: Acompanhamento semanal"
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
                      <label><FaUsers className="form-icon" /> Destinatários</label>
                      <input
                        type="text"
                        name="buscaDestinatario"
                        value={form.buscaDestinatario}
                        onChange={handleChange}
                        placeholder="Buscar clientes por nome..."
                      />
                      <div className="destinatarios-list">
                        {filteredPacientes.length > 0 ? (
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
                        ) : (
                          <p>Nenhum cliente encontrado.</p>
                        )}
                      </div>
                    </div>
                    <div className="form-field">
                      <label><FaComments className="form-icon" /> Mensagem</label>
                      <textarea
                        name="mensagem"
                        value={form.mensagem}
                        onChange={handleChange}
                        placeholder="Digite sua mensagem aqui (ex.: sobre atendimento, acompanhamento ou relatório)..."
                        rows="5"
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label><FaPaperclip className="form-icon" /> Anexos (opcional) - Visual apenas</label>
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*,application/pdf"
                        onChange={handleFileChange}
                        disabled
                        title="Upload de arquivos desativado até configuração do Firebase Storage."
                      />
                      {form.arquivos.length > 0 && (
                        <div className="uploaded-files">
                          <p>Arquivos selecionados:</p>
                          <ul>
                            {form.arquivos.map((file, index) => (
                              <li key={index}>{file.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="notice">Nota: O upload de arquivos está desativado até a ativação do Firebase Storage (plano Blaze). Considere configurar um bucket em regiões como US-CENTRAL1 para aproveitar o 'Always Free' tier.</p>
                    </div>
                    <div className="form-actions">
                      <button type="button" className="cancel-btn" onClick={handleCancel}>
                        <FaTimes /> Cancelar
                      </button>
                      <button type="submit" className="submit-btn">
                        <FaPaperPlane /> Enviar Mensagem
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Comunicacao;

