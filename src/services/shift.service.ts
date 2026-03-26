import axios from "axios";

export const getDailyReport = async (date: string, token: string) => {
  const res = await axios.get(`/api/reports/daily/${date}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const getTodayShift = async (token: string) => {
  const res = await axios.get(`/api/shifts/today`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const closeShift = async (closingStocks: { product_id: string; closing_stock: number }[], token: string) => {
  const res = await axios.post(
    `http://localhost:3000/api/shifts/close`,
    { closing_stocks: closingStocks },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};
