import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  PROGRAM_STATUS,
  listProgramsByPatient,
  createProgram,
  updateProgram,
  getProgram,
  getSession,
  createSession,
  listTrials,
  addTrial,
  deleteTrial,
  computeSessionStats,
  finalizeSession,
  updateSessionNotes,
  listSessionsByProgram,
  sortSessionsByDateAsc,
  trendLastThreeSessions,
  setSessionShared,
} from "../../aba/abaApi";
import { RESPONSE_TYPES, emptyResponseCounts } from "../../constants/abaResponseTypes";
import ResponseButton from "./ResponseButton";
import LiveBreakdownStrip from "./LiveBreakdownStrip";
import TrialUndoToast from "./TrialUndoToast";
import EndSessionModal from "./EndSessionModal";
import ProgramForm from "./ProgramForm";
import SessionSummaryCards from "./SessionSummaryCards";
import ProgressLineChart from "./ProgressLineChart";
import ProgressStackedBar from "./ProgressStackedBar";
import "./AbaModule.css";

function formatDateBR(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export default function AbaPatientModule({ patientId, pacienteNome, deepLinkSessionId = "" }) {
  const { user, currentUserData } = useAuth();
  const clinicaId = currentUserData?.clinicaId || "";
  const therapistId = user?.uid || "";

  const [programs, setPrograms] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [masteredError, setMasteredError] = useState("");

  const [abaFlow, setAbaFlow] = useState("list");
  const [activeProgramId, setActiveProgramId] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeProgram, setActiveProgram] = useState(null);

  const [trials, setTrials] = useState([]);
  const [counts, setCounts] = useState(emptyResponseCounts());
  const [sessionNotes, setSessionNotes] = useState("");
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [toastId, setToastId] = useState(0);
  const [lastTrialKey, setLastTrialKey] = useState(null);
  const [lastTrialDocId, setLastTrialDocId] = useState(null);
  const [undoVisible, setUndoVisible] = useState(false);

  const [sessionsForProgress, setSessionsForProgress] = useState([]);
  const [shareConfirmSession, setShareConfirmSession] = useState(null);

  const reloadPrograms = useCallback(async () => {
    if (!patientId || !clinicaId) return;
    setLoading(true);
    try {
      const list = await listProgramsByPatient(patientId, clinicaId);
      list.sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0));
      setPrograms(list);
    } catch (e) {
      console.error(e);
      alert("Erro ao carregar programas ABA.");
    } finally {
      setLoading(false);
    }
  }, [patientId, clinicaId]);

  useEffect(() => {
    reloadPrograms();
  }, [reloadPrograms]);

  const filteredPrograms = useMemo(() => {
    if (statusFilter === "all") return programs;
    return programs.filter((p) => p.status === statusFilter);
  }, [programs, statusFilter]);

  const openCreate = () => {
    setEditingProgram(null);
    setFormOpen(true);
  };

  const openEdit = (p) => {
    setEditingProgram(p);
    setFormOpen(true);
  };

  const handleSaveProgram = async (data) => {
    setMasteredError("");
    try {
      if (editingProgram?.id) {
        const finalized = await listSessionsByProgram(editingProgram.id, clinicaId);
        const fin = finalized.filter((s) => s.finalizadaEm);
        await updateProgram(
          editingProgram.id,
          {
            nome: data.nome,
            descricao: data.descricao,
            objetivo: data.objetivo,
            status: data.status,
          },
          { finalizedSessions: fin }
        );
      } else {
        await createProgram({
          patientId,
          clinicaId,
          createdBy: therapistId,
          nome: data.nome,
          descricao: data.descricao,
          objetivo: data.objetivo,
          status: PROGRAM_STATUS.ACTIVE,
        });
      }
      setFormOpen(false);
      reloadPrograms();
    } catch (e) {
      setMasteredError(e.message || "Erro ao salvar.");
      alert(e.message || "Erro ao salvar.");
    }
  };

  const startSession = async (program) => {
    try {
      const ref = await createSession({
        programId: program.id,
        patientId,
        clinicaId,
        therapistId,
        program,
      });
      setActiveProgramId(program.id);
      setActiveProgram(program);
      setActiveSessionId(ref.id);
      setTrials([]);
      setCounts(emptyResponseCounts());
      setSessionNotes("");
      setAbaFlow("session");
    } catch (e) {
      alert(e.message || "Não foi possível iniciar a sessão.");
    }
  };

  const reloadTrials = async (sessionId) => {
    const list = await listTrials(sessionId);
    setTrials(list);
    const stats = computeSessionStats(list);
    setCounts(stats.counts);
  };

  useEffect(() => {
    if (abaFlow !== "session" || !activeSessionId) return;
    reloadTrials(activeSessionId);
  }, [abaFlow, activeSessionId]);

  const onRecordPress = async (responseKey) => {
    if (!activeSessionId) return;
    try {
      const ref = await addTrial(activeSessionId, responseKey);
      setLastTrialKey(responseKey);
      setLastTrialDocId(ref.id);
      setToastId((x) => x + 1);
      setUndoVisible(true);
      await reloadTrials(activeSessionId);
    } catch (e) {
      alert(e.message || "Erro ao registrar.");
    }
  };

  const handleUndo = async () => {
    if (!activeSessionId || !lastTrialDocId) return;
    try {
      await deleteTrial(activeSessionId, lastTrialDocId);
      setLastTrialKey(null);
      setLastTrialDocId(null);
      setUndoVisible(false);
      await reloadTrials(activeSessionId);
    } catch (e) {
      alert(e.message || "Erro ao desfazer.");
    }
  };

  const handleUndoExpire = () => {
    setUndoVisible(false);
    setLastTrialKey(null);
    setLastTrialDocId(null);
  };

  const totalTrials = trials.length;
  const stats = computeSessionStats(trials);

  const openEndModal = () => {
    if (totalTrials < 1) return;
    setEndModalOpen(true);
  };

  const confirmEndSession = async () => {
    if (!activeSessionId) return;
    try {
      await updateSessionNotes(activeSessionId, sessionNotes);
      const s = computeSessionStats(trials);
      await finalizeSession(activeSessionId, s, sessionNotes);
      setEndModalOpen(false);
      setAbaFlow("progress");
      await loadProgress(activeProgramId);
    } catch (e) {
      alert(e.message || "Erro ao finalizar.");
    }
  };

  const loadProgress = async (programId) => {
    const list = await listSessionsByProgram(programId, clinicaId);
    const finalized = list.filter((s) => s.finalizadaEm);
    setSessionsForProgress(sortSessionsByDateAsc(finalized));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!deepLinkSessionId || !patientId || !clinicaId) return;
      try {
        const s = await getSession(deepLinkSessionId);
        if (cancelled || !s || s.patientId !== patientId) return;
        const prog = await getProgram(s.programId);
        if (cancelled || !prog) return;
        setActiveProgramId(s.programId);
        setActiveProgram(prog);
        if (s.finalizadaEm) {
          const list = await listSessionsByProgram(s.programId, clinicaId);
          const finalized = list.filter((x) => x.finalizadaEm);
          setSessionsForProgress(sortSessionsByDateAsc(finalized));
          setAbaFlow("progress");
        } else {
          setActiveSessionId(s.id);
          setSessionNotes(s.notas || "");
          setAbaFlow("session");
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deepLinkSessionId, patientId, clinicaId]);

  const openProgress = async (programId) => {
    setActiveProgramId(programId);
    const p = await getProgram(programId);
    setActiveProgram(p);
    await loadProgress(programId);
    setAbaFlow("progress");
  };

  const backToList = () => {
    setAbaFlow("list");
    setActiveSessionId(null);
    setActiveProgramId(null);
    setActiveProgram(null);
    reloadPrograms();
  };

  const confirmShare = async () => {
    if (!shareConfirmSession?.id) return;
    try {
      await setSessionShared(shareConfirmSession.id, true);
      setShareConfirmSession(null);
      if (activeProgramId) await loadProgress(activeProgramId);
    } catch (e) {
      alert(e.message || "Erro ao compartilhar.");
    }
  };

  const progressData = useMemo(() => {
    const labels = sessionsForProgress.map((s) => formatDateBR(s.data));
    const rates = sessionsForProgress.map((s) =>
      typeof s.taxaIndependencia === "number" ? s.taxaIndependencia : 0
    );
    const sessionsCounts = sessionsForProgress.map((s) => {
      const base = emptyResponseCounts();
      const c = s.contagensPorTipo || {};
      RESPONSE_TYPES.forEach((t) => {
        base[t.key] = c[t.key] || 0;
      });
      return base;
    });
    const totalSessions = sessionsForProgress.length;
    const totalTrialsAll = sessionsForProgress.reduce((acc, s) => acc + (s.totalTrials || 0), 0);
    const latest = sessionsForProgress.length
      ? sessionsForProgress[sessionsForProgress.length - 1].taxaIndependencia
      : null;
    const trend = trendLastThreeSessions(sessionsForProgress);
    return { labels, rates, sessionsCounts, totalSessions, totalTrialsAll, latest, trend };
  }, [sessionsForProgress]);

  const todayLabel = useMemo(() => {
    const t = new Date();
    return t.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }, []);

  if (loading && programs.length === 0) {
    return <p>Carregando programas…</p>;
  }

  if (abaFlow === "session" && activeSessionId && activeProgram) {
    return (
      <div className="aba-session-overlay">
        <header className="aba-session-header">
          <p className="aba-sub">{pacienteNome}</p>
          <h2>{activeProgram.nome}</h2>
          <p className="aba-sub">{todayLabel}</p>
        </header>

        <div className="aba-session-meta">
          <span className="aba-counter">Total: {totalTrials}</span>
        </div>
        <LiveBreakdownStrip counts={counts} total={totalTrials} />

        <div className="aba-session-grid" style={{ marginTop: "0.75rem" }}>
          {RESPONSE_TYPES.map((t, idx) => (
            <div key={t.key} style={idx === 4 ? { gridColumn: "1 / -1", maxWidth: "50%", justifySelf: "center", width: "100%" } : {}}>
              <ResponseButton responseKey={t.key} onPress={onRecordPress} />
            </div>
          ))}
        </div>

        <div style={{ marginTop: "1rem" }}>
          <label className="aba-sub" htmlFor="aba-session-notes">
            Notas da sessão
          </label>
          <textarea
            id="aba-session-notes"
            className="aba-notes"
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            placeholder="Observações opcionais…"
          />
        </div>

        <button type="button" className="aba-end-btn" disabled={totalTrials < 1} onClick={openEndModal}>
          Encerrar sessão
        </button>
        <button type="button" className="aba-btn" style={{ marginTop: "0.5rem", width: "100%" }} onClick={backToList}>
          ← Sair sem encerrar (sessão continua aberta)
        </button>

        {undoVisible && lastTrialKey && (
          <TrialUndoToast
            toastId={toastId}
            lastTrialKey={lastTrialKey}
            onUndo={handleUndo}
            onExpire={handleUndoExpire}
          />
        )}

        <EndSessionModal
          open={endModalOpen}
          counts={stats.counts}
          total={stats.total}
          taxaIndependencia={stats.taxaIndependencia}
          onCancel={() => setEndModalOpen(false)}
          onConfirm={confirmEndSession}
        />
      </div>
    );
  }

  if (abaFlow === "progress" && activeProgram) {
    return (
      <div className="aba-program-list">
        <div className="aba-toolbar">
          <button type="button" className="aba-btn" onClick={backToList}>
            ← Voltar aos programas
          </button>
        </div>
        <h3 style={{ marginTop: 0 }}>Progresso: {activeProgram.nome}</h3>

        <SessionSummaryCards
          totalSessions={progressData.totalSessions}
          totalTrialsAll={progressData.totalTrialsAll}
          latestIndependenceRate={progressData.latest}
          trend={progressData.trend}
        />

        {progressData.labels.length > 0 && (
          <>
            <div className="aba-chart-wrap">
              <ProgressLineChart labels={progressData.labels} independenceRates={progressData.rates} />
            </div>
            <div className="aba-chart-wrap">
              <ProgressStackedBar labels={progressData.labels} sessionsCounts={progressData.sessionsCounts} />
            </div>
          </>
        )}

        <h4>Sessões</h4>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {sessionsForProgress.map((s) => (
            <li
              key={s.id}
              className="aba-program-card"
              style={{ flexDirection: "column", alignItems: "stretch" }}
            >
              <div>
                <strong>{formatDateBR(s.data)}</strong> — {s.totalTrials || 0} tentativas — taxa{" "}
                {typeof s.taxaIndependencia === "number" ? `${s.taxaIndependencia.toFixed(1)}%` : "—"}
              </div>
              {s.compartilhadoComResponsavel ? (
                <span className="aba-badge aba-badge--active">Compartilhado com responsável</span>
              ) : (
                <button
                  type="button"
                  className="aba-btn"
                  onClick={() => setShareConfirmSession(s)}
                >
                  Compartilhar com responsável
                </button>
              )}
              {s.appointmentId && (
                <span className="aba-sub" style={{ display: "block", marginTop: "0.35rem" }}>
                  Vinculada a consulta na agenda (ID: {s.appointmentId})
                </span>
              )}
              {s.notas && <p style={{ margin: "0.5rem 0 0", color: "#475569" }}>{s.notas}</p>}
            </li>
          ))}
        </ul>

        {shareConfirmSession && (
          <div className="aba-modal-overlay" onClick={() => setShareConfirmSession(null)}>
            <div className="aba-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Compartilhar com o responsável?</h3>
              <p>O responsável poderá ver o resumo desta sessão (sem detalhe das tentativas).</p>
              <div className="aba-modal-actions">
                <button type="button" className="aba-btn" onClick={() => setShareConfirmSession(null)}>
                  Cancelar
                </button>
                <button type="button" className="aba-btn aba-btn--primary" onClick={confirmShare}>
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="aba-program-list">
      {masteredError && (
        <p style={{ color: "#b91c1c" }} role="alert">
          {masteredError}
        </p>
      )}
      <div className="aba-toolbar">
        <button type="button" className="aba-btn aba-btn--primary" onClick={openCreate}>
          Novo programa
        </button>
        <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.35rem" }}>
          Filtrar:
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value={PROGRAM_STATUS.ACTIVE}>Ativo</option>
            <option value={PROGRAM_STATUS.PAUSED}>Pausado</option>
            <option value={PROGRAM_STATUS.MASTERED}>Dominado</option>
          </select>
        </label>
      </div>

      {filteredPrograms.length === 0 && <p>Nenhum programa neste filtro.</p>}

      {filteredPrograms.map((p) => (
        <div key={p.id} className="aba-program-card">
          <div>
            <strong>{p.nome}</strong>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>
              Criado em{" "}
              {p.criadoEm?.toDate().toLocaleDateString("pt-BR") || "—"}
            </div>
            <span
              className={`aba-badge ${
                p.status === PROGRAM_STATUS.ACTIVE
                  ? "aba-badge--active"
                  : p.status === PROGRAM_STATUS.PAUSED
                    ? "aba-badge--paused"
                    : "aba-badge--mastered"
              }`}
            >
              {p.status === PROGRAM_STATUS.ACTIVE
                ? "Ativo"
                : p.status === PROGRAM_STATUS.PAUSED
                  ? "Pausado"
                  : "Dominado"}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <button type="button" className="aba-btn" onClick={() => openEdit(p)}>
              Editar
            </button>
            <button type="button" className="aba-btn" onClick={() => openProgress(p.id)}>
              Progresso
            </button>
            <button
              type="button"
              className="aba-btn aba-btn--primary"
              disabled={p.status === PROGRAM_STATUS.PAUSED || p.status === PROGRAM_STATUS.MASTERED}
              onClick={() => startSession(p)}
            >
              Iniciar sessão
            </button>
          </div>
        </div>
      ))}

      <ProgramForm
        open={formOpen}
        initial={editingProgram}
        onClose={() => {
          setFormOpen(false);
          setMasteredError("");
        }}
        onSubmit={handleSaveProgram}
      />
    </div>
  );
}
