import React, { useState, useEffect, useMemo } from "react";
import {
  createProduct,
  getAllProducts,
  getProductCategories,
} from "../services/product.service";
import type { Product } from "../types/product.types";

type Unit = Product["unit"];

export default function UnifiedInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    unit: "piece" as Unit,
    current_buy_price: 0,
    current_sell_price: 0,
    current_stock: 0,
    low_stock_threshold: 5
  });

  

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
    if (formData.current_sell_price <= formData.current_buy_price) {
      setError("Sell price must be greater than buy price.");
      return;
    }

    try {
      setBtnLoading(true);
      setError("");
      const newProduct = await createProduct(formData);

      // Add to top of list & set "Recent" badge
      setProducts((prev) => [newProduct, ...prev]);
      setLastAddedId(newProduct._id);
      
      // Clear badge after 30 seconds
      setTimeout(() => setLastAddedId(null), 30000);

      // Reset form
      setFormData({
        name: "", category: "", unit: "piece",
        current_buy_price: 0, current_sell_price: 0,
        current_stock: 0, low_stock_threshold: 5
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add product");
    } finally {
      setBtnLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [products, search]);

  const isLosingMoney = formData.current_sell_price > 0 && formData.current_sell_price <= formData.current_buy_price;

  return (
    <div className="max-w-350 mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-900">Inventory Management</h1>
        <p className="text-sm text-slate-500 font-medium">Total Products: {products.length}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT: ADD PRODUCT FORM (Sticky on desktop) */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-[#1D9E75]"><path d="M12 5v14M5 12h14" /></svg>
              Add New Product
            </h3>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Product Name</label>
                <input required type="text" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#1D9E75]" placeholder="enter product name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Category</label>
                  <input list="cat-list" required type="text" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="Dairy..." value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                  <datalist id="cat-list">{categories.map(c => <option key={c} value={c} />)}</datalist>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Unit</label>
                  <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value as Unit})}>
                    <option value="piece">Piece</option>
                    <option value="packet">Packet</option>
                    <option value="kg">kg</option>
                    <option value="litre">Litre</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Buy Price (₹)</label>
                  <input required type="number" min="0" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" value={formData.current_buy_price} onChange={e => setFormData({...formData, current_buy_price: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Sell Price (₹)</label>
                  <input required type="number" min="0" className={`w-full p-2.5 bg-slate-50 border rounded-xl outline-none ${isLosingMoney ? 'border-amber-400' : 'border-slate-200'}`} value={formData.current_sell_price} onChange={e => setFormData({...formData, current_sell_price: Number(e.target.value)})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Stock</label>
                  <input type="number" min="0" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" value={formData.current_stock} onChange={e => setFormData({...formData, current_stock: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600` uppercase tracking-wider mb-1.5 block">Low Alert</label>
                  <input type="number" min="1" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" value={formData.low_stock_threshold} onChange={e => setFormData({...formData, low_stock_threshold: Number(e.target.value)})} />
                </div>
              </div>

              {isLosingMoney && <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-2 rounded-lg">Warning: Selling at a loss!</p>}

              <button 
                disabled={btnLoading}
                className="w-full py-3.5 bg-[#1D9E75] text-white cursor-pointer rounded-2xl font-black text-sm shadow-lg shadow-green-100 hover:bg-[#168a65] transition-all active:scale-95 disabled:opacity-50"
              >
                {btnLoading ? "Processing..." : "Add Product to List"}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT: FULL INVENTORY TABLE (8 Columns) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full p-3 pl-10 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-[#1D9E75]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-4 top-4 text-slate-400"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-125">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                <tr>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-center">Unit</th>
                  <th className="px-6 py-4 text-right">Price</th>
                  <th className="px-6 py-4 text-center">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  [1, 2, 3, 4, 5].map(i => <tr key={i} className="animate-pulse h-16 bg-slate-50/30" />)
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map(p => (
                    <tr key={p._id} className={`transition-all duration-700 ${p._id === lastAddedId ? 'bg-green-50/80 animate-in fade-in slide-in-from-left-4' : 'hover:bg-slate-50/50'}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-800">{p.name}</span>
                          {p._id === lastAddedId && (
                            <span className="bg-[#1D9E75] text-white text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">Recently Added</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className="text-[11px] font-bold text-slate-500 uppercase px-2 py-1 bg-slate-100 rounded-lg">{p.category}</span></td>
                      <td className="px-6 py-4 text-center text-xs font-medium text-slate-400">{p.unit}</td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-black text-slate-900">₹{p.current_sell_price}</p>
                        <p className="text-[10px] text-slate-400 font-bold italic">Buy: ₹{p.current_buy_price}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-xl text-xs font-black ${p.current_stock <= p.low_stock_threshold ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                          {p.current_stock}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-medium">No products match your search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}