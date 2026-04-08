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
  console.log(res.data)
  return res.data;
};

export const startShift = async (workerId?: string) => {
  const res = await axios.post(
    `${API_BASE_URL}/api/shifts/start`,
    workerId ? { worker_id: workerId } : {},
    { headers: { Authorization: `Bearer ${localStorageKey()}` } }
  );
  console.log(res.data)
  return res.data;
};

export const addStockToShift = async (payload: {
  product_id: string;
  quantity_added: number;
  new_buy_price: number;
  new_sell_price?: number;
  note?: string;
}) => {
  const res = await axios.post(
    `${API_BASE_URL}/api/shifts/add-stock`,
    payload,
    { headers: { Authorization: `Bearer ${localStorageKey()}` } }
  );
  return res.data;
};
