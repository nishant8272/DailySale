import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AuthPage } from "../pages/AuthPage";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  redirectTo?: "/dashboard" | "/shift";
};

export function AuthModal({ open, onClose, redirectTo = "/dashboard" }: AuthModalProps) {
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
      <div
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative z-101 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute cursor-pointer right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close auth modal"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <AuthPage mode="modal" onClose={onClose} redirectTo={redirectTo} />
      </div>
    </div>,
    document.body
  );
}
