/**
 * Overlap detection for therapist scheduling. New for scheduling module.
 */

export function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const parts = timeStr.trim().split(":");
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

export function intervalsOverlapSameDay(dateA, startA, durA, dateB, startB, durB) {
  if (!dateA || !dateB || dateA !== dateB) return false;
  const a0 = parseTimeToMinutes(startA);
  const a1 = a0 + (Number(durA) || 50);
  const b0 = parseTimeToMinutes(startB);
  const b1 = b0 + (Number(durB) || 50);
  return a0 < b1 && b0 < a1;
}

export function findTherapistConflicts(existing, candidate) {
  if (!candidate?.professionalId) return [];
  const dur = candidate.durationMinutes ?? 50;
  return existing.filter(
    (ag) =>
      ag.professionalId === candidate.professionalId &&
      ag.id !== candidate.ignoreId &&
      intervalsOverlapSameDay(ag.date, ag.time, ag.durationMinutes ?? 50, candidate.date, candidate.time, dur)
  );
}

export function isAppointmentDateOnOrBeforeToday(dateStr) {
  if (!dateStr) return false;
  const today = new Date().toISOString().split("T")[0];
  return dateStr <= today;
}
