import React, { useState, useEffect } from "react";
import { AuthModal } from "../components/AuthModal";

interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#" },
  { label: "About", href: "#" },
];

export default function LandingPage(): React.ReactElement {
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [authOpen, setAuthOpen] = useState<boolean>(false);
  const [authRedirect, setAuthRedirect] = useState<"/dashboard" | "/shift">("/dashboard");

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = authOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [authOpen]);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-[#0f172a]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-150 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] rounded-full bg-green-100/40 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[50%] rounded-full bg-blue-100/30 blur-[100px]"></div>
      </div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-5">
        <div className="absolute top-[20%] left-[10%] animate-bounce duration-3000 opacity-20">
          <span className="text-4xl text-yellow-500">💰</span>
        </div>
        <div className="absolute top-[60%] left-[5%] animate-pulse opacity-10 rotate-12">
          <span className="text-5xl">🧮</span>
        </div>
        <div className="absolute top-[30%] right-[10%] animate-bounce duration-4000 opacity-20 -rotate-12">
          <span className="text-4xl">🛍️</span>
        </div>
        <div className="absolute top-[70%] right-[15%] animate-pulse opacity-10">
          <span className="text-5xl">📈</span>
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .btn-shadow { shadow-sm hover:shadow-lg shadow-green-200/50; transition: all 0.2s; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-reveal {
            animation: fadeInUp 0.8s ease-out forwards;
        }

        .delay-1 { animation-delay: 0.2s; opacity: 0; }
        .delay-2 { animation-delay: 0.4s; opacity: 0; }
      `}</style>

      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-20 h-16 transition-all ${scrolled ? "bg-white/80 backdrop-blur-md border-b border-slate-200" : "bg-transparent"
          }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1D9E75] rounded-lg flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-5 h-5">
              <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18.5 9l-5 5-3-3-4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-[#0f172a]">DailySales</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="relative text-sm font-medium text-slate-500 hover:text-[#1D9E75] transition-colors group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#1D9E75] transition-all group-hover:w-full"></span>
            </a>
          ))}
          <button
            onClick={() => {
              setAuthRedirect("/dashboard");
              setAuthOpen(true);
            }}
            className="bg-[#1D9E75] cursor-pointer text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-[#168a65] transition-all"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Hero Background Decor */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-150 h-100 bg-green-200/20 blur-[120px] rounded-full"></div>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(#1D9E75 0.5px, transparent 0.5px)",
              backgroundSize: "30px 30px",
              opacity: "0.05",
            }}
          />
        </div>

        {/* Floating Shop Icons */}
        <div className="hidden lg:block pointer-events-none">
          <div className="absolute left-[10%] top-[25%] animate-bounce duration-4000 opacity-50">
            <div className="p-4 bg-white rounded-2xl shadow-xl border border-slate-500 -rotate-12">
              <span className="text-3xl">💵</span>
            </div>
          </div>
          <div className="absolute left-[15%] bottom-[30%] animate-pulse opacity-50 rotate-12">
            <div className="p-3 bg-white rounded-xl shadow-lg border border-slate-500">
              <span className="text-2xl">📝</span>
            </div>
          </div>

          <div className="absolute right-[10%] top-[30%] animate-bounce duration-5000 opacity-50 rotate-12">
            <div className="p-4 bg-white rounded-2xl shadow-xl border border-slate-500">
              <span className="text-3xl">📦</span>
            </div>
          </div>
          <div className="absolute right-[15%] bottom-[25%] animate-pulse opacity-50 -rotate-12">
            <div className="p-3 bg-white rounded-xl shadow-lg border border-slate-500">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-reveal inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-100 text-[#1D9E75] text-xs font-bold mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            MADE FOR BHARAT
          </div>

          <h1 className="animate-reveal text-4xl md:text-6xl font-extrabold tracking-tight text-[#0f172a] mb-6 leading-[1.1]">
            Apni dukaan ka hisaab, <br />
            <span className="text-[#1D9E75]">ek jagah pe.</span>
          </h1>

          <p className="animate-reveal delay-1 text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Track daily sales, stock arrivals, and closing balances.
            Know your exact profit shift-by-shift with zero guesswork.
          </p>

          <div className="animate-reveal delay-2 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => {
                setAuthRedirect("/dashboard");
                setAuthOpen(true);
              }}
              className="w-full sm:w-auto px-8 py-4 cursor-pointer bg-[#1D9E75] text-white rounded-2xl font-bold text-lg shadow-xl shadow-green-200/50 hover:bg-[#168a65] hover:-translate-y-1 transition-all"
            >
              Start Today's Shift
            </button>
          </div>

          {/* Mini Dashboard Preview */}
          <div className="relative mx-auto max-w-5xl px-4 group">
            {/* Decorative Glow Background */}
            <div className="absolute -inset-10 bg-linear-to-r from-green-300/30 via-blue-200/20 to-purple-300/30 rounded-[3rem] blur-3xl opacity-50"></div>

            <div className="relative rounded-3xl border border-white/40 bg-white/80 backdrop-blur-xl p-2 shadow-2xl transition-transform duration-500 hover:scale-[1.02] hover:-rotate-1">
              <div className="rounded-2xl border border-slate-100 overflow-hidden bg-slate-50/50 p-4 md:p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Today's Revenue", val: "₹18,400", c: "text-[#1D9E75]", icon: "📈" },
                    { label: "Today's Profit", val: "₹4,200", c: "text-blue-600", icon: "💰" },
                    { label: "Units Sold", val: "240", c: "text-purple-600", icon: "📦" },
                    { label: "Low Stock", val: "3", c: "text-red-500", icon: "⚠️" },
                  ].map((s, i) => (
                    <div
                      key={s.label}
                      className="bg-white p-5 rounded-2xl border border-slate-100 text-left shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                      style={{ transitionDelay: `${i * 100}ms` }}
                    >
                      <div className="text-xl mb-2">{s.icon}</div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
                      <p className={`text-2xl font-black ${s.c}`}>{s.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="animate-reveal delay-2 mt-20 flex flex-wrap justify-center items-center gap-8 opacity-40 grayscale contrast-125">
            <p className="text-sm font-bold text-slate-400 w-full text-center mb-2 uppercase tracking-widest">Perfect for</p>
            <span className="text-lg font-bold rounded-full bg-slate-200 text-slate-700 px-4 py-2">Kirana Stores</span>
            <span className="text-lg font-bold rounded-full bg-slate-200 text-slate-700 px-4 py-2">Medical Shops</span>
            <span className="text-lg font-bold rounded-full bg-slate-200 text-slate-700 px-4 py-2">Bakeries</span>
            <span className="text-lg font-bold rounded-full bg-slate-200 text-slate-700 px-4 py-2">Electronic Stores</span>
          </div>
        </div>
      </section>

      {/* Features Simple */}
      <section id="features" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-6">
                <svg viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" className="w-6 h-6">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Profit</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                No more manual calculators. Just enter closing stock and see your profit immediately.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" className="w-6 h-6">
                  <path d="M21 8l-9-4-9 4 9 4 9-4zM3 12l9 4 9-4M3 16l9 4 9-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Stock Alerts</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Get notified when your best-selling products are about to finish. Never miss a sale.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6">
                <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" className="w-6 h-6">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Safe & Secure</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Your data is encrypted and backed up daily. Access your shop records from anywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-12 border-t border-slate-200 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 grayscale opacity-70">
            <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3">
                <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-bold text-slate-800">DailySales</span>
          </div>
          <p className="text-xs text-slate-400 font-medium tracking-widest uppercase">
            Secure • Private • Made for Bharat
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-slate-400 hover:text-slate-600">Privacy</a>
            <a href="#" className="text-xs text-slate-400 hover:text-slate-600">Terms</a>
          </div>
        </div>
      </footer>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        redirectTo={authRedirect}
      />
    </div>
  );
}