import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import {
  createWorkerApi,
  fetchShopUsersApi,
  updateMyProfileApi,
  updateUserByIdApi,
  type CreateWorkerInput,
} from "../services/user.service";
import { updateMyShopApi } from "../services/shop.service";
import type { AuthUser } from "../types/auth.types";

type WorkerFormState = CreateWorkerInput;

const initialFormState: WorkerFormState = {
  name: "",
  phone: "",
  password: "",
  email: "",
};

export default function ProfilePage() {
  const { user, shop, setUser, setShop } = useAuth();
  const [workers, setWorkers] = useState<AuthUser[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [creatingWorker, setCreatingWorker] = useState(false);
  const [savingOwner, setSavingOwner] = useState(false);
  const [savingWorkerId, setSavingWorkerId] = useState<string | null>(null);
  const [workersError, setWorkersError] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [formSuccess, setFormSuccess] = useState<string>("");
  const [ownerFormError, setOwnerFormError] = useState<string>("");
  const [ownerFormSuccess, setOwnerFormSuccess] = useState<string>("");
  const [workerEditError, setWorkerEditError] = useState<string>("");
  const [workerEditSuccess, setWorkerEditSuccess] = useState<string>("");
  const [formState, setFormState] = useState<WorkerFormState>(initialFormState);
  const [editingOwner, setEditingOwner] = useState(false);
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [copiedShopId, setCopiedShopId] = useState(false);
  const [ownerForm, setOwnerForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    shopName: shop?.name || "",
  });
  const [workerEditForm, setWorkerEditForm] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const copyShopIdToClipboard = async () => {
    if (!shop?._id) return;
    try {
      await navigator.clipboard.writeText(shop._id);
      setCopiedShopId(true);
      setTimeout(() => setCopiedShopId(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const isOwner = user?.role === "owner";

  const filteredWorkers = useMemo(
    () => workers.filter((shopUser) => shopUser.role === "worker"),
    [workers]
  );

  useEffect(() => {
    setOwnerForm({
      name: user?.name || "",
      phone: user?.phone || "",
      email: user?.email || "",
      shopName: shop?.name || "",
    });
  }, [shop?.name, user]);

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

  const onCreateWorker = async (event: FormEvent<HTMLFormElement>) => {
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

  const onStartOwnerEdit = () => {
    setOwnerFormError("");
    setOwnerFormSuccess("");
    setOwnerForm({
      name: user?.name || "",
      phone: user?.phone || "",
      email: user?.email || "",
      shopName: shop?.name || "",
    });
    setEditingOwner(true);
  };

  const onSaveOwner = async () => {
    setOwnerFormError("");
    setOwnerFormSuccess("");

    if (!ownerForm.name.trim() || !ownerForm.phone.trim() || !ownerForm.shopName.trim()) {
      setOwnerFormError("Name, phone, and shop name are required.");
      return;
    }

    try {
      setSavingOwner(true);
      const profilePromise = updateMyProfileApi({
        name: ownerForm.name.trim(),
        phone: ownerForm.phone.trim(),
        email: ownerForm.email.trim(),
      });
      const shopPromise = updateMyShopApi({
        name: ownerForm.shopName.trim(),
      });

      const [updatedUser, updatedShop] = await Promise.all([profilePromise, shopPromise]);

      setUser(updatedUser);
      setShop({
        _id: String(updatedShop._id),
        name: updatedShop.name,
        owner_name: updatedShop.owner_name,
        address: updatedShop.address,
      });
      setWorkers((prev) =>
        prev.map((shopUser) =>
          shopUser._id === updatedUser._id ? { ...shopUser, ...updatedUser } : shopUser
        )
      );

      setOwnerFormSuccess("Profile updated successfully.");
      setEditingOwner(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile";
      setOwnerFormError(message);
    } finally {
      setSavingOwner(false);
    }
  };

  const onStartWorkerEdit = (worker: AuthUser) => {
    setWorkerEditError("");
    setWorkerEditSuccess("");
    setEditingWorkerId(worker._id);
    setWorkerEditForm({
      name: worker.name,
      phone: worker.phone,
      email: worker.email || "",
    });
  };

  const onCancelWorkerEdit = () => {
    setEditingWorkerId(null);
    setWorkerEditError("");
  };

  const onSaveWorker = async (workerId: string) => {
    setWorkerEditError("");
    setWorkerEditSuccess("");

    if (!workerEditForm.name.trim() || !workerEditForm.phone.trim()) {
      setWorkerEditError("Name and phone are required.");
      return;
    }

    try {
      setSavingWorkerId(workerId);
      const updatedWorker = await updateUserByIdApi(workerId, {
        name: workerEditForm.name.trim(),
        phone: workerEditForm.phone.trim(),
        email: workerEditForm.email.trim(),
      });

      setWorkers((prev) =>
        prev.map((shopUser) =>
          shopUser._id === updatedWorker._id ? { ...shopUser, ...updatedWorker } : shopUser
        )
      );

      setEditingWorkerId(null);
      setWorkerEditSuccess("Worker updated successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update worker";
      setWorkerEditError(message);
    } finally {
      setSavingWorkerId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-350 space-y-6 animate-in fade-in duration-300">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Profile</p>
            <h1 className="text-2xl font-black text-slate-900 mt-1">{user?.name || "User"}</h1>
            <p className="text-sm text-slate-500 mt-1">Manage account details and shop team members.</p>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                type="button"
                onClick={() => {
                  if (editingOwner) {
                    setEditingOwner(false);
                    setOwnerFormError("");
                  } else {
                    onStartOwnerEdit();
                  }
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {editingOwner ? "Cancel" : "Edit Profile"}
              </button>
            )}
            <span className="inline-flex items-center rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-700">
              {user?.role || "member"}
            </span>
          </div>
        </div>

        {!editingOwner && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard label="Name" value={user?.name || "-"} />
            <InfoCard label="Phone" value={user?.phone || "-"} />
            <InfoCard label="Email" value={user?.email || "Not set"} />
            <InfoCard label="Shop" value={shop?.name || "-"} />
            {isOwner && shop?._id && (
              <div className="md:col-span-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Shop ID (Share with workers)</p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-white border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 break-all">
                      {shop._id}
                    </code>
                    <button
                      type="button"
                      onClick={copyShopIdToClipboard}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D9E75] px-3 py-2 text-xs font-semibold text-white hover:bg-[#168a65] transition whitespace-nowrap"
                    >
                      {copiedShopId ? (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {editingOwner && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Your Name"
              placeholder="Enter your name"
              value={ownerForm.name}
              onChange={(value) => setOwnerForm((prev) => ({ ...prev, name: value }))}
            />
            <InputField
              label="Phone"
              placeholder="Enter phone number"
              value={ownerForm.phone}
              onChange={(value) => setOwnerForm((prev) => ({ ...prev, phone: value }))}
            />
            <InputField
              label="Email"
              placeholder="owner@example.com"
              value={ownerForm.email}
              onChange={(value) => setOwnerForm((prev) => ({ ...prev, email: value }))}
              type="email"
            />
            <InputField
              label="Shop Name"
              placeholder="Enter shop name"
              value={ownerForm.shopName}
              onChange={(value) => setOwnerForm((prev) => ({ ...prev, shopName: value }))}
            />

            <div className="md:col-span-2 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-h-5 text-sm">
                {ownerFormError && <p className="text-red-600">{ownerFormError}</p>}
                {ownerFormSuccess && <p className="text-green-700">{ownerFormSuccess}</p>}
              </div>
              <button
                type="button"
                onClick={onSaveOwner}
                disabled={savingOwner}
                className="rounded-xl bg-[#1D9E75] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#168a65] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingOwner ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        )}
      </section>

      {isOwner && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
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
              allowPasswordToggle
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

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
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
            {(workerEditError || workerEditSuccess) && (
              <div className="mb-3 text-sm">
                {workerEditError && <p className="text-red-600">{workerEditError}</p>}
                {workerEditSuccess && <p className="text-green-700">{workerEditSuccess}</p>}
              </div>
            )}
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-3 font-semibold">Name</th>
                  <th className="py-2 pr-3 font-semibold">Phone</th>
                  <th className="py-2 pr-3 font-semibold">Email</th>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                  {isOwner && <th className="py-2 pr-3 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map((worker) => (
                  <tr key={worker._id} className="border-b border-slate-100 text-slate-700">
                    <td className="py-2 pr-3 font-medium">
                      {editingWorkerId === worker._id ? (
                        <input
                          value={workerEditForm.name}
                          onChange={(event) =>
                            setWorkerEditForm((prev) => ({ ...prev, name: event.target.value }))
                          }
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#1D9E75]"
                        />
                      ) : (
                        worker.name
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      {editingWorkerId === worker._id ? (
                        <input
                          value={workerEditForm.phone}
                          onChange={(event) =>
                            setWorkerEditForm((prev) => ({ ...prev, phone: event.target.value }))
                          }
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#1D9E75]"
                        />
                      ) : (
                        worker.phone
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      {editingWorkerId === worker._id ? (
                        <input
                          value={workerEditForm.email}
                          onChange={(event) =>
                            setWorkerEditForm((prev) => ({ ...prev, email: event.target.value }))
                          }
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#1D9E75]"
                        />
                      ) : (
                        worker.email || "-"
                      )}
                    </td>
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
                    {isOwner && (
                      <td className="py-2 pr-3">
                        {editingWorkerId === worker._id ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onSaveWorker(worker._id)}
                              disabled={savingWorkerId === worker._id}
                              className="rounded-lg bg-[#1D9E75] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#168a65] disabled:opacity-60"
                            >
                              {savingWorkerId === worker._id ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={onCancelWorkerEdit}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onStartWorkerEdit(worker)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    )}
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
  allowPasswordToggle = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "email" | "password";
  allowPasswordToggle?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === "password";
  const inputType = isPasswordField && showPassword ? "text" : type;

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-green-100 ${
            isPasswordField && allowPasswordToggle ? "pr-11" : ""
          }`}
        />

        {isPasswordField && allowPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
                <path d="M3 3l18 18" strokeLinecap="round" />
                <path d="M10.6 10.6a2 2 0 102.8 2.8" strokeLinecap="round" />
                <path d="M9.9 5.2A10.6 10.6 0 0112 5c5 0 9.2 3 10 7a10.9 10.9 0 01-3.1 4.8" strokeLinecap="round" />
                <path d="M6.1 6.1A10.8 10.8 0 002 12c.4 2 1.8 3.9 3.8 5.3" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
    </label>
  );
}
