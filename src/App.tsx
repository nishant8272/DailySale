import { BrowserRouter, Routes, Route } from "react-router-dom";
import {AuthPage} from "./pages/AuthPage";
import Products from "./pages/Products";
import DailySales from "./pages/DailySales";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/products" element={<Products />} />
        <Route path="/daily" element={<DailySales />} />
      </Routes>
    </BrowserRouter>
  );
}