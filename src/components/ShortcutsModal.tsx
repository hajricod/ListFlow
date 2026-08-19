import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../locales/translations';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const t = getTranslation(language);
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'N', desc: t.shortcutNewTask },
    { key: 'G', desc: t.shortcutNewGroup },
    { key: 'B', desc: t.shortcutToggleSidebar },
    { key: '/', desc: t.shortcutSearch },
    { key: 'L', desc: t.shortcutToggleLang },
    { key: 'D', desc: t.shortcutToggleTheme },
    { key: 'Esc', desc: t.shortcutEscape },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-5 sm:p-6 my-8 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Keyboard className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {t.shortcutsTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcut Table */}
        <div className="mt-4 divide-y divide-neutral-100 dark:divide-neutral-800">
          {shortcuts.map((sc, i) => (
            <div key={i} className="py-2.5 flex items-center justify-between gap-4 text-xs">
              <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                {sc.desc}
              </span>
              <kbd className="px-2.5 py-1 text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
