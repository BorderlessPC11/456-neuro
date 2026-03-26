import React from "react";
import { Navigate } from "react-router-dom";

/** Legacy route: ABA guardian experience lives under `/guardian`. */
export default function AbaResponsavel() {
  return <Navigate to="/guardian" replace />;
}
