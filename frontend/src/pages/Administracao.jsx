// src/pages/Administracao.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Administracao.css";
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
    <div className="administracao-page">
      <div className="administracao-header">
        <h1>Administração</h1>
        <p>Gerencie áreas gerais do sistema.</p>
      </div>

      <div className="administracao-cards-grid">
        <Link to="/pacientes" className="administracao-card">
          <FaUserFriends className="card-icon" />
          <span>Pacientes</span>
        </Link>

        <div className="administracao-card" role="button" tabIndex={0}>
          <FaCalendarAlt className="card-icon" />
          <span>Agenda</span>
        </div>

        <div className="administracao-card" role="button" tabIndex={0}>
          <FaMoneyBillWave className="card-icon" />
          <span>Financeiro</span>
        </div>

        <Link to="/profissionais" className="administracao-card">
          <FaUserMd className="card-icon" />
          <span>Profissionais</span>
        </Link>
      </div>
    </div>
  );
};

export default Administracao;

