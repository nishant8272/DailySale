import { BrowserRouter, Routes, Route } from "react-router-dom";
import {AuthPage} from "./pages/AuthPage";
import Products from "./pages/Products";
import DailySales from "./pages/DailySales";
import LandingPage from "./pages/LandingPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />   
        <Route path="/products" element={<Products />} />
        <Route path="/daily" element={<DailySales />} />
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}