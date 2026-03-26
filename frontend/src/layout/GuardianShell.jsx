import React, { useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaHome, FaChartLine, FaCalendarAlt, FaComments, FaSignOutAlt } from "react-icons/fa";
import { auth } from "../firebase";
import "./GuardianShell.css";

const isGuardianRole = (r) => r === "guardian" || r === "responsavel";

export default function GuardianShell() {
  const { currentUserData, loading } = useAuth();
  const navigate = useNavigate();
  const role = currentUserData?.role || "";

  useEffect(() => {
    if (loading) return;
    if (!currentUserData) navigate("/");
    else if (!isGuardianRole(role)) navigate("/dashboard", { replace: true });
  }, [loading, currentUserData, role, navigate]);

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.clear();
    navigate("/");
  };

  if (loading || !currentUserData || !isGuardianRole(role)) {
    return (
      <div className="guardian-shell-loading" role="status">
        Carregando…
      </div>
    );
  }

  return (
    <div className="guardian-shell">
      <aside className="guardian-shell-nav">
        <div className="guardian-shell-brand">Área da família</div>
        <nav>
          <NavLink to="/guardian" end className="guardian-shell-link">
            <FaHome /> Início
          </NavLink>
          <NavLink to="/guardian/progress" className="guardian-shell-link">
            <FaChartLine /> Progresso
          </NavLink>
          <NavLink to="/guardian/appointments" className="guardian-shell-link">
            <FaCalendarAlt /> Consultas
          </NavLink>
          <NavLink to="/guardian/messages" className="guardian-shell-link">
            <FaComments /> Mensagens
          </NavLink>
        </nav>
        <button type="button" className="guardian-shell-logout" onClick={handleLogout}>
          <FaSignOutAlt /> Sair
        </button>
      </aside>
      <main className="guardian-shell-main">
        <Outlet />
      </main>
    </div>
  );
}
