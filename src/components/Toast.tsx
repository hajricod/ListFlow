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
    <div className="fixed bottom-4 end-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xl border border-neutral-800 dark:border-neutral-200 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="text-xs font-medium truncate">{toast.message}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {toast.undoAction && (
              <button
                onClick={() => {
                  toast.undoAction?.();
                  onDismiss(toast.id);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-indigo-300 dark:text-indigo-600 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.undo}</span>
              </button>
            )}
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 text-neutral-400 hover:text-white dark:hover:text-neutral-900 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
