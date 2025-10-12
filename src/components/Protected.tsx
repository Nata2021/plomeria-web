import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/auth.store";

export default function Protected({ children }: { children: React.ReactNode }) {
  const token = useAuth(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
