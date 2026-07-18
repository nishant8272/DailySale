import React, { useEffect, useRef, useState } from "react";
import { getAllProducts } from "../services/product.service";
import { getDailyReport, closeShift } from "../services/shift.service";
import axios from "axios";
import { localStorageKey } from "../lib/utils";
import type { DailyReportProduct, DailyReport } from "../types/dailyreport.types";
import type { Product } from "../types/product.types";
import { useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag, CheckCircle, Loader2, Package, Save, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

const getDaysInMonth = (year: number, month: number) => {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) { days.push(new Date(date)); date.setDate(date.getDate() + 1); }
  return days;
};
const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const PRODUCT_COL_W = 200;
const DAY_COL_W = 52;
const TODAY_COL_W = 110;

const DailySales: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<(DailyReportProduct & { is_active: boolean })[]>([]);
  const [closingStocks, setClosingStocks] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const [today, setToday] = useState<string>("");
  const [days, setDays] = useState<Date[]>([]);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayThRef = useRef<HTMLTableCellElement>(null);
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [mobileViewMode, setMobileViewMode] = useState<"sheet" | "cards">("sheet");

  const [monthlyStats, setMonthlyStats] = useState<{
    revenue: number;
    profit: number;
    units: number;
    productMap: Record<string, { units_sold: number; revenue: number; profit: number }>;
  } | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const selectedDate = params.get("date");
    const now = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();

    if (Number.isNaN(now.getTime())) {
      const fallback = new Date();
      setToday(formatDate(fallback));
      setDays(getDaysInMonth(fallback.getFullYear(), fallback.getMonth()));
      return;
    }

    setToday(formatDate(now));
    setDays(getDaysInMonth(now.getFullYear(), now.getMonth()));
  }, [location.search]);

  // Scroll so 1 previous day + today are visible at the left edge
  useEffect(() => {
    if (!today || days.length === 0) return;
    requestAnimationFrame(() => {
      const container = scrollRef.current;
      const todayTh = todayThRef.current;
      if (!container || !todayTh) return;
      container.scrollLeft = Math.max(0, todayTh.offsetLeft - PRODUCT_COL_W - DAY_COL_W);
    });
  }, [today, days]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!today) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch products and daily report
        const productsRes = await getAllProducts();
        const allProducts: Product[] = productsRes;
        
        // Fetch monthly summary for stats
        const dateObj = new Date(today);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1;
        
        const [reportRes, monthRes] = await Promise.allSettled([
          getDailyReport(today),
          axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/reports/monthly?year=${year}&month=${month}`, {
            headers: { Authorization: `Bearer ${localStorageKey()}` },
          })
        ]);

        let dailyMap: Record<string, DailyReportProduct> = {};
        if (reportRes.status === "fulfilled") {
          const report: DailyReport = reportRes.value.data;
          if (report?.products)
            dailyMap = Object.fromEntries(report.products.map((p) => [p.product_id, p]));
        }

        if (monthRes.status === "fulfilled") {
          const mData = monthRes.value.data.data;
          const statsMap: Record<string, any> = {};
          mData.product_stats?.forEach((p: any) => {
            statsMap[p.product_id] = p;
          });
          
          setMonthlyStats({
            revenue: mData.month_total_revenue,
            profit: mData.month_total_profit,
            units: mData.month_total_units,
            productMap: statsMap
          });
        }

        // Merge and attach is_active for UI logic
        const merged: (DailyReportProduct & { is_active: boolean })[] = allProducts.map((prod) => {
          const daily = dailyMap[prod._id];
          const base: DailyReportProduct = daily || {
            product_id: prod._id, product_name: prod.name,
            opening_stock: prod.current_stock, closing_stock: 0,
            total_added: 0, units_sold: 0,
            active_sell_price: prod.current_sell_price,
            active_buy_price: prod.current_buy_price,
            revenue: 0, profit: 0, is_closing_entered: false,
          };
          return { ...base, product_name: prod.name, is_active: prod.is_active };
        });
        // Sort: active first, inactive last
        merged.sort((a, b) => (a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1));
        setProducts(merged);
        // Use empty string as default — avoids the "020" prefixing bug
        const closing: Record<string, string> = {};
        merged.forEach((p) => {
          closing[p.product_id] = p.closing_stock > 0 ? String(p.closing_stock) : "";
        });
        setClosingStocks(closing);
      } catch { setProducts([]); }
      setIsLoading(false);
    };
    fetchData();
  }, [today, refreshFlag]);

  const handleMonthChange = (direction: "prev" | "next") => {
    const d = new Date(today);
    d.setDate(1); // avoid month wrapping issues
    if (direction === "prev") d.setMonth(d.getMonth() - 1);
    else d.setMonth(d.getMonth() + 1);
    
    // Maintain the same day if possible, or clamp
    const originalDay = new Date(today).getDate();
    const lastDayNextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(originalDay, lastDayNextMonth));
    
    navigate(`?date=${formatDate(d)}`);
  };

  const handleClosingStockChange = (product_id: string, value: string) => {
    // Strip leading zeros: "020" → "20", keep empty string as-is
    const cleaned = value === "" ? "" : String(parseInt(value, 10) || 0);
    setClosingStocks((prev) => ({ ...prev, [product_id]: cleaned }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const closingArr = Object.entries(closingStocks)
        .filter(([, v]) => v !== "")
        .map(([product_id, v]) => ({
          product_id,
          closing_stock: parseInt(v, 10),
        }));
      await closeShift(closingArr);
      setRefreshFlag((f) => f + 1);
      toast.success("Closing stock saved!");
      // Removed navigate("/shift") to keep user on the page.
    } catch (err) {
      toast.error("Failed to save closing stock");
    }
    setIsLoading(false);
  };

  const todayDateObj = today ? new Date(today) : new Date();
  const todayLabel = todayDateObj.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const currentMonthLabel = todayDateObj.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const totalClosing = Object.values(closingStocks).reduce((s, v) => s + (parseInt(v) || 0), 0);
  const pendingClosingCount = products.filter((p) => p.is_active && !p.is_closing_entered).length;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/40 to-slate-50 pb-20"
      style={{ fontFamily: "'DM Sans', 'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        .scroll-thin::-webkit-scrollbar { height: 6px; width: 6px; }
        .scroll-thin::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 9999px; }
        .scroll-thin::-webkit-scrollbar-thumb { background: #c4b5fd; border-radius: 9999px; }
        .scroll-thin::-webkit-scrollbar-thumb:hover { background: #7c3aed; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200 shrink-0">
                <ShoppingBag className="h-7 w-7 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight truncate">Daily Sales Entry</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    <CheckCircle className="h-3 w-3" /> Shift Active
                  </span>
                  <p className="text-[11px] font-medium text-slate-400 capitalize">{todayLabel}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
              <button 
                onClick={() => handleMonthChange("prev")}
                className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition text-slate-600"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex flex-col items-center px-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none mb-1">Month View</span>
                <span className="text-sm font-bold text-slate-800">{currentMonthLabel}</span>
              </div>
              <button 
                onClick={() => handleMonthChange("next")}
                className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition text-slate-600"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Table section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-violet-500" />
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Monthly Stock Overview</h2>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{products.length} products</span>
            </div>
            <div className="flex items-center gap-2">
              {isMobile && (
                <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setMobileViewMode("sheet")}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${mobileViewMode === "sheet"
                      ? "bg-violet-100 text-violet-700"
                      : "text-slate-500 hover:bg-slate-50"
                      }`}
                  >
                    Sheet
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileViewMode("cards")}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${mobileViewMode === "cards"
                      ? "bg-violet-100 text-violet-700"
                      : "text-slate-500 hover:bg-slate-50"
                      }`}
                  >
                    Cards
                  </button>
                </div>
              )}
              <p className="text-xs text-slate-400">← Scroll to view past days · Today is highlighted</p>
            </div>
          </div>

          {isMobile && mobileViewMode === "cards" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Products</p>
                  <p className="mt-1 text-lg font-black text-slate-800">{products.length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending</p>
                  <p className="mt-1 text-lg font-black text-amber-600">{pendingClosingCount}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p>
                  <p className="mt-1 text-lg font-black text-violet-700">{totalClosing}</p>
                </div>
              </div>

              {isLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600" />
                  <p className="mt-3 text-sm font-medium text-slate-600">Loading sales data…</p>
                </div>
              ) : products.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <Package className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-500">No products found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((row) => {
                    const inputValue = closingStocks[row.product_id] ?? "";
                    const mStats = monthlyStats?.productMap[row.product_id];

                    return (
                      <div
                        key={row.product_id}
                        className={`rounded-2xl border p-4 shadow-sm relative overflow-hidden ${row.is_active ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-70"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-800">{row.product_name}</p>
                            {!row.is_active && (
                              <p className="mt-0.5 text-[11px] font-semibold text-red-500">Inactive product</p>
                            )}
                          </div>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${row.is_closing_entered ? "bg-violet-100 text-violet-600" : "bg-emerald-100 text-emerald-600"}`}>
                            {row.is_closing_entered ? "Saved" : "Today"}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Opening</p>
                            <p className="font-bold text-slate-700">{row.opening_stock}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today Sold</p>
                            <p className="font-bold text-slate-700">{row.units_sold || 0}</p>
                          </div>
                        </div>

                        {/* Monthly Stats on Card */}
                        {mStats && (
                          <div className="mt-3 rounded-xl bg-indigo-50/50 border border-indigo-100 p-2.5 flex justify-between items-center">
                            <div>
                              <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Month Rev</p>
                              <p className="text-xs font-black text-indigo-700">₹{mStats.revenue.toLocaleString("en-IN")}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Units</p>
                              <p className="text-xs font-black text-indigo-700">{mStats.units_sold}</p>
                            </div>
                          </div>
                        )}

                        <div className="mt-3">
                          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Closing stock
                          </p>

                          {!row.is_active ? (
                            <p className="text-xs text-slate-400">Unavailable</p>
                          ) : row.is_closing_entered ? (
                            <div className="inline-flex w-full justify-center rounded-xl bg-violet-600 px-3 py-2 text-sm font-bold text-white shadow-md shadow-violet-200">
                              {row.closing_stock}
                            </div>
                          ) : (
                            <input
                              type="number"
                              className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-indigo-800 outline-none transition-all focus:border-violet-500 focus:ring-0"
                              value={inputValue}
                              placeholder="Enter qty"
                              onChange={(e) => handleClosingStockChange(row.product_id, e.target.value)}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="w-full overflow-x-auto overflow-y-auto rounded-2xl border border-slate-200 shadow-md bg-white scroll-thin"
              style={{ maxHeight: "calc(100vh - 220px)" }}
            >
              {isLoading && (
                <div className="sticky top-0 left-0 w-full pointer-events-none z-200" style={{ height: 0 }}>
                  <div className="absolute left-0 w-full flex items-center justify-center" style={{ height: 400, top: 0 }}>
                    <div className="px-8 py-6 flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 shadow-lg">
                      <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
                      <p className="text-sm font-semibold text-slate-700">Loading sales data…</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="relative">
                {isLoading && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-100" />}

              <table className="border-collapse" style={{ tableLayout: "fixed" }}>
                <thead className="sticky top-0 z-40">
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {/* Sticky product column */}
                    <th
                      className="sticky left-0 z-50 text-left text-xs font-semibold tracking-wide whitespace-nowrap px-4 py-3 bg-violet-50/95 text-violet-700 border-r border-slate-200 border-l-2 border-l-violet-500"
                      style={{ minWidth: PRODUCT_COL_W, width: PRODUCT_COL_W, boxShadow: "2px 0 6px rgba(0,0,0,0.07)" }}
                    >
                      Product
                    </th>

                    {days.map((d) => {
                      const dateStr  = formatDate(d);
                      const isToday  = dateStr === today;
                      const isFuture = dateStr > today;
                      const colW     = isToday ? TODAY_COL_W : DAY_COL_W;
                      return (
                        <th
                          key={dateStr}
                          ref={isToday ? todayThRef : undefined}
                          onClick={() => !isFuture && navigate(`?date=${dateStr}`)}
                          className={[
                            "text-xs font-semibold whitespace-nowrap border-r border-slate-200 last:border-r-0 cursor-pointer transition-colors",
                            isToday  ? "bg-violet-600 text-white"
                            : isFuture ? "bg-slate-50/60 text-slate-300"
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100",
                          ].join(" ")}
                          style={{ minWidth: colW, width: colW, textAlign: "center", padding: "8px 4px" }}
                        >
                          <span className={[
                            "inline-flex items-center justify-center rounded-full",
                            isToday ? "w-7 h-7 bg-white text-violet-700 text-xs font-bold shadow-md"
                            : "w-6 h-6 text-xs font-semibold",
                          ].join(" ")}>
                            {d.getDate()}
                          </span>
                          {isToday && (
                            <div className="text-[9px] font-black text-white/80 mt-0.5 tracking-widest uppercase">Today</div>
                          )}
                        </th>
                      );
                    })}
                    <th
                      className="text-[10px] font-bold tracking-widest uppercase text-violet-700 bg-violet-50/90 whitespace-nowrap px-4 py-3 border-l border-violet-200"
                      style={{ minWidth: 100, width: 100 }}
                    >
                      Month Rev
                    </th>
                    <th
                      className="text-[10px] font-bold tracking-widest uppercase text-indigo-700 bg-indigo-50/90 whitespace-nowrap px-4 py-3 border-l border-indigo-200"
                      style={{ minWidth: 80, width: 80 }}
                    >
                      Units
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan={days.length + 3} className="px-4 py-8 text-center text-slate-400 text-sm">Loading…</td></tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={days.length + 3}>
                        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50">
                          <Package className="h-12 w-12 text-slate-200 mb-4" />
                          <p className="text-slate-500 font-medium">No products found.</p>
                        </div>
                      </td>
                    </tr>
                  ) : products.map((row, rowIdx) => (
                    <tr
                      key={row.product_id}
                      className={[
                        "group transition-colors",
                        rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                        "hover:bg-violet-50/25",
                        !row.is_active ? "opacity-60" : ""
                      ].join(" ")}
                    >
                      {/* Sticky product name */}
                      <td
                        className="sticky left-0 z-20 px-4 py-4 text-sm font-semibold border-r border-slate-200 whitespace-nowrap"
                        style={{
                          minWidth: PRODUCT_COL_W, width: PRODUCT_COL_W,
                          background: "rgba(250,249,255,0.97)",
                          boxShadow: "2px 0 4px rgba(0,0,0,0.04), inset -1px 0 0 rgba(226,232,240,0.55)",
                          color: !row.is_active ? "#b0b0b0" : undefined,
                        }}
                      >
                        {row.product_name}
                        {!row.is_active && (
                          <span className="ml-2 text-xs font-semibold text-red-400">(Inactive)</span>
                        )}
                      </td>

                      {days.map((d) => {
                        const dateStr = formatDate(d);
                        const isToday = dateStr === today;
                        const isPast = dateStr < today;
                        const isFuture = dateStr > today;
                        const colW = isToday ? TODAY_COL_W : DAY_COL_W;
                        return (
                          <td
                            key={dateStr}
                            className={[
                              "text-center border-r border-slate-100 last:border-r-0",
                              isToday ? "bg-violet-50/40 border-b border-violet-100" : "",
                              isFuture ? "bg-slate-50/20" : "",
                            ].join(" ")}
                            style={{ minWidth: colW, width: colW, padding: "10px 4px" }}
                          >
                            {isToday ? (
                              !row.is_active ? (
                                // Inactive: only show backend closing stock, no input
                                row.is_closing_entered ? (
                                  <span className="text-xs font-semibold text-violet-700" style={{ fontFamily: "'DM Mono', monospace" }}>
                                    {row.closing_stock}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">Inactive</span>
                                )
                              ) : row.is_closing_entered ? (
                                <span className="text-xs font-semibold text-violet-700" style={{ fontFamily: "'DM Mono', monospace" }}>
                                  {row.closing_stock}
                                </span>
                              ) : (
                                <input
                                  type="number"
                                  className="w-16 px-2 py-2 rounded-xl border border-violet-300 bg-white text-indigo-800 text-xs font-medium text-center outline-none transition-all focus:border-violet-600 focus:ring-2 focus:ring-violet-200 shadow-sm"
                                  style={{ fontFamily: "'DM Mono', monospace" }}
                                  value={closingStocks[row.product_id] ?? ""}
                                  placeholder="0"
                                  onChange={(e) => handleClosingStockChange(row.product_id, e.target.value)}
                                  disabled={row.is_closing_entered}
                                />
                              )
                            ) : isPast ? (
                              <span className="text-xs text-slate-300" style={{ fontFamily: "'DM Mono', monospace" }}>—</span>
                            ) : (
                              <span className="text-xs text-slate-200" style={{ fontFamily: "'DM Mono', monospace" }}>·</span>
                            )}
                           </td>
                         );
                       })}
                       {/* Monthly Stats Cells */}
                       <td className="text-center px-4 py-4 text-xs font-bold text-violet-700 bg-violet-50/30 border-l border-violet-100" style={{ fontFamily: "'DM Mono', monospace" }}>
                         ₹{monthlyStats?.productMap[row.product_id]?.revenue?.toLocaleString("en-IN") || "—"}
                       </td>
                       <td className="text-center px-4 py-4 text-xs font-bold text-indigo-700 bg-indigo-50/30 border-l border-indigo-100" style={{ fontFamily: "'DM Mono', monospace" }}>
                         {monthlyStats?.productMap[row.product_id]?.units_sold || "—"}
                       </td>
                     </tr>
                    ))}
                </tbody>

                {products.length > 0 && !isLoading && (
                  <tfoot className="sticky bottom-0 z-40">
                    <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold">
                      <td
                        className="sticky left-0 z-50 bg-slate-100 px-4 py-3 text-xs uppercase tracking-widest text-slate-500 border-r border-slate-200 whitespace-nowrap"
                        style={{ minWidth: PRODUCT_COL_W, width: PRODUCT_COL_W, boxShadow: "2px 0 4px rgba(0,0,0,0.08)" }}
                      >
                        {products.length} Products
                      </td>
                      {days.map((d) => {
                        const dateStr = formatDate(d);
                        const isToday = dateStr === today;
                        const colW    = isToday ? TODAY_COL_W : DAY_COL_W;
                        return (
                          <td
                            key={dateStr}
                            className={["border-r border-slate-200 last:border-r-0 text-center px-1 py-3", isToday ? "bg-violet-100" : "bg-slate-100"].join(" ")}
                            style={{ minWidth: colW, width: colW }}
                          >
                            {isToday && (
                              <span className="text-xs font-bold text-violet-700" style={{ fontFamily: "'DM Mono', monospace" }}>
                                {totalClosing}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="text-center px-1 py-3 bg-violet-200/50 border-l border-violet-200">
                        <span className="text-xs font-black text-violet-800" style={{ fontFamily: "'DM Mono', monospace" }}>
                          ₹{monthlyStats?.revenue?.toLocaleString("en-IN") || 0}
                        </span>
                      </td>
                      <td className="text-center px-1 py-3 bg-indigo-200/50 border-l border-indigo-200">
                        <span className="text-xs font-black text-indigo-800" style={{ fontFamily: "'DM Mono', monospace" }}>
                          {monthlyStats?.units?.toLocaleString("en-IN") || 0}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            </div>
          )}

          {/* Save */}
          <div className="hidden md:flex justify-end pt-1">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="inline-flex cursor-pointer items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-linear-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-200 hover:from-violet-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-violet-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Closing Stock
            </button>
          </div>

          {isMobile && (
            <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:hidden">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Closing Stock
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailySales;