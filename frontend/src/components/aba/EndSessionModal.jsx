import React from "react";
import { RESPONSE_TYPES } from "../../constants/abaResponseTypes";
import "./AbaModule.css";

export default function EndSessionModal({ open, counts, total, taxaIndependencia, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="aba-modal-overlay" onClick={onCancel}>
      <div className="aba-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Encerrar sessão?</h3>
        <p style={{ color: "#64748b", marginTop: 0 }}>Resumo desta sessão:</p>
        <p>
          <strong>Total de tentativas:</strong> {total}
        </p>
        <p>
          <strong>Taxa de independência:</strong> {taxaIndependencia.toFixed(1)}%
        </p>
        <ul style={{ paddingLeft: "1.25rem", margin: "0.5rem 0" }}>
          {RESPONSE_TYPES.map((t) => (
            <li key={t.key}>
              {t.label}: {counts[t.key] || 0}
            </li>
          ))}
        </ul>
        <div className="aba-modal-actions">
          <button type="button" className="aba-btn" onClick={onCancel}>
            Voltar
          </button>
          <button type="button" className="aba-btn aba-btn--primary" onClick={onConfirm}>
            Confirmar e ver progresso
          </button>
        </div>
      </div>
    </div>
  );
}
