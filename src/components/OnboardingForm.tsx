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
  const inputClassName =
    "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-slate-200 transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring";

  const labelClassName = "grid gap-1.5 text-left text-sm font-medium text-slate-700";

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
      className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-left text-lg font-semibold text-slate-900">Complete your profile</h2>
          <p className="mt-0.5 text-xs text-slate-500">These details help us set up your shop correctly.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={`${labelClassName} sm:col-span-1`}>
          Full Name
          <input
            required
            autoComplete="name"
            value={value.name}
            onChange={updateField("name")}
            placeholder="enter your full name"
            className={inputClassName}
          />
        </label>

        <label className={`${labelClassName} sm:col-span-1`}>
          Phone
          <input
            required
            type="tel"
            autoComplete="tel"
            value={value.phone}
            onChange={updateField("phone")}
            placeholder="enter your phone number"
            className={inputClassName}
          />
        </label>
      </div>

      <label className={labelClassName}>
        Role
        <select
          value={value.role}
          onChange={(event) =>
            onChange({
              ...value,
              role: event.target.value as Role,
            })
          }
          className={inputClassName}
        >
          <option value="owner">Owner</option>
          <option value="worker">Worker</option>
        </select>
      </label>

      {value.role === "worker" ? (
        <label className={labelClassName}>
          Shop ID
          <input
            required
            value={value.shop_id}
            onChange={updateField("shop_id")}
            placeholder="Enter your shop ID"
            className={inputClassName}
          />
        </label>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={`${labelClassName} sm:col-span-2`}>
            Shop Name
            <input
              required
              value={value.shop_name}
              onChange={updateField("shop_name")}
              placeholder="enter your shop name"
              className={inputClassName}
            />
          </label>

          <label className={`${labelClassName} sm:col-span-2`}>
            Shop Address
            <input
              value={value.shop_address}
              onChange={updateField("shop_address")}
              placeholder="Area, city"
              className={inputClassName}
            />
          </label>

          <label className={`${labelClassName} sm:col-span-2`}>
            Timezone
            <input
              value={value.timezone}
              onChange={updateField("timezone")}
              placeholder="e.g. Asia/Kolkata"
              className={inputClassName}
            />
          </label>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !hasGoogleToken}
        className="mt-1 h-11 rounded-lg bg-slate-900 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Finish Onboarding"}
      </button>
    </form>
  );
}
