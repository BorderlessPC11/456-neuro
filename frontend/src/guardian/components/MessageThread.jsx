import React, { useEffect, useState, useRef } from "react";
import {
  subscribeThreadMessages,
  sendGuardianMessage,
  markMessagesReadForGuardian,
  markMessagesReadForTherapist,
} from "../guardianApi";
import MessageBubble from "./MessageBubble";
import "../guardianArea.css";

const MAX_LEN = 1000;

export default function MessageThread({
  threadId,
  mode,
  currentUserId,
  therapistIdForRead,
  guardianUidForRead,
}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!threadId) return undefined;
    const unsub = subscribeThreadMessages(threadId, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [threadId]);

  useEffect(() => {
    if (!threadId || !currentUserId) return undefined;
    const t = window.setTimeout(() => {
      if (mode === "guardian" && guardianUidForRead) {
        markMessagesReadForGuardian(threadId, guardianUidForRead);
      } else if (mode === "therapist" && therapistIdForRead) {
        markMessagesReadForTherapist(threadId, therapistIdForRead);
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [threadId, mode, currentUserId, therapistIdForRead, guardianUidForRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || !threadId || !currentUserId) return;
    setSending(true);
    try {
      await sendGuardianMessage({
        threadId,
        senderId: currentUserId,
        senderRole: mode === "guardian" ? "guardian" : "therapist",
        text: t,
      });
      setText("");
    } catch (err) {
      alert(err.message || "Não foi possível enviar.");
    } finally {
      setSending(false);
    }
  };

  if (!threadId) {
    return <p className="ga-muted">Selecione um responsável para conversar.</p>;
  }

  return (
    <div className="ga-thread">
      <div className="ga-thread-messages">
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            text={m.text}
            senderRole={m.senderRole}
            sentAt={m.sentAt}
            isMine={
              (mode === "guardian" && m.senderRole === "guardian") ||
              (mode === "therapist" && m.senderRole === "therapist")
            }
          />
        ))}
        <div ref={bottomRef} />
      </div>
      <form className="ga-thread-input-row" onSubmit={handleSend}>
        <div className="ga-thread-input-wrap">
          <textarea
            className="ga-thread-textarea"
            rows={2}
            maxLength={MAX_LEN}
            placeholder="Escreva uma mensagem…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <span className="ga-char-count">
            {text.length}/{MAX_LEN}
          </span>
        </div>
        <button type="submit" className="ga-btn ga-btn-primary" disabled={sending || !text.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}
