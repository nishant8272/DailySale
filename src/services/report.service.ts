import axios from "axios";
import type { WeeklyReport } from "../api/api.types";
import type { NormalizedReport, ReportProductItem, ReportRange } from "../types/report.types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

type ApiError = Error & { status?: number };

const toApiError = (message: string, status?: number): ApiError => {
  const error = new Error(message) as ApiError;
  error.status = status;
  return error;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Missing auth token");
  }

  return { Authorization: `Bearer ${token}` };
};

type DailyReportResponse = {
  date: string;
  day_total_revenue: number;
  day_total_profit: number;
  products: Array<{
    product_name: string;
    units_sold: number;
    revenue: number;
    profit: number;
  }>;
};

type MonthlyReportResponse = {
  period: { year: number; month: number };
  month_total_revenue: number;
  month_total_profit: number;
  month_total_units: number;
  top_products: Array<{
    product_name: string;
    units_sold: number;
    revenue: number;
    profit: number;
  }>;
  daily_breakdown: Array<{
    date: string;
    revenue: number;
    profit: number;
    units_sold: number;
  }>;
};

type YearlyReportResponse = {
  period: { year: number };
  yearly_total_revenue: number;
  yearly_total_profit: number;
  yearly_total_units: number;
  best_month: { month: string; revenue: number; profit: number; units_sold: number; has_data: boolean } | null;
  top_products: Array<{
    product_name: string;
    units_sold: number;
    revenue: number;
    profit: number;
  }>;
  monthly_breakdown: Array<{
    month: string;
    revenue: number;
    profit: number;
    units_sold: number;
    has_data: boolean;
  }>;
};

const formatDayLabel = (date: string) => {
  const parsed = new Date(`${date}T00:00:00`);
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatShortDayLabel = (date: string) => {
  const parsed = new Date(`${date}T00:00:00`);
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const formatMonthLabel = (monthKey: string) => {
  const parsed = new Date(`${monthKey}-01T00:00:00`);
  return parsed.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const formatMonthShort = (monthKey: string) => {
  const parsed = new Date(`${monthKey}-01T00:00:00`);
  return parsed.toLocaleDateString("en-IN", {
    month: "short",
  });
};

const getYesterdayDate = () => {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
};

const getTodayMonth = () => {
  const now = new Date();
  return {
    year: Number(now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }).slice(0, 4)),
    month: Number(now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }).slice(5, 7)),
  };
};

const getCurrentYear = () => new Date().getFullYear();

const normalizeProducts = (products: ReportProductItem[]) =>
  [...products]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

const calculateBestItem = (items: Array<{ label: string; revenue: number }>) => {
  if (items.length === 0) {
    return { label: "No data", revenue: 0 };
  }

  return items.reduce((best, item) => (item.revenue > best.revenue ? item : best), items[0]);
};

const buildYesterdayReport = (payload: DailyReportResponse): NormalizedReport => {
  const products = [...payload.products]
    .sort((a, b) => b.revenue - a.revenue)
    .map((product) => ({
      name: product.product_name,
      revenue: product.revenue,
      units: product.units_sold,
      profit: product.profit,
    }));

  const totalUnits = products.reduce((sum, product) => sum + product.units, 0);
  const bestProduct = calculateBestItem(products.map((product) => ({ label: product.name, revenue: product.revenue })));

  return {
    title: "Sales Overview",
    subtitle: `Yesterday • ${formatDayLabel(payload.date)}`,
    totalRevenue: payload.day_total_revenue,
    totalProfit: payload.day_total_profit,
    totalUnits,
    bestPeriodLabel: bestProduct.label,
    bestPeriodRevenue: bestProduct.revenue,
    chartLabels: products.map((product) => product.name),
    chartRevenue: products.map((product) => product.revenue),
    chartProfit: products.map((product) => product.profit ?? 0),
    topProducts: normalizeProducts(products),
    tableRows: [
      {
        label: formatDayLabel(payload.date),
        revenue: payload.day_total_revenue,
        profit: payload.day_total_profit,
        units: totalUnits,
        hasData: true,
        date: payload.date,
      },
    ],
    periodLabel: formatDayLabel(payload.date),
  };
};

const buildWeeklyReport = (payload: WeeklyReport): NormalizedReport => {
  const rows = payload.daily_breakdown.map((row) => ({
    label: formatShortDayLabel(row.date),
    revenue: row.revenue,
    profit: row.profit,
    units: row.units_sold,
    hasData: row.has_data,
    date: row.date,
  }));

  const bestDay = payload.best_day
    ? {
        label: formatDayLabel(payload.best_day.date),
        revenue: payload.best_day.revenue,
      }
    : calculateBestItem(rows.map((row) => ({ label: row.label, revenue: row.revenue })));

  return {
    title: "Sales Overview",
    subtitle: `Last 7 days • ${formatDayLabel(payload.period.from)} to ${formatDayLabel(payload.period.to)}`,
    totalRevenue: payload.week_total_revenue,
    totalProfit: payload.week_total_profit,
    totalUnits: payload.week_total_units,
    bestPeriodLabel: bestDay.label,
    bestPeriodRevenue: bestDay.revenue,
    chartLabels: rows.map((row) => row.label),
    chartRevenue: rows.map((row) => row.revenue),
    chartProfit: rows.map((row) => row.profit),
    topProducts: normalizeProducts(
      payload.top_products?.map((product: {
        product_name: string;
        units_sold: number;
        revenue: number;
        profit: number;
      }) => ({
        name: product.product_name,
        revenue: product.revenue,
        units: product.units_sold,
        profit: product.profit,
      })) || []
    ),
    tableRows: rows,
    periodLabel: `${formatDayLabel(payload.period.from)} - ${formatDayLabel(payload.period.to)}`,
  };
};

