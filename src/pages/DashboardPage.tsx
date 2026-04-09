import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* TOP SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-slate-500 font-medium">
            {getGreeting()}, {user?.name}
          </p>
          <h1 className="text-2xl font-bold text-slate-900">{shop?.name}</h1>
        </div>

        <div className="flex items-center gap-3">
          {hasShiftToday ? (
            <div
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${
                isShiftOpen
                  ? "border-green-100 bg-green-50 text-green-700"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${isShiftOpen ? "bg-green-500 animate-pulse" : "bg-slate-400"}`}
              />
              {shiftStatusText}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-full text-red-600 text-sm font-semibold">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              No shift started
            </div>
          )}

          {!hasShiftToday && (
            <button 
              onClick={openStartShiftModal}
              className="px-6 py-2 cursor-pointer bg-[#1D9E75] text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-[#168a65] transition-all active:scale-95"
            >
              Start Shift
            </button>
          )}
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Revenue" value={formatCurrency(data.todayShift?.day_total_revenue || 0)} color="text-[#1D9E75]" />
        <StatCard title="Today's Profit" value={formatCurrency(data.todayShift?.day_total_profit || 0)} color="text-blue-600" />
        <StatCard title="Units Sold" value={totalUnits.toString()} color="text-purple-600" />
        <StatCard 
          title="Low Stock Alerts" 
          value={data.alertCount.toString()} 
          color={data.alertCount > 0 ? "text-red-600 font-bold" : "text-slate-400"}
          description={data.alertCount > 0 ? "Tap to view items" : "No low stock items"}
          onClick={data.alertCount > 0 ? openLowStockModal : undefined}
        />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Quick Actions */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold mb-4 text-slate-800">Quick Actions</h3>
          <div className="space-y-3">
            <ActionButton label="Add Product" path="/products" color="bg-green-50 text-green-700" icon={<BoxIcon />} />
            <ActionButton label="Daily Sheet" path="/daily" color="bg-purple-50 text-purple-700" icon={<ListIcon />} />
            <ActionButton label="Add Stock" path="/add-stock" color="bg-blue-50 text-blue-700" icon={<PlusIcon />} />
            <ActionButton label="Reports" path="/reports" color="bg-amber-50 text-amber-700" icon={<ChartIcon />} />
            {hasShiftToday && isShiftOpen && (
              <ActionButton label="Close Shift" path="/daily-sheet" color="bg-red-50 text-red-700" icon={<CloseIcon />} />
            )}
          </div>
        </div>

        {/* RIGHT: Top Products */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold mb-4 text-slate-800">Top Performing Products</h3>
          {data.todayShift ? (
            <div className="space-y-4">
              {topProducts.map((p, i) => (
                <div key={p.product_id} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${['bg-green-500', 'bg-blue-500', 'bg-amber-500'][i]}`} />
                    <span className="font-semibold">{p.product_name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(p.revenue)}</p>
                    <p className="text-xs text-slate-500">{p.units_sold} units sold</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 mb-2 opacity-50">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">Start a shift to see today's performance</p>
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
        currentUserRole={user?.role}
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
}: {
  title: string;
  value: string;
  color: string;
  description?: string;
  onClick?: () => void;
}) {
  const isClickable = Boolean(onClick);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={`w-full bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left transition-all ${
        isClickable
          ? "cursor-pointer hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30"
          : "cursor-default"
      }`}
    >
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
      <p className={`text-xl sm:text-2xl font-black ${color}`}>{value}</p>
      {description ? <p className="mt-1 text-xs font-medium text-slate-500">{description}</p> : null}
    </button>
  );
}

function ActionButton({ label, path, color, icon }: { label: string; path: string; color: string; icon: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <button 
      onClick={() => navigate(path)}
      className={`w-full flex cursor-pointer items-center gap-4 p-3 rounded-xl font-semibold transition-all hover:shadow-md ${color} active:scale-95`}
    >
      {icon}
      {label}
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