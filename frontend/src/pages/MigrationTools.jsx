import React, { useState } from "react";
import {
  Timestamp,
  collection,
  doc,
  getDocs,
  query,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { isAdminLike } from "../auth/roles";

const COLLECTIONS = ["usuarios", "profissionais", "terapias"];

const normalizeRole = (role = "") => {
  const r = String(role).trim().toLowerCase();
  if (r === "profissional") return "terapeuta";
  if (r === "responsavel") return "guardian";
  return r;
};

function getPatch(collectionName, id, data, now, fallbackClinicaId) {
  const patch = {};

  const normalizedRole = normalizeRole(data.role || "");
  if ((data.role || "") !== normalizedRole && normalizedRole) {
    patch.role = normalizedRole;
  }

  if (!data.createdAt && data.criadoEm) patch.createdAt = data.criadoEm;
  if (!data.createdAt && !data.criadoEm) patch.createdAt = now;
  if (!data.clinicaId && fallbackClinicaId) patch.clinicaId = fallbackClinicaId;

  if (collectionName === "usuarios") {
    if (!data.uid) patch.uid = id;
    if (typeof data.ativo !== "boolean") patch.ativo = true;
  }

  if (collectionName === "profissionais") {
    if (typeof data.ativo !== "boolean") patch.ativo = true;
  }

  if (collectionName === "terapias") {
    if (typeof data.ativo !== "boolean") patch.ativo = true;
  }

  return patch;
}

async function runBackfill({ clinicaId, dryRun }) {
  const now = Timestamp.now();
  const summary = {
    scanned: 0,
    toUpdate: 0,
    updated: 0,
    byCollection: {},
  };

  for (const colName of COLLECTIONS) {
    const q = query(collection(db, colName));
    const snap = await getDocs(q);

    summary.byCollection[colName] = {
      scanned: snap.size,
      toUpdate: 0,
      updated: 0,
      skippedDifferentClinic: 0,
    };
    summary.scanned += snap.size;

    let batch = writeBatch(db);
    let pendingOps = 0;

    for (const row of snap.docs) {
      const data = row.data();
      if (clinicaId && data.clinicaId && data.clinicaId !== clinicaId) {
        summary.byCollection[colName].skippedDifferentClinic += 1;
        continue;
      }
      const patch = getPatch(colName, row.id, data, now, clinicaId);
      const hasChanges = Object.keys(patch).length > 0;

      if (!hasChanges) continue;
      summary.toUpdate += 1;
      summary.byCollection[colName].toUpdate += 1;

      if (!dryRun) {
        batch.update(doc(db, colName, row.id), patch);
        pendingOps += 1;
      }

      if (!dryRun && pendingOps >= 450) {
        await batch.commit();
        summary.updated += pendingOps;
        summary.byCollection[colName].updated += pendingOps;
        batch = writeBatch(db);
        pendingOps = 0;
      }
    }

    if (!dryRun && pendingOps > 0) {
      await batch.commit();
      summary.updated += pendingOps;
      summary.byCollection[colName].updated += pendingOps;
    }
  }

  return summary;
}

export default function MigrationTools() {
  const { currentUserData, role } = useAuth();
  const [busy, setBusy] = useState(false);
  const [dryRunSummary, setDryRunSummary] = useState(null);
  const [runSummary, setRunSummary] = useState(null);
  const [error, setError] = useState("");

  const clinicaId = currentUserData?.clinicaId || "";

  const handleDryRun = async () => {
    setBusy(true);
    setError("");
    setDryRunSummary(null);
    try {
      const result = await runBackfill({ clinicaId, dryRun: true });
      setDryRunSummary(result);
    } catch (e) {
      setError(e.message || "Falha ao executar dry-run.");
    } finally {
      setBusy(false);
    }
  };

  const handleRun = async () => {
    if (!window.confirm("Executar migração agora? Essa ação escreve no Firestore.")) return;
    setBusy(true);
    setError("");
    setRunSummary(null);
    try {
      const result = await runBackfill({ clinicaId, dryRun: false });
      setRunSummary(result);
    } catch (e) {
      setError(e.message || "Falha ao executar migração.");
    } finally {
      setBusy(false);
    }
  };

  if (!isAdminLike(role)) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Migration Tools</h1>
        <p>Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 920 }}>
      <h1>Migration Tools</h1>
      <p>
        Ferramenta para normalizar `role`, preencher `createdAt`, incluir `clinicaId`
        ausente e garantir campos obrigatórios em `usuarios`, `profissionais` e `terapias`.
      </p>
      <p>
        Escopo: <strong>{clinicaId || "todas as clínicas (sem filtro)"}</strong>
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button type="button" onClick={handleDryRun} disabled={busy}>
          {busy ? "Processando..." : "Dry-run"}
        </button>
        <button type="button" onClick={handleRun} disabled={busy}>
          {busy ? "Processando..." : "Executar migração"}
        </button>
      </div>

      {error && <p style={{ color: "#b00020" }}>{error}</p>}

      {dryRunSummary && (
        <pre style={{ background: "#f6f8fa", padding: 12, borderRadius: 8, overflowX: "auto" }}>
          {JSON.stringify(dryRunSummary, null, 2)}
        </pre>
      )}

      {runSummary && (
        <pre style={{ background: "#e8f5e9", padding: 12, borderRadius: 8, overflowX: "auto" }}>
          {JSON.stringify(runSummary, null, 2)}
        </pre>
      )}
    </div>
  );
}
