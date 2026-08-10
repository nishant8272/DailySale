import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "./Navbar";

export default function SuperAdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-500">Checking credentials...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "super_admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
