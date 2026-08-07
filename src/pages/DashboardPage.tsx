import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Alert, DailyEntry, WeeklyReport } from "../api/api.types";
import type { AuthUser } from "../types/auth.types";
import { fetchDashboardDataApi, fetchLowStockAlertsApi } from "../services/dashboard.service";
import { fetchShopUsersApi } from "../services/user.service";
import { startShift as startShiftApi } from "../services/shift.service";
import LowStockAlertsModal from "../components/LowStockAlertsModal";
import StartShiftModal from "../components/StartShiftModal";

interface DashboardData {
  todayShift: DailyEntry | null;
  alertCount: number;
  weeklyReport: WeeklyReport | null;
  loading: boolean;
}

export default function DashboardPage() {
  const { user, shop } = useAuth();
  const impersonatedShopId = localStorage.getItem("super_admin_shop_id");

  if (user?.role === "super_admin" && !impersonatedShopId) {
    return <Navigate to="/super-admin" replace />;
  }

  const pendingShiftStorageKey = "pending_shift_worker_id";
  const [data, setData] = useState<DashboardData>({
    todayShift: null,
    alertCount: 0,
    weeklyReport: null,
    loading: true,
  });
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);
  const [lowStockAlerts, setLowStockAlerts] = useState<Alert[]>([]);
  const [lowStockLoading, setLowStockLoading] = useState(false);
  const [lowStockError, setLowStockError] = useState<string | null>(null);
  const [isStartShiftModalOpen, setIsStartShiftModalOpen] = useState(false);
  const [pendingWorkerId, setPendingWorkerId] = useState<string>(
    localStorage.getItem(pendingShiftStorageKey) || ""
  );
  const [shopUsers, setShopUsers] = useState<AuthUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [shopUsersError, setShopUsersError] = useState<string | null>(null);
  const [startingShift, setStartingShift] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const dashboardData = await fetchDashboardDataApi();
      setData({
        todayShift: dashboardData.todayShift,
        alertCount: dashboardData.alertCount,
        weeklyReport: dashboardData.weeklyReport,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching dashboard data", error);
      setData((prev) => ({ ...prev, loading: false }));
    }
  };

  const fetchShopUsers = async () => {
    if (user?.role !== "owner") {
      return;
    }

    setLoadingUsers(true);
    setShopUsersError(null);
    try {
      const users = await fetchShopUsersApi();
      setShopUsers(users);

      const selectedUserStillValid =
        pendingWorkerId && users.some((u) => u._id === pendingWorkerId && u.is_active !== false);

      if (!selectedUserStillValid) {
        const firstActiveUser = users.find((u) => u.is_active !== false);
        const nextWorkerId = firstActiveUser?._id || "";
        setPendingWorkerId(nextWorkerId);

        if (nextWorkerId) {
          localStorage.setItem(pendingShiftStorageKey, nextWorkerId);
        } else {
          localStorage.removeItem(pendingShiftStorageKey);
        }
      }
    } catch (error) {
      console.error("Error fetching shop users", error);
      setShopUsers([]);
      setShopUsersError("Could not load shop users.");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getShiftStartedByText = () => {
    const starter = data.todayShift?.opened_by;

    if (!starter || typeof starter === "string") {
      return "Shift open";
    }

    const roleLabel = starter.role === "owner" ? "Owner" : "Worker";
    return `Shift open · Started by ${roleLabel} (${starter.name})`;
  };

  const openLowStockModal = async () => {
    setIsLowStockModalOpen(true);

    if (lowStockAlerts.length > 0 || lowStockLoading) {
      return;
    }

    setLowStockLoading(true);
    setLowStockError(null);

    try {
      const alerts = await fetchLowStockAlertsApi();
      setLowStockAlerts(alerts);
    } catch (error) {
      console.error("Error fetching low stock alerts", error);
      setLowStockError("We couldn't load the item list right now.");
    } finally {
      setLowStockLoading(false);
    }
  };

  const closeLowStockModal = () => {
    setIsLowStockModalOpen(false);
  };

  const openStartShiftModal = async () => {
    setIsStartShiftModalOpen(true);
    await fetchShopUsers();
  };

  const closeStartShiftModal = () => {
    setIsStartShiftModalOpen(false);
  };

  const handleStartShift = async () => {
    try {
      setStartingShift(true);
      toast.loading("Starting shift...");

      const selectedWorkerId =
        user?.role === "owner" && pendingWorkerId ? pendingWorkerId : undefined;

      await startShiftApi(selectedWorkerId);

      localStorage.removeItem(pendingShiftStorageKey);
      setPendingWorkerId("");
      setIsStartShiftModalOpen(false);
      toast.dismiss();
      toast.success("Shift started successfully!");
      await fetchDashboardData();
    } catch (error) {
      toast.dismiss();
      if (axios.isAxiosError(error)) {
        const message =
          (error.response?.data as { message?: string } | undefined)?.message ||
          "Error starting shift. Ensure yesterday's shift is closed.";
        toast.error(message);
        return;
      }

      toast.error("Error starting shift. Ensure yesterday's shift is closed.");
    } finally {
      setStartingShift(false);
    }
  };

  if (data.loading) {
    return <DashboardSkeleton />;
  }

  const topProducts = data.todayShift?.products
    ? [...data.todayShift.products]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3)
    : [];

  const totalUnits = data.todayShift?.products.reduce((acc:any, p:any) => acc + p.units_sold, 0) || 0;
  const hasShiftToday = Boolean(data.todayShift);
  const isShiftOpen = data.todayShift?.is_closed === false;
  const shiftStatusText = isShiftOpen
    ? getShiftStartedByText()
    : hasShiftToday
      ? "Shift closed today"
      : "No shift started";

  return (
    <div className="relative space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Decorative Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-emerald-200/20 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-200/20 blur-[120px]"></div>
      </div>

      {/* TOP SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="space-y-1">
          <p className="text-emerald-600 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {getGreeting()}, {user?.name}
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">{shop?.name}</h1>
        </div>

        <div className="flex items-center gap-3">
          {hasShiftToday ? (
            <div className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm font-bold shadow-sm backdrop-blur-md ${
                isShiftOpen ? "border-emerald-200 bg-emerald-50/80 text-emerald-800" : "border-slate-200 bg-white/80 text-slate-600"
              }`}>
              <span className={`relative flex h-3 w-3`}>
                {isShiftOpen && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isShiftOpen ? "bg-emerald-500" : "bg-slate-400"}`}></span>
              </span>
              {shiftStatusText}
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-rose-50/80 backdrop-blur-md border border-rose-200 rounded-2xl text-rose-700 text-sm font-bold shadow-sm">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
              No shift started
            </div>
          )}

          {!hasShiftToday && (
            <button 
              onClick={openStartShiftModal}
              className="group relative px-6 py-2.5 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 transition-all active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative flex items-center gap-2">
                Start Shift
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 group-hover:translate-x-1 transition-transform"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </span>
            </button>
          )}
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative z-10">
        <StatCard title="Today's Revenue" value={formatCurrency(data.todayShift?.day_total_revenue || 0)} color="text-white" highlight={true} icon="💰" />
        <StatCard title="Today's Profit" value={formatCurrency(data.todayShift?.day_total_profit || 0)} color="text-slate-800" icon="📈" />
        <StatCard title="Units Sold" value={totalUnits.toString()} color="text-slate-800" icon="📦" />
        <StatCard 
          title="Low Stock Alerts" 
          value={data.alertCount.toString()} 
          color={data.alertCount > 0 ? "text-rose-600 font-black" : "text-slate-400"}
          description={data.alertCount > 0 ? "Tap to view items" : "No low stock items"}
          onClick={data.alertCount > 0 ? openLowStockModal : undefined}
          icon="⚠️"
        />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 relative z-10">
        {/* LEFT: Quick Actions */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-white shadow-xl shadow-slate-200/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <ActionButton label="Add Product" path="/products" color="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:shadow-emerald-200/50" icon={<BoxIcon />} />
            <ActionButton label="Daily Sheet" path="/daily" color="bg-purple-50 text-purple-700 hover:bg-purple-100 hover:shadow-purple-200/50" icon={<ListIcon />} />
            <ActionButton label="Add Stock" path="/add-stock" color="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:shadow-blue-200/50" icon={<PlusIcon />} />
            <ActionButton label="Reports" path="/reports" color="bg-amber-50 text-amber-700 hover:bg-amber-100 hover:shadow-amber-200/50" icon={<ChartIcon />} />
            {hasShiftToday && isShiftOpen && (
              <div className="col-span-2 mt-2">
                <ActionButton label="Close Shift" path="/daily" color="bg-rose-50 text-rose-700 hover:bg-rose-100 hover:shadow-rose-200/50 border border-rose-100" icon={<CloseIcon />} fullWidth />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Top Products */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-white shadow-xl shadow-slate-200/50 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path d="M5 12l5 5L20 7"/></svg>
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Top Performing Products</h3>
            </div>
            {hasShiftToday && (
              <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-500 uppercase tracking-wider">Today</span>
            )}
          </div>
          
          {data.todayShift ? (
            <div className="space-y-4 flex-1">
              {topProducts.map((p, i) => (
                <div key={p.product_id} className="group flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-100 hover:bg-emerald-50/30 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl font-bold text-lg shadow-inner ${
                      i === 0 ? 'bg-amber-100 text-amber-600' : 
                      i === 1 ? 'bg-slate-200 text-slate-600' : 
                      'bg-orange-100 text-orange-600'
                    }`}>
                      #{i + 1}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition-colors">{p.product_name}</span>
                      <p className="text-xs font-semibold text-slate-400 mt-0.5">{p.units_sold} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-xl text-slate-900">{formatCurrency(p.revenue)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mt-1">Revenue</p>
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="font-bold">No sales yet today.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 min-h-[250px] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 opacity-40">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-base font-bold text-slate-500">No active shift</p>
              <p className="text-sm font-medium mt-1 opacity-80">Start a shift to track your sales performance.</p>
            </div>
          )}
        </div>
      </div>

      <LowStockAlertsModal
        open={isLowStockModalOpen}
        onClose={closeLowStockModal}
        alerts={lowStockAlerts}
        loading={lowStockLoading}
        error={lowStockError}
        onRetry={openLowStockModal}
      />

      <StartShiftModal
        open={isStartShiftModalOpen}
        onClose={closeStartShiftModal}
        currentUserRole={user?.role === "super_admin" ? "owner" : user?.role}
        users={shopUsers}
        loadingUsers={loadingUsers}
        usersError={shopUsersError}
        pendingWorkerId={pendingWorkerId}
        onSelectWorker={(workerId) => {
          setPendingWorkerId(workerId);
          localStorage.setItem(pendingShiftStorageKey, workerId);
        }}
        onRetryUsers={fetchShopUsers}
        onStartShift={handleStartShift}
        startingShift={startingShift}
      />
    </div>
  );
}

/* HELPER COMPONENTS */

function StatCard({
  title,
  value,
  color,
  description,
  onClick,
  highlight = false,
  icon,
}: {
  title: string;
  value: string;
  color: string;
  description?: string;
  onClick?: () => void;
  highlight?: boolean;
  icon?: string;
}) {
  const isClickable = Boolean(onClick);
  
  const baseClasses = "relative w-full p-6 sm:p-7 rounded-[2rem] border shadow-xl text-left transition-all duration-300 overflow-hidden group";
  const bgClasses = highlight 
    ? "bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400 shadow-emerald-500/20" 
    : "bg-white/90 backdrop-blur-xl border-white shadow-slate-200/50";
    
  const hoverClasses = isClickable 
    ? "cursor-pointer hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/30" 
    : "cursor-default hover:-translate-y-0.5 hover:shadow-2xl";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={`${baseClasses} ${bgClasses} ${hoverClasses}`}
    >
      {highlight && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
      )}
      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
        <div className="flex justify-between items-start">
          <p className={`text-xs font-black uppercase tracking-widest ${highlight ? "text-emerald-50" : "text-slate-400"}`}>
            {title}
          </p>
          {icon && (
            <div className={`text-xl ${highlight ? "opacity-80" : "opacity-40"}`}>{icon}</div>
          )}
        </div>
        <div>
          <p className={`text-3xl sm:text-4xl font-black tracking-tight ${color}`}>{value}</p>
          {description && (
            <p className={`mt-2 text-xs font-bold ${highlight ? "text-emerald-100" : "text-slate-400"}`}>
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function ActionButton({ label, path, color, icon, fullWidth = false }: { label: string; path: string; color: string; icon: React.ReactNode, fullWidth?: boolean }) {
  const navigate = useNavigate();
  return (
    <button 
      onClick={() => navigate(path)}
      className={`${fullWidth ? 'w-full flex-row justify-center' : 'w-full flex-col items-start'} flex cursor-pointer gap-3 p-4 rounded-2xl font-bold transition-all shadow-sm active:scale-95 group ${color}`}
    >
      <div className={`p-2 rounded-xl bg-white/60 shadow-sm group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className={fullWidth ? 'text-base' : 'text-sm mt-1'}>{label}</span>
    </button>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-8 w-48 bg-slate-200 rounded" />
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 h-64 bg-slate-200 rounded-2xl" />
        <div className="lg:col-span-8 h-64 bg-slate-200 rounded-2xl" />
      </div>
    </div>
  );
}


/* INLINE ICONS */
const BoxIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M21 8l-9-4-9 4 9 4 9-4zM3 12l9 4 9-4M3 16l9 4 9-4" /></svg>;
const ListIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
const PlusIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 5v14M5 12h14" /></svg>;
const ChartIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>;
const CloseIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M18 6L6 18M6 6l12 12" /></svg>;