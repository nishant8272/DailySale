import { useCallback, useState } from "react";
import { continueWithGoogleApi, onboardGoogleUserApi} from "../services/auth.service";
import type { AuthUser, OnboardingFormState } from "../types/auth.types";
import { useAuth } from "../context/AuthContext";
import { fetchMyProfileApi } from "../services/user.service";

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
  const { setUser, setShop } = useAuth();
  const [statusText, setStatusText] = useState("Waiting for Google sign-in...");
  const [errorText, setErrorText] = useState("");
  const [googleToken, setGoogleToken] = useState("");
  const [signedUser, setSignedUser] = useState<AuthUser | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formState, setFormState] = useState<OnboardingFormState>(defaultFormState);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setSignedUser(null);
    setUser(null);
    setShop(null);
    window.location.href = "/";
  }, [setShop, setUser]);

  const setError = useCallback((message: string) => {
    console.log(message)
    setErrorText(message);
  }, []);

  const continueWithGoogle = useCallback(async (idToken: string): Promise<boolean> => {
    setLoading(true);
    setErrorText("");

    try {
      const payload:any = await continueWithGoogleApi(idToken);
      setGoogleToken(idToken);

      if (payload.needsOnboarding) {
        setNeedsOnboarding(true);
        setStatusText("Complete onboarding to finish account setup");
        setFormState((prev) => ({
          ...prev,
          name: payload.profile.name || prev.name,
        }));
        return false;
      }

      localStorage.setItem("token", payload.token);

      const profile = await fetchMyProfileApi();
      setUser(profile.user);
      setShop(profile.shop);

      setSignedUser(profile.user);
      setNeedsOnboarding(false);
      setStatusText("Google sign-in successful");
      return true;
    } catch (error) {
      console.log(error)
      setErrorText(error instanceof Error ? error.message : "Google sign-in failed");
      return false;
    } finally {
      setLoading(false);
    }
  }, [setShop, setUser]);

  const submitOnboarding = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setErrorText("");

    try {
      await onboardGoogleUserApi(googleToken, formState);
      const loginPayload = await continueWithGoogleApi(googleToken);

      if (loginPayload.needsOnboarding) {
        throw new Error("Onboarding is still incomplete");
      }

      localStorage.setItem("token", loginPayload.token);

      const profile = await fetchMyProfileApi();
      setUser(profile.user);
      setShop(profile.shop);

      setSignedUser(profile.user);
      setNeedsOnboarding(false);
      setStatusText("Onboarding complete. You are now signed in.");
      return true;
    } catch (error) {
      console.log(error)
      setErrorText(error instanceof Error ? error.message : "Onboarding failed");
      return false;
    } finally {
      setLoading(false);
    }
  }, [formState, googleToken, setShop, setUser]);

  return {
    statusText,
    logout,
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
