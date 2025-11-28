import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/" replace />;

  if (!allowedRoles.includes(role))
    return <Navigate to="/unauthorized" replace />;

  return children;
}
