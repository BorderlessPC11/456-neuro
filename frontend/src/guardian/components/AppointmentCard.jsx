import React from "react";
import "../guardianArea.css";

const STATUS_PT = {
  scheduled: "Agendada",
  confirmed: "Confirmada",
  canceled: "Cancelada",
  rescheduled: "Reagendada",
  no_show: "Falta",
  completed: "Realizada",
};

export default function AppointmentCard({ appointment, therapistName, therapyName, variant }) {
  const st = STATUS_PT[appointment.status] || appointment.status || "—";
  return (
    <div className={`ga-appt-card ga-appt-card--${variant}`}>
      <div className="ga-appt-date">
        <strong>{appointment.date}</strong> {appointment.time && `às ${appointment.time}`}
      </div>
      <div className="ga-appt-meta">{therapyName}</div>
      <div className="ga-appt-meta">Profissional: {therapistName}</div>
      <div className="ga-appt-status">{st}</div>
    </div>
  );
}
