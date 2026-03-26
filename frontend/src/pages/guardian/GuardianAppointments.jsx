import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  listLinksForGuardian,
  getPatient,
  listAppointmentsForPatient,
  getProfessional,
  getTherapy,
} from "../../guardian/guardianApi";
import AppointmentCard from "../../guardian/components/AppointmentCard";
import "../../guardian/guardianArea.css";

const UPCOMING = new Set(["scheduled", "confirmed", "rescheduled"]);

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function GuardianAppointments() {
  const { user, currentUserData } = useAuth();
  const clinicaId = currentUserData?.clinicaId || "";
  const uid = user?.uid || "";

  const [links, setLinks] = useState([]);
  const [childLabels, setChildLabels] = useState({});
  const [patientId, setPatientId] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [meta, setMeta] = useState({ profs: {}, terapias: {} });

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
      if (!patientId || !clinicaId) return;
      const ags = await listAppointmentsForPatient(patientId, clinicaId);
      setAppointments(ags);
      const profs = {};
      const terapias = {};
      const profIds = [...new Set(ags.map((a) => a.professionalId).filter(Boolean))];
      const tIds = [...new Set(ags.map((a) => a.therapyId).filter(Boolean))];
      await Promise.all(
        profIds.map(async (id) => {
          const p = await getProfessional(id);
          if (p) profs[id] = p.nome || id;
        })
      );
      await Promise.all(
        tIds.map(async (id) => {
          const t = await getTherapy(id);
          if (t) terapias[id] = t.nome || id;
        })
      );
      setMeta({ profs, terapias });
    })();
  }, [patientId, clinicaId]);

  const today = todayISO();
  const upcoming = appointments.filter(
    (a) =>
      (a.date && a.date >= today && UPCOMING.has(a.status)) ||
      (a.date && a.date >= today && !["canceled", "completed", "no_show"].includes(a.status))
  );
  const past = appointments.filter((a) => a.date < today || ["completed", "canceled", "no_show"].includes(a.status));

  upcoming.sort((a, b) => {
    const c = (a.date || "").localeCompare(b.date || "");
    return c !== 0 ? c : (a.time || "").localeCompare(b.time || "");
  });
  past.sort((a, b) => {
    const c = (b.date || "").localeCompare(a.date || "");
    return c !== 0 ? c : (b.time || "").localeCompare(a.time || "");
  });

  if (!links.length) return <p className="ga-muted">Sem vínculo ativo.</p>;

  return (
    <div>
      <h1>Consultas</h1>
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

      <h2 className="ga-subh">Próximas</h2>
      {upcoming.length === 0 && <p className="ga-muted">Nenhuma consulta futura.</p>}
      {upcoming.map((a) => (
        <AppointmentCard
          key={a.id}
          appointment={a}
          therapistName={meta.profs[a.professionalId] || "—"}
          therapyName={meta.terapias[a.therapyId] || a.therapyName || "—"}
          variant="upcoming"
        />
      ))}

      <h2 className="ga-subh" style={{ marginTop: "2rem" }}>
        Anteriores
      </h2>
      {past.length === 0 && <p className="ga-muted">Nenhum registro anterior.</p>}
      {past.map((a) => (
        <AppointmentCard
          key={a.id}
          appointment={a}
          therapistName={meta.profs[a.professionalId] || "—"}
          therapyName={meta.terapias[a.therapyId] || a.therapyName || "—"}
          variant="past"
        />
      ))}
    </div>
  );
}
