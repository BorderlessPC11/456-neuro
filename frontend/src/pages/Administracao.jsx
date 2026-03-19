// src/pages/Administracao.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Dashboard.css";
import logo from "./logo.png";
import { db, auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  FaUser,
  FaClinicMedical,
  FaUserFriends,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaUserMd,
  FaSignOutAlt,
  FaTools,
} from "react-icons/fa";

const Administracao = () => {
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [nomeClinica, setNomeClinica] = useState("");
  const [role, setRole] = useState("");
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

    fetchUserData();
    fetchClinica();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
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
          <ul>
            <li>
              <Link to="/dashboard" style={{ textDecoration: "none", color: "white" }}>
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/administracao" style={{ textDecoration: "none", color: "white" }}>
                <FaTools style={{ marginRight: "6px" }} />
                Administração
              </Link>
            </li>
            <li>
              <Link to="/profissionais" style={{ textDecoration: "none", color: "white" }}>
                Profissionais
              </Link>
            </li>
          </ul>
        </nav>

        <div className="logout-box" onClick={handleLogout}>
          <FaSignOutAlt className="icon" />
          <span>Sair</span>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="main-content">
        <h1>Administração</h1>
        <div className="cards-grid">
         <Link to="/pacientes" className="card">
  <FaUserFriends className="card-icon" />
  <span>Pacientes</span>
</Link>

          <div className="card">
            <FaCalendarAlt className="card-icon" />
            <span>Agenda</span>
          </div>
          <div className="card">
            <FaMoneyBillWave className="card-icon" />
            <span>Financeiro</span>
          </div>
          <Link to="/profissionais" className="card">
            <FaUserMd className="card-icon" />
            <span>Profissionais</span>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Administracao;

