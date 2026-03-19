
// src/pages/AgendaGeral.jsx
import React, { useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import "./AgendaGeral.css";
import { useNavigate } from "react-router-dom";

import {
  FaClock,
  FaCalendar,
  FaUsers,
  FaUser,
  FaFileAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEdit,
  FaTrash,
  FaCalendarAlt,
  FaCalendarCheck,
  FaUserEdit,
  FaCalendarTimes,
  FaPlusCircle,
  FaFilter,
  FaSearch,
  FaTimes,
  FaSpinner,
  FaInfoCircle
} from "react-icons/fa";

// MODAIS ------------------------
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type = "danger", children }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
        <div className={`modal-icon ${type}`}>{type === "danger" ? <FaExclamationTriangle /> : <FaCheckCircle />}</div>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        {children}
        <div className="modal-actions">
          <button className="modal-btn cancel-btn" onClick={onClose}>Cancelar</button>
          <button className={`modal-btn confirm-btn ${type}`} onClick={onConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  );
};

const EditModal = ({ isOpen, onClose, agendamento, profissionais, onSave, isReschedule = false }) => {
  const [editData, setEditData] = useState({
    date: "",
    time: "",
    profissionalId: "",
    notes: "",
    reason: ""
  });

  useEffect(() => {
    if (agendamento) {
      setEditData({
        date: agendamento.date || "",
        time: agendamento.time || "",
        profissionalId: agendamento.professionalId || "",
        notes: agendamento.notes || "",
        reason: ""
      });
    }
  }, [agendamento]);

  const handleSave = () => onSave(editData);

  if (!isOpen || !agendamento) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isReschedule ? "Reagendar Atendimento" : "Editar Agendamento"}</h3>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Data:</label>
            <input type="date" value={editData.date} onChange={e => setEditData({ ...editData, date: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Hora:</label>
            <input type="time" value={editData.time} onChange={e => setEditData({ ...editData, time: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Profissional:</label>
            <select value={editData.profissionalId} onChange={e => setEditData({ ...editData, profissionalId: e.target.value })}>
              <option value="">Selecione</option>
              {Object.entries(profissionais).map(([id, profissional]) => (
                <option key={id} value={id}>{profissional.nome}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Observações:</label>
            <textarea value={editData.notes} onChange={e => setEditData({ ...editData, notes: e.target.value })} rows="2" />
          </div>
          {isReschedule && (
            <div className="form-group">
              <label>Motivo do reagendamento (opcional):</label>
              <textarea value={editData.reason} onChange={e => setEditData({ ...editData, reason: e.target.value })} rows="2" />
            </div>
          )}
          {!isReschedule && (
            <div className="form-group status-helper">
              <small>Esta ação mantém o status atual. Para alterar status, use os botões na tabela.</small>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="modal-btn cancel-btn" onClick={onClose}>Cancelar</button>
          <button className="modal-btn confirm-btn success" onClick={handleSave}>Salvar</button>
        </div>
      </div>
    </div>
  );
};

const DeleteOptionsModal = ({ isOpen, onClose, agendamento, onDeleteSingle, onDeleteSeries, onDeleteAllForTherapy }) => {
  if (!isOpen || !agendamento) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content options-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Opções de Exclusão</h3>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="modal-body">
          <p>Escolha como excluir:</p>
          <div className="option-buttons">
            <button className="option-btn single" onClick={onDeleteSingle}>
              <FaCalendarTimes /> <strong>Apenas este</strong>
            </button>
            {agendamento.grupoRecorrenciaId && (
              <button className="option-btn series" onClick={onDeleteSeries}>
                <FaCalendarAlt /> <strong>Toda série</strong>
              </button>
            )}
            <button className="option-btn therapy" onClick={onDeleteAllForTherapy}>
              <FaUserEdit /> <strong>Todos desta terapia</strong>
            </button>
          </div>
        </div>
        <div className="modal-actions">
          <button className="modal-btn cancel-btn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};
// ==========================

const AgendaGeral = () => {
  const { user, currentUserData, loading: authLoading } = useAuth();
  const [agendamentos, setAgendamentos] = useState([]);
  const [agendamentosFiltrados, setAgendamentosFiltrados] = useState([]);
  const [pacientes, setPacientes] = useState({});
  const [profissionais, setProfissionais] = useState({});
  const [terapias, setTerapias] = useState({});
  const [loadingAgendamentos, setLoadingAgendamentos] = useState(true);
  const [errorAgendamentos, setErrorAgendamentos] = useState(null);
  const [invalidAppointmentsCount, setInvalidAppointmentsCount] = useState(0);
  const [reasonInput, setReasonInput] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Filtros e modais
  const [filtros, setFiltros] = useState({
    profissional: "",
    paciente: "",
    periodo: "hoje",
    status: "todos",
    busca: ""
  });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null, type: "danger", statusAction: null });
  const [editModal, setEditModal] = useState({ isOpen: false, agendamento: null, isReschedule: false });
  const [deleteOptionsModal, setDeleteOptionsModal] = useState({ isOpen: false, agendamento: null });

  const navigate = useNavigate();
  const clinicaId = currentUserData?.clinicaId || "";

  const STATUS_LABELS = {
    scheduled: "Agendado",
    confirmed: "Confirmado",
    canceled: "Cancelado",
    rescheduled: "Reagendado",
    no_show: "Falta",
    completed: "Concluído"
  };

  const normalizeStatus = (status) => {
    if (!status) return "scheduled";
    const normalized = String(status).trim().toLowerCase();
    if (normalized === "agendado") return "scheduled";
    if (normalized === "confirmado") return "confirmed";
    if (normalized === "cancelado") return "canceled";
    if (normalized === "concluido" || normalized === "concluído") return "completed";
    if (normalized === "reagendado") return "rescheduled";
    if (normalized === "no-show" || normalized === "no_show" || normalized === "faltou") return "no_show";
    return normalized;
  };

  const normalizeAppointment = (raw, id) => ({
    id,
    clinicaId: raw.clinicaId || "",
    patientId: raw.patientId || raw.pacienteId || "",
    professionalId: raw.professionalId || raw.profissionalId || "",
    therapyId: raw.therapyId || raw.terapiaId || "",
    date: raw.date || raw.data || "",
    time: raw.time || raw.hora || "",
    notes: raw.notes ?? raw.observacoes ?? "",
    status: normalizeStatus(raw.status),
    isRecorrente: Boolean(raw.isRecorrente),
    grupoRecorrenciaId: raw.grupoRecorrenciaId || null,
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null
  });

  const getPatientResponsible = (patient) =>
    patient?.responsavel || patient?.responsavelNome || patient?.nomeResponsavel || "Não informado";
  const getPatientInsurance = (patient) =>
    patient?.convenio || patient?.planoSaude || patient?.plano || "Particular";
  const getPatientSearchText = (patient) => {
    if (!patient) return "";
    const nome = patient?.nome || patient?.nomeCompleto || "";
    const responsavel =
      patient?.responsavel || patient?.responsavelNome || patient?.nomeResponsavel || "";
    return `${nome} ${responsavel}`.toLowerCase();
  };
  const getProfessionalSearchText = (professional) => {
    if (!professional) return "";
    const nome = professional?.nome || professional?.nomeCompleto || "";
    return String(nome).toLowerCase();
  };

  const recordHistory = async (appointment, payload) => {
    await addDoc(collection(db, "appointment_history"), {
      appointmentId: appointment.id,
      clinicaId: appointment.clinicaId,
      patientId: appointment.patientId,
      professionalId: appointment.professionalId,
      changedByUid: user?.uid || null,
      changedByEmail: user?.email || null,
      changedAt: new Date(),
      ...payload
    });
  };

  // Carregar dados
  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      if (authLoading) {
        if (active) setLoadingAgendamentos(true);
        return;
      }

      if (!clinicaId) {
        if (!active) return;
        setAgendamentos([]);
        setAgendamentosFiltrados([]);
        setPacientes({});
        setProfissionais({});
        setTerapias({});
        setInvalidAppointmentsCount(0);
        setLoadingAgendamentos(false);
        setErrorAgendamentos("Não foi possível identificar a clínica do usuário.");
        return;
      }

      setLoadingAgendamentos(true);
      setErrorAgendamentos(null);

      try {
        const [pacientesSnapshot, profissionaisSnapshot, terapiasSnapshot] = await Promise.all([
          getDocs(query(collection(db, "pacientes"), where("clinicaId", "==", clinicaId))),
          getDocs(query(collection(db, "profissionais"), where("clinicaId", "==", clinicaId))),
          getDocs(query(collection(db, "terapias"), where("clinicaId", "==", clinicaId)))
        ]);

        if (!active) return;

        const pacientesMap = {};
        const profissionaisMap = {};
        const terapiasMap = {};
        pacientesSnapshot.forEach((item) => { pacientesMap[item.id] = item.data(); });
        profissionaisSnapshot.forEach((item) => { profissionaisMap[item.id] = item.data(); });
        terapiasSnapshot.forEach((item) => { terapiasMap[item.id] = item.data(); });

        setPacientes(pacientesMap);
        setProfissionais(profissionaisMap);
        setTerapias(terapiasMap);

        const q = query(
          collection(db, "agendamentos"),
          where("clinicaId", "==", clinicaId),
          orderBy("data", "asc")
        );
        const querySnapshot = await getDocs(q);

        if (!active) return;

        const normalized = querySnapshot.docs.map((item) => normalizeAppointment(item.data(), item.id));
        const valid = [];
        let invalid = 0;

        normalized.forEach((agendamento) => {
          if (!agendamento.patientId || !pacientesMap[agendamento.patientId]) {
            invalid += 1;
          }
          valid.push(agendamento);
        });

        valid.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time || "00:00"}`);
          const dateB = new Date(`${b.date}T${b.time || "00:00"}`);
          return dateA - dateB;
        });

        setInvalidAppointmentsCount(invalid);
        setAgendamentos(valid);
        setAgendamentosFiltrados(valid);
      } catch (err) {
        console.error("Erro ao carregar agenda:", err);
        if (!active) return;
        setErrorAgendamentos("Erro ao carregar agendamentos.");
      } finally {
        if (!active) return;
        setLoadingAgendamentos(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [authLoading, clinicaId, refreshKey]);

  // Filtros dinâmicos
  useEffect(() => {
    let filtered = [...agendamentos];

    if (filtros.busca) {
      const termoBusca = filtros.busca.toLowerCase();
      filtered = filtered.filter((agendamento) => {
        const pacienteText = getPatientSearchText(pacientes[agendamento.patientId]);
        const profissionalText = getProfessionalSearchText(profissionais[agendamento.professionalId]);
        return pacienteText.includes(termoBusca) || profissionalText.includes(termoBusca);
      });
    }

    if (filtros.profissional) {
      filtered = filtered.filter((agendamento) => agendamento.professionalId === filtros.profissional);
    }
    if (filtros.paciente) {
      filtered = filtered.filter((agendamento) => agendamento.patientId === filtros.paciente);
    }
    if (filtros.periodo !== "todos") {
      const hoje = new Date();
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

      switch (filtros.periodo) {
        case "hoje":
          filtered = filtered.filter((agendamento) => new Date(agendamento.date).toDateString() === inicioHoje.toDateString());
          break;
        case "semana": {
          const inicioSemana = new Date(inicioHoje);
          inicioSemana.setDate(inicioHoje.getDate() - inicioHoje.getDay());
          const fimSemana = new Date(inicioSemana);
          fimSemana.setDate(inicioSemana.getDate() + 6);
          filtered = filtered.filter((agendamento) => new Date(agendamento.date) >= inicioSemana && new Date(agendamento.date) <= fimSemana);
          break;
        }
        case "mes": {
          const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
          const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
          filtered = filtered.filter((agendamento) => new Date(agendamento.date) >= inicioMes && new Date(agendamento.date) <= fimMes);
          break;
        }
        default:
          break;
      }
    }

    if (filtros.status !== "todos") {
      filtered = filtered.filter((agendamento) => agendamento.status === filtros.status);
    }

    setAgendamentosFiltrados(filtered);
  }, [agendamentos, filtros, pacientes, profissionais]);

  // Ações
  const limparFiltros = () => setFiltros({ profissional: "", paciente: "", periodo: "todos", status: "todos", busca: "" });

  const closeConfirmModal = () => {
    setReasonInput("");
    setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: null, type: "danger", needsReason: false, statusAction: null });
  };

  const deletarAgendamentoUnico = async (agendamentoId) => {
    try {
      await deleteDoc(doc(db, "agendamentos", agendamentoId));
      setAgendamentos((prev) => prev.filter((ag) => ag.id !== agendamentoId));
      closeConfirmModal();
    } catch {
      alert("Erro ao deletar.");
    }
  };

  const deletarSerieAgendamentos = async (grupoRecorrenciaId) => {
    try {
      const agendamentosParaDeletar = agendamentos.filter((ag) => ag.grupoRecorrenciaId === grupoRecorrenciaId);
      const batch = writeBatch(db);
      agendamentosParaDeletar.forEach((agendamento) => batch.delete(doc(db, "agendamentos", agendamento.id)));
      await batch.commit();
      setAgendamentos((prev) => prev.filter((ag) => ag.grupoRecorrenciaId !== grupoRecorrenciaId));
      closeConfirmModal();
    } catch {
      alert("Erro ao deletar série.");
    }
  };

  const deletarTodosParaTerapia = async (patientId, therapyId) => {
    try {
      const agendamentosParaDeletar = agendamentos.filter((ag) => ag.patientId === patientId && ag.therapyId === therapyId);
      const batch = writeBatch(db);
      agendamentosParaDeletar.forEach((agendamento) => batch.delete(doc(db, "agendamentos", agendamento.id)));
      await batch.commit();
      setAgendamentos((prev) => prev.filter((ag) => !(ag.patientId === patientId && ag.therapyId === therapyId)));
      closeConfirmModal();
    } catch {
      alert("Erro ao deletar terapia.");
    }
  };

  const updateAppointmentStatus = async (agendamento, newStatus, reason = "") => {
    if (!agendamento?.id) return;

    const payload = {
      status: newStatus,
      updatedAt: new Date()
    };

    if (newStatus === "canceled" && reason) payload.cancelReason = reason;
    if (newStatus === "no_show" && reason) payload.absenceJustification = reason;

    try {
      await updateDoc(doc(db, "agendamentos", agendamento.id), payload);
      await recordHistory(agendamento, {
        action: "status_update",
        fromStatus: agendamento.status,
        toStatus: newStatus,
        reason: reason || null
      });
      setAgendamentos((prev) => prev.map((item) => (item.id === agendamento.id ? { ...item, ...payload } : item)));
      closeConfirmModal();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status do agendamento.");
    }
  };

  const salvarEdicao = async (editData) => {
    const current = editModal.agendamento;
    if (!current) return;

    const existsProfessional = Boolean(profissionais[editData.profissionalId]);
    if (!existsProfessional) {
      alert("Profissional inválido para esta clínica.");
      return;
    }

    const payload = {
      professionalId: editData.profissionalId,
      profissionalId: editData.profissionalId,
      date: editData.date,
      data: editData.date,
      time: editData.time,
      hora: editData.time,
      notes: editData.notes || "",
      observacoes: editData.notes || "",
      updatedAt: new Date()
    };

    if (editModal.isReschedule) {
      payload.status = "rescheduled";
      payload.rescheduleReason = editData.reason || "";
      payload.rescheduledFrom = {
        date: current.date,
        time: current.time,
        professionalId: current.professionalId
      };
      payload.rescheduledAt = new Date();
    }

    try {
      await updateDoc(doc(db, "agendamentos", current.id), payload);
      if (editModal.isReschedule) {
        await recordHistory(current, {
          action: "reschedule",
          fromStatus: current.status,
          toStatus: "rescheduled",
          reason: editData.reason || null,
          fromDate: current.date,
          toDate: editData.date,
          fromTime: current.time,
          toTime: editData.time
        });
      } else {
        await recordHistory(current, {
          action: "appointment_edit",
          fromStatus: current.status,
          toStatus: current.status,
          fromDate: current.date,
          toDate: editData.date,
          fromTime: current.time,
          toTime: editData.time
        });
      }

      setAgendamentos((prev) =>
        prev.map((ag) =>
          ag.id === current.id
            ? {
                ...ag,
                professionalId: editData.profissionalId,
                date: editData.date,
                time: editData.time,
                notes: editData.notes || "",
                updatedAt: payload.updatedAt,
                status: payload.status || ag.status
              }
            : ag
        )
      );
      setEditModal({ isOpen: false, agendamento: null, isReschedule: false });
    } catch (error) {
      console.error("Erro ao salvar edição:", error);
      alert("Erro ao salvar.");
    }
  };

  // Utilidades
  const formatarData = (dataString) => new Date(dataString).toLocaleDateString("pt-BR") || dataString;
  const formatarHora = (horaString) => horaString || "Não informado";
  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "#3b82f6";
      case "confirmed":
        return "#22c55e";
      case "canceled":
        return "#ef4444";
      case "rescheduled":
        return "#f59e0b";
      case "no_show":
        return "#f97316";
      case "completed":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const onStatusActionClick = (agendamento, actionType) => {
    const actionMeta = {
      confirmed: {
        title: "Confirmar atendimento",
        message: "Deseja confirmar este agendamento?",
        type: "success",
        needsReason: false
      },
      completed: {
        title: "Marcar como concluído",
        message: "Deseja marcar este atendimento como concluído?",
        type: "success",
        needsReason: false
      },
      canceled: {
        title: "Cancelar atendimento",
        message: "Deseja cancelar este atendimento?",
        type: "danger",
        needsReason: true,
        reasonLabel: "Motivo do cancelamento (opcional)"
      },
      no_show: {
        title: "Registrar falta",
        message: "Deseja registrar falta para este atendimento?",
        type: "danger",
        needsReason: true,
        reasonLabel: "Justificativa da falta (opcional)"
      }
    };

    const meta = actionMeta[actionType];
    if (!meta) return;

    setReasonInput("");
    setConfirmModal({
      isOpen: true,
      title: meta.title,
      message: meta.message,
      type: meta.type,
      needsReason: meta.needsReason,
      reasonLabel: meta.reasonLabel,
      onConfirm: null,
      statusAction: { agendamento, actionType }
    });
  };

  const handleConfirmFromModal = async () => {
    if (confirmModal.statusAction) {
      const { agendamento, actionType } = confirmModal.statusAction;
      await updateAppointmentStatus(agendamento, actionType, reasonInput);
      return;
    }
    if (confirmModal.onConfirm) {
      await confirmModal.onConfirm();
    }
  };

  const availableStatuses = useMemo(
    () => [
      { value: "scheduled", label: "Agendado" },
      { value: "confirmed", label: "Confirmado" },
      { value: "rescheduled", label: "Reagendado" },
      { value: "completed", label: "Concluído" },
      { value: "canceled", label: "Cancelado" },
      { value: "no_show", label: "Falta" }
    ],
    []
  );

  if (authLoading || loadingAgendamentos) return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <div className="agenda-geral-container">
          <div className="loading-container">
            <FaSpinner className="loading-spinner" />
            <p>Carregando...</p>
          </div>
        </div>
      </main>
    </div>
  );
  if (errorAgendamentos) return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <div className="agenda-geral-container">
          <div className="error-container">
            <FaExclamationTriangle className="error-icon" />
            <p>{errorAgendamentos}</p>
            <button onClick={() => window.location.reload()} className="retry-button">Tentar</button>
          </div>
        </div>
      </main>
    </div>
  );

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <div className="agenda-geral-container">
          <div className="agenda-header">
            <h1>📅 Agenda</h1>
            <button className="add-agendamento-btn" onClick={() => navigate("/adicionar-agendamento")}>
              <FaPlusCircle /> Novo
            </button>
          </div>
          <div className="filtros-container">
            <div className="filtros-header">
              <h3><FaFilter /> Filtros</h3>
              <button className="limpar-filtros-btn" onClick={limparFiltros}><FaTimes /> Limpar</button>
            </div>
            <div className="busca-container">
              <div className="busca-input-wrapper">
                <FaSearch className="busca-icon" />
                <input className="busca-input" type="text" placeholder="Buscar..." value={filtros.busca} onChange={e => setFiltros({ ...filtros, busca: e.target.value })} />
                {filtros.busca && <button className="clear-search-btn" onClick={() => setFiltros({ ...filtros, busca: "" })}><FaTimes /></button>}
              </div>
            </div>
            <div className="filtros-grid">
              <div className="filtro-group">
                <label>Profissional</label>
                <select value={filtros.profissional} onChange={e => setFiltros({ ...filtros, profissional: e.target.value })}>
                  <option value="">Todos</option>
                  {Object.entries(profissionais).map(([id, profissional]) => <option key={id} value={id}>{profissional.nome}</option>)}
                </select>
              </div>
              <div className="filtro-group">
                <label>Paciente</label>
                <select value={filtros.paciente} onChange={e => setFiltros({ ...filtros, paciente: e.target.value })}>
                  <option value="">Todos</option>
                  {Object.entries(pacientes).map(([id, paciente]) => <option key={id} value={id}>{paciente.nome}</option>)}
                </select>
              </div>
              <div className="filtro-group">
                <label>Período</label>
                <select value={filtros.periodo} onChange={e => setFiltros({ ...filtros, periodo: e.target.value })}>
                  <option value="todos">Todos</option>
                  <option value="hoje">Hoje</option>
                  <option value="semana">Semana</option>
                  <option value="mes">Mês</option>
                </select>
              </div>
              <div className="filtro-group">
                <label>Status</label>
                <select value={filtros.status} onChange={e => setFiltros({ ...filtros, status: e.target.value })}>
                  <option value="todos">Todos</option>
                  {availableStatuses.map((statusOption) => (
                    <option key={statusOption.value} value={statusOption.value}>{statusOption.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="resultados-counter"><FaCalendarCheck /> {agendamentosFiltrados.length} resultado(s)</div>
          </div>
          {invalidAppointmentsCount > 0 && (
            <div className="warning-banner">
              <FaInfoCircle />
              <span>
                {invalidAppointmentsCount} agendamento(s) possuem paciente inválido ou removido. Revise esses registros para manter integridade.
              </span>
              <button onClick={() => setRefreshKey((prev) => prev + 1)}>Atualizar</button>
            </div>
          )}
          {agendamentosFiltrados.length > 0 ? (
            <div className="table-container">
              <table className="agendamentos-table">
                <thead>
                  <tr>
                    <th style={{ width: '12%' }}><FaCalendar /> Data</th>
                    <th style={{ width: '8%' }}><FaClock /> Hora</th>
                    <th style={{ width: '22%' }}><FaUser /> Paciente</th>
                    <th style={{ width: '14%' }}><FaUsers /> Profissional</th>
                    <th style={{ width: '14%' }}><FaFileAlt /> Terapia</th>
                    <th style={{ width: '8%' }}>Status</th>
                    <th style={{ width: '8%' }}>Recorr.</th>
                    <th style={{ width: '14%' }} className="acoes-cell">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {agendamentosFiltrados.map((agendamento) => (
                    <tr key={agendamento.id}>
                      <td className="data-cell" title={formatarData(agendamento.date)}><FaCalendar /> {formatarData(agendamento.date)}</td>
                      <td className="hora-cell" title={formatarHora(agendamento.time)}><FaClock /> {formatarHora(agendamento.time)}</td>
                      <td
                        className="paciente-cell"
                        title={pacientes[agendamento.patientId]?.nome || pacientes[agendamento.patientId]?.nomeCompleto || "Paciente não encontrado"}
                      >
                        <div className="patient-main-line">
                          <FaUser /> {(pacientes[agendamento.patientId]?.nome || pacientes[agendamento.patientId]?.nomeCompleto) || "Paciente não encontrado"}
                        </div>
                        <div className="patient-sub-line">Resp.: {getPatientResponsible(pacientes[agendamento.patientId])}</div>
                        <div className="patient-sub-line">Convênio: {getPatientInsurance(pacientes[agendamento.patientId])}</div>
                      </td>
                      <td className="profissional-cell" title={profissionais[agendamento.professionalId]?.nome}><FaUsers /> {profissionais[agendamento.professionalId]?.nome || "Não informado"}</td>
                      <td className="terapia-cell" title={terapias[agendamento.therapyId]?.nome}><FaFileAlt /> {terapias[agendamento.therapyId]?.nome || "Não informada"}</td>
                      <td className="status-cell"><span className="status-badge-table" style={{ background: getStatusColor(agendamento.status) }}>{STATUS_LABELS[agendamento.status] || "Agendado"}</span></td>
                      <td className="recorrencia-cell">{agendamento.grupoRecorrenciaId ? <span className="recorrencia-badge"><FaCalendarAlt /> Rec.</span> : <span className="unico-badge"><FaCalendarCheck /> Ún.</span>}</td>
                      <td className="acoes-cell">
                        <div className="action-buttons">
                          <button className="action-btn edit-btn" title="Editar" onClick={() => setEditModal({ isOpen: true, agendamento, isReschedule: false })}><FaEdit /></button>
                          <button className="action-btn status-btn" title="Confirmar" onClick={() => onStatusActionClick(agendamento, "confirmed")}>OK</button>
                          <button className="action-btn status-btn reschedule-btn" title="Reagendar" onClick={() => setEditModal({ isOpen: true, agendamento, isReschedule: true })}>R</button>
                          <button className="action-btn status-btn complete-btn" title="Concluir" onClick={() => onStatusActionClick(agendamento, "completed")}>✓</button>
                          <button className="action-btn status-btn no-show-btn" title="Falta" onClick={() => onStatusActionClick(agendamento, "no_show")}>F</button>
                          <button className="action-btn status-btn cancel-btn-action" title="Cancelar" onClick={() => onStatusActionClick(agendamento, "canceled")}>X</button>
                          <button className="action-btn delete-btn" title="Excluir" onClick={() => setDeleteOptionsModal({ isOpen: true, agendamento })}><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <FaCalendarAlt className="empty-icon" />
              <h3>Nenhum agendamento</h3>
              <p>Ajuste filtros ou adicione um!</p>
              <button className="create-first-btn" onClick={() => navigate("/adicionar-agendamento")}><FaPlusCircle /> Criar</button>
            </div>
          )}
          <ConfirmModal {...confirmModal} onClose={closeConfirmModal} onConfirm={handleConfirmFromModal}>
            {confirmModal.needsReason && (
              <div className="modal-reason">
                <label>{confirmModal.reasonLabel || "Motivo (opcional)"}</label>
                <textarea
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  rows="2"
                  placeholder="Escreva aqui, se desejar..."
                />
              </div>
            )}
          </ConfirmModal>
          <EditModal
            isOpen={editModal.isOpen}
            onClose={() => setEditModal({ isOpen: false, agendamento: null, isReschedule: false })}
            agendamento={editModal.agendamento}
            profissionais={profissionais}
            isReschedule={editModal.isReschedule}
            onSave={(data) => salvarEdicao(data)}
          />
          <DeleteOptionsModal
            isOpen={deleteOptionsModal.isOpen}
            onClose={() => setDeleteOptionsModal({ isOpen: false, agendamento: null })}
            agendamento={deleteOptionsModal.agendamento}
            onDeleteSingle={() => {
              setConfirmModal({
                isOpen: true,
                title: "Excluir",
                message: "Confirmar exclusão?",
                type: "danger",
                onConfirm: () => deletarAgendamentoUnico(deleteOptionsModal.agendamento.id)
              });
              setDeleteOptionsModal({ isOpen: false, agendamento: null });
            }}
            onDeleteSeries={() => {
              setConfirmModal({
                isOpen: true,
                title: "Excluir série",
                message: "Excluir toda a série?",
                type: "danger",
                onConfirm: () => deletarSerieAgendamentos(deleteOptionsModal.agendamento.grupoRecorrenciaId)
              });
              setDeleteOptionsModal({ isOpen: false, agendamento: null });
            }}
            onDeleteAllForTherapy={() => {
              setConfirmModal({
                isOpen: true,
                title: "Excluir todos",
                message: "Excluir todos desta terapia?",
                type: "danger",
                onConfirm: () => deletarTodosParaTerapia(deleteOptionsModal.agendamento.patientId, deleteOptionsModal.agendamento.therapyId)
              });
              setDeleteOptionsModal({ isOpen: false, agendamento: null });
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default AgendaGeral;
