import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail, signOut } from "firebase/auth";
import { db, getSecondaryAuth } from "../../firebase";
import { ROLES } from "../../auth/roles";

export async function listTherapistsByClinic(clinicaId) {
  const q = query(collection(db, "profissionais"), where("clinicaId", "==", clinicaId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createTherapistProfile({
  clinicaId,
  nome,
  email,
  celular,
  registro,
  especialidade,
  publico,
  createAuthUser = false,
  tempPassword,
}) {
  let authUid = null;
  const normalizedEmail = (email || "").trim().toLowerCase();

  if (createAuthUser) {
    const secondaryAuth = getSecondaryAuth();
    const methods = await fetchSignInMethodsForEmail(secondaryAuth, normalizedEmail);
    if (methods.length > 0) throw new Error("Este e-mail já possui conta no sistema.");
    const cred = await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, tempPassword);
    authUid = cred.user.uid;
    await signOut(secondaryAuth);
  }

  const createdAt = Timestamp.now();
  return addDoc(collection(db, "profissionais"), {
    clinicaId,
    nome: nome.trim(),
    email: normalizedEmail,
    celular: celular || "",
    registro: registro.trim(),
    especialidade: especialidade || "",
    publico: publico || "Pediatria",
    ativo: true,
    uid: authUid,
    role: ROLES.TERAPEUTA,
    createdAt,
    criadoEm: createdAt,
  });
}

export async function updateTherapistStatus(id, ativo) {
  await updateDoc(doc(db, "profissionais", id), { ativo });
}

export async function removeTherapist(id) {
  await deleteDoc(doc(db, "profissionais", id));
}
