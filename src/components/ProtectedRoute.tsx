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
    <div className="min-h-screen bg-slate-50 relative">
      {/* Decorative background blobs to make the glassy navbar visible */}
      <div className="pointer-events-none absolute top-0 left-0 w-full h-96 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] h-72 w-72 rounded-full bg-emerald-200/40 blur-[100px]"></div>
        <div className="absolute top-[-10%] right-[-5%] h-64 w-64 rounded-full bg-blue-200/40 blur-[100px]"></div>
      </div>
      
      <div className="relative z-10">
        <Navbar />
        <main className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}