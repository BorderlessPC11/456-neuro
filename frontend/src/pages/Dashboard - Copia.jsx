import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import logo from "../assets/logo.png";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import {
  FaUser,
  FaClinicMedical,
  FaSignOutAlt,
  FaChevronDown,
  FaChevronUp,
  FaHome,
  FaUsers,
  FaBriefcase,
  FaCalendarAlt,
  FaFileAlt,
  FaComments,
  FaChartBar,
  FaCog,
  FaBell,
  FaUserPlus,
  FaListAlt,
  FaFileMedical,
  FaFolderOpen,
  FaCalendarCheck,
  FaUserClock,
  FaPlusCircle,
  FaEnvelope,
  FaFileInvoice,
  FaTools,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";

const Dashboard = () => {
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [nomeClinica, setNomeClinica] = useState("");
  const [role, setRole] = useState("");
  const [openSection, setOpenSection] = useState(null);
  const [agendamentosHoje, setAgendamentosHoje] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);
  const [totalPacientes, setTotalPacientes] = useState(0);
  const [totalTerapiasSemana, setTotalTerapiasSemana] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const nome = localStorage.getItem("nomeUsuario");
    const clinicaId = localStorage.getItem("clinicaId");
    const uid = localStorage.getItem("uid");

    if (nome) setNomeUsuario(nome);

    const fetchUserData = async () => {
      if (uid) {
        const userRef = doc(db, "usuarios", uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setRole(data.role || "");
        }
      }
    };

    const fetchClinica = async () => {
      if (clinicaId) {
        const clinicaRef = doc(db, "clinicas", clinicaId);
        const clinicaSnap = await getDoc(clinicaRef);
        if (clinicaSnap.exists()) {
          const clinicaData = clinicaSnap.data();
          setNomeClinica(clinicaData.nome || clinicaId);
        }
      }
    };

    const fetchDadosDashboard = async () => {
      const pacientesQuery = query(collection(db, "pacientes"), where("clinicaId", "==", clinicaId));
      const pacientesSnap = await getDocs(pacientesQuery);
      setTotalPacientes(pacientesSnap.size);

      const hoje = new Date().toISOString().split("T")[0];
      const agendamentosQuery = query(collection(db, "agendamentos"), where("clinicaId", "==", clinicaId), where("data", "==", hoje));
      const agendamentosSnap = await getDocs(agendamentosQuery);
      const agendamentosData = agendamentosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAgendamentosHoje(agendamentosData);

      const terapiasQuery = query(collection(db, "terapias"), where("clinicaId", "==", clinicaId));
      const terapiasSnap = await getDocs(terapiasQuery);
      setTotalTerapiasSemana(terapiasSnap.size);

      setNotificacoes([
        { id: 1, mensagem: "Novo paciente cadastrado: João Silva", data: "Hoje, 08:30" },
        { id: 2, mensagem: "Agendamento cancelado: Maria Oliveira", data: "Ontem, 14:00" },
      ]);
    };

    fetchUserData();
    fetchClinica();
    fetchDadosDashboard();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.clear();
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
        { label: "Notificações", path: "/notificacoes", icon: <FaBell /> },
        { label: "Comunicação", path: "/comunicacao", icon: <FaEnvelope /> },
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

  const handleQuickAction = (path) => {
    navigate(path);
  };

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
        <div className="dashboard-header">
          <h1>Bem-vindo(a), {nomeUsuario}!</h1>
          <p>Sexta-feira, 16 de maio de 2025</p>
        </div>

        <div className="summary-cards">
          <div className="summary-card">
            <FaUsers className="card-icon" />
            <h3>{totalPacientes}</h3>
            <p>Total de Pacientes</p>
          </div>
          <div className="summary-card">
            <FaCalendarAlt className="card-icon" />
            <h3>{agendamentosHoje.length}</h3>
            <p>Agendamentos Hoje</p>
          </div>
          <div className="summary-card">
            <FaFileAlt className="card-icon" />
            <h3>{totalTerapiasSemana}</h3>
            <p>Terapias na Semana</p>
          </div>
        </div>

        <div className="dashboard-sections">
          <div className="section agendamentos-section">
            <h2>Agendamentos de Hoje</h2>
            {agendamentosHoje.length > 0 ? (
              <ul className="agendamentos-list">
                {agendamentosHoje.map((agendamento) => (
                  <li key={agendamento.id} className="agendamento-item">
                    <span>{agendamento.hora}</span> - {agendamento.pacienteId} ({agendamento.tipo})
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhum agendamento para hoje.</p>
            )}
            <button className="ver-todos-btn" onClick={() => navigate("/agenda-geral")}>
              Ver Todos os Agendamentos
            </button>
          </div>

          <div className="section notificacoes-section">
            <h2>Notificações Recentes</h2>
            {notificacoes.length > 0 ? (
              <ul className="notificacoes-list">
                {notificacoes.map((notificacao) => (
                  <li key={notificacao.id} className="notificacao-item">
                    <FaBell className="notificacao-icon" />
                    <div>
                      <p>{notificacao.mensagem}</p>
                      <span className="notificacao-data">{notificacao.data}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhuma notificação recente.</p>
            )}
          </div>
        </div>

        <div className="quick-actions">
          <h2>Ações Rápidas</h2>
          <div className="actions-grid">
            <div className="action-card" onClick={() => handleQuickAction("/pacientes/adicionar")}>
              <FaUserPlus className="action-icon" />
              <span>Adicionar Paciente</span>
            </div>
            <div className="action-card" onClick={() => handleQuickAction("/adicionar-agendamento")}>
              <FaCalendarAlt className="action-icon" />
              <span>Criar Agendamento</span>
            </div>
            <div className="action-card" onClick={() => handleQuickAction("/terapias")}>
              <FaFileAlt className="action-icon" />
              <span>Registrar Terapia</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;


