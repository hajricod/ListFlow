import React from 'react';
import {
  ListTodo,
  Menu,
  Settings,
} from 'lucide-react';
import { Language, Theme, SyncStatus } from '../types';
import { getTranslation } from '../locales/translations';
import { User } from 'firebase/auth';

interface NavbarProps {
  language: Language;
  onToggleLanguage?: () => void;
  theme?: Theme;
  onCycleTheme?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar: () => void;
  onLogoClick?: () => void;
  onOpenSettings?: () => void;
  syncStatus?: SyncStatus;
  onOpenInstallModal?: () => void;
  isAppInstalled?: boolean;
  currentView?: 'workspace' | 'settings';
  activeListName?: string;
  activeListColor?: string;
  isShared?: boolean;
  memberCount?: number;
  isReadOnly?: boolean;
  onOpenShareModal?: () => void;
  user?: User | null;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onToggleLanguage,
  theme = 'light',
  onCycleTheme,
  isSidebarOpen = false,
  onToggleSidebar,
  onLogoClick,
  onOpenSettings,
  syncStatus = 'idle',
  onOpenInstallModal,
  isAppInstalled = false,
  currentView = 'workspace',
  activeListName,
  activeListColor = '#10b981',
  isShared = false,
  memberCount = 1,
  isReadOnly = false,
  onOpenShareModal,
  user,
  onOpenAuthModal,
  onSignOut,
}) => {
  const t = getTranslation(language);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md transition-colors duration-200 pt-[env(safe-area-inset-top,0px)]">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-16 gap-3">
          {/* Left: Side Menu Toggle & Brand Logo & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <button
              id="sidebar-toggle-btn"
              type="button"
              onClick={onToggleSidebar}
              title={isSidebarOpen ? (language === 'ar' ? 'إخفاء القائمة الجانبية' : 'Hide side menu') : t.toggleSidebar}
              className={`p-2 rounded-xl transition-all cursor-pointer border shrink-0 ${
                isSidebarOpen
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 border-transparent'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              onClick={onLogoClick}
              className="flex items-center gap-2.5 cursor-pointer group min-w-0"
              title={t.backToWorkspace}
            >
              <div className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
                <ListTodo className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-base sm:text-lg tracking-tight text-neutral-900 dark:text-neutral-50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors block truncate">
                  {t.appName}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Settings Action */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {onOpenSettings && (
              <button
                id="nav-settings-btn"
                type="button"
                onClick={onOpenSettings}
                title={t.settings}
                className={`p-2 rounded-xl transition-all cursor-pointer border ${
                  currentView === 'settings'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 border-transparent'
                }`}
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

