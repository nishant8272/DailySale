import React, { useState, useEffect } from "react";
import { AuthModal } from "../components/AuthModal";
import { Link } from "react-router-dom";

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
  const [authRedirect, setAuthRedirect] = useState<"/dashboard">("/dashboard");

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
    <div className="relative min-h-screen overflow-x-hidden bg-[#f8fafc] font-sans text-[#0f172a]">
      <div className="pointer-events-none absolute top-0 left-1/2 -z-10 h-112 w-full -translate-x-1/2 overflow-hidden sm:h-136 lg:h-160">
        <div className="absolute top-[-10%] left-[-10%] h-56 w-56 rounded-full bg-green-100/40 blur-[120px] animate-pulse sm:h-88 sm:w-88 md:h-104 md:w-104"></div>
        <div className="absolute bottom-[10%] right-[-5%] h-48 w-48 rounded-full bg-blue-100/30 blur-[100px] sm:h-72 sm:w-72 md:h-88 md:w-88"></div>
      </div>
      <div className="pointer-events-none absolute inset-0 -z-5 overflow-hidden">
        <div className="absolute top-[20%] left-[10%] animate-bounce opacity-20 [animation-duration:3s]">
          <span className="text-4xl text-yellow-500">💰</span>
        </div>
        <div className="absolute top-[60%] left-[5%] animate-pulse opacity-10 rotate-12">
          <span className="text-5xl">🧮</span>
        </div>
        <div className="absolute top-[30%] right-[10%] animate-bounce opacity-20 -rotate-12 [animation-duration:4s]">
          <span className="text-4xl">🛍️</span>
        </div>
        <div className="absolute top-[70%] right-[15%] animate-pulse opacity-10">
          <span className="text-5xl">📈</span>
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .btn-shadow { box-shadow: 0 4px 14px 0 rgba(4, 120, 87, 0.39); transition: all 0.2s; }
        .btn-shadow:hover { box-shadow: 0 6px 20px rgba(4, 120, 87, 0.23); transform: translateY(-2px); }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float3D {
          0% { transform: rotateX(10deg) rotateY(-5deg) translateY(0px); }
          50% { transform: rotateX(12deg) rotateY(-3deg) translateY(-15px); }
          100% { transform: rotateX(10deg) rotateY(-5deg) translateY(0px); }
        }
        @keyframes spinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        .animate-reveal { animation: fadeInUp 0.8s ease-out forwards; }
        .animate-float3d { animation: float3D 6s ease-in-out infinite; transform-style: preserve-3d; }
        .delay-1 { animation-delay: 0.2s; opacity: 0; }
        .delay-2 { animation-delay: 0.4s; opacity: 0; }
      `}</style>

      {/* Navbar */}
      <nav
        className={`fixed left-1/2 top-4 z-50 flex w-[95%] max-w-5xl -translate-x-1/2 items-center justify-between rounded-full border border-white/20 px-4 py-3 shadow-xl transition-all duration-300 md:px-8 ${scrolled ? "bg-white/80 backdrop-blur-xl shadow-slate-200/50" : "bg-white/40 backdrop-blur-md shadow-slate-200/20"
          }`}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-[#047857] to-[#10b981] shadow-lg shadow-emerald-500/30">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="h-5 w-5">
              <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18.5 9l-5 5-3-3-4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">Daily<span className="text-[#047857]">Sales</span></span>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="group relative text-sm font-semibold text-slate-600 transition-colors hover:text-[#047857]"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 rounded-full bg-[#047857] transition-all group-hover:w-full"></span>
            </a>
          ))}
          <button
            onClick={() => {
              setAuthRedirect("/dashboard");
              setAuthOpen(true);
            }}
            className="btn-shadow rounded-full bg-linear-to-r from-[#047857] to-[#10b981] px-6 py-2.5 text-sm font-bold text-white transition-all"
          >
            Sign In
          </button>
        </div>

        <button
          onClick={() => {
            setAuthRedirect("/dashboard");
            setAuthOpen(true);
          }}
          className="ml-auto rounded-full bg-linear-to-r from-[#047857] to-[#10b981] px-5 py-2 text-sm font-bold text-white shadow-md shadow-emerald-500/30 transition-all hover:scale-105 md:hidden"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-28 pb-16 sm:px-6 sm:pt-32 sm:pb-20">
        {/* Hero Background Decor */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-[10%] left-[20%] h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-300/30 blur-[120px] mix-blend-multiply md:h-[30rem] md:w-[30rem] animate-[pulseGlow_6s_ease-in-out_infinite]"></div>
          <div className="absolute top-[20%] right-[10%] h-72 w-72 rounded-full bg-teal-200/30 blur-[100px] mix-blend-multiply md:h-[25rem] md:w-[25rem] animate-[pulseGlow_7s_ease-in-out_infinite_reverse]"></div>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(#10b981 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              opacity: "0.03",
            }}
          />
        </div>

        {/* Floating Shop Icons */}
        <div className="hidden lg:block pointer-events-none">
          <div className="absolute left-[8%] top-[25%] animate-[float3D_5s_ease-in-out_infinite]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/60 bg-white/40 shadow-2xl backdrop-blur-md">
              <span className="text-3xl drop-shadow-md">💵</span>
            </div>
          </div>
          <div className="absolute left-[12%] bottom-[25%] animate-[float3D_6s_ease-in-out_infinite_reverse]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/60 bg-white/40 shadow-xl backdrop-blur-md">
              <span className="text-2xl drop-shadow-md">📝</span>
            </div>
          </div>

          <div className="absolute right-[8%] top-[30%] animate-[float3D_7s_ease-in-out_infinite]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/60 bg-white/40 shadow-2xl backdrop-blur-md">
              <span className="text-3xl drop-shadow-md">📦</span>
            </div>
          </div>
          <div className="absolute right-[12%] bottom-[20%] animate-[float3D_5.5s_ease-in-out_infinite_reverse]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/60 bg-white/40 shadow-xl backdrop-blur-md">
              <span className="text-2xl drop-shadow-md">📈</span>
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

          <h1 className="animate-reveal mb-6 text-4xl font-black leading-[1.1] tracking-tight text-slate-900 sm:text-5xl md:text-7xl">
            Apni dukaan ka hisaab, <br />
            <span className="bg-gradient-to-r from-[#047857] to-[#10b981] bg-clip-text text-transparent drop-shadow-sm">ek jagah pe.</span>
          </h1>

          <p className="animate-reveal delay-1 mx-auto mb-10 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg md:text-xl md:leading-relaxed">
            Track daily sales, stock arrivals, and closing balances.
            Know your exact profit shift-by-shift with zero guesswork.
          </p>

          <div className="animate-reveal delay-2 mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => {
                setAuthRedirect("/dashboard");
                setAuthOpen(true);
              }}
              className="btn-shadow group flex items-center justify-center gap-2 w-full rounded-full bg-linear-to-r from-[#047857] to-[#10b981] px-8 py-4 text-lg font-bold text-white transition-all sm:w-auto"
            >
              Start Shift
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>

          {/* Mini Dashboard Preview */}
          <div className="group relative mx-auto max-w-5xl px-4 sm:px-6" style={{ perspective: "1200px" }}>
            {/* Decorative Glow Background */}
            <div className="absolute -inset-10 rounded-[3rem] bg-gradient-to-r from-emerald-300/30 via-teal-200/20 to-emerald-300/30 opacity-60 blur-3xl transition-opacity group-hover:opacity-80"></div>

            <div className="animate-float3d relative rounded-3xl border border-white/60 bg-white/70 p-2 shadow-[0_20px_50px_rgba(4,120,87,0.15)] backdrop-blur-xl transition-all duration-700">
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-6 md:p-8 shadow-inner">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
                  {[
                    { label: "Today's Revenue", val: "₹18,400", c: "text-[#047857]", icon: "📈", bg: "bg-emerald-50" },
                    { label: "Today's Profit", val: "₹4,200", c: "text-teal-600", icon: "💰", bg: "bg-teal-50" },
                    { label: "Units Sold", val: "240", c: "text-emerald-600", icon: "📦", bg: "bg-emerald-50" },
                    { label: "Low Stock", val: "3", c: "text-rose-500", icon: "⚠️", bg: "bg-rose-50" },
                  ].map((s, i) => (
                    <div
                      key={s.label}
                      className="group/card relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-emerald-900/5"
                      style={{ transitionDelay: `${i * 50}ms` }}
                    >
                      <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl ${s.bg} text-2xl transition-transform group-hover/card:scale-110 group-hover/card:rotate-3`}>
                        {s.icon}
                      </div>
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
                      <p className={`text-2xl font-black tracking-tight sm:text-3xl ${s.c}`}>{s.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="animate-reveal delay-2 mt-16 flex flex-wrap items-center justify-center gap-3 opacity-40 grayscale contrast-125 sm:mt-20 sm:gap-4 md:gap-8">
            <p className="mb-4 w-full text-center text-xs font-bold uppercase tracking-widest text-slate-400">Perfect for</p>
            <span className="rounded-full border border-slate-200 bg-white/50 px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm backdrop-blur-sm sm:text-base">Kirana Stores</span>
            <span className="rounded-full border border-slate-200 bg-white/50 px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm backdrop-blur-sm sm:text-base">Medical Shops</span>
            <span className="rounded-full border border-slate-200 bg-white/50 px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm backdrop-blur-sm sm:text-base">Bakeries</span>
            <span className="rounded-full border border-slate-200 bg-white/50 px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm backdrop-blur-sm sm:text-base">Electronic Stores</span>
          </div>
        </div>
      </section>

      {/* Features Premium */}
      <section id="features" className="relative border-t border-slate-200/50 bg-white py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white pointer-events-none"></div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Everything you need to run your shop.</h2>
            <p className="mt-4 text-lg text-slate-500">Simple, secure, and fast. Built specifically for retail owners.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Instant Profit",
                desc: "No more manual calculators. Just enter closing stock and see your profit immediately.",
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />,
                color: "from-emerald-400 to-teal-500",
                shadow: "shadow-emerald-200",
              },
              {
                title: "Stock Alerts",
                desc: "Get notified when your best-selling products are about to finish. Never miss a sale.",
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8l-9-4-9 4 9 4 9-4zM3 12l9 4 9-4M3 16l9 4 9-4" />,
                color: "from-blue-400 to-indigo-500",
                shadow: "shadow-blue-200",
              },
              {
                title: "Safe & Secure",
                desc: "Your data is encrypted and backed up daily. Access your shop records from anywhere.",
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
                color: "from-violet-400 to-purple-500",
                shadow: "shadow-violet-200",
              },
            ].map((f) => (
              <div key={f.title} className="group relative rounded-3xl border border-slate-100 bg-white p-8 shadow-lg shadow-slate-100/50 transition-all hover:-translate-y-2 hover:shadow-xl hover:border-emerald-100">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white to-slate-50/50 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none"></div>
                <div className="relative">
                  <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color} text-white shadow-lg ${f.shadow} transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6">
                      {f.icon}
                    </svg>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-slate-900">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="border-t border-slate-200 px-4 py-10 sm:px-6 sm:py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[#1D9E75] rounded-lg flex items-center justify-center shadow-sm group-hover:rotate-3 transition-transform">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-5 h-5">
                <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 9l-5 5-3-3-4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tighter text-[#0f172a]">DailySales</span>
          </Link>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
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