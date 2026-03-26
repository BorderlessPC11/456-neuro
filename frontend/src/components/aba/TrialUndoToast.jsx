import React, { useEffect, useState } from "react";
import { RESPONSE_TYPE_BY_KEY } from "../../constants/abaResponseTypes";
import "./AbaModule.css";

const DURATION_MS = 5000;

export default function TrialUndoToast({ toastId, lastTrialKey, onUndo, onExpire }) {
  const [remaining, setRemaining] = useState(DURATION_MS);

  useEffect(() => {
    if (!toastId || !lastTrialKey) return undefined;
    setRemaining(DURATION_MS);
    const start = Date.now();
    const interval = window.setInterval(() => {
      const left = Math.max(0, DURATION_MS - (Date.now() - start));
      setRemaining(left);
    }, 50);
    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      setRemaining(0);
      onExpire?.();
    }, DURATION_MS);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [toastId, lastTrialKey, onExpire]);

  if (!lastTrialKey) return null;

  const label = RESPONSE_TYPE_BY_KEY[lastTrialKey]?.label || lastTrialKey;
  const pct = (remaining / DURATION_MS) * 100;

  return (
    <div className="aba-undo-toast">
      <div className="aba-undo-toast__inner" style={{ width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
          <span>Registrado: {label}</span>
          {remaining > 0 && (
            <button type="button" className="aba-undo-btn" onClick={() => onUndo?.()}>
              Desfazer
            </button>
          )}
        </div>
        <div
          style={{
            position: "relative",
            marginTop: "0.5rem",
            height: "3px",
            background: "#334155",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div className="aba-undo-toast__bar" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
