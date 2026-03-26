import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import IconRail from "../components/IconRail";
import TopBar from "../components/TopBar";
import "./AppShell.css";
import { isGuardianRole } from "../auth/roles";

const AppShellLayout = () => {
  const { currentUserData, loading, role } = useAuth();
  const navigate = useNavigate();

  const [isNavOpen, setIsNavOpen] = useState(false);

  useEffect(() => {
    if (!loading && !currentUserData) navigate("/");
  }, [loading, currentUserData, navigate]);

  useEffect(() => {
    if (loading || !currentUserData) return;
    if (isGuardianRole(role)) navigate("/guardian", { replace: true });
  }, [loading, currentUserData, role, navigate]);

  if (loading) {
    return (
      <div className="app-shell-loading" role="status" aria-live="polite">
        Carregando...
      </div>
    );
  }

  return (
    <div className="app-shell-bg">
      <div className="app-shell-frame">
        <IconRail isDrawerOpen={isNavOpen} onDrawerOpenChange={setIsNavOpen} />

        <div className="app-shell-main">
          <TopBar onOpenNav={() => setIsNavOpen(true)} />
          <div className="app-shell-content">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppShellLayout;

