/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  AppList,
  AppView,
  ListGroup,
  ListItem,
  Language,
  Theme,
  ThemeColor,
  FilterState,
  Priority,
  SortOption,
  ToastMessage,
  SyncStatus,
  PendingInvitation,
  ShareRole,
  ShareMember,
} from './types';
import {
  loadStoredLists,
  saveStoredLists,
  loadActiveListId,
  saveActiveListId,
  loadStoredGroups,
  saveStoredGroups,
  loadStoredItems,
  saveStoredItems,
  loadStoredLanguage,
  saveStoredLanguage,
  loadStoredTheme,
  saveStoredTheme,
  loadStoredThemeColor,
  saveStoredThemeColor,
  loadStoredSound,
  saveStoredSound,
  loadStoredGridColumns,
  saveStoredGridColumns,
  loadStoredOnboardingSeen,
  saveStoredOnboardingSeen,
  getLocalizedTemplate,
  TemplateKey,
  SEED_TEMPLATES,
} from './utils/storage';
import { getTranslation } from './locales/translations';
import { sounds } from './utils/audio';
import { applyThemeColorToDOM, getThemeColorOption } from './utils/themeColors';

import { Navbar } from './components/Navbar';
import { SideMenu } from './components/SideMenu';
import { SettingsPage } from './components/SettingsPage';
import { ListModal } from './components/ListModal';
import { StatsBanner } from './components/StatsBanner';
import { GroupCard } from './components/GroupCard';
import { ItemModal } from './components/ItemModal';
import { GroupModal } from './components/GroupModal';
import { TemplatesModal } from './components/TemplatesModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ConfirmModal } from './components/ConfirmModal';
import { InstallAppModal } from './components/InstallAppModal';
import { AuthModal } from './components/AuthModal';
import { ShareListModal } from './components/ShareListModal';
import { JoinListModal } from './components/JoinListModal';
import { OnboardingModal } from './components/OnboardingModal';
import { ToastContainer } from './components/Toast';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useAuth } from './hooks/useAuth';
import {
  fetchUserCloudData,
  fetchUserProfilePreferences,
  subscribeToUserCloudData,
  syncAllToFirestore,
  syncUserProfile,
  shareListWithUser,
  updateMemberRole,
  removeMemberFromList,
  leaveSharedList,
  acceptListInvitation,
  rejectListInvitation,
  fetchListShareDetails,
  listenToPendingInvitations,
  updateListShareLinkSettings,
  deleteItemFromFirestore,
  deleteItemsFromFirestore,
  deleteGroupFromFirestore,
  deleteListFromFirestore,
} from './utils/firestoreSync';
import { Plus, ListTodo, Layers, Users, Check } from 'lucide-react';

