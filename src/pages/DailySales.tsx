import React, { useEffect, useRef, useState } from "react";
import { getAllProducts } from "../services/product.service";
import { getDailyReport, closeShift } from "../services/shift.service";
import type { DailyReportProduct, DailyReport } from "../types/dailyreport.types";
import type { Product } from "../types/product.types";
import { ShoppingBag, CheckCircle, Loader2, Package, Save, CalendarDays } from "lucide-react";

const getDaysInMonth = (year: number, month: number) => {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) { days.push(new Date(date)); date.setDate(date.getDate() + 1); }
  return days;
};
const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const PRODUCT_COL_W = 200;
const DAY_COL_W     = 52;
const TODAY_COL_W   = 110;

const DailySales: React.FC = () => {
  // Add is_active to each row for UI logic
  const [products, setProducts] = useState<(DailyReportProduct & { is_active: boolean })[]>([]);
  const [closingStocks, setClosingStocks] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading]         = useState(false);
  const [today, setToday]                 = useState<string>("");
  const [days, setDays]                   = useState<Date[]>([]);
  const [refreshFlag, setRefreshFlag]     = useState(0);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const todayThRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    const now = new Date();
    setToday(formatDate(now));
    setDays(getDaysInMonth(now.getFullYear(), now.getMonth()));
  }, []);

  // Scroll so 1 previous day + today are visible at the left edge
  useEffect(() => {
    if (!today || days.length === 0) return;
    requestAnimationFrame(() => {
      const container = scrollRef.current;
      const todayTh   = todayThRef.current;
      if (!container || !todayTh) return;
      container.scrollLeft = Math.max(0, todayTh.offsetLeft - PRODUCT_COL_W - DAY_COL_W);
    });
  }, [today, days]);

  useEffect(() => {
    if (!today) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const productsRes = await getAllProducts();
        const allProducts: Product[] = productsRes;
        let dailyMap: Record<string, DailyReportProduct> = {};
        try {
          const reportRes = await getDailyReport(today);
          const report: DailyReport = reportRes.data;
          if (report?.products)
            dailyMap = Object.fromEntries(report.products.map((p) => [p.product_id, p]));
        } catch { /* no report yet */ }

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
          return { ...base, is_active: prod.is_active };
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

  const handleClosingStockChange = (product_id: string, value: string) => {
    // Strip leading zeros: "020" → "20", keep empty string as-is
    const cleaned = value === "" ? "" : String(parseInt(value, 10) || 0);
    setClosingStocks((prev) => ({ ...prev, [product_id]: cleaned }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const closingArr = Object.entries(closingStocks).map(([product_id, v]) => ({
        product_id, closing_stock: v === "" ? 0 : parseInt(v, 10),
      }));
      await closeShift(closingArr);
      setRefreshFlag((f) => f + 1);
      alert("Closing stock saved!");
    } catch { alert("Failed to save closing stock"); }
    setIsLoading(false);
  };

  const todayDateObj      = today ? new Date(today) : new Date();
  const todayLabel        = todayDateObj.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const currentMonthLabel = todayDateObj.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const totalClosing      = Object.values(closingStocks).reduce((s, v) => s + (parseInt(v) || 0), 0);

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

      <div className="max-w-7xl mx-auto px-4 pt-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daily Sales Entry</h1>
              <p className="text-xs text-slate-400 mt-0.5">{todayLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
              <CheckCircle className="h-3.5 w-3.5" /> Shift Active
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
              <CalendarDays className="h-3.5 w-3.5" /> {currentMonthLabel}
            </span>
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
            <p className="text-xs text-slate-400">← Scroll to view past days · Today is highlighted</p>
          </div>

          {/* Table wrapper */}
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
                          className={[
                            "text-xs font-semibold whitespace-nowrap border-r border-slate-200 last:border-r-0",
                            isToday  ? "bg-linear-to-b from-violet-100 to-violet-50 text-violet-800"
                            : isFuture ? "bg-slate-50/60 text-slate-300"
                            : "bg-slate-50 text-slate-500",
                          ].join(" ")}
                          style={{ minWidth: colW, width: colW, textAlign: "center", padding: "8px 4px" }}
                        >
                          <span className={[
                            "inline-flex items-center justify-center rounded-full",
                            isToday ? "w-7 h-7 bg-violet-600 text-white text-xs font-bold shadow-sm shadow-violet-300"
                            : "w-6 h-6 text-xs font-semibold",
                          ].join(" ")}>
                            {d.getDate()}
                          </span>
                          {isToday && (
                            <div className="text-[9px] font-bold text-violet-500 mt-0.5 tracking-widest uppercase">Today</div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan={days.length + 1} className="px-4 py-8 text-center text-slate-400 text-sm">Loading…</td></tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={days.length + 1}>
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
                        const dateStr  = formatDate(d);
                        const isToday  = dateStr === today;
                        const isPast   = dateStr < today;
                        const isFuture = dateStr > today;
                        const colW     = isToday ? TODAY_COL_W : DAY_COL_W;
                        return (
                          <td
                            key={dateStr}
                            className={[
                              "text-center border-r border-slate-100 last:border-r-0",
                              isToday  ? "bg-violet-50/40 border-b border-violet-100" : "",
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
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end pt-1">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-linear-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-200 hover:from-violet-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-violet-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Closing Stock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySales;