import React from 'react';
import {
  Download,
  X,
  Smartphone,
  Laptop,
  CheckCircle2,
  Share,
  PlusSquare,
  Sparkles,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Accent Light */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

        {/* Close Button */}
        <button
          id="close-install-modal-btn"
          type="button"
          onClick={onClose}
          className="absolute top-5 end-5 p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          aria-label={t.close}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Visual Badge */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0 flex items-center justify-center">
            <img src="/icon.svg" alt="List Flow Icon" className="w-full h-full rounded-2xl" />
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200/60 dark:border-emerald-800/40 mb-1.5">
              <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Progressive Web App</span>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {t.installAppTitle}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
              {t.installAppSubtitle}
            </p>
          </div>
        </div>

        {/* Value Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/40 flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 shrink-0">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {isRTL ? 'بدون إنترنت' : 'Offline Ready'}
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight mt-0.5">
                {t.installFeatureOffline}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/40 flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {isRTL ? 'تشغيل فوري' : 'Instant Launch'}
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight mt-0.5">
                {t.installFeatureInstant}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/40 flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {isRTL ? 'شاشة كاملة' : 'Fullscreen'}
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight mt-0.5">
                {t.installFeatureFullscreen}
              </p>
            </div>
          </div>
        </div>

        {/* Main Action Section: Native Button OR Step-by-Step Instructions */}
        {canNativePrompt ? (
          <div className="space-y-4">
            <button
              id="pwa-native-install-btn"
              type="button"
              onClick={onNativeInstall}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>{t.installNow}</span>
            </button>
            <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">
              {isRTL
                ? 'سيتم إضافة أيقونة التطبيق مباشرة إلى جهازك.'
                : 'Installs securely through your browser with 1-click.'}
            </p>
          </div>
        ) : isIOS ? (
          <div className="space-y-3 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-700/50">
            <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isRTL ? 'خطوات التثبيت على iOS (Safari)' : 'How to install on iOS Safari:'}</span>
            </p>
            <ol className="space-y-2.5 text-xs text-neutral-600 dark:text-neutral-300">
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  {isRTL ? 'اضغط على زر المشاركة' : 'Tap the Share icon'}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 font-semibold text-neutral-800 dark:text-neutral-100">
                    <Share className="w-3 h-3 text-blue-500" /> {isRTL ? 'مشاركة' : 'Share'}
                  </span>
                  {isRTL ? 'في شريط المتصفح السفلي.' : 'in Safari toolbar.'}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  {isRTL ? 'مرر للأسفل واختر' : 'Scroll and select'}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 font-semibold text-neutral-800 dark:text-neutral-100">
                    <PlusSquare className="w-3 h-3 text-emerald-600" /> {isRTL ? 'إضافة إلى الصفحة الرئيسية' : 'Add to Home Screen'}
                  </span>
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <span>
                  {isRTL ? 'اضغط على "إضافة" (Add) في الزاوية العلوية.' : 'Tap "Add" in top-right corner to finish.'}
                </span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-700/50">
            <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isRTL ? 'خطوات التثبيت من المتصفح' : 'How to install from Browser:'}</span>
            </p>
            <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {isAndroid
                    ? t.installAndroidInstructions
                    : t.installDesktopInstructions}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end">
          <button
            id="close-install-modal-action-btn"
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
