import React from 'react';
import {
  Download,
  X,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  WifiOff,
  Zap,
} from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../locales/translations';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNativeInstall: () => void;
  canNativePrompt: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  language: Language;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  onNativeInstall,
  canNativePrompt,
  isIOS,
  isAndroid,
  language,
}) => {
  const t = getTranslation(language);
  const isRTL = language === 'ar';

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-xl p-5 space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {t.installAppTitle}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isRTL ? 'تطبيق الويب التفاعلي (PWA)' : 'Progressive Web App'}
              </p>
            </div>
          </div>
          <button
            id="close-install-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label={t.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Benefits Badges */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-1.5 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-300">
            <WifiOff className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">{isRTL ? 'يعمل بدون إنترنت' : 'Offline ready'}</span>
          </div>
          <div className="flex-1 flex items-center gap-1.5 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-300">
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">{isRTL ? 'وصول فوري وسريع' : 'Instant launch'}</span>
          </div>
        </div>

        {/* Body Content: Install Action or Simple Steps */}
        {canNativePrompt ? (
          <div className="pt-1">
            <button
              id="pwa-native-install-btn"
              type="button"
              onClick={() => {
                onNativeInstall();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{t.installNow}</span>
            </button>
          </div>
        ) : isIOS ? (
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200/60 dark:border-neutral-800 space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                1
              </span>
              <span className="flex items-center gap-1">
                {isRTL ? 'اضغط زر المشاركة' : 'Tap Share'}
                <Share className="w-3 h-3 text-blue-500 inline" />
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                2
              </span>
              <span className="flex items-center gap-1">
                {isRTL ? 'اختر "إضافة إلى الشاشة الرئيسية"' : 'Select "Add to Home Screen"'}
                <PlusSquare className="w-3 h-3 text-emerald-600 inline" />
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200/60 dark:border-neutral-800 flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {isAndroid ? t.installAndroidInstructions : t.installDesktopInstructions}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            id="close-install-modal-action-btn"
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
