/**
 * Month / week calendar for agendamentos.
 * AgendaGeral previously had only a table — this component adds the calendar grid.
 */

import React, { useMemo } from "react";
import { getAppointmentStatusColor } from "./appointmentStatus";
import "./AppointmentCalendar.css";

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function toISO(d) {
  return d.toISOString().split("T")[0];
}

function padWeekStartMonday(d) {
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return addDays(d, mondayOffset);
}

export default function AppointmentCalendar({
  appointments,
  pacientes,
  view,
  anchorDate,
  onNavigate,
  onSelectAppointment,
}) {
  const byDate = useMemo(() => {
    const m = {};
    (appointments || []).forEach((a) => {
      const key = a.date;
      if (!key) return;
      if (!m[key]) m[key] = [];
      m[key].push(a);
    });
    Object.keys(m).forEach((k) => {
      m[k].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    });
    return m;
  }, [appointments]);

  if (view === "week") {
    const start = padWeekStartMonday(new Date(anchorDate));
    const days = [];
    for (let i = 0; i < 7; i++) days.push(addDays(start, i));

    return (
      <div className="appt-cal appt-cal--week">
        <div className="appt-cal-toolbar">
          <button type="button" className="appt-cal-nav" onClick={() => onNavigate(addDays(anchorDate, -7))}>
            Semana anterior
          </button>
          <span className="appt-cal-title">
            {toISO(days[0])} — {toISO(days[6])}
          </span>
          <button type="button" className="appt-cal-nav" onClick={() => onNavigate(addDays(anchorDate, 7))}>
            Próxima semana
          </button>
        </div>
        <div className="appt-cal-week-grid">
          {days.map((d) => {
            const iso = toISO(d);
            const list = byDate[iso] || [];
            const label = d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
            return (
              <div key={iso} className="appt-cal-day-col">
                <div className="appt-cal-day-head">{label}</div>
                <div className="appt-cal-day-body">
                  {list.map((a) => {
                    const nome =
                      pacientes[a.patientId]?.nome || pacientes[a.patientId]?.nomeCompleto || "Paciente";
                    const col = getAppointmentStatusColor(a.status);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        className="appt-cal-block"
                        style={{ borderLeft: `4px solid ${col}` }}
                        onClick={() => onSelectAppointment(a)}
                      >
                        <span className="appt-cal-block-time">{a.time || "--:--"}</span>
                        <span className="appt-cal-block-name">{nome}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const monthStart = startOfMonth(new Date(anchorDate));
  const gridStart = padWeekStartMonday(monthStart);
  const cells = [];
  for (let i = 0; i < 42; i++) cells.push(addDays(gridStart, i));

  return (
    <div className="appt-cal appt-cal--month">
      <div className="appt-cal-toolbar">
        <button type="button" className="appt-cal-nav" onClick={() => onNavigate(new Date(anchorDate.getFullYear(), anchorDate.getMonth() - 1, 1))}>
          Mês anterior
        </button>
        <span className="appt-cal-title">
          {anchorDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </span>
        <button type="button" className="appt-cal-nav" onClick={() => onNavigate(new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 1))}>
          Próximo mês
        </button>
      </div>
      <div className="appt-cal-dow">
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
          <div key={d} className="appt-cal-dow-cell">
            {d}
          </div>
        ))}
      </div>
      <div className="appt-cal-month-grid">
        {cells.map((d) => {
          const iso = toISO(d);
          const inMonth = d.getMonth() === anchorDate.getMonth();
          const list = (byDate[iso] || []).slice(0, 4);
          return (
            <div key={iso} className={`appt-cal-cell ${inMonth ? "" : "appt-cal-cell--muted"}`}>
              <div className="appt-cal-cell-date">{d.getDate()}</div>
              <div className="appt-cal-cell-list">
                {list.map((a) => {
                  const nome =
                    pacientes[a.patientId]?.nome || pacientes[a.patientId]?.nomeCompleto || "?";
                  const col = getAppointmentStatusColor(a.status);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      className="appt-cal-pill"
                      style={{ background: col }}
                      title={nome}
                      onClick={() => onSelectAppointment(a)}
                    >
                      {a.time?.slice(0, 5) || ""} {nome.slice(0, 12)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
