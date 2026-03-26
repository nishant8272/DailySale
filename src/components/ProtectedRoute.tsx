import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; 
import Navbar from "./Navbar";

export default function ProtectedRoute() {
  const { user, loading } = useAuth(); // Use the context hook instead of Zustand

  if (loading) return <div>Loading...</div>; // Prevent redirect while checking token

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 px-4">
        <Outlet /> 
      </main>
    </div>
  );
}