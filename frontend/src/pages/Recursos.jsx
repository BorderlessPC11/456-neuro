import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
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
  FaBookOpen,
  FaVideo,
  FaImage,
  FaFileAudio,
  FaFilePdf,
  FaFileWord,
  FaLink,
  FaTags,
  FaStar,
  FaHeart,
} from "react-icons/fa";
import logo from "../assets/logo.png";
import "./Recursos.css";

const Recursos = () => {
  const { currentUserData, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [nomeUsuario, setNomeUsuario] = useState("");
  const [nomeClinica, setNomeClinica] = useState("");
  const [role, setRole] = useState("");
  const [openSection, setOpenSection] = useState(null);

  // Estados para recursos
  const [recursos, setRecursos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); // "create", "edit", "view"
  const [selectedRecurso, setSelectedRecurso] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [busca, setBusca] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Estados do formulário
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    tipo: "documento",
    categoria: "terapeutico",
    tags: "",
    url: "",
    arquivo: null,
    observacoes: "",
    publico: true,
  });

  const clinicaId = currentUserData?.clinicaId;

  useEffect(() => {
    if (!authLoading && currentUserData) {
      setNomeUsuario(currentUserData.nome || "");
      setRole(currentUserData.role || "");
      setNomeClinica(currentUserData.nomeClinica || "");
      
      if (currentUserData.role === "admin" || currentUserData.role === "terapeuta") {
        fetchRecursos();
      }
    }
  }, [authLoading, currentUserData, clinicaId]);

  const fetchRecursos = async () => {
    if (!clinicaId) return;
    try {
      const q = query(
        collection(db, "recursos"),
        where("clinicaId", "==", clinicaId),
        orderBy("criadoEm", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRecursos(data);
    } catch (error) {
      console.error("Erro ao buscar recursos:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      let urlArquivo = form.url;
      
      // Upload do arquivo se fornecido
      if (form.arquivo) {
        const fileName = `recursos/${Date.now()}_${form.arquivo.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, form.arquivo);
        urlArquivo = await getDownloadURL(storageRef);
      }
      
      if (modalType === "create") {
        const novoRecurso = {
          titulo: form.titulo,
          descricao: form.descricao,
          tipo: form.tipo,
          categoria: form.categoria,
          tags: form.tags.split(",").map(tag => tag.trim()).filter(tag => tag),
          url: urlArquivo,
          observacoes: form.observacoes,
          publico: form.publico,
          clinicaId: clinicaId,
          criadoEm: new Date().toISOString(),
          criadoPor: currentUserData.uid,
          nomeAutor: currentUserData.nome,
          downloads: 0,
          favoritos: 0,
          visualizacoes: 0,
        };
        await addDoc(collection(db, "recursos"), novoRecurso);
      } else if (modalType === "edit") {
        await updateDoc(doc(db, "recursos", selectedRecurso.id), {
          titulo: form.titulo,
          descricao: form.descricao,
          tipo: form.tipo,
          categoria: form.categoria,
          tags: form.tags.split(",").map(tag => tag.trim()).filter(tag => tag),
          url: urlArquivo,
          observacoes: form.observacoes,
          publico: form.publico,
          atualizadoEm: new Date().toISOString(),
          atualizadoPor: currentUserData.uid,
        });
      }
      
      resetForm();
      setIsModalOpen(false);
      fetchRecursos();
    } catch (error) {
      console.error("Erro ao salvar recurso:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setForm({
      titulo: "",
      descricao: "",
      tipo: "documento",
      categoria: "terapeutico",
      tags: "",
      url: "",
      arquivo: null,
      observacoes: "",
      publico: true,
    });
    setSelectedRecurso(null);
    setModalType("");
  };

  const handleEdit = (recurso) => {
    setForm({
      titulo: recurso.titulo || "",
      descricao: recurso.descricao || "",
      tipo: recurso.tipo || "documento",
      categoria: recurso.categoria || "terapeutico",
      tags: recurso.tags ? recurso.tags.join(", ") : "",
      url: recurso.url || "",
      arquivo: null,
      observacoes: recurso.observacoes || "",
      publico: recurso.publico !== false,
    });
    setSelectedRecurso(recurso);
    setModalType("edit");
    setIsModalOpen(true);
  };

  const handleView = (recurso) => {
    setSelectedRecurso(recurso);
    setModalType("view");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    resetForm();
    setModalType("create");
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: checked });
    } else if (type === "file") {
      setForm({ ...form, [name]: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
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

  const tiposRecurso = [
    { value: "documento", label: "Documento", icon: <FaFileAlt />, color: "#4A90E2" },
    { value: "video", label: "Vídeo", icon: <FaVideo />, color: "#E74C3C" },
    { value: "imagem", label: "Imagem", icon: <FaImage />, color: "#F39C12" },
    { value: "audio", label: "Áudio", icon: <FaFileAudio />, color: "#9B59B6" },
    { value: "link", label: "Link", icon: <FaLink />, color: "#1ABC9C" },
    { value: "pdf", label: "PDF", icon: <FaFilePdf />, color: "#E67E22" },
  ];

  const categorias = [
    { value: "terapeutico", label: "Terapêutico" },
    { value: "educativo", label: "Educativo" },
    { value: "ludico", label: "Lúdico" },
    { value: "avaliativo", label: "Avaliativo" },
    { value: "administrativo", label: "Administrativo" },
    { value: "referencia", label: "Referência" },
  ];

  const recursosFiltrados = recursos.filter(recurso => {
    const matchTipo = filtroTipo === "todos" || recurso.tipo === filtroTipo;
    const matchCategoria = filtroCategoria === "todas" || recurso.categoria === filtroCategoria;
    const matchBusca = busca === "" || 
      recurso.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      recurso.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      (recurso.tags && recurso.tags.some(tag => tag.toLowerCase().includes(busca.toLowerCase())));
    
    return matchTipo && matchCategoria && matchBusca;
  });

  const getTipoInfo = (tipo) => {
    return tiposRecurso.find(t => t.value === tipo) || tiposRecurso[0];
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
        <div className="recursos-container">
          <div className="recursos-header">
            <h1><FaFileInvoice /> Biblioteca de Recursos</h1>
            <p>Organize e compartilhe materiais terapêuticos, documentos e recursos educativos</p>
          </div>

          {/* Controles superiores */}
          <div className="controls-section">
            <div className="search-filter-bar">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar recursos..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
              
              <div className="filters">
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                >
                  <option value="todos">Todos os tipos</option>
                  {tiposRecurso.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                  ))}
                </select>
                
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                >
                  <option value="todas">Todas as categorias</option>
                  {categorias.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              className="novo-recurso-btn"
              onClick={handleCreate}
            >
              <FaPlus /> Novo Recurso
            </button>
          </div>

          {/* Lista de recursos */}
          <div className="recursos-grid">
            {recursosFiltrados.length > 0 ? (
              recursosFiltrados.map((recurso) => {
                const tipoInfo = getTipoInfo(recurso.tipo);
                return (
                  <div key={recurso.id} className="recurso-card">
                    <div className="recurso-header">
                      <div className="tipo-badge" style={{ backgroundColor: tipoInfo.color }}>
                        {tipoInfo.icon}
                        <span>{tipoInfo.label}</span>
                      </div>
                      <div className="recurso-actions">
                        <button 
                          className="action-btn view-btn"
                          onClick={() => handleView(recurso)}
                        >
                          <FaEye />
                        </button>
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => handleEdit(recurso)}
                        >
                          <FaEdit />
                        </button>
                        {recurso.url && (
                          <button 
                            className="action-btn download-btn"
                            onClick={() => window.open(recurso.url, '_blank')}
                          >
                            <FaDownload />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="recurso-content">
                      <h3>{recurso.titulo}</h3>
                      <p className="recurso-descricao">{recurso.descricao}</p>
                      
                      {recurso.tags && recurso.tags.length > 0 && (
                        <div className="tags-container">
                          {recurso.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="tag">
                              <FaTags /> {tag}
                            </span>
                          ))}
                          {recurso.tags.length > 3 && (
                            <span className="tag-more">+{recurso.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                      
                      <div className="recurso-meta">
                        <div className="meta-item">
                          <span className="meta-label">Categoria:</span>
                          <span className="meta-value">
                            {categorias.find(cat => cat.value === recurso.categoria)?.label || "Não informado"}
                          </span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Visualizações:</span>
                          <span className="meta-value">{recurso.visualizacoes || 0}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Downloads:</span>
                          <span className="meta-value">{recurso.downloads || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="recurso-footer">
                      <div className="recurso-stats">
                        <span className={`publico-badge ${recurso.publico ? "publico" : "privado"}`}>
                          {recurso.publico ? "Público" : "Privado"}
                        </span>
                        <div className="stats-icons">
                          <span className="stat-item">
                            <FaEye /> {recurso.visualizacoes || 0}
                          </span>
                          <span className="stat-item">
                            <FaDownload /> {recurso.downloads || 0}
                          </span>
                          <span className="stat-item">
                            <FaHeart /> {recurso.favoritos || 0}
                          </span>
                        </div>
                      </div>
                      <span className="autor">Por: {recurso.nomeAutor}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <FaFileInvoice className="empty-icon" />
                <h3>Nenhum recurso encontrado</h3>
                <p>Adicione seu primeiro recurso para começar a organizar sua biblioteca de materiais terapêuticos.</p>
                <button className="create-first-btn" onClick={handleCreate}>
                  <FaPlus /> Adicionar Primeiro Recurso
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
                  {modalType === "create" && <><FaPlus /> Novo Recurso</>}
                  {modalType === "edit" && <><FaEdit /> Editar Recurso</>}
                  {modalType === "view" && <><FaEye /> Visualizar Recurso</>}
                </h2>
                
                {modalType === "view" ? (
                  <div className="recurso-view">
                    <div className="view-section">
                      <h3>Informações Básicas</h3>
                      <div className="view-grid">
                        <div className="view-field">
                          <label>Título:</label>
                          <span>{selectedRecurso?.titulo}</span>
                        </div>
                        <div className="view-field">
                          <label>Tipo:</label>
                          <span>{getTipoInfo(selectedRecurso?.tipo).label}</span>
                        </div>
                        <div className="view-field">
                          <label>Categoria:</label>
                          <span>{categorias.find(cat => cat.value === selectedRecurso?.categoria)?.label}</span>
                        </div>
                        <div className="view-field">
                          <label>Visibilidade:</label>
                          <span>{selectedRecurso?.publico ? "Público" : "Privado"}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="view-section">
                      <h3>Descrição</h3>
                      <p>{selectedRecurso?.descricao}</p>
                    </div>
                    
                    {selectedRecurso?.tags && selectedRecurso.tags.length > 0 && (
                      <div className="view-section">
                        <h3>Tags</h3>
                        <div className="tags-view">
                          {selectedRecurso.tags.map((tag, index) => (
                            <span key={index} className="tag-view">
                              <FaTags /> {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedRecurso?.url && (
                      <div className="view-section">
                        <h3>Arquivo/Link</h3>
                        <a 
                          href={selectedRecurso.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="resource-link"
                        >
                          <FaDownload /> Acessar Recurso
                        </a>
                      </div>
                    )}
                    
                    {selectedRecurso?.observacoes && (
                      <div className="view-section">
                        <h3>Observações</h3>
                        <p>{selectedRecurso.observacoes}</p>
                      </div>
                    )}
                    
                    <div className="view-section">
                      <h3>Estatísticas</h3>
                      <div className="stats-view">
                        <div className="stat-card">
                          <FaEye className="stat-icon" />
                          <span className="stat-number">{selectedRecurso?.visualizacoes || 0}</span>
                          <span className="stat-label">Visualizações</span>
                        </div>
                        <div className="stat-card">
                          <FaDownload className="stat-icon" />
                          <span className="stat-number">{selectedRecurso?.downloads || 0}</span>
                          <span className="stat-label">Downloads</span>
                        </div>
                        <div className="stat-card">
                          <FaHeart className="stat-icon" />
                          <span className="stat-number">{selectedRecurso?.favoritos || 0}</span>
                          <span className="stat-label">Favoritos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form className="recurso-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                      <div className="form-field">
                        <label>Título do Recurso</label>
                        <input
                          type="text"
                          name="titulo"
                          value={form.titulo}
                          onChange={handleChange}
                          placeholder="Ex: Atividade de Coordenação Motora"
                          required
                        />
                      </div>
                      
                      <div className="form-field">
                        <label>Tipo</label>
                        <select
                          name="tipo"
                          value={form.tipo}
                          onChange={handleChange}
                        >
                          {tiposRecurso.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-row">
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
                      
                      <div className="form-field">
                        <label>Tags (separadas por vírgula)</label>
                        <input
                          type="text"
                          name="tags"
                          value={form.tags}
                          onChange={handleChange}
                          placeholder="Ex: coordenação, motor, infantil"
                        />
                      </div>
                    </div>
                    
                    <div className="form-field">
                      <label>Descrição</label>
                      <textarea
                        name="descricao"
                        value={form.descricao}
                        onChange={handleChange}
                        placeholder="Descreva o recurso e como utilizá-lo..."
                        rows="3"
                        required
                      />
                    </div>
                    
                    <div className="form-field">
                      <label>URL/Link (opcional)</label>
                      <input
                        type="url"
                        name="url"
                        value={form.url}
                        onChange={handleChange}
                        placeholder="https://exemplo.com/recurso"
                      />
                    </div>
                    
                    <div className="form-field">
                      <label>Upload de Arquivo (opcional)</label>
                      <input
                        type="file"
                        name="arquivo"
                        onChange={handleChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mp3,.zip"
                      />
                      <small>Formatos aceitos: PDF, DOC, DOCX, JPG, PNG, MP4, MP3, ZIP</small>
                    </div>
                    
                    <div className="form-field">
                      <label>Observações</label>
                      <textarea
                        name="observacoes"
                        value={form.observacoes}
                        onChange={handleChange}
                        placeholder="Observações adicionais sobre o uso do recurso..."
                        rows="2"
                      />
                    </div>
                    
                    <div className="form-field">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="publico"
                          checked={form.publico}
                          onChange={handleChange}
                        />
                        <span>Tornar público para outros profissionais da clínica</span>
                      </label>
                    </div>
                    
                    <div className="form-actions">
                      <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                        Cancelar
                      </button>
                      <button type="submit" className="submit-btn" disabled={isUploading}>
                        {isUploading ? (
                          <>
                            <div className="spinner"></div> Salvando...
                          </>
                        ) : (
                          modalType === "create" ? "Criar Recurso" : "Salvar Alterações"
                        )}
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

export default Recursos;

