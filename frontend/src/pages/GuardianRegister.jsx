import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { getInvitationPublic, acceptInvitationAndSetup, normEmail } from "../guardian/guardianApi";
import logo from "../assets/logo.png";
import "../guardian/guardianArea.css";

/**
 * Registration via invite link. Flow documented in guardian/guardianApi.js header.
 */
export default function GuardianRegister() {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [loadErr, setLoadErr] = useState("");
  const [nome, setNome] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!inviteId) {
        setLoadErr("Convite inválido.");
        return;
      }
      try {
        const data = await getInvitationPublic(inviteId);
        if (cancelled) return;
        if (!data) {
          setLoadErr("Este convite não está mais disponível ou expirou.");
          return;
        }
        setInvite(data);
      } catch (e) {
        if (!cancelled) setLoadErr(e.message || "Erro ao carregar convite.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inviteId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (password.length < 6) {
      setErr("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== password2) {
      setErr("As senhas não coincidem.");
      return;
    }
    if (!invite) return;
    setBusy(true);
    try {
      const em = normEmail(invite.email);
      const cred = await createUserWithEmailAndPassword(auth, em, password);
      const uid = cred.user.uid;
      if (normEmail(cred.user.email) !== em) {
        throw new Error("Use o mesmo e-mail para o qual o convite foi enviado.");
      }

      await setDoc(doc(db, "usuarios", uid), {
        nome: nome.trim() || em,
        email: em,
        role: "guardian",
        clinicaId: invite.clinicaId,
        uid,
        createdAt: new Date().toISOString(),
        criadoEm: new Date().toISOString(),
      });

      await acceptInvitationAndSetup({
        inviteId,
        guardianUid: uid,
        nome: nome.trim(),
        clinicaId: invite.clinicaId,
        patientId: invite.patientId,
        grantedByFromInvite: invite.createdBy,
      });

      navigate("/guardian", { replace: true });
    } catch (er) {
      if (er.code === "auth/email-already-in-use") {
        setErr("Este e-mail já possui conta. Faça login e peça um novo convite se necessário.");
      } else {
        setErr(er.message || "Não foi possível concluir o cadastro.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (loadErr) {
    return (
      <div className="ga-register-page">
        <img src={logo} alt="" className="ga-register-logo" />
        <p className="ga-error">{loadErr}</p>
        <Link to="/">Voltar ao login</Link>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="ga-register-page">
        <img src={logo} alt="" className="ga-register-logo" />
        <p>Carregando convite…</p>
      </div>
    );
  }

  return (
    <div className="ga-register-page">
      <img src={logo} alt="" className="ga-register-logo" />
      <h2>Cadastro — área do responsável</h2>
      <p className="ga-muted">
        Você foi convidado a acompanhar <strong>{invite.patientNome || "seu filho(a)"}</strong> na clínica.
      </p>
      <p className="ga-muted">
        E-mail do convite: <strong>{invite.email}</strong>
      </p>
      <form onSubmit={handleSubmit} className="ga-register-form">
        <label>
          Seu nome
          <input className="ga-input" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </label>
        <label>
          Senha
          <input
            className="ga-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>
        <label>
          Confirmar senha
          <input
            className="ga-input"
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
            minLength={6}
          />
        </label>
        {err && <p className="ga-error">{err}</p>}
        <button type="submit" className="ga-btn ga-btn-primary" disabled={busy}>
          {busy ? "Criando conta…" : "Criar conta e entrar"}
        </button>
      </form>
      <p className="ga-muted">
        <Link to="/">Já tenho conta</Link>
      </p>
    </div>
  );
}
