  import React, { createContext, useContext, useState, useEffect } from "react";
  import type { Shop, AuthUser } from "../types/auth.types";
  import { fetchMyProfileApi } from "../services/user.service";

  interface AuthContextType {
    user: AuthUser | null;
    shop: Shop | null;
    loading: boolean;
    logout: () => void;
    setUser: (user: AuthUser | null) => void;
    setShop: (shop: Shop | null) => void;
  }

  const AuthContext = createContext<AuthContextType | undefined>(undefined);

  export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [shop, setShop] = useState<Shop | null>(null);
    const [loading, setLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
      const initAuth = async () => {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const profile = await fetchMyProfileApi();
            setUser(profile.user);
            setShop(profile.shop);
          } catch (err) {
            const status = (err as { status?: number })?.status;

            // Only clear session for real auth failures.
            if (status === 401 || status === 403) {
              localStorage.removeItem("token");
              setUser(null);
              setShop(null);
            } else {
              console.error("Auth bootstrap failed", err);
            }
          }
        }
        setLoading(false);
      };
      initAuth();
    }, []);

    const logout = () => {
      localStorage.removeItem("token");
      setUser(null);
      setShop(null);
      window.location.href = "/";
    };

    return (
      <AuthContext.Provider value={{ user, shop, loading, logout, setUser, setShop }}>
        {children}
      </AuthContext.Provider>
    );
  };

  export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
  };