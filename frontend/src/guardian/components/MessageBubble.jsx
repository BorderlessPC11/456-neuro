import React from "react";
import "../guardianArea.css";

export default function MessageBubble({ text, senderRole, sentAt, isMine }) {
  const t =
    sentAt?.toDate?.()?.toLocaleString?.("pt-BR") ||
    (sentAt?.seconds ? new Date(sentAt.seconds * 1000).toLocaleString("pt-BR") : "");

  return (
    <div className={`ga-bubble-row ${isMine ? "ga-bubble-mine" : "ga-bubble-theirs"}`}>
      <div className={`ga-bubble ${isMine ? "ga-bubble--mine" : "ga-bubble--theirs"}`}>
        <div className="ga-bubble-meta">
          {senderRole === "therapist" ? "Terapeuta" : "Responsável"} · {t}
        </div>
        <div className="ga-bubble-text">{text}</div>
      </div>
    </div>
  );
}
