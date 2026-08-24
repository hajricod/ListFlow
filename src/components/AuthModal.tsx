import React, { useState } from 'react';
import {
  X,
  Cloud,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../locales/translations';
import { User } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInWithGoogle: (lang?: 'en' | 'ar') => Promise<User | null>;
  onSignInWithEmail: (email: string, password: string, lang?: 'en' | 'ar') => Promise<User | null>;
  onSignUpWithEmail: (
    email: string,
    password: string,
    displayName?: string,
    lang?: 'en' | 'ar'
  ) => Promise<User | null>;
  onSendPasswordReset: (email: string, lang?: 'en' | 'ar') => Promise<boolean>;
  isLoggingIn: boolean;
  error: string | null;
  onClearError: () => void;
  language: Language;
}

type AuthTab = 'signin' | 'signup' | 'forgot';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSignInWithGoogle,
  onSignInWithEmail,
  onSignUpWithEmail,
  onSendPasswordReset,
  isLoggingIn,
  error,
  onClearError,
  language,
}) => {
  const t = getTranslation(language);
  const isRtl = language === 'ar';

  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localValidationMessage, setLocalValidationMessage] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTabSwitch = (tab: AuthTab) => {
    setActiveTab(tab);
    onClearError();
    setLocalValidationMessage(null);
    setResetSuccessMessage(null);
  };

  const handleClose = () => {
    onClearError();
    setLocalValidationMessage(null);
    setResetSuccessMessage(null);
    onClose();
  };

  const handleGoogleSignIn = async () => {
    onClearError();
    setLocalValidationMessage(null);
    setResetSuccessMessage(null);
    const user = await onSignInWithGoogle(language);
    if (user) {
      handleClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onClearError();
    setLocalValidationMessage(null);
    setResetSuccessMessage(null);

    const cleanEmail = email.trim();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setLocalValidationMessage(t.enterValidEmail);
      return;
    }

    if (activeTab === 'forgot') {
      const ok = await onSendPasswordReset(cleanEmail, language);
      if (ok) {
        setResetSuccessMessage(t.resetLinkSent);
      }
      return;
    }

    if (!password || password.length < 6) {
      setLocalValidationMessage(t.enterPassword);
      return;
    }

    if (activeTab === 'signup') {
      if (password !== confirmPassword) {
        setLocalValidationMessage(t.passwordsDoNotMatch);
        return;
      }
      const user = await onSignUpWithEmail(cleanEmail, password, displayName.trim(), language);
      if (user) {
        handleClose();
      }
    } else {
      // Sign in
      const user = await onSignInWithEmail(cleanEmail, password, language);
      if (user) {
        handleClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={handleClose}
      />

      {/* Dialog Card */}
      <div
        id="auth-modal-dialog"
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-indigo-500/10 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-indigo-950/30 border-b border-neutral-100 dark:border-neutral-800/80">
          <button
            type="button"
            id="auth-modal-close-btn"
            onClick={handleClose}
            className="absolute top-4 end-4 p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-white/60 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
            aria-label={t.close}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200/60 dark:border-neutral-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              {activeTab === 'forgot' ? (
                <KeyRound className="w-5 h-5" />
              ) : (
                <Cloud className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {activeTab === 'forgot'
                  ? t.resetPasswordTitle
                  : activeTab === 'signup'
                  ? t.signup
                  : t.login}
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {language === 'ar'
                  ? 'سجل دخولك بأي بريد (Outlook, Yahoo, iCloud, Gmail) أو حساب جوجل'
                  : 'Use any email (Outlook, Yahoo, iCloud, Gmail, work) or Google'}
              </p>
            </div>
          </div>

          {/* Provider pill highlights */}
          <div className="mt-3 flex items-center flex-wrap gap-1.5 text-[10px] font-medium text-neutral-600 dark:text-neutral-300">
            <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700">
              ✉️ Outlook / Hotmail
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700">
              🟣 Yahoo
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700">
              ☁️ iCloud
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700">
              🌐 {language === 'ar' ? 'أي بريد مخصص' : 'Any Domain'}
            </span>
          </div>

          {/* Tab Switcher (Sign In vs Create Account) */}
          {activeTab !== 'forgot' && (
            <div className="mt-4 grid grid-cols-2 p-1 bg-neutral-200/60 dark:bg-neutral-800/70 rounded-xl">
              <button
                type="button"
                id="auth-tab-signin"
                onClick={() => handleTabSwitch('signin')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {t.login}
              </button>
              <button
                type="button"
                id="auth-tab-signup"
                onClick={() => handleTabSwitch('signup')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {t.createAccount}
              </button>
            </div>
          )}
        </div>

        {/* Content Form */}
        <div className="p-6 space-y-4 max-h-[calc(85vh-160px)] overflow-y-auto">
          {/* Error Message */}
          {(error || localValidationMessage) && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{localValidationMessage || error}</span>
              </div>
              {(error?.includes('Google') || error?.includes('جوجل')) && (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoggingIn}
                  className="w-full mt-1 py-1.5 px-3 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900/80 text-red-800 dark:text-red-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.continueWithGoogle}</span>
                </button>
              )}
            </div>
          )}

          {/* Reset Link Success Notice */}
          {resetSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{resetSuccessMessage}</span>
            </div>
          )}

          {/* 1. Google 1-Click Button (At top for instant frictionless login) */}
          {activeTab !== 'forgot' && (
            <div className="space-y-3">
              <button
                id="google-signin-popup-btn"
                type="button"
                disabled={isLoggingIn}
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 shadow-2xs hover:shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? (
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>{t.continueWithGoogle}</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-neutral-200 dark:border-neutral-800 w-full" />
                <span className="bg-white dark:bg-neutral-900 px-3 text-[11px] uppercase tracking-wider text-neutral-400 font-medium shrink-0">
                  {t.orContinueWith}
                </span>
                <div className="border-t border-neutral-200 dark:border-neutral-800 w-full" />
              </div>
            </div>
          )}

          {/* 2. Email & Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Display Name (Only on Sign Up) */}
            {activeTab === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t.fullName}
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="auth-input-fullname"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t.fullNamePlaceholder}
                    className="w-full ps-9 pe-3 py-2 text-xs sm:text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t.emailAddress} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  id="auth-input-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full ps-9 pe-3 py-2 text-xs sm:text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Password (for Sign In & Sign Up) */}
            {activeTab !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    {t.password} <span className="text-red-500">*</span>
                  </label>
                  {activeTab === 'signin' && (
                    <button
                      type="button"
                      id="auth-btn-forgot-pw"
                      onClick={() => handleTabSwitch('forgot')}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      {t.forgotPassword}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="auth-input-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={activeTab === 'signup' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="w-full ps-9 pe-10 py-2 text-xs sm:text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (Only on Sign Up) */}
            {activeTab === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t.confirmPassword} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="auth-input-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t.confirmPasswordPlaceholder}
                    className="w-full ps-9 pe-10 py-2 text-xs sm:text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoggingIn ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : activeTab === 'forgot' ? (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{t.sendResetLink}</span>
                </>
              ) : activeTab === 'signup' ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t.createAccount}</span>
                </>
              ) : (
                <>
                  <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                  <span>{t.login}</span>
                </>
              )}
            </button>
          </form>

          {/* Footer switches */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-center">
            {activeTab === 'forgot' ? (
              <button
                type="button"
                id="auth-btn-back-signin"
                onClick={() => handleTabSwitch('signin')}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium cursor-pointer"
              >
                <ArrowLeft className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
                <span>{t.backToSignIn}</span>
              </button>
            ) : activeTab === 'signin' ? (
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {t.dontHaveAccount}{' '}
                <button
                  type="button"
                  id="auth-switch-to-signup"
                  onClick={() => handleTabSwitch('signup')}
                  className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {t.createAccount}
                </button>
              </p>
            ) : (
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {t.alreadyHaveAccount}{' '}
                <button
                  type="button"
                  id="auth-switch-to-signin"
                  onClick={() => handleTabSwitch('signin')}
                  className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {t.login}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
