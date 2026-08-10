import React, { useEffect, useState } from "react";
import { fetchActivityLogsApi } from "../../services/superadmin.service";
import { Search, History, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export default function ActivityLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        search: search || undefined,
        action: actionFilter === "all" ? undefined : actionFilter,
        page,
        limit: 20,
      };
      const data = await fetchActivityLogsApi(params);
      setLogs(data.logs);
      setTotal(data.total);
      setPages(data.pages);
    } catch (error) {
      console.error("Error loading logs", error);
      toast.error("Failed to load activity logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "SHOP_CREATE":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "SHOP_RESET":
        return "bg-rose-50 text-rose-700 border-rose-100";
      case "USER_PASSWORD_RESET":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "LOGIN":
        return "bg-blue-50 text-blue-700 border-blue-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <History className="text-emerald-500 w-7 h-7" />
          Platform Activity Logs
        </h1>
        <p className="text-sm text-slate-400 font-semibold">
          Real-time audit trails of critical system actions, login events, and user operations.
        </p>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search logs by operator name, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </form>

        <div className="flex items-center gap-3">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 bg-white"
          >
            <option value="all">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="SHOP_CREATE">SHOP_CREATE</option>
            <option value="SHOP_UPDATE">SHOP_UPDATE</option>
            <option value="SHOP_RESET">SHOP_RESET</option>
            <option value="USER_UPDATE">USER_UPDATE</option>
            <option value="USER_PASSWORD_RESET">USER_PASSWORD_RESET</option>
          </select>
        </div>
      </div>

      {/* LOGS LIST */}
      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 min-w-[850px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider text-xs">
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-4">Operator</th>
                  <th className="py-4 px-4">Action</th>
                  <th className="py-4 px-4">Description</th>
                  <th className="py-4 px-4">Shop Scope</th>
                  <th className="py-4 px-6">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 transition-colors text-xs sm:text-sm">
                    {/* Timestamp */}
                    <td className="py-4 px-6 font-semibold text-slate-500">
                      {new Date(log.created_at).toLocaleString("en-IN")}
                    </td>

                    {/* Operator */}
                    <td className="py-4 px-4">
                      <div className="font-extrabold text-slate-800">{log.user_name}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">ID: {log.user_id}</div>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 border text-[10px] font-black rounded-lg ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Details */}
                    <td className="py-4 px-4 font-semibold text-slate-700 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>

                    {/* Shop */}
                    <td className="py-4 px-4 font-bold text-slate-800">
                      {log.shop_id?.name || (
                        <span className="text-slate-400 italic font-semibold">Platform Global</span>
                      )}
                    </td>

                    {/* IP */}
                    <td className="py-4 px-6 font-medium text-slate-500">
                      {log.ip_address || "Internal Script"}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                      No logs matching the filters found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION PANEL */}
        {!loading && pages > 1 && (
          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold">
              Showing page {page} of {pages} ({total} audit logs)
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
