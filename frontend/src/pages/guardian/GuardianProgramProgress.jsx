import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { guardianHasPatientLink } from "../../guardian/guardianApi";
import { getProgram } from "../../aba/abaApi";
import GuardianProgressView from "../../guardian/components/GuardianProgressView";
import "../../guardian/guardianArea.css";

export default function GuardianProgramProgress() {
  const { programId } = useParams();
  const [searchParams] = useSearchParams();
  const patientIdParam = searchParams.get("patientId") || "";
  const { user, currentUserData } = useAuth();
  const clinicaId = currentUserData?.clinicaId || "";
  const uid = user?.uid || "";

  const [program, setProgram] = useState(null);
  const [allowed, setAllowed] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!programId || !clinicaId || !uid) return;
      setErr("");
      try {
        const p = await getProgram(programId);
        if (cancelled) return;
        if (!p || p.clinicaId !== clinicaId) {
          setAllowed(false);
          setErr("Programa não encontrado.");
          return;
        }
        const pid = patientIdParam || p.patientId;
        const ok = await guardianHasPatientLink(uid, clinicaId, pid);
        if (cancelled) return;
        if (!ok || p.patientId !== pid) {
          setAllowed(false);
          setErr("Você não tem acesso a este programa.");
          return;
        }
        setProgram(p);
        setAllowed(true);
      } catch (e) {
        if (!cancelled) {
          setAllowed(false);
          setErr(e.message || "Erro ao carregar.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [programId, clinicaId, uid, patientIdParam]);

  if (allowed === null) return <p>Carregando…</p>;

  if (!allowed || !program) {
    return (
      <div>
        <p className="ga-error">{err || "Acesso negado."}</p>
        <Link to="/guardian">Voltar ao início</Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/guardian/progress">← Voltar à lista de programas</Link>
      <GuardianProgressView
        programId={programId}
        clinicaId={clinicaId}
        programName={program.nome}
      />
    </div>
  );
}
