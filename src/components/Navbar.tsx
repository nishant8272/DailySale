import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLandingPage = location.pathname === "/";

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

  const navLinks = [
    { name: "Dashboard", path: "/dashboard", icon: "📊", roles: ["owner", "worker"] },
    { name: "Daily Sheet", path: "/daily", icon: "📝", roles: ["owner", "worker"] },
    { name: "Products", path: "/products", icon: "📦", roles: ["owner"] },
    { name: "Add Stock", path: "/add-stock", icon: "➕", roles: ["owner"] }, // ✅ added
    { name: "Reports", path: "/reports", icon: "📈", roles: ["owner"] },
  ];

  const navClasses = isLandingPage
    ? `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/80 backdrop-blur-md border-b border-slate-200 h-16" : "bg-transparent h-20"
      }`
    : "sticky top-0 z-50 bg-white border-b border-slate-200 h-16 shadow-sm";

  return (
    <nav className={`${navClasses} flex items-center px-6 md:px-12`}>
      <div className="max-w-350 w-full mx-auto flex justify-between items-center">

        {/* LEFT: Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 group">
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
            {navLinks.map((link) => (
              link.roles.includes(user.role) && (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                    location.pathname === link.path
                      ? "bg-white text-[#1D9E75] shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span>{link.icon}</span>
                  {link.name}
                </Link>
              )
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

                    {/* Profile Info */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xl font-bold text-slate-900">{user.name}</p>
                      <p className="text-[13px] text-slate-600 uppercase tracking-widest">{user.role}</p>
                    </div>

                    {/* Profile Link */}
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

                    {/* Logout */}
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
    </nav>
  );
}