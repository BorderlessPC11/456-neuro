import React, { useMemo, useState } from "react";
import { FaSearch, FaBell, FaUserCircle, FaBars } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import "./TopBar.css";

const getInitials = (name) => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  const first = parts[0]?.[0] || "U";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (first + last).toUpperCase();
};

const TopBar = ({ onOpenNav }) => {
  const { currentUserData } = useAuth();
  const [search, setSearch] = useState("");

  const initials = useMemo(() => getInitials(currentUserData?.nome || ""), [currentUserData?.nome]);

  return (
    <header className="topbar" aria-label="Top bar">
      <div className="topbar-left">
        <button className="topbar-hamburger" type="button" onClick={onOpenNav} aria-label="Open navigation">
          <FaBars />
        </button>
        <div className="topbar-greeting">
          <div className="topbar-greeting-title">Bem-vindo(a)</div>
          <div className="topbar-greeting-sub">{currentUserData?.nome || "Usuário"}</div>
        </div>
      </div>

      <div className="topbar-center">
        <div className="topbar-search">
          <FaSearch className="topbar-search-icon" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            aria-label="Search"
          />
        </div>
      </div>

      <div className="topbar-right">
        <button className="icon-btn" type="button" aria-label="Notifications">
          <FaBell aria-hidden="true" />
        </button>
        <button className="avatar-btn" type="button" aria-label="Profile">
          {/** Fallback avatar initials to stay generic */}
          <span className="avatar-initials">{initials}</span>
        </button>
        {/** Keeps layout similar to reference where an image avatar sits in the corner */}
        <FaUserCircle style={{ display: "none" }} />
      </div>
    </header>
  );
};

export default TopBar;

