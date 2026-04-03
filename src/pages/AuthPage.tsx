import { type FormEvent } from "react";
import { GoogleSigninButton } from "../components/GoogleSigninButton";
import { OnboardingForm } from "../components/OnboardingForm";
import { UserSummaryCard } from "../components/UserSummaryCard";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

type AuthPageProps = {
  mode?: "page" | "modal";
  onClose?: () => void;
  redirectTo?: "/dashboard" | "/shift";
};

export function AuthPage({ mode = "page", onClose, redirectTo = "/dashboard" }: AuthPageProps) {
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

  const goNext = () => {
    if (isModal && onClose) onClose();
    navigate(redirectTo);
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
    <div className={`${isModal ? "font-sans text-[#0f172a]" : "min-h-screen bg-[#f8fafc] relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6 font-sans text-[#0f172a]"}`}>
      {!isModal && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-20%] w-[50%] h-[50%] rounded-full bg-green-100/50 blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/40 blur-[100px]"></div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-reveal {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .google-btn-container {
          animation: fadeInUp 0.6s ease-out 0.2s forwards;
          opacity: 0;
        }
      `}</style>

      {/* Logo & Headline Section */}
      <div className={`animate-reveal flex flex-col items-center text-center max-w-sm ${isModal ? "mb-6" : "mb-10"}`}>
        <div className="w-14 h-14 bg-[#1D9E75] rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-green-200 transition-transform duration-500 hover:scale-110">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-7 h-7">
            <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18.5 9l-5 5-3-3-4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-[#0f172a] mb-2">
          Daily<span className="text-[#1D9E75]">Sales</span>
        </h1>
        <p className="text-slate-500 font-medium text-sm px-6">
          Apni dukaan ka hisaab, <span className="text-[#1D9E75] font-bold underline decoration-green-200 underline-offset-4">ek jagah pe</span>
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="group relative w-full max-w-105">
        {!isModal && (
          <div className="absolute -inset-1 bg-linear-to-r from-green-400/20 to-blue-500/20 rounded-4xl blur-2xl opacity-50"></div>
        )}

        <div className={`relative w-full rounded-4xl p-6 sm:p-10 transition-all duration-500 ${isModal ? "bg-transparent border-0 shadow-none" : "bg-white/80 backdrop-blur-xl border border-white shadow-2xl shadow-green-900/5 hover:shadow-green-900/10"}`}>
        {!signedUser && !needsOnboarding ? (
          <>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#64748b] mb-6 text-center">
              Sign in as shop owner
            </span>

            {/* Error Banner */}
            {errorText && (
              <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-700 text-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="wrap-break-word">{errorText}</span>
              </div>
            )}

            {/* Google Sign-In Container */}
            {/* Added: overflow-x-hidden to prevent the iframe from breaking layout on tiny screens */}
            <div className="relative flex justify-center w-full min-h-11 google-btn-container">
              {loading && (
                <div className="absolute inset-0 z-10 bg-white/60 flex items-center justify-center rounded-xl">
                  <svg className="animate-spin h-5 w-5 text-[#1D9E75]" viewBox="0 0 24 24">
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

            <p className="mt-3 text-center text-[11px] sm:text-xs text-[#64748b] italic leading-relaxed">
              {statusText}
            </p>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#e2e8f0]"></div>
              </div>
              <div className="relative flex justify-center text-[9px] sm:text-[10px] uppercase">
                <span className="bg-white px-2 sm:px-3 text-[#94a3b8] font-bold tracking-tight">
                  Workers log in separately
                </span>
              </div>
            </div>

            {/* Worker Login Button */}
            <button
              type="button"
              onClick={() => toast("Worker Login: Coming soon!")}
              className="w-full py-4 px-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-500 text-sm flex items-center justify-center gap-3 hover:bg-white hover:border-green-200 hover:text-[#1D9E75] hover:shadow-md active:scale-[0.98] transition-all duration-300"
            >
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-lg">📱</span>
              </div>
              <span>Worker login with Phone</span>
            </button>
          </>
        ) : null}

        {/* Onboarding Form State */}
        {needsOnboarding && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="text-lg font-bold mb-1">Dukaan ki details bharein</h3>
            <p className="text-sm text-[#64748b] mb-6 leading-snug">Complete your shop setup to start tracking.</p>
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
          <>
            <UserSummaryCard user={signedUser} />
            <button
              type="button"
              onClick={goNext}
              className="mt-4 h-11 w-full rounded-lg bg-slate-900 font-medium text-white transition hover:bg-slate-800"
            >
              Go to Dashboard
            </button>
          </>
        )}
        </div>
      </div>

      {/* Footer */}
      {!isModal && (
      <div className="mt-8 flex flex-col items-center gap-2">
         <p className="text-[10px] sm:text-[11px] text-[#94a3b8] font-medium tracking-wide uppercase">
          Secure & Private • Made for Bharat
        </p>
        <p className="text-[10px] text-[#cbd5e1] text-center px-4">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
      )}
    </div>
  );
}