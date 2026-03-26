import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { acceptUserInvite, getInviteById } from "../features/users/invitesApi";
import logo from "../assets/logo.png";

export default function InviteRegister() {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", senha: "", confirmarSenha: "" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!inviteId) throw new Error("Convite inválido.");
        const data = await getInviteById(inviteId);
        if (!data) throw new Error("Convite não encontrado.");
        if (data.status !== "pending") throw new Error("Este convite já foi utilizado.");
        if (data.expiresAt?.toDate && data.expiresAt.toDate() < new Date()) throw new Error("Convite expirado.");
        if (!cancelled) {
          setInvite(data);
          setForm((prev) => ({ ...prev, email: data.email || "" }));
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Não foi possível carregar o convite.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inviteId]);

  const normalizedEmail = useMemo(() => (form.email || "").trim().toLowerCase(), [form.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!invite) return;
    if ((form.senha || "").length < 6) return setError("A senha deve ter pelo menos 6 caracteres.");
    if (form.senha !== form.confirmarSenha) return setError("As senhas não coincidem.");
    if (normalizedEmail !== (invite.email || "").trim().toLowerCase()) {
      return setError("Use o mesmo e-mail do convite.");
    }

    try {
      setBusy(true);
      const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, form.senha);
      const uid = cred.user.uid;
      await setDoc(doc(db, "usuarios", uid), {
        uid,
        nome: form.nome.trim(),
        email: normalizedEmail,
        role: invite.role,
        clinicaId: invite.clinicaId,
        ativo: true,
        createdAt: new Date().toISOString(),
        criadoEm: new Date().toISOString(),
      });
      await acceptUserInvite(inviteId, uid);
      navigate("/dashboard", { replace: true });
    } catch (e2) {
      setError(e2.message || "Erro ao criar conta.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="ga-register-page"><p>Carregando convite...</p></div>;
  if (error && !invite) return <div className="ga-register-page"><p>{error}</p><Link to="/">Voltar</Link></div>;

  return (
    <div className="ga-register-page">
      <img src={logo} alt="" className="ga-register-logo" />
      <h2>Cadastro via convite</h2>
      <p className="ga-muted">Você foi convidado para entrar na clínica com perfil <strong>{invite?.role}</strong>.</p>
      <form onSubmit={handleSubmit} className="ga-register-form">
        <label>
          Nome completo
          <input className="ga-input" value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} required />
        </label>
        <label>
          E-mail (do convite)
          <input className="ga-input" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
        </label>
        <label>
          Senha
          <input className="ga-input" type="password" value={form.senha} onChange={(e) => setForm((p) => ({ ...p, senha: e.target.value }))} minLength={6} required />
        </label>
        <label>
          Confirmar senha
          <input className="ga-input" type="password" value={form.confirmarSenha} onChange={(e) => setForm((p) => ({ ...p, confirmarSenha: e.target.value }))} minLength={6} required />
        </label>
        {error && <p className="ga-error">{error}</p>}
        <button className="ga-btn ga-btn-primary" type="submit" disabled={busy}>
          {busy ? "Criando conta..." : "Criar conta"}
        </button>
      </form>
      <p className="ga-muted"><Link to="/">Já tenho conta</Link></p>
    </div>
  );
}
