import { Timestamp, addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { normalizeRole } from "../../auth/roles";

const INVITES_COLLECTION = "user_invites";
const EXPIRES_IN_DAYS = 7;

export async function createUserInvite({ email, role, clinicaId, createdByUid }) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);
  return addDoc(collection(db, INVITES_COLLECTION), {
    email: (email || "").trim().toLowerCase(),
    role: normalizeRole(role),
    clinicaId,
    status: "pending",
    createdBy: createdByUid,
    createdAt: Timestamp.fromDate(now),
    expiresAt: Timestamp.fromDate(expiresAt),
  });
}

export async function getInviteById(inviteId) {
  const snap = await getDoc(doc(db, INVITES_COLLECTION, inviteId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function acceptUserInvite(inviteId, uid) {
  await updateDoc(doc(db, INVITES_COLLECTION, inviteId), {
    status: "accepted",
    acceptedBy: uid,
    acceptedAt: Timestamp.now(),
  });
}
