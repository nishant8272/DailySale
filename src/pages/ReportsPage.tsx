import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchReportsByRangeApi } from "../services/report.service";
import type { NormalizedReport, ReportRange } from "../types/report.types";

const RANGE_OPTIONS: Array<{ key: ReportRange; label: string }> = [
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "Last 7 days" },
  { key: "month", label: "This month" },
  { key: "year", label: "This year" },
];

const EMPTY_REPORT: NormalizedReport = {
  title: "Sales Overview",
  subtitle: "",
  totalRevenue: 0,
  totalProfit: 0,
  totalUnits: 0,
  bestPeriodLabel: "No data",
  bestPeriodRevenue: 0,
  chartLabels: [],
  chartRevenue: [],
  chartProfit: [],
  topProducts: [],
  tableRows: [],
  periodLabel: "",
};

export default function ReportsPage() {
  const navigate = useNavigate();
  const [range, setRange] = useState<ReportRange>("week");
  const [reloadToken, setReloadToken] = useState(0);
  const [report, setReport] = useState<NormalizedReport>(EMPTY_REPORT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetchReportsByRangeApi(range);
        setReport(response);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load reports";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadReport();
  }, [range, reloadToken]);

  useEffect(() => {
    const onWindowClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", onWindowClick);
    return () => window.removeEventListener("mousedown", onWindowClick);
  }, []);

  const marginPercent = useMemo(() => {
    if (report.totalRevenue <= 0) {
      return 0;
    }

    return Math.max(0, Math.round((report.totalProfit / report.totalRevenue) * 100));
  }, [report.totalProfit, report.totalRevenue]);

  const bestLabel = range === "year" ? "Best Month" : range === "month" ? "Best Day" : range === "week" ? "Best Day" : "Best Product";
  const chartMinWidth = Math.max(420, report.chartLabels.length * 64);

  if (loading) {
    return <ReportsSkeleton />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Reports</p>
            <h1 className="mt-1 text-2xl font-black text-slate-900">Sales Overview</h1>
            <p className="mt-1 text-sm text-slate-500">{report.subtitle || "Track revenue, profit, and product performance across time ranges."}</p>
          </div>

          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-slate-300 bg-white text-slate-700 transition hover:bg-[#1D9E75]/10 hover:border-[#1D9E75] hover:text-[#1D9E75]"
              aria-label="Open report actions"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6">
                <path d="M12 5h.01M12 12h.01M12 19h.01" strokeLinecap="round" />
              </svg>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-12 z-20 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    navigate("/dashboard");
                    setIsMenuOpen(false);
                  }}
                  className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Home
                </button>

                <div className="my-2 h-px bg-slate-100" />

                {RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      setRange(option.key);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full rounded-lg px-3 cursor-pointer py-2 text-left text-sm font-semibold transition ${
                      range === option.key
                        ? "bg-[#1D9E75]/10 text-[#1D9E75]"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {error && (
        <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-4">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setReloadToken((value) => value + 1)}
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-red-700 border border-red-200 hover:bg-red-100"
          >
            Retry
          </button>
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Revenue" value={formatCurrency(report.totalRevenue)} accent="text-[#1D9E75]" />
        <StatCard
          title="Total Profit"
          value={formatCurrency(report.totalProfit)}
          accent="text-purple-600"
          subValue={`${marginPercent}% margin`}
        />
        <StatCard title="Units Sold" value={report.totalUnits.toLocaleString("en-IN")} accent="text-blue-600" />
        <StatCard
          title={bestLabel}
          value={formatCurrency(report.bestPeriodRevenue)}
          accent="text-amber-600"
          subValue={report.bestPeriodLabel}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Revenue vs Profit</h2>
              <p className="text-sm text-slate-500">Compare performance across the selected time range.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
              <LegendItem color="#1D9E75" label="Revenue" />
              <LegendItem color="#7F77DD" label="Profit" />
            </div>
          </div>

          {report.chartLabels.length > 0 ? (
            <div className="h-65 w-full overflow-x-auto">
              <div style={{ minWidth: chartMinWidth, height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.chartLabels.map((label, index) => ({
                    label,
                    revenue: report.chartRevenue[index] ?? 0,
                    profit: report.chartProfit[index] ?? 0,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="#64748B" />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="#64748B"
                      tickFormatter={(value) => `₹${formatCompact(value)}`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="revenue" fill="#1D9E75" radius={[8, 8, 0, 0]} name="Revenue" />
                    <Bar dataKey="profit" fill="#7F77DD" radius={[8, 8, 0, 0]} name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <EmptyState message="No chart data for this range." />
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Top products</h2>
            <p className="text-sm text-slate-500">Best performing products in the selected range.</p>
          </div>

          {report.topProducts.length > 0 ? (
            <div className="space-y-4">
              {report.topProducts.map((product, index) => {
                const rank = index + 1;
                const maxRevenue = report.topProducts[0]?.revenue || 1;
                const width = Math.max(4, (product.revenue / maxRevenue) * 100);

                return (
                  <div key={`${product.name}-${rank}`} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${rankBadge(rank)}`}>
                        {rank}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate font-semibold text-slate-900">{product.name}</p>
                          <p className="text-sm font-bold text-slate-900">{formatCurrency(product.revenue)}</p>
                        </div>
                        <p className="text-xs text-slate-500">{product.units.toLocaleString("en-IN")} units sold</p>
                        <div className="mt-2 h-2 rounded-full bg-slate-100">
                          <div className={`h-2 rounded-full ${rankColor(rank)}`} style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="border-t border-slate-200 pt-4 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <span>Total product revenue</span>
                  <span className="font-bold text-slate-900">{formatCurrency(report.topProducts.reduce((sum, item) => sum + item.revenue, 0))}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span>Top product share</span>
                  <span className="font-bold text-slate-900">
                    {report.totalRevenue > 0
                      ? `${Math.round((report.topProducts[0]?.revenue || 0) / report.totalRevenue * 100)}%`
                      : "0%"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState message="No top products available for this range." />
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Daily breakdown</h2>
            <p className="text-sm text-slate-500">Review each day or month in the selected period.</p>
          </div>
        </div>

        {report.tableRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm" style={{ minWidth: 680 }}>
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-3 pr-4 font-semibold">Date</th>
                  <th className="py-3 pr-4 font-semibold">Revenue</th>
                  <th className="py-3 pr-4 font-semibold">Profit</th>
                  <th className="py-3 pr-4 font-semibold">Units</th>
                  <th className="py-3 pr-4 font-semibold">Margin %</th>
                  <th className="py-3 pr-4 font-semibold">View</th>
                </tr>
              </thead>
              <tbody>
                {report.tableRows.map((row) => {
                  const margin = row.revenue > 0 ? Math.round((row.profit / row.revenue) * 100) : 0;

                  return (
                    <tr
                      key={`${row.label}-${row.date}`}
                      className={`border-b border-slate-100 ${row.hasData && margin < 20 ? "bg-amber-50/60" : ""}`}
                    >
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        {row.hasData ? row.label : <StatusPill label="No shift" tone="slate" />}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">
                        {row.hasData ? formatCurrency(row.revenue) : "—"}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">
                        {row.hasData ? formatCurrency(row.profit) : "—"}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">{row.hasData ? row.units.toLocaleString("en-IN") : "—"}</td>
                      <td className="py-3 pr-4">
                        {row.hasData ? (
                          <StatusPill label={`${margin}%`} tone={margin >= 25 ? "green" : margin >= 10 ? "amber" : "red"} />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {row.hasData ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/daily-sheet?date=${row.date}`)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            View
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No breakdown data available for this range." />
        )}
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  accent,
  subValue,
}: {
  title: string;
  value: string;
  accent: string;
  subValue?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
      <p className={`mt-2 text-2xl font-black ${accent}`}>{value}</p>
      {subValue && <p className="mt-1 text-sm text-slate-500">{subValue}</p>}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-55 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 text-sm text-slate-500">
      {message}
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "green" | "amber" | "red" | "slate" }) {
  const styles: Record<typeof tone, string> = {
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    slate: "bg-slate-100 text-slate-600",
  };

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${styles[tone]}`}>{label}</span>;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number }>; label?: string }) {
  if (!active || !payload?.length) {
    return null;
  }

  const revenue = payload.find((item) => item.dataKey === "revenue")?.value || 0;
  const profit = payload.find((item) => item.dataKey === "profit")?.value || 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="text-sm font-bold text-[#1D9E75]">Revenue: {formatCurrency(revenue)}</p>
      <p className="text-sm font-bold text-purple-600">Profit: {formatCurrency(profit)}</p>
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 rounded-2xl border border-slate-200 bg-slate-200" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-24 rounded-2xl bg-slate-200" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        <div className="h-80 rounded-2xl bg-slate-200" />
        <div className="h-80 rounded-2xl bg-slate-200" />
      </div>
      <div className="h-70 rounded-2xl bg-slate-200" />
    </div>
  );
}

function formatCurrency(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function formatCompact(value: number) {
  if (value >= 100000) {
    return `${Math.round(value / 100000)}L`;
  }

  if (value >= 1000) {
    return `${Math.round(value / 1000)}k`;
  }

  return String(Math.round(value));
}

function rankBadge(rank: number) {
  switch (rank) {
    case 1:
      return "bg-green-100 text-green-700";
    case 2:
      return "bg-purple-100 text-purple-700";
    case 3:
      return "bg-amber-100 text-amber-700";
    case 4:
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function rankColor(rank: number) {
  switch (rank) {
    case 1:
      return "bg-[#1D9E75]";
    case 2:
      return "bg-[#7F77DD]";
    case 3:
      return "bg-amber-500";
    case 4:
      return "bg-rose-400";
    default:
      return "bg-slate-400";
  }
}