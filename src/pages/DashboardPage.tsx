import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { DailyEntry, WeeklyReport } from "../api/api.types";
import { fetchDashboardDataApi } from "../services/dashboard.service";

interface DashboardData {
  todayShift: DailyEntry | null;
  alertCount: number;
  weeklyReport: WeeklyReport | null;
  loading: boolean;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, shop } = useAuth();
  const [data, setData] = useState<DashboardData>({
    todayShift: null,
    alertCount: 0,
    weeklyReport: null,
    loading: true,
  });

  useEffect(() => {
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

  if (data.loading) {
    return <DashboardSkeleton />;
  }

  const topProducts = data.todayShift?.products
    ? [...data.todayShift.products]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3)
    : [];

  const totalUnits = data.todayShift?.products.reduce((acc:any, p:any) => acc + p.units_sold, 0) || 0;

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
          {data.todayShift ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-full text-green-700 text-sm font-semibold">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Shift open
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-full text-red-600 text-sm font-semibold">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              No shift started
            </div>
          )}
          
          {!data.todayShift && (
            <button 
              onClick={() => navigate("/daily-sheet")}
              className="px-6 py-2 cursor-pointer bg-[#1D9E75] text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-[#168a65] transition-all active:scale-95"
            >
              Start Today's Shift
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
            {data.todayShift && (
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
    </div>
  );
}

/* HELPER COMPONENTS */

function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
      <p className={`text-xl sm:text-2xl font-black ${color}`}>{value}</p>
    </div>
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