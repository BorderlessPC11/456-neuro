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
import { db } from "../../firebase";

export async function listUsersByClinic(clinicaId) {
  const q = query(collection(db, "usuarios"), where("clinicaId", "==", clinicaId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createStaffProfile({ nome, email, cpf, telefone, whatsapp, role, clinicaId }) {
  const createdAt = Timestamp.now();
  return addDoc(collection(db, "usuarios"), {
    nome: nome.trim(),
    email: (email || "").trim().toLowerCase(),
    cpf: cpf || "",
    telefone: telefone || "",
    whatsapp: whatsapp || "",
    role,
    clinicaId,
    ativo: true,
    createdAt,
    criadoEm: createdAt,
  });
}

export async function updateStaffProfile(userId, patch) {
  await updateDoc(doc(db, "usuarios", userId), patch);
}

export async function deleteStaffProfile(userId) {
  await deleteDoc(doc(db, "usuarios", userId));
}
