import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {AuthPage} from "./pages/AuthPage";
import Products from "./pages/Products";
import DailySales from "./pages/DailySales";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/DashboardPage"
// import DailySheet from "./pages/DailySheet"   // new
import ShiftPage from "./pages/ShiftPage"     // new
import ProtectedRoute from "./components/ProtectedRoute"
import { AuthProvider } from "./context/AuthContext"

export function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/daily" element={<DailySales />} />
          {/* <Route path="/daily-sheet" element={<DailySheet />} /> */}
          <Route path="/shift" element={<ShiftPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<div className="p-10 text-center text-red-500">404 - Not Found</div>} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  )
}