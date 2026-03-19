import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
} from "react-icons/fa";
import logo from "../assets/logo.png";
import "./Sidebar.css";

const Sidebar = () => {
  const [openSection, setOpenSection] = useState(null);
  const navigate = useNavigate();

  // Usar localStorage como estava funcionando antes
  const nomeUsuario = localStorage.getItem("nomeUsuario") || "";
  const nomeClinica = localStorage.getItem("nomeClinica") || "";
  const role = localStorage.getItem("role") || "";

  const handleLogout = async () => {
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
      ],
    },
    {
      title: "Agenda",
      icon: <FaCalendarAlt />,
      items: [
        { label: "Agenda Geral", path: "/agenda-geral", icon: <FaCalendarCheck /> },
        ...(role === "profissional"
          ? [{ label: "Minha Agenda", path: "/agenda-profissional", icon: <FaUserClock /> }]
          : []),
        { label: "Adicionar Agendamento", path: "/adicionar-agendamento", icon: <FaPlusCircle /> },
      ],
    },
    {
      title: "Comunicação",
      icon: <FaComments />,
      items: [
        { label: "Notificações", path: "/notificacoes", icon: <FaEnvelope /> },
        { label: "Comunicação", path: "/comunicacao", icon: <FaComments /> },
      ],
    },
    {
      title: "Relatórios",
      icon: <FaChartBar />,
      items: [
        { label: "Gerar Relatório", path: "/gerar-relatorio", icon: <FaChartBar /> },
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

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <img src={logo} alt="Logo Neuroverse" className="logo" />
      </div>
      <div className="user-clinica-box">
        <div className="info-titulo">BEM-VINDO(A)</div>
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
  );
};

export default Sidebar;
