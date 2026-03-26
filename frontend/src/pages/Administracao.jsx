import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Administracao.css";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  FaUserFriends,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaUserMd,
  FaTools,
  FaUsersCog,
  FaUserShield,
  FaDatabase,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { canManageUsers, isAdminLike } from "../auth/roles";

const Administracao = () => {
  const [nomeClinica, setNomeClinica] = useState("");
  const { currentUserData, role } = useAuth();

  useEffect(() => {
    const fetchClinica = async () => {
      const clinicaId = currentUserData?.clinicaId;
      if (clinicaId) {
        const clinicaRef = doc(db, "clinicas", clinicaId);
        const clinicaSnap = await getDoc(clinicaRef);
        if (clinicaSnap.exists()) {
          const clinicaData = clinicaSnap.data();
          setNomeClinica(clinicaData.nome || clinicaId);
        }
      }
    };

    fetchClinica();
  }, [currentUserData?.clinicaId]);

  if (!canManageUsers(role)) {
    return (
      <div className="administracao-page">
        <div className="administracao-header">
          <h1>Administração</h1>
          <p>Apenas gerentes e administradores podem acessar esta área.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="administracao-page">
      <div className="administracao-header">
        <h1>Área de gestão</h1>
        <p>Gerencie pessoas, permissões e configurações da clínica {nomeClinica ? `(${nomeClinica})` : ""}.</p>
      </div>

      <div className="administracao-cards-grid">
        <Link to="/usuarios" className="administracao-card">
          <FaUsersCog className="card-icon" />
          <span>Usuários e convites</span>
        </Link>

        <Link to="/profissionais" className="administracao-card">
          <FaUserMd className="card-icon" />
          <span>Terapeutas</span>
        </Link>

        <Link to="/pacientes" className="administracao-card">
          <FaUserFriends className="card-icon" />
          <span>Pacientes</span>
        </Link>

        <Link to="/agenda-geral" className="administracao-card">
          <FaCalendarAlt className="card-icon" />
          <span>Agenda</span>
        </Link>

        {isAdminLike(role) && (
          <Link to="/despesas" className="administracao-card">
            <FaMoneyBillWave className="card-icon" />
            <span>Financeiro</span>
          </Link>
        )}

        <div className="administracao-card" role="note" tabIndex={0}>
          <FaUserShield className="card-icon" />
          <span>Controle de papéis por função</span>
        </div>

        <div className="administracao-card" role="note" tabIndex={0}>
          <FaTools className="card-icon" />
          <span>Configurações gerais</span>
        </div>

        {isAdminLike(role) && (
          <Link to="/migration-tools" className="administracao-card">
            <FaDatabase className="card-icon" />
            <span>Migration Tools</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Administracao;

