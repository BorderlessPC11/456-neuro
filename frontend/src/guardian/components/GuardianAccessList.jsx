import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import {
  listInvitationsForPatient,
  listActiveLinksForPatient,
  revokeInvitation,
  revokeGuardianFullAccess,
  INVITE_STATUS,
} from "../guardianApi";
import "../guardianArea.css";

async function nomeUsuario(uid) {
  if (!uid) return "—";
  const snap = await getDoc(doc(db, "usuarios", uid));
  if (!snap.exists()) return uid.slice(0, 8) + "…";
  return snap.data().nome || snap.data().email || uid;
}

export default function GuardianAccessList({ patientId, clinicaId, refreshKey }) {
  const [invites, setInvites] = useState([]);
  const [links, setLinks] = useState([]);
  const [names, setNames] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!patientId || !clinicaId) return;
    setLoading(true);
    try {
      const [inv, lk] = await Promise.all([
        listInvitationsForPatient(patientId, clinicaId),
        listActiveLinksForPatient(patientId, clinicaId),
      ]);
      setInvites(inv);
      setLinks(lk);
      const uids = [...new Set(lk.map((l) => l.guardianUid).filter(Boolean))];
      const map = {};
      await Promise.all(
        uids.map(async (uid) => {
          map[uid] = await nomeUsuario(uid);
        })
      );
      setNames(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [patientId, clinicaId, refreshKey]);

  const now = Date.now();

  const revokeInvite = async (id) => {
    if (!window.confirm("Revogar este convite?")) return;
    await revokeInvitation(id);
    load();
  };

  const revokeLink = async (guardianUid) => {
    if (!window.confirm("Revogar acesso deste responsável? Ele deixa de ver dados imediatamente.")) return;
    await revokeGuardianFullAccess(patientId, guardianUid);
    load();
  };

  if (loading) return <p className="ga-muted">Carregando acessos…</p>;

  return (
    <div className="ga-access-list">
      <h4>Convites e acessos</h4>
      <div className="ga-subsection">
        <strong>Pendentes / histórico</strong>
        <ul className="ga-list">
          {invites.length === 0 && <li className="ga-muted">Nenhum convite registrado.</li>}
          {invites.map((inv) => {
            const exp = inv.expiresAt?.toMillis?.() || 0;
            const expired = exp && now > exp;
            const label =
              inv.status === INVITE_STATUS.ACCEPTED
                ? "Aceito"
                : inv.status === INVITE_STATUS.REVOKED
                  ? "Revogado"
                  : expired
                    ? "Expirado"
                    : "Pendente";
            return (
              <li key={inv.id} className="ga-list-item">
                <span>{inv.email}</span>
                <span className="ga-badge">{label}</span>
                {inv.status === INVITE_STATUS.PENDING && !expired && (
                  <button type="button" className="ga-btn ga-btn-small" onClick={() => revokeInvite(inv.id)}>
                    Revogar convite
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="ga-subsection">
        <strong>Responsáveis com acesso ativo</strong>
        <ul className="ga-list">
          {links.length === 0 && <li className="ga-muted">Nenhum responsável ativo.</li>}
          {links.map((l) => (
            <li key={l.guardianUid} className="ga-list-item">
              <span>{names[l.guardianUid] || l.invitedEmail || l.guardianUid}</span>
              <button type="button" className="ga-btn ga-btn-small" onClick={() => revokeLink(l.guardianUid)}>
                Revogar acesso
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
