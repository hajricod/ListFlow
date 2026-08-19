import React from 'react';
import { X, Cloud, ShieldCheck, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../locales/translations';
import { User } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInWithGoogle: () => Promise<User | null>;
  isLoggingIn: boolean;
  error: string | null;
  onClearError: () => void;
  language: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSignInWithGoogle,
  isLoggingIn,
  error,
  onClearError,
  language,
}) => {
  const t = getTranslation(language);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    onClearError();
    const user = await onSignInWithGoogle();
    if (user) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Dialog Card */}
      <div
        id="auth-modal-dialog"
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header with decorative background */}
        <div className="relative p-6 pb-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-indigo-500/10 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-indigo-950/30 border-b border-neutral-100 dark:border-neutral-800/80">
          <button
            type="button"
            id="auth-modal-close-btn"
            onClick={onClose}
            className="absolute top-4 end-4 p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-white/60 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-800 shadow-md border border-neutral-100 dark:border-neutral-700 flex items-center justify-center mb-3">
            {/* Multi-color Google "G" icon */}
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          </div>

          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {language === 'ar' ? 'تسجيل الدخول / إنشاء حساب عبر Gmail' : 'Sign in or Sign up with Gmail'}
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
            {language === 'ar'
              ? 'احفظ جميع قوائمك ومجموعاتك ومهامك في السحابة مع مزامنة فورية على كل أجهزتك'
              : 'Keep all your lists, aisles, and tasks securely synchronized across your devices'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Benefits list */}
          <div className="space-y-2.5 bg-neutral-50 dark:bg-neutral-800/40 p-3.5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300">
              <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{language === 'ar' ? 'مزامنة سحابية تلقائية وفورية' : 'Automatic real-time cloud sync'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300">
              <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{language === 'ar' ? 'الوصول من الهاتف، التابلت، والكمبيوتر' : 'Seamless access across all phones & computers'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300">
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>{language === 'ar' ? 'حفظ آمن بدون فقدان للبيانات' : 'Zero data loss with Google authentication'}</span>
            </div>
          </div>

          {/* Google Sign In / Sign Up Button */}
          <button
            id="google-signin-popup-btn"
            type="button"
            disabled={isLoggingIn}
            onClick={handleSignIn}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 shadow-xs hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>{isLoggingIn ? t.signingIn : t.signInWithGoogle}</span>
          </button>

          <p className="text-[11px] text-center text-neutral-500 dark:text-neutral-400">
            {language === 'ar'
              ? 'بالتسجيل عبر جوجل، يمكنك الوصول إلى مهامك وقوائمك في أي وقت ومن أي مكان.'
              : 'Signing in with your Google account seamlessly creates or connects your workspace.'}
          </p>
        </div>
      </div>
    </div>
  );
};
