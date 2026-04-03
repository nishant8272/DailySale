import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; 
import Navbar from "./Navbar";

export default function ProtectedRoute() {
  const { user, loading } = useAuth(); // Use the context hook instead of Zustand

  if (loading) return <div>Loading...</div>; // Prevent redirect while checking token

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="mx-auto w-full max-w-350">
          <Outlet />
        </div>
      </main>
    </div>
  );
}