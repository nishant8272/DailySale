export type Role = "owner" | "worker";
export type AuthProvider = "password" | "google";

export type Shop = {
  _id: string;
  name: string;
  owner_name: string;
  address?: string;
};

export type AuthUser = {
  _id: string;
  shop_id?: string;
  name: string;
  email?: string;
  phone: string;
  role: Role;
  auth_provider?: AuthProvider;
  is_active?: boolean;
  last_login?: string;
  created_at?: string;
};

export type ContinueGoogleResponse =
  | {
      needsOnboarding: true;
      profile: { name: string; email: string; picture?: string };
    }
  | {
      needsOnboarding: false;
      message: string;
      token: string;
      user: AuthUser;
      shop?: Shop;
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