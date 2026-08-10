import React, { useEffect, useState } from "react";
import {
  fetchShopsDirectoryApi,
  createShopApi,
  updateShopApi,
  resetShopDataApi,
} from "../../services/superadmin.service";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Edit2,
  RefreshCw,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  X,
  CheckCircle,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ShopDirectory() {
  const { setUser, setShop } = useAuth();
  const navigate = useNavigate();

  // State
  const [shops, setShops] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  const [selectedShop, setSelectedShop] = useState<any>(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    name: "",
    owner_name: "",
    phone: "",
    address: "",
    email: "",
    password: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    owner_name: "",
    phone: "",
    address: "",
    is_active: true,
  });

  const fetchShops = async () => {
    try {
      setLoading(true);
      const params = {
        search: search || undefined,
        is_active:
          isActiveFilter === "active"
            ? true
            : isActiveFilter === "inactive"
            ? false
            : undefined,
        sortBy,
        sortOrder,
        page,
        limit: 10,
      };
      const data = await fetchShopsDirectoryApi(params);
      setShops(data.shops);
      setTotal(data.total);
      setPages(data.pages);
    } catch (error) {
      console.error("Error loading shops", error);
      toast.error("Failed to load shop directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [page, isActiveFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchShops();
  };

  // Impersonate / Switch Context
  const handleImpersonate = (shopObj: any) => {
    localStorage.setItem("super_admin_shop_id", shopObj._id);
    // Trigger Context updates
    setShop({
      _id: shopObj._id,
      name: shopObj.name,
      owner_name: shopObj.owner_name,
      phone: shopObj.phone,
      address: shopObj.address,
      created_at: shopObj.created_at,
    });
    toast.success(`Switched context to ${shopObj.name}`);
    navigate("/dashboard");
  };

  // Create Shop
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createShopApi(createForm);
      toast.success("Shop and owner account created successfully!");
      setIsCreateOpen(false);
      setCreateForm({
        name: "",
        owner_name: "",
        phone: "",
        address: "",
        email: "",
        password: "",
      });
      fetchShops();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to create shop.";
      toast.error(msg);
    }
  };

  // Edit Shop
  const openEditModal = (shopObj: any) => {
    setSelectedShop(shopObj);
    setEditForm({
      name: shopObj.name,
      owner_name: shopObj.owner_name,
      phone: shopObj.phone,
      address: shopObj.address || "",
      is_active: shopObj.is_active,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateShopApi(selectedShop._id, editForm);
      toast.success("Shop details updated successfully!");
      setIsEditOpen(false);
      fetchShops();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update shop.");
    }
  };

  // Reset Shop Data
  const openResetModal = (shopObj: any) => {
    setSelectedShop(shopObj);
    setIsResetOpen(true);
  };

  const handleResetSubmit = async () => {
    try {
      const loader = toast.loading("Clearing all transactional data...");
      await resetShopDataApi(selectedShop._id);
      toast.dismiss(loader);
      toast.success(`Cleared all transactional logs for "${selectedShop.name}"`);
      setIsResetOpen(false);
      fetchShops();
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Failed to reset shop.");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            Shop Directory
          </h1>
          <p className="text-sm text-slate-400 font-semibold">
            Manage all registered shop spaces, switch view contexts, or reset tenant datasets.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl px-5 py-2.5 font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:scale-95 transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Shop
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by name, owner, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl p-1 bg-slate-50">
            {["all", "active", "inactive"].map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setIsActiveFilter(filter);
                  setPage(1);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all capitalize ${
                  isActiveFilter === filter
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Sort By Selector */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 focus:outline-none bg-white"
          >
            <option value="created_at">Date Created</option>
            <option value="name">Shop Name</option>
            <option value="totalRevenue">Revenue</option>
            <option value="totalProfit">Profit</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-600"
          >
            {sortOrder === "asc" ? "ASC" : "DESC"}
          </button>
        </div>
      </div>

      {/* SHOPS DATATABLE */}
      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider text-xs">
                  <th className="py-4 px-6">Shop Details</th>
                  <th className="py-4 px-4">Owner</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Revenue</th>
                  <th className="py-4 px-4 text-right">Profit</th>
                  <th className="py-4 px-4 text-center">Products</th>
                  <th className="py-4 px-4 text-center">Staff</th>
                  <th className="py-4 px-4 text-center">Audits</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shops.map((shop) => (
                  <tr key={shop._id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Details */}
                    <td className="py-4 px-6">
                      <div className="font-extrabold text-slate-800 text-base">{shop.name}</div>
                      <div className="text-xs text-slate-400 font-semibold mt-0.5">
                        Phone: {shop.phone} | Created: {new Date(shop.created_at).toLocaleDateString("en-IN")}
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="py-4 px-4 font-semibold text-slate-700">
                      {shop.owner_name}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      {shop.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 font-bold text-xs rounded-full">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Revenue */}
                    <td className="py-4 px-4 text-right font-extrabold text-slate-800">
                      {formatCurrency(shop.totalRevenue)}
                    </td>

                    {/* Profit */}
                    <td className="py-4 px-4 text-right font-extrabold text-emerald-600">
                      {formatCurrency(shop.totalProfit)}
                    </td>

                    {/* Products */}
                    <td className="py-4 px-4 text-center font-bold text-slate-700">
                      {shop.productsCount}
                    </td>

                    {/* Staff */}
                    <td className="py-4 px-4 text-center font-bold text-slate-700">
                      {shop.employeesCount}
                    </td>

                    {/* Shifts/Orders Count */}
                    <td className="py-4 px-4 text-center font-bold text-slate-700">
                      {shop.ordersCount}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Impersonate */}
                        <button
                          onClick={() => handleImpersonate(shop)}
                          title="Switch view to this Shop"
                          className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => openEditModal(shop)}
                          title="Edit Shop Details"
                          className="p-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Reset Shop */}
                        <button
                          onClick={() => openResetModal(shop)}
                          title="Reset Shop Logs"
                          className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {shops.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-bold">
                      No shops found matching your search.
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
              Showing page {page} of {pages} ({total} total shops)
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

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">Register New Shop</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Shop Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Owner Full Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.owner_name}
                    onChange={(e) => setCreateForm({ ...createForm, owner_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Phone Number (Unique)</label>
                <input
                  type="text"
                  required
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Shop Address</label>
                <input
                  type="text"
                  value={createForm.address}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h4 className="text-sm font-extrabold text-slate-700">Owner Login Account (Optional)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Password</label>
                    <input
                      type="password"
                      placeholder="Leave blank for default"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold"
                >
                  Create Shop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">Edit Shop Details</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Shop Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Owner Name</label>
                <input
                  type="text"
                  required
                  value={editForm.owner_name}
                  onChange={(e) => setEditForm({ ...editForm, owner_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Phone Number</label>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-sm font-bold text-slate-700">Active Status</span>
                  <p className="text-[10px] text-slate-400 font-semibold">Toggles shop login & operation access</p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="w-5 h-5 text-emerald-500 border-slate-300 rounded focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET WARN MODAL */}
      {isResetOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border-t-4 border-rose-500">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto text-3xl">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-800">Reset Shop Transaction Logs?</h3>
              <p className="text-sm text-slate-400 font-medium">
                This will <strong className="text-rose-500">permanently delete</strong> all products, shift logs, daily sales, low stock alerts, udhar outstanding, and staff worker credentials for <strong>"{selectedShop?.name}"</strong>.
              </p>
              <p className="text-xs text-slate-400 font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                The owner account login credentials will be kept, but all store histories are deleted. This operation is irreversible.
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsResetOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetSubmit}
                className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold"
              >
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
