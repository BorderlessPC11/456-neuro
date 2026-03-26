import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  listLinksForGuardian,
  getPatient,
  listAppointmentsForPatient,
  listThreadsForGuardian,
} from "../../guardian/guardianApi";
import {
  listProgramsByPatient,
  listSharedSessionsByProgram,
  sortSessionsByDateAsc,
  trendLastThreeSessions,
} from "../../aba/abaApi";
import ProgramSummaryCard from "../../guardian/components/ProgramSummaryCard";
import "../../guardian/guardianArea.css";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function trendArrow(trend) {
  if (trend === "improving") return "↑";
  if (trend === "regressing") return "↓";
  return "→";
}

export default function GuardianDashboard() {
  const { user, currentUserData } = useAuth();
  const clinicaId = currentUserData?.clinicaId || "";
  const uid = user?.uid || "";

  const [links, setLinks] = useState([]);
  const [childLabels, setChildLabels] = useState({});
  const [patientId, setPatientId] = useState("");
  const [patient, setPatient] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [programMeta, setProgramMeta] = useState({});
  const [nextAg, setNextAg] = useState(null);
  const [msgPreview, setMsgPreview] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!uid || !clinicaId) {
        setLoading(false);
        return;
      }
      try {
        const lk = await listLinksForGuardian(uid, clinicaId);
        setLinks(lk);
        if (lk.length && !patientId) setPatientId(lk[0].patientId);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [uid, clinicaId, patientId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!links.length) {
        if (!cancelled) setChildLabels({});
        return;
      }
      const entries = await Promise.all(
        links.map(async (l) => {
          const p = await getPatient(l.patientId);
          const name = p?.nome || p?.nomeCompleto || l.patientId;
          return [l.patientId, name];
        })
      );
      if (!cancelled) setChildLabels(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [links]);

  useEffect(() => {
    const run = async () => {
      if (!patientId || !clinicaId) {
        setPatient(null);
        return;
      }
      const p = await getPatient(patientId);
      setPatient(p);
    };
    run();
  }, [patientId, clinicaId]);

  useEffect(() => {
    const run = async () => {
      if (!patientId || !clinicaId) {
        setPrograms([]);
        setProgramMeta({});
        return;
      }
      const progs = await listProgramsByPatient(patientId, clinicaId);
      setPrograms(progs);
      const meta = {};
      await Promise.all(
        progs.map(async (pr) => {
          const sess = await listSharedSessionsByProgram(pr.id, clinicaId);
          const fin = sess.filter((s) => s.finalizadaEm);
          const ordered = sortSessionsByDateAsc(fin);
          const latest = ordered.length ? ordered[ordered.length - 1] : null;
          const trend = trendLastThreeSessions(ordered);
          meta[pr.id] = {
            latestRate: latest?.taxaIndependencia ?? null,
            trend,
            trendArrow: trendArrow(trend),
          };
        })
      );
      setProgramMeta(meta);
    };
    run();
  }, [patientId, clinicaId]);

  useEffect(() => {
    const run = async () => {
      if (!patientId || !clinicaId) {
        setNextAg(null);
        return;
      }
      const ags = await listAppointmentsForPatient(patientId, clinicaId);
      const today = todayISO();
      const upcoming = ags.filter(
        (a) =>
          a.date >= today &&
          a.status !== "canceled" &&
          a.status !== "completed" &&
          a.status !== "no_show"
      );
      upcoming.sort((a, b) => {
        const c = (a.date || "").localeCompare(b.date || "");
        return c !== 0 ? c : (a.time || "").localeCompare(b.time || "");
      });
      setNextAg(upcoming[0] || null);
    };
    run();
  }, [patientId, clinicaId]);

  useEffect(() => {
    const run = async () => {
      if (!uid || !clinicaId || !patientId) {
        setMsgPreview("");
        return;
      }
      const threads = await listThreadsForGuardian(uid, clinicaId);
      const t = threads.find((th) => th.patientId === patientId);
      setMsgPreview(t?.lastMessagePreview || "");
    };
    run();
  }, [uid, clinicaId, patientId]);

  const photoUrl = patient?.fotoURL || patient?.photoUrl || patient?.fotoUrl;

  const childName = useMemo(() => patient?.nome || patient?.nomeCompleto || "Criança", [patient]);

  if (loading) return <p>Carregando…</p>;

  if (!links.length) {
    return (
      <div className="ga-dashboard">
        <h1>Olá!</h1>
        <p className="ga-muted">Você ainda não está vinculado a nenhuma criança. Peça à clínica um convite.</p>
      </div>
    );
  }

  return (
    <div className="ga-dashboard">
      <h1>Olá! Aqui está o resumo</h1>

      {links.length > 1 && (
        <label className="ga-select-label">
          Criança:{" "}
          <select className="ga-input" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            {links.map((l) => (
              <option key={l.patientId} value={l.patientId}>
                {childLabels[l.patientId] || l.patientId}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="ga-child-header">
        {photoUrl && <img src={photoUrl} alt="" className="ga-child-photo" />}
        <div>
          <h2 style={{ margin: 0 }}>{childName}</h2>
          <p className="ga-muted" style={{ margin: "0.25rem 0 0" }}>
            Acompanhamento compartilhado pela clínica
          </p>
        </div>
      </div>

      <section className="ga-section">
        <h3>Progresso dos programas</h3>
        <div className="ga-program-grid">
          {programs.length === 0 && <p className="ga-muted">Nenhum programa disponível ainda.</p>}
          {programs.map((p) => (
            <ProgramSummaryCard
              key={p.id}
              programId={p.id}
              patientId={patientId}
              name={p.nome || "Programa"}
              latestRate={programMeta[p.id]?.latestRate}
              trendArrow={programMeta[p.id]?.trendArrow || "→"}
            />
          ))}
        </div>
        <Link to="/guardian/progress" className="ga-link-all">
          Ver todos os gráficos de progresso
        </Link>
      </section>

      <section className="ga-section">
        <h3>Próxima consulta</h3>
        {nextAg ? (
          <div className="ga-card">
            <strong>
              {nextAg.date} às {nextAg.time || "--:--"}
            </strong>
            <p className="ga-muted" style={{ margin: "0.35rem 0 0" }}>
              Status: {nextAg.status || "—"}
            </p>
          </div>
        ) : (
          <p className="ga-muted">Nenhuma consulta futura encontrada.</p>
        )}
        <Link to="/guardian/appointments" className="ga-link-all">
          Ver agenda completa
        </Link>
      </section>

      <section className="ga-section">
        <h3>Mensagens</h3>
        {msgPreview ? (
          <div className="ga-card">
            <p style={{ margin: 0 }}>{msgPreview}</p>
          </div>
        ) : (
          <p className="ga-muted">Nenhuma mensagem recente da equipe.</p>
        )}
        <Link to="/guardian/messages" className="ga-link-all">
          Abrir conversas
        </Link>
      </section>
    </div>
  );
}
