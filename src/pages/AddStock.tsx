import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAllProducts, updateProduct } from "../services/product.service";
import { addStockToShift, getTodayShift } from "../services/shift.service";
import type { Product } from "../types/product.types";


export default function AddStockPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [stockInputs, setStockInputs] = useState<Record<string, number>>({});
  const [priceInputs, setPriceInputs] = useState<
    Record<string, { current_buy_price: string; current_sell_price: string }>
  >({});
  const [successId, setSuccessId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getAllProducts();
        const productsData = (data || []).reverse();
        setProducts(productsData);
        setPriceInputs(
          productsData.reduce<
            Record<string, { current_buy_price: string; current_sell_price: string }>
          >((acc, product) => {
            acc[product._id] = {
              current_buy_price: String(product.current_buy_price),
              current_sell_price: String(product.current_sell_price),
            };
            return acc;
          }, {})
        );
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
    const product = products.find(p => p._id === productId);
    if (!product) return;

    const addQty = stockInputs[productId] || 0;
    const rowPrices = priceInputs[productId] || {
      current_buy_price: String(product.current_buy_price),
      current_sell_price: String(product.current_sell_price),
    };

    const nextBuyPrice = Number(rowPrices.current_buy_price);
    const nextSellPrice = Number(rowPrices.current_sell_price);

    const hasStockChange = addQty > 0;
    const hasBuyPriceChange = nextBuyPrice !== product.current_buy_price;
    const hasSellPriceChange = nextSellPrice !== product.current_sell_price;

    if (!hasStockChange && !hasBuyPriceChange && !hasSellPriceChange) {
      setError("Please change quantity or prices before updating.");
      return;
    }

    if (
      Number.isNaN(nextBuyPrice) ||
      Number.isNaN(nextSellPrice) ||
      nextBuyPrice < 0 ||
      nextSellPrice < 0
    ) {
      setError("Please enter valid buy/sell prices.");
      return;
    }

    if (nextBuyPrice >= nextSellPrice) {
      setError("Buy price must be less than sell price.");
      return;
    }

    try {
      setUpdating(productId);
      setError("");
      const newStock = hasStockChange ? product.current_stock + addQty : product.current_stock;

      const todayShiftResponse = await getTodayShift();
      const todayShift = todayShiftResponse?.data?.data;
      const isShiftOpen = Boolean(todayShift && !todayShift.is_closed);

      const payload: {
        current_stock?: number;
        current_buy_price?: number;
        current_sell_price?: number;
      } = {};

      if (hasStockChange) {
        payload.current_stock = newStock;
      }

      if (hasBuyPriceChange) {
        payload.current_buy_price = nextBuyPrice;
      }

      if (hasSellPriceChange) {
        payload.current_sell_price = nextSellPrice;
      }

      let updatedProduct: Product;

      if (isShiftOpen && hasStockChange) {
        await addStockToShift({
          product_id: productId,
          quantity_added: addQty,
          new_buy_price: nextBuyPrice,
          ...(hasSellPriceChange ? { new_sell_price: nextSellPrice } : {}),
        });

        const freshProducts = await getAllProducts();
        const refreshed = (freshProducts || []).find((p) => p._id === productId);

        if (!refreshed) {
          throw new Error("Failed to refresh updated product");
        }

        updatedProduct = refreshed;
        setProducts((freshProducts || []).reverse());
      } else {
        updatedProduct = await updateProduct(productId, payload);
      }

      setProducts(prev =>
        prev.map(p =>
          p._id === productId ? updatedProduct : p
        )
      );

      setPriceInputs(prev => ({
        ...prev,
        [productId]: {
          current_buy_price: String(updatedProduct.current_buy_price),
          current_sell_price: String(updatedProduct.current_sell_price),
        },
      }));

      setSuccessId(productId);
      setTimeout(() => setSuccessId(null), 3000);
      setStockInputs(prev => ({ ...prev, [productId]: 0 }));
    } catch (err) {
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ||
            "Failed to update product")
          : "Failed to update product";
      setError(message);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <>
      <div className="max-w-350 mx-auto space-y-6 animate-in fade-in duration-500 px-6 md:px-12 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-black text-slate-900">Add Stock</h1>
            <button
              onClick={() => navigate("/dashboard")}
              className="sm:hidden px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50"
            >
              ← Dashboard
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <p className="text-sm text-slate-500 font-medium">
              Total Products: {products.length}
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="hidden sm:inline-flex px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50"
            >
              ← Back to Dashboard
            </button>
          </div>
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

        {/* Mobile Cards */}
        <div className="md:hidden bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="divide-y divide-slate-100">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-44 bg-slate-50/40" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredProducts.map((p) => (
                <div
                  key={p._id}
                  className={`p-4 space-y-3 transition-all duration-500 ${
                    successId === p._id ? "bg-green-50/80" : "bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-800 leading-tight">{p.name}</p>
                      <p className="text-[11px] text-slate-500 uppercase font-bold mt-1">
                        {p.category} · {p.unit}
                      </p>
                    </div>
                    {successId === p._id && (
                      <span className="bg-[#1D9E75] text-white text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase">
                        Updated ✓
                      </span>
                    )}
                  </div>

                  <div className="text-xs">
                    <span className={`px-3 py-1 rounded-xl font-black ${
                      p.current_stock <= p.low_stock_threshold
                        ? "bg-red-50 text-red-600 border border-red-100"
                        : "bg-slate-50 text-slate-600 border border-slate-100"
                    }`}>
                      Current Stock: {p.current_stock}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Add Qty</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="0"
                        className="w-full p-2 text-center bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#1D9E75] text-sm font-bold"
                        value={stockInputs[p._id] || ""}
                        onChange={(e) =>
                          setStockInputs((prev) => ({
                            ...prev,
                            [p._id]: Number(e.target.value),
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Buy</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full p-2 text-center bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#1D9E75] text-sm font-bold"
                        value={priceInputs[p._id]?.current_buy_price ?? String(p.current_buy_price)}
                        onChange={(e) =>
                          setPriceInputs((prev) => ({
                            ...prev,
                            [p._id]: {
                              current_buy_price: e.target.value,
                              current_sell_price:
                                prev[p._id]?.current_sell_price ?? String(p.current_sell_price),
                            },
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Sell</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full p-2 text-center bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#1D9E75] text-sm font-bold"
                        value={priceInputs[p._id]?.current_sell_price ?? String(p.current_sell_price)}
                        onChange={(e) =>
                          setPriceInputs((prev) => ({
                            ...prev,
                            [p._id]: {
                              current_buy_price:
                                prev[p._id]?.current_buy_price ?? String(p.current_buy_price),
                              current_sell_price: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleStockUpdate(p._id)}
                    disabled={updating === p._id}
                    className="w-full px-4 py-2 bg-[#1D9E75] text-white text-xs font-black rounded-xl hover:bg-[#168a65] transition-all active:scale-95 disabled:opacity-50"
                  >
                    {updating === p._id ? "Updating..." : "Update"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 font-medium">No products found.</div>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-245 text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                <tr>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-center">Unit</th>
                  <th className="px-6 py-4 text-center">Current Stock</th>
                  <th className="px-6 py-4 text-center">Add Qty</th>
                  <th className="px-6 py-4 text-center">Buy Price</th>
                  <th className="px-6 py-4 text-center">Sell Price</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse h-16 bg-slate-50/30" />
                  ))
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => (
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

                      <td className="px-6 py-4 text-center text-xs font-medium text-slate-400">{p.unit}</td>

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
                          onChange={(e) =>
                            setStockInputs((prev) => ({
                              ...prev,
                              [p._id]: Number(e.target.value),
                            }))
                          }
                        />
                      </td>

                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-24 p-2 text-center bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#1D9E75] text-sm font-bold"
                          value={priceInputs[p._id]?.current_buy_price ?? String(p.current_buy_price)}
                          onChange={(e) =>
                            setPriceInputs((prev) => ({
                              ...prev,
                              [p._id]: {
                                current_buy_price: e.target.value,
                                current_sell_price:
                                  prev[p._id]?.current_sell_price ?? String(p.current_sell_price),
                              },
                            }))
                          }
                        />
                      </td>

                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-24 p-2 text-center bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#1D9E75] text-sm font-bold"
                          value={priceInputs[p._id]?.current_sell_price ?? String(p.current_sell_price)}
                          onChange={(e) =>
                            setPriceInputs((prev) => ({
                              ...prev,
                              [p._id]: {
                                current_buy_price:
                                  prev[p._id]?.current_buy_price ?? String(p.current_buy_price),
                                current_sell_price: e.target.value,
                              },
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
                          {updating === p._id ? "Updating..." : "Update"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-slate-400 font-medium">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}