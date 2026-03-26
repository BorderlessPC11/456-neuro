import React, { useState, useCallback } from "react";
import { RESPONSE_TYPE_BY_KEY } from "../../constants/abaResponseTypes";
import "./AbaModule.css";

export default function ResponseButton({ responseKey, onPress, disabled }) {
  const meta = RESPONSE_TYPE_BY_KEY[responseKey];
  const [pulse, setPulse] = useState(false);

  const handleClick = useCallback(() => {
    if (disabled) return;
    setPulse(true);
    window.setTimeout(() => setPulse(false), 220);
    onPress(responseKey);
  }, [disabled, onPress, responseKey]);

  if (!meta) return null;

  return (
    <button
      type="button"
      className={`aba-response-btn ${pulse ? "aba-response-btn--pulse" : ""}`}
      style={{ backgroundColor: meta.color }}
      onClick={handleClick}
      disabled={disabled}
    >
      <span className="aba-response-btn__label">{meta.label}</span>
      <span className="aba-response-btn__sublabel">{meta.sublabel}</span>
    </button>
  );
}
