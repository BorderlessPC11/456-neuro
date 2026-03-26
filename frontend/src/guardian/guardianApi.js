/**
 * Guardian Area — Firestore API
 *
 * Invitation flow (no outbound email in-app yet):
 * 1. Therapist creates a row in `guardian_invitations` and copies the URL shown in the UI:
 *    {origin}/guardian/register/{inviteId}
 * 2. Guardian opens the link, registers with the same email, and we create `usuarios`,
 *    `guardian_patient_links`, and sync `aba_guardian_access` for ABA shared sessions.
 * 3. Later you can plug SendGrid/Firebase Extensions/etc. to email that URL automatically.
 */

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  setDoc,
  Timestamp,
  writeBatch,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

export const INVITE_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REVOKED: "revoked",
};

export const GUARDIAN_LINK_DOC_ID = (patientId, guardianUid) => `${patientId}_${guardianUid}`;

export const GUARDIAN_THREAD_DOC_ID = (patientId, guardianUid) => `${patientId}_${guardianUid}`;

export function inviteExpiresAt() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return Timestamp.fromDate(d);
}

/** Normalize email for comparisons */
export function normEmail(email) {
  return (email || "").trim().toLowerCase();
}

/** Unauthenticated: load invite for register page */
export async function getInvitationPublic(inviteId) {
  const ref = doc(db, "guardian_invitations", inviteId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data.status !== INVITE_STATUS.PENDING) return null;
  const exp = data.expiresAt?.toMillis?.() || 0;
  if (exp && Date.now() > exp) return null;
  return { id: snap.id, ...data };
}

