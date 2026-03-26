import axios from "axios";
import { localStorageKey } from "../lib/utils";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";


export const getAllProducts = async () => {
  const res = await axios.get(`${API_BASE_URL}/api/products`, {
    headers: { Authorization: `Bearer ${localStorageKey()}` },
  });
  return res.data;
};
