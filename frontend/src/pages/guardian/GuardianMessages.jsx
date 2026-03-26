import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { listLinksForGuardian, getPatient, ensureGuardianThread } from "../../guardian/guardianApi";
import MessageThread from "../../guardian/components/MessageThread";
import "../../guardian/guardianArea.css";

export default function GuardianMessages() {
  const { user, currentUserData } = useAuth();
  const clinicaId = currentUserData?.clinicaId || "";
  const uid = user?.uid || "";

  const [links, setLinks] = useState([]);
  const [childLabels, setChildLabels] = useState({});
  const [patientId, setPatientId] = useState("");
  const [patient, setPatient] = useState(null);
  const [threadId, setThreadId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!uid || !clinicaId) return;
      const lk = await listLinksForGuardian(uid, clinicaId);
      setLinks(lk);
      if (lk.length && !patientId) setPatientId(lk[0].patientId);
    })();
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
    (async () => {
      if (!patientId) return;
      const p = await getPatient(patientId);
      setPatient(p);
    })();
  }, [patientId]);

  useEffect(() => {
    (async () => {
      if (!patientId || !uid || !clinicaId) {
        setThreadId("");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const therapistId = patient?.profissionalId || "";
        if (!therapistId) {
          setThreadId("");
          setLoading(false);
          return;
        }
        const tid = await ensureGuardianThread({
          patientId,
          guardianUid: uid,
          therapistId,
          clinicaId,
        });
        setThreadId(tid || "");
      } catch (e) {
        console.error(e);
        setThreadId("");
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId, uid, clinicaId, patient?.profissionalId]);

  if (!links.length) return <p className="ga-muted">Sem vínculo ativo.</p>;

  return (
    <div>
      <h1>Mensagens</h1>
      <p className="ga-muted">Conversa com o terapeuta responsável pela criança na ficha.</p>
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
      {!patient?.profissionalId && !loading && (
        <p className="ga-error">A clínica ainda não indicou um profissional responsável. Não é possível enviar mensagens.</p>
      )}
      {loading && <p>Carregando…</p>}
      {!loading && threadId && patient?.profissionalId && (
        <MessageThread
          threadId={threadId}
          mode="guardian"
          currentUserId={uid}
          therapistIdForRead={patient.profissionalId}
          guardianUidForRead={uid}
        />
      )}
    </div>
  );
}
