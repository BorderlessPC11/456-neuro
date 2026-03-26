import React from "react";
import { RESPONSE_TYPES } from "../../constants/abaResponseTypes";
import "./AbaModule.css";

export default function LiveBreakdownStrip({ counts, total }) {
  return (
    <div className="aba-breakdown-strip" role="img" aria-label="Distribuição das tentativas">
      {RESPONSE_TYPES.map((t) => {
        const n = counts[t.key] || 0;
        const flex = total > 0 ? n : 0;
        return (
          <div
            key={t.key}
            className="aba-breakdown-seg"
            style={{
              flex: flex > 0 ? `${flex} 1 0` : "0 0 0",
              backgroundColor: t.color,
            }}
          />
        );
      })}
    </div>
  );
}
