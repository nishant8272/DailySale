import type { ChangeEvent, FormEvent } from "react";
import type { OnboardingFormState, Role } from "../types/auth.types";

type OnboardingFormProps = {
  value: OnboardingFormState;
  loading: boolean;
  hasGoogleToken: boolean;
  onChange: (next: OnboardingFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function OnboardingForm({
  value,
  loading,
  hasGoogleToken,
  onChange,
  onSubmit,
}: OnboardingFormProps) {
  const updateField =
    (field: keyof OnboardingFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onChange({
        ...value,
        [field]: event.target.value,
      });
    };

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-5"
    >
      <h2 className="text-left text-lg font-semibold text-slate-900">Complete your profile</h2>

      <label className="grid gap-1 text-left text-sm text-slate-700">
        Full Name
        <input
          required
          value={value.name}
          onChange={updateField("name")}
          className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-slate-200 transition focus:ring"
        />
      </label>

      <label className="grid gap-1 text-left text-sm text-slate-700">
        Phone
        <input
          required
          value={value.phone}
          onChange={updateField("phone")}
          className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-slate-200 transition focus:ring"
        />
      </label>

      <label className="grid gap-1 text-left text-sm text-slate-700">
        Role
        <select
          value={value.role}
          onChange={(event) =>
            onChange({
              ...value,
              role: event.target.value as Role,
            })
          }
          className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-slate-200 transition focus:ring"
        >
          <option value="owner">Owner</option>
          <option value="worker">Worker</option>
        </select>
      </label>

      {value.role === "worker" ? (
        <label className="grid gap-1 text-left text-sm text-slate-700">
          Shop ID
          <input
            required
            value={value.shop_id}
            onChange={updateField("shop_id")}
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-slate-200 transition focus:ring"
          />
        </label>
      ) : (
        <>
          <label className="grid gap-1 text-left text-sm text-slate-700">
            Shop Name
            <input
              required
              value={value.shop_name}
              onChange={updateField("shop_name")}
              className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-slate-200 transition focus:ring"
            />
          </label>

          <label className="grid gap-1 text-left text-sm text-slate-700">
            Shop Address
            <input
              value={value.shop_address}
              onChange={updateField("shop_address")}
              className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-slate-200 transition focus:ring"
            />
          </label>

          <label className="grid gap-1 text-left text-sm text-slate-700">
            Timezone
            <input
              value={value.timezone}
              onChange={updateField("timezone")}
              className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-slate-200 transition focus:ring"
            />
          </label>
        </>
      )}

      <button
        type="submit"
        disabled={loading || !hasGoogleToken}
        className="mt-2 h-11 rounded-lg bg-slate-900 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Finish Onboarding"}
      </button>
    </form>
  );
}
