import { BrowserRouter, Routes, Route } from "react-router-dom";
import {AuthPage} from "./pages/AuthPage";
import Products from "./pages/Products";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/products" element={<Products />} />
      </Routes>
    </BrowserRouter>
  );
}