import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaClinicMedical,
  FaSignOutAlt,
  FaChevronDown,
  FaChevronUp,
  FaHome,
  FaUsers,
  FaFileAlt,
  FaCalendarAlt,
  FaComments,
  FaChartBar,
  FaCog,
  FaListAlt,
  FaFileMedical,
  FaFolderOpen,
  FaCalendarCheck,
  FaUserClock,
  FaPlusCircle,
  FaEnvelope,
  FaFileInvoice,
  FaTools,
  FaBell,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaDownload,
  FaUpload,
  FaSearch,
  FaFilter,
  FaClipboardList,
  FaBrain,
  FaStethoscope,
  FaGamepad,
  FaPuzzlePiece,
  FaBookOpen,
} from "react-icons/fa";
import logo from "../assets/logo.png";
import "./Testes.css";

const Testes = () => {
  const { currentUserData, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [nomeUsuario, setNomeUsuario] = useState("");
  const [nomeClinica, setNomeClinica] = useState("");
  const [role, setRole] = useState("");
  const [openSection, setOpenSection] = useState(null);

  // Estados para testes
  const [testes, setTestes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); // "create", "edit", "view"
  const [selectedTeste, setSelectedTeste] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");

  // Estados do formulário
  const [form, setForm] = useState({
    nome: "",
    categoria: "cognitivo",
    descricao: "",
    instrucoes: "",
    tempoEstimado: "",
    idadeMinima: "",
    idadeMaxima: "",
    materiais: "",
    observacoes: "",
    status: "ativo",
  });

  const clinicaId = currentUserData?.clinicaId;

  useEffect(() => {
    if (!authLoading && currentUserData) {
      setNomeUsuario(currentUserData.nome || "");
      setRole(currentUserData.role || "");
      setNomeClinica(currentUserData.nomeClinica || "");
      
      if (currentUserData.role === "admin" || currentUserData.role === "terapeuta") {
        fetchTestes();
      }
    }
  }, [authLoading, currentUserData, clinicaId]);

  const fetchTestes = async () => {
    if (!clinicaId) return;
    try {
      const q = query(
        collection(db, "testes"),
        where("clinicaId", "==", clinicaId),
        orderBy("criadoEm", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTestes(data);
    } catch (error) {
      console.error("Erro ao buscar testes:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === "create") {
        const novoTeste = {
          ...form,
          clinicaId: clinicaId,
          criadoEm: new Date().toISOString(),
          criadoPor: currentUserData.uid,
          nomeAutor: currentUserData.nome,
          aplicacoes: 0,
        };
        await addDoc(collection(db, "testes"), novoTeste);
      } else if (modalType === "edit") {
        await updateDoc(doc(db, "testes", selectedTeste.id), {
          ...form,
          atualizadoEm: new Date().toISOString(),
          atualizadoPor: currentUserData.uid,
        });
      }
      
      resetForm();
      setIsModalOpen(false);
      fetchTestes();
    } catch (error) {
      console.error("Erro ao salvar teste:", error);
    }
  };

  const resetForm = () => {
    setForm({
      nome: "",
      categoria: "cognitivo",
      descricao: "",
      instrucoes: "",
      tempoEstimado: "",
      idadeMinima: "",
      idadeMaxima: "",
      materiais: "",
      observacoes: "",
      status: "ativo",
    });
    setSelectedTeste(null);
    setModalType("");
  };

  const handleEdit = (teste) => {
    setForm({
      nome: teste.nome || "",
      categoria: teste.categoria || "cognitivo",
      descricao: teste.descricao || "",
      instrucoes: teste.instrucoes || "",
      tempoEstimado: teste.tempoEstimado || "",
      idadeMinima: teste.idadeMinima || "",
      idadeMaxima: teste.idadeMaxima || "",
      materiais: teste.materiais || "",
      observacoes: teste.observacoes || "",
      status: teste.status || "ativo",
    });
    setSelectedTeste(teste);
    setModalType("edit");
    setIsModalOpen(true);
  };

  const handleView = (teste) => {
    setSelectedTeste(teste);
    setModalType("view");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    resetForm();
    setModalType("create");
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

  const toggleSection = (index) => {
    setOpenSection(openSection === index ? null : index);
  };

  const menuSections = [
    {
      title: "Dashboard",
      icon: <FaHome />,
      items: [{ label: "Início", path: "/dashboard", icon: <FaHome /> }],
    },
    {
      title: "Pacientes",
      icon: <FaUsers />,
      items: [
        { label: "Lista de Pacientes", path: "/pacientes", icon: <FaListAlt /> },
        { label: "Evolução Diária", path: "/evolucao", icon: <FaFileMedical /> },
        { label: "Anamnese", path: "/anamnese", icon: <FaFileAlt /> },
        { label: "Documentos", path: "/documentos-paciente", icon: <FaFolderOpen /> },
      ],
    },
    {
      title: "Terapias",
      icon: <FaFileAlt />,
      items: [
        { label: "Planejamento", path: "/planejamento", icon: <FaCalendarAlt /> },
        { label: "Registro de Terapias", path: "/terapias", icon: <FaFileAlt /> },
        { label: "Testes", path: "/testes", icon: <FaFileMedical /> },
      ],
    },
    {
      title: "Agenda",
      icon: <FaCalendarAlt />,
      items: [
        { label: "Agenda Geral", path: "/agenda-geral", icon: <FaCalendarCheck /> },
        { label: "Agenda por Profissional", path: "/agenda-profissional", icon: <FaUserClock /> },
        { label: "Adicionar Agendamento", path: "/adicionar-agendamento", icon: <FaPlusCircle /> },
      ],
    },
    {
      title: "Comunicação",
      icon: <FaComments />,
      items: [
        { label: "Mensagens", path: "/comunicacao", icon: <FaEnvelope /> },
        { label: "Notificações", path: "/notificacoes", icon: <FaBell /> },
      ],
    },
    {
      title: "Relatórios",
      icon: <FaChartBar />,
      items: [
        { label: "Gerar Relatório", path: "/gerar-relatorio", icon: <FaChartBar /> },
        { label: "Testes", path: "/testes", icon: <FaFileMedical /> },
        { label: "Recursos", path: "/recursos", icon: <FaFileInvoice /> },
      ],
    },
    ...(role === "admin"
      ? [
          {
            title: "Administração",
            icon: <FaCog />,
            items: [
              { label: "Profissionais", path: "/profissionais", icon: <FaUsers /> },
              { label: "Configurações", path: "/administracao", icon: <FaTools /> },
            ],
          },
        ]
      : []),
  ];

  const categorias = [
    { value: "cognitivo", label: "Cognitivo", icon: <FaBrain />, color: "#4A90E2" },
    { value: "motor", label: "Motor", icon: <FaStethoscope />, color: "#28A745" },
    { value: "linguagem", label: "Linguagem", icon: <FaBookOpen />, color: "#FFC107" },
    { value: "social", label: "Social", icon: <FaUsers />, color: "#17A2B8" },
    { value: "ludico", label: "Lúdico", icon: <FaGamepad />, color: "#E83E8C" },
    { value: "sensorial", label: "Sensorial", icon: <FaPuzzlePiece />, color: "#6F42C1" },
  ];

  const testesFiltrados = testes.filter(teste => {
    const matchCategoria = filtroCategoria === "todas" || teste.categoria === filtroCategoria;
    const matchStatus = filtroStatus === "todos" || teste.status === filtroStatus;
    const matchBusca = busca === "" || 
      teste.nome.toLowerCase().includes(busca.toLowerCase()) ||
      teste.descricao.toLowerCase().includes(busca.toLowerCase());
    
    return matchCategoria && matchStatus && matchBusca;
  });

  const getCategoriaInfo = (categoria) => {
    return categorias.find(cat => cat.value === categoria) || categorias[0];
  };

  if (authLoading) {
    return <div className="loading-container">Carregando...</div>;
  }

  if (role !== "admin" && role !== "terapeuta") {
    return (
      <div className="access-denied">
        <h2>Acesso Negado</h2>
        <p>Apenas administradores e terapeutas podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="logo-container">
          <img src={logo} alt="Logo Neuroverse" className="logo" />
        </div>
        <div className="user-clinica-box">
          <div className="info-titulo">Bem-vindo(a)</div>
          <div className="info-nome">
            <FaUser className="icon" />
            <span>{nomeUsuario}</span>
          </div>
          <div className="info-clinica">
            <FaClinicMedical className="icon" />
            <span>{nomeClinica}</span>
          </div>
        </div>
        <nav className="menu">
          {menuSections.map((section, index) => (
            <div className="menu-section" key={index}>
              <div
                className={`section-header ${openSection === index ? "active" : ""}`}
                onClick={() => toggleSection(index)}
              >
                <span className="section-title">
                  {section.icon}
                  {section.title}
                </span>
                <span className="arrow">
                  {openSection === index ? <FaChevronUp /> : <FaChevronDown />}
                </span>
              </div>
              {openSection === index && (
                <ul className="section-items">
                  {section.items.map((item, idx) => (
                    <li
                      key={idx}
                      className="menu-item"
                      onClick={() => navigate(item.path)}
                    >
                      {item.icon}
                      {item.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
        <div className="logout-box" onClick={handleLogout}>
          <FaSignOutAlt className="logout-icon" />
          <span>Sair</span>
        </div>
      </aside>

      <main className="main-content">
        <div className="testes-container">
          <div className="testes-header">
            <h1><FaFileMedical /> Banco de Testes</h1>
            <p>Gerencie e organize testes terapêuticos para aplicação com pacientes</p>
          </div>

          {/* Controles superiores */}
          <div className="controls-section">
            <div className="search-filter-bar">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar testes..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
              
              <div className="filters">
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                >
                  <option value="todas">Todas as categorias</option>
                  {categorias.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                >
                  <option value="todos">Todos os status</option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="rascunho">Rascunho</option>
                </select>
              </div>
            </div>

            <button
              className="novo-teste-btn"
              onClick={handleCreate}
            >
              <FaPlus /> Novo Teste
            </button>
          </div>

          {/* Lista de testes */}
          <div className="testes-grid">
            {testesFiltrados.length > 0 ? (
              testesFiltrados.map((teste) => {
                const categoriaInfo = getCategoriaInfo(teste.categoria);
                return (
                  <div key={teste.id} className="teste-card">
                    <div className="teste-header">
                      <div className="categoria-badge" style={{ backgroundColor: categoriaInfo.color }}>
                        {categoriaInfo.icon}
                        <span>{categoriaInfo.label}</span>
                      </div>
                      <div className="teste-actions">
                        <button 
                          className="action-btn view-btn"
                          onClick={() => handleView(teste)}
                        >
                          <FaEye />
                        </button>
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => handleEdit(teste)}
                        >
                          <FaEdit />
                        </button>
                      </div>
                    </div>
                    
                    <div className="teste-content">
                      <h3>{teste.nome}</h3>
                      <p className="teste-descricao">{teste.descricao}</p>
                      
                      <div className="teste-meta">
                        <div className="meta-item">
                          <span className="meta-label">Tempo:</span>
                          <span className="meta-value">{teste.tempoEstimado || "Não informado"}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Idade:</span>
                          <span className="meta-value">
                            {teste.idadeMinima && teste.idadeMaxima 
                              ? `${teste.idadeMinima}-${teste.idadeMaxima} anos`
                              : "Não informado"
                            }
                          </span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Aplicações:</span>
                          <span className="meta-value">{teste.aplicacoes || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="teste-footer">
                      <span className={`status-badge status-${teste.status}`}>
                        {teste.status === "ativo" ? "Ativo" : 
                         teste.status === "inativo" ? "Inativo" : "Rascunho"}
                      </span>
                      <span className="autor">Por: {teste.nomeAutor}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <FaFileMedical className="empty-icon" />
                <h3>Nenhum teste encontrado</h3>
                <p>Crie seu primeiro teste para começar a organizar suas avaliações terapêuticas.</p>
                <button className="create-first-btn" onClick={handleCreate}>
                  <FaPlus /> Criar Primeiro Teste
                </button>
              </div>
            )}
          </div>

          {/* Modal */}
          {isModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content">
                <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                  <FaTimes />
                </button>
                
                <h2>
                  {modalType === "create" && <><FaPlus /> Novo Teste</>}
                  {modalType === "edit" && <><FaEdit /> Editar Teste</>}
                  {modalType === "view" && <><FaEye /> Visualizar Teste</>}
                </h2>
                
                {modalType === "view" ? (
                  <div className="teste-view">
                    <div className="view-section">
                      <h3>Informações Básicas</h3>
                      <div className="view-grid">
                        <div className="view-field">
                          <label>Nome:</label>
                          <span>{selectedTeste?.nome}</span>
                        </div>
                        <div className="view-field">
                          <label>Categoria:</label>
                          <span>{getCategoriaInfo(selectedTeste?.categoria).label}</span>
                        </div>
                        <div className="view-field">
                          <label>Status:</label>
                          <span className={`status-badge status-${selectedTeste?.status}`}>
                            {selectedTeste?.status === "ativo" ? "Ativo" : 
                             selectedTeste?.status === "inativo" ? "Inativo" : "Rascunho"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="view-section">
                      <h3>Descrição</h3>
                      <p>{selectedTeste?.descricao}</p>
                    </div>
                    
                    <div className="view-section">
                      <h3>Instruções</h3>
                      <p>{selectedTeste?.instrucoes}</p>
                    </div>
                    
                    <div className="view-section">
                      <h3>Detalhes</h3>
                      <div className="view-grid">
                        <div className="view-field">
                          <label>Tempo Estimado:</label>
                          <span>{selectedTeste?.tempoEstimado || "Não informado"}</span>
                        </div>
                        <div className="view-field">
                          <label>Idade Mínima:</label>
                          <span>{selectedTeste?.idadeMinima || "Não informado"}</span>
                        </div>
                        <div className="view-field">
                          <label>Idade Máxima:</label>
                          <span>{selectedTeste?.idadeMaxima || "Não informado"}</span>
                        </div>
                      </div>
                    </div>
                    
                    {selectedTeste?.materiais && (
                      <div className="view-section">
                        <h3>Materiais Necessários</h3>
                        <p>{selectedTeste.materiais}</p>
                      </div>
                    )}
                    
                    {selectedTeste?.observacoes && (
                      <div className="view-section">
                        <h3>Observações</h3>
                        <p>{selectedTeste.observacoes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <form className="teste-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                      <div className="form-field">
                        <label>Nome do Teste</label>
                        <input
                          type="text"
                          name="nome"
                          value={form.nome}
                          onChange={handleChange}
                          placeholder="Ex: Teste de Atenção Visual"
                          required
                        />
                      </div>
                      
                      <div className="form-field">
                        <label>Categoria</label>
                        <select
                          name="categoria"
                          value={form.categoria}
                          onChange={handleChange}
                        >
                          {categorias.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-field">
                      <label>Descrição</label>
                      <textarea
                        name="descricao"
                        value={form.descricao}
                        onChange={handleChange}
                        placeholder="Descreva o objetivo e características do teste..."
                        rows="3"
                        required
                      />
                    </div>
                    
                    <div className="form-field">
                      <label>Instruções de Aplicação</label>
                      <textarea
                        name="instrucoes"
                        value={form.instrucoes}
                        onChange={handleChange}
                        placeholder="Descreva passo a passo como aplicar o teste..."
                        rows="4"
                        required
                      />
                    </div>
                    
                    <div className="form-row">
                      <div className="form-field">
                        <label>Tempo Estimado</label>
                        <input
                          type="text"
                          name="tempoEstimado"
                          value={form.tempoEstimado}
                          onChange={handleChange}
                          placeholder="Ex: 15-20 minutos"
                        />
                      </div>
                      
                      <div className="form-field">
                        <label>Idade Mínima</label>
                        <input
                          type="number"
                          name="idadeMinima"
                          value={form.idadeMinima}
                          onChange={handleChange}
                          placeholder="Ex: 5"
                        />
                      </div>
                      
                      <div className="form-field">
                        <label>Idade Máxima</label>
                        <input
                          type="number"
                          name="idadeMaxima"
                          value={form.idadeMaxima}
                          onChange={handleChange}
                          placeholder="Ex: 12"
                        />
                      </div>
                    </div>
                    
                    <div className="form-field">
                      <label>Materiais Necessários</label>
                      <textarea
                        name="materiais"
                        value={form.materiais}
                        onChange={handleChange}
                        placeholder="Liste os materiais necessários para aplicação do teste..."
                        rows="2"
                      />
                    </div>
                    
                    <div className="form-field">
                      <label>Observações</label>
                      <textarea
                        name="observacoes"
                        value={form.observacoes}
                        onChange={handleChange}
                        placeholder="Observações adicionais, contraindicações, etc..."
                        rows="2"
                      />
                    </div>
                    
                    <div className="form-field">
                      <label>Status</label>
                      <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                      >
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                        <option value="rascunho">Rascunho</option>
                      </select>
                    </div>
                    
                    <div className="form-actions">
                      <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                        Cancelar
                      </button>
                      <button type="submit" className="submit-btn">
                        {modalType === "create" ? "Criar Teste" : "Salvar Alterações"}
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

export default Testes;

