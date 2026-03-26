import React, { useState, useEffect } from "react";
import { PROGRAM_STATUS } from "../../aba/abaApi";
import "./AbaModule.css";

const STATUS_OPTIONS = [
  { value: PROGRAM_STATUS.ACTIVE, label: "Ativo" },
  { value: PROGRAM_STATUS.PAUSED, label: "Pausado" },
  { value: PROGRAM_STATUS.MASTERED, label: "Dominado" },
];

export default function ProgramForm({ open, initial, onSubmit, onClose }) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [status, setStatus] = useState(PROGRAM_STATUS.ACTIVE);

  useEffect(() => {
    if (!open) return;
    setNome(initial?.nome || "");
    setDescricao(initial?.descricao || "");
    setObjetivo(initial?.objetivo || "");
    setStatus(initial?.status || PROGRAM_STATUS.ACTIVE);
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ nome, descricao, objetivo, status });
  };

  return (
    <div className="aba-modal-overlay" onClick={onClose}>
      <div className="aba-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{initial?.id ? "Editar programa" : "Novo programa"}</h3>
        <form onSubmit={handleSubmit}>
          <div className="aba-form-field">
            <label htmlFor="aba-nome">Nome</label>
            <input id="aba-nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="aba-form-field">
            <label htmlFor="aba-desc">Descrição (opcional)</label>
            <textarea id="aba-desc" rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="aba-form-field">
            <label htmlFor="aba-obj">Objetivo (opcional)</label>
            <textarea id="aba-obj" rows={2} value={objetivo} onChange={(e) => setObjetivo(e.target.value)} />
          </div>
          {initial?.id && (
            <div className="aba-form-field">
              <label htmlFor="aba-st">Status</label>
              <select id="aba-st" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="aba-modal-actions">
            <button type="button" className="aba-btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="aba-btn aba-btn--primary">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
