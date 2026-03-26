import React, { useEffect, useMemo, useState } from "react";
import { listSharedSessionsByProgram, sortSessionsByDateAsc, trendLastThreeSessions } from "../../aba/abaApi";
import { RESPONSE_TYPES, emptyResponseCounts } from "../../constants/abaResponseTypes";
import SessionSummaryCards from "../../components/aba/SessionSummaryCards";
import ProgressLineChart from "../../components/aba/ProgressLineChart";
import ProgressStackedBar from "../../components/aba/ProgressStackedBar";
import "../../components/aba/AbaModule.css";
import "../guardianArea.css";

function formatDateBR(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/** Read-only ABA progress: shared sessions only, parent-friendly chart copy. */
export default function GuardianProgressView({ programId, clinicaId, programName }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!programId || !clinicaId) return;
      setLoading(true);
      try {
        const list = await listSharedSessionsByProgram(programId, clinicaId);
        const fin = list.filter((s) => s.finalizadaEm);
        if (!cancelled) setSessions(sortSessionsByDateAsc(fin));
      } catch (e) {
        console.error(e);
        if (!cancelled) setSessions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [programId, clinicaId]);

  const progressData = useMemo(() => {
    const labels = sessions.map((s) => formatDateBR(s.data));
    const rates = sessions.map((s) =>
      typeof s.taxaIndependencia === "number" ? s.taxaIndependencia : 0
    );
    const sessionsCounts = sessions.map((s) => {
      const base = emptyResponseCounts();
      const c = s.contagensPorTipo || {};
      RESPONSE_TYPES.forEach((t) => {
        base[t.key] = c[t.key] || 0;
      });
      return base;
    });
    const totalSessions = sessions.length;
    const totalTrialsAll = sessions.reduce((acc, s) => acc + (s.totalTrials || 0), 0);
    const latest = sessions.length ? sessions[sessions.length - 1].taxaIndependencia : null;
    const trend = trendLastThreeSessions(sessions);
    return { labels, rates, sessionsCounts, totalSessions, totalTrialsAll, latest, trend };
  }, [sessions]);

  if (loading) return <p className="ga-muted">Carregando progresso…</p>;

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>{programName || "Programa"}</h2>
      <p className="ga-muted">Apenas sessões que a equipe decidiu compartilhar com você aparecem aqui.</p>

      <SessionSummaryCards
        variant="guardian"
        totalSessions={progressData.totalSessions}
        totalTrialsAll={progressData.totalTrialsAll}
        latestIndependenceRate={progressData.latest}
        trend={progressData.trend}
      />

      {progressData.labels.length > 0 ? (
        <>
          <div className="aba-chart-wrap">
            <ProgressLineChart
              variant="guardian"
              labels={progressData.labels}
              independenceRates={progressData.rates}
            />
          </div>
          <div className="aba-chart-wrap">
            <ProgressStackedBar
              variant="guardian"
              labels={progressData.labels}
              sessionsCounts={progressData.sessionsCounts}
            />
          </div>
        </>
      ) : (
        <p className="ga-muted">Ainda não há sessões compartilhadas para este programa.</p>
      )}

      <h3>Notas das sessões</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {sessions.map((s) => (
          <li key={s.id} className="ga-card" style={{ marginBottom: "0.5rem" }}>
            <strong>{formatDateBR(s.data)}</strong>
            {typeof s.taxaIndependencia === "number" && (
              <span className="ga-muted"> — {Math.round(s.taxaIndependencia)}% de progresso</span>
            )}
            {s.notas && <p style={{ margin: "0.5rem 0 0" }}>{s.notas}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
