/**
 * Status pill for appointments — same colors/labels as calendar and list (appointmentStatus.js).
 */
import React from "react";
import { getAppointmentStatusColor, APPOINTMENT_STATUS_LABELS } from "./appointmentStatus";
import "./StatusBadge.css";

export default function AppointmentStatusBadge({ status, className = "" }) {
  const s = status || "scheduled";
  const label = APPOINTMENT_STATUS_LABELS[s] || s;
  return (
    <span
      className={`appt-status-badge ${className}`.trim()}
      style={{ background: getAppointmentStatusColor(s) }}
    >
      {label}
    </span>
  );
}
