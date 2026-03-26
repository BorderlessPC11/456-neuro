import React from "react";
import { Link } from "react-router-dom";
import "../guardianArea.css";

export default function ProgramSummaryCard({ programId, patientId, name, latestRate, trendArrow }) {
  const q = patientId ? `?patientId=${encodeURIComponent(patientId)}` : "";
  const rateLabel =
    typeof latestRate === "number" ? `${Math.round(latestRate)}% de progresso na última sessão` : "Sem sessões compartilhadas ainda";

  return (
    <Link to={`/guardian/programs/${programId}${q}`} className="ga-program-card">
      <div className="ga-program-card-title">{name}</div>
      <div className="ga-program-card-rate">{rateLabel}</div>
      <div className="ga-program-card-trend" aria-hidden>
        <span className="ga-trend-arrow">{trendArrow}</span>
        <span className="ga-muted ga-trend-hint">últimas sessões</span>
      </div>
    </Link>
  );
}
