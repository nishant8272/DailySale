import { useCallback, useState } from "react";
import {
  continueWithGoogleApi,
  onboardGoogleUserApi,
} from "../services/auth.service";
import type {
  AuthUser,
  OnboardingFormState,
  ContinueGoogleResponse,
} from "../types/auth.types";

const defaultFormState: OnboardingFormState = {
  name: "",
  phone: "",
  role: "owner",
  shop_id: "",
  shop_name: "",
  shop_address: "",
  timezone: "Asia/Kolkata",
};

export function useGoogleAuth() {
  const [statusText, setStatusText] = useState("Waiting for Google sign-in...");
  const [errorText, setErrorText] = useState("");
  const [googleToken, setGoogleToken] = useState("");
  const [signedUser, setSignedUser] = useState<AuthUser | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formState, setFormState] = useState<OnboardingFormState>(defaultFormState);

  const setError = useCallback((message: string) => {
    setErrorText(message);
  }, []);

  const continueWithGoogle = useCallback(async (idToken: string) => {
    setLoading(true);
    setErrorText("");

    try {
      const payload: ContinueGoogleResponse = await continueWithGoogleApi(idToken);
      setGoogleToken(idToken);

      if (payload.needsOnboarding) {
        setNeedsOnboarding(true);
        setStatusText("Complete onboarding to finish account setup");
        setFormState((prev) => ({
          ...prev,
          name: payload.profile.name || prev.name,
        }));
        return;
      }

      setSignedUser(payload.user);
      setNeedsOnboarding(false);
      setStatusText("Google sign-in successful");
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const submitOnboarding = useCallback(async () => {
    setLoading(true);
    setErrorText("");

    try {
      const user = await onboardGoogleUserApi(googleToken, formState);
      setSignedUser(user);
      setNeedsOnboarding(false);
      setStatusText("Onboarding complete. You are now signed in.");
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Onboarding failed");
    } finally {
      setLoading(false);
    }
  }, [formState, googleToken]);

  return {
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
  };
}
