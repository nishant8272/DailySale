import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";

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
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState<boolean>(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-[#0f172a]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .btn-shadow { shadow-sm hover:shadow-lg shadow-green-200/50; transition: all 0.2s; }
      `}</style>

      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-20 h-16 transition-all ${
          scrolled ? "bg-white/80 backdrop-blur-md border-b border-slate-200" : "bg-transparent"
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
            <a key={link.label} href={link.href} className="text-sm font-medium text-slate-500 hover:text-[#1D9E75]">
              {link.label}
            </a>
          ))}
          <button
            onClick={() => navigate("/auth")}
            className="bg-[#1D9E75] cursor-pointer text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-[#168a65] transition-all"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-100 text-[#1D9E75] text-xs font-bold mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            MADE FOR BHARAT
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#0f172a] mb-6 leading-[1.1]">
            Apni dukaan ka hisaab, <br/>
            <span className="text-[#1D9E75]">ek jagah pe.</span>
          </h1>
          
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Track daily sales, stock arrivals, and closing balances. 
            Know your exact profit shift-by-shift with zero guesswork.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto px-8 py-4 cursor-pointer bg-[#1D9E75] text-white rounded-2xl font-bold text-lg shadow-xl shadow-green-200/50 hover:bg-[#168a65] hover:-translate-y-1 transition-all"
            >
              Start Today's Shift
            </button>
          </div>

          {/* Mini Dashboard Preview */}
          <div className="relative mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl">
            <div className="rounded-2xl border border-slate-100 overflow-hidden bg-slate-50 p-4 md:p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Today's Revenue", val: "₹18,400", c: "text-[#1D9E75]" },
                  { label: "Today's Profit", val: "₹4,200", c: "text-blue-600" },
                  { label: "Units Sold", val: "240", c: "text-purple-600" },
                  { label: "Low Stock", val: "3", c: "text-red-500" },
                ].map((s) => (
                  <div key={s.label} className="bg-white p-4 rounded-xl border border-slate-200 text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                    <p className={`text-xl font-black ${s.c}`}>{s.val}</p>
                  </div>
                ))}
              </div>
            </div>
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
    </div>
  );
}