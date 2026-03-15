import type { AuthUser } from "../types/auth.types";

type UserSummaryCardProps = {
  user: AuthUser;
};

export function UserSummaryCard({ user }: UserSummaryCardProps) {
  return (
    <article className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-left text-slate-700">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Welcome, {user.name}</h2>
      <p className="text-sm">Email: {user.email || "N/A"}</p>
      <p className="text-sm">Phone: {user.phone}</p>
      <p className="text-sm">Role: {user.role}</p>
      <p className="text-sm">Shop ID: {user.shop_id}</p>
      <p className="text-sm">Sign-in provider: {user.auth_provider}</p>
    </article>
  );
}
