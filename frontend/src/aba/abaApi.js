import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  emptyResponseCounts,
  RESPONSE_TYPE_BY_KEY,
} from "../constants/abaResponseTypes";

/** @typedef {'active'|'mastered'|'paused'} AbaProgramStatus */

export const PROGRAM_STATUS = {
  ACTIVE: "active",
  MASTERED: "mastered",
  PAUSED: "paused",
};

/** @param {{ tipoResposta?: string }[]} trials */
export function computeSessionStats(trials) {
  const counts = emptyResponseCounts();
  for (const t of trials) {
    const k = t.tipoResposta;
    if (k && counts[k] !== undefined) counts[k] += 1;
  }
  const total = trials.length;
  const independent = counts.independent || 0;
  const taxaIndependencia = total > 0 ? (independent / total) * 100 : 0;
  return { counts, total, taxaIndependencia };
}

export function independenceRateFromCounts(counts, total) {
  if (total <= 0) return 0;
  return ((counts.independent || 0) / total) * 100;
}

/**
 * Sessions must have taxaIndependencia and totalTrials (finalized sessions).
 * @param {{ taxaIndependencia?: number, totalTrials?: number }[]} finalizedSessions
 */
export function sortSessionsByDateAsc(sessions) {
  return [...sessions].sort((a, b) => (a.data || "").localeCompare(b.data || ""));
}

export function trendLastThreeSessions(finalizedSessions) {
  const ordered = sortSessionsByDateAsc(finalizedSessions);
  const withRate = ordered.filter(
    (s) => typeof s.taxaIndependencia === "number" && (s.totalTrials || 0) > 0
  );
  if (withRate.length < 3) return "stable";
  const last3 = withRate.slice(-3);
  const rates = last3.map((s) => s.taxaIndependencia);
  const avgFirst = (rates[0] + rates[1]) / 2;
  const avgLast = (rates[1] + rates[2]) / 2;
  if (rates[2] > rates[0] + 3) return "improving";
  if (rates[2] < rates[0] - 3) return "regressing";
  if (avgLast > avgFirst + 2) return "improving";
  if (avgLast < avgFirst - 2) return "regressing";
  return "stable";
}

/**
 * @param {{ taxaIndependencia?: number, totalTrials?: number, finalizadaEm?: * }[]} finalizedSessions
 */
export function canMarkMastered(finalizedSessions) {
  const ok = finalizedSessions.filter(
    (s) =>
      s.finalizadaEm &&
      (s.totalTrials || 0) > 0 &&
      typeof s.taxaIndependencia === "number" &&
      s.taxaIndependencia >= 80
  );
  return ok.length >= 3;
}

export function guardianAccessDocId(patientId, guardianUid) {
  return `${patientId}_${guardianUid}`;
}

