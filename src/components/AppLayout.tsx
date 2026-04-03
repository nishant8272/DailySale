import React, { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

interface NavItem {
    name: string;
    path: string;
    icon: React.ReactNode;
    ownerOnly?: boolean;
    showBadge?: boolean;
}

export function AppLayout() {
    const { user, shop, logout } = useAuth();
    const [alertCount, setAlertCount] = useState<number>(0);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    useEffect(() => {
        const fetchAlertCount = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
                const { data } = await axios.get(`${API_BASE_URL}/api/alerts/count`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setAlertCount(data.unread_count || data.count || 0);
            } catch (error) {
                console.error("Failed to fetch alert count", error);
            }
        };
        fetchAlertCount();
    }, []);

    const handleLogout = () => {
        logout();
    };

    const navItems: NavItem[] = [
        {
            name: "Dashboard",
            path: "/dashboard",
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
        },
        {
            name: "Products",
            path: "/products",
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M21 8l-9-4-9 4 9 4 9-4z" /><path d="M3 12l9 4 9-4" /><path d="M3 16l9 4 9-4" /></svg>
        },
        {
            name: "Daily Sheet",
            path: "/daily",
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
        },
        {
            name: "Reports",
            path: "/reports",
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>
        },
        {
            name: "Alerts",
            path: "/alerts",
            showBadge: true,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
        },
        {
            name: "Workers",
            path: "/workers",
            ownerOnly: true,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
        },
    ];

    return (
        <div className="flex flex-col h-screen bg-slate-250 font-sans text-slate-900">
            {/* Top Navbar */}
            <nav className="h-14 w-full bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-30">
                <div className="flex items-center gap-2">
                    <div className="w-6.5 h-6.5 bg-[#1D9E75] rounded flex items-center justify-center shadow-sm">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-4 h-4">
                            <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M18.5 9l-5 5-3-3-4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="font-bold text-lg tracking-tight text-[#1D9E75]">DailySales</span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Notification Bell */}
                    <div className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full cursor-pointer transition-colors">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        {alertCount > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
                        )}
                    </div>

                    {/* User Avatar & Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-sm hover:opacity-90 transition-opacity"
                        >
                            {user?.name?.charAt(0) || "U"}
                        </button>

                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                <div className="px-4 py-2 border-b border-slate-100">
                                    <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                                    <p className="text-sm font-semibold truncate">{user?.name}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className="w-60 bg-white border-right border-slate-200 flex-col justify-between shrink-0 hidden md:flex">
                    <div className="py-4 flex flex-col gap-1">
                        {navItems.map((item) => {
                            if (item.ownerOnly && user?.role !== "owner") return null;

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => `
                    flex items-center justify-between px-4 py-3 text-sm font-medium transition-all group
                    ${isActive
                                            ? "text-[#1D9E75] bg-green-50 border-l-[3px] border-[#1D9E75]"
                                            : "text-slate-500 hover:bg-slate-50 border-l-[3px] border-transparent"
                                        }
                  `}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="shrink-0">{item.icon}</span>
                                        {item.name}
                                    </div>
                                    {item.showBadge && alertCount > 0 && (
                                        <span className="bg-[#1D9E75] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                            {alertCount}
                                        </span>
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>

                    {/* Shop/User Info Footer */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                        <p className="text-sm font-bold truncate text-slate-800">{shop?.name || "My Shop"}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500 truncate max-w-25">{user?.name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                                {user?.role}
                            </span>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}