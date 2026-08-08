import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AuthPage } from "../pages/AuthPage";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  redirectTo?: "/dashboard";
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
    <div className="fixed inset-0 z-100 flex items-start justify-center overflow-y-auto p-2 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative z-101 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="max-h-[calc(100dvh-1rem)] overflow-y-auto overflow-x-hidden p-4 sm:max-h-[calc(100dvh-2rem)] sm:p-6">
          <AuthPage mode="modal" onClose={onClose} redirectTo={redirectTo} />
        </div>
      </div>
    </div>,
    document.body
  );
}
