import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listLinksForGuardian, getPatient } from "../../guardian/guardianApi";
import { listProgramsByPatient } from "../../aba/abaApi";
import "../../guardian/guardianArea.css";

export default function GuardianProgressHub() {
  const { user, currentUserData } = useAuth();
  const clinicaId = currentUserData?.clinicaId || "";
  const uid = user?.uid || "";

  const [links, setLinks] = useState([]);
  const [childLabels, setChildLabels] = useState({});
  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [programs, setPrograms] = useState([]);

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
      setPatientName(p?.nome || p?.nomeCompleto || "");
      const progs = await listProgramsByPatient(patientId, clinicaId);
      setPrograms(progs);
    })();
  }, [patientId, clinicaId]);

  if (!links.length) {
    return <p className="ga-muted">Nenhum vínculo ativo.</p>;
  }

  return (
    <div>
      <h1>Progresso</h1>
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
      {patientName && <p className="ga-muted">{patientName}</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {programs.map((pr) => (
          <li key={pr.id} className="ga-card" style={{ marginBottom: "0.5rem" }}>
            <Link to={`/guardian/programs/${pr.id}?patientId=${encodeURIComponent(patientId)}`}>
              {pr.nome || "Programa"}
            </Link>
          </li>
        ))}
      </ul>
      {programs.length === 0 && <p className="ga-muted">Nenhum programa cadastrado.</p>}
    </div>
  );
}
