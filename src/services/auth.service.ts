import axios from "axios";
import type {
  AuthUser,
  ContinueGoogleResponse,
  OnboardingFormState,
} from "../types/auth.types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const continueWithGoogleApi = async (
  idToken: string
): Promise<ContinueGoogleResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/google/continue`, {
      idToken,
    });

    const payload = response.data as ContinueGoogleResponse;
    return payload;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        (error.response?.data as { message?: string } | undefined)?.message ||
        "Google login failed";
      throw new Error(message);
    }
    throw new Error("Google login failed");
  }
};

export const onboardGoogleUserApi = async (
  idToken: string,
  formState: OnboardingFormState
): Promise<AuthUser> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/google/onboard`, {
      idToken,
      ...formState,
    });

    const payload = response.data as {
      message?: string;
      user?: AuthUser;
    };

    if (!payload.user) {
      throw new Error(payload.message || "Onboarding failed");
    }

    return payload.user;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        (error.response?.data as { message?: string } | undefined)?.message ||
        "Onboarding failed";
      throw new Error(message);
    }
    throw new Error("Onboarding failed");
  }
};
