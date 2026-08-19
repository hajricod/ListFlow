import React, { useRef } from 'react';
import {
  ArrowLeft,
  Languages,
  Moon,
  Sun,
  Monitor,
  Volume2,
  VolumeX,
  Keyboard,
  Download,
  Upload,
  Sparkles,
  Database,
  CheckCircle2,
  Info,
  Play,
  Layers,
  FolderKanban,
  CheckSquare,
  Palette,
} from 'lucide-react';
import { Language, Theme, ThemeColor } from '../types';
import { getTranslation } from '../locales/translations';
import { sounds } from '../utils/audio';
import { THEME_COLOR_OPTIONS, getThemeColorName } from '../utils/themeColors';
import { User } from 'firebase/auth';
import { LogOut, Cloud, ShieldCheck } from 'lucide-react';

interface SettingsPageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme: Theme;
  onThemeChange?: (theme: Theme) => void;
  onThemeToggle: () => void;
  themeColor?: ThemeColor;
  onThemeColorChange?: (color: ThemeColor) => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  onOpenTemplatesModal: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onOpenInstallModal?: () => void;
  isAppInstalled?: boolean;
  user?: User | null;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
  onBackToWorkspace: () => void;
  totalLists: number;
  totalGroups: number;
  totalItems: number;
  completedItems: number;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  onThemeToggle,
  themeColor = 'emerald',
  onThemeColorChange,
  soundEnabled,
  onSoundToggle,
  onOpenTemplatesModal,
  onExportData,
  onImportData,
  onOpenInstallModal,
  isAppInstalled = false,
  user,
  onOpenAuthModal,
  onSignOut,
  onBackToWorkspace,
  totalLists,
  totalGroups,
  totalItems,
  completedItems,
}) => {
  const t = getTranslation(language);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportData(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const shortcuts = [
    { key: 'N', desc: t.shortcutNewTask },
    { key: 'G', desc: t.shortcutNewGroup },
    { key: '/', desc: t.shortcutSearch },
    { key: 'B', desc: t.shortcutToggleSidebar },
    { key: 'L', desc: t.shortcutToggleLang },
    { key: 'D', desc: t.shortcutToggleTheme },
    { key: 'Esc', desc: t.shortcutEscape },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Hidden File Input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="settings-back-btn"
            onClick={onBackToWorkspace}
            className="p-2.5 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            title={t.backToWorkspace}
          >
            <ArrowLeft className="w-5 h-5 rtl:rotate-180 group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              {t.settingsTitle}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              {t.settingsSubtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToWorkspace}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <FolderKanban className="w-4 h-4" />
          <span>{t.backToWorkspace}</span>
        </button>
      </div>

      {/* Google Account & Cloud Sync Section */}
      <section className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-indigo-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            {user ? (
              user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-2xl object-cover shadow-sm ring-2 ring-emerald-500/30 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-emerald-500/20 shrink-0">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-xs shrink-0">
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
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {user ? (user.displayName || user.email) : t.guestMode}
                </h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  user
                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                    : 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}>
                  {user ? t.cloudSyncActive : (language === 'ar' ? 'وضع محلي' : 'Local Storage')}
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                {user ? user.email : t.guestModeDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              onSignOut && (
                <button
                  id="settings-signout-btn"
                  type="button"
                  onClick={onSignOut}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-neutral-700 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 border border-neutral-300 dark:border-neutral-700 font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.signOut}</span>
                </button>
              )
            ) : (
              onOpenAuthModal && (
                <button
                  id="settings-signin-btn"
                  type="button"
                  onClick={onOpenAuthModal}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-emerald-600/25 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#FFFFFF"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#FFFFFF"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FFFFFF"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#FFFFFF"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>{t.signInWithGoogle}</span>
                </button>
              )
            )}
          </div>
        </div>
      </section>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Language & Locale */}
        <section className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <Languages className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {t.languageRegion}
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {language === 'ar' ? 'التبديل الفوري بين واجهة اللغة العربية والإنجليزية' : 'Switch interface between English and Arabic with full RTL support'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                type="button"
                id="lang-select-en"
                onClick={() => onLanguageChange('en')}
                className={`p-3.5 rounded-xl border text-start transition-all cursor-pointer ${
                  language === 'en'
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                    : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">English</span>
                  {language === 'en' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                </div>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block">
                  Left-to-Right (LTR)
                </span>
              </button>

              <button
                type="button"
                id="lang-select-ar"
                onClick={() => onLanguageChange('ar')}
                className={`p-3.5 rounded-xl border text-start transition-all cursor-pointer ${
                  language === 'ar'
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                    : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">العربية</span>
                  {language === 'ar' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                </div>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block">
                  Right-to-Left (RTL)
                </span>
              </button>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>{t.activeLanguage}:</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">{language === 'en' ? 'English (EN)' : 'العربية (AR)'}</span>
          </div>
        </section>

        {/* 2. Appearance & Theme */}
        <section className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                {theme === 'dark' ? (
                  <Moon className="w-4.5 h-4.5" />
                ) : theme === 'system' ? (
                  <Monitor className="w-4.5 h-4.5" />
                ) : (
                  <Sun className="w-4.5 h-4.5" />
                )}
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {t.appearance}
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {language === 'ar'
                    ? 'اختر بين المظهر الفاتح أو الوضع الليلي أو المزامنة التلقائية مع سمة النظام'
                    : 'Choose light, dark, or automatic system preference'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
              {/* Light Mode Button */}
              <button
                type="button"
                id="theme-select-light"
                onClick={() => {
                  if (onThemeChange) onThemeChange('light');
                  else if (theme !== 'light') onThemeToggle();
                }}
                className={`p-3 rounded-xl border text-start transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-neutral-900 dark:text-neutral-100 ring-2 ring-amber-500/20'
                    : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                    <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{t.lightMode}</span>
                  </div>
                  {theme === 'light' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />}
                </div>
                <span className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 block truncate">
                  {t.lightModeDesc || (language === 'ar' ? 'نهاري ناصع ومريح' : 'Clean & bright canvas')}
                </span>
              </button>

              {/* Dark Mode Button */}
              <button
                type="button"
                id="theme-select-dark"
                onClick={() => {
                  if (onThemeChange) onThemeChange('dark');
                  else if (theme !== 'dark') onThemeToggle();
                }}
                className={`p-3 rounded-xl border text-start transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-neutral-900 dark:text-neutral-100 ring-2 ring-indigo-500/20'
                    : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                    <Moon className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                    <span>{t.darkMode}</span>
                  </div>
                  {theme === 'dark' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                </div>
                <span className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 block truncate">
                  {t.darkModeDesc || (language === 'ar' ? 'ليلي مريح للأعين' : 'Eye-safe contrast')}
                </span>
              </button>

              {/* System Mode Button */}
              <button
                type="button"
                id="theme-select-system"
                onClick={() => {
                  if (onThemeChange) onThemeChange('system');
                  else onThemeToggle();
                }}
                className={`p-3 rounded-xl border text-start transition-all cursor-pointer ${
                  theme === 'system'
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-neutral-900 dark:text-neutral-100 ring-2 ring-emerald-500/20'
                    : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                    <Monitor className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    <span>{t.systemMode}</span>
                  </div>
                  {theme === 'system' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                </div>
                <span className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 block truncate">
                  {t.systemModeDesc || (language === 'ar' ? 'يتطابق مع مظهر الجهاز' : 'Matches device settings')}
                </span>
              </button>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>{t.activeTheme}:</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              {theme === 'dark' ? t.darkMode : theme === 'system' ? t.systemMode : t.lightMode}
            </span>
          </div>
        </section>

        {/* 3. Theme Accent Color */}
        <section className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between md:col-span-2">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-2xs transition-colors"
                style={{
                  backgroundColor: THEME_COLOR_OPTIONS.find((c) => c.id === themeColor)?.hex || '#10b981',
                }}
              >
                <Palette className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {t.themeColor}
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t.themeColorDesc}
                </p>
              </div>
            </div>

            {/* Color Swatches Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5 mt-4">
              {THEME_COLOR_OPTIONS.map((opt) => {
                const isSelected = themeColor === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    id={`theme-color-opt-${opt.id}`}
                    onClick={() => {
                      if (onThemeColorChange) {
                        onThemeColorChange(opt.id);
                        if (soundEnabled) sounds.playComplete();
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 relative ${
                      isSelected
                        ? 'border-neutral-900 dark:border-white ring-2 ring-neutral-400/40 bg-neutral-50 dark:bg-neutral-800/80 scale-[1.02] shadow-xs'
                        : 'border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    {/* Circle Swatch */}
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-2xs transition-transform"
                      style={{ backgroundColor: opt.hex }}
                    >
                      {isSelected && <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
                    </div>

                    {/* Color Label */}
                    <div className="w-full text-center">
                      <span className="font-semibold text-xs text-neutral-800 dark:text-neutral-200 block truncate">
                        {language === 'ar' ? opt.nameAr : opt.nameEn}
                      </span>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-mono">
                        {opt.hex}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>{t.activeThemeColor}:</span>
            <div className="flex items-center gap-2 font-semibold text-neutral-800 dark:text-neutral-200">
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{
                  backgroundColor: THEME_COLOR_OPTIONS.find((c) => c.id === themeColor)?.hex || '#10b981',
                }}
              />
              <span>{getThemeColorName(themeColor, language)}</span>
            </div>
          </div>
        </section>

        {/* 4. Audio & Sound Feedback */}
        <section className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                  {soundEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {t.audioFeedback}
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t.soundDescription}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                id="sound-toggle-switch"
                onClick={onSoundToggle}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  soundEnabled ? 'bg-emerald-600' : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    soundEnabled ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Test Sounds buttons */}
            <div className="mt-4 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60 space-y-2">
              <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block">
                {language === 'ar' ? 'تجربة المؤثرات الصوتية:' : 'Test Audio Effects:'}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => sounds.playComplete()}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-650 flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3 h-3 text-emerald-500" />
                  <span>{language === 'ar' ? 'نغمة الإكمال' : 'Completion Chime'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => sounds.playPop()}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-650 flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3 h-3 text-teal-500" />
                  <span>{language === 'ar' ? 'صوت النقر' : 'Pop Tap'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => sounds.playDrop()}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-650 flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3 h-3 text-indigo-500" />
                  <span>{language === 'ar' ? 'صوت الإفلات' : 'Drop'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => sounds.playDelete()}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-650 flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3 h-3 text-rose-500" />
                  <span>{language === 'ar' ? 'صوت الحذف' : 'Trash'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>Status:</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">{soundEnabled ? t.soundOn : t.soundOff}</span>
          </div>
        </section>

        {/* 4. Backup & Starter Templates */}
        <section className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                <Database className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {t.dataManagement}
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t.dataManagementDesc}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
              {/* Export Button */}
              <button
                type="button"
                id="settings-export-btn"
                onClick={onExportData}
                className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{t.exportData}</span>
                <span className="text-[10px] text-neutral-500">JSON Backup</span>
              </button>

              {/* Import Button */}
              <button
                type="button"
                id="settings-import-btn"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{t.importData}</span>
                <span className="text-[10px] text-neutral-500">Restore file</span>
              </button>

              {/* Templates Button */}
              <button
                type="button"
                id="settings-templates-btn"
                onClick={onOpenTemplatesModal}
                className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{t.loadTemplates}</span>
                <span className="text-[10px] text-neutral-500">Starter packs</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>{t.storageStatus}:</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">{t.localDataSaved}</span>
          </div>
        </section>
      </div>

      {/* PWA App Installation Section */}
      {onOpenInstallModal && (
        <section className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
                <Download className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {t.installAppTitle}
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                    {isAppInstalled ? (language === 'ar' ? 'مثبّت' : 'Installed') : 'PWA Ready'}
                  </span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                  {t.installAppSubtitle}
                </p>
              </div>
            </div>

            <button
              id="settings-install-pwa-btn"
              type="button"
              onClick={onOpenInstallModal}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/25 transition-all cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4 stroke-[2.2]" />
              <span>{isAppInstalled ? (language === 'ar' ? 'إرشادات التطبيق' : 'App Guide') : t.installNow}</span>
            </button>
          </div>
        </section>
      )}

      {/* 5. Keyboard Shortcuts Cheat Sheet */}
      <section className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center">
            <Keyboard className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {t.keyboardShortcutsList}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {language === 'ar' ? 'استخدم اختصارات لوحة المفاتيح لتسريع إنجاز مهامك وإدارتها بكفاءة' : 'Boost productivity with fast keyboard actions across the application'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60 text-xs"
            >
              <span className="text-neutral-700 dark:text-neutral-300">{sc.desc}</span>
              <kbd className="px-2 py-1 font-mono text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg shadow-2xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Workspace Overview & Statistics */}
      <section className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-indigo-950/30 border border-emerald-200/60 dark:border-emerald-800/50 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 shrink-0">
              <CheckSquare className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {t.aboutApp}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {t.appName} v2.1.0 • {t.localDataSaved}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-neutral-700 dark:text-neutral-300">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{totalLists}</span>
              <span>{t.lists}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-teal-600 dark:text-teal-400">{totalGroups}</span>
              <span>{t.aisles}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{completedItems}/{totalItems}</span>
              <span>{t.items}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
