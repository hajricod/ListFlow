import React from 'react';
import { CheckCircle, AlertCircle, Info, X, RotateCcw } from 'lucide-react';
import { ToastMessage, Language } from '../types';
import { getTranslation } from '../locales/translations';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  language: Language;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  language,
}) => {
  const t = getTranslation(language);
  if (toasts.length === 0) return null;

  return (
    <aside
      id="toast-notification-container"
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 sm:bottom-6 inset-x-4 sm:inset-x-auto sm:end-6 z-[9999] flex flex-col items-center sm:items-end gap-2.5 max-w-sm sm:max-w-md w-auto pointer-events-none transition-all"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          id={`toast-${toast.id}`}
          role="status"
          className="w-full pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-neutral-900/95 text-white dark:bg-white/95 dark:text-neutral-900 shadow-2xl backdrop-blur-md border border-neutral-800/80 dark:border-neutral-200/80 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 dark:text-rose-600 shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400 dark:text-sky-600 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 dark:text-emerald-600 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium leading-snug break-words">
              {toast.message}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 ms-2">
            {toast.undoAction && (
              <button
                type="button"
                id={`toast-undo-${toast.id}`}
                onClick={() => {
                  toast.undoAction?.();
                  onDismiss(toast.id);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-300 dark:text-emerald-700 bg-neutral-800/90 dark:bg-neutral-100 hover:bg-neutral-700 dark:hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.undo}</span>
              </button>
            )}
            <button
              type="button"
              id={`toast-dismiss-${toast.id}`}
              onClick={() => onDismiss(toast.id)}
              aria-label="Close notification"
              className="p-1 text-neutral-400 hover:text-white dark:text-neutral-500 dark:hover:text-neutral-900 rounded-lg hover:bg-neutral-800/60 dark:hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </aside>
  );
};
