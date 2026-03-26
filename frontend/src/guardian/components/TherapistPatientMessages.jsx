import React, { useEffect, useState } from "react";
import { listActiveLinksForPatient, ensureGuardianThread, GUARDIAN_THREAD_DOC_ID } from "../guardianApi";
import MessageThread from "./MessageThread";
import "../guardianArea.css";

const ADMIN_ROLES = ["admin", "admin_master", "master"];

export default function TherapistPatientMessages({
  patientId,
  clinicaId,
  therapistId,
  userRole,
  profissionalIdPaciente,
}) {
  const [links, setLinks] = useState([]);
  const [selectedUid, setSelectedUid] = useState("");
  const [threadReady, setThreadReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const isAdmin = ADMIN_ROLES.includes(userRole || "");
  const therapistForThread = profissionalIdPaciente || therapistId || "";

  useEffect(() => {
    const load = async () => {
      if (!patientId || !clinicaId) return;
      setLoading(true);
      try {
        const lk = await listActiveLinksForPatient(patientId, clinicaId);
        setLinks(lk);
        if (lk.length && !selectedUid) setSelectedUid(lk[0].guardianUid);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId, clinicaId]);

  useEffect(() => {
    const prep = async () => {
      if (!selectedUid || !patientId || !clinicaId || !therapistForThread) {
        setThreadReady(false);
        return;
      }
      try {
        await ensureGuardianThread({
          patientId,
          guardianUid: selectedUid,
          therapistId: therapistForThread,
          clinicaId,
        });
        setThreadReady(true);
      } catch (e) {
        console.error(e);
        setThreadReady(false);
      }
    };
    prep();
  }, [selectedUid, patientId, clinicaId, therapistForThread]);

  if (loading) return <p className="ga-muted">Carregando mensagens…</p>;

  if (!links.length) {
    return (
      <div className="ga-messages-therapist">
        <h4>Mensagens com responsáveis</h4>
        <p className="ga-muted">Nenhum responsável com acesso ativo. Convide alguém acima.</p>
      </div>
    );
  }

  const canChat = isAdmin || therapistId === profissionalIdPaciente || !profissionalIdPaciente;
  const threadId = selectedUid ? GUARDIAN_THREAD_DOC_ID(patientId, selectedUid) : "";

  return (
    <div className="ga-messages-therapist">
      <h4>Mensagens com responsáveis</h4>
      {!profissionalIdPaciente && (
        <p className="ga-muted">
          Este paciente não tem profissional responsável na ficha. As mensagens usarão seu usuário como
          terapeuta na conversa.
        </p>
      )}
      {profissionalIdPaciente && therapistId !== profissionalIdPaciente && !isAdmin && (
        <p className="ga-error">
          Apenas o profissional vinculado ao paciente ou um administrador pode responder nesta conversa.
        </p>
      )}
      {links.length > 1 && (
        <label className="ga-select-label">
          Responsável:{" "}
          <select
            className="ga-input"
            value={selectedUid}
            onChange={(e) => {
              setSelectedUid(e.target.value);
              setThreadReady(false);
            }}
          >
            {links.map((l) => (
              <option key={l.guardianUid} value={l.guardianUid}>
                {l.invitedEmail || l.guardianUid}
              </option>
            ))}
          </select>
        </label>
      )}
      {canChat && threadReady && (
        <MessageThread
          threadId={threadId}
          mode="therapist"
          currentUserId={therapistId}
          therapistIdForRead={therapistForThread}
          guardianUidForRead={selectedUid}
        />
      )}
      {!canChat && <p className="ga-muted">Você pode visualizar quando for o profissional responsável.</p>}
    </div>
  );
}
