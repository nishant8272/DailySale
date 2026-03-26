import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";

interface NavLink {
  label: string;
  href: string;
}

interface HeroBlobProps {
  x: string;
  y: string;
  color: string;
  size: string;
}

interface StatCardProps {
  icon: string;
  value: string;
  label: string;
}

interface HowItWorksItem {
  step: string;
  title: string;
  desc: string;
}

const NAV_LINKS: NavLink[] = [
  { label: "Dashboard", href: "#dashboard" },
  { label: "Stock Entry", href: "#stock-entry" },
  { label: "History", href: "#history" },
];

function Navbar(): React.ReactElement {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2.5rem",
        height: "64px",
        background: scrolled ? "rgba(255,252,245,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(10px)" : "none",
        borderBottom: scrolled ? "1px solid #e5dfc8" : "1px solid transparent",
        transition: "all 0.3s ease",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#1a1a1a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "#f5f0e8", fontSize: 16 }}>📦</span>
        </div>
        <span
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1.3rem",
            fontWeight: 700,
            color: "#1a1a1a",
            letterSpacing: "-0.02em",
          }}
        >
          StockShift
        </span>
      </div>

      {/* Desktop Nav */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2.5rem",
        }}
        className="desktop-nav"
      >
        {NAV_LINKS.map((link: NavLink) => (
          <a
            key={link.label}
            href={link.href}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.95rem",
              color: "#444",
              textDecoration: "none",
              fontWeight: 400,
              letterSpacing: "0.01em",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) =>
              ((e.target as HTMLAnchorElement).style.color = "#1a1a1a")
            }
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) =>
              ((e.target as HTMLAnchorElement).style.color = "#444")
            }
          >
            {link.label}
          </a>
        ))}

        {/* ✅ FIXED: Navbar Start Shift */}
        <a
          onClick={() => navigate("/auth")}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.9rem",
            fontWeight: 500,
            color: "#f5f0e8",
            background: "#1a1a1a",
            padding: "0.5rem 1.2rem",
            borderRadius: "100px",
            textDecoration: "none",
            transition: "background 0.2s, transform 0.15s",
            display: "inline-block",
            cursor: "pointer",
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
            const el = e.target as HTMLAnchorElement;
            el.style.background = "#3a3a3a";
            el.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
            const el = e.target as HTMLAnchorElement;
            el.style.background = "#1a1a1a";
            el.style.transform = "translateY(0)";
          }}
        >
          Start Shift →
        </a>
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          display: "none",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "1.5rem",
        }}
        className="hamburger"
        aria-label="Toggle menu"
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          style={{
            position: "absolute",
            top: "64px",
            left: 0,
            right: 0,
            background: "#fffcf5",
            borderBottom: "1px solid #e5dfc8",
            padding: "1rem 2.5rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {NAV_LINKS.map((link: NavLink) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "1rem",
                color: "#1a1a1a",
                textDecoration: "none",
              }}
            >
              {link.label}
            </a>
          ))}
          {/* ✅ FIXED: Mobile Start Shift */}
          <a
            onClick={() => { setMenuOpen(false); navigate("/auth"); }}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.95rem",
              fontWeight: 500,
              color: "#f5f0e8",
              background: "#1a1a1a",
              padding: "0.6rem 1.2rem",
              borderRadius: "100px",
              textDecoration: "none",
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            Start Shift →
          </a>
        </div>
      )}
    </nav>
  );
}

function HeroBlob({ x, y, color, size }: HeroBlobProps): React.ReactElement {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "60% 40% 70% 30% / 50% 60% 40% 50%",
        background: color,
        opacity: 0.18,
        filter: "blur(40px)",
        pointerEvents: "none",
      }}
    />
  );
}

