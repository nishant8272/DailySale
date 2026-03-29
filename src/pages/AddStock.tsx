import { useState, useEffect, useMemo } from "react";
import { getAllProducts, updateProduct } from "../services/product.service";
import type { Product } from "../types/product.types";


export default function AddStockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [stockInputs, setStockInputs] = useState<Record<string, number>>({});
  const [successId, setSuccessId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getAllProducts();
        setProducts((data || []).reverse());
      } catch {
        setError("Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const handleStockUpdate = async (productId: string) => {
    const addQty = stockInputs[productId];
    if (!addQty || addQty <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }

    const product = products.find(p => p._id === productId);
    if (!product) return;

    try {
      setUpdating(productId);
      setError("");
      const newStock = product.current_stock + addQty;
      await updateProduct(productId, { current_stock: newStock });

      setProducts(prev =>
        prev.map(p =>
          p._id === productId ? { ...p, current_stock: newStock } : p
        )
      );

      setSuccessId(productId);
      setTimeout(() => setSuccessId(null), 3000);
      setStockInputs(prev => ({ ...prev, [productId]: 0 }));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update stock");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <>
      <div className="max-w-350 mx-auto space-y-6 animate-in fade-in duration-500 px-6 md:px-12 py-8">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black text-slate-900">Add Stock</h1>
          <p className="text-sm text-slate-500 font-medium">
            Total Products: {products.length}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full p-3 pl-10 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-[#1D9E75]/20"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="w-4 h-4 absolute left-4 top-4 text-slate-400">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
              <tr>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-center">Unit</th>
                <th className="px-6 py-4 text-center">Current Stock</th>
                <th className="px-6 py-4 text-center">Add Qty</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse h-16 bg-slate-50/30" />
                ))
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map(p => (
                  <tr
                    key={p._id}
                    className={`transition-all duration-500 ${
                      successId === p._id ? "bg-green-50/80" : "hover:bg-slate-50/50"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{p.name}</span>
                        {successId === p._id && (
                          <span className="bg-[#1D9E75] text-white text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase">
                            Updated ✓
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-[11px] font-bold text-slate-500 uppercase px-2 py-1 bg-slate-100 rounded-lg">
                        {p.category}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center text-xs font-medium text-slate-400">
                      {p.unit}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-xl text-xs font-black ${
                        p.current_stock <= p.low_stock_threshold
                          ? "bg-red-50 text-red-600 border border-red-100"
                          : "bg-slate-50 text-slate-600 border border-slate-100"
                      }`}>
                        {p.current_stock}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <input
                        type="number"
                        min="1"
                        placeholder="0"
                        className="w-20 p-2 text-center bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#1D9E75] text-sm font-bold"
                        value={stockInputs[p._id] || ""}
                        onChange={e =>
                          setStockInputs(prev => ({
                            ...prev,
                            [p._id]: Number(e.target.value),
                          }))
                        }
                      />
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleStockUpdate(p._id)}
                        disabled={updating === p._id}
                        className="px-4 py-2 bg-[#1D9E75] text-white text-xs font-black rounded-xl hover:bg-[#168a65] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {updating === p._id ? "Updating..." : "+ Add Stock"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-400 font-medium">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}