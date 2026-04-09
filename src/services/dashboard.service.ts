import axios from "axios";
import type { Alert, DailyEntry, WeeklyReport } from "../api/api.types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export type DashboardPayload = {
  todayShift: DailyEntry | null;
  alertCount: number;
  weeklyReport: WeeklyReport | null;
};

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Missing auth token");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

const fetchWithAuth = async (path: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api${path}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/auth";
        throw new Error("Unauthorized");
      }

      const message =
        (error.response?.data as { message?: string } | undefined)?.message ||
        `Failed to fetch ${path}`;
      throw new Error(message);
    }

    throw new Error(`Failed to fetch ${path}`);
  }
};

export const fetchDashboardDataApi = async (): Promise<DashboardPayload> => {
  const [shiftPayload, alertPayload, reportPayload] = await Promise.all([
    fetchWithAuth("/shifts/today"),
    fetchWithAuth("/alerts/count"),
    fetchWithAuth("/reports/weekly"),
  ]);

  return {
    todayShift: (shiftPayload?.data ?? null) as DailyEntry | null,
    alertCount: Number(alertPayload?.unread_count ?? alertPayload?.data?.unread_count ?? 0),
    weeklyReport: (reportPayload?.data ?? null) as WeeklyReport | null,
  };
};

export const fetchLowStockAlertsApi = async (): Promise<Alert[]> => {
  const response = await fetchWithAuth("/alerts/all?type=low_stock&limit=20");
  return (response?.data ?? []) as Alert[];
};
