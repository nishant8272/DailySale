
import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { AuthUser } from "../types/auth.types";

type StartShiftModalProps = {
  open: boolean;
  onClose: () => void;
  currentUserRole?: "owner" | "worker";
  users: AuthUser[];
  loadingUsers: boolean;
  usersError: string | null;
  pendingWorkerId: string;
  onSelectWorker: (workerId: string) => void;
  onRetryUsers: () => Promise<void>;
  onStartShift: () => Promise<void>;
  startingShift: boolean;
};

export default function StartShiftModal({
  open,
  onClose,
  currentUserRole,
  users,
  loadingUsers,
  usersError,
  pendingWorkerId,
  onSelectWorker,
  onRetryUsers,
  onStartShift,
  startingShift,
}: StartShiftModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close start shift modal"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-101 w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Shift</p>
            <h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">Start today&apos;s shift</h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Opening stock will be pulled from yesterday&apos;s closing stock.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close start shift modal"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
          <div className="w-full text-left">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Users in this shop</h2>

            {loadingUsers ? (
              <p className="text-sm text-gray-500">Loading users...</p>
            ) : usersError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{usersError}</p>
                <button
                  type="button"
                  onClick={() => {
                    void onRetryUsers();
                  }}
                  className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            ) : users.length === 0 ? (
              <p className="text-sm text-gray-500">No users found for this shop.</p>
            ) : (
              <div className="space-y-2 bg-white border border-gray-200 rounded-xl p-3">
                {users.map((shopUser) => {
                  const inactive = shopUser.is_active === false;
                  const selected = pendingWorkerId === shopUser._id;

                  return (
                    <label
                      key={shopUser._id}
                      className={`flex items-center cursor-pointer justify-between gap-3 p-3 rounded-lg border ${selected ? "border-blue-500 bg-blue-50" : "border-gray-200"} ${inactive ? "opacity-60" : ""}`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <input
                          type="radio"
                          name="shift_user"
                          disabled={currentUserRole !== "owner" || inactive}
                          checked={selected}
                          onChange={() => onSelectWorker(shopUser._id)}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate">{shopUser.name}</p>
                          <p className="text-xs text-gray-500 truncate">{shopUser.phone}</p>
                        </div>
                      </div>
                      <div className="text-xs flex items-center gap-2">
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">
                          {shopUser.role}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full ${
                            inactive ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                          }`}
                        >
                          {inactive ? "Inactive" : "Active"}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {currentUserRole !== "owner" && (
              <p className="text-xs text-gray-500 mt-2">Only owner can select who will attend the shift.</p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 sm:w-auto sm:px-5"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  void onStartShift();
                }}
                disabled={startingShift || (currentUserRole === "owner" && !pendingWorkerId)}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1D9E75] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-green-200 transition hover:bg-[#168a65] hover:shadow-green-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <span aria-hidden="true">🚀</span>
                <span>{startingShift ? "Starting..." : "Start Shift"}</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}