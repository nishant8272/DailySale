import type {
  AuthUser,
  ContinueGoogleResponse,
  OnboardingFormState,
} from "../types/auth.types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const continueWithGoogleApi = async (
  idToken: string
): Promise<ContinueGoogleResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/google/continue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = await response.json();
  console.log(data.token)
  localStorage.setItem('token', data.token);
  
  const payload = (data) as ContinueGoogleResponse & {
    message?: string;
  };

  if (!response.ok) {
    console.log("payloadmessage", payload.message)
    throw new Error(payload.message || "Google login failed");
  }

  return payload;
};

export const onboardGoogleUserApi = async (
  idToken: string,
  formState: OnboardingFormState
): Promise<AuthUser> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/google/onboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, ...formState }),
  });

  const payload = (await response.json()) as {
    message?: string;
    user?: AuthUser;
  };

  if (!response.ok || !payload.user) {
    throw new Error(payload.message || "Onboarding failed");
  }

  return payload.user;
};
