import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Missing auth token");
  return { Authorization: `Bearer ${token}` };
};

export const fetchGlobalStatsApi = async (params?: { startDate?: string; endDate?: string; shop_id?: string }) => {
  const res = await axios.get(`${API_BASE_URL}/api/super-admin/stats`, {
    headers: getAuthHeaders(),
    params,
  });
  return res.data.data;
};

export const fetchGlobalChartsApi = async (params?: { startDate?: string; endDate?: string; shop_id?: string }) => {
  const res = await axios.get(`${API_BASE_URL}/api/super-admin/charts`, {
    headers: getAuthHeaders(),
    params,
  });
  return res.data.data;
};

export const fetchShopsDirectoryApi = async (params: {
  search?: string;
  is_active?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page: number;
  limit: number;
}) => {
  const res = await axios.get(`${API_BASE_URL}/api/super-admin/shops`, {
    headers: getAuthHeaders(),
    params,
  });
  return res.data;
};

export const createShopApi = async (data: any) => {
  const res = await axios.post(`${API_BASE_URL}/api/super-admin/shops`, data, {
    headers: getAuthHeaders(),
  });
  return res.data.data;
};

export const updateShopApi = async (id: string, data: any) => {
  const res = await axios.patch(`${API_BASE_URL}/api/super-admin/shops/${id}`, data, {
    headers: getAuthHeaders(),
  });
  return res.data.data;
};

export const resetShopDataApi = async (id: string) => {
  const res = await axios.post(`${API_BASE_URL}/api/super-admin/shops/${id}/reset`, {}, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const fetchUsersApi = async (params: {
  search?: string;
  role?: string;
  is_active?: boolean;
  page: number;
  limit: number;
}) => {
  const res = await axios.get(`${API_BASE_URL}/api/super-admin/users`, {
    headers: getAuthHeaders(),
    params,
  });
  return res.data;
};

export const updateUserApi = async (id: string, data: any) => {
  const res = await axios.patch(`${API_BASE_URL}/api/super-admin/users/${id}`, data, {
    headers: getAuthHeaders(),
  });
  return res.data.data;
};

export const resetUserPasswordApi = async (id: string, data?: any) => {
  const res = await axios.post(`${API_BASE_URL}/api/super-admin/users/${id}/reset-password`, data || {}, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const fetchActivityLogsApi = async (params: {
  search?: string;
  action?: string;
  page: number;
  limit: number;
}) => {
  const res = await axios.get(`${API_BASE_URL}/api/super-admin/logs`, {
    headers: getAuthHeaders(),
    params,
  });
  return res.data;
};

export const fetchGlobalAlertsApi = async (params: {
  is_read?: boolean;
  page: number;
  limit: number;
}) => {
  const res = await axios.get(`${API_BASE_URL}/api/super-admin/alerts`, {
    headers: getAuthHeaders(),
    params,
  });
  return res.data;
};
