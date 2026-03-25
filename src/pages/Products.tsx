import React, { useState } from "react";

import type { ChangeEvent } from "react";
/* ─────────────────────────── TYPES ─────────────────────────── */
type Unit = "kg" | "litre" | "piece";
type SortDir = "asc" | "desc";
type SortKey = keyof Pick<Product, "name" | "category" | "sellPrice" | "cost">;

interface Product {
  id: number;
  name: string;
  sellPrice: number;
  cost: number;
  category: string;
  unit: Unit;
}

interface FormState {
  name: string;
  sellPrice: string;
  cost: string;
  category: string;
  unit: Unit;
}

/* ─────────────────────────── CONSTANTS ─────────────────────────── */
const UNITS: Unit[] = ["kg", "litre", "piece"];

/* ─────────────────────────── HELPERS ─────────────────────────── */
const getMargin    = (sell: number, cost: number): number => sell - cost;
const getMarginPct = (sell: number, cost: number): number =>
  sell > 0 ? Math.round(((sell - cost) / sell) * 100) : 0;

/* ─────────────────────────── CSS ─────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ps-input {
    width: 100%;
    padding: 10px 13px;
    border: 1.5px solid #d8d3c8;
    border-radius: 4px;
    font-size: 13px;
    font-family: 'Inter', sans-serif;
    background: #faf8f3;
    color: #1a1a1a;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .ps-input::placeholder { color: #b5b0a5; }
  .ps-input:focus {
    outline: none;
    border-color: #1a8a3c;
    box-shadow: 0 0 0 3px rgba(26,138,60,0.1);
    background: #fff;
  }

  .unit-btn:hover {
    background: #1a1a1a !important;
    color: #f5f0e8 !important;
    border-color: #1a1a1a !important;
  }

  .submit-btn:hover {
    background: #1a1a1a !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.18) !important;
  }

  .cancel-btn:hover {
    color: #1a1a1a !important;
    border-color: #aaa8a2 !important;
  }

  .ps-row { animation: rowIn 0.25s ease both; }
  .ps-row:hover td { background: #f5f0e8 !important; }

  .act-btn:hover {
    background: #1a1a1a !important;
    color: #f5f0e8 !important;
    border-color: #1a1a1a !important;
  }
  .del-btn:hover {
    background: #c0392b !important;
    color: #fff !important;
    border-color: #c0392b !important;
  }

  .sort-th { cursor: pointer; }
  .sort-th:hover { color: #1a8a3c !important; }

  .search-wrap { position: relative; display: flex; align-items: center; }
  .search-icon { position: absolute; left: 12px; color: #b5b0a5; font-size: 14px; pointer-events: none; }
  .search-input { padding-left: 34px !important; width: 240px; }

  @keyframes rowIn {
    from { opacity: 0; transform: translateY(5px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: #f5f0e8; }
  ::-webkit-scrollbar-thumb { background: #d8d3c8; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #b5b0a5; }
`;

/* ─────────────────────────── STYLES ─────────────────────────── */
const s: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    minHeight: "100vh",
    background: "#f5f0e8",
    fontFamily: "'Inter', sans-serif",
    color: "#1a1a1a",
  },
  sidebar: {
    width: 280,
    minWidth: 280,
    background: "#faf8f3",
    borderRight: "1px solid #e2ddd5",
    padding: "36px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 15,
  },
  sidebarTop: {
    paddingBottom: 20,
    borderBottom: "1px solid #e2ddd5",
    marginBottom: 4,
  },
  sidebarTitle: {
    fontFamily: "'Merriweather', serif",
    fontSize: 20,
    fontWeight: 700,
    color: "#1a1a1a",
    letterSpacing: "-0.3px",
    lineHeight: 1.2,
  },
  sidebarSub: {
    fontSize: 12,
    color: "#9a9690",
    marginTop: 4,
  },
  label: {
    fontSize: 10,
    letterSpacing: "0.1em",
    color: "#9a9690",
    fontWeight: 600,
    marginBottom: -8,
    textTransform: "uppercase",
  },
  unitRow: { display: "flex", gap: 6 },
  unitBtn: {
    flex: 1,
    padding: "8px 0",
    border: "1.5px solid #d8d3c8",
    borderRadius: 4,
    background: "#faf8f3",
    fontSize: 11,
    fontFamily: "'Inter', sans-serif",
    color: "#7a7670",
    cursor: "pointer",
    transition: "all 0.15s",
    fontWeight: 500,
  },
  unitActive: {
    background: "#1a1a1a",
    color: "#f5f0e8",
    borderColor: "#1a1a1a",
    fontWeight: 600,
  },
  preview: {
    background: "#eef8f1",
    border: "1px solid #b8e0c4",
    borderLeft: "3px solid #1a8a3c",
    borderRadius: 4,
    padding: "12px 14px",
  },
  previewLabel: {
    fontSize: 9,
    letterSpacing: "0.12em",
    color: "#1a8a3c",
    display: "block",
    marginBottom: 5,
    fontWeight: 600,
    textTransform: "uppercase",
  },
  previewVal: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1a1a1a",
    fontFamily: "'Merriweather', serif",
  },
  previewSub: {
    fontSize: 12,
    color: "#5a9a6a",
    marginLeft: 6,
    fontWeight: 400,
    fontFamily: "'Inter', sans-serif",
  },
  submitBtn: {
    width: "100%",
    padding: "12px 0",
    background: "#1a1a1a",
    color: "#f5f0e8",
    border: "none",
    borderRadius: 40,
    fontSize: 13,
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 4,
    transition: "all 0.18s",
    letterSpacing: "0.02em",
  },
  cancelBtn: {
    width: "100%",
    padding: "10px 0",
    background: "transparent",
    color: "#9a9690",
    border: "1px solid #d8d3c8",
    borderRadius: 40,
    fontSize: 12,
    fontFamily: "'Inter', sans-serif",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  main: {
    flex: 1,
    padding: "36px 36px",
    display: "flex",
    flexDirection: "column",
    gap: 22,
    overflow: "hidden",
  },
  pageHeader: {
    display: "flex",
    alignItems: "baseline",
    gap: 12,
  },
  pageTitle: {
    fontFamily: "'Merriweather', serif",
    fontSize: 26,
    fontWeight: 700,
    color: "#1a1a1a",
    letterSpacing: "-0.4px",
  },
  pageCount: {
    fontSize: 13,
    color: "#9a9690",
  },
  statsRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  statCard: {
    flex: 1,
    minWidth: 110,
    background: "#faf8f3",
    border: "1px solid #e2ddd5",
    borderRadius: 6,
    padding: "16px 18px",
  },
  statLabel: {
    fontSize: 9,
    letterSpacing: "0.12em",
    color: "#9a9690",
    marginBottom: 6,
    fontWeight: 600,
    textTransform: "uppercase",
  },
  statVal: {
    fontSize: 26,
    fontWeight: 700,
    color: "#1a1a1a",
    fontFamily: "'Merriweather', serif",
  },
  statGreen: { color: "#1a8a3c" },
  toolbar: { display: "flex", alignItems: "center", gap: 10 },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid #e2ddd5",
    borderRadius: 6,
    background: "#faf8f3",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    padding: "13px 18px",
    textAlign: "left",
    fontSize: 9,
    letterSpacing: "0.12em",
    color: "#9a9690",
    fontWeight: 600,
    borderBottom: "1px solid #e2ddd5",
    background: "#faf8f3",
    userSelect: "none",
    whiteSpace: "nowrap",
    textTransform: "uppercase",
    transition: "color 0.15s",
  },
  tr: { borderBottom: "1px solid #ede9e0" },
  td: { padding: "14px 18px", verticalAlign: "middle", transition: "background 0.1s" },
  productName: { fontWeight: 600, fontSize: 14, color: "#1a1a1a" },
  productUnit: { fontSize: 11, color: "#b5b0a5", marginTop: 2 },
  catText: { fontSize: 12, color: "#7a7670", fontStyle: "italic" },
  sellPrice: { fontWeight: 700, color: "#1a1a1a", fontSize: 15 },
  cost: { color: "#9a9690", fontSize: 13 },
  marginVal: { fontWeight: 600, color: "#1a8a3c", fontSize: 13 },
  marginPct: { fontSize: 11, color: "#9a9690" },
  marginBar: {
    height: 3,
    background: "#e2ddd5",
    borderRadius: 2,
    marginTop: 6,
    overflow: "hidden",
    width: 72,
  },
  marginBarFill: {
    height: "100%",
    background: "#1a8a3c",
    borderRadius: 2,
    transition: "width 0.4s ease",
  },
  actions: { display: "flex", gap: 5 },
  actBtn: {
    padding: "5px 13px",
    border: "1px solid #d8d3c8",
    borderRadius: 40,
    background: "transparent",
    fontSize: 11,
    fontFamily: "'Inter', sans-serif",
    color: "#7a7670",
    cursor: "pointer",
    transition: "all 0.15s",
    fontWeight: 500,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "100px 20px",
    gap: 12,
  },
  emptyCircle: {
    width: 52,
    height: 52,
    border: "1.5px dashed #d8d3c8",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    color: "#d8d3c8",
    marginBottom: 6,
  },
  emptyText: {
    fontFamily: "'Merriweather', serif",
    fontSize: 14,
    color: "#c5c0b8",
    fontWeight: 700,
  },
  emptyHint: { fontSize: 12, color: "#d8d3c8" },
  noMatch: {
    textAlign: "center",
    padding: "50px 20px",
    color: "#c5c0b8",
    fontSize: 12,
    fontStyle: "italic",
    fontFamily: "'Merriweather', serif",
  },
};

