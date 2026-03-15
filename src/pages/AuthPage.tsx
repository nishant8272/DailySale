import type { FormEvent } from "react";
import { GoogleSigninButton } from "../components/GoogleSigninButton";
import { OnboardingForm } from "../components/OnboardingForm";
import { UserSummaryCard } from "../components/UserSummaryCard";
import { useGoogleAuth } from "../hooks/useGoogleAuth";

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

  const handleOnboardingSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    await submitOnboarding();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] px-4 py-6 font-sans sm:px-6">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">DailySales</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Continue with Google
        </h1>
        <p className="mt-2 text-sm text-slate-600">{statusText}</p>

        {errorText ? (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errorText}
          </p>
        ) : null}

        {!signedUser && !needsOnboarding ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            {loading ? <p className="mb-3 text-sm text-slate-600">Signing in...</p> : null}
            <GoogleSigninButton
              clientId={GOOGLE_CLIENT_ID}
              onCredential={(credential) => {
                void continueWithGoogle(credential);
              }}
              onError={setError}
            />
          </div>
        ) : null}

        {needsOnboarding ? (
          <OnboardingForm
            value={formState}
            loading={loading}
            hasGoogleToken={Boolean(googleToken)}
            onChange={setFormState}
            onSubmit={handleOnboardingSubmit}
          />
        ) : null}

        {signedUser ? <UserSummaryCard user={signedUser} /> : null}
      </section>
    </main>
  );
}
