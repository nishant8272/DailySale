import React, { useEffect, useState } from "react";
import { fetchGlobalStatsApi, fetchGlobalChartsApi, fetchShopsDirectoryApi } from "../../services/superadmin.service";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Users,
  Store,
  DollarSign,
  Package,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function GlobalDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [shopsList, setShopsList] = useState<{ _id: string; name: string; owner_name: string }[]>([]);
  const [selectedShop, setSelectedShop] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("30d"); // 30d, today, yesterday, 7d, month, custom
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getFilterParams = () => {
    const params: any = {};
    if (selectedShop !== "all") {
      params.shop_id = selectedShop;
    }

    if (timeRange === "custom") {
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
    } else {
      const todayDate = new Date();
      const todayStr = formatDateLocal(todayDate);
      
      if (timeRange === "today") {
        params.startDate = todayStr;
        params.endDate = todayStr;
      } else if (timeRange === "yesterday") {
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = formatDateLocal(yesterdayDate);
        params.startDate = yesterdayStr;
        params.endDate = yesterdayStr;
      } else if (timeRange === "7d") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        params.startDate = formatDateLocal(sevenDaysAgo);
        params.endDate = todayStr;
      } else if (timeRange === "30d") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        params.startDate = formatDateLocal(thirtyDaysAgo);
        params.endDate = todayStr;
      } else if (timeRange === "month") {
        const firstDayOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
        params.startDate = formatDateLocal(firstDayOfMonth);
        params.endDate = todayStr;
      }
    }
    return params;
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const params = getFilterParams();
        const [statsData, chartsData, shopsData] = await Promise.all([
          fetchGlobalStatsApi(params),
          fetchGlobalChartsApi(params),
          fetchShopsDirectoryApi({ page: 1, limit: 100 }),
        ]);
        setStats(statsData);
        setCharts(chartsData);
        if (shopsData && shopsData.shops) {
          setShopsList(shopsData.shops);
        }
      } catch (error) {
        console.error("Initial load error", error);
        toast.error("Failed to load platform data.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Filter change load
  const loadFilteredData = async () => {
    try {
      setDataLoading(true);
      const params = getFilterParams();
      const [statsData, chartsData] = await Promise.all([
        fetchGlobalStatsApi(params),
        fetchGlobalChartsApi(params),
      ]);
      setStats(statsData);
      setCharts(chartsData);
    } catch (error) {
      console.error("Error loading filtered global admin data", error);
      toast.error("Failed to load filtered dashboard metrics.");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      loadFilteredData();
    }
  }, [selectedShop, timeRange, startDate, endDate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-500">Aggregating platform metrics...</p>
      </div>
    );
  }

  // Map charts data
  const revenueTrendData = charts?.dailyTrend?.map((item: any) => ({
    name: item._id,
    Revenue: item.revenue,
    Profit: item.profit,
  })) || [];

  const topShopsData = charts?.topShops?.map((item: any) => ({
    name: item.name,
    Revenue: item.totalRevenue,
    Profit: item.totalProfit,
  })) || [];

  const topProductsData = charts?.topProducts?.map((item: any) => ({
    name: item._id,
    Sold: item.unitsSold,
  })) || [];

  const expenseBreakdownData = charts?.expenseBreakdown?.map((item: any) => ({
    name: item.category,
    value: item.value,
  })) || [];

  return (
    <div className="relative space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[45%] h-[40%] rounded-full bg-blue-100/30 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-100/30 blur-[130px]"></div>
      </div>

      {/* TOP HEADER */}
      <div className="space-y-1">
        <p className="text-emerald-600 font-extrabold uppercase tracking-widest text-xs flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          Super Admin Console
        </p>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">
          Platform Overview
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Monitor multi-tenant metrics, shop performances, and platform-wide inventory health.
        </p>
      </div>

      {/* Filters and Date Range Picker */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Shop Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter by Shop</label>
              <select
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">🏬 All Shops (Platform-wide)</option>
                {shopsList.map((shop) => (
                  <option key={shop._id} value={shop._id}>
                    {shop.name} ({shop.owner_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Time Range Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time Range</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              >
                <option value="30d">🗓️ Last 30 Days</option>
                <option value="today">☀️ Today</option>
                <option value="yesterday">⛅ Yesterday</option>
                <option value="7d">⚡ Last 7 Days</option>
                <option value="month">📅 This Month</option>
                <option value="custom">⚙️ Custom Range...</option>
              </select>
            </div>

            {/* Custom Dates Inputs */}
            {timeRange === "custom" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </>
            )}
          </div>

          {/* Loader indicator when active filters are fetching */}
          {dataLoading && (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 animate-pulse">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block animate-ping"></span>
              Refreshing metrics...
            </div>
          )}
        </div>
      </div>

      {/* KEY KPIS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Shops Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[2rem] p-6 shadow-xl shadow-slate-100 flex items-center justify-between group hover:-translate-y-1 transition-transform">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shops</p>
            <p className="text-3xl font-black text-slate-800">{stats.shops.total}</p>
            <div className="flex gap-2 text-xs font-semibold text-slate-500">
              <span className="text-emerald-600">{stats.shops.active} Active</span>
              <span>•</span>
              <span className="text-slate-400">{stats.shops.inactive} Inactive</span>
            </div>
          </div>
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            <Store className="w-6 h-6" />
          </div>
        </div>

        {/* Users Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[2rem] p-6 shadow-xl shadow-slate-100 flex items-center justify-between group hover:-translate-y-1 transition-transform">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Platform Users</p>
            <p className="text-3xl font-black text-slate-800">{stats.users.total}</p>
            <div className="flex gap-2 text-xs font-semibold text-slate-500">
              <span className="text-blue-600">{stats.users.owners} Owners</span>
              <span>•</span>
              <span className="text-purple-600">{stats.users.employees} Staff</span>
            </div>
          </div>
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 border border-emerald-400 rounded-[2rem] p-6 shadow-xl shadow-emerald-500/20 flex items-center justify-between text-white group hover:-translate-y-1 transition-transform">
          <div className="space-y-2">
            <p className="text-xs font-black text-emerald-100 uppercase tracking-wider">Total Sales Revenue</p>
            <p className="text-3xl font-black">{formatCurrency(stats.sales.totalRevenue)}</p>
            <p className="text-xs font-bold text-emerald-50/80">
              Net Profit: {formatCurrency(stats.sales.netProfit)} ({Math.round((stats.sales.netProfit / (stats.sales.totalRevenue || 1)) * 100)}%)
            </p>
          </div>
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Udhar Outstanding */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[2rem] p-6 shadow-xl shadow-slate-100 flex items-center justify-between group hover:-translate-y-1 transition-transform">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outstanding Udhar</p>
            <p className="text-3xl font-black text-rose-600">{formatCurrency(stats.customers.totalOutstanding)}</p>
            <div className="flex gap-2 text-xs font-semibold text-slate-500">
              <span className="text-rose-500">{stats.customers.pendingPayments} Accounts Pending</span>
            </div>
          </div>
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ADDITIONAL PLATFORM METRICS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sales KPI details */}
        <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800 tracking-wider uppercase">Sales Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400">Total Units Sold</p>
              <p className="text-xl font-bold text-slate-800">{stats.sales.totalSales}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Average Sale Value</p>
              <p className="text-xl font-bold text-slate-800">{formatCurrency(stats.sales.averageSaleValue)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Total Goods Cost</p>
              <p className="text-xl font-bold text-slate-800">{formatCurrency(stats.sales.totalExpenses)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Total Shifts</p>
              <p className="text-xl font-bold text-slate-800">{stats.orders.total}</p>
            </div>
          </div>
        </div>

        {/* Inventory KPI details */}
        <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800 tracking-wider uppercase">Inventory Health</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400">Total Products</p>
              <p className="text-xl font-bold text-slate-800">{stats.inventory.totalProducts}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Inventory Value</p>
              <p className="text-xl font-bold text-slate-800">{formatCurrency(stats.inventory.totalValue)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Low Stock Alerts</p>
              <p className="text-xl font-bold text-amber-600">{stats.inventory.lowStock}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Out of Stock</p>
              <p className="text-xl font-bold text-rose-600">{stats.inventory.outOfStock}</p>
            </div>
          </div>
        </div>

        {/* Shifts/Orders details */}
        <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800 tracking-wider uppercase">Active Operations</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400">Open Shifts</p>
              <p className="text-xl font-bold text-emerald-600">{stats.orders.pending}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Closed Shifts</p>
              <p className="text-xl font-bold text-slate-800">{stats.orders.completed}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Active Customers</p>
              <p className="text-xl font-bold text-slate-800">{stats.customers.active}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Total Customers</p>
              <p className="text-xl font-bold text-slate-800">{stats.customers.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* TREND CHART AND EXPENSE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Revenue & Profit Line Trend */}
        <div className="lg:col-span-8 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <TrendingUp className="text-emerald-500 w-5 h-5" />
              Daily Revenue & Profit (Past 30 Days)
            </h3>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Legend />
                <Line type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown Pie Chart */}
        <div className="lg:col-span-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-6 flex flex-col justify-between">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Layers className="text-blue-500 w-5 h-5" />
            Category Cost Share
          </h3>
          <div className="h-[250px] w-full flex items-center justify-center">
            {expenseBreakdownData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseBreakdownData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-sm font-medium">No inventory cost data.</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-500">
            {expenseBreakdownData.map((entry: any, index: number) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></span>
                <span className="truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TOP PERFORMING SHOPS & PRODUCTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performing Shops */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-6">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Store className="text-purple-500 w-5 h-5" />
            Top 5 Performing Shops
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topShopsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Legend />
                <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-6">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Package className="text-indigo-500 w-5 h-5" />
            Top Products by Units Sold
          </h3>
          <div className="h-[300px]">
            {topProductsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="Sold" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                No products sold yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HIGHEST REVENUE VS LOWEST REVENUE SHOPS TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Highest Revenue */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
            <ArrowUpRight className="text-emerald-500 w-5 h-5" />
            Highest Revenue Shops
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold">
                  <th className="py-2.5">Shop Name</th>
                  <th className="py-2.5 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.shops.highestRevenue?.map((shop: any) => (
                  <tr key={shop._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="py-3 font-semibold text-slate-800">{shop.name}</td>
                    <td className="py-3 text-right font-black text-emerald-600">{formatCurrency(shop.revenue)}</td>
                  </tr>
                ))}
                {stats.shops.highestRevenue?.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-slate-400">No shop revenue logged yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lowest Revenue */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
            <ArrowDownRight className="text-rose-500 w-5 h-5" />
            Lowest Revenue Shops
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold">
                  <th className="py-2.5">Shop Name</th>
                  <th className="py-2.5 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.shops.lowestRevenue?.map((shop: any) => (
                  <tr key={shop._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="py-3 font-semibold text-slate-800">{shop.name}</td>
                    <td className="py-3 text-right font-black text-slate-800">{formatCurrency(shop.revenue)}</td>
                  </tr>
                ))}
                {stats.shops.lowestRevenue?.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-slate-400">No shop revenue logged yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