/* ─────────────────────────── INITIAL FORM ─────────────────────────── */
const EMPTY_FORM: FormState = {
  name: "",
  sellPrice: "",
  cost: "",
  category: "",
  unit: "kg",
};

/* ─────────────────────────── COMPONENT ─────────────────────────── */
export default function ProductSection(): React.ReactElement {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm]         = useState<FormState>(EMPTY_FORM);
  const [editId, setEditId]     = useState<number | null>(null);
  const [search, setSearch]     = useState<string>("");
  const [sortBy, setSortBy]     = useState<SortKey | null>(null);
  const [sortDir, setSortDir]   = useState<SortDir>("asc");

  /* ── Handlers ── */
  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (): void => {
    if (!form.name.trim() || !form.sellPrice || !form.cost) return;

    const updated: Product = {
      id: editId ?? Date.now(),
      name: form.name,
      sellPrice: Number(form.sellPrice),
      cost: Number(form.cost),
      category: form.category,
      unit: form.unit,
    };

    if (editId !== null) {
      setProducts((prev) => prev.map((p) => (p.id === editId ? updated : p)));
      setEditId(null);
    } else {
      setProducts((prev) => [...prev, updated]);
    }
    setForm(EMPTY_FORM);
  };

  const handleEdit = (p: Product): void => {
    setEditId(p.id);
    setForm({
      name: p.name,
      sellPrice: String(p.sellPrice),
      cost: String(p.cost),
      category: p.category,
      unit: p.unit,
    });
  };

  const handleDelete = (id: number): void => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (editId === id) {
      setEditId(null);
      setForm(EMPTY_FORM);
    }
  };

  const handleSort = (col: SortKey): void => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  };

  /* ── Derived state ── */
  let filtered: Product[] = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (sortBy) {
    filtered = [...filtered].sort((a, b) => {
      const va = a[sortBy];
      const vb = b[sortBy];
      if (typeof va === "string" && typeof vb === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === "asc"
        ? (va as number) - (vb as number)
        : (vb as number) - (va as number);
    });
  }

  const totalProducts: number = products.length;

  const avgMargin: number = products.length
    ? Math.round(
        products.reduce((acc, p) => acc + getMarginPct(p.sellPrice, p.cost), 0) /
          products.length
      )
    : 0;

  const topProduct: Product | null = products.length
    ? products.reduce((best, p) =>
        getMarginPct(p.sellPrice, p.cost) > getMarginPct(best.sellPrice, best.cost)
          ? p
          : best
      )
    : null;

  const showPreview: boolean =
    !!form.sellPrice && !!form.cost && Number(form.sellPrice) > 0 && Number(form.cost) > 0;

  /* ── Stat rows config ── */
  const stats: [string, string | number, boolean][] = [
    ["Total",       totalProducts,                                                                  false],
    ["Avg margin",  `${avgMargin}%`,                                                                true],
    ["Best margin", topProduct ? `${getMarginPct(topProduct.sellPrice, topProduct.cost)}%` : "—",  true],
    ["Categories",  new Set(products.map((p) => p.category || "—")).size,                          false],
  ];

  /* ── Column config ── */
  type ColDef = [SortKey | null, string];
  const columns: ColDef[] = [
    ["name",      "Product"],
    ["category",  "Category"],
    ["sellPrice", "Sell Price"],
    ["cost",      "Cost"],
    [null,        "Margin"],
    [null,        "Actions"],
  ];

  /* ── Render ── */
  return (
    <div style={s.root}>
      <style>{css}</style>

      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>
        <div style={s.sidebarTop}>
          <div style={s.sidebarTitle}>{editId ? "Edit product" : "Add product"}</div>
          <div style={s.sidebarSub}>
            {editId ? "Update the details below" : "Fill in the details to add"}
          </div>
        </div>

        <label style={s.label}>Product Name</label>
        <input
          className="ps-input"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="e.g. Paneer"
        />

        <label style={s.label}>Selling Price (₹)</label>
        <input
          className="ps-input"
          name="sellPrice"
          type="number"
          value={form.sellPrice}
          onChange={handleChange}
          placeholder="0"
          min="0"
        />

        <label style={s.label}>Cost Price (₹)</label>
        <input
          className="ps-input"
          name="cost"
          type="number"
          value={form.cost}
          onChange={handleChange}
          placeholder="0"
          min="0"
        />

        <label style={s.label}>Category</label>
        <input
          className="ps-input"
          name="category"
          value={form.category}
          onChange={handleChange}
          placeholder="e.g. Dairy, Sweets…"
        />

        <label style={s.label}>Unit</label>
        <div style={s.unitRow}>
          {UNITS.map((u) => (
            <button
              key={u}
              className="unit-btn"
              style={{ ...s.unitBtn, ...(form.unit === u ? s.unitActive : {}) }}
              onClick={() => setForm((prev) => ({ ...prev, unit: u }))}
            >
              {u}
            </button>
          ))}
        </div>

        {showPreview && (
          <div style={s.preview}>
            <span style={s.previewLabel}>Margin Preview</span>
            <span style={s.previewVal}>
              ₹{getMargin(Number(form.sellPrice), Number(form.cost))}
              <span style={s.previewSub}>
                ({getMarginPct(Number(form.sellPrice), Number(form.cost))}%)
              </span>
            </span>
          </div>
        )}

        <button style={s.submitBtn} className="submit-btn" onClick={handleSubmit}>
          {editId ? "Update product" : "Add product"}
        </button>

        {editId && (
          <button
            style={s.cancelBtn}
            className="cancel-btn"
            onClick={() => { setEditId(null); setForm(EMPTY_FORM); }}
          >
            Cancel
          </button>
        )}
      </aside>

      {/* ── Main ── */}
      <main style={s.main}>

        <div style={s.pageHeader}>
          <span style={s.pageTitle}>Products</span>
          {products.length > 0 && (
            <span style={s.pageCount}>
              {products.length} item{products.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Stats */}
        {products.length > 0 && (
          <div style={s.statsRow}>
            {stats.map(([label, val, green]) => (
              <div key={label} style={s.statCard}>
                <div style={s.statLabel}>{label}</div>
                <div style={{ ...s.statVal, ...(green ? s.statGreen : {}) }}>{val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        {products.length > 0 && (
          <div style={s.toolbar}>
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="ps-input search-input"
                value={search}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                placeholder="Search by name or category…"
              />
            </div>
          </div>
        )}

        {/* Table */}
        <div style={s.tableWrap}>
          {products.length === 0 ? (
            <div style={s.emptyState}>
              <div style={s.emptyCircle}>✦</div>
              <div style={s.emptyText}>No products yet</div>
              <div style={s.emptyHint}>Add your first product using the form on the left</div>
            </div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  {columns.map(([col, label]) => (
                    <th
                      key={label}
                      style={s.th}
                      className={col ? "sort-th" : ""}
                      onClick={() => col && handleSort(col)}
                    >
                      {label}{" "}
                      {col
                        ? sortBy === col
                          ? sortDir === "asc" ? "↑" : "↓"
                          : <span style={{ opacity: 0.3 }}>↕</span>
                        : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={s.noMatch}>No products match your search.</td>
                  </tr>
                ) : (
                  filtered.map((p, i) => {
                    const m   = getMargin(p.sellPrice, p.cost);
                    const pct = getMarginPct(p.sellPrice, p.cost);
                    return (
                      <tr
                        key={p.id}
                        className="ps-row"
                        style={{ ...s.tr, animationDelay: `${i * 30}ms` }}
                      >
                        <td style={s.td}>
                          <div style={s.productName}>{p.name}</div>
                          <div style={s.productUnit}>{p.unit}</div>
                        </td>
                        <td style={s.td}>
                          <span style={s.catText}>{p.category || "—"}</span>
                        </td>
                        <td style={s.td}>
                          <span style={s.sellPrice}>₹{p.sellPrice}</span>
                        </td>
                        <td style={s.td}>
                          <span style={s.cost}>₹{p.cost}</span>
                        </td>
                        <td style={s.td}>
                          <span style={s.marginVal}>₹{m}</span>
                          <span style={s.marginPct}> ({pct}%)</span>
                          <div style={s.marginBar}>
                            <div
                              style={{ ...s.marginBarFill, width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </td>
                        <td style={s.td}>
                          <div style={s.actions}>
                            <button
                              className="act-btn"
                              style={s.actBtn}
                              onClick={() => handleEdit(p)}
                            >
                              Edit
                            </button>
                            <button
                              className="act-btn del-btn"
                              style={{ ...s.actBtn, color: "#c5c0b8" }}
                              onClick={() => handleDelete(p.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}