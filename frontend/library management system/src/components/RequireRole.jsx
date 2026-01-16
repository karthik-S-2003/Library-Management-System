import { Navigate } from "react-router-dom";
import { getAuth } from "../auth";

export default function RequireRole({ role, children }) {
  const auth = getAuth();
  if (!auth?.token) return <Navigate to="/login" replace />;
  if (auth.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
}

