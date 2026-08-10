import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Products from "./pages/Products";
import DailySales from "./pages/DailySales";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/DashboardPage";
import ShiftPage from "./pages/ShiftPage";
import AddStock from "./pages/AddStock";
import ProfilePage from "./pages/ProfilePage";
import ReportsPage from "./pages/ReportsPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import UdharbookPage from "./pages/UdharbookPage";

import ProtectedRoute from "./components/ProtectedRoute";
import SuperAdminRoute from "./components/SuperAdminRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Loader from "./components/loader";

import GlobalDashboard from "./pages/SuperAdmin/GlobalDashboard";
import ShopDirectory from "./pages/SuperAdmin/ShopDirectory";
import UserDirectory from "./pages/SuperAdmin/UserDirectory";
import ActivityLogs from "./pages/SuperAdmin/ActivityLogs";
import AlertsPage from "./pages/SuperAdmin/AlertsPage";

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) return <Loader />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<Navigate to="/" replace />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />


        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/daily" element={<DailySales />} />
          <Route path="/daily-sheet" element={<DailySales />} />
          <Route path="/shift" element={<ShiftPage />} />
          <Route path="/add-stock" element={<AddStock />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/udharbook" element={<UdharbookPage />} />

          {/* Super Admin Sub-system */}
          <Route element={<SuperAdminRoute />}>
            <Route path="/super-admin" element={<GlobalDashboard />} />
            <Route path="/super-admin/shops" element={<ShopDirectory />} />
            <Route path="/super-admin/users" element={<UserDirectory />} />
            <Route path="/super-admin/logs" element={<ActivityLogs />} />
            <Route path="/super-admin/alerts" element={<AlertsPage />} />
          </Route>
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