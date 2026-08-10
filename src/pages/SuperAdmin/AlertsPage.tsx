import React, { useEffect, useState } from "react";
import { fetchGlobalAlertsApi } from "../../services/superadmin.service";
import { Bell, ShieldAlert, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [isReadFilter, setIsReadFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = {
        is_read: isReadFilter === "read" ? true : isReadFilter === "unread" ? false : undefined,
        page,
        limit: 20,
      };
      const data = await fetchGlobalAlertsApi(params);
      setAlerts(data.alerts);
      setTotal(data.total);
      setPages(data.pages);
    } catch (error) {
      console.error("Error loading alerts", error);
      toast.error("Failed to load platform alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [page, isReadFilter]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "low_stock":
      case "out_of_stock":
        return <span className="text-amber-500">⚠️</span>;
      case "revenue_drop":
      case "high_expense":
      case "price_loss":
        return <span className="text-rose-500">📉</span>;
      case "new_shop":
        return <span className="text-emerald-500">🎉</span>;
      default:
        return <span className="text-blue-500">🔔</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <Bell className="text-emerald-500 w-7 h-7 animate-swing" />
          Platform Alerts
        </h1>
        <p className="text-sm text-slate-400 font-semibold">
          Platform-wide critical operations monitoring and system notifications.
        </p>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
          Filter Notifications
        </span>

        <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl p-1 bg-slate-50">
          {[
            { key: "all", label: "All Alerts" },
            { key: "unread", label: "Unread Only" },
            { key: "read", label: "Read Logs" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setIsReadFilter(item.key);
                setPage(1);
              }}
              className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                isReadFilter === item.key
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ALERTS GRID */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="h-64 bg-white border border-slate-100 rounded-3xl flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {alerts.map((alert) => (
              <div
                key={alert._id}
                className={`p-5 rounded-3xl border shadow-sm transition-all flex items-start gap-4 ${
                  alert.is_read
                    ? "bg-white border-slate-100 opacity-70"
                    : "bg-white border-emerald-100 hover:border-emerald-300 shadow-md shadow-emerald-500/5"
                }`}
              >
                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-lg">
                  {getAlertIcon(alert.type)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-extrabold text-slate-800 text-sm sm:text-base">
                      {alert.shop_id?.name || "DailySales Platform"}
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-400 font-bold">
                      {new Date(alert.created_at).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-600">
                    {alert.message}
                  </p>
                  {alert.product_id && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Product Ref: {alert.product_id.name}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {alerts.length === 0 && (
              <div className="h-64 bg-white border border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-400">
                <ShieldAlert className="w-12 h-12 opacity-30 mb-2" />
                <p className="font-bold">No notifications to display.</p>
              </div>
            )}
          </>
        )}

        {/* PAGINATION PANEL */}
        {!loading && pages > 1 && (
          <div className="bg-white border border-slate-100 rounded-3xl px-6 py-4 flex items-center justify-between shadow-sm">
            <span className="text-xs text-slate-400 font-bold">
              Showing page {page} of {pages} ({total} alerts)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page === pages}
                onClick={() => setPage(page + 1)}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
