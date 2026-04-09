import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  createProduct,
  getAllProducts,
  getProductCategories,
  updateProduct,
  toggleProductStatus,
} from "../services/product.service";
import type { Product } from "../types/product.types";

type Unit = Product["unit"];

export default function UnifiedInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
    const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    unit: "piece" as Unit,
    current_buy_price: "",
    current_sell_price: "",
    current_stock: "",
    low_stock_threshold: ""
  });

  // Calculate Real Stats based on product list
  const stats = useMemo(() => {
    const active = products.filter(p => p.is_active !== false);
    if (active.length === 0) return { avgMargin: 0, bestMargin: 0 };

    let totalMarginPercent = 0;
    let best = 0;

    active.forEach(p => {
      const margin = ((p.current_sell_price - p.current_buy_price) / p.current_sell_price) * 100;
      const validMargin = isFinite(margin) ? margin : 0;
      totalMarginPercent += validMargin;
      if (validMargin > best) best = Math.round(validMargin);
    });

    return {
      avgMargin: Math.round(totalMarginPercent / active.length),
      bestMargin: best
    };
  }, [products]);

  const calculateMargin = (sell: number, buy: number) => {
    if (sell <= 0) return { amount: 0, percent: 0 };
    const amount = sell - buy;
    const percent = Math.round((amount / sell) * 100);
    return { amount, percent };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productData, categoryData] = await Promise.all([
        getAllProducts(),
        getProductCategories(),
      ]);
      setProducts((productData || []).reverse());
      setCategories(categoryData || []);
    } catch {
      setError("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const buyPrice = Number(formData.current_buy_price);
    const sellPrice = Number(formData.current_sell_price);
    const currentStock = formData.current_stock === "" ? 0 : Number(formData.current_stock);
    const lowStockThreshold =
      formData.low_stock_threshold === "" ? 0 : Number(formData.low_stock_threshold);

    if (!Number.isFinite(buyPrice) || !Number.isFinite(sellPrice)) {
      setError("Please enter valid buy and sell prices.");
      return;
    }

    if (sellPrice <= buyPrice) {
      setError("Sell price must be greater than buy price.");
      return;
    }

    try {
      setBtnLoading(true);
      setError("");
      if (editingProductId) {
        const updatedProduct = await updateProduct(editingProductId, {
          name: formData.name,
          category: formData.category,
          unit: formData.unit,
          current_buy_price: buyPrice,
          current_sell_price: sellPrice,
          current_stock: currentStock,
          low_stock_threshold: lowStockThreshold,
        });

        setProducts((prev) =>
          prev.map((p) => (p._id === editingProductId ? updatedProduct : p))
        );
      } else {
        const newProduct = await createProduct({
          name: formData.name,
          category: formData.category,
          unit: formData.unit,
          current_buy_price: buyPrice,
          current_sell_price: sellPrice,
          current_stock: currentStock,
          low_stock_threshold: lowStockThreshold,
        });
        setProducts((prev) => [newProduct, ...prev]);
        setLastAddedId(newProduct._id);
        setTimeout(() => setLastAddedId(null), 10000); // 10s highlight
      }

      if (formData.category && !categories.includes(formData.category)) {
        setCategories((prev) => [...prev, formData.category]);
      }

      setFormData({
        name: "", category: "", unit: "piece",
        current_buy_price: "", current_sell_price: "",
        current_stock: "", low_stock_threshold: ""
      });
      setEditingProductId(null);
    } catch (err: any) {
      setError(err.response?.data?.message || (editingProductId ? "Failed to update product" : "Failed to add product"));
    } finally {
      setBtnLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setError("");
    setEditingProductId(product._id);
    setFormData({
      name: product.name,
      category: product.category,
      unit: product.unit,
      current_buy_price: String(product.current_buy_price ?? ""),
      current_sell_price: String(product.current_sell_price ?? ""),
      current_stock: String(product.current_stock ?? ""),
      low_stock_threshold: String(product.low_stock_threshold ?? ""),
    });
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setError("");
    setFormData({
      name: "", category: "", unit: "piece",
      current_buy_price: "", current_sell_price: "",
      current_stock: "", low_stock_threshold: ""
    });
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      setStatusLoadingId(product._id);
      setError("");
      await toggleProductStatus(product._id);
      setProducts((prev) =>
        prev.map((p) =>
          p._id === product._id ? { ...p, is_active: !p.is_active } : p
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update product status");
    } finally {
      setStatusLoadingId(null);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const isLosingMoney =
    formData.current_sell_price !== "" &&
    formData.current_buy_price !== "" &&
    Number(formData.current_sell_price) > 0 &&
    Number(formData.current_sell_price) <= Number(formData.current_buy_price);

  return (
    <div className="w-full py-2 space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Inventory Management</h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium">Manage and track your shop products</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none bg-slate-100 px-4 py-1.5 rounded-full">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-tighter">
              Total Products: <span className="text-[#1D9E75]">{products.length}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="sm:hidden p-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all active:scale-95 flex items-center justify-center"
            title="Back to dashboard"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

        {/* LEFT: ADD PRODUCT FORM (4 Columns) */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-lg">
              <div className="p-1.5 bg-green-50 rounded-lg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-[#1D9E75]"><path d="M12 5v14M5 12h14" /></svg>
              </div>
              {editingProductId ? "Edit Product" : "Add New Product"}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label className="text-[13px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 block">Product Name</label>
                <input required type="text" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75] transition-all text-sm" placeholder="Enter product name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-[13px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 block">Category</label>
                  <input list="cat-list" required type="text" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#1D9E75] text-sm" placeholder="Enter category..." value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                  <datalist id="cat-list">{categories.map(c => <option key={c} value={c} />)}</datalist>
                </div>
                <div>
                  <label className="text-[13px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 block">Unit</label>
                  <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#1D9E75] appearance-none text-sm" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value as Unit })}>
                    <option value="piece">Piece</option>
                    <option value="packet">Packet</option>
                    <option value="kg">kg</option>
                    <option value="litre">Litre</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-[13px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 block">Buy Price (₹)</label>
                  <input required type="text" inputMode="decimal" placeholder="enter buy price" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#1D9E75] text-sm" value={formData.current_buy_price} onChange={e => setFormData({ ...formData, current_buy_price: e.target.value.replace(/[^0-9.]/g, "") })} />
                </div>
                <div>
                  <label className="text-[13px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 block">Sell Price (₹)</label>
                  <input required type="text" inputMode="decimal" placeholder="enter sell price" className={`w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${isLosingMoney ? 'border-amber-400 focus:ring-amber-100' : 'border-slate-200 focus:border-[#1D9E75] focus:ring-[#1D9E75]/10'}`} value={formData.current_sell_price} onChange={e => setFormData({ ...formData, current_sell_price: e.target.value.replace(/[^0-9.]/g, "") })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-[13px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 block">Initial Stock</label>
                  <input type="text" inputMode="numeric" placeholder="enter initial stock" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" value={formData.current_stock} onChange={e => setFormData({ ...formData, current_stock: e.target.value.replace(/\D/g, "") })} />
                </div>
                <div>
                  <label className="text-[13px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 block">Low Alert</label>
                  <input type="text" inputMode="numeric" placeholder="enter low alert threshold" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" value={formData.low_stock_threshold} onChange={e => setFormData({ ...formData, low_stock_threshold: e.target.value.replace(/\D/g, "") })} />
                </div>
              </div>

              {isLosingMoney && <p className="text-xs text-amber-600 font-bold bg-amber-50 p-2.5 rounded-xl border border-amber-100 italic">Warning: Sell price is lower than cost!</p>}

              <button
                disabled={btnLoading}
                className="w-full py-3 sm:py-4 bg-[#1D9E75] text-white cursor-pointer rounded-2xl font-black text-sm shadow-lg shadow-green-100 hover:bg-[#168a65] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {btnLoading && <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>}
                {btnLoading ? (editingProductId ? "Updating..." : "Adding...") : (editingProductId ? "Update Product" : "Add Product to List")}
              </button>

              {editingProductId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full py-2.5 sm:py-3 border border-slate-200 bg-white text-slate-600 cursor-pointer rounded-2xl font-semibold text-sm hover:bg-slate-50 transition-all"
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>
        </div>

        {/* RIGHT: DATA & TABLE (8 Columns) */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-6">
          
          {/* STATS CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="Total Active" value={products.filter(p => p.is_active !== false).length} sub="Products" />
            <StatCard label="Avg Margin" value={`${stats.avgMargin}%`} color="text-[#1D9E75]" sub="Profitability" />
            <StatCard label="Best Margin" value={`${stats.bestMargin}%`} color="text-[#1D9E75]" sub="Top Item" />
            <StatCard label="Categories" value={categories.length} sub="Groupings" />
          </div>

          {/* SEARCH & FILTERS */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <input
                type="text"
                placeholder="Search products or categories..."
                className="w-full p-3 pl-10 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1D9E75]/10 focus:border-[#1D9E75] transition-all shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            </div>
          </div>

          {/* TABLE CONTAINER */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3 p-4">
              {loading ? (
                [...Array(5)].map((_, i) => <div key={i} className="animate-pulse h-32 bg-slate-50 rounded-xl"></div>)
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const margin = calculateMargin(p.current_sell_price, p.current_buy_price);
                  const isNew = p._id === lastAddedId;

                  return (
                    <div key={p._id} className={`border rounded-xl p-4 transition-all ${isNew ? 'bg-green-50/50 border-green-200' : 'border-slate-200 bg-slate-50/50'} ${p.is_active === false ? 'opacity-70' : ''}`}>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-800 text-base flex items-center gap-2">
                              {p.name}
                              {isNew && <span className="bg-[#1D9E75] text-white text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-tighter animate-bounce">New</span>}
                              {p.is_active === false && <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Inactive</span>}
                            </span>
                            <span className="text-[13px] text-slate-500 font-medium">unit: {p.unit}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEdit(p)}
                              disabled={btnLoading || statusLoadingId === p._id}
                              className="p-1.5 hover:bg-white rounded-lg text-slate-500 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Edit product"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(p)}
                              disabled={statusLoadingId === p._id || btnLoading}
                              className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${p.is_active !== false ? 'text-slate-500 hover:text-red-500 hover:bg-red-50' : 'text-green-500 bg-green-50 hover:bg-green-100'}`}
                              title={p.is_active !== false ? "Set inactive" : "Set active"}
                            >
                              {statusLoadingId === p._id ? (
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/></svg>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white rounded-lg p-2">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Category</p>
                            <p className="text-[13px] font-bold text-slate-600">{p.category}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Sell Price</p>
                            <p className="text-[13px] font-bold text-slate-900">₹{p.current_sell_price}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Cost</p>
                            <p className="text-[13px] font-bold text-slate-600">₹{p.current_buy_price}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Margin</p>
                            <p className="text-[13px] font-bold text-[#1D9E75]">₹{margin.amount} ({margin.percent}%)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400 font-medium">Start adding items to populate your inventory</div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-full">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 text-xs uppercase font-bold tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Product Details</th>
                    <th className="px-6 py-4 hidden sm:table-cell">Category</th>
                    <th className="px-6 py-4">Pricing</th>
                    <th className="px-6 py-4 hidden md:table-cell">Margin Info</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse h-20 bg-slate-50/50" />)
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => {
                      const margin = calculateMargin(p.current_sell_price, p.current_buy_price);
                      const isNew = p._id === lastAddedId;

                      return (
                        <tr key={p._id} className={`group transition-all duration-500 ${isNew ? 'bg-green-50/50 shadow-inner' : 'hover:bg-slate-50/50'} ${p.is_active === false ? 'opacity-70' : ''}`}>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">
                                {p.name}
                                {isNew && <span className="bg-[#1D9E75] text-white text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-tighter animate-bounce">New</span>}
                                {p.is_active === false && <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Inactive</span>}
                              </span>
                              <span className="text-[13px] sm:text-[15px] text-slate-500 font-medium">unit: {p.unit}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 hidden sm:table-cell">
                            <span className="text-[15px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg italic text-xs">{p.category}</span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="text-base sm:text-lg font-bold text-slate-900">₹{p.current_sell_price}</span>
                              <span className="text-[13px] sm:text-[15px] text-slate-500">cost: ₹{p.current_buy_price}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 hidden md:table-cell">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-base sm:text-lg font-bold text-[#1D9E75]">₹{margin.amount}</span>
                                <span className="text-[13px] font-black text-slate-500">({margin.percent}%)</span>
                              </div>
                              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-1000 ${margin.percent < 15 ? 'bg-amber-400' : 'bg-[#1D9E75]'}`}
                                  style={{ width: `${Math.min(margin.percent, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-1 sm:gap-2 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleEdit(p)}
                                disabled={btnLoading || statusLoadingId === p._id}
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Edit product"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(p)}
                                disabled={statusLoadingId === p._id || btnLoading}
                                className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${p.is_active !== false ? 'text-slate-500 hover:text-red-500 hover:bg-red-50' : 'text-green-500 bg-green-50 hover:bg-green-100'}`}
                                title={p.is_active !== false ? "Set inactive" : "Set active"}
                              >
                                {statusLoadingId === p._id ? (
                                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                ) : (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/></svg>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-medium">Start adding items to populate your inventory</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component for Stats to keep code clean
function StatCard({ label, value, color = "text-slate-800", sub }: any) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-1 duration-300">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <p className={`text-2xl sm:text-3xl font-black ${color}`}>{value}</p>
        <span className="text-xs text-slate-400 font-medium lowercase italic">{sub}</span>
      </div>
    </div>
  );
}