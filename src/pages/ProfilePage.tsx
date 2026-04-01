import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createWorkerApi, fetchShopUsersApi, type CreateWorkerInput } from "../services/user.service";
import type { AuthUser } from "../types/auth.types";

type WorkerFormState = CreateWorkerInput;

const initialFormState: WorkerFormState = {
  name: "",
  phone: "",
  password: "",
  email: "",
};

export default function ProfilePage() {
  const { user, shop } = useAuth();
  const [workers, setWorkers] = useState<AuthUser[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [creatingWorker, setCreatingWorker] = useState(false);
  const [workersError, setWorkersError] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [formSuccess, setFormSuccess] = useState<string>("");
  const [formState, setFormState] = useState<WorkerFormState>(initialFormState);

  const isOwner = user?.role === "owner";

  const filteredWorkers = useMemo(
    () => workers.filter((shopUser) => shopUser.role === "worker"),
    [workers]
  );

  useEffect(() => {
    const loadWorkers = async () => {
      try {
        setLoadingWorkers(true);
        setWorkersError("");
        const list = await fetchShopUsersApi();
        setWorkers(list);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load workers";
        setWorkersError(message);
      } finally {
        setLoadingWorkers(false);
      }
    };

    void loadWorkers();
  }, []);

  const onInputChange = (field: keyof WorkerFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const onCreateWorker = async (event :any) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!formState.name.trim() || !formState.phone.trim() || !formState.password.trim()) {
      setFormError("Name, phone, and password are required.");
      return;
    }

    if (formState.password.trim().length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    try {
      setCreatingWorker(true);

      const payload: CreateWorkerInput = {
        name: formState.name.trim(),
        phone: formState.phone.trim(),
        password: formState.password.trim(),
        email: formState.email?.trim() || undefined,
      };

      const created = await createWorkerApi(payload);

      setWorkers((prev) => {
        const withoutCreated = prev.filter((shopUser) => shopUser._id !== created._id);
        return [...withoutCreated, created];
      });

      setFormState(initialFormState);
      setFormSuccess("Worker added successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create worker";
      setFormError(message);
    } finally {
      setCreatingWorker(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Profile</p>
            <h1 className="text-2xl font-black text-slate-900 mt-1">{user?.name || "User"}</h1>
            <p className="text-sm text-slate-500 mt-1">Manage account details and shop team members.</p>
          </div>
          <span className="inline-flex items-center rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-700">
            {user?.role || "member"}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard label="Name" value={user?.name || "-"} />
          <InfoCard label="Phone" value={user?.phone || "-"} />
          <InfoCard label="Email" value={user?.email || "Not set"} />
          <InfoCard label="Shop" value={shop?.name || "-"} />
        </div>
      </section>

      {isOwner && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add Worker</h2>
              <p className="text-sm text-slate-500">Create a worker account for your shop.</p>
            </div>
          </div>

          <form className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onCreateWorker}>
            <InputField
              label="Worker Name"
              placeholder="Enter full name"
              value={formState.name}
              onChange={(value) => onInputChange("name", value)}
            />
            <InputField
              label="Phone"
              placeholder="Enter phone number"
              value={formState.phone}
              onChange={(value) => onInputChange("phone", value)}
            />
            <InputField
              label="Email (optional)"
              placeholder="worker@example.com"
              value={formState.email || ""}
              onChange={(value) => onInputChange("email", value)}
              type="email"
            />
            <InputField
              label="Temporary Password"
              placeholder="Minimum 6 characters"
              value={formState.password}
              onChange={(value) => onInputChange("password", value)}
              type="password"
            />

            <div className="md:col-span-2 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-h-5 text-sm">
                {formError && <p className="text-red-600">{formError}</p>}
                {formSuccess && <p className="text-green-700">{formSuccess}</p>}
              </div>
              <button
                type="submit"
                disabled={creatingWorker}
                className="rounded-xl bg-[#1D9E75] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#168a65] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingWorker ? "Adding..." : "Add Worker"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Workers</h2>
            <p className="text-sm text-slate-500">People who can log in and work in this shop.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {filteredWorkers.length} workers
          </span>
        </div>

        {loadingWorkers && <p className="mt-4 text-sm text-slate-500">Loading workers...</p>}

        {!loadingWorkers && workersError && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-100">{workersError}</p>
        )}

        {!loadingWorkers && !workersError && filteredWorkers.length === 0 && (
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 border border-slate-200">
            No workers added yet.
          </p>
        )}

        {!loadingWorkers && !workersError && filteredWorkers.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-3 font-semibold">Name</th>
                  <th className="py-2 pr-3 font-semibold">Phone</th>
                  <th className="py-2 pr-3 font-semibold">Email</th>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map((worker) => (
                  <tr key={worker._id} className="border-b border-slate-100 text-slate-700">
                    <td className="py-2 pr-3 font-medium">{worker.name}</td>
                    <td className="py-2 pr-3">{worker.phone}</td>
                    <td className="py-2 pr-3">{worker.email || "-"}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${
                          worker.is_active === false
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {worker.is_active === false ? "Inactive" : "Active"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900 break-all">{value}</p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "email" | "password";
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-green-100"
      />
    </label>
  );
}
