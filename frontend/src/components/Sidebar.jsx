import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
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
  FaPlusCircle,
  FaEnvelope,
  FaFileInvoice,
  FaBell,
} from "react-icons/fa";
import logo from "../assets/logo.png"; // 🟢 LOGO vem daqui
import "./Sidebar.css";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";

const Sidebar = () => {
  const [openSection, setOpenSection] = useState(null);
  const [nomeClinica, setNomeClinica] = useState("");
  const navigate = useNavigate();

  const { currentUserData } = useAuth();

  const nomeUsuario = currentUserData?.nome || "";
  const clinicaId = currentUserData?.clinicaId || "";
  const role = currentUserData?.role || "";

  // Busca o nome da clínica no Firestore (apenas 1 vez ao logar)
  useEffect(() => {
    const buscarNomeClinica = async () => {
      if (clinicaId) {
        try {
          const clinicaRef = doc(db, "clinicas", clinicaId);
          const clinicaSnap = await getDoc(clinicaRef);
          if (clinicaSnap.exists()) {
            setNomeClinica(clinicaSnap.data().nome || "");
          } else {
            setNomeClinica("");
          }
        } catch {
          setNomeClinica("");
        }
      }
    };
    buscarNomeClinica();
  }, [clinicaId]);

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.clear();
    navigate("/");
  };

  const toggleSection = (index) => {
    setOpenSection(openSection === index ? null : index);
  };

  const dashboardItem = {
    title: "Dashboard",
    icon: <FaHome />,
    path: "/dashboard",
  };

  const menuSections = [
    {
      title: "Pacientes",
      icon: <FaUsers />,
      items: [
        { label: "Lista de Pacientes", path: "/pacientes", icon: <FaListAlt /> },
        { label: "Evolução Diária", path: "/evolucao", icon: <FaFileMedical /> },
        { label: "Anamnese", path: "/anamnese", icon: <FaFileAlt /> },
        { label: "Documentos", path: "/documentos-paciente", icon: <FaFolderOpen /> },
        { label: "Relatórios de Paciente", path: "/gerar-relatorio-paciente", icon: <FaFileInvoice /> },
        { label: "PDI", path: "/planejamento", icon: <FaCalendarAlt /> }, // 🔹 MIGRADO E RENOMEADO
      ],
    },
    {
      title: "Terapias",
      icon: <FaFileAlt />,
      items: [
        { label: "Registro de Terapias", path: "/terapias", icon: <FaFileAlt /> },
        { label: "Testes", path: "/testes", icon: <FaFileMedical /> },
      ],
    },
    {
      title: "Agenda",
      icon: <FaCalendarAlt />,
      items: [
        { label: "Agenda Geral", path: "/agenda-geral", icon: <FaCalendarCheck /> },
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
      ],
    },
    ...(role === "admin" || role === "admin_master" || role === "master"
      ? [
          {
            title: "Administração",
            icon: <FaCog />,
            items: [
              { label: "Profissionais", path: "/profissionais", icon: <FaUsers /> },
              { label: "Usuários", path: "/usuarios", icon: <FaUsers /> },
              { label: "Compras a Fazer", path: "/compras", icon: <FaFileInvoice /> },
              { label: "Despesas", path: "/despesas", icon: <FaFileInvoice /> },
              { label: "Tarefas", path: "/tarefas", icon: <FaFileInvoice /> },
            ],
          },
        ]
      : []),
  ];

  return (
    <aside className="sidebar">
      {/* 🔹 LOGO direto, sem box */}
      <img
        src={logo}
        alt="Logo Neuroverse"
        className="logo"
        style={{
          display: "block",
          margin: "-20px auto 0px auto",
          width: "250px", // ajuste aqui o tamanho
          height: "auto",
        }}
      />

<div className="user-clinica-box" style={{
  backgroundColor: "#FFFFFF",
  padding: "10px 12px",
  borderRadius: "5px",
  width: "90%",
  margin: "-10px auto 20px auto",
  boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
  textAlign: "left",
  display: "flex",
  flexDirection: "column",
  gap: "4px"
}}>
  <div style={{
    fontSize: "14px",
    fontWeight: "600",
    letterSpacing: "1px",
    color: "#4A90E2",
    textTransform: "uppercase",
    marginBottom: "4px"
  }}>
    Bem-vindo(a)
  </div>

  <div style={{
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "16px",
    color: "#333",
    fontWeight: "500"
  }}>
    <FaUser style={{ color: "#FF6F61", fontSize: "13px" }} />
    <span>{nomeUsuario || "Usuário"}</span>
  </div>

  <div style={{
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "16px",
    color: "#666",
  }}>
    <FaClinicMedical style={{ color: "#4A90E2", fontSize: "13px" }} />
    <span>{nomeClinica || "Clínica"}</span>
  </div>
</div>



      <nav className="menu">
        {/* DASHBOARD */}
        <div className="menu-section">
          <div
            className="dashboard-direct-button"
            onClick={() => navigate(dashboardItem.path)}
          >
            <span className="section-title">
              {dashboardItem.icon}
              {dashboardItem.title}
            </span>
          </div>
        </div>

        {/* DEMAIS ITENS */}
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
