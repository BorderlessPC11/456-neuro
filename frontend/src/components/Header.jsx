import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { FaUserCircle } from "react-icons/fa";
import "./Header.css";

const Header = () => {
  const { currentUserData } = useAuth();
  const [saudacao, setSaudacao] = useState("Bem-vindo(a)");

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setSaudacao("Bom dia");
    else if (h < 18) setSaudacao("Boa tarde");
    else setSaudacao("Boa noite");
  }, []);

  const nomeUsuario = currentUserData?.nome || "Usuário";
  const fotoPerfil = currentUserData?.fotoURL || avatarDefault;

  return (
    <header className="zenda-header">
      <div className="zenda-header-left">
        <span className="zenda-header-title">
          {saudacao}, <b>{nomeUsuario}!</b>
        </span>
        <span className="zenda-header-sub">
          Seja bem-vindo(a) ao seu painel.
        </span>
      </div>
      <div className="zenda-header-user">
        {fotoPerfil ? (
  <img src={fotoPerfil} alt="Perfil" className="zenda-header-avatar" />
) : (
  <FaUserCircle className="zenda-header-avatar" />
)}
        <span className="zenda-header-username">{nomeUsuario}</span>
        {/* Aqui você pode colocar menu do usuário */}
      </div>
    </header>
  );
};

export default Header;