const buildMonthlyReport = (payload: MonthlyReportResponse): NormalizedReport => {
  const rows = payload.daily_breakdown.map((row) => ({
    label: formatDayLabel(row.date),
    revenue: row.revenue,
    profit: row.profit,
    units: row.units_sold,
    hasData: true,
    date: row.date,
  }));

  const bestDay = calculateBestItem(rows.map((row) => ({ label: row.label, revenue: row.revenue })));

  return {
    title: "Sales Overview",
    subtitle: `This month • ${formatMonthLabel(`${payload.period.year}-${String(payload.period.month).padStart(2, "0")}`)}`,
    totalRevenue: payload.month_total_revenue,
    totalProfit: payload.month_total_profit,
    totalUnits: payload.month_total_units,
    bestPeriodLabel: bestDay.label,
    bestPeriodRevenue: bestDay.revenue,
    chartLabels: rows.map((row) => formatShortDayLabel(row.date)),
    chartRevenue: rows.map((row) => row.revenue),
    chartProfit: rows.map((row) => row.profit),
    topProducts: normalizeProducts(
      payload.top_products.map((product) => ({
        name: product.product_name,
        revenue: product.revenue,
        units: product.units_sold,
        profit: product.profit,
      }))
    ),
    tableRows: rows,
    periodLabel: formatMonthLabel(`${payload.period.year}-${String(payload.period.month).padStart(2, "0")}`),
  };
};

const buildYearlyReport = (payload: YearlyReportResponse): NormalizedReport => {
  const rows = payload.monthly_breakdown.map((row) => ({
    label: formatMonthLabel(row.month),
    revenue: row.revenue,
    profit: row.profit,
    units: row.units_sold,
    hasData: row.has_data,
    date: `${row.month}-01`,
  }));

  const bestMonth = payload.best_month
    ? {
        label: formatMonthLabel(payload.best_month.month),
        revenue: payload.best_month.revenue,
      }
    : calculateBestItem(rows.map((row) => ({ label: row.label, revenue: row.revenue })));

  return {
    title: "Sales Overview",
    subtitle: `This year • ${payload.period.year}`,
    totalRevenue: payload.yearly_total_revenue,
    totalProfit: payload.yearly_total_profit,
    totalUnits: payload.yearly_total_units,
    bestPeriodLabel: bestMonth.label,
    bestPeriodRevenue: bestMonth.revenue,
    chartLabels: payload.monthly_breakdown.map((row) => formatMonthShort(row.month)),
    chartRevenue: payload.monthly_breakdown.map((row) => row.revenue),
    chartProfit: payload.monthly_breakdown.map((row) => row.profit),
    topProducts: normalizeProducts(
      payload.top_products.map((product) => ({
        name: product.product_name,
        revenue: product.revenue,
        units: product.units_sold,
        profit: product.profit,
      }))
    ),
    tableRows: rows,
    periodLabel: String(payload.period.year),
  };
};

export const fetchReportsByRangeApi = async (range: ReportRange): Promise<NormalizedReport> => {
  try {
    const headers = { headers: getAuthHeaders() };

    if (range === "yesterday") {
      const date = getYesterdayDate();
      const response = await axios.get(`${API_BASE_URL}/api/reports/daily/${date}`, headers);
      const payload = response.data?.data as DailyReportResponse;

      if (!payload) {
        throw new Error("Failed to fetch yesterday report");
      }

      return buildYesterdayReport(payload);
    }

    if (range === "week") {
      const response = await axios.get(`${API_BASE_URL}/api/reports/weekly`, headers);
      const payload = response.data?.data as WeeklyReport;

      if (!payload) {
        throw new Error("Failed to fetch weekly report");
      }

      return buildWeeklyReport(payload);
    }

    if (range === "month") {
      const { year, month } = getTodayMonth();
      const response = await axios.get(`${API_BASE_URL}/api/reports/monthly?year=${year}&month=${month}`, headers);
      const payload = response.data?.data as MonthlyReportResponse;

      if (!payload) {
        throw new Error("Failed to fetch monthly report");
      }

      return buildMonthlyReport(payload);
    }

    const year = getCurrentYear();
    const response = await axios.get(`${API_BASE_URL}/api/reports/yearly?year=${year}`, headers);
    const payload = response.data?.data as YearlyReportResponse;

    if (!payload) {
      throw new Error("Failed to fetch yearly report");
    }

    return buildYearlyReport(payload);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message =
        (error.response?.data as { message?: string } | undefined)?.message ||
        "Failed to fetch reports";
      throw toApiError(message, status);
    }

    throw toApiError(error instanceof Error ? error.message : "Failed to fetch reports");
  }
};