export async function listProgramsByPatient(patientId, clinicaId) {
  const q = query(
    collection(db, "aba_programs"),
    where("clinicaId", "==", clinicaId),
    where("patientId", "==", patientId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getProgram(programId) {
  const ref = doc(db, "aba_programs", programId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function createProgram({
  patientId,
  clinicaId,
  createdBy,
  nome,
  descricao,
  objetivo,
  status = PROGRAM_STATUS.ACTIVE,
}) {
  return addDoc(collection(db, "aba_programs"), {
    patientId,
    clinicaId,
    createdBy,
    nome: nome || "",
    descricao: descricao || "",
    objetivo: objetivo || "",
    status,
    criadoEm: Timestamp.now(),
  });
}

/**
 * @param {string} programId
 * @param {object} patch
 * @param {{ finalizedSessions?: { taxaIndependencia?: number, totalTrials?: number, finalizadaEm?: * }[] }} [opts]
 */
export async function updateProgram(programId, patch, opts = {}) {
  if (patch.status === PROGRAM_STATUS.MASTERED) {
    const prog = await getProgram(programId);
    const clinicaId = prog?.clinicaId || patch.clinicaId || "";
    const sessions =
      opts.finalizedSessions || (clinicaId ? await listSessionsByProgram(programId, clinicaId) : []);
    const finalized = sessions.filter((s) => s.finalizadaEm);
    if (!canMarkMastered(finalized)) {
      throw new Error(
        "Para marcar como dominado, são necessárias pelo menos 3 sessões finalizadas com taxa de independência de 80% ou mais."
      );
    }
  }
  const ref = doc(db, "aba_programs", programId);
  await updateDoc(ref, patch);
}

export async function listSessionsByProgram(programId, clinicaId) {
  const q = query(
    collection(db, "aba_sessions"),
    where("clinicaId", "==", clinicaId),
    where("programId", "==", programId)
  );
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  return list;
}

export async function listSessionsForPatientGuardian(patientId, clinicaId) {
  const q = query(
    collection(db, "aba_sessions"),
    where("clinicaId", "==", clinicaId),
    where("patientId", "==", patientId),
    where("compartilhadoComResponsavel", "==", true)
  );
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  return list;
}

export async function getSession(sessionId) {
  const ref = doc(db, "aba_sessions", sessionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function createSession({
  programId,
  patientId,
  clinicaId,
  therapistId,
  program,
  appointmentId = null,
  sessionDate = null,
}) {
  if (!program) program = await getProgram(programId);
  if (!program) throw new Error("Programa não encontrado.");
  if (program.status === PROGRAM_STATUS.PAUSED || program.status === PROGRAM_STATUS.MASTERED) {
    throw new Error("Não é possível iniciar sessão para programa pausado ou já dominado.");
  }
  const hoje = new Date();
  const dataISO = sessionDate || hoje.toISOString().split("T")[0];
  return addDoc(collection(db, "aba_sessions"), {
    programId,
    patientId,
    clinicaId,
    therapistId,
    data: dataISO,
    notas: "",
    compartilhadoComResponsavel: false,
    criadoEm: Timestamp.now(),
    appointmentId: appointmentId || null,
  });
}

export async function updateSessionNotes(sessionId, notas) {
  await updateDoc(doc(db, "aba_sessions", sessionId), { notas: notas ?? "" });
}

export async function setSessionShared(sessionId, compartilhadoComResponsavel) {
  await updateDoc(doc(db, "aba_sessions", sessionId), { compartilhadoComResponsavel: !!compartilhadoComResponsavel });
}

/**
 * @param {string} sessionId
 * @param {{ counts: Record<string, number>, total: number, taxaIndependencia: number }} stats
 * @param {string} [notas]
 */
export async function finalizeSession(sessionId, stats, notas) {
  const contagensPorTipo = { ...emptyResponseCounts(), ...stats.counts };
  await updateDoc(doc(db, "aba_sessions", sessionId), {
    finalizadaEm: Timestamp.now(),
    totalTrials: stats.total,
    taxaIndependencia: stats.taxaIndependencia,
    contagensPorTipo,
    notas: notas ?? "",
  });
}

export async function listTrials(sessionId) {
  const trialsRef = collection(db, "aba_sessions", sessionId, "trials");
  const snap = await getDocs(trialsRef);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => {
    const ta = a.criadoEm?.toMillis?.() || 0;
    const tb = b.criadoEm?.toMillis?.() || 0;
    return ta - tb;
  });
  return list;
}

export async function addTrial(sessionId, tipoResposta) {
  if (!RESPONSE_TYPE_BY_KEY[tipoResposta]) {
    throw new Error("Tipo de resposta inválido.");
  }
  return addDoc(collection(db, "aba_sessions", sessionId, "trials"), {
    tipoResposta,
    criadoEm: Timestamp.now(),
  });
}

export async function deleteTrial(sessionId, trialId) {
  await deleteDoc(doc(db, "aba_sessions", sessionId, "trials", trialId));
}

export async function listGuardianAccessByPatient(patientId, clinicaId) {
  const q = query(
    collection(db, "aba_guardian_access"),
    where("clinicaId", "==", clinicaId),
    where("patientId", "==", patientId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function grantGuardianAccess({ patientId, clinicaId, guardianUid, concedidoPor }) {
  const id = guardianAccessDocId(patientId, guardianUid);
  const ref = doc(db, "aba_guardian_access", id);
  await setDoc(
    ref,
    {
      patientId,
      clinicaId,
      guardianUid,
      concedidoPor,
      concedidoEm: Timestamp.now(),
      revogadoEm: null,
    },
    { merge: true }
  );
  return id;
}

export async function revokeGuardianAccess(patientId, guardianUid) {
  const id = guardianAccessDocId(patientId, guardianUid);
  const ref = doc(db, "aba_guardian_access", id);
  await updateDoc(ref, { revogadoEm: Timestamp.now() });
}

export async function listGuardianAccessForGuardian(guardianUid, clinicaId) {
  const q = query(
    collection(db, "aba_guardian_access"),
    where("clinicaId", "==", clinicaId),
    where("guardianUid", "==", guardianUid)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((row) => !row.revogadoEm);
}

export async function listSharedSessionsByProgram(programId, clinicaId) {
  const q = query(
    collection(db, "aba_sessions"),
    where("clinicaId", "==", clinicaId),
    where("programId", "==", programId),
    where("compartilhadoComResponsavel", "==", true)
  );
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => (a.data || "").localeCompare(b.data || ""));
  return list;
}
