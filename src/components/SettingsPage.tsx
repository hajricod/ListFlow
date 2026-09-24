import React, { useRef, useState, useEffect } from 'react';
import {
  ArrowLeft,
  Moon,
  Sun,
  Monitor,
  Download,
  Upload,
  Sparkles,
  LogIn,
  LogOut,
  RefreshCw,
  Check,
  Heart,
  Info,
  Type,
  ChevronDown,
} from 'lucide-react';
import { Language, SyncStatus, Theme, ThemeColor, FontFamily, FontSize, ShoppingList, ListGroup, ListItem, UserSubscription } from '../types';
import { getTranslation } from '../locales/translations';
import { THEME_COLOR_OPTIONS } from '../utils/themeColors';
import {
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_OPTIONS,
  getFontFamilyOption,
  getFontSizeOption,
} from '../utils/typography';
import { User } from 'firebase/auth';
import { AppLogo } from './AppLogo';
import { GoogleDriveBackupCard } from './GoogleDriveBackupCard';
import { SubscriptionSettingsCard } from './SubscriptionSettingsCard';
import { WorkspaceBackupData } from '../lib/googleDrive';
import { DEFAULT_FREE_SUBSCRIPTION } from '../utils/subscription';

interface SettingsPageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme: Theme;
  onThemeChange?: (theme: Theme) => void;
  onThemeToggle: () => void;
  themeColor?: ThemeColor;
  onThemeColorChange?: (color: ThemeColor) => void;
  fontFamily?: FontFamily;
  onFontFamilyChange?: (font: FontFamily) => void;
  fontSize?: FontSize;
  onFontSizeChange?: (size: FontSize) => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  gridColumns?: 1 | 2;
  onGridColumnsChange?: (cols: 1 | 2) => void;
  onOpenTemplatesModal: () => void;
  onOpenOnboarding?: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onOpenInstallModal?: () => void;
  isAppInstalled?: boolean;
  user?: User | null;
  syncStatus?: SyncStatus;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
  onBackToWorkspace: () => void;
  totalLists: number;
  totalGroups: number;
  totalItems: number;
  completedItems: number;
  lists?: ShoppingList[];
  groups?: ListGroup[];
  items?: ListItem[];
  onRestoreData?: (backup: WorkspaceBackupData, mode: 'replace' | 'merge') => void;
  showToast?: (message: string, duration?: number, type?: 'info' | 'success' | 'warning' | 'error') => void;
  subscription?: UserSubscription;
  onOpenUpgradeModal?: () => void;
  onUpdateSubscription?: (sub: UserSubscription) => Promise<void> | void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  onThemeToggle,
  themeColor = 'emerald',
  onThemeColorChange,
  fontFamily = 'default',
  onFontFamilyChange,
  fontSize = 'medium',
  onFontSizeChange,
  soundEnabled,
  onSoundToggle,
  gridColumns = 2,
  onGridColumnsChange,
  onOpenTemplatesModal,
  onOpenOnboarding,
  onExportData,
  onImportData,
  onOpenInstallModal,
  isAppInstalled = false,
  user,
  syncStatus = 'idle',
  onOpenAuthModal,
  onSignOut,
  onBackToWorkspace,
  lists = [],
  groups = [],
  items = [],
  onRestoreData,
  showToast,
  subscription = DEFAULT_FREE_SUBSCRIPTION,
  onOpenUpgradeModal,
  onUpdateSubscription,
}) => {
  const t = getTranslation(language);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dropdown state for Font Family and Font Size
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const sizeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(e.target as Node)) {
        setIsFontDropdownOpen(false);
      }
      if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(e.target as Node)) {
        setIsSizeDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFontDropdownOpen(false);
        setIsSizeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-12">
      {/* Hidden File Input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-200/80 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="settings-back-btn"
            onClick={onBackToWorkspace}
            className="p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title={t.backToWorkspace}
          >
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {t.settingsTitle}
          </h1>
        </div>
      </div>

      {/* 1. Account & Sync Card */}
      <div
        id="settings-account-sync-card"
        className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4"
      >
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          {user ? (
            user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-xl object-cover ring-1 ring-emerald-500/30 shrink-0 mt-0.5 sm:mt-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0 mt-0.5 sm:mt-0">
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            )
          ) : (
            <div className="w-11 h-11 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center font-bold text-base shadow-xs shrink-0 mt-0.5 sm:mt-0">
              G
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 break-words leading-tight">
                {user ? user.displayName || user.email : t.guestMode}
              </span>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1.5 shrink-0 ${
                  user
                    ? syncStatus === 'syncing'
                      ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                      : syncStatus === 'offline'
                      ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      : syncStatus === 'error'
                      ? 'bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-300'
                      : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {user ? (
                  syncStatus === 'syncing' ? (
                    <>
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      <span>{t.syncingToCloud}</span>
                    </>
                  ) : syncStatus === 'offline' ? (
                    <span>{t.syncOffline}</span>
                  ) : syncStatus === 'error' ? (
                    <span>{t.syncError}</span>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{t.syncedToCloud}</span>
                    </>
                  )
                ) : language === 'ar' ? (
                  'محلي'
                ) : (
                  'Local'
                )}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 break-words leading-relaxed line-clamp-2">
              {user ? user.email : t.guestModeDesc}
            </p>
          </div>
        </div>

        {/* Action Button: full width on mobile so it doesn't get squeezed with large fonts */}
        <div className="w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t border-neutral-200/60 dark:border-neutral-800/60 sm:border-t-0 flex justify-end">
          {user ? (
            onSignOut && (
              <button
                id="settings-signout-btn"
                type="button"
                onClick={onSignOut}
                className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-neutral-800 sm:bg-transparent sm:dark:bg-transparent border border-neutral-200/80 dark:border-neutral-700/80 sm:border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
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
                className="w-full sm:w-auto px-4 py-2.5 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.login}</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Subscription & Plan Card */}
      {onOpenUpgradeModal && onUpdateSubscription && (
        <SubscriptionSettingsCard
          language={language}
          user={user || null}
          subscription={subscription}
          onOpenUpgradeModal={onOpenUpgradeModal}
          onUpdateSubscription={onUpdateSubscription}
          showToast={showToast || (() => {})}
        />
      )}

      {/* 2. Preferences Section */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-1">
          {language === 'ar' ? 'التفضيلات' : 'Preferences'}
        </h2>

        <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl divide-y divide-neutral-200/60 dark:divide-neutral-800/60">
          {/* Language Toggle */}
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 block">
                {t.languageRegion}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {language === 'ar' ? 'العربية والإنجليزية' : 'English & Arabic (RTL)'}
              </span>
            </div>
            <div className="flex rounded-xl bg-neutral-200/70 dark:bg-neutral-800 p-1">
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('ar')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  language === 'ar'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                عربي
              </button>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 block">
                {t.appearance}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {theme === 'dark' ? t.darkMode : theme === 'system' ? t.systemMode : t.lightMode}
              </span>
            </div>
            <div className="flex rounded-xl bg-neutral-200/70 dark:bg-neutral-800 p-1">
              <button
                type="button"
                onClick={() => (onThemeChange ? onThemeChange('light') : onThemeToggle())}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white dark:bg-neutral-700 text-amber-600 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
                title={t.lightMode}
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => (onThemeChange ? onThemeChange('dark') : onThemeToggle())}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-white dark:bg-neutral-700 text-indigo-400 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
                title={t.darkMode}
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => (onThemeChange ? onThemeChange('system') : onThemeToggle())}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  theme === 'system'
                    ? 'bg-white dark:bg-neutral-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
                title={t.systemMode}
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Accent Color Palette */}
          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 block">
                {t.themeColor}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {THEME_COLOR_OPTIONS.find((c) => c.id === themeColor)?.[
                  language === 'ar' ? 'nameAr' : 'nameEn'
                ] || themeColor}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {THEME_COLOR_OPTIONS.map((opt) => {
                const isSelected = themeColor === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onThemeColorChange && onThemeColorChange(opt.id)}
                    title={language === 'ar' ? opt.nameAr : opt.nameEn}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white transition-transform cursor-pointer hover:scale-110 active:scale-95"
                    style={{ backgroundColor: opt.hex }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Family Dropdown Menu */}
          <div className="p-3.5 space-y-2 relative" ref={fontDropdownRef}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 block">
                    {t.fontFamily}
                  </span>
                </div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 block mt-0.5">
                  {t.fontFamilyDesc}
                </span>
              </div>
            </div>

            {/* Dropdown Menu Trigger Button */}
            <div className="relative">
              <button
                id="font-family-dropdown-trigger"
                type="button"
                onClick={() => {
                  setIsFontDropdownOpen((prev) => !prev);
                  setIsSizeDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-start transition-all cursor-pointer bg-white/80 dark:bg-neutral-800/80 ${
                  isFontDropdownOpen
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-neutral-200/90 dark:border-neutral-700/80 hover:border-neutral-300 dark:hover:border-neutral-600'
                }`}
                aria-haspopup="listbox"
                aria-expanded={isFontDropdownOpen}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    Aa
                  </div>
                  <div className="min-w-0">
                    <span
                      className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate block"
                      style={{
                        fontFamily:
                          language === 'ar'
                            ? getFontFamilyOption(fontFamily).fontFamilyArabic
                            : getFontFamilyOption(fontFamily).fontFamilyLatin,
                      }}
                    >
                      {language === 'ar'
                        ? getFontFamilyOption(fontFamily).nameAr
                        : getFontFamilyOption(fontFamily).nameEn}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-neutral-400 dark:text-neutral-500">
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isFontDropdownOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Floating Dropdown Menu Panel */}
              {isFontDropdownOpen && (
                <div
                  id="font-family-dropdown-menu"
                  className="absolute z-30 start-0 end-0 mt-1.5 max-h-72 overflow-y-auto rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-700/80 shadow-xl p-1.5 space-y-1 backdrop-blur-md"
                  role="listbox"
                >
                  {FONT_FAMILY_OPTIONS.map((opt) => {
                    const isSelected = fontFamily === opt.id;
                    const fontCss = language === 'ar' ? opt.fontFamilyArabic : opt.fontFamilyLatin;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          onFontFamilyChange && onFontFamilyChange(opt.id);
                          setIsFontDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-start transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-800/80'
                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 border border-transparent'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm font-semibold truncate"
                              style={{ fontFamily: fontCss }}
                            >
                              {language === 'ar' ? opt.nameAr : opt.nameEn}
                            </span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 shrink-0">
                              {language === 'ar' ? opt.categoryAr : opt.categoryEn}
                            </span>
                          </div>
                          <p
                            className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5"
                            style={{ fontFamily: fontCss }}
                          >
                            {language === 'ar' ? opt.sampleAr : opt.sampleEn}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Font & Display Size Dropdown Menu */}
          <div className="p-3.5 space-y-2 relative" ref={sizeDropdownRef}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 block">
                  {t.fontSize}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 block mt-0.5">
                  {t.fontSizeDesc}
                </span>
              </div>
            </div>

            {/* Dropdown Trigger */}
            <div className="relative">
              <button
                id="font-size-dropdown-trigger"
                type="button"
                onClick={() => {
                  setIsSizeDropdownOpen((prev) => !prev);
                  setIsFontDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-start transition-all cursor-pointer bg-white/80 dark:bg-neutral-800/80 ${
                  isSizeDropdownOpen
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-neutral-200/90 dark:border-neutral-700/80 hover:border-neutral-300 dark:hover:border-neutral-600'
                }`}
                aria-haspopup="listbox"
                aria-expanded={isSizeDropdownOpen}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 flex items-center justify-center shrink-0 text-neutral-700 dark:text-neutral-300 font-bold text-xs">
                    {getFontSizeOption(fontSize).basePx}px
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {language === 'ar'
                          ? getFontSizeOption(fontSize).nameAr
                          : getFontSizeOption(fontSize).nameEn}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 shrink-0">
                        {getFontSizeOption(fontSize).scalePercent}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-neutral-400 dark:text-neutral-500">
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isSizeDropdownOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Floating Dropdown Menu Panel */}
              {isSizeDropdownOpen && (
                <div
                  id="font-size-dropdown-menu"
                  className="absolute z-30 start-0 end-0 mt-1.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-700/80 shadow-xl p-1.5 space-y-1 backdrop-blur-md"
                  role="listbox"
                >
                  {FONT_SIZE_OPTIONS.map((opt) => {
                    const isSelected = fontSize === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          onFontSizeChange && onFontSizeChange(opt.id);
                          setIsSizeDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-start transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-800/80'
                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 border border-transparent'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              {language === 'ar' ? opt.nameAr : opt.nameEn}
                            </span>
                            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 shrink-0">
                              {opt.basePx}px ({opt.scalePercent}%)
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {language === 'ar' ? opt.descAr : opt.descEn}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Live Typography Preview Card */}
            <div className="mt-2 p-3 rounded-xl bg-white/70 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-700/60 space-y-2">
              <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                <span>{t.previewTypography}</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200/50 dark:border-neutral-800">
                <div className="w-4 h-4 rounded border-2 border-emerald-500 bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {t.fontStylePreview}
                  </p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 shrink-0">
                  {language === 'ar' ? 'مكتمل' : 'Done'}
                </span>
              </div>
            </div>
          </div>

          {/* Grid Columns */}
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 block">
                {language === 'ar' ? 'تخطيط المجموعات' : 'Layout Columns'}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {gridColumns === 2 ? t.twoColumns : t.oneColumn}
              </span>
            </div>
            <div className="flex rounded-xl bg-neutral-200/70 dark:bg-neutral-800 p-1">
              <button
                type="button"
                onClick={() => onGridColumnsChange && onGridColumnsChange(1)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  gridColumns === 1
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                1 {language === 'ar' ? 'عمود' : 'Col'}
              </button>
              <button
                type="button"
                onClick={() => onGridColumnsChange && onGridColumnsChange(2)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  gridColumns === 2
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                2 {language === 'ar' ? 'أعمدة' : 'Cols'}
              </button>
            </div>
          </div>

          {/* Sound Toggle */}
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 block">
                {t.audioFeedback}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {soundEnabled ? t.soundOn : t.soundOff}
              </span>
            </div>
            <button
              type="button"
              id="sound-toggle-switch"
              onClick={onSoundToggle}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                soundEnabled ? 'bg-emerald-600' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  soundEnabled ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Data & Tools Section */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-1">
          {t.dataManagement}
        </h2>

        {/* Google Drive Cloud Backup & Restore (Free Local & Cloud Users) */}
        {onRestoreData && showToast && (
          <GoogleDriveBackupCard
            language={language}
            user={user || null}
            lists={lists}
            groups={groups}
            items={items}
            onRestoreData={onRestoreData}
            showToast={showToast}
          />
        )}

        <div className="pt-1">
          <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 px-1 block mb-2">
            {language === 'ar' ? 'أدوات التصدير المحلية والقوالب' : 'Offline Export & List Templates'}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={onExportData}
            className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              {t.exportData}
            </span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              {t.importData}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenTemplatesModal}
            className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              {t.loadTemplates}
            </span>
          </button>

          {onOpenInstallModal && (
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {isAppInstalled ? (language === 'ar' ? 'التطبيق' : 'PWA') : t.installAppTitle}
              </span>
            </button>
          )}
          </div>
        </div>
      </div>

      {/* 4. Keyboard Shortcuts */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-1">
          {t.keyboardShortcutsList}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 text-xs"
            >
              <span className="text-neutral-600 dark:text-neutral-400 truncate me-1">
                {sc.desc}
              </span>
              <kbd className="px-1.5 py-0.5 font-mono text-[10px] font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded shadow-2xs shrink-0">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>

      {/* 5. About the App Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-1">
          {language === 'ar' ? 'عن التطبيق' : 'About the App'}
        </h2>
        
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-neutral-950 border border-emerald-200/90 dark:border-neutral-800 flex items-center justify-center p-1.5 shrink-0 shadow-2xs">
                <AppLogo className="w-full h-full" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  List Flow
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {language === 'ar' ? 'الإصدار 1.0.0' : 'Version 1.0.0'}
                </p>
              </div>
            </div>

            {onOpenOnboarding && (
              <button
                type="button"
                onClick={onOpenOnboarding}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200/80 dark:border-neutral-700 transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'دليل الاستخدام' : 'Quick Tour'}
              </button>
            )}
          </div>

          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {language === 'ar'
              ? 'تطبيق سريع ومرن لإدارة القوائم والمهام، يدعم التعاون المباشر والمزامنة السحابية الفورية والعمل دون اتصال بالإنترنت.'
              : 'A clean, fast task and list management app featuring real-time collaboration, cloud synchronization, and full offline support.'}
          </p>

          <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500">
            <div className="flex items-center gap-1">
              <span>{language === 'ar' ? 'صنع بكل' : 'Crafted with'}</span>
              <Heart className="w-3 h-3 text-red-500 fill-current inline" />
            </div>
            <span>
              {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
