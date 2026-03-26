import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRoute({
  children,
  allowRoles = [],
  allowWhen,
  redirectTo = "/dashboard",
}) {
  const { loading, currentUserData } = useAuth();

  if (loading) return <div>Carregando...</div>;
  if (!currentUserData) return <Navigate to="/" replace />;

  const role = currentUserData.role || "";
  const byRole = allowRoles.length === 0 || allowRoles.includes(role);
  const byPredicate = typeof allowWhen === "function" ? allowWhen(role, currentUserData) : true;

  if (byRole && byPredicate) return children;
  return <Navigate to={redirectTo} replace />;
}