export async function listInvitationsForPatient(patientId, clinicaId) {
  const q = query(
    collection(db, "guardian_invitations"),
    where("clinicaId", "==", clinicaId),
    where("patientId", "==", patientId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function findBlockingInvitation(patientId, clinicaId, email) {
  const em = normEmail(email);
  const list = await listInvitationsForPatient(patientId, clinicaId);
  const now = Date.now();
  for (const inv of list) {
    if (normEmail(inv.email) !== em) continue;
    if (inv.status === INVITE_STATUS.REVOKED) continue;
    if (inv.status === INVITE_STATUS.ACCEPTED) {
      return { type: "accepted", inv };
    }
    if (inv.status === INVITE_STATUS.PENDING) {
      const exp = inv.expiresAt?.toMillis?.() || 0;
      if (exp && now <= exp) return { type: "pending", inv };
    }
  }
  return null;
}

export async function findActiveLinkByEmailPatient(patientId, clinicaId, email) {
  const em = normEmail(email);
  const q = query(
    collection(db, "guardian_patient_links"),
    where("clinicaId", "==", clinicaId),
    where("patientId", "==", patientId),
    where("active", "==", true)
  );
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    const row = d.data();
    if (normEmail(row.invitedEmail) === em) return { id: d.id, ...row };
  }
  return null;
}

export async function createInvitation({ patientId, clinicaId, email, createdBy, patientNome }) {
  const em = normEmail(email);
  if (!em) throw new Error("Informe um e-mail válido.");

  const block = await findBlockingInvitation(patientId, clinicaId, em);
  if (block?.type === "pending") {
    throw new Error("Já existe um convite pendente para este e-mail neste paciente.");
  }
  if (block?.type === "accepted") {
    throw new Error("Este e-mail já aceitou um convite para este paciente.");
  }

  const existingLink = await findActiveLinkByEmailPatient(patientId, clinicaId, em);
  if (existingLink) {
    throw new Error("Já existe um responsável ativo com este e-mail para este paciente.");
  }

  const ref = doc(collection(db, "guardian_invitations"));
  await setDoc(ref, {
    patientId,
    clinicaId,
    email: em,
    patientNome: patientNome || "",
    status: INVITE_STATUS.PENDING,
    createdBy,
    createdAt: Timestamp.now(),
    expiresAt: inviteExpiresAt(),
  });
  return ref.id;
}

export async function revokeInvitation(inviteId) {
  await updateDoc(doc(db, "guardian_invitations", inviteId), {
    status: INVITE_STATUS.REVOKED,
    revokedAt: Timestamp.now(),
  });
}

export async function acceptInvitationAndSetup({
  inviteId,
  guardianUid,
  nome,
  clinicaId,
  patientId,
  grantedByFromInvite,
}) {
  const inviteRef = doc(db, "guardian_invitations", inviteId);
  const inviteSnap = await getDoc(inviteRef);
  if (!inviteSnap.exists()) throw new Error("Convite inválido.");
  const inv = inviteSnap.data();
  if (inv.status !== INVITE_STATUS.PENDING) throw new Error("Este convite não está mais pendente.");
  const exp = inv.expiresAt?.toMillis?.() || 0;
  if (exp && Date.now() > exp) throw new Error("Este convite expirou.");

  const linkId = GUARDIAN_LINK_DOC_ID(patientId, guardianUid);
  const linkRef = doc(db, "guardian_patient_links", linkId);
  const abaRef = doc(db, "aba_guardian_access", linkId);

  const batch = writeBatch(db);
  batch.update(inviteRef, {
    status: INVITE_STATUS.ACCEPTED,
    acceptedByUid: guardianUid,
    acceptedAt: Timestamp.now(),
  });
  batch.set(
    linkRef,
    {
      guardianUid,
      patientId,
      clinicaId,
      grantedBy: inv.createdBy || grantedByFromInvite,
      grantedAt: Timestamp.now(),
      active: true,
      invitationId: inviteId,
      invitedEmail: inv.email,
    },
    { merge: true }
  );
  batch.set(
    abaRef,
    {
      patientId,
      clinicaId,
      guardianUid,
      invitationId: inviteId,
      concedidoPor: inv.createdBy || grantedByFromInvite,
      concedidoEm: Timestamp.now(),
      revogadoEm: null,
    },
    { merge: true }
  );
  await batch.commit();
}

export async function revokeGuardianFullAccess(patientId, guardianUid) {
  const linkId = GUARDIAN_LINK_DOC_ID(patientId, guardianUid);
  const batch = writeBatch(db);
  batch.set(
    doc(db, "guardian_patient_links", linkId),
    { active: false, revokedAt: Timestamp.now() },
    { merge: true }
  );
  batch.set(
    doc(db, "aba_guardian_access", linkId),
    { revogadoEm: Timestamp.now() },
    { merge: true }
  );
  await batch.commit();
}

export async function listActiveLinksForPatient(patientId, clinicaId) {
  const q = query(
    collection(db, "guardian_patient_links"),
    where("clinicaId", "==", clinicaId),
    where("patientId", "==", patientId),
    where("active", "==", true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function guardianHasPatientLink(guardianUid, clinicaId, patientId) {
  const links = await listLinksForGuardian(guardianUid, clinicaId);
  return links.some((l) => l.patientId === patientId);
}

export async function listLinksForGuardian(guardianUid, clinicaId) {
  const q = query(
    collection(db, "guardian_patient_links"),
    where("clinicaId", "==", clinicaId),
    where("guardianUid", "==", guardianUid),
    where("active", "==", true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getPatient(patientId) {
  const ref = doc(db, "pacientes", patientId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getProfessional(professionalId) {
  if (!professionalId) return null;
  const ref = doc(db, "profissionais", professionalId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getTherapy(therapyId) {
  if (!therapyId) return null;
  const ref = doc(db, "terapias", therapyId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/** Appointments for one patient in clinic */
export async function listAppointmentsForPatient(patientId, clinicaId) {
  const q = query(
    collection(db, "agendamentos"),
    where("clinicaId", "==", clinicaId),
    where("patientId", "==", patientId)
  );
  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  rows.sort((a, b) => {
    const da = (a.date || "").localeCompare(b.date || "");
    if (da !== 0) return da;
    return (a.time || "").localeCompare(b.time || "");
  });
  return rows;
}

export async function ensureGuardianThread({ patientId, guardianUid, therapistId, clinicaId }) {
  const tid = GUARDIAN_THREAD_DOC_ID(patientId, guardianUid);
  const ref = doc(db, "guardian_threads", tid);
  const snap = await getDoc(ref);
  if (snap.exists()) return tid;
  await setDoc(ref, {
    patientId,
    guardianUid,
    therapistId: therapistId || "",
    clinicaId,
    lastMessageAt: Timestamp.now(),
    lastMessagePreview: "",
    createdAt: Timestamp.now(),
  });
  return tid;
}

export async function sendGuardianMessage({ threadId, senderId, senderRole, text }) {
  const t = (text || "").trim();
  if (!t) throw new Error("Mensagem vazia.");
  if (t.length > 1000) throw new Error("Mensagem muito longa (máx. 1000 caracteres).");

  const threadRef = doc(db, "guardian_threads", threadId);
  const threadSnap = await getDoc(threadRef);
  if (!threadSnap.exists()) throw new Error("Conversa não encontrada.");

  const msgRef = doc(collection(db, "guardian_threads", threadId, "messages"));
  const now = Timestamp.now();
  const batch = writeBatch(db);
  batch.set(msgRef, {
    senderId,
    senderRole,
    text: t,
    sentAt: now,
    readByGuardianAt: null,
    readByTherapistAt: null,
  });
  const preview = t.length > 80 ? `${t.slice(0, 80)}…` : t;
  batch.update(threadRef, {
    lastMessageAt: now,
    lastMessagePreview: preview,
  });
  await batch.commit();
  return msgRef.id;
}

export async function markMessagesReadForGuardian(threadId, guardianUid) {
  const threadRef = doc(db, "guardian_threads", threadId);
  const snap = await getDoc(threadRef);
  if (!snap.exists() || snap.data().guardianUid !== guardianUid) return;

  const msgs = await getDocs(collection(db, "guardian_threads", threadId, "messages"));
  const now = Timestamp.now();
  const batch = writeBatch(db);
  let any = false;
  msgs.docs.forEach((d) => {
    const data = d.data();
    if (data.senderRole === "therapist" && !data.readByGuardianAt) {
      batch.update(d.ref, { readByGuardianAt: now });
      any = true;
    }
  });
  if (any) await batch.commit();
}

export async function markMessagesReadForTherapist(threadId, therapistId) {
  const threadRef = doc(db, "guardian_threads", threadId);
  const snap = await getDoc(threadRef);
  if (!snap.exists() || snap.data().therapistId !== therapistId) return;

  const msgs = await getDocs(collection(db, "guardian_threads", threadId, "messages"));
  const now = Timestamp.now();
  const batch = writeBatch(db);
  let any = false;
  msgs.docs.forEach((d) => {
    const data = d.data();
    if (data.senderRole === "guardian" && !data.readByTherapistAt) {
      batch.update(d.ref, { readByTherapistAt: now });
      any = true;
    }
  });
  if (any) await batch.commit();
}

export async function listThreadsForGuardian(guardianUid, clinicaId) {
  const q = query(
    collection(db, "guardian_threads"),
    where("clinicaId", "==", clinicaId),
    where("guardianUid", "==", guardianUid)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function subscribeThreadMessages(threadId, callback) {
  const q = query(
    collection(db, "guardian_threads", threadId, "messages"),
    orderBy("sentAt", "asc")
  );
  return onSnapshot(q, callback);
}
