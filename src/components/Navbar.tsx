import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X } from "lucide-react";
import toast from "react-hot-toast";
import { fetchShopsDirectoryApi } from "../services/superadmin.service";

export default function Navbar() {
  const { user, logout, setShop } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLandingPage = location.pathname === "/";
  const impersonatedShopId = localStorage.getItem("super_admin_shop_id");
  const [shopsList, setShopsList] = useState<{ _id: string; name: string; owner_name: string }[]>([]);

  useEffect(() => {
    if (user?.role === "super_admin") {
      fetchShopsDirectoryApi({ page: 1, limit: 100 })
        .then((res) => {
          if (res && res.shops) {
            setShopsList(res.shops);
          }
        })
        .catch((err) => console.error("Error fetching shops for dropdown", err));
    }
  }, [user]);

  const handleShopChange = (selectedId: string) => {
    if (selectedId === "global") {
      localStorage.removeItem("super_admin_shop_id");
      setShop(null);
      toast.success("Returned to Global Console.");
      window.location.href = "/super-admin";
    } else {
      const chosenShop = shopsList.find((s) => s._id === selectedId);
      if (chosenShop) {
        localStorage.setItem("super_admin_shop_id", chosenShop._id);
        setShop(chosenShop);
        toast.success(`Switched view to ${chosenShop.name}`);
        if (location.pathname.startsWith("/super-admin")) {
          window.location.href = "/dashboard";
        } else {
          window.location.reload();
        }
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleReturnToGlobal = () => {
    localStorage.removeItem("super_admin_shop_id");
    toast.success("Returned to Global Admin console.");
    window.location.href = "/super-admin/shops";
  };

  const navLinks = [
    { name: "Dashboard", path: "/dashboard", icon: "📊", roles: ["owner", "worker"] },
    { name: "Shift", path: "/shift", icon: "⏳", roles: ["owner", "worker"] },
    { name: "Daily Sheet", path: "/daily", icon: "📝", roles: ["owner", "worker"] },
    { name: "Products", path: "/products", icon: "📦", roles: ["owner"] },
    { name: "Add Stock", path: "/add-stock", icon: "➕", roles: ["owner"] },
    { name: "Reports", path: "/reports", icon: "📈", roles: ["owner"] },
    { name: "Udharbook", path: "/udharbook", icon: "📖", roles: ["owner", "worker"] },
  ];

  const superAdminLinks = [
    { name: "Overview", path: "/super-admin", icon: "👑", roles: ["super_admin"] },
    { name: "Shops", path: "/super-admin/shops", icon: "🏬", roles: ["super_admin"] },
    { name: "Users", path: "/super-admin/users", icon: "👥", roles: ["super_admin"] },
    { name: "Activity Logs", path: "/super-admin/logs", icon: "📜", roles: ["super_admin"] },
    { name: "Alerts", path: "/super-admin/alerts", icon: "🔔", roles: ["super_admin"] },
  ];

  const activeLinks = user?.role === "super_admin" && !impersonatedShopId
    ? superAdminLinks
    : navLinks.filter((link) => {
        const checkRole = user?.role === "super_admin" ? "owner" : user?.role;
        return link.roles.includes(checkRole || "");
      });

  const navClasses = isLandingPage
    ? `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-md border-b border-slate-200 h-16" : "bg-transparent h-20"
    }`
    : "sticky top-0 z-50 bg-white border-b border-slate-200 h-16 shadow-sm";

  return (
    <>
      <nav className={`${navClasses} flex flex-col px-6 md:px-12 relative`}>
        <div className="max-w-7xl w-full h-full mx-auto flex justify-between items-center">

          {/* LEFT: Logo */}
          <Link to={user?.role === "super_admin" && !impersonatedShopId ? "/super-admin" : "/dashboard"} className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[#1D9E75] rounded-lg flex items-center justify-center shadow-sm group-hover:rotate-3 transition-transform">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-5 h-5">
                <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 9l-5 5-3-3-4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tighter text-[#0f172a]">DailySales</span>
          </Link>

          {/* MIDDLE: Nav Links */}
          {user && (
            <div className="hidden md:flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
              {activeLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${location.pathname === link.path
                    ? "bg-white text-[#1D9E75] shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  <span>{link.icon}</span>
                  {link.name}
                </Link>
              ))}
            </div>
          )}

          {/* RIGHT: Auth/Profile */}
          <div className="flex items-center gap-4">
            {!user ? (
              <div className="flex items-center gap-6">
                <a href="#features" className="hidden sm:block text-sm font-semibold text-slate-500 hover:text-[#1D9E75]">Features</a>
                <button
                  onClick={() => navigate("/auth")}
                  className="bg-[#1D9E75] text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-green-200/50 hover:bg-[#168a65] transition-all"
                >
                  Sign In
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                {/* Mobile Menu Toggle */}
                <button
                  className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>

                <div className="text-right hidden sm:block">
                  <p className="text-[11px] font-black text-slate-900 leading-tight">{user.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{user.role}</p>
                </div>

                {/* Avatar + Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <div
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm font-bold text-[#1D9E75] text-sm uppercase cursor-pointer hover:ring-2 hover:ring-[#1D9E75] transition-all"
                  >
                    {user.name.charAt(0)}
                  </div>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">

                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-xl font-bold text-slate-900">{user.name}</p>
                        <p className="text-[13px] text-slate-600 uppercase tracking-widest">{user.role}</p>
                      </div>
                      <button
                        onClick={() => { navigate("/profile"); setDropdownOpen(false); }}
                        className="w-full cursor-pointer flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
                        </svg>
                        Profile
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full cursor-pointer flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {user && mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-xl py-4 px-4 flex flex-col gap-2 z-40 animate-in slide-in-from-top-5 duration-200">
            {activeLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 text-sm font-bold rounded-xl transition-all flex items-center gap-3 ${location.pathname === link.path
                  ? "bg-green-50 text-[#1D9E75]"
                  : "text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <span className="text-lg">{link.icon}</span>
                {link.name}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* SHOP VIEW DROPDOWN BAR */}
      {user?.role === "super_admin" && (
        <div className="bg-slate-50 border-b border-slate-200 px-6 md:px-12 py-2 flex items-center justify-between text-xs">
          <div className="max-w-7xl w-full mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-500 uppercase tracking-widest text-[10px] flex items-center gap-1 select-none">
                <span>🏬</span> Shop View:
              </span>
              <select
                value={impersonatedShopId || "global"}
                onChange={(e) => handleShopChange(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              >
                <option value="global">Platform Overview (Global)</option>
                {shopsList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.owner_name})
                  </option>
                ))}
              </select>
            </div>
            {impersonatedShopId && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] bg-amber-500/10 text-amber-700 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider select-none animate-pulse">
                  Impersonating Shop Context
                </span>
                <button
                  onClick={handleReturnToGlobal}
                  className="bg-white text-slate-700 border border-slate-200 font-bold px-3 py-1 rounded-lg shadow-sm hover:bg-slate-50 active:scale-95 transition-all cursor-pointer text-[11px]"
                >
                  Return to Global Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}