import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Products from "./pages/Products";
import DailySales from "./pages/DailySales";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/DashboardPage";
import ShiftPage from "./pages/ShiftPage";
import AddStock from "./pages/AddStock";
import ProfilePage from "./pages/ProfilePage";
import ReportsPage from "./pages/ReportsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Loader from "./components/loader";

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) return <Loader />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<Navigate to="/" replace />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/daily" element={<DailySales />} />
          <Route path="/daily-sheet" element={<DailySales />} />
          <Route path="/shift" element={<ShiftPage />} />
          <Route path="/add-stock" element={<AddStock />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>

        <Route path="*" element={<div className="p-10 text-center text-red-500">404 - Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}