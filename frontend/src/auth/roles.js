export const ROLES = {
  ADMIN: "admin",
  ADMIN_MASTER: "admin_master",
  MASTER: "master",
  GERENTE: "gerente",
  TERAPEUTA: "terapeuta",
  PROFISSIONAL: "profissional", // legado
  RECEPCIONISTA: "recepcionista",
  GUARDIAN: "guardian",
  RESPONSAVEL: "responsavel", // legado
};

export const normalizeRole = (role) => {
  const r = (role || "").trim().toLowerCase();
  if (!r) return "";
  if (r === ROLES.PROFISSIONAL) return ROLES.TERAPEUTA;
  if (r === ROLES.RESPONSAVEL) return ROLES.GUARDIAN;
  return r;
};

export const isGuardianRole = (role) => normalizeRole(role) === ROLES.GUARDIAN;

export const isAdminLike = (role) => {
  const r = normalizeRole(role);
  return r === ROLES.ADMIN || r === ROLES.ADMIN_MASTER || r === ROLES.MASTER;
};

export const isManagerLike = (role) => {
  const r = normalizeRole(role);
  return isAdminLike(r) || r === ROLES.GERENTE;
};

export const isTherapistRole = (role) => normalizeRole(role) === ROLES.TERAPEUTA;

export const isStaffRole = (role) => !isGuardianRole(role);

export const canManageUsers = (role) => isManagerLike(role);

export const canManageTherapists = (role) => isManagerLike(role);

export const STAFF_ASSIGNABLE_ROLES = [
  { value: ROLES.RECEPCIONISTA, label: "Recepcionista" },
  { value: ROLES.GERENTE, label: "Gerente" },
  { value: ROLES.TERAPEUTA, label: "Terapeuta" },
  { value: ROLES.ADMIN, label: "Admin" },
];