export default function App() {
  // 1. Core State
  const [language, setLanguage] = useState<Language>(() => loadStoredLanguage());
  const [theme, setTheme] = useState<Theme>(() => loadStoredTheme());
  const [themeColor, setThemeColor] = useState<ThemeColor>(() => loadStoredThemeColor());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => loadStoredSound());

  // PWA Installation Hook
  const pwa = usePWAInstall();

  // Authentication & Cloud Sync
  const {
    user,
    loading: authLoading,
    isLoggingIn,
    error: authError,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
    signOut: authSignOut,
    clearError: clearAuthError,
  } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const prevUserRef = React.useRef<string | null | undefined>(undefined);
  const currentActiveUserIdRef = React.useRef<string | null | undefined>(undefined);
  const isInitialCloudLoadRef = React.useRef<boolean>(false);
  const isRemoteSyncRef = React.useRef<boolean>(false);
  const syncTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const prefSyncTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const [lists, setLists] = useState<AppList[]>(() => loadStoredLists());
  const [activeListId, setActiveListId] = useState<string>(() => loadActiveListId(lists));
  const [currentView, setCurrentView] = useState<AppView>('workspace');

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const [groups, setGroups] = useState<ListGroup[]>(() => loadStoredGroups());
  const [items, setItems] = useState<ListItem[]>(() => loadStoredItems());

  // 2. Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [gridColumns, setGridColumns] = useState<1 | 2>(() => loadStoredGridColumns());
  const [filterState, setFilterState] = useState<FilterState>({
    search: '',
    status: 'all',
    priority: 'all',
    tag: null,
    sortBy: 'manual',
    sortDirection: 'asc',
  });

  useEffect(() => {
    saveStoredGridColumns(gridColumns, user?.uid);
  }, [gridColumns, user?.uid]);

  // 3. Modals & Dialog State
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [selectedListForEdit, setSelectedListForEdit] = useState<AppList | null>(null);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<ListItem | null>(null);
  const [defaultGroupIdForItem, setDefaultGroupIdForItem] = useState<string | undefined>();

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<ListGroup | null>(null);

  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedListForShare, setSelectedListForShare] = useState<AppList | null>(null);

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinModalInvitation, setJoinModalInvitation] = useState<PendingInvitation | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);

  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // 4. Drag & Drop State
  const [draggingGroupId, setDraggingGroupId] = useState<string | null>(null);
  const [groupDropTargetId, setGroupDropTargetId] = useState<string | null>(null);
  const [groupDropPosition, setGroupDropPosition] = useState<'above' | 'below' | null>(null);

  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [itemDropTargetId, setItemDropTargetId] = useState<string | null>(null);
  const [itemDropPosition, setItemDropPosition] = useState<'above' | 'below' | null>(null);

  const t = getTranslation(language);

  // Sync Language and Direction with DOM and update standard list names
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    saveStoredLanguage(language, user?.uid);

    // Synchronize default lists and template titles when language toggles
    setLists((prevLists) =>
      prevLists.map((l) => {
        if (l.id === 'list-groceries') {
          return {
            ...l,
            title: language === 'ar' ? 'مقاضي الأسرة الأسبوعية' : 'Weekly Groceries',
            description:
              language === 'ar'
                ? 'المستلزمات الأسبوعية والخضار والمؤونة'
                : 'Weekly food essentials, fresh produce, and pantry staples',
          };
        }
        if (l.id === 'list-work') {
          return {
            ...l,
            title: language === 'ar' ? 'مهام العمل والمشاريع' : 'Work Sprint',
            description:
              language === 'ar'
                ? 'مراحل المشروع ومهام البرمجة والتصميم'
                : 'Sprint milestones, client deliverables, and design tasks',
          };
        }
        if (l.id === 'list-personal') {
          return {
            ...l,
            title: language === 'ar' ? 'الأهداف والعادات الشخصية' : 'Personal Goals',
            description:
              language === 'ar'
                ? 'العادات اليومية والرياضة وتطوير الذات'
                : 'Daily routines, reading list, and wellness tracking',
          };
        }

        const templateKeys: TemplateKey[] = ['weekly', 'freshMarket', 'bbq', 'pantry'];
        for (const key of templateKeys) {
          const enTpl = getLocalizedTemplate(key, 'en');
          const arTpl = getLocalizedTemplate(key, 'ar');
          if (l.title === enTpl.name || l.title === arTpl.name) {
            return {
              ...l,
              title: language === 'ar' ? arTpl.name : enTpl.name,
              description: language === 'ar' ? arTpl.desc : enTpl.desc,
            };
          }
        }
        return l;
      })
    );
  }, [language, user?.uid]);

  // Theme Cycling helper
  const cycleTheme = useCallback(() => {
    sounds.playPop();
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light';
      saveStoredTheme(next, user?.uid);
      if (user) {
        syncUserProfile(user, { theme: next }).catch((err) => {
          console.warn('Theme profile sync warning:', err);
        });
      }
      return next;
    });
  }, [user]);

  // Direct User Preference Actions (Immediate local state + LocalStorage + Cloud DB sync)
  const handleLanguageChange = useCallback(
    (newLang: Language) => {
      sounds.playPop();
      setLanguage(newLang);
      saveStoredLanguage(newLang, user?.uid);
      document.documentElement.lang = newLang;
      document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';

      if (user) {
        syncUserProfile(user, { language: newLang }).catch((err) => {
          console.warn('Language profile sync warning:', err);
        });
      }
    },
    [user]
  );

  const handleThemeChange = useCallback(
    (newTheme: Theme) => {
      sounds.playPop();
      setTheme(newTheme);
      saveStoredTheme(newTheme, user?.uid);
      if (user) {
        syncUserProfile(user, { theme: newTheme }).catch((err) => {
          console.warn('Theme profile sync warning:', err);
        });
      }
    },
    [user]
  );

  const handleThemeColorChange = useCallback(
    (newColor: ThemeColor) => {
      setThemeColor(newColor);
      saveStoredThemeColor(newColor, user?.uid);
      applyThemeColorToDOM(newColor);
      if (user) {
        syncUserProfile(user, { themeColor: newColor }).catch((err) => {
          console.warn('Theme color profile sync warning:', err);
        });
      }
    },
    [user]
  );

  const handleSoundToggle = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      sounds.setEnabled(next);
      saveStoredSound(next, user?.uid);
      if (user) {
        syncUserProfile(user, { soundEnabled: next }).catch((err) => {
          console.warn('Sound profile sync warning:', err);
        });
      }
      return next;
    });
  }, [user]);

  // First-time user onboarding trigger
  useEffect(() => {
    const hasSeenOnboarding = loadStoredOnboardingSeen(user?.uid);
    if (!hasSeenOnboarding) {
      const timer = setTimeout(() => {
        setIsOnboardingModalOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user?.uid]);

  const handleCloseOnboarding = useCallback(() => {
    setIsOnboardingModalOpen(false);
    saveStoredOnboardingSeen(true, user?.uid);
  }, [user?.uid]);

  const handleGridColumnsChange = useCallback(
    (cols: 1 | 2) => {
      sounds.playPop();
      setGridColumns(cols);
      saveStoredGridColumns(cols, user?.uid);
      if (user) {
        syncUserProfile(user, { gridColumns: cols }).catch((err) => {
          console.warn('Grid columns profile sync warning:', err);
        });
      }
    },
    [user]
  );

  // Sync Theme with DOM and System Preference
  useEffect(() => {
    const applyTheme = () => {
      let isDark = false;
      if (theme === 'dark') {
        isDark = true;
      } else if (theme === 'light') {
        isDark = false;
      } else if (theme === 'system') {
        isDark =
          typeof window !== 'undefined' &&
          window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    };

    applyTheme();
    saveStoredTheme(theme, user?.uid);

    // If theme is set to 'system', dynamically listen for OS-level dark mode switches
    if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleMediaChange = () => {
        applyTheme();
      };
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleMediaChange);
        return () => mediaQuery.removeEventListener('change', handleMediaChange);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleMediaChange);
        return () => mediaQuery.removeListener(handleMediaChange);
      }
    }
  }, [theme, user?.uid]);

  // Sync Theme Color with DOM and LocalStorage
  useEffect(() => {
    saveStoredThemeColor(themeColor, user?.uid);
    applyThemeColorToDOM(themeColor);
  }, [themeColor, user?.uid]);

  // Sync Sound
  useEffect(() => {
    sounds.setEnabled(soundEnabled);
    saveStoredSound(soundEnabled, user?.uid);
  }, [soundEnabled, user?.uid]);

  // Sync Lists to LocalStorage
  useEffect(() => {
    saveStoredLists(lists, user?.uid);
  }, [lists, user?.uid]);

  useEffect(() => {
    saveActiveListId(activeListId, user?.uid);
  }, [activeListId, user?.uid]);

  // Sync Groups & Items to LocalStorage
  useEffect(() => {
    saveStoredGroups(groups, user?.uid);
  }, [groups, user?.uid]);

  useEffect(() => {
    saveStoredItems(items, user?.uid);
  }, [items, user?.uid]);

  // Toast Helper
  const showToast = useCallback(
    (message: string, undoAction?: () => void, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const newToast: ToastMessage = { id, message, undoAction, type };
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 5000);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Centralized Helper to Apply and Cache User Preferences
  const applyUserPreferences = useCallback(
    (
      prefs: {
        language?: Language;
        theme?: Theme;
        themeColor?: ThemeColor;
        soundEnabled?: boolean;
        gridColumns?: 1 | 2;
        activeListId?: string;
      },
      uid?: string | null
    ) => {
      if (prefs.language && (prefs.language === 'en' || prefs.language === 'ar')) {
        setLanguage(prefs.language);
        saveStoredLanguage(prefs.language, uid);
        document.documentElement.lang = prefs.language;
        document.documentElement.dir = prefs.language === 'ar' ? 'rtl' : 'ltr';
      }
      if (
        prefs.theme &&
        (prefs.theme === 'light' || prefs.theme === 'dark' || prefs.theme === 'system')
      ) {
        setTheme(prefs.theme);
        saveStoredTheme(prefs.theme, uid);
      }
      if (prefs.themeColor) {
        setThemeColor(prefs.themeColor);
        saveStoredThemeColor(prefs.themeColor, uid);
        applyThemeColorToDOM(prefs.themeColor);
      }
      if (typeof prefs.soundEnabled === 'boolean') {
        setSoundEnabled(prefs.soundEnabled);
        sounds.setEnabled(prefs.soundEnabled);
        saveStoredSound(prefs.soundEnabled, uid);
      }
      if (prefs.gridColumns === 1 || prefs.gridColumns === 2) {
        setGridColumns(prefs.gridColumns);
        saveStoredGridColumns(prefs.gridColumns, uid);
      }
      if (prefs.activeListId) {
        setActiveListId(prefs.activeListId);
        saveActiveListId(prefs.activeListId, uid);
      }
    },
    []
  );

  // Switch Data & Preferences Context based on Auth User Login / Logout
  useEffect(() => {
    if (authLoading) return;

    const currentUid = user?.uid || null;

    if (prevUserRef.current === undefined) {
      prevUserRef.current = currentUid;
      currentActiveUserIdRef.current = currentUid;
      const initialLists = loadStoredLists(currentUid);
      const initialGroups = loadStoredGroups(currentUid);
      const initialItems = loadStoredItems(currentUid);
      const initialActiveListId = loadActiveListId(initialLists, currentUid);
      const initialLang = loadStoredLanguage(currentUid);
      const initialTheme = loadStoredTheme(currentUid);
      const initialThemeColor = loadStoredThemeColor(currentUid);
      const initialSound = loadStoredSound(currentUid);
      const initialGrid = loadStoredGridColumns(currentUid);

      setLists(initialLists);
      setGroups(initialGroups);
      setItems(initialItems);
      setActiveListId(initialActiveListId);
      setLanguage(initialLang);
      setTheme(initialTheme);
      setThemeColor(initialThemeColor);
      setSoundEnabled(initialSound);
      setGridColumns(initialGrid);

      // If already logged in on initial load, fetch remote cloud preferences from Firestore
      if (currentUid) {
        fetchUserProfilePreferences(currentUid).then((cloudPrefs) => {
          if (cloudPrefs && currentActiveUserIdRef.current === currentUid) {
            applyUserPreferences(cloudPrefs, currentUid);
          }
        }).catch((err) => {
          console.warn('Initial fetchUserProfilePreferences warning:', err);
        });
      }
    } else if (prevUserRef.current !== currentUid) {
      const isLogout = currentUid === null;
      prevUserRef.current = currentUid;
      currentActiveUserIdRef.current = currentUid;

      const userLists = loadStoredLists(currentUid);
      const userGroups = loadStoredGroups(currentUid);
      const userItems = loadStoredItems(currentUid);
      const userActiveListId = loadActiveListId(userLists, currentUid);
      const userLang = loadStoredLanguage(currentUid);
      const userTheme = loadStoredTheme(currentUid);
      const userThemeColor = loadStoredThemeColor(currentUid);
      const userSound = loadStoredSound(currentUid);
      const userGrid = loadStoredGridColumns(currentUid);

      setLists(userLists);
      setGroups(userGroups);
      setItems(userItems);
      setActiveListId(userActiveListId);
      setLanguage(userLang);
      setTheme(userTheme);
      setThemeColor(userThemeColor);
      setSoundEnabled(userSound);
      setGridColumns(userGrid);

      if (currentUid) {
        // Fetch and apply cloud preferences from database upon login
        fetchUserProfilePreferences(currentUid).then((cloudPrefs) => {
          if (cloudPrefs && currentActiveUserIdRef.current === currentUid) {
            applyUserPreferences(cloudPrefs, currentUid);
          }
        }).catch((err) => {
          console.warn('Login fetchUserProfilePreferences warning:', err);
        });
      }

      if (isLogout) {
        setSyncStatus('idle');
        showToast(t.logoutSuccess, undefined, 'info');
      }
    }
  }, [authLoading, user?.uid, showToast, t.logoutSuccess, applyUserPreferences]);

  // Auth User Cloud Sync & Real-Time Multi-Device / Multi-Browser Subscription
  useEffect(() => {
    if (!user?.uid || authLoading) {
      return;
    }

    isInitialCloudLoadRef.current = true;
    setSyncStatus('syncing');

    const unsubscribe = subscribeToUserCloudData(
      user.uid,
      (cloudData) => {
        if (cloudData.lists && cloudData.lists.length > 0) {
          isRemoteSyncRef.current = true;
          setLists(cloudData.lists);
          saveStoredLists(cloudData.lists, user.uid);
          if (cloudData.groups) {
            setGroups(cloudData.groups);
            saveStoredGroups(cloudData.groups, user.uid);
          }
          if (cloudData.items) {
            setItems(cloudData.items);
            saveStoredItems(cloudData.items, user.uid);
          }

          // Keep selectedListForShare synchronized with incoming cloud updates
          setSelectedListForShare((curr) =>
            curr ? cloudData.lists.find((l) => l.id === curr.id) || null : null
          );

          // Apply cloud preferences from Firestore on initial cloud load ONLY
          if (cloudData.preferences && isInitialCloudLoadRef.current) {
            applyUserPreferences(cloudData.preferences, user.uid);
          }

          if (isInitialCloudLoadRef.current) {
            showToast(t.loginSuccess, undefined, 'success');
            isInitialCloudLoadRef.current = false;
          }

          // Ensure activeListId points to a valid list
          setActiveListId((curr) => {
            const listExists = cloudData.lists.some((l) => l.id === curr);
            const validId = listExists ? curr : cloudData.lists[0]?.id || curr;
            saveActiveListId(validId, user.uid);
            return validId;
          });

          setSyncStatus('synced');
        } else if (isInitialCloudLoadRef.current) {
          // New user initial database seed with user's local items
          const currentLocalLists = loadStoredLists(user.uid);
          const currentLocalGroups = loadStoredGroups(user.uid);
          const currentLocalItems = loadStoredItems(user.uid);

          syncAllToFirestore(user.uid, currentLocalLists, currentLocalGroups, currentLocalItems);
          syncUserProfile(user, {
            language,
            theme,
            themeColor,
            soundEnabled,
            gridColumns,
            activeListId,
          });
          isInitialCloudLoadRef.current = false;
          showToast(t.loginSuccess, undefined, 'success');
          setSyncStatus('synced');
        }
      },
      (err) => {
        console.error('Real-time subscription error:', err);
        setSyncStatus('error');
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.uid, authLoading, showToast, t.loginSuccess, applyUserPreferences]);

  // Reactive Data Sync whenever Lists, Groups, or Items change locally
  useEffect(() => {
    if (!user || isInitialCloudLoadRef.current) return;

    // Safety: ensure current loaded state is for this authenticated user
    if (currentActiveUserIdRef.current !== user.uid) return;

    // If change was initiated by a remote Firestore snapshot, skip pushing back to Firestore
    if (isRemoteSyncRef.current) {
      isRemoteSyncRef.current = false;
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('syncing');

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Filter only lists owned by this user or where they are an active collaborator
    const validLists = lists.filter(
      (l) =>
        !l.ownerId ||
        l.ownerId === 'guest' ||
        l.ownerId === 'local-user' ||
        l.ownerId === user.uid ||
        l.collaboratorUids?.includes(user.uid) ||
        Boolean(l.collaborators?.[user.uid])
    );

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const ok = await syncAllToFirestore(user.uid, validLists, groups, items);
        setSyncStatus(ok ? 'synced' : 'error');
      } catch (err) {
        console.error('Auto sync to Firestore failed:', err);
        setSyncStatus('error');
      }
    }, 400);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [user, lists, groups, items]);

  // Reactive User Preferences Sync to Database (Theme, Accent Color, Language, Sound, Grid Columns, Active List)
  useEffect(() => {
    if (!user || isInitialCloudLoadRef.current) return;
    if (currentActiveUserIdRef.current !== user.uid) return;

    if (prefSyncTimeoutRef.current) {
      clearTimeout(prefSyncTimeoutRef.current);
    }

    prefSyncTimeoutRef.current = setTimeout(async () => {
      try {
        await syncUserProfile(user, {
          language,
          theme,
          themeColor,
          soundEnabled,
          gridColumns,
          activeListId,
        });
      } catch (err) {
        console.error('Preferences sync to Firestore failed:', err);
      }
    }, 500);

    return () => {
      if (prefSyncTimeoutRef.current) {
        clearTimeout(prefSyncTimeoutRef.current);
      }
    };
  }, [user, language, theme, themeColor, soundEnabled, gridColumns, activeListId]);

  // Handle Online / Offline Connectivity Resumption
  useEffect(() => {
    const handleOnline = () => {
      if (user) {
        setSyncStatus('syncing');
        syncAllToFirestore(user.uid, lists, groups, items).then((ok) => {
          setSyncStatus(ok ? 'synced' : 'error');
        });
      }
    };

    const handleOffline = () => {
      if (user) {
        setSyncStatus('offline');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, lists, groups, items]);

  // Active List Derived Groups & Items
  const activeList = useMemo(() => {
    return lists.find((l) => l.id === activeListId) || lists[0];
  }, [lists, activeListId]);
  const activeListColor =
    activeList?.color && activeList.color !== '#10b981'
      ? activeList.color
      : getThemeColorOption(themeColor).hex;

  // Role and Permissions for Active List
  const isOwner = useMemo(() => {
    if (!activeList?.ownerId) return true;
    if (!user) return true;
    return activeList.ownerId === user.uid || activeList.ownerId === 'local-user';
  }, [activeList?.ownerId, user]);

  const isShared = useMemo(() => {
    return Boolean(
      activeList?.isShared ||
      (activeList?.ownerId && user && activeList.ownerId !== user.uid && activeList.ownerId !== 'local-user') ||
      (activeList?.collaboratorUids && activeList.collaboratorUids.length > 1) ||
      (activeList?.invitedEmails && activeList.invitedEmails.length > 0)
    );
  }, [activeList, user]);

  const userRole = useMemo((): ShareRole => {
    if (isOwner) return 'owner';
    if (activeList?.myRole) return activeList.myRole;
    if (!user) return 'read';

    const userEmailNorm = (user.email || '').toLowerCase().trim();
    const emailKey = userEmailNorm ? userEmailNorm.replace(/[\.\#\$\[\]]/g, '_') : '';
    const collaborators = activeList?.collaborators || {};

    const member =
      collaborators[user.uid] ||
      (emailKey ? collaborators[emailKey] : undefined) ||
      (Object.values(collaborators) as ShareMember[]).find(
        (m: ShareMember) =>
          (m.uid && m.uid === user.uid) ||
          (m.email && m.email.toLowerCase() === userEmailNorm)
      );

    if (member?.role) return member.role;

    if (activeList?.shareLinkEnabled && activeList.shareLinkRole) {
      return activeList.shareLinkRole;
    }

    if (activeList?.collaboratorUids?.includes(user.uid)) {
      return 'edit';
    }

    return 'edit';
  }, [isOwner, user, activeList]);

  const isReadOnly = useMemo(() => {
    return !isOwner && userRole === 'read';
  }, [isOwner, userRole]);

  // Real-time Pending Invitations for Logged In User
  useEffect(() => {
    if (!user?.email) {
      setPendingInvitations([]);
      return;
    }
    const unsubscribe = listenToPendingInvitations(user.email, (invites) => {
      setPendingInvitations(invites);
    });
    return () => {
      unsubscribe();
    };
  }, [user?.email]);

  // Handle ?joinList=LIST_ID or ?share=LIST_ID in URL query parameters on initial page load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const shareListId = urlParams.get('joinList') || urlParams.get('share');
    const shareToken = urlParams.get('token') || '';
    if (shareListId) {
      window.history.replaceState({}, document.title, window.location.pathname);
      (async () => {
        const details = await fetchListShareDetails(shareListId);
        if (details) {
          if (shareToken) {
            details.inviteToken = shareToken;
          }
          setJoinModalInvitation(details);
          setIsJoinModalOpen(true);
        } else {
          showToast(
            language === 'ar'
              ? 'رابط المشاركة غير صالح أو انتهت صلاحيته'
              : 'Shared list link is invalid or expired',
            undefined,
            'error'
          );
        }
      })();
    }
  }, [language, showToast]);

  const activeGroups = useMemo(() => {
    return groups.filter((g) => (g.listId || 'list-groceries') === activeListId);
  }, [groups, activeListId]);

  const activeListGroupIds = useMemo(() => new Set(activeGroups.map((g) => g.id)), [activeGroups]);

  const activeListItems = useMemo(() => {
    return items.filter((i) => activeListGroupIds.has(i.groupId));
  }, [items, activeListGroupIds]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        (activeEl as HTMLElement)?.isContentEditable;

      if (isInput) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setSelectedItemForEdit(null);
        setDefaultGroupIdForItem(activeGroups[0]?.id);
        setIsItemModalOpen(true);
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setSelectedGroupForEdit(null);
        setIsGroupModalOpen(true);
      } else if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('main-search-input');
        searchInput?.focus();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        handleLanguageChange(language === 'en' ? 'ar' : 'en');
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        cycleTheme();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGroups, language, handleLanguageChange, cycleTheme]);

  // Derived Task Calculations for Active List
  const totalItems = activeListItems.length;
  const collectedItems = activeListItems.filter((i) => i.completed).length;
  const remainingItems = totalItems - collectedItems;

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    activeListItems.forEach((item) => {
      item?.tags?.forEach((tag) => set.add(tag));
    });
    return Array.from(set);
  }, [activeListItems]);

  const allCollapsed = useMemo(() => {
    return activeGroups.length > 0 && activeGroups.every((g) => g.isCollapsed);
  }, [activeGroups]);

  // Filter & Search Logic within Active List
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return activeListItems.filter((item) => {
      // 1. Search Query
      if (q) {
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchNotes = item.notes?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
        const matchUnit = item.unit?.toLowerCase().includes(q);
        const groupObj = activeGroups.find((g) => g.id === item.groupId);
        const matchGroup = groupObj?.title.toLowerCase().includes(q);
        if (!matchTitle && !matchNotes && !matchUnit && !matchGroup) {
          return false;
        }
      }

      // 2. Status & Hide Completed Filter
      if (filterState.hideCompleted && item.completed) return false;
      if (filterState.status === 'active' && item.completed) return false;
      if (filterState.status === 'completed' && !item.completed) return false;

      // 3. Priority
      if (filterState.priority !== 'all' && item.priority !== filterState.priority) return false;

      return true;
    });
  }, [activeListItems, searchQuery, filterState, activeGroups]);

  // Group Items Organizer with Sorting & Pinning
  const getGroupSortedItems = useCallback(
    (groupId: string) => {
      const groupItems = filteredItems.filter((i) => i.groupId === groupId);

      // Separate pinned and unpinned
      const pinned = groupItems.filter((i) => i.isPinned);
      const unpinned = groupItems.filter((i) => !i.isPinned);

      const sortFn = (a: ListItem, b: ListItem) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        if (filterState.sortBy === 'alphabetical') {
          return a.title.localeCompare(b.title);
        } else if (filterState.sortBy === 'quantity') {
          return (b.quantity || 1) - (a.quantity || 1);
        } else if (filterState.sortBy === 'createdAt') {
          return b.createdAt.localeCompare(a.createdAt);
        }
        return 0;
      };

      return [...pinned.sort(sortFn), ...unpinned.sort(sortFn)];
    },
    [filteredItems, filterState.sortBy]
  );

  // Auto-scroll and highlight matching items on search
  useEffect(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase();
    if (!trimmedQuery) return;

    if (filteredItems.length > 0) {
      const firstFoundItem = filteredItems[0];
      const targetGroupId = firstFoundItem.groupId;

      // 1. Ensure the group containing the found item is expanded so it's visible
      setGroups((prevGroups) =>
        prevGroups.map((g) => (g.id === targetGroupId && g.isCollapsed ? { ...g, isCollapsed: false } : g))
      );

      // 2. Smoothly scroll to the found item element
      const timer = setTimeout(() => {
        const itemEl = document.getElementById(`grocery-item-${firstFoundItem.id}`);
        if (itemEl) {
          itemEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          itemEl.classList.add('ring-2', 'ring-emerald-500', 'shadow-md', 'dark:ring-emerald-400');
          setTimeout(() => {
            itemEl.classList.remove('ring-2', 'ring-emerald-500', 'shadow-md', 'dark:ring-emerald-400');
          }, 1600);
        } else {
          const groupEl = document.getElementById(`group-card-${targetGroupId}`);
          if (groupEl) {
            groupEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    } else {
      // Check if a group title matched the search query
      const matchedGroup = activeGroups.find((g) => g.title.toLowerCase().includes(trimmedQuery));
      if (matchedGroup) {
        const timer = setTimeout(() => {
          const groupEl = document.getElementById(`group-card-${matchedGroup.id}`);
          if (groupEl) {
            groupEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            groupEl.classList.add('ring-2', 'ring-emerald-500', 'shadow-md', 'dark:ring-emerald-400');
            setTimeout(() => {
              groupEl.classList.remove('ring-2', 'ring-emerald-500', 'shadow-md', 'dark:ring-emerald-400');
            }, 1600);
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [searchQuery, filteredItems, activeGroups]);

  // List Handlers
  const handleCreateOrUpdateList = (listData: { title: string; color: string; icon: string; description?: string }) => {
    sounds.playPop();
    if (selectedListForEdit) {
      setLists((prev) =>
        prev.map((l) => (l.id === selectedListForEdit.id ? { ...l, ...listData } : l))
      );
      showToast(t.listUpdated);
    } else {
      const newListId = `list-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const currentUid = user?.uid || 'guest';
      const currentUserEmail = user?.email || undefined;
      const currentUserName = user?.displayName || (user ? 'User' : undefined);
      const newList: AppList = {
        id: newListId,
        ...listData,
        ownerId: currentUid,
        ownerEmail: currentUserEmail,
        ownerName: currentUserName,
        collaboratorUids: user ? [user.uid] : [],
        collaborators: user
          ? {
              [user.uid]: {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || 'User',
                photoURL: user.photoURL || '',
                role: 'owner',
                status: 'active',
                invitedAt: new Date().toISOString(),
                joinedAt: new Date().toISOString(),
              },
            }
          : {},
        isShared: false,
        myRole: 'owner',
        createdAt: new Date().toISOString(),
      };
      setLists((prev) => [...prev, newList]);
      setActiveListId(newListId);
      showToast(t.listCreated);
    }
    setSelectedListForEdit(null);
  };

  const handleDeleteList = (listToDelete: AppList) => {
    // Restriction: Only the owner can delete a shared list
    const isOwnerOfList = !listToDelete.ownerId || (user && listToDelete.ownerId === user.uid);
    if (!isOwnerOfList) {
      showToast(
        language === 'ar'
          ? 'فقط مالك القائمة يمكنه حذفها. يمكنك مغادرة القائمة بدلاً من ذلك.'
          : 'Only the owner can delete a shared list. You can leave it instead.',
        undefined,
        'error'
      );
      return;
    }

    setConfirmModalState({
      isOpen: true,
      title: t.deleteListConfirmTitle,
      description: t.deleteListConfirmDesc,
      onConfirm: async () => {
        sounds.playDelete();
        const remainingLists = lists.filter((l) => l.id !== listToDelete.id);
        setLists(remainingLists);

        const groupIdsToRemove = new Set(groups.filter((g) => g.listId === listToDelete.id).map((g) => g.id));
        setGroups((prev) => prev.filter((g) => g.listId !== listToDelete.id));
        setItems((prev) => prev.filter((i) => !groupIdsToRemove.has(i.groupId)));

        if (activeListId === listToDelete.id) {
          setActiveListId(remainingLists[0]?.id || '');
        }

        showToast(t.listDeleted);

        if (user) {
          try {
            await deleteListFromFirestore(listToDelete.id, user);
          } catch (err) {
            console.error('Failed to delete list from Firestore:', err);
          }
        }
      },
    });
  };

  // Shared List Actions
  const handleOpenShareModal = (listToShare?: AppList) => {
    const target = listToShare || activeList;
    if (!target) return;
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedListForShare(target);
    setIsShareModalOpen(true);
  };

  const handleShareWithEmail = async (email: string, role: 'read' | 'edit') => {
    if (!selectedListForShare || !user) {
      return { success: false, error: 'User not signed in or list not found' };
    }
    const res = await shareListWithUser(selectedListForShare.id, email, role, user);
    if (res.success) {
      showToast(
        language === 'ar' ? `تمت مشاركة القائمة مع ${email}` : `Shared list with ${email}`,
        undefined,
        'success'
      );
    }
    return res;
  };

  const handleUpdateMemberRole = async (targetKey: string, role: 'read' | 'edit') => {
    if (!selectedListForShare || !user) return false;

    // Optimistically update list collaborators
    const updateCollaborators = (prevList: AppList): AppList => {
      const collabs = { ...(prevList.collaborators || {}) };
      if (collabs[targetKey]) {
        collabs[targetKey] = { ...collabs[targetKey], role };
      } else {
        const found = Object.keys(collabs).find(
          (k) =>
            k === targetKey ||
            collabs[k]?.uid === targetKey ||
            collabs[k]?.email?.toLowerCase() === targetKey.toLowerCase()
        );
        if (found) collabs[found] = { ...collabs[found], role };
      }
      return { ...prevList, collaborators: collabs };
    };

    setSelectedListForShare((prev) => (prev ? updateCollaborators(prev) : prev));
    setLists((prev) =>
      prev.map((l) => (l.id === selectedListForShare.id ? updateCollaborators(l) : l))
    );

    const ok = await updateMemberRole(selectedListForShare.id, targetKey, role, user.uid);
    if (ok) {
      showToast(language === 'ar' ? 'تم تحديث الصلاحية بنجاح' : 'Permission updated successfully');
    }
    return ok;
  };

  const handleRemoveMember = async (targetKey: string, email?: string, uid?: string) => {
    if (!selectedListForShare || !user) return false;

    // Optimistically remove member from list
    const removeMember = (prevList: AppList): AppList => {
      const collabs = { ...(prevList.collaborators || {}) };
      const emailNorm = (email || '').toLowerCase().trim();
      const targetKeyNorm = (targetKey || '').toLowerCase().trim();

      delete collabs[targetKey];
      if (uid && collabs[uid]) delete collabs[uid];
      if (emailNorm) {
        const emKey = emailNorm.replace(/[\.\#\$\[\]]/g, '_');
        delete collabs[emKey];
      }

      Object.entries(collabs).forEach(([k, m]) => {
        if (
          (uid && m.uid === uid) ||
          (targetKey && m.uid === targetKey) ||
          (emailNorm && m.email?.toLowerCase() === emailNorm) ||
          (targetKeyNorm && m.email?.toLowerCase() === targetKeyNorm)
        ) {
          delete collabs[k];
        }
      });

      return {
        ...prevList,
        collaborators: collabs,
        collaboratorUids: (prevList.collaboratorUids || []).filter(
          (id) => id !== uid && id !== targetKey
        ),
        invitedEmails: (prevList.invitedEmails || []).filter(
          (em) =>
            em.toLowerCase() !== emailNorm &&
            em.toLowerCase() !== targetKeyNorm
        ),
      };
    };

    setSelectedListForShare((prev) => (prev ? removeMember(prev) : prev));
    setLists((prev) =>
      prev.map((l) => (l.id === selectedListForShare.id ? removeMember(l) : l))
    );

    const ok = await removeMemberFromList(
      selectedListForShare.id,
      targetKey,
      user.uid,
      email,
      uid
    );
    if (ok) {
      showToast(language === 'ar' ? 'تمت إزالة العضو من القائمة' : 'Member removed from list');
    }
    return ok;
  };

  const handleLeaveList = (listToLeave: AppList) => {
    if (!user) return;
    setConfirmModalState({
      isOpen: true,
      title: language === 'ar' ? 'مغادرة القائمة المشتركة' : 'Leave Shared List',
      description:
        language === 'ar'
          ? `هل أنت متأكد من مغادرة قائمة "${listToLeave.title}"؟ لن تتمكن من الوصول إليها مجدداً إلا بدعوة جديدة.`
          : `Are you sure you want to leave "${listToLeave.title}"? You will lose access until re-invited.`,
      onConfirm: async () => {
        try {
          const ok = await leaveSharedList(listToLeave.id, user.uid);
          if (ok) {
            setLists((prev) => prev.filter((l) => l.id !== listToLeave.id));
            if (activeListId === listToLeave.id) {
              const remaining = lists.filter((l) => l.id !== listToLeave.id);
              setActiveListId(remaining[0]?.id || '');
            }
            showToast(
              language === 'ar'
                ? 'تمت مغادرة القائمة المشتركة بنجاح'
                : 'Left the shared list successfully'
            );
          } else {
            showToast(language === 'ar' ? 'فشلت المغادرة' : 'Failed to leave list', undefined, 'error');
          }
        } catch {
          showToast(language === 'ar' ? 'فشلت المغادرة' : 'Failed to leave list', undefined, 'error');
        }
      },
    });
  };

  const handleAcceptInvitation = async (invitation: PendingInvitation) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const ok = await acceptListInvitation(invitation.listId, user);
      if (ok) {
        setPendingInvitations((prev) => prev.filter((i) => i.listId !== invitation.listId));
        setIsJoinModalOpen(false);
        setJoinModalInvitation(null);
        setActiveListId(invitation.listId);
        showToast(
          language === 'ar'
            ? `انضممت إلى قائمة "${invitation.listTitle}" بنجاح!`
            : `Joined "${invitation.listTitle}" successfully!`,
          undefined,
          'success'
        );
      } else {
        showToast(
          language === 'ar' ? 'فشل الانضمام إلى القائمة' : 'Failed to join list',
          undefined,
          'error'
        );
      }
    } catch {
      showToast(
        language === 'ar' ? 'فشل الانضمام إلى القائمة' : 'Failed to join list',
        undefined,
        'error'
      );
    }
  };

  const handleRejectInvitation = async (invitation: PendingInvitation) => {
    if (!user?.email) return;
    try {
      const ok = await rejectListInvitation(invitation.listId, user.email);
      if (ok) {
        setPendingInvitations((prev) => prev.filter((i) => i.listId !== invitation.listId));
        setIsJoinModalOpen(false);
        setJoinModalInvitation(null);
        showToast(
          language === 'ar' ? 'تم رفض الدعوة' : 'Invitation declined',
          undefined,
          'info'
        );
      } else {
        showToast(
          language === 'ar' ? 'فشل رفض الدعوة' : 'Failed to decline invitation',
          undefined,
          'error'
        );
      }
    } catch {
      showToast(
        language === 'ar' ? 'فشل رفض الدعوة' : 'Failed to decline invitation',
        undefined,
        'error'
      );
    }
  };

  const handleDuplicateList = (listToDup: AppList) => {
    sounds.playPop();
    const newListId = `list-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const currentUid = user?.uid || 'guest';
    const duplicatedList: AppList = {
      ...listToDup,
      id: newListId,
      title: `${listToDup.title} (${language === 'ar' ? 'نسخة' : 'Copy'})`,
      ownerId: currentUid,
      ownerEmail: user?.email || undefined,
      ownerName: user?.displayName || (user ? 'User' : undefined),
      collaboratorUids: user ? [user.uid] : [],
      collaborators: user
        ? {
            [user.uid]: {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'User',
              role: 'owner',
              status: 'active',
              invitedAt: new Date().toISOString(),
              joinedAt: new Date().toISOString(),
            },
          }
        : {},
      isShared: false,
      myRole: 'owner',
      createdAt: new Date().toISOString(),
    };

    const oldGroups = groups.filter((g) => (g.listId || 'list-groceries') === listToDup.id);
    const oldGroupIds = new Set(oldGroups.map((g) => g.id));
    const oldItems = items.filter((i) => oldGroupIds.has(i.groupId));

    const groupIdMap = new Map<string, string>();
    const newGroups: ListGroup[] = oldGroups.map((g) => {
      const newGId = `aisle-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      groupIdMap.set(g.id, newGId);
      return {
        ...g,
        id: newGId,
        listId: newListId,
        createdAt: new Date().toISOString(),
      };
    });

    const newItems: ListItem[] = oldItems.map((item) => ({
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      groupId: groupIdMap.get(item.groupId) || newGroups[0]?.id || 'default',
      createdAt: new Date().toISOString(),
    }));

    setLists((prev) => [...prev, duplicatedList]);
    setGroups((prev) => [...prev, ...newGroups]);
    setItems((prev) => [...prev, ...newItems]);
    setActiveListId(newListId);

    showToast(language === 'ar' ? 'تم تكرار القائمة بنجاح' : 'List duplicated successfully');
  };

  // Group Handlers
  const handleAddGroup = (groupData: { id?: string; title: string; color: string; icon: string }) => {
    sounds.playPop();
    if (groupData.id) {
      // Edit
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupData.id ? { ...g, title: groupData.title, color: groupData.color, icon: groupData.icon } : g
        )
      );
    } else {
      // Create new
      const newGroupId = `aisle-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const newGroup: ListGroup = {
        id: newGroupId,
        listId: activeListId,
        title: groupData.title,
        color: groupData.color,
        icon: groupData.icon,
        isCollapsed: false,
        createdAt: new Date().toISOString(),
      };
      setGroups((prev) => [...prev, newGroup]);
    }
  };

  const handleDuplicateGroup = (groupToDup: ListGroup) => {
    sounds.playPop();
    const newGroupId = `aisle-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newGroup: ListGroup = {
      ...groupToDup,
      id: newGroupId,
      title: `${groupToDup.title} (${language === 'ar' ? 'نسخة' : 'Copy'})`,
      createdAt: new Date().toISOString(),
    };

    // Duplicate all items of this group
    const groupItemsToDup = items.filter((i) => i.groupId === groupToDup.id);
    const newItems = groupItemsToDup.map((item) => ({
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      groupId: newGroupId,
      createdAt: new Date().toISOString(),
    }));

    setGroups((prev) => [...prev, newGroup]);
    setItems((prev) => [...prev, ...newItems]);
    showToast(language === 'ar' ? 'تم نسخ الممر بنجاح' : 'Aisle duplicated successfully');
  };

  const handleDeleteGroup = (groupId: string) => {
    const groupToDelete = groups.find((g) => g.id === groupId);
    const itemsToDelete = items.filter((i) => i.groupId === groupId);
    if (!groupToDelete) return;

    const targetListId = groupToDelete.listId || activeListId || 'list-groceries';
    const itemIdsToDelete = itemsToDelete.map((i) => i.id);

    setConfirmModalState({
      isOpen: true,
      title: t.deleteGroupConfirmTitle,
      description: t.deleteGroupConfirmDesc,
      onConfirm: async () => {
        sounds.playDelete();
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
        setItems((prev) => prev.filter((i) => i.groupId !== groupId));

        if (user) {
          try {
            await deleteGroupFromFirestore(targetListId, groupId, itemIdsToDelete);
          } catch (err) {
            console.error('Failed to delete group from Firestore:', err);
          }
        }

        // Allow instant Undo
        showToast(t.groupDeleted, () => {
          setGroups((prev) => [...prev, groupToDelete]);
          setItems((prev) => [...prev, ...itemsToDelete]);
          if (user) {
            syncAllToFirestore(user.uid, lists, [...groups, groupToDelete], [...items, ...itemsToDelete]);
          }
        });
      },
    });
  };

  const handleToggleCollapseGroup = (groupId: string) => {
    sounds.playPop();
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g))
    );
  };

  const handleToggleCollapseAll = () => {
    sounds.playPop();
    const nextState = !allCollapsed;
    setGroups((prev) => prev.map((g) => ({ ...g, isCollapsed: nextState })));
  };

  const handleClearCompletedInGroup = async (groupId: string) => {
    const completedInGroup = items.filter((i) => i.groupId === groupId && i.completed);
    if (completedInGroup.length === 0) return;

    const targetGroup = groups.find((g) => g.id === groupId);
    const targetListId = targetGroup?.listId || activeListId || 'list-groceries';
    const itemIdsToDelete = completedInGroup.map((i) => i.id);

    sounds.playDelete();
    setItems((prev) => prev.filter((i) => !(i.groupId === groupId && i.completed)));

    if (user) {
      try {
        await deleteItemsFromFirestore(targetListId, itemIdsToDelete);
      } catch (err) {
        console.error('Failed to clear completed items from Firestore:', err);
      }
    }

    showToast(t.allCompletedCleared, () => {
      setItems((prev) => [...prev, ...completedInGroup]);
      if (user) {
        syncAllToFirestore(user.uid, lists, groups, [...items, ...completedInGroup]);
      }
    });
  };

  const handleClearAllCompleted = async () => {
    const completedList = items.filter((i) => i.completed);
    if (completedList.length === 0) return;

    sounds.playDelete();
    setItems((prev) => prev.filter((i) => !i.completed));

    if (user) {
      const listItemsMap = new Map<string, string[]>();
      completedList.forEach((item) => {
        const parentGroup = groups.find((g) => g.id === item.groupId);
        const itemExplicitListId = (item as unknown as { listId?: string }).listId;
        const listId = itemExplicitListId || parentGroup?.listId || activeListId || 'list-groceries';
        const arr = listItemsMap.get(listId) || [];
        arr.push(item.id);
        listItemsMap.set(listId, arr);
      });

      for (const [listId, itemIds] of listItemsMap.entries()) {
        try {
          await deleteItemsFromFirestore(listId, itemIds);
        } catch (err) {
          console.error(`Failed to delete items for list ${listId}:`, err);
        }
      }
    }

    showToast(t.allCompletedCleared, () => {
      setItems((prev) => [...prev, ...completedList]);
      if (user) {
        syncAllToFirestore(user.uid, lists, groups, [...items, ...completedList]);
      }
    });
  };

  const handleUncheckAll = () => {
    const previousItems = [...items];
    setItems((prev) => prev.map((i) => ({ ...i, completed: false, completedAt: undefined })));
    sounds.playPop();
    showToast(language === 'ar' ? 'تمت إعادة تعيين جميع الأصناف إلى السلة' : 'All items unchecked', () => {
      setItems(previousItems);
    });
  };

  const handleSortGroupItems = (groupId: string, option: SortOption) => {
    setFilterState((prev) => ({ ...prev, sortBy: option }));
    showToast(language === 'ar' ? 'تم ترتيب الأصناف' : 'Items sorted');
  };

  // Item Handlers
  const handleAddItem = (groupId: string, title: string, priority: Priority = 'medium') => {
    // Check if title has quantity like "2x Milk"
    let cleanTitle = title.trim();
    let qty: number | undefined = undefined;
    let unit: string | undefined = undefined;

    // Pattern: "2x item" or "3x item"
    const matchPrefix = cleanTitle.match(/^(\d+(?:\.\d+)?)\s*x\s+(.+)$/i);
    if (matchPrefix) {
      qty = parseFloat(matchPrefix[1]) || undefined;
      cleanTitle = matchPrefix[2].trim();
    }

    const newItemId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newItem: ListItem = {
      id: newItemId,
      groupId,
      title: cleanTitle,
      quantity: qty,
      unit,
      completed: false,
      createdAt: new Date().toISOString(),
      priority,
      tags: [],
      subtasks: [],
      isPinned: false,
    };
    setItems((prev) => [newItem, ...prev]);
  };

  const handleSaveItemModal = (itemData: Partial<ListItem> & { id?: string }) => {
    sounds.playPop();
    if (itemData.id) {
      // Edit existing
      setItems((prev) =>
        prev.map((item) => (item.id === itemData.id ? ({ ...item, ...itemData } as ListItem) : item))
      );
    } else {
      // Add new
      const newItemId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newItem: ListItem = {
        id: newItemId,
        groupId: itemData.groupId || groups[0]?.id || 'default',
        title: itemData.title || '',
        quantity: itemData.quantity,
        unit: itemData.unit,
        notes: itemData.notes || itemData.description,
        completed: false,
        createdAt: new Date().toISOString(),
        priority: itemData.priority || 'medium',
        tags: itemData.tags || [],
        subtasks: itemData.subtasks || [],
        isPinned: Boolean(itemData.isPinned),
      };
      setItems((prev) => [newItem, ...prev]);
    }
  };

  const handleToggleCompleteItem = (itemId: string) => {
    setItems((prev) => {
      const targetItem = prev.find((i) => i.id === itemId);
      const next = prev.map((item) => {
        if (item.id === itemId) {
          const nextCompleted = !item.completed;
          return {
            ...item,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };
        }
        return item;
      });

      // Check if all items in the grocery list are completed -> trigger celebratory confetti
      if (targetItem && !targetItem.completed) {
        const allCompleted = next.length > 0 && next.every((i) => i.completed);
        if (allCompleted) {
          try {
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.6 },
            });
          } catch {}
        }
      }

      return next;
    });
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    sounds.playPop();
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const current = item.quantity ?? 1;
          const nextQty = Math.max(1, current + delta);
          return { ...item, quantity: nextQty };
        }
        return item;
      })
    );
  };

  const handleInlineUpdateTitle = (itemId: string, newTitle: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, title: newTitle } : i))
    );
  };

  const handleTogglePinItem = (itemId: string) => {
    sounds.playPop();
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          const nextPinned = !i.isPinned;
          return { ...i, isPinned: nextPinned };
        }
        return i;
      })
    );
  };

  const handleDuplicateItem = (itemToDup: ListItem) => {
    sounds.playPop();
    const newItemId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newItem: ListItem = {
      ...itemToDup,
      id: newItemId,
      title: `${itemToDup.title} (${language === 'ar' ? 'نسخة' : 'Copy'})`,
      completed: false,
      completedAt: undefined,
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => [newItem, ...prev]);
    showToast(language === 'ar' ? 'تم نسخ الصنف' : 'Item duplicated');
  };

  const handleMoveToGroup = (itemId: string, targetGroupId: string) => {
    sounds.playDrop();
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, groupId: targetGroupId } : i))
    );
    showToast(language === 'ar' ? 'تم نقل الصنف إلى الممر' : 'Item moved to aisle');
  };

  const handleDeleteItem = async (itemId: string) => {
    const itemToDelete = items.find((i) => i.id === itemId);
    if (!itemToDelete) return;

    const parentGroup = groups.find((g) => g.id === itemToDelete.groupId);
    const itemExplicitListId = (itemToDelete as unknown as { listId?: string }).listId;
    const targetListId = itemExplicitListId || parentGroup?.listId || activeListId || 'list-groceries';

    sounds.playDelete();
    setItems((prev) => prev.filter((i) => i.id !== itemId));

    if (user) {
      try {
        await deleteItemFromFirestore(targetListId, itemId);
      } catch (err) {
        console.error('Failed to delete item from Firestore:', err);
      }
    }

    // Instant undo toast
    showToast(t.taskDeleted, () => {
      setItems((prev) => [itemToDelete, ...prev]);
      if (user) {
        syncAllToFirestore(user.uid, lists, groups, [itemToDelete, ...items]);
      }
    });
  };

  // Drag and Drop Logic: Groups / Aisles
  const handleGroupDragStart = (e: React.DragEvent, groupId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'GROUP', id: groupId }));
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
    setDraggingGroupId(groupId);
  };

  const handleDragEnd = () => {
    setDraggingGroupId(null);
    setGroupDropTargetId(null);
    setGroupDropPosition(null);
    setDraggingItemId(null);
    setItemDropTargetId(null);
    setItemDropPosition(null);
  };

  const handleGroupDragOver = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    if (!draggingGroupId || draggingGroupId === targetGroupId) return;
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }

    const targetElem = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = targetElem.top + targetElem.height / 2;
    const position = e.clientY < midY ? 'above' : 'below';

    setGroupDropTargetId((prev) => (prev !== targetGroupId ? targetGroupId : prev));
    setGroupDropPosition((prev) => (prev !== position ? position : prev));
  };

  const handleGroupDragLeave = (e: React.DragEvent) => {
    if (
      e.currentTarget &&
      e.relatedTarget &&
      (e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)
    ) {
      return;
    }
    setGroupDropTargetId(null);
    setGroupDropPosition(null);
  };

  const handleGroupDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    if (!draggingGroupId || draggingGroupId === targetGroupId) {
      setDraggingGroupId(null);
      setGroupDropTargetId(null);
      setGroupDropPosition(null);
      return;
    }

    sounds.playDrop();
    const sourceIdx = groups.findIndex((g) => g.id === draggingGroupId);
    const targetIdx = groups.findIndex((g) => g.id === targetGroupId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const newGroups = [...groups];
      const [removed] = newGroups.splice(sourceIdx, 1);
      const insertAt = groupDropPosition === 'below' ? targetIdx + 1 : targetIdx;
      newGroups.splice(insertAt > sourceIdx ? insertAt - 1 : insertAt, 0, removed);
      setGroups(newGroups);
    }

    setDraggingGroupId(null);
    setGroupDropTargetId(null);
    setGroupDropPosition(null);
  };

  // Drag and Drop Logic: Items
  const handleItemDragStart = (e: React.DragEvent, itemId: string, sourceGroupId: string) => {
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ type: 'ITEM', id: itemId, sourceGroupId })
    );
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
    setDraggingItemId(itemId);
  };

  const handleItemDragOver = (e: React.DragEvent, targetItemId: string) => {
    // Only accept items, never when dragging a group
    if (!draggingItemId || draggingGroupId || draggingItemId === targetItemId) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }

    const targetElem = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = targetElem.top + targetElem.height / 2;
    const position = e.clientY < midY ? 'above' : 'below';

    setItemDropTargetId((prev) => (prev !== targetItemId ? targetItemId : prev));
    setItemDropPosition((prev) => (prev !== position ? position : prev));
  };

  const handleItemDragLeave = (e: React.DragEvent) => {
    if (!draggingItemId) return;
    if (
      e.currentTarget &&
      e.relatedTarget &&
      (e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)
    ) {
      return;
    }
    setItemDropTargetId(null);
    setItemDropPosition(null);
  };

  const handleItemDrop = (e: React.DragEvent, targetItemId: string, targetGroupId: string) => {
    if (!draggingItemId || draggingGroupId || draggingItemId === targetItemId) {
      if (draggingItemId) {
        setDraggingItemId(null);
        setItemDropTargetId(null);
        setItemDropPosition(null);
      }
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    sounds.playDrop();
    const sourceItem = items.find((i) => i.id === draggingItemId);
    if (!sourceItem) return;

    const sourceIdx = items.findIndex((i) => i.id === draggingItemId);
    const targetIdx = items.findIndex((i) => i.id === targetItemId);

    const updatedItems = [...items];
    const [movedItem] = updatedItems.splice(sourceIdx, 1);
    movedItem.groupId = targetGroupId;

    const insertAt = itemDropPosition === 'below' ? targetIdx + 1 : targetIdx;
    updatedItems.splice(insertAt > sourceIdx ? insertAt - 1 : insertAt, 0, movedItem);

    setItems(updatedItems);
    setDraggingItemId(null);
    setItemDropTargetId(null);
    setItemDropPosition(null);
  };

  const handleItemDropInEmptyGroup = (e: React.DragEvent, targetGroupId: string) => {
    if (!draggingItemId || draggingGroupId) return;
    e.preventDefault();
    e.stopPropagation();

    sounds.playDrop();
    setItems((prev) =>
      prev.map((i) => (i.id === draggingItemId ? { ...i, groupId: targetGroupId } : i))
    );
    setDraggingItemId(null);
    setItemDropTargetId(null);
    setItemDropPosition(null);
  };

  // Templates & JSON Export/Import
  const handleSelectTemplate = (
    templateKey: TemplateKey,
    replace: boolean
  ) => {
    sounds.playPop();
    const tpl = getLocalizedTemplate(templateKey, language);
    const targetListId = activeListId || 'list-groceries';
    const timeOffset = Date.now();

    const newGroups: ListGroup[] = tpl.groups.map((g, idx) => ({
      ...g,
      id: `tpl-${templateKey}-${timeOffset}-${idx}`,
      listId: targetListId,
    }));

    const newItems: ListItem[] = tpl.items.map((i, idx) => {
      const origGroupIdx = tpl.groups.findIndex((og) => og.id === i.groupId);
      const mappedGroupId = origGroupIdx >= 0 && newGroups[origGroupIdx] ? newGroups[origGroupIdx].id : newGroups[0]?.id || `tpl-${templateKey}-${timeOffset}-0`;
      return {
        ...i,
        id: `tpl-item-${timeOffset}-${idx}`,
        groupId: mappedGroupId,
      };
    });

    if (replace) {
      // Update the active list's title and description based on the chosen template and language
      setLists((prevLists) =>
        prevLists.map((l) =>
          l.id === targetListId
            ? {
                ...l,
                title: tpl.name,
                description: tpl.desc,
                icon: tpl.icon || l.icon,
                color:
                  templateKey === 'weekly'
                    ? '#10b981'
                    : templateKey === 'freshMarket'
                    ? '#06b6d4'
                    : templateKey === 'bbq'
                    ? '#ef4444'
                    : '#f59e0b',
              }
            : l
        )
      );

      setGroups((prev) => [
        ...prev.filter((g) => (g.listId || 'list-groceries') !== targetListId),
        ...newGroups,
      ]);
      setItems((prev) => [
        ...prev.filter((i) => !activeListGroupIds.has(i.groupId)),
        ...newItems,
      ]);
      showToast(language === 'ar' ? `تم تحميل "${tpl.name}" وتحديث عنوان القائمة` : `Loaded "${tpl.name}" and updated list title`);
    } else {
      // If appending to an empty list, update the title to the template's localized name as well
      if (activeListItems.length === 0) {
        setLists((prevLists) =>
          prevLists.map((l) =>
            l.id === targetListId
              ? {
                  ...l,
                  title: tpl.name,
                  description: tpl.desc,
                  icon: tpl.icon || l.icon,
                }
              : l
          )
        );
      }

      setGroups((prev) => [...prev, ...newGroups]);
      setItems((prev) => [...prev, ...newItems]);
      showToast(language === 'ar' ? `تمت إضافة "${tpl.name}" للقائمة الحالية` : `Appended "${tpl.name}" items to list`);
    }
  };

  const handleExportJSON = () => {
    sounds.playPop();
    const data = {
      version: '3.0',
      type: 'listflow_workspace',
      exportedAt: new Date().toISOString(),
      language,
      lists,
      groups,
      items,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `listflow-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(language === 'ar' ? 'تم تصدير مساحة العمل' : 'Workspace exported to JSON');
  };

  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = e.target?.result as string;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.groups) && Array.isArray(parsed.items)) {
          if (Array.isArray(parsed.lists) && parsed.lists.length > 0) {
            setLists(parsed.lists);
            setActiveListId(parsed.lists[0].id);
          }
          setGroups(parsed.groups);
          setItems(parsed.items);
          if (parsed.language === 'en' || parsed.language === 'ar') {
            setLanguage(parsed.language);
          }
          sounds.playComplete();
          showToast(t.importSuccess);
        } else {
          showToast(t.importError, undefined, 'error');
        }
      } catch {
        showToast(t.importError, undefined, 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-neutral-50/50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 selection:bg-emerald-500 selection:text-white transition-[padding] duration-300 ease-in-out ${
        isSidebarOpen ? 'lg:ps-72 sm:lg:ps-80' : 'ps-0'
      }`}
    >
      {/* 1. Fixed Top-to-Bottom Side Menu */}
      <SideMenu
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        lists={lists}
        activeListId={activeListId}
        onSelectList={(id) => {
          sounds.playPop();
          setActiveListId(id);
          setCurrentView('workspace');
        }}
        onOpenNewListModal={() => {
          setSelectedListForEdit(null);
          setIsListModalOpen(true);
        }}
        onEditList={(list) => {
          setSelectedListForEdit(list);
          setIsListModalOpen(true);
        }}
        onDeleteList={handleDeleteList}
        onDuplicateList={handleDuplicateList}
        onShareList={handleOpenShareModal}
        pendingInvitations={pendingInvitations}
        onOpenPendingInvite={(invite) => {
          setJoinModalInvitation(invite);
          setIsJoinModalOpen(true);
        }}
        groups={groups}
        items={items}
        language={language}
        onToggleLanguage={() => handleLanguageChange(language === 'en' ? 'ar' : 'en')}
        totalTasks={totalItems}
        completedTasks={collectedItems}
        currentView={currentView}
        onOpenSettings={() => {
          sounds.playPop();
          setCurrentView('settings');
        }}
        onOpenOnboarding={() => setIsOnboardingModalOpen(true)}
        user={user}
        syncStatus={syncStatus}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={authSignOut}
      />

      {/* 2. Top Navigation Bar */}
      <Navbar
        language={language}
        onToggleLanguage={() => handleLanguageChange(language === 'en' ? 'ar' : 'en')}
        theme={theme}
        onCycleTheme={cycleTheme}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onLogoClick={() => setCurrentView('workspace')}
        onOpenSettings={() => {
          sounds.playPop();
          setCurrentView('settings');
        }}
        onOpenInstallModal={() => pwa.setIsModalOpen(true)}
        isAppInstalled={pwa.isInstalled}
        currentView={currentView}
        activeListName={activeList?.title}
        activeListColor={activeListColor}
        activeList={activeList}
        isOwner={isOwner}
        isShared={isShared}
        onOpenShareModal={() => handleOpenShareModal(activeList)}
        user={user}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={authSignOut}
      />

      {/* 3. Main Content Workspace or Settings Page */}
      <div className="flex-1 flex w-full overflow-x-hidden">
        <main className="flex-1 min-w-0 px-3 sm:px-6 lg:px-8 pt-6 pb-28 sm:pb-8 space-y-6">
          {currentView === 'settings' ? (
            <SettingsPage
              language={language}
              onLanguageChange={handleLanguageChange}
              theme={theme}
              onThemeChange={handleThemeChange}
              onThemeToggle={cycleTheme}
              themeColor={themeColor}
              onThemeColorChange={handleThemeColorChange}
              soundEnabled={soundEnabled}
              onSoundToggle={handleSoundToggle}
              gridColumns={gridColumns}
              onGridColumnsChange={handleGridColumnsChange}
              onOpenTemplatesModal={() => setIsTemplatesModalOpen(true)}
              onOpenOnboarding={() => setIsOnboardingModalOpen(true)}
              onExportData={handleExportJSON}
              onImportData={handleImportJSON}
              onOpenInstallModal={() => pwa.setIsModalOpen(true)}
              isAppInstalled={pwa.isInstalled}
              user={user}
              syncStatus={syncStatus}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onSignOut={authSignOut}
              onBackToWorkspace={() => setCurrentView('workspace')}
              totalLists={lists.length}
              totalGroups={groups.length}
              totalItems={totalItems}
              completedItems={collectedItems}
            />
          ) : (
            <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto space-y-6">
              {/* Pending Invitations Banner */}
              {pendingInvitations.length > 0 && (
                <div className="space-y-3">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.listId}
                      className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            {language === 'ar'
                              ? `تمت دعوتك للانضمام إلى قائمة "${invitation.listTitle}"`
                              : `You've been invited to join "${invitation.listTitle}"`}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {language === 'ar'
                              ? `بصلاحية ${invitation.role === 'edit' ? 'تعديل كامل' : 'عرض فقط'} بواسطة ${invitation.ownerName || invitation.ownerEmail || 'المالك'}`
                              : `With ${invitation.role === 'edit' ? 'Full Edit' : 'View Only'} permissions by ${invitation.ownerName || invitation.ownerEmail || 'Owner'}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleRejectInvitation(invitation)}
                          className="px-3 py-1.5 text-xs font-medium rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                          {language === 'ar' ? 'تجاهل' : 'Ignore'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAcceptInvitation(invitation)}
                          className="px-4 py-1.5 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'قبول والانضمام' : 'Accept & Join'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Filter and Group Action Toolbar with Search, Add Item & Add Group */}
              <StatsBanner
                language={language}
                searchQuery={searchQuery}
                onSearchChange={(q) => {
                  setSearchQuery(q);
                  if (q.trim() && currentView === 'settings') {
                    setCurrentView('workspace');
                  }
                }}
                totalTasks={totalItems}
                activeTasks={remainingItems}
                completedTasks={collectedItems}
                groups={activeGroups}
                filterState={filterState}
                onFilterChange={(newFilters) => setFilterState((prev) => ({ ...prev, ...newFilters }))}
                allCollapsed={allCollapsed}
                onToggleCollapseAll={handleToggleCollapseAll}
                onUncheckAll={handleUncheckAll}
                onClearCart={handleClearAllCompleted}
                onOpenNewGroupModal={() => {
                  if (lists.length === 0) {
                    setSelectedListForEdit(null);
                    setIsListModalOpen(true);
                    return;
                  }
                  setSelectedGroupForEdit(null);
                  setIsGroupModalOpen(true);
                }}
                onOpenNewItemModal={() => {
                  if (lists.length === 0) {
                    setSelectedListForEdit(null);
                    setIsListModalOpen(true);
                    return;
                  }
                  if (activeGroups.length === 0) {
                    setSelectedGroupForEdit(null);
                    setIsGroupModalOpen(true);
                    return;
                  }
                  setSelectedItemForEdit(null);
                  setDefaultGroupIdForItem(activeGroups[0]?.id);
                  setIsItemModalOpen(true);
                }}
                gridColumns={gridColumns}
                onGridColumnsChange={setGridColumns}
                isReadOnly={isReadOnly}
                activeList={activeList}
                isOwner={isOwner}
                isShared={isShared}
                onOpenShareModal={() => handleOpenShareModal(activeList)}
              />

              {/* Empty State when no lists exist, or no groups exist in active list */}
              {lists.length === 0 ? (
                <div className="text-center py-16 px-4 border-2 border-dashed border-emerald-200/80 dark:border-neutral-800 rounded-3xl bg-white/60 dark:bg-neutral-900/30">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <ListTodo className="w-7 h-7 stroke-[1.8]" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {t.noListsYetTitle}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                    {t.noListsYetDesc}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      id="empty-create-first-list-btn"
                      onClick={() => {
                        setSelectedListForEdit(null);
                        setIsListModalOpen(true);
                      }}
                      className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>{t.createFirstList || t.newList}</span>
                    </button>
                    <button
                      id="empty-load-templates-btn"
                      onClick={() => setIsTemplatesModalOpen(true)}
                      className="px-4 py-2 text-sm font-semibold rounded-xl text-neutral-700 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700/80 border border-neutral-200/60 dark:border-neutral-700/60 transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{t.loadTemplates}</span>
                    </button>
                  </div>
                </div>
              ) : activeGroups.length === 0 ? (
                <div className="text-center py-16 px-4 border-2 border-dashed border-emerald-200/80 dark:border-neutral-800 rounded-3xl bg-white/60 dark:bg-neutral-900/30">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <ListTodo className="w-7 h-7 stroke-[1.8]" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {t.noGroupsTitle}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                    {t.noGroupsDesc}
                  </p>
                  {!isReadOnly && (
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <button
                        id="empty-create-first-group-btn"
                        onClick={() => {
                          setSelectedGroupForEdit(null);
                          setIsGroupModalOpen(true);
                        }}
                        className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>{t.createFirstGroup}</span>
                      </button>
                      <button
                        id="empty-load-templates-btn"
                        onClick={() => setIsTemplatesModalOpen(true)}
                        className="px-4 py-2 text-sm font-semibold rounded-xl text-neutral-700 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700/80 border border-neutral-200/60 dark:border-neutral-700/60 transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
                      >
                        <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{t.loadTemplates}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Groups Masonry / Responsive Grid (2 columns default or 1 column on large screens) */
                <div
                  className={`gap-5 items-start ${
                    gridColumns === 2
                      ? 'grid grid-cols-1 lg:grid-cols-2'
                      : 'grid grid-cols-1 max-w-4xl mx-auto'
                  }`}
                >
                  {activeGroups.map((group) => {
                    const groupSortedItems = getGroupSortedItems(group.id);
                    return (
                      <GroupCard
                        key={group.id}
                        group={group}
                        items={groupSortedItems}
                        allGroups={activeGroups}
                        language={language}
                        searchQuery={searchQuery}
                        isReadOnly={isReadOnly}
                        onToggleCollapse={handleToggleCollapseGroup}
                        onEditGroup={(g) => {
                          setSelectedGroupForEdit(g);
                          setIsGroupModalOpen(true);
                        }}
                        onDeleteGroup={handleDeleteGroup}
                        onDuplicateGroup={handleDuplicateGroup}
                        onClearCompletedInGroup={handleClearCompletedInGroup}
                        onSortGroupItems={handleSortGroupItems}
                        onAddItem={handleAddItem}
                        onToggleComplete={handleToggleCompleteItem}
                        onEditItem={(item) => {
                          setSelectedItemForEdit(item);
                          setDefaultGroupIdForItem(item.groupId);
                          setIsItemModalOpen(true);
                        }}
                        onDeleteItem={handleDeleteItem}
                        onDuplicateItem={handleDuplicateItem}
                        onTogglePin={handleTogglePinItem}
                        onMoveToGroup={handleMoveToGroup}
                        onInlineUpdateTitle={handleInlineUpdateTitle}
                        onUpdateQuantity={handleUpdateQuantity}
                        // Group DnD
                        isDraggingGroup={draggingGroupId === group.id}
                        onGroupDragStart={handleGroupDragStart}
                        onGroupDragOver={handleGroupDragOver}
                        onGroupDragLeave={handleGroupDragLeave}
                        onGroupDrop={handleGroupDrop}
                        groupDropPosition={groupDropTargetId === group.id ? groupDropPosition : null}
                        // Item DnD
                        draggingItemId={draggingItemId}
                        onItemDragStart={handleItemDragStart}
                        onDragEnd={handleDragEnd}
                        onItemDragOver={handleItemDragOver}
                        onItemDragLeave={handleItemDragLeave}
                        onItemDrop={handleItemDrop}
                        itemDropTargetId={itemDropTargetId}
                        itemDropPosition={itemDropPosition}
                        onItemDropInEmptyGroup={handleItemDropInEmptyGroup}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Floating Action Button on Mobile */}
      {currentView === 'workspace' && !isReadOnly && (
        <div className="fixed bottom-5 end-5 z-30 sm:hidden pointer-events-auto">
          <button
            id="mobile-fab-add-btn"
            onClick={() => {
              setSelectedItemForEdit(null);
              setDefaultGroupIdForItem(activeGroups[0]?.id);
              setIsItemModalOpen(true);
            }}
            title={t.addItem}
            style={{
              backgroundColor: activeListColor,
              boxShadow: `0 8px 20px -4px ${activeListColor}70`,
            }}
            className="w-11 h-11 rounded-full text-white flex items-center justify-center active:scale-95 transition-all duration-200 cursor-pointer shadow-md hover:brightness-110"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Modals & Dialogs */}
      <ListModal
        isOpen={isListModalOpen}
        onClose={() => {
          setIsListModalOpen(false);
          setSelectedListForEdit(null);
        }}
        listToEdit={selectedListForEdit}
        onSave={handleCreateOrUpdateList}
        language={language}
      />

      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setSelectedItemForEdit(null);
        }}
        item={selectedItemForEdit}
        groups={activeGroups}
        defaultGroupId={defaultGroupIdForItem}
        language={language}
        onSave={handleSaveItemModal}
      />

      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => {
          setIsGroupModalOpen(false);
          setSelectedGroupForEdit(null);
        }}
        group={selectedGroupForEdit}
        language={language}
        onSave={handleAddGroup}
      />

      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        language={language}
        onSelectTemplate={handleSelectTemplate}
      />

      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        language={language}
      />

      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalState.onConfirm}
        title={confirmModalState.title}
        description={confirmModalState.description}
        language={language}
      />

      {/* Share List Modal */}
      {selectedListForShare && (
        <ShareListModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setSelectedListForShare(null);
          }}
          list={selectedListForShare}
          currentUser={user}
          language={language}
          onInviteUser={async (email, role) => {
            await handleShareWithEmail(email, role);
          }}
          onUpdateRole={async (memberKey, role) => {
            await handleUpdateMemberRole(memberKey, role);
          }}
          onRemoveMember={async (memberKey, email, uid) => {
            await handleRemoveMember(memberKey, email, uid);
          }}
          onToggleLinkSharing={async (enabled, role) => {
            if (selectedListForShare) {
              await updateListShareLinkSettings(selectedListForShare.id, enabled, role, user);
            }
          }}
          onLeaveList={async () => {
            if (selectedListForShare) {
              handleLeaveList(selectedListForShare);
              setIsShareModalOpen(false);
            }
          }}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />
      )}

      {/* Join Shared List Modal */}
      <JoinListModal
        isOpen={isJoinModalOpen}
        onClose={() => {
          setIsJoinModalOpen(false);
          setJoinModalInvitation(null);
        }}
        list={joinModalInvitation ? {
          id: joinModalInvitation.listId,
          title: joinModalInvitation.listTitle,
          color: joinModalInvitation.listColor,
          icon: joinModalInvitation.listIcon,
          ownerEmail: joinModalInvitation.ownerEmail,
          ownerName: joinModalInvitation.ownerName,
          shareLinkRole: joinModalInvitation.role,
        } : null}
        currentUser={user}
        language={language}
        onJoin={async () => {
          if (joinModalInvitation) {
            await handleAcceptInvitation(joinModalInvitation);
          }
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* PWA Install Modal */}
      <InstallAppModal
        isOpen={pwa.isModalOpen}
        onClose={() => pwa.setIsModalOpen(false)}
        onNativeInstall={pwa.promptInstall}
        canNativePrompt={pwa.canNativePrompt}
        isIOS={pwa.isIOS}
        isAndroid={pwa.isAndroid}
        language={language}
      />

      {/* Authentication Modal (Google & Any Email) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSignInWithGoogle={signInWithGoogle}
        onSignInWithEmail={signInWithEmail}
        onSignUpWithEmail={signUpWithEmail}
        onSendPasswordReset={sendPasswordReset}
        isLoggingIn={isLoggingIn}
        error={authError}
        onClearError={clearAuthError}
        language={language}
      />

      {/* First-Time User Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={handleCloseOnboarding}
        language={language}
        onLanguageChange={handleLanguageChange}
        theme={theme}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} language={language} />
    </div>
  );
}
