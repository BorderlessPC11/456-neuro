import React, { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaCalendarAlt,
  FaComments,
  FaChartBar,
  FaCog,
  FaFileAlt,
  FaFolderOpen,
  FaCalendarCheck,
  FaPlusCircle,
  FaBell,
  FaEnvelope,
  FaListAlt,
  FaSignOutAlt,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import logo from "../assets/logo.png";
import "./IconRail.css";

const IconRail = ({ isDrawerOpen, onDrawerOpenChange }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { currentUserData } = useAuth();
  const role = currentUserData?.role || "";

  const [nomeClinica, setNomeClinica] = React.useState("");
  useEffect(() => {
    const cargar = async () => {
      try {
        const clinicaId = currentUserData?.clinicaId;
        if (!clinicaId) return;
        const clinicaRef = doc(db, "clinicas", clinicaId);
        const clinicaSnap = await getDoc(clinicaRef);
        if (clinicaSnap.exists()) setNomeClinica(clinicaSnap.data().nome || "");
      } catch {
        setNomeClinica("");
      }
    };
    cargar();
  }, [currentUserData?.clinicaId]);

  const items = useMemo(() => {
    const base = [
      { label: "Dashboard", path: "/dashboard", icon: <FaHome /> },
      {
        label: "Pacientes",
        path: "/pacientes",
        icon: <FaUsers />,
      },
      {
        label: "Evolução Diária",
        path: "/evolucao",
        icon: <FaFileAlt />,
      },
      {
        label: "Anamnese",
        path: "/anamnese",
        icon: <FaFileAlt />,
      },
      {
        label: "Documentos",
        path: "/documentos-paciente",
        icon: <FaFolderOpen />,
      },
      {
        label: "Relatórios",
        path: "/gerar-relatorio-paciente",
        icon: <FaChartBar />,
      },
      { label: "PDI", path: "/planejamento", icon: <FaCalendarAlt /> },
      { label: "Terapias", path: "/terapias", icon: <FaFileAlt /> },
      { label: "Testes", path: "/testes", icon: <FaListAlt /> },
      { label: "Agenda Geral", path: "/agenda-geral", icon: <FaCalendarCheck /> },
      {
        label: "Adicionar Agendamento",
        path: "/adicionar-agendamento",
        icon: <FaPlusCircle />,
      },
      { label: "Notificações", path: "/notificacoes", icon: <FaBell /> },
      { label: "Comunicação", path: "/comunicacao", icon: <FaEnvelope /> },
      { label: "Gerar Relatório", path: "/gerar-relatorio", icon: <FaChartBar /> },
    ];

    const adminItems =
      role === "admin" || role === "admin_master" || role === "master"
        ? [
            { label: "Profissionais", path: "/profissionais", icon: <FaUsers /> },
            { label: "Usuários", path: "/usuarios", icon: <FaUsers /> },
            { label: "Compras a Fazer", path: "/compras", icon: <FaFileAlt /> },
            { label: "Despesas", path: "/despesas", icon: <FaFileAlt /> },
            { label: "Tarefas", path: "/tarefas", icon: <FaFileAlt /> },
            { label: "Administração", path: "/administracao", icon: <FaCog /> },
          ]
        : [];

    return [...base, ...adminItems];
  }, [role]);

  const activePath = location.pathname;

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } finally {
      localStorage.clear();
      navigate("/");
    }
  };

  // Minimal focus trap for the drawer for accessibility.
  const closeBtnRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!isDrawerOpen) return;

    previouslyFocused.current = document.activeElement;
    const t = setTimeout(() => closeBtnRef.current?.focus(), 0);
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") onDrawerOpenChange(false);
      if (e.key !== "Tab") return;

      const focusables = Array.from(
        document.querySelectorAll(
          ".nav-drawer a, .nav-drawer button, .nav-drawer input, .nav-drawer [tabindex]:not([tabindex='-1'])"
        )
      ).filter((el) => !el.hasAttribute("disabled"));

      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus?.();
    };
  }, [isDrawerOpen, onDrawerOpenChange]);

  return (
    <>
      <aside className="icon-rail" aria-label="Navigation">
        <div className="icon-rail-logo">
          <img src={logo} alt="Neuroverse logo" />
        </div>

        <nav className="icon-rail-nav">
          {items.map((item) => {
            const isActive = activePath === item.path;
            return (
              <button
                key={item.path}
                type="button"
                className={`icon-rail-item ${isActive ? "active" : ""}`}
                onClick={() => navigate(item.path)}
                aria-label={item.label}
                title={item.label}
              >
                <span className="icon-rail-item-icon">{item.icon}</span>
                <span className="icon-rail-item-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button className="icon-rail-logout" type="button" onClick={handleLogout} aria-label="Sair" title="Sair">
          <FaSignOutAlt />
          <span className="icon-rail-item-label">Sair</span>
        </button>
      </aside>

      {isDrawerOpen && (
        <div
          className="nav-drawer-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onDrawerOpenChange(false);
          }}
        >
          <div className="nav-drawer">
            <div className="nav-drawer-header">
              <div className="nav-drawer-brand">
                <img src={logo} alt="Neuroverse logo" />
              </div>
              <button
                ref={closeBtnRef}
                className="nav-drawer-close"
                type="button"
                onClick={() => onDrawerOpenChange(false)}
                aria-label="Close navigation"
              >
                Fechar
              </button>
            </div>

            <div className="nav-drawer-sub">
              <div className="nav-drawer-title">Bem-vindo(a)</div>
              <div className="nav-drawer-meta">{currentUserData?.nome || "Usuário"}</div>
              <div className="nav-drawer-meta nav-drawer-meta-muted">{nomeClinica || "Clínica"}</div>
            </div>

            <nav className="nav-drawer-nav" aria-label="Navigation items">
              {items.map((item) => {
                const isActive = activePath === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    className={`nav-drawer-item ${isActive ? "active" : ""}`}
                    onClick={() => {
                      navigate(item.path);
                      onDrawerOpenChange(false);
                    }}
                  >
                    <span className="nav-drawer-item-icon">{item.icon}</span>
                    <span className="nav-drawer-item-label">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="nav-drawer-footer">
              <button className="nav-drawer-logout" type="button" onClick={handleLogout}>
                <FaSignOutAlt />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IconRail;

