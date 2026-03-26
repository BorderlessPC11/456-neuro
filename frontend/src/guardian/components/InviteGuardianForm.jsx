import React, { useState } from "react";
import { createInvitation } from "../guardianApi";
import "../guardianArea.css";

export default function InviteGuardianForm({ patientId, clinicaId, therapistId, patientNome, onCreated }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [copyUrl, setCopyUrl] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setCopyUrl("");
    setBusy(true);
    try {
      const inviteId = await createInvitation({
        patientId,
        clinicaId,
        email,
        createdBy: therapistId,
        patientNome,
      });
      const base = `${window.location.origin}/guardian/register/${inviteId}`;
      setCopyUrl(base);
      setEmail("");
      onCreated?.();
    } catch (er) {
      setErr(er.message || "Não foi possível criar o convite.");
    } finally {
      setBusy(false);
    }
  };

  const copy = () => {
    if (!copyUrl) return;
    navigator.clipboard.writeText(copyUrl).catch(() => {});
  };

  return (
    <div className="ga-invite-form">
      <h4>Convidar responsável</h4>
      <p className="ga-muted">
        Envie o link abaixo por WhatsApp ou e-mail. O responsável deve usar o mesmo e-mail do convite ao
        cadastrar a senha.
      </p>
      <form onSubmit={handleSubmit} className="ga-row">
        <input
          type="email"
          required
          placeholder="E-mail do responsável"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="ga-input"
        />
        <button type="submit" className="ga-btn ga-btn-primary" disabled={busy}>
          {busy ? "…" : "Gerar convite"}
        </button>
      </form>
      {err && <p className="ga-error">{err}</p>}
      {copyUrl && (
        <div className="ga-copy-box">
          <div className="ga-copy-url">{copyUrl}</div>
          <button type="button" className="ga-btn" onClick={copy}>
            Copiar link
          </button>
        </div>
      )}
    </div>
  );
}
