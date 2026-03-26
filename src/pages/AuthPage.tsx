import { type FormEvent } from "react";
import { GoogleSigninButton } from "../components/GoogleSigninButton";
import { OnboardingForm } from "../components/OnboardingForm";
import { UserSummaryCard } from "../components/UserSummaryCard";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { useNavigate } from "react-router-dom";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export function AuthPage() {
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

  const handleOnboardingSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    const completed = await submitOnboarding();
    if (completed) {
      navigate("/dashboard");
    }
  };

  return (
    // Changed: px-4 on mobile to prevent card from touching screen edges
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 sm:p-6 font-sans text-[#0f172a]">
      
      {/* Logo & Headline Section */}
      <div className="flex flex-col items-center mb-6 sm:mb-8 text-center max-w-sm">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1D9E75] rounded-xl flex items-center justify-center mb-4 shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-6 h-6 sm:w-7 sm:h-7">
            <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18.5 9l-5 5-3-3-4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D9E75] mb-2">
          DailySales
        </h1>
        <h2 className="text-lg sm:text-xl font-semibold px-2">
          Apni dukaan ka hisaab, <span className="text-[#1D9E75]">ek jagah pe</span>
        </h2>
        <p className="text-[#64748b] mt-1 text-xs sm:text-sm">
          Track daily sales, stock, and profit — shift by shift.
        </p>
      </div>

      {/* Main Auth Card */}
      {/* Changed: w-full and max-w-md for better scaling on different screens */}
      <div className="w-full max-w-105 bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 sm:p-8 transition-all">
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
            <div className="relative flex justify-center w-full min-h-11">
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
                      navigate("/dashboard");
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
              onClick={() => alert("Worker Login: Coming soon!")}
              className="w-full py-3 px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-medium text-[#64748b] text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-slate-100 active:scale-[0.98] transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>Worker login with phone</span>
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
          <UserSummaryCard user={signedUser} />
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 flex flex-col items-center gap-2">
         <p className="text-[10px] sm:text-[11px] text-[#94a3b8] font-medium tracking-wide uppercase">
          Secure & Private • Made for Bharat
        </p>
        <p className="text-[10px] text-[#cbd5e1] text-center px-4">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}