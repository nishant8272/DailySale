import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import {App} from "./App";
import { Toaster } from "react-hot-toast";
import axios from "axios";

// Add global axios interceptor for Super Admin context switching
axios.interceptors.request.use(
  (config) => {
    const impersonatedShopId = localStorage.getItem("super_admin_shop_id");
    if (impersonatedShopId) {
      config.headers["x-shop-id"] = impersonatedShopId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Toaster position="top-right" />
  </StrictMode>
);
