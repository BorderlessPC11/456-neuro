/**
 * Queue rows for guardian notifications about appointments.
 * Existing "notificacoes" is for in-app admin broadcasts — this is for async email/push workers.
 */

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "appointment_guardian_notifications";

export async function queueGuardianAppointmentNotification({
  clinicaId,
  patientId,
  eventType,
  appointmentId,
  summary,
}) {
  if (!clinicaId || !patientId || !eventType) return;
  await addDoc(collection(db, COLLECTION), {
    clinicaId,
    patientId,
    eventType,
    appointmentId: appointmentId || null,
    summary: summary || "",
    processed: false,
    createdAt: serverTimestamp(),
  });
}
