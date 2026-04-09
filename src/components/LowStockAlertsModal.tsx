
import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { Alert } from "../api/api.types";

type LowStockAlertsModalProps = {
  open: boolean;
  onClose: () => void;
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

export default function LowStockAlertsModal({
  open,
  onClose,
  alerts,
  loading,
  error,
  onRetry,
}: LowStockAlertsModalProps) {
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
        aria-label="Close low stock modal"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-101 w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">Stock watch</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Low stock items</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review the products that need restocking soon.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close low stock modal"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700">
              <p className="font-semibold">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Try again
              </button>
            </div>
          ) : alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert._id}
                  className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                      <path d="M12 9v4m0 4h.01M10.29 3.86l-8.2 14.21A2 2 0 003.82 21h16.36a2 2 0 001.73-2.93l-8.2-14.21a2 2 0 00-3.42 0z" />
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900">
                        {alert.product_id?.name ?? "Unknown product"}
                      </h3>
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-red-700">
                        Low stock
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-600">{alert.message}</p>
                    <p className="mt-2 text-xs font-medium text-slate-400">
                      {new Date(alert.created_at).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-slate-500">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                  <path d="M9 12l2 2 4-4M20 12a8 8 0 11-16 0 8 8 0 0116 0z" />
                </svg>
              </div>
              <p className="font-semibold text-slate-700">No low stock alerts right now.</p>
              <p className="mt-1 text-sm">Everything looks healthy for the moment.</p>
            </div>
          )}
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
