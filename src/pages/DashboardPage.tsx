import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/auth.store";

export default function DashboardPage() {
  const logout = useAuth(s => s.logout);
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold">Plomería — Dashboard</h1>
        <button onClick={logout} className="text-sm underline">Salir</button>
      </div>
      <nav className="flex gap-3">
        <Link className="text-blue-600 underline" to="/workorders">WorkOrders</Link>
        <Link className="text-blue-600 underline" to="/documents">Documents</Link>
      </nav>
    </div>
  );
}
