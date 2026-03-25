import React, { useEffect, useMemo, useState } from "react";
import "./Dashboard.css";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaUsers, FaCalendarAlt, FaFileAlt, FaBell, FaUserPlus } from "react-icons/fa";

/**
 * Util: formata a data atual em pt-BR (ex: "sexta-feira, 16 de maio de 2025")
 */
function useHojeFormatado() {
  const [texto, setTexto] = useState("");
  useEffect(() => {
    const agora = new Date();
    const diaSemana = agora.toLocaleDateString("pt-BR", { weekday: "long" });
    const dia = agora.toLocaleDateString("pt-BR", { day: "2-digit" });
    const mes = agora.toLocaleDateString("pt-BR", { month: "long" });
    const ano = agora.getFullYear();
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    setTexto(`${cap(diaSemana)}, ${dia} de ${cap(mes)} de ${ano}`);
  }, []);
  return texto;
}

const Dashboard = () => {
  const { user, currentUserData, loading: authLoading } = useAuth();
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [agendamentosHoje, setAgendamentosHoje] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);
  const [totalPacientes, setTotalPacientes] = useState(0);
  const [totalTerapiasSemana, setTotalTerapiasSemana] = useState(0);
  const [pacientesMap, setPacientesMap] = useState({});
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const dataCabecalho = useHojeFormatado();

  const uid = useMemo(() => user?.uid || "", [user?.uid]);
  const clinicaId = useMemo(() => currentUserData?.clinicaId || "", [currentUserData?.clinicaId]);
  const nomeLocal = useMemo(() => currentUserData?.nome || "", [currentUserData?.nome]);

  const normalizeAppointment = (raw, id) => ({
    id,
    patientId: raw.patientId || raw.pacienteId || "",
    time: raw.time || raw.hora || "--:--",
    therapyName: raw.therapyName || raw.tipo || "Terapia"
  });

  useEffect(() => {
    if (authLoading) return;
    if (nomeLocal) setNomeUsuario(nomeLocal);

    const carregarTudo = async () => {
      try {
        if (!clinicaId) {
          // Sem clínica definida ainda: exibe contadores zerados e sai
          setAgendamentosHoje([]);
          setTotalPacientes(0);
          setTotalTerapiasSemana(0);
          setNotificacoes([]);
          setLoading(false);
          return;
        }

        // 1) Usuário
        if (uid) {
          const userRef = doc(db, "usuarios", uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (!nomeLocal && data?.nome) setNomeUsuario(data.nome);
          }
        }

        // 2) Pacientes (contagem + mapa id->nome)
        const pacientesQuery = query(
          collection(db, "pacientes"),
          where("clinicaId", "==", clinicaId)
        );
        const pacientesSnap = await getDocs(pacientesQuery);
        setTotalPacientes(pacientesSnap.size);

        const map = {};
        pacientesSnap.docs.forEach((d) => {
          const pdata = d.data();
          map[d.id] = pdata?.nome || pdata?.nomeCompleto || "Paciente";
        });
        setPacientesMap(map);

        // 3) Agendamentos de HOJE
        const hojeISO = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
        const agQuery = query(
          collection(db, "agendamentos"),
          where("clinicaId", "==", clinicaId),
          where("data", "==", hojeISO)
        );
        const agSnap = await getDocs(agQuery);
        const agData = agSnap.docs.map((d) => normalizeAppointment(d.data(), d.id));
        setAgendamentosHoje(agData);

        // 4) Terapias (semana) - se tiver campo data, dá para filtrar pela semana corrente.
        const teQuery = query(
          collection(db, "terapias"),
          where("clinicaId", "==", clinicaId)
        );
        const teSnap = await getDocs(teQuery);
        setTotalTerapiasSemana(teSnap.size);

        // 5) Notificações (mantém mock como antes)
        setNotificacoes([
          { id: 1, mensagem: "Novo paciente cadastrado: João Silva", data: "Hoje, 08:30" },
          { id: 2, mensagem: "Agendamento cancelado: Maria Oliveira", data: "Ontem, 14:00" },
        ]);
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    carregarTudo();
  }, [uid, clinicaId, nomeLocal, authLoading]);

  const handleQuickAction = (path) => {
    navigate(path);
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Bem-vindo(a), {nomeUsuario || "!"}</h1>
        <p>{dataCabecalho}</p>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <FaUsers className="card-icon" aria-hidden="true" />
          <h3>{loading ? "—" : totalPacientes}</h3>
          <p>Total de Pacientes</p>
        </div>
        <div className="summary-card">
          <FaCalendarAlt className="card-icon" aria-hidden="true" />
          <h3>{loading ? "—" : agendamentosHoje.length}</h3>
          <p>Agendamentos Hoje</p>
        </div>
        <div className="summary-card">
          <FaFileAlt className="card-icon" aria-hidden="true" />
          <h3>{loading ? "—" : totalTerapiasSemana}</h3>
          <p>Terapias na Semana</p>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section agendamentos-section">
          <h2>Agendamentos de Hoje</h2>
          {loading ? (
            <p>Carregando...</p>
          ) : agendamentosHoje.length > 0 ? (
            <ul className="agendamentos-list">
              {agendamentosHoje.map((agendamento) => {
                const nomePac =
                  pacientesMap[agendamento.patientId] ||
                  agendamento.pacienteNome ||
                  "Paciente";
                const hora = agendamento.time || "--:--";
                const tipo = agendamento.therapyName || "Terapia";
                return (
                  <li key={agendamento.id} className="agendamento-item">
                    <span>{hora}</span> — {nomePac} ({tipo})
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>Nenhum agendamento para hoje.</p>
          )}
          <button className="ver-todos-btn" type="button" onClick={() => navigate("/agenda-geral")}>
            Ver Todos os Agendamentos
          </button>
        </div>

        <div className="section notificacoes-section">
          <h2>Notificações Recentes</h2>
          {loading ? (
            <p>Carregando...</p>
          ) : notificacoes.length > 0 ? (
            <ul className="notificacoes-list">
              {notificacoes.map((notificacao) => (
                <li key={notificacao.id} className="notificacao-item">
                  <FaBell className="notificacao-icon" aria-hidden="true" />
                  <div>
                    <p>{notificacao.mensagem}</p>
                    <span className="notificacao-data">{notificacao.data}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhuma notificação recente.</p>
          )}
        </div>
      </div>

      <div className="quick-actions">
        <h2>Ações Rápidas</h2>
        <div className="actions-grid">
          <div className="action-card" role="button" tabIndex={0} onClick={() => handleQuickAction("/pacientes")}>
            <FaUserPlus className="action-icon" aria-hidden="true" />
            <span>Adicionar Paciente</span>
          </div>

          <div className="action-card" role="button" tabIndex={0} onClick={() => handleQuickAction("/adicionar-agendamento")}>
            <FaCalendarAlt className="action-icon" aria-hidden="true" />
            <span>Criar Agendamento</span>
          </div>

          <div className="action-card" role="button" tabIndex={0} onClick={() => handleQuickAction("/evolucao")}>
            <FaFileAlt className="action-icon" aria-hidden="true" />
            <span>+ Evolução Diária</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

