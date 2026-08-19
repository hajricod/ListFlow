import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../locales/translations';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  language: Language;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  language,
}) => {
  const t = getTranslation(language);
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-5 my-8 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">
              {title}
            </h3>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-500 shadow-sm shadow-rose-600/20 active:scale-[0.98] transition-all"
          >
            {confirmLabel || t.delete}
          </button>
        </div>
      </div>
    </div>
  );
};
