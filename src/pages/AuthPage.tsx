import { useState, type FormEvent } from "react";
import { GoogleSigninButton } from "../components/GoogleSigninButton";
import { OnboardingForm } from "../components/OnboardingForm";
import { UserSummaryCard } from "../components/UserSummaryCard";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { fetchMyProfileApi } from "../services/user.service";
import { loginWithPasswordApi } from "../services/auth.service";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

type AuthPageProps = {
  mode?: "page" | "modal";
  onClose?: () => void;
  redirectTo?: "/dashboard" | "/shift";
};

export function AuthPage({ mode = "page", onClose, redirectTo = "/dashboard" }: AuthPageProps) {
  const { user, setUser, setShop } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [loginForm, setLoginForm] = useState({
    identifier: "",
    password: "",
  });

  const {
    statusText,
    errorText,
    googleToken,
    signedUser,
    needsOnboarding,
    loading,
    formState,
    setError,
    setFormState,
    continueWithGoogle,
    submitOnboarding,
  } = useGoogleAuth();
  const navigate = useNavigate();
  const isModal = mode === "modal";

  const goNext = (loggedUser?: any) => {
    if (isModal && onClose) onClose();
    const currentUser = loggedUser || user;
    if (currentUser?.role === "super_admin") {
      navigate("/super-admin");
    } else {
      navigate(redirectTo);
    }
  };

  const handlePasswordLogin = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const isEmail = loginForm.identifier.includes("@");
      const payload: any = {
        password: loginForm.password,
      };

      if (isEmail) {
        payload.email = loginForm.identifier;
      } else {
        payload.phone = loginForm.identifier;
      }

      const result = await loginWithPasswordApi(payload);
      
      localStorage.setItem("token", result.token);
      
      const profile = await fetchMyProfileApi();
      setUser(profile.user);
      setShop(profile.shop);
      
      toast.success("Welcome back!");
      goNext();
    } catch (error: any) {
      console.error("Password login error", error);
      setError(error.message || "Invalid credentials. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOnboardingSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    const completed = await submitOnboarding();
    if (completed) {
      goNext();
    }
  };

  return (
    <div className={`${isModal ? "font-sans text-slate-900" : "min-h-screen bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6 font-sans text-slate-900"}`}>
      {!isModal && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-20%] w-[50%] h-[50%] rounded-full bg-emerald-100/50 blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-100/40 blur-[100px]"></div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-reveal { animation: fadeInUp 0.6s ease-out forwards; }
        .google-btn-container { animation: fadeInUp 0.6s ease-out 0.2s forwards; opacity: 0; }
      `}</style>

      {/* Logo & Headline Section */}
      <div className={`animate-reveal flex flex-col items-center text-center w-full ${isModal ? "mb-6 sm:mb-8" : "mb-12"}`}>
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-5 shadow-xl shadow-emerald-500/20 transition-transform duration-500 hover:scale-105 hover:rotate-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-8 h-8">
            <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18.5 9l-5 5-3-3-4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">
          Daily<span className="text-emerald-600">Sales</span>
        </h1>
        <p className="text-slate-500 font-medium text-sm">
          Apni dukaan ka hisaab, <span className="text-emerald-600 font-bold underline decoration-emerald-200 underline-offset-4">ek jagah pe</span>
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="group relative w-full max-w-md mx-auto">
        {!isModal && (
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400/20 to-teal-500/20 rounded-[2.5rem] blur-2xl opacity-60"></div>
        )}

        <div className={`relative w-full rounded-[2rem] p-6 sm:p-10 transition-all duration-500 ${isModal ? "bg-transparent border-0 shadow-none p-0 sm:p-2" : "bg-white/90 backdrop-blur-xl border border-white shadow-2xl shadow-emerald-900/5 hover:shadow-emerald-900/10"}`}>
        {!signedUser && !needsOnboarding ? (
          <div className="flex flex-col items-center">
            <div className="mb-8 text-center">
              <h2 className="text-xl font-bold text-slate-800 mb-1">Welcome Back</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sign in to manage your shop</p>
            </div>

            {/* Error Banner */}
            {errorText && (
              <div className="mb-6 w-full p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-700 text-sm shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 mt-0.5 shrink-0 text-rose-500">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="font-medium">{errorText}</span>
              </div>
            )}

            {/* Strict width container for form and buttons */}
            <div className="w-full max-w-[320px] flex flex-col gap-6 mx-auto">
              
              {/* Password Login Form */}
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email or Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter email or phone..."
                    value={loginForm.identifier}
                    onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter password..."
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:scale-95 transition-all text-sm flex items-center justify-center"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              <div className="relative flex items-center justify-center">
                <div className="absolute w-full border-t border-slate-200"></div>
                <div className="relative bg-white px-4 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  Or sign in with
                </div>
              </div>
              
              <div className="relative flex justify-center w-full min-h-[44px] google-btn-container">
                {loading && (
                  <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                    <svg className="animate-spin h-6 w-6 text-emerald-500" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                )}
                <div className="w-full max-w-full flex justify-center overflow-visible">
                  <GoogleSigninButton
                    clientId={GOOGLE_CLIENT_ID}
                    onCredential={async (credential) => {
                      const isSignedIn = await continueWithGoogle(credential);
                      if (isSignedIn) {
                        goNext();
                      }
                    }}
                    onError={setError}
                  />
                </div>
              </div>
            </div>

            <p className="mt-8 text-center text-[11px] text-slate-400 italic font-medium">
              {statusText}
            </p>
          </div>
        ) : null}

        {/* Onboarding Form State */}
        {needsOnboarding && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="mb-8 text-center">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Shop Details</h3>
              <p className="text-sm text-slate-500 font-medium">Complete your shop setup to start tracking.</p>
            </div>
            <OnboardingForm
              value={formState}
              loading={loading}
              hasGoogleToken={Boolean(googleToken)}
              onChange={setFormState}
              onSubmit={handleOnboardingSubmit}
            />
          </div>
        )}

        {/* User Summary State */}
        {signedUser && !needsOnboarding && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <UserSummaryCard user={signedUser} />
            <button
              type="button"
              onClick={() => goNext()}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white shadow-lg transition-all hover:bg-emerald-600 hover:shadow-emerald-200 active:scale-95"
            >
              Go to Dashboard
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Footer */}
      {!isModal && (
      <div className="mt-12 flex flex-col items-center gap-3">
         <p className="text-[11px] text-slate-400 font-bold tracking-widest uppercase">
          Secure & Private • Made for Bharat
        </p>
        <p className="text-[10px] text-slate-400/80 text-center max-w-xs font-medium">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
      )}
    </div>
  );
}