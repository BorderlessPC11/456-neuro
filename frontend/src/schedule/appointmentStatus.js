/**
 * Central appointment status labels and colors for calendar, list, and detail views.
 * Previously: colors were inlined in AgendaGeral.jsx — extracted for consistency.
 */

export const APPOINTMENT_STATUS_LABELS = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  canceled: "Cancelado",
  rescheduled: "Reagendado",
  no_show: "Falta",
  completed: "Concluído",
};

export function getAppointmentStatusColor(status) {
  switch (status) {
    case "scheduled":
      return "#3b82f6";
    case "confirmed":
      return "#22c55e";
    case "canceled":
      return "#ef4444";
    case "rescheduled":
      return "#d97706";
    case "no_show":
      return "#f97316";
    case "completed":
      return "#6b7280";
    default:
      return "#6b7280";
  }
}
