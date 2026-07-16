import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMyProfileApi } from "../services/user.service";
import type { AuthUser } from "../types/auth.types";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/auth");
          return;
        }

        const profile = await fetchMyProfileApi();
        const user = profile.user as AuthUser;

        // If your app still needs onboarding, your existing frontend handles it
        // on /auth page; after callback we can simply route to /auth.
        // For now, go to dashboard.
        if (user) {
          navigate("/dashboard");
          return;
        }

        navigate("/auth");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Auth failed");
        navigate("/auth");
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-slate-700 font-semibold">Signing in...</div>
        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
      </div>
    </div>
  );
}

