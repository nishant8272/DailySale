import axios from "axios";
import { localStorageKey } from "../lib/utils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const getDailyReport = async (date: string) => {
  const res = await axios.get(`${API_BASE_URL}/api/reports/daily/${date}`, {
    headers: { Authorization: `Bearer ${localStorageKey()}` },
  });
  return res.data;
};  

export const getTodayShift = async () => {
  const res = await axios.get(`${API_BASE_URL}/api/shifts/today`, {
    headers: { Authorization: `Bearer ${localStorageKey()}` },
  });
  return res.data;
};

export const closeShift = async (closingStocks: { product_id: string; closing_stock: number }[]) => {
  const res = await axios.post(
    `${API_BASE_URL}/api/shifts/close`,
    { closing_stocks: closingStocks },
    { headers: { Authorization: `Bearer ${localStorageKey()}` } }
  );
  return res.data;
};
