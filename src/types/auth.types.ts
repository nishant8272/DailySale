export type Role = "owner" | "worker";

export type AuthProvider = "password" | "google";

export type AuthUser = {
  _id: string;
  shop_id: string;
  name: string;
  email?: string;
  phone: string;
  role: Role;
  auth_provider: AuthProvider;
};

export type ContinueGoogleResponse =
  | {
      needsOnboarding: true;
      profile: { name: string; email: string; picture?: string };
    }
  | {
      needsOnboarding: false;
      message: string;
      user: AuthUser;
    };

export type OnboardingFormState = {
  name: string;
  phone: string;
  role: Role;
  shop_id: string;
  shop_name: string;
  shop_address: string;
  timezone: string;
};
