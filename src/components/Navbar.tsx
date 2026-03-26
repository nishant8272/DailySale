import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Check if we are on the landing page (root path)
  const isLandingPage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinks = [
    { name: "Dashboard", path: "/dashboard", icon: "📊", roles: ["owner", "worker"] },
    { name: "Daily Sheet", path: "/daily-sheet", icon: "📝", roles: ["owner", "worker"] },
    { name: "Products", path: "/products", icon: "📦", roles: ["owner"] },
    { name: "Reports", path: "/reports", icon: "📈", roles: ["owner"] },
  ];

  // Dynamic Styles based on Page & Scroll
  const navClasses = isLandingPage
    ? `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/80 backdrop-blur-md border-b border-slate-200 h-16" : "bg-transparent h-20"
      }`
    : "sticky top-0 z-50 bg-white border-b border-slate-200 h-16 shadow-sm";

  return (
    <nav className={`${navClasses} flex items-center px-6 md:px-12`}>
      <div className="max-w-350 w-full mx-auto flex justify-between items-center">
        
        {/* LEFT: Logo Section */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-[#1D9E75] rounded-lg flex items-center justify-center shadow-sm group-hover:rotate-3 transition-transform">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-5 h-5">
              <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18.5 9l-5 5-3-3-4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xl font-black tracking-tighter text-[#0f172a]">DailySales</span>
        </Link>

        {/* MIDDLE: Internal Navigation (Only if Logged In) */}
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

        {/* RIGHT: Auth/Profile Section */}
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
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  {user.role}
                </p>
              </div>
              <div className="relative group cursor-pointer-">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm font-bold text-[#1D9E75] text-sm uppercase">
                  {user.name.charAt(0)}
                </div>
                {/* Logout Tooltip/Button overlay */}
                <button 
                  onClick={handleLogout}
                  className="absolute -right-1 -top-1 w-5 h-5 cursor-pointer bg-red-500 text-white rounded-full flex items-center justify-center border-2 border-white hover:bg-red-600 transition-colors shadow-sm"
                  title="Logout"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-2.5 h-2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}