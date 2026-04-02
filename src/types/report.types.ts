export type ReportRange = "yesterday" | "week" | "month" | "year";

export type ReportTableRow = {
  label: string;
  revenue: number;
  profit: number;
  units: number;
  hasData: boolean;
  date: string;
};

export type ReportProductItem = {
  name: string;
  revenue: number;
  units: number;
  profit?: number;
};

export type NormalizedReport = {
  title: string;
  subtitle: string;
  totalRevenue: number;
  totalProfit: number;
  totalUnits: number;
  bestPeriodLabel: string;
  bestPeriodRevenue: number;
  chartLabels: string[];
  chartRevenue: number[];
  chartProfit: number[];
  topProducts: ReportProductItem[];
  tableRows: ReportTableRow[];
  periodLabel: string;
};