function StatCard({ icon, value, label }: StatCardProps): React.ReactElement {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5dfc8",
        borderRadius: "16px",
        padding: "1.4rem 1.8rem",
        minWidth: 160,
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(-4px)";
        el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)";
      }}
    >
      <div style={{ fontSize: "1.6rem", marginBottom: "0.4rem" }}>{icon}</div>
      <div
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "1.8rem",
          fontWeight: 700,
          color: "#1a1a1a",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.8rem",
          color: "#888",
          marginTop: "0.3rem",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function LandingPage(): React.ReactElement {
  const navigate = useNavigate();
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const howItWorksItems: HowItWorksItem[] = [
    {
      step: "01",
      title: "Start Shift",
      desc: "Yesterday's closing stock auto-loads as opening stock.",
    },
    {
      step: "02",
      title: "Log New Stock",
      desc: "New delivery arrives? Enter quantity & buy price. Active price updates.",
    },
    {
      step: "03",
      title: "End Shift",
      desc: "Enter closing stock. Units sold, revenue & profit calculated instantly.",
    },
    {
      step: "04",
      title: "Entry Frozen",
      desc: "Today's data locks in. Tomorrow carries forward automatically.",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fffcf5; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .hero-title { animation: fadeUp 0.7s ease both; }
        .hero-sub   { animation: fadeUp 0.7s ease 0.15s both; }
        .hero-ctas  { animation: fadeUp 0.7s ease 0.28s both; }
        .hero-cards { animation: fadeUp 0.7s ease 0.42s both; }

        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger   { display: block !important; }
          .hero-section { padding: 6rem 1.5rem 3rem !important; }
          .hero-title { font-size: 2.8rem !important; }
          .stat-cards { flex-wrap: wrap !important; }
        }
      `}</style>

      <div style={{ background: "#fffcf5", minHeight: "100vh" }}>
        <Navbar />

        {/* Hero Section */}
        <section
          className="hero-section"
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "9rem 2.5rem 5rem",
            maxWidth: 1100,
            margin: "0 auto",
          }}
        >
          <HeroBlob x="60%" y="0%" color="#4caf50" size="420px" />
          <HeroBlob x="-5%" y="30%" color="#ffc107" size="300px" />
          <HeroBlob x="75%" y="50%" color="#2196f3" size="280px" />

          <div style={{ position: "relative", zIndex: 1, maxWidth: 680 }}>
            <p
              className="hero-sub"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.85rem",
                fontWeight: 500,
                color: "#888",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "1rem",
              }}
            >
              Daily Stock Management
            </p>

            <h1
              className="hero-title"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "4.2rem",
                fontWeight: 800,
                color: "#1a1a1a",
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                marginBottom: "1.5rem",
              }}
            >
              Track stock.
              <br />
              <span style={{ color: "#2d7a35" }}>Know your profit.</span>
              <br />
              Every shift.
            </h1>

            <p
              className="hero-sub"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "1.1rem",
                color: "#555",
                lineHeight: 1.7,
                maxWidth: 480,
                marginBottom: "2.2rem",
              }}
            >
              Open shift, log stock arrivals, close the day — and instantly see
              units sold, revenue & profit. Zero confusion, zero guesswork.
            </p>

            <div
              className="hero-ctas"
              style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
            >
              {/* ✅ FIXED: Hero Start Today's Shift */}
              <a
                onClick={() => navigate("/auth")}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "1rem",
                  fontWeight: 500,
                  color: "#fffcf5",
                  background: "#1a1a1a",
                  padding: "0.75rem 1.8rem",
                  borderRadius: "100px",
                  textDecoration: "none",
                  display: "inline-block",
                  transition: "transform 0.2s, background 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  const el = e.target as HTMLAnchorElement;
                  el.style.transform = "translateY(-2px)";
                  el.style.background = "#2d7a35";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  const el = e.target as HTMLAnchorElement;
                  el.style.transform = "translateY(0)";
                  el.style.background = "#1a1a1a";
                }}
              >
                Start Today's Shift
              </a>
              <a
                href="#history"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "1rem",
                  color: "#1a1a1a",
                  padding: "0.75rem 1.8rem",
                  borderRadius: "100px",
                  textDecoration: "none",
                  border: "1.5px solid #ccc",
                  display: "inline-block",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) =>
                  ((e.target as HTMLAnchorElement).style.borderColor = "#1a1a1a")
                }
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) =>
                  ((e.target as HTMLAnchorElement).style.borderColor = "#ccc")
                }
              >
                View History
              </a>
            </div>
          </div>

          {/* Stat cards */}
          <div
            className="hero-cards stat-cards"
            style={{
              display: "flex",
              gap: "1rem",
              marginTop: "3.5rem",
              flexWrap: "wrap",
            }}
          >
            <StatCard icon="📦" value="240" label="Units Tracked Today" />
            <StatCard icon="💰" value="₹18,400" label="Today's Revenue" />
            <StatCard icon="📈" value="₹4,200" label="Today's Profit" />
            <StatCard icon="🔒" value="3" label="Shifts Closed" />
          </div>
        </section>

        {/* Divider */}
        <div
          style={{
            borderTop: "1px solid #e5dfc8",
            maxWidth: 1100,
            margin: "0 auto 3rem",
          }}
        />

        {/* How it works */}
        <section
          style={{
            maxWidth: 1100,
            margin: "0 auto 5rem",
            padding: "0 2.5rem",
          }}
        >
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.8rem",
              color: "#aaa",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "2rem",
            }}
          >
            How it works
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {howItWorksItems.map((item: HowItWorksItem) => (
              <div key={item.step}>
                <div
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "2rem",
                    fontWeight: 700,
                    color: "#e8e2d0",
                    marginBottom: "0.5rem",
                  }}
                >
                  {item.step}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "1rem",
                    fontWeight: 500,
                    color: "#1a1a1a",
                    marginBottom: "0.4rem",
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.9rem",
                    color: "#777",
                    lineHeight: 1.6,
                  }}
                >
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            borderTop: "1px solid #e5dfc8",
            padding: "1.5rem 2.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: 1100,
            margin: "0 auto",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <span
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#1a1a1a",
            }}
          >
            StockShift
          </span>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.8rem",
              color: "#aaa",
            }}
          >
            Daily stock tracking, simplified.
          </span>
        </footer>
      </div>
    </>
  );
}
