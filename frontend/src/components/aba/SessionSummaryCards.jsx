import React from "react";
import "./AbaModule.css";

const TREND_LABEL = {
  improving: "Em melhora",
  stable: "Estável",
  regressing: "Em regressão",
};

export default function SessionSummaryCards({
  totalSessions,
  totalTrialsAll,
  latestIndependenceRate,
  trend,
  variant = "therapist",
}) {
  const isGuardian = variant === "guardian";
  return (
    <div className="aba-summary-cards">
      <div className="aba-summary-card">
        <div className="aba-summary-card__value">{totalSessions}</div>
        <div className="aba-summary-card__label">{isGuardian ? "Sessões compartilhadas" : "Sessões"}</div>
      </div>
      <div className="aba-summary-card">
        <div className="aba-summary-card__value">{totalTrialsAll}</div>
        <div className="aba-summary-card__label">{isGuardian ? "Atividades registradas (total)" : "Tentativas (total)"}</div>
      </div>
      <div className="aba-summary-card">
        <div className="aba-summary-card__value">
          {typeof latestIndependenceRate === "number" ? `${latestIndependenceRate.toFixed(1)}%` : "—"}
        </div>
        <div className="aba-summary-card__label">
          {isGuardian ? "Progresso na última sessão" : "Última sessão — independência"}
        </div>
      </div>
      <div className="aba-summary-card">
        <div className="aba-summary-card__value">{TREND_LABEL[trend] || trend}</div>
        <div className="aba-summary-card__label">Tendência (últimas 3)</div>
      </div>
    </div>
  );
}
