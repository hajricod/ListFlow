/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  AppList,
  AppView,
  ListGroup,
  ListItem,
  Language,
  Theme,
  ThemeColor,
  FontFamily,
  FontSize,
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
  loadStoredFontFamily,
  saveStoredFontFamily,
  loadStoredFontSize,
  saveStoredFontSize,
  loadStoredSound,
  saveStoredSound,
  loadStoredGridColumns,
  saveStoredGridColumns,
  loadStoredCountHighlightedOnly,
  saveStoredCountHighlightedOnly,
  DEFAULT_FILTER_STATE,
  loadStoredListFilters,
  saveStoredListFilters,
  loadStoredCollapsedGroups,
  saveStoredCollapsedGroups,
  loadStoredGroupOrders,
  saveStoredGroupOrders,
  loadStoredOnboardingSeen,
  saveStoredOnboardingSeen,
  clearGuestStorage,
  removeOtherUsersStorage,
  getLastActiveUserId,
  setLastActiveUserId,
  getLocalizedTemplate,
  TemplateKey,
  SEED_TEMPLATES,
  SEED_LISTS,
} from './utils/storage';
import { getTranslation } from './locales/translations';
import { sounds } from './utils/audio';
import { applyThemeColorToDOM, getThemeColorOption } from './utils/themeColors';
import { applyTypographyToDOM } from './utils/typography';

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
import { SubscriptionModal } from './components/SubscriptionModal';
import { ToastContainer } from './components/Toast';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useAuth } from './hooks/useAuth';
import { WorkspaceBackupData } from './lib/googleDrive';
import { UserSubscription } from './types';
import {
  getLocalSubscription,
  setLocalSubscription,
  isProUser,
} from './utils/subscription';
import {
  saveUserSubscription,
  fetchUserCloudData,
  fetchUserProfilePreferences,
  subscribeToUserCloudData,
  UserCloudSubscription,
  syncAllToFirestore,
  syncUserProfile,
  isQuotaExceededError,
  saveUserOnboardingSeen,
  shareListWithUser,
  updateMemberRole,
  removeMemberFromList,
  leaveSharedList,
  acceptListInvitation,
  rejectListInvitation,
  fetchListShareDetails,
  listenToPendingInvitations,
  updateListShareLinkSettings,
  saveItemToFirestore,
  updateItemFieldsInFirestore,
  saveItemsBatchToFirestore,
  saveGroupToFirestore,
  updateGroupFieldsInFirestore,
  saveGroupsBatchToFirestore,
  saveListToFirestore,
  deleteItemFromFirestore,
  deleteItemsFromFirestore,
  deleteGroupFromFirestore,
  deleteListFromFirestore,
} from './utils/firestoreSync';
import { Plus, ListTodo, Layers, Users, Check, Pencil } from 'lucide-react';
import { IconRenderer } from './components/IconRenderer';

export default function App() {
  // 1. Core State
  const [language, setLanguage] = useState<Language>(() => loadStoredLanguage());
  const [theme, setTheme] = useState<Theme>(() => loadStoredTheme());
  const [themeColor, setThemeColor] = useState<ThemeColor>(() => loadStoredThemeColor());
  const [fontFamily, setFontFamily] = useState<FontFamily>(() => loadStoredFontFamily());
  const [fontSize, setFontSize] = useState<FontSize>(() => loadStoredFontSize());
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
  const [subscription, setSubscription] = useState<UserSubscription>(getLocalSubscription);
  const isPro = isProUser(subscription);

  const [lists, setLists] = useState<AppList[]>(() => loadStoredLists());
  const [activeListId, setActiveListId] = useState<string>(() => loadActiveListId(lists));

  const listsRef = React.useRef(lists);
  listsRef.current = lists;
  const activeListIdRef = React.useRef(activeListId);
  activeListIdRef.current = activeListId;

  // Checks whether a list should sync to Firestore:
  // - Pro users sync all lists to cloud
  // - Free users sync shared lists they participate in
  const canSyncTargetList = (targetListId?: string): boolean => {
    if (!user) return false;
    if (isPro) return true;
    const targetId = targetListId || activeListIdRef.current;
    const target = listsRef.current.find((l) => l.id === targetId);
    if (!target) return false;
    return Boolean(
      target.isShared ||
      (target.collaboratorUids && target.collaboratorUids.length > 1) ||
      (target.ownerId && target.ownerId !== user.uid)
    );
  };

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const prevUserRef = React.useRef<string | null | undefined>(undefined);
  const currentActiveUserIdRef = React.useRef<string | null | undefined>(undefined);
  const isInitialCloudLoadRef = React.useRef<boolean>(false);
  const isRemoteSyncRef = React.useRef<boolean>(false);
  const syncTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const prefSyncTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const debouncedItemUpdatesRef = React.useRef<Map<string, NodeJS.Timeout>>(new Map());

  const queueDebouncedItemFieldUpdate = (
    listId: string,
    itemId: string,
    fields: Partial<ListItem>,
    delayMs = 500
  ) => {
    if (!canSyncTargetList(listId)) return;
    const existingTimer = debouncedItemUpdatesRef.current.get(itemId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    const timer = setTimeout(async () => {
      debouncedItemUpdatesRef.current.delete(itemId);
      try {
        await updateItemFieldsInFirestore(listId, itemId, fields);
        setSyncStatus('synced');
      } catch (err) {
        if (isQuotaExceededError(err)) {
          setSyncStatus('quota-exceeded');
        } else if (
          (err as { code?: string })?.code === 'permission-denied' ||
          String(err).includes('insufficient permissions')
        ) {
          setSyncStatus('synced');
        } else {
          setSyncStatus('error');
        }
      }
    }, delayMs);
    debouncedItemUpdatesRef.current.set(itemId, timer);
  };

  const [currentView, setCurrentView] = useState<AppView>('workspace');

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const [groups, setGroups] = useState<ListGroup[]>(() => {
    const rawGroups = loadStoredGroups();
    const collapsedSet = new Set(loadStoredCollapsedGroups());
    return rawGroups.map((g) => ({
      ...g,
      isCollapsed: collapsedSet.has(g.id),
    }));
  });
  const [userGroupOrders, setUserGroupOrders] = useState<Record<string, string[]>>(() =>
    loadStoredGroupOrders()
  );
  const [items, setItems] = useState<ListItem[]>(() => loadStoredItems());

  // 2. Filters & Search State (Scoped per List)
  const [listFilters, setListFilters] = useState<Record<string, FilterState>>(() => {
    const stored = loadStoredListFilters();
    const legacyCountHighlighted = loadStoredCountHighlightedOnly();
    if (Object.keys(stored).length === 0 && legacyCountHighlighted) {
      return {
        'list-groceries': {
          ...DEFAULT_FILTER_STATE,
          countHighlightedOnly: true,
        },
      };
    }
    return stored;
  });
  const [searchQueriesByList, setSearchQueriesByList] = useState<Record<string, string>>({});
  const [gridColumns, setGridColumns] = useState<1 | 2>(() => loadStoredGridColumns());

  // Derive filter state and search query for the active list
  const filterState = useMemo<FilterState>(() => {
    return listFilters[activeListId] || DEFAULT_FILTER_STATE;
  }, [listFilters, activeListId]);

  const searchQuery = searchQueriesByList[activeListId] || '';

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQueriesByList((prev) => ({
        ...prev,
        [activeListId || 'default']: query,
      }));
    },
    [activeListId]
  );

  const handleFilterChange = useCallback(
    (newFilters: Partial<FilterState>) => {
      const targetKey = activeListId || 'default';
      setListFilters((prev) => {
        const current = prev[targetKey] || DEFAULT_FILTER_STATE;
        return {
          ...prev,
          [targetKey]: {
            ...current,
            ...newFilters,
          },
        };
      });
    },
    [activeListId]
  );

  // Persist list filters whenever they change
  useEffect(() => {
    saveStoredListFilters(listFilters, user?.uid);
    saveStoredCountHighlightedOnly(Boolean(filterState.countHighlightedOnly), user?.uid);
  }, [listFilters, filterState.countHighlightedOnly, user?.uid]);

  // Persist locally collapsed groups whenever groups change
  useEffect(() => {
    const collapsedIds = groups.filter((g) => g.isCollapsed).map((g) => g.id);
    saveStoredCollapsedGroups(collapsedIds, user?.uid);
  }, [groups, user?.uid]);

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
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

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

  const draggingGroupIdRef = useRef<string | null>(null);
  const draggingItemIdRef = useRef<string | null>(null);
  const groupDropPositionRef = useRef<'above' | 'below' | null>(null);
  const itemDropPositionRef = useRef<'above' | 'below' | null>(null);
  const cloudSubscriptionRef = useRef<UserCloudSubscription | null>(null);

  const t = getTranslation(language);

  // Sync Language and Direction with DOM and persist language preference
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    saveStoredLanguage(language, user?.uid);
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

  const handleFontFamilyChange = useCallback(
    (newFont: FontFamily) => {
      setFontFamily(newFont);
      saveStoredFontFamily(newFont, user?.uid);
      applyTypographyToDOM(newFont, fontSize);
      if (user) {
        syncUserProfile(user, { fontFamily: newFont }).catch((err) => {
          console.warn('Font family profile sync warning:', err);
        });
      }
    },
    [user, fontSize]
  );

  const handleFontSizeChange = useCallback(
    (newSize: FontSize) => {
      setFontSize(newSize);
      saveStoredFontSize(newSize, user?.uid);
      applyTypographyToDOM(fontFamily, newSize);
      if (user) {
        syncUserProfile(user, { fontSize: newSize }).catch((err) => {
          console.warn('Font size profile sync warning:', err);
        });
      }
    },
    [user, fontFamily]
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

  // Apply Typography to DOM & persist to storage
  useEffect(() => {
    applyTypographyToDOM(fontFamily, fontSize);
    saveStoredFontFamily(fontFamily, user?.uid);
    saveStoredFontSize(fontSize, user?.uid);
  }, [fontFamily, fontSize, user?.uid]);

  const checkedOnboardingUserUidsRef = useRef<Set<string>>(new Set());

  // First-time user onboarding trigger: Only appears once for the first time a user logs in on ANY device
  useEffect(() => {
    // Only trigger onboarding for authenticated users
    if (!user?.uid || authLoading) {
      return;
    }

    const uid = user.uid;
    if (checkedOnboardingUserUidsRef.current.has(uid)) {
      return;
    }
    checkedOnboardingUserUidsRef.current.add(uid);

    const hasSeenLocally = loadStoredOnboardingSeen(uid);
    if (hasSeenLocally) {
      return;
    }

    // Check remote Firestore user profile across devices
    fetchUserProfilePreferences(uid)
      .then((cloudPrefs) => {
        if (cloudPrefs?.onboardingSeen === true) {
          // User already completed onboarding on another device
          saveStoredOnboardingSeen(true, uid);
        } else {
          // Truly the first time this user has logged in across any device
          const timer = setTimeout(() => {
            setIsOnboardingModalOpen(true);
          }, 600);
          return () => clearTimeout(timer);
        }
      })
      .catch((err) => {
        console.warn('Onboarding check error:', err);
      });
  }, [user?.uid, authLoading]);

  const handleCloseOnboarding = useCallback(() => {
    setIsOnboardingModalOpen(false);
    saveStoredOnboardingSeen(true, user?.uid);
    if (user?.uid) {
      saveUserOnboardingSeen(user.uid).catch((err) => {
        console.warn('Could not sync onboarding status to Firestore:', err);
      });
    }
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
        // Dynamically update PWA status bar / header color for dark theme
        const metaTags = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
        metaTags.forEach((meta) => {
          meta.content = '#171717'; // matches dark navbar bg-neutral-900
        });
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
        // Dynamically update PWA status bar / header color for light theme
        const metaTags = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
        metaTags.forEach((meta) => {
          meta.content = '#ffffff'; // matches light navbar bg-white
        });
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

  // ---------------------------------------------------------------------------
  // Mobile Back Navigation & "Double Back to Exit" Handler
  // ---------------------------------------------------------------------------
  const lastBackPressRef = useRef<number>(0);
  const backPressTimerRef = useRef<number | null>(null);
  const isExitingRef = useRef<boolean>(false);
  const languageRef = useRef(language);
  languageRef.current = language;
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;
  const pwaRef = useRef(pwa);
  pwaRef.current = pwa;

  const overlaysStateRef = useRef({
    isSidebarOpen,
    confirmModalOpen: confirmModalState.isOpen,
    isItemModalOpen,
    isGroupModalOpen,
    isListModalOpen,
    isShareModalOpen,
    isTemplatesModalOpen,
    isShortcutsModalOpen,
    isJoinModalOpen,
    isOnboardingModalOpen,
    isAuthModalOpen,
    isPwaModalOpen: pwa.isModalOpen,
    isSettingsView: currentView === 'settings',
  });

  useEffect(() => {
    overlaysStateRef.current = {
      isSidebarOpen,
      confirmModalOpen: confirmModalState.isOpen,
      isItemModalOpen,
      isGroupModalOpen,
      isListModalOpen,
      isShareModalOpen,
      isTemplatesModalOpen,
      isShortcutsModalOpen,
      isJoinModalOpen,
      isOnboardingModalOpen,
      isAuthModalOpen,
      isPwaModalOpen: pwa.isModalOpen,
      isSettingsView: currentView === 'settings',
    };
  }, [
    isSidebarOpen,
    confirmModalState.isOpen,
    isItemModalOpen,
    isGroupModalOpen,
    isListModalOpen,
    isShareModalOpen,
    isTemplatesModalOpen,
    isShortcutsModalOpen,
    isJoinModalOpen,
    isOnboardingModalOpen,
    isAuthModalOpen,
    pwa.isModalOpen,
    currentView,
  ]);

  useEffect(() => {
    // Prime the history stack with an app entry point only once on mount
    try {
      window.history.pushState({ app: 'listflow-root' }, '');
    } catch {
      // Ignore if iframe or restricted environment
    }

    const handlePopState = () => {
      // If user confirmed exit, allow normal browser back navigation without re-intercepting
      if (isExitingRef.current) {
        return;
      }

      const overlays = overlaysStateRef.current;

      // 1. If any drawer, modal, or overlay is open, close it first without exiting
      if (overlays.isSidebarOpen) {
        setIsSidebarOpen(false);
        try {
          window.history.pushState({ app: 'listflow-root' }, '');
        } catch {}
        lastBackPressRef.current = 0;
        return;
      }
      if (overlays.confirmModalOpen) {
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        try {
          window.history.pushState({ app: 'listflow-root' }, '');
        } catch {}
        lastBackPressRef.current = 0;
        return;
      }
      if (overlays.isItemModalOpen) {
        setIsItemModalOpen(false);
        setSelectedItemForEdit(null);
        try {
          window.history.pushState({ app: 'listflow-root' }, '');
        } catch {}
        lastBackPressRef.current = 0;
        return;
      }
      if (overlays.isGroupModalOpen) {
        setIsGroupModalOpen(false);
        setSelectedGroupForEdit(null);
        try {
          window.history.pushState({ app: 'listflow-root' }, '');
        } catch {}
        lastBackPressRef.current = 0;
        return;
      }
      if (overlays.isListModalOpen) {
        setIsListModalOpen(false);
        setSelectedListForEdit(null);
        try {
          window.history.pushState({ app: 'listflow-root' }, '');
        } catch {}
        lastBackPressRef.current = 0;
        return;
      }
      if (overlays.isShareModalOpen) {
        setIsShareModalOpen(false);
        setSelectedListForShare(null);
        try {
          window.history.pushState({ app: 'listflow-root' }, '');
        } catch {}
        lastBackPressRef.current = 0;
        return;
      }
      if (overlays.isTemplatesModalOpen) {
        setIsTemplatesModalOpen(false);
        try {
          window.history.pushState({ app: 'listflow-root' }, '');
        } catch {}
        lastBackPressRef.current = 0;
        return;
      }
      if (overlays.isShortcutsModalOpen) {
        setIsShortcutsModalOpen(false);
        try {
          window.history.pushState({ app: 'listflow-root' }, '');
        } catch {}
        lastBackPressRef.current = 0;
        return;
      }
      if (overlays.isJoinModalOpen) {
        setIsJoinModalOpen(false);
        setJoinModalInvitation(null);
        try {
          window.history.pushState({ app: 'listflow-root' }, '');
        } catch {}
        lastBackPressRef.current = 0;
        return;
      }
      if (overlays.isOnboardingModalOpen) {
        setIsOnboardingModalOpen(false);
        try {
          window.history.pushState({ app: 'listflow-root' }, '');
        } catch {}
        lastBackPressRef.current = 0;
        return;
      }
      if (overlays.isAuthModalOpen) {
        setIsAuthModalOpen(false);
        try {
          window.history.pushState({ app: 'listflow-root' }, '');
        } catch {}
        lastBackPressRef.current = 0;
        return;
      }
      if (overlays.isPwaModalOpen) {
        pwaRef.current.setIsModalOpen(false);
        try {
          window.history.pushState({ app: 'listflow-root' }, '');
        } catch {}
        lastBackPressRef.current = 0;
        return;
      }

      // 2. If in Settings view, return to workspace
      if (overlays.isSettingsView) {
        setCurrentView('workspace');
        try {
          window.history.pushState({ app: 'listflow-root' }, '');
        } catch {}
        lastBackPressRef.current = 0;
        return;
      }

      // 3. User is on the main workspace: double back to exit logic
      const now = Date.now();
      const DOUBLE_BACK_DELAY_MS = 2000;

      if (now - lastBackPressRef.current < DOUBLE_BACK_DELAY_MS) {
        // Second back press within 2 seconds: allow exit
        isExitingRef.current = true;
        lastBackPressRef.current = 0;
        if (backPressTimerRef.current) {
          clearTimeout(backPressTimerRef.current);
          backPressTimerRef.current = null;
        }

        // 1. If in Tauri desktop/mobile app, invoke process exit
        try {
          if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
            (window as any).__TAURI_INTERNALS__.invoke('plugin:process|exit', { code: 0 });
          }
        } catch {}

        // 2. If in Cordova/Capacitor/WebView wrapper
        try {
          if (typeof navigator !== 'undefined' && (navigator as any).app?.exitApp) {
            (navigator as any).app.exitApp();
          }
        } catch {}

        // 3. Try window.close() (effective for standalone PWAs or script-launched windows)
        try {
          window.close();
        } catch {}

        // 4. Navigate backward to exit the application history
        try {
          // Go back past the prime and toast push states to cleanly exit the app
          window.history.go(-2);
        } catch {
          try {
            window.history.back();
          } catch {}
        }
      } else {
        // First back press: inform user and retain user in the app
        lastBackPressRef.current = now;
        if (backPressTimerRef.current) {
          clearTimeout(backPressTimerRef.current);
        }
        backPressTimerRef.current = window.setTimeout(() => {
          lastBackPressRef.current = 0;
        }, DOUBLE_BACK_DELAY_MS);

        try {
          window.history.pushState({ app: 'listflow-root' }, '');
        } catch {}

        const currentLang = languageRef.current;
        const msg =
          getTranslation(currentLang).pressBackAgainToExit ||
          (currentLang === 'ar' ? 'اضغط رجوع مرة أخرى للخروج' : 'Press back again to exit');
        showToastRef.current(msg, undefined, 'info');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (backPressTimerRef.current) {
        clearTimeout(backPressTimerRef.current);
      }
    };
  }, []);

  // Centralized Helper to Apply and Cache User Preferences
  const applyUserPreferences = useCallback(
    (
      prefs: {
        language?: Language;
        theme?: Theme;
        themeColor?: ThemeColor;
        fontFamily?: FontFamily;
        fontSize?: FontSize;
        soundEnabled?: boolean;
        gridColumns?: 1 | 2;
        activeListId?: string;
        onboardingSeen?: boolean;
        userGroupOrders?: Record<string, string[]>;
        subscription?: UserSubscription;
      },
      uid?: string | null
    ) => {
      if (prefs.subscription) {
        setSubscription(prefs.subscription);
        setLocalSubscription(prefs.subscription);
      }
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
      if (prefs.fontFamily) {
        setFontFamily(prefs.fontFamily);
        saveStoredFontFamily(prefs.fontFamily, uid);
        applyTypographyToDOM(prefs.fontFamily, fontSize);
      }
      if (prefs.fontSize) {
        setFontSize(prefs.fontSize);
        saveStoredFontSize(prefs.fontSize, uid);
        applyTypographyToDOM(fontFamily, prefs.fontSize);
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
      if (prefs.onboardingSeen === true) {
        saveStoredOnboardingSeen(true, uid);
      }
      if (prefs.userGroupOrders && typeof prefs.userGroupOrders === 'object') {
        setUserGroupOrders((prev) => {
          const merged = { ...prev, ...prefs.userGroupOrders };
          saveStoredGroupOrders(merged, uid);
          return merged;
        });
      }
    },
    []
  );

  const handleUpdateSubscription = useCallback(
    async (newSub: UserSubscription) => {
      setSubscription(newSub);
      setLocalSubscription(newSub);
      if (user?.uid) {
        try {
          await saveUserSubscription(user.uid, newSub);
        } catch (err) {
          console.warn('Could not sync subscription to Firestore:', err);
        }
      }
    },
    [user?.uid]
  );

  // Switch Data & Preferences Context based on Auth User Login / Logout
  useEffect(() => {
    if (authLoading) return;

    const currentUid = user?.uid || null;

    if (prevUserRef.current === undefined) {
      prevUserRef.current = currentUid;
      currentActiveUserIdRef.current = currentUid;
      const lastKnownUid = getLastActiveUserId();

      if (currentUid) {
        if (lastKnownUid && lastKnownUid !== currentUid) {
          removeOtherUsersStorage(currentUid);
        }
        setLastActiveUserId(currentUid);
      }

      const initialLists = loadStoredLists(currentUid);
      const rawInitialGroups = loadStoredGroups(currentUid);
      const collapsedSet = new Set(loadStoredCollapsedGroups(currentUid));
      const initialGroups = rawInitialGroups.map((g) => ({
        ...g,
        isCollapsed: collapsedSet.has(g.id),
      }));
      const initialGroupOrders = loadStoredGroupOrders(currentUid);
      const initialItems = loadStoredItems(currentUid);
      const initialActiveListId = loadActiveListId(initialLists, currentUid);
      const initialLang = loadStoredLanguage(currentUid);
      const initialTheme = loadStoredTheme(currentUid);
      const initialThemeColor = loadStoredThemeColor(currentUid);
      const initialFont = loadStoredFontFamily(currentUid);
      const initialFontSize = loadStoredFontSize(currentUid);
      const initialSound = loadStoredSound(currentUid);
      const initialGrid = loadStoredGridColumns(currentUid);

      setLists(initialLists);
      setGroups(initialGroups);
      setUserGroupOrders(initialGroupOrders);
      setItems(initialItems);
      setActiveListId(initialActiveListId);
      setLanguage(initialLang);
      setTheme(initialTheme);
      setThemeColor(initialThemeColor);
      setFontFamily(initialFont);
      setFontSize(initialFontSize);
      applyTypographyToDOM(initialFont, initialFontSize);
      setSoundEnabled(initialSound);
      setGridColumns(initialGrid);
      setListFilters(loadStoredListFilters(currentUid));
      setSearchQueriesByList({});

      // If already logged in on initial load, fetch remote preferences
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

      if (isLogout) {
        // When logging out, DO NOT remove data or settings state.
        // Retain the current data and preferences in state and local storage.
        setSyncStatus('idle');
        showToast(t.logoutSuccess, undefined, 'info');
      } else if (currentUid) {
        // When a user logs in, check if it is a DIFFERENT user than previously active
        const lastKnownUid = getLastActiveUserId();
        const isDifferentUser = Boolean(lastKnownUid && lastKnownUid !== currentUid);

        if (isDifferentUser) {
          // A different user logged in -> remove previous user's local storage and load this user's data
          removeOtherUsersStorage(currentUid);

          const userLists = loadStoredLists(currentUid);
          const rawUserGroups = loadStoredGroups(currentUid);
          const userCollapsedSet = new Set(loadStoredCollapsedGroups(currentUid));
          const userGroups = rawUserGroups.map((g) => ({
            ...g,
            isCollapsed: userCollapsedSet.has(g.id),
          }));
          const userGroupOrdersData = loadStoredGroupOrders(currentUid);
          const userItems = loadStoredItems(currentUid);
          const userActiveListId = loadActiveListId(userLists, currentUid);
          const userLang = loadStoredLanguage(currentUid);
          const userTheme = loadStoredTheme(currentUid);
          const userThemeColor = loadStoredThemeColor(currentUid);
          const userFont = loadStoredFontFamily(currentUid);
          const userFontSize = loadStoredFontSize(currentUid);
          const userSound = loadStoredSound(currentUid);
          const userGrid = loadStoredGridColumns(currentUid);

          setLists(userLists);
          setGroups(userGroups);
          setUserGroupOrders(userGroupOrdersData);
          setItems(userItems);
          setActiveListId(userActiveListId);
          setLanguage(userLang);
          setTheme(userTheme);
          setThemeColor(userThemeColor);
          setFontFamily(userFont);
          setFontSize(userFontSize);
          applyTypographyToDOM(userFont, userFontSize);
          setSoundEnabled(userSound);
          setGridColumns(userGrid);
          setListFilters(loadStoredListFilters(currentUid));
          setSearchQueriesByList({});
        }

        setLastActiveUserId(currentUid);

        // Fetch and apply cloud preferences from database upon login
        fetchUserProfilePreferences(currentUid).then((cloudPrefs) => {
          if (cloudPrefs && currentActiveUserIdRef.current === currentUid) {
            applyUserPreferences(cloudPrefs, currentUid);
          }
        }).catch((err) => {
          console.warn('Login fetchUserProfilePreferences warning:', err);
        });
      }
    }
  }, [authLoading, user?.uid, showToast, t.logoutSuccess, applyUserPreferences]);

  // Auth User Cloud Sync & Real-Time Multi-Device / Shared List Subscription
  useEffect(() => {
    if (!user?.uid || authLoading) {
      setSyncStatus('idle');
      return;
    }

    isInitialCloudLoadRef.current = true;
    setSyncStatus('syncing');

    const subscription = subscribeToUserCloudData(
      user.uid,
      (cloudData) => {
        if (cloudData.pendingInvitations) {
          setPendingInvitations(cloudData.pendingInvitations);
        }

        if (cloudData.lists !== undefined) {
          isRemoteSyncRef.current = true;
          const incomingLists = cloudData.lists || [];
          const cloudListIds = new Set(incomingLists.map((l) => l.id));

          // Detect any shared list that was present locally, but the current user has been removed from
          // (or the list was deleted / unshared)
          const removedSharedListIds = new Set<string>();
          listsRef.current.forEach((localList) => {
            const isExplicitlyRemoved = Boolean(
              localList.removedCollaboratorUids && localList.removedCollaboratorUids.includes(user.uid)
            );
            const isExternalShared = Boolean(
              (localList.ownerId && localList.ownerId !== user.uid && localList.ownerId !== 'guest' && localList.ownerId !== 'local-user') ||
              (localList.myRole && localList.myRole !== 'owner') ||
              (localList.isShared && localList.ownerId && localList.ownerId !== user.uid)
            );

            if (isExplicitlyRemoved || (isExternalShared && !cloudListIds.has(localList.id))) {
              removedSharedListIds.add(localList.id);
            }
          });

          // Check if any incoming list has the user in removedCollaboratorUids
          incomingLists.forEach((cl) => {
            if (cl.removedCollaboratorUids && cl.removedCollaboratorUids.includes(user.uid)) {
              removedSharedListIds.add(cl.id);
            }
          });

          // Filter out removed lists from incoming lists
          const sanitizedCloudLists = incomingLists.filter((l) => !removedSharedListIds.has(l.id));

          let nextLists: AppList[] = [];
          if (isPro) {
            nextLists = sanitizedCloudLists;
          } else {
            // For Free users: retain local private lists, merge incoming shared cloud lists,
            // and strictly exclude any list from which the member was removed
            const localPrivateLists = listsRef.current.filter((l) => {
              if (removedSharedListIds.has(l.id)) return false;
              const isExternal = Boolean(
                (l.ownerId && l.ownerId !== user.uid && l.ownerId !== 'guest' && l.ownerId !== 'local-user') ||
                (l.myRole && l.myRole !== 'owner')
              );
              // External lists are only kept if present in cloud lists
              if (isExternal) {
                return cloudListIds.has(l.id);
              }
              // User's own local lists are preserved
              return true;
            });

            const cloudMap = new Map(sanitizedCloudLists.map((l) => [l.id, l]));
            const merged = localPrivateLists.map((l) => cloudMap.get(l.id) || l);
            sanitizedCloudLists.forEach((cl) => {
              if (!merged.some((m) => m.id === cl.id)) {
                merged.push(cl);
              }
            });
            nextLists = merged;
          }

          // If no lists remain at all, restore default seed lists
          if (nextLists.length === 0) {
            const seed = SEED_LISTS[language] || SEED_LISTS.en;
            nextLists = seed;
          }

          setLists(nextLists);
          saveStoredLists(nextLists, user.uid);

          // Synchronize and filter groups: completely discard groups belonging to removed lists
          setGroups((prevGroups) => {
            const currentCollapsedMap = new Map(prevGroups.map((g) => [g.id, Boolean(g.isCollapsed)]));
            const localStoredCollapsed = new Set(loadStoredCollapsedGroups(user.uid));

            let nextGroups: ListGroup[] = [];
            if (isPro && cloudData.groups) {
              nextGroups = cloudData.groups
                .filter((cg) => {
                  if (cg.listId && removedSharedListIds.has(cg.listId)) return false;
                  return true;
                })
                .map((cg) => ({
                  ...cg,
                  isCollapsed: currentCollapsedMap.has(cg.id)
                    ? Boolean(currentCollapsedMap.get(cg.id))
                    : localStoredCollapsed.has(cg.id),
                }));
            } else {
              const cloudGroupIds = new Set((cloudData.groups || []).map((g) => g.id));
              // Retain local groups for valid lists only
              const localGroups = prevGroups.filter((g) => {
                if (g.listId && removedSharedListIds.has(g.listId)) return false;
                if (g.listId && !nextLists.some((l) => l.id === g.listId)) return false;
                return !cloudGroupIds.has(g.id);
              });
              const syncedCloudGroups = (cloudData.groups || [])
                .filter((cg) => !cg.listId || (!removedSharedListIds.has(cg.listId) && nextLists.some((l) => l.id === cg.listId)))
                .map((cg) => ({
                  ...cg,
                  isCollapsed: currentCollapsedMap.has(cg.id)
                    ? Boolean(currentCollapsedMap.get(cg.id))
                    : localStoredCollapsed.has(cg.id),
                }));
              nextGroups = [...localGroups, ...syncedCloudGroups];
            }
            saveStoredGroups(nextGroups, user.uid);
            return nextGroups;
          });

          // Synchronize and filter items: completely discard items belonging to removed lists
          setItems((prevItems) => {
            let nextItems: ListItem[] = [];
            if (isPro && cloudData.items) {
              nextItems = cloudData.items.filter((i) => {
                const itemExplicitListId = (i as unknown as { listId?: string }).listId;
                if (itemExplicitListId && removedSharedListIds.has(itemExplicitListId)) return false;
                return true;
              });
            } else {
              const cloudItemIds = new Set((cloudData.items || []).map((i) => i.id));
              const localItems = prevItems.filter((i) => {
                const itemExplicitListId = (i as unknown as { listId?: string }).listId;
                if (itemExplicitListId && (removedSharedListIds.has(itemExplicitListId) || !nextLists.some((l) => l.id === itemExplicitListId))) {
                  return false;
                }
                return !cloudItemIds.has(i.id);
              });
              const validCloudItems = (cloudData.items || []).filter((i) => {
                const itemExplicitListId = (i as unknown as { listId?: string }).listId;
                if (itemExplicitListId && removedSharedListIds.has(itemExplicitListId)) return false;
                return true;
              });
              nextItems = [...localItems, ...validCloudItems];
            }
            saveStoredItems(nextItems, user.uid);
            return nextItems;
          });

          // Handle active list and share modal if active list was removed
          if (removedSharedListIds.size > 0) {
            setActiveListId((curr) => {
              if (removedSharedListIds.has(curr) || !nextLists.some((l) => l.id === curr)) {
                const validId = nextLists[0]?.id || 'list-groceries';
                saveActiveListId(validId, user.uid);
                return validId;
              }
              return curr;
            });

            setSelectedListForShare((curr) => {
              if (curr && (removedSharedListIds.has(curr.id) || !nextLists.some((l) => l.id === curr.id))) {
                setIsShareModalOpen(false);
                return null;
              }
              return curr ? nextLists.find((l) => l.id === curr.id) || null : null;
            });

            showToast(
              language === 'ar'
                ? 'تمت إزالتك من قائمة مشتركة وحذفها من مساحة عملك'
                : 'You were removed from a shared list and it has been removed from your workspace',
              undefined,
              'info'
            );
          } else {
            // Keep selectedListForShare synchronized with incoming cloud updates
            setSelectedListForShare((curr) =>
              curr ? nextLists.find((l) => l.id === curr.id) || null : null
            );

            // Ensure activeListId points to a valid list
            setActiveListId((curr) => {
              const listExists = nextLists.some((l) => l.id === curr);
              const validId = listExists ? curr : nextLists[0]?.id || curr;
              saveActiveListId(validId, user.uid);
              return validId;
            });
          }

          // Apply cloud preferences from Firestore on initial cloud load ONLY
          if (cloudData.preferences && isInitialCloudLoadRef.current) {
            applyUserPreferences(cloudData.preferences, user.uid);
          }

          if (isInitialCloudLoadRef.current) {
            showToast(t.loginSuccess, undefined, 'success');
            isInitialCloudLoadRef.current = false;
          }

          setSyncStatus('synced');
        } else if (isInitialCloudLoadRef.current) {
          isInitialCloudLoadRef.current = false;
          // Seed cloud only if user is Pro
          if (isPro) {
            const currentLocalLists = loadStoredLists(user.uid);
            const currentLocalGroups = loadStoredGroups(user.uid);
            const currentLocalItems = loadStoredItems(user.uid);

            if (currentLocalLists.length > 0) {
              syncAllToFirestore(user.uid, currentLocalLists, currentLocalGroups, currentLocalItems);
              syncUserProfile(user, {
                language,
                theme,
                themeColor,
                soundEnabled,
                gridColumns,
                activeListId,
              });
            }
          }
          showToast(t.loginSuccess, undefined, 'success');
          setSyncStatus('synced');
        }
      },
      (err) => {
        if (isQuotaExceededError(err)) {
          console.warn('Real-time subscription quota exceeded. Seamlessly operating in offline local mode.');
          setSyncStatus('quota-exceeded');
        } else if (
          (err as { code?: string })?.code === 'permission-denied' ||
          String(err).includes('insufficient permissions')
        ) {
          console.warn('Firestore subscription permissions pending or updating. Using local offline mode.');
          setSyncStatus('offline');
        } else {
          console.error('Real-time subscription error:', err);
          setSyncStatus('error');
        }
      },
      {
        initialActiveListId: activeListId,
        cachedGroups: loadStoredGroups(user.uid),
        cachedItems: loadStoredItems(user.uid),
      }
    );

    cloudSubscriptionRef.current = subscription;

    return () => {
      subscription();
      cloudSubscriptionRef.current = null;
    };
  }, [user?.uid, authLoading, isPro, showToast, t.loginSuccess, applyUserPreferences]);

  // Active-List optimization: dynamically switch real-time listener when user selects another list
  useEffect(() => {
    if (cloudSubscriptionRef.current && activeListId) {
      cloudSubscriptionRef.current.switchActiveList(activeListId);
    }
  }, [activeListId]);

  // Local persistence whenever Lists, Groups, or Items change locally
  useEffect(() => {
    const currentUid = user?.uid;
    saveStoredLists(lists, currentUid);
    saveStoredGroups(groups, currentUid);
    saveStoredItems(items, currentUid);
  }, [lists, groups, items, user?.uid]);

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
          fontFamily,
          fontSize,
          soundEnabled,
          gridColumns,
          activeListId,
        });
      } catch (err) {
        if (isQuotaExceededError(err)) {
          console.warn('Preferences sync quota exceeded. Preferences preserved in local storage.');
        } else {
          console.error('Preferences sync to Firestore failed:', err);
        }
      }
    }, 1500);

    return () => {
      if (prefSyncTimeoutRef.current) {
        clearTimeout(prefSyncTimeoutRef.current);
      }
    };
  }, [user, language, theme, themeColor, fontFamily, fontSize, soundEnabled, gridColumns, activeListId]);

  // Handle Online / Offline Connectivity Resumption
  useEffect(() => {
    const handleOnline = () => {
      if (user) {
        setSyncStatus('synced');
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
  }, [user]);

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
    const listGroups = groups.filter((g) => (g.listId || 'list-groceries') === activeListId);
    const orderList = userGroupOrders[activeListId];

    if (orderList && orderList.length > 0) {
      const orderMap = new Map<string, number>();
      orderList.forEach((id, index) => {
        orderMap.set(id, index);
      });
      return [...listGroups].sort((a, b) => {
        const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
        const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;
        if (orderA !== orderB) return orderA - orderB;
        return (a.order ?? 0) - (b.order ?? 0);
      });
    }

    return [...listGroups].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [groups, activeListId, userGroupOrders]);

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
  const totalItems = filterState.countHighlightedOnly
    ? activeListItems.filter((i) => i.isHighlighted).length
    : activeListItems.length;
  const collectedItems = filterState.countHighlightedOnly
    ? activeListItems.filter((i) => i.isHighlighted && i.completed).length
    : activeListItems.filter((i) => i.completed).length;
  const remainingItems = Math.max(0, totalItems - collectedItems);
  const highlightedItemsCount = activeListItems.filter((i) => i.isHighlighted).length;

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

  // Helper to consistently sort items of any group list by pin, completion, manual order, and fallback creation date
  const getSortedGroupItems = useCallback(
    (sourceList: ListItem[], groupId: string) => {
      const groupItems = sourceList.filter((i) => i.groupId === groupId);
      const pinned = groupItems.filter((i) => i.isPinned);
      const unpinned = groupItems.filter((i) => !i.isPinned);

      const sortFn = (a: ListItem, b: ListItem) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        const orderA = typeof a.order === 'number' ? a.order : 0;
        const orderB = typeof b.order === 'number' ? b.order : 0;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      };

      return [...pinned.sort(sortFn), ...unpinned.sort(sortFn)];
    },
    []
  );

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

        if (filterState.sortBy === 'highlighted') {
          const highA = a.isHighlighted ? 1 : 0;
          const highB = b.isHighlighted ? 1 : 0;
          if (highA !== highB) {
            return highB - highA;
          }
        } else if (filterState.sortBy === 'alphabetical') {
          return a.title.localeCompare(b.title);
        } else if (filterState.sortBy === 'quantity') {
          return (b.quantity || 1) - (a.quantity || 1);
        } else if (filterState.sortBy === 'createdAt') {
          return b.createdAt.localeCompare(a.createdAt);
        }

        const orderA = typeof a.order === 'number' ? a.order : 0;
        const orderB = typeof b.order === 'number' ? b.order : 0;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return (a.createdAt || '').localeCompare(b.createdAt || '');
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

      // 1. Ensure the group containing the found item is expanded so it's visible locally
      setGroups((prevGroups) => {
        const updated = prevGroups.map((g) => {
          if (g.id === targetGroupId && g.isCollapsed) {
            return { ...g, isCollapsed: false };
          }
          return g;
        });
        const collapsedIds = updated.filter((g) => g.isCollapsed).map((g) => g.id);
        saveStoredCollapsedGroups(collapsedIds, user?.uid);
        return updated;
      });

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
      const updatedList: AppList = { ...selectedListForEdit, ...listData };
      setLists((prev) =>
        prev.map((l) => (l.id === selectedListForEdit.id ? updatedList : l))
      );
      if (canSyncTargetList(updatedList.id)) {
        saveListToFirestore(updatedList, user.uid);
      }
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
      if (canSyncTargetList(newList.id)) {
        saveListToFirestore(newList, user.uid);
      }
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

        setListFilters((prev) => {
          const next = { ...prev };
          delete next[listToDelete.id];
          return next;
        });
        setSearchQueriesByList((prev) => {
          const next = { ...prev };
          delete next[listToDelete.id];
          return next;
        });

        showToast(t.listDeleted);

        if (canSyncTargetList(listToDelete.id)) {
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
    if (!isProUser(subscription)) {
      setIsSubscriptionModalOpen(true);
      showToast(
        language === 'ar'
          ? 'مشاركة القوائم والتعاون المباشر تتطلب الاشتراك في باقة برو'
          : 'List sharing & live collaboration require List Flow Pro subscription',
        4000,
        'info'
      );
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
            const remaining = lists.filter((l) => l.id !== listToLeave.id);
            const nextLists = remaining.length > 0 ? remaining : (SEED_LISTS[language] || SEED_LISTS.en);
            setLists(nextLists);
            saveStoredLists(nextLists, user.uid);

            setGroups((prev) => {
              const updated = prev.filter((g) => g.listId !== listToLeave.id);
              saveStoredGroups(updated, user.uid);
              return updated;
            });

            setItems((prev) => {
              const updated = prev.filter((i) => {
                const itemLid = (i as unknown as { listId?: string }).listId;
                return itemLid !== listToLeave.id;
              });
              saveStoredItems(updated, user.uid);
              return updated;
            });

            if (activeListId === listToLeave.id) {
              const validId = nextLists[0]?.id || 'list-groceries';
              setActiveListId(validId);
              saveActiveListId(validId, user.uid);
            }

            if (selectedListForShare?.id === listToLeave.id) {
              setIsShareModalOpen(false);
              setSelectedListForShare(null);
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
    if (listFilters[listToDup.id]) {
      setListFilters((prev) => ({
        ...prev,
        [newListId]: { ...listFilters[listToDup.id] },
      }));
    }
    setActiveListId(newListId);

    if (canSyncTargetList(duplicatedList.id)) {
      saveListToFirestore(duplicatedList, user.uid);
      saveGroupsBatchToFirestore(newListId, newGroups);
      saveItemsBatchToFirestore(newListId, newItems);
    }

    showToast(language === 'ar' ? 'تم تكرار القائمة بنجاح' : 'List duplicated successfully');
  };

  // Group Handlers
  const handleAddGroup = (groupData: { id?: string; title: string; color: string; icon: string }) => {
    sounds.playPop();
    if (groupData.id) {
      // Edit
      const existingGroup = groups.find((g) => g.id === groupData.id);
      const updatedGroup: ListGroup = {
        ...(existingGroup || { id: groupData.id, listId: activeListId, createdAt: new Date().toISOString() }),
        ...groupData,
      };
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupData.id ? updatedGroup : g
        )
      );
      if (canSyncTargetList(updatedGroup.listId || activeListId)) {
        saveGroupToFirestore(updatedGroup.listId || activeListId, updatedGroup);
      }
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
      setUserGroupOrders((prev) => {
        const currentListOrders = prev[activeListId] ? [...prev[activeListId]] : activeGroups.map((g) => g.id);
        if (!currentListOrders.includes(newGroupId)) {
          currentListOrders.push(newGroupId);
        }
        const updated = { ...prev, [activeListId]: currentListOrders };
        saveStoredGroupOrders(updated, user?.uid);
        if (user?.uid) {
          syncUserProfile(user.uid, { userGroupOrders: updated });
        }
        return updated;
      });
      if (canSyncTargetList(activeListId)) {
        saveGroupToFirestore(activeListId, newGroup);
      }
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
    setUserGroupOrders((prev) => {
      const currentListOrders = prev[activeListId] ? [...prev[activeListId]] : activeGroups.map((g) => g.id);
      const dupIdx = currentListOrders.indexOf(groupToDup.id);
      if (dupIdx !== -1) {
        currentListOrders.splice(dupIdx + 1, 0, newGroupId);
      } else {
        currentListOrders.push(newGroupId);
      }
      const updated = { ...prev, [activeListId]: currentListOrders };
      saveStoredGroupOrders(updated, user?.uid);
      if (user?.uid) {
        syncUserProfile(user.uid, { userGroupOrders: updated });
      }
      return updated;
    });

    if (canSyncTargetList(groupToDup.listId || activeListId)) {
      saveGroupToFirestore(groupToDup.listId || activeListId, newGroup);
      saveItemsBatchToFirestore(groupToDup.listId || activeListId, newItems);
    }

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
        setUserGroupOrders((prev) => {
          if (!prev[targetListId]) return prev;
          const filtered = prev[targetListId].filter((id) => id !== groupId);
          const updated = { ...prev, [targetListId]: filtered };
          saveStoredGroupOrders(updated, user?.uid);
          if (user?.uid) {
            syncUserProfile(user.uid, { userGroupOrders: updated });
          }
          return updated;
        });

        if (canSyncTargetList(targetListId)) {
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
          if (canSyncTargetList(targetListId)) {
            saveGroupToFirestore(targetListId, groupToDelete);
            saveItemsBatchToFirestore(targetListId, itemsToDelete);
          }
        });
      },
    });
  };

  const handleToggleCollapseGroup = (groupId: string) => {
    sounds.playPop();
    const currentGroup = groups.find((g) => g.id === groupId);
    const nextCollapsedState = currentGroup ? !Boolean(currentGroup.isCollapsed) : true;

    const updatedGroups = groups.map((g) =>
      g.id === groupId ? { ...g, isCollapsed: nextCollapsedState } : g
    );

    setGroups(updatedGroups);

    // Save to local storage collapsed IDs immediately for current user
    const collapsedIds = updatedGroups.filter((g) => g.isCollapsed).map((g) => g.id);
    saveStoredCollapsedGroups(collapsedIds, user?.uid);
  };

  const handleToggleCollapseAll = () => {
    sounds.playPop();
    const nextState = !allCollapsed;

    const updatedGroups = groups.map((g) => {
      if ((g.listId || 'list-groceries') === activeListId) {
        return { ...g, isCollapsed: nextState };
      }
      return g;
    });

    setGroups(updatedGroups);

    const collapsedIds = updatedGroups.filter((g) => g.isCollapsed).map((g) => g.id);
    saveStoredCollapsedGroups(collapsedIds, user?.uid);
  };

  const handleClearCompletedInGroup = async (groupId: string) => {
    const completedInGroup = items.filter(
      (i) =>
        i.groupId === groupId &&
        i.completed &&
        (filterState.countHighlightedOnly ? i.isHighlighted : true)
    );
    if (completedInGroup.length === 0) return;

    const targetGroup = groups.find((g) => g.id === groupId);
    const targetListId = targetGroup?.listId || activeListId || 'list-groceries';
    const itemIdsToDelete = completedInGroup.map((i) => i.id);
    const deleteIdSet = new Set(itemIdsToDelete);

    sounds.playDelete();
    setItems((prev) => prev.filter((i) => !deleteIdSet.has(i.id)));

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
        saveItemsBatchToFirestore(targetListId, completedInGroup);
      }
    });
  };

  const handleClearAllCompleted = async () => {
    const completedList = items.filter(
      (i) =>
        i.completed &&
        (filterState.countHighlightedOnly ? i.isHighlighted : true)
    );
    if (completedList.length === 0) return;

    const deleteIdSet = new Set(completedList.map((i) => i.id));
    sounds.playDelete();
    setItems((prev) => prev.filter((i) => !deleteIdSet.has(i.id)));

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
        const listItemsMap = new Map<string, ListItem[]>();
        completedList.forEach((item) => {
          const parentGroup = groups.find((g) => g.id === item.groupId);
          const itemExplicitListId = (item as unknown as { listId?: string }).listId;
          const listId = itemExplicitListId || parentGroup?.listId || activeListId || 'list-groceries';
          const arr = listItemsMap.get(listId) || [];
          arr.push(item);
          listItemsMap.set(listId, arr);
        });
        for (const [listId, listItems] of listItemsMap.entries()) {
          saveItemsBatchToFirestore(listId, listItems);
        }
      }
    });
  };

  const handleUncheckAll = () => {
    const previousItems = [...items];
    const uncheckedList = items.map((i) => {
      if (!activeListGroupIds.has(i.groupId)) return i;
      if (filterState.countHighlightedOnly && !i.isHighlighted) return i;
      return { ...i, completed: false, completedAt: undefined };
    });
    setItems(uncheckedList);
    sounds.playPop();
    if (user) {
      const activeListItemsToSync = uncheckedList.filter((i) => activeListGroupIds.has(i.groupId));
      saveItemsBatchToFirestore(activeListId, activeListItemsToSync);
    }
    showToast(language === 'ar' ? 'تمت إعادة تعيين جميع الأصناف إلى السلة' : 'All items unchecked', () => {
      setItems(previousItems);
      if (user) {
        const prevListItemsToSync = previousItems.filter((i) => activeListGroupIds.has(i.groupId));
        saveItemsBatchToFirestore(activeListId, prevListItemsToSync);
      }
    });
  };

  const handleUnhighlightAll = () => {
    if (isReadOnly) return;
    const highlightedCount = activeListItems.filter((i) => i.isHighlighted).length;
    if (highlightedCount === 0) return;

    const previousItems = [...items];
    const unhighlightedList = items.map((i) =>
      activeListGroupIds.has(i.groupId) ? { ...i, isHighlighted: false } : i
    );
    setItems(unhighlightedList);
    sounds.playPop();
    if (user) {
      const activeListItemsToSync = unhighlightedList.filter((i) => activeListGroupIds.has(i.groupId));
      saveItemsBatchToFirestore(activeListId, activeListItemsToSync);
    }
    showToast(t.unhighlightAllSuccess || (language === 'ar' ? 'تمت إزالة تمييز جميع العناصر' : 'All highlights removed'), () => {
      setItems(previousItems);
      if (user) {
        const prevListItemsToSync = previousItems.filter((i) => activeListGroupIds.has(i.groupId));
        saveItemsBatchToFirestore(activeListId, prevListItemsToSync);
      }
    });
  };

  const handleSortGroupItems = (groupId: string, option: SortOption) => {
    handleFilterChange({ sortBy: option });
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
    const groupExistingItems = items.filter((i) => i.groupId === groupId);
    const maxOrder = groupExistingItems.reduce((max, i) => Math.max(max, typeof i.order === 'number' ? i.order : 0), 0);

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
      order: maxOrder + 1000,
    };
    setItems((prev) => [newItem, ...prev]);

    // Also ensure target group is uncollapsed locally so the user sees the new item
    setGroups((prev) => {
      const updated = prev.map((g) => {
        if (g.id === groupId && g.isCollapsed) {
          return { ...g, isCollapsed: false };
        }
        return g;
      });
      const collapsedIds = updated.filter((g) => g.isCollapsed).map((g) => g.id);
      saveStoredCollapsedGroups(collapsedIds, user?.uid);
      return updated;
    });

    const parentGroup = groups.find((g) => g.id === groupId);
    const targetListId = parentGroup?.listId || activeListId || 'list-groceries';
    if (canSyncTargetList(targetListId)) {
      saveItemToFirestore(targetListId, newItem);
    }
  };

  const handleSaveItemModal = (itemData: Partial<ListItem> & { id?: string }) => {
    sounds.playPop();
    if (itemData.id) {
      // Edit existing
      const existing = items.find((i) => i.id === itemData.id);
      const updatedItem: ListItem = { ...(existing || { id: itemData.id, groupId: groups[0]?.id || 'default', createdAt: new Date().toISOString() }), ...itemData } as ListItem;
      setItems((prev) =>
        prev.map((item) => (item.id === itemData.id ? updatedItem : item))
      );
      const parentGroup = groups.find((g) => g.id === updatedItem.groupId);
      const targetListId = (updatedItem as unknown as { listId?: string }).listId || parentGroup?.listId || activeListId || 'list-groceries';
      if (canSyncTargetList(targetListId)) {
        saveItemToFirestore(targetListId, updatedItem);
      }
    } else {
      // Add new
      const newItemId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const targetGroupId = itemData.groupId || groups[0]?.id || 'default';
      const groupExistingItems = items.filter((i) => i.groupId === targetGroupId);
      const maxOrder = groupExistingItems.reduce((max, i) => Math.max(max, typeof i.order === 'number' ? i.order : 0), 0);

      const newItem: ListItem = {
        id: newItemId,
        groupId: targetGroupId,
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
        isHighlighted: Boolean(itemData.isHighlighted),
        order: maxOrder + 1000,
      };
      setItems((prev) => [newItem, ...prev]);

      // Also ensure target group is uncollapsed locally so the new item is visible
      setGroups((prev) => {
        const updated = prev.map((g) => {
          if (g.id === targetGroupId && g.isCollapsed) {
            return { ...g, isCollapsed: false };
          }
          return g;
        });
        const collapsedIds = updated.filter((g) => g.isCollapsed).map((g) => g.id);
        saveStoredCollapsedGroups(collapsedIds, user?.uid);
        return updated;
      });

      const parentGroup = groups.find((g) => g.id === targetGroupId);
      const targetListId = parentGroup?.listId || activeListId || 'list-groceries';
      if (canSyncTargetList(targetListId)) {
        saveItemToFirestore(targetListId, newItem);
      }
    }
  };

  const handleToggleCompleteItem = (itemId: string) => {
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) return;
    const nextCompleted = !targetItem.completed;
    const updated: ListItem = {
      ...targetItem,
      completed: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : undefined,
    };
    setItems((prev) => prev.map((item) => (item.id === itemId ? updated : item)));

    const parentGroup = groups.find((g) => g.id === targetItem.groupId);
    const targetListId = (targetItem as unknown as { listId?: string }).listId || parentGroup?.listId || activeListId || 'list-groceries';
    if (canSyncTargetList(targetListId)) {
      updateItemFieldsInFirestore(targetListId, itemId, {
        completed: nextCompleted,
        completedAt: nextCompleted ? new Date().toISOString() : undefined,
      });
    }

    // Check if all items in the grocery list are completed -> trigger celebratory confetti
    if (!targetItem.completed) {
      const relevantListItems = filterState.countHighlightedOnly
        ? activeListItems.filter((i) => i.isHighlighted)
        : activeListItems;
      const allCompleted =
        relevantListItems.length > 0 &&
        relevantListItems.every((i) => (i.id === itemId ? true : i.completed));
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
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    sounds.playPop();
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) return;
    const current = targetItem.quantity ?? 1;
    const nextQty = Math.max(1, current + delta);
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity: nextQty } : item))
    );
    const parentGroup = groups.find((g) => g.id === targetItem.groupId);
    const targetListId = (targetItem as unknown as { listId?: string }).listId || parentGroup?.listId || activeListId || 'list-groceries';
    if (canSyncTargetList(targetListId)) {
      queueDebouncedItemFieldUpdate(targetListId, itemId, { quantity: nextQty }, 500);
    }
  };

  const handleInlineUpdateTitle = (itemId: string, newTitle: string) => {
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) return;
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, title: newTitle } : i))
    );
    const parentGroup = groups.find((g) => g.id === targetItem.groupId);
    const targetListId = (targetItem as unknown as { listId?: string }).listId || parentGroup?.listId || activeListId || 'list-groceries';
    if (canSyncTargetList(targetListId)) {
      queueDebouncedItemFieldUpdate(targetListId, itemId, { title: newTitle }, 600);
    }
  };

  const handleTogglePinItem = (itemId: string) => {
    sounds.playPop();
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) return;
    const nextPinned = !targetItem.isPinned;
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, isPinned: nextPinned } : i))
    );
    const parentGroup = groups.find((g) => g.id === targetItem.groupId);
    const targetListId = (targetItem as unknown as { listId?: string }).listId || parentGroup?.listId || activeListId || 'list-groceries';
    if (canSyncTargetList(targetListId)) {
      updateItemFieldsInFirestore(targetListId, itemId, { isPinned: nextPinned });
    }
  };

  const handleToggleHighlightItem = (itemId: string) => {
    sounds.playPop();
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) return;
    const nextHighlighted = !targetItem.isHighlighted;
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, isHighlighted: nextHighlighted } : i))
    );
    const parentGroup = groups.find((g) => g.id === targetItem.groupId);
    const targetListId = (targetItem as unknown as { listId?: string }).listId || parentGroup?.listId || activeListId || 'list-groceries';
    if (canSyncTargetList(targetListId)) {
      updateItemFieldsInFirestore(targetListId, itemId, { isHighlighted: nextHighlighted });
    }
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
    const parentGroup = groups.find((g) => g.id === newItem.groupId);
    const targetListId = (newItem as unknown as { listId?: string }).listId || parentGroup?.listId || activeListId || 'list-groceries';
    if (canSyncTargetList(targetListId)) {
      saveItemToFirestore(targetListId, newItem);
    }
    showToast(language === 'ar' ? 'تم نسخ الصنف' : 'Item duplicated');
  };

  const handleMoveToGroup = (itemId: string, targetGroupId: string) => {
    sounds.playDrop();
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, groupId: targetGroupId } : i))
    );
    const parentGroup = groups.find((g) => g.id === targetGroupId);
    const targetListId = parentGroup?.listId || activeListId || 'list-groceries';
    if (canSyncTargetList(targetListId)) {
      updateItemFieldsInFirestore(targetListId, itemId, { groupId: targetGroupId });
    }
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

    if (canSyncTargetList(targetListId)) {
      try {
        await deleteItemFromFirestore(targetListId, itemId);
      } catch (err) {
        console.error('Failed to delete item from Firestore:', err);
      }
    }

    // Instant undo toast
    showToast(t.taskDeleted, () => {
      setItems((prev) => [itemToDelete, ...prev]);
      if (canSyncTargetList(targetListId)) {
        saveItemToFirestore(targetListId, itemToDelete);
      }
    });
  };

  // Move Group Up/Down (Personal order - does NOT sync or overwrite shared members' view)
  const handleMoveGroup = (groupId: string, direction: 'up' | 'down') => {
    const currentActive = [...activeGroups];
    const idx = currentActive.findIndex((g) => g.id === groupId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === currentActive.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const reordered = [...currentActive];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(targetIdx, 0, moved);

    const newGroupOrderIds = reordered.map((g) => g.id);

    setUserGroupOrders((prev) => {
      const updated = {
        ...prev,
        [activeListId]: newGroupOrderIds,
      };
      saveStoredGroupOrders(updated, user?.uid);
      if (user?.uid) {
        syncUserProfile(user.uid, { userGroupOrders: updated });
      }
      return updated;
    });

    sounds.playPop();
  };

  // Drag and Drop Logic: Groups / Aisles (Personal per-user order)
  const handleGroupDragStart = (e: React.DragEvent, groupId: string) => {
    if (isReadOnly) return;
    try {
      e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'GROUP', id: groupId }));
      e.dataTransfer.effectAllowed = 'move';
    } catch {
      // Ignore if dataTransfer is not available
    }
    draggingGroupIdRef.current = groupId;
    setDraggingGroupId(groupId);
  };

  const handleDragEnd = () => {
    draggingGroupIdRef.current = null;
    draggingItemIdRef.current = null;
    groupDropPositionRef.current = null;
    itemDropPositionRef.current = null;
    setDraggingGroupId(null);
    setGroupDropTargetId(null);
    setGroupDropPosition(null);
    setDraggingItemId(null);
    setItemDropTargetId(null);
    setItemDropPosition(null);
  };

  const handleGroupDragOver = (e: React.DragEvent, targetGroupId: string) => {
    const currentDragId = draggingGroupIdRef.current || draggingGroupId;
    if (!currentDragId || currentDragId === targetGroupId) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }

    const targetElem = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = targetElem.top + targetElem.height / 2;
    const position = e.clientY < midY ? 'above' : 'below';

    groupDropPositionRef.current = position;
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
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x > 0 && y > 0 && (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom)) {
      setGroupDropTargetId(null);
      setGroupDropPosition(null);
    }
  };

  const handleGroupDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const currentDraggingId = draggingGroupIdRef.current || draggingGroupId;
    if (!currentDraggingId || currentDraggingId === targetGroupId) {
      handleDragEnd();
      return;
    }

    sounds.playDrop();

    const currentActive = [...activeGroups];
    const sourceIdx = currentActive.findIndex((g) => g.id === currentDraggingId);
    const targetIdx = currentActive.findIndex((g) => g.id === targetGroupId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const reordered = [...currentActive];
      const [removed] = reordered.splice(sourceIdx, 1);
      const pos = groupDropPositionRef.current || groupDropPosition;
      const insertAt = pos === 'below' ? targetIdx + 1 : targetIdx;
      const finalInsert = insertAt > sourceIdx ? insertAt - 1 : insertAt;
      reordered.splice(finalInsert, 0, removed);

      const newGroupOrderIds = reordered.map((g) => g.id);

      setUserGroupOrders((prev) => {
        const updated = {
          ...prev,
          [activeListId]: newGroupOrderIds,
        };
        saveStoredGroupOrders(updated, user?.uid);
        if (user?.uid) {
          syncUserProfile(user.uid, { userGroupOrders: updated });
        }
        return updated;
      });

      const orderMap = new Map(newGroupOrderIds.map((id, idx) => [id, (idx + 1) * 1000]));
      const updatedGroups = groups.map((g) => {
        if (orderMap.has(g.id)) {
          return { ...g, order: orderMap.get(g.id)! };
        }
        return g;
      });

      setGroups(updatedGroups);
      saveStoredGroups(updatedGroups, user?.uid);

      if (user && !isReadOnly) {
        const groupsToBatch = updatedGroups
          .filter((g) => (g.listId || 'list-groceries') === activeListId)
          .filter((g) => {
            const existing = groups.find((prev) => prev.id === g.id);
            return !existing || existing.order !== g.order;
          });
        if (groupsToBatch.length > 0) {
          saveGroupsBatchToFirestore(activeListId, groupsToBatch);
        }
      }
    }

    handleDragEnd();
  };

  // Drag and Drop Logic: Items
  const handleItemDragStart = (e: React.DragEvent, itemId: string, sourceGroupId: string) => {
    if (isReadOnly) return;
    try {
      e.dataTransfer.setData(
        'text/plain',
        JSON.stringify({ type: 'ITEM', id: itemId, sourceGroupId })
      );
      e.dataTransfer.effectAllowed = 'move';
    } catch {
      // Ignore if dataTransfer is not available
    }
    draggingItemIdRef.current = itemId;
    setDraggingItemId(itemId);
  };

  const handleItemDragOver = (e: React.DragEvent, targetItemId: string) => {
    const activeItemId = draggingItemIdRef.current || draggingItemId;
    // Only accept items, never when dragging a group
    if (!activeItemId || draggingGroupIdRef.current || activeItemId === targetItemId) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }

    const targetElem = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = targetElem.top + targetElem.height / 2;
    const position = e.clientY < midY ? 'above' : 'below';

    itemDropPositionRef.current = position;
    setItemDropTargetId((prev) => (prev !== targetItemId ? targetItemId : prev));
    setItemDropPosition((prev) => (prev !== position ? position : prev));
  };

  const handleItemDragLeave = (e: React.DragEvent) => {
    if (
      e.currentTarget &&
      e.relatedTarget &&
      (e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)
    ) {
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x > 0 && y > 0 && (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom)) {
      setItemDropTargetId(null);
      setItemDropPosition(null);
    }
  };

  // Move Item Up/Down within its group
  const handleMoveItem = (itemId: string, direction: 'up' | 'down') => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    if (filterState.sortBy !== 'manual') {
      handleFilterChange({ sortBy: 'manual' });
    }

    // Get current group items in their sorted order
    const groupItems = getSortedGroupItems(items, item.groupId);
    const idx = groupItems.findIndex((i) => i.id === itemId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === groupItems.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const reordered = [...groupItems];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(targetIdx, 0, moved);

    const reorderedWithOrder = reordered.map((it, i) => ({
      ...it,
      order: (i + 1) * 1000,
    }));

    const orderMap = new Map(reorderedWithOrder.map((it) => [it.id, it]));
    setItems((prev) => prev.map((it) => orderMap.get(it.id) || it));

    sounds.playPop();

    if (user) {
      const parentGroup = groups.find((g) => g.id === item.groupId);
      const targetListId = (item as unknown as { listId?: string }).listId || parentGroup?.listId || activeListId || 'list-groceries';
      const changedItems = reorderedWithOrder.filter((it) => {
        const existing = items.find((prev) => prev.id === it.id);
        return !existing || existing.order !== it.order;
      });
      if (changedItems.length > 0) {
        saveItemsBatchToFirestore(targetListId, changedItems);
      }
    }
  };

  const handleItemDrop = (e: React.DragEvent, targetItemId: string, targetGroupId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const activeItemId = draggingItemIdRef.current || draggingItemId;
    if (!activeItemId || draggingGroupIdRef.current || activeItemId === targetItemId) {
      handleDragEnd();
      return;
    }

    sounds.playDrop();
    const sourceItem = items.find((i) => i.id === activeItemId);
    const targetItem = items.find((i) => i.id === targetItemId);
    if (!sourceItem || !targetItem) {
      handleDragEnd();
      return;
    }

    if (filterState.sortBy !== 'manual') {
      handleFilterChange({ sortBy: 'manual' });
    }

    const isSameGroup = sourceItem.groupId === targetGroupId;

    // Get current items in target group (in their sorted order)
    let targetGroupItems = getSortedGroupItems(items, targetGroupId);

    // If source item is already in target group, remove it first
    targetGroupItems = targetGroupItems.filter((i) => i.id !== sourceItem.id);

    // Find position of target item
    const targetIdx = targetGroupItems.findIndex((i) => i.id === targetItemId);
    if (targetIdx === -1) {
      handleDragEnd();
      return;
    }

    const pos = itemDropPositionRef.current || itemDropPosition;
    const insertIdx = pos === 'below' ? targetIdx + 1 : targetIdx;

    const movedSourceItem: ListItem = {
      ...sourceItem,
      groupId: targetGroupId,
      isPinned: targetItem.isPinned,
    };

    targetGroupItems.splice(insertIdx, 0, movedSourceItem);

    // Re-index target group items with clean 1000, 2000, 3000... orders
    const reorderedTargetItems = targetGroupItems.map((item, idx) => ({
      ...item,
      order: (idx + 1) * 1000,
    }));

    // If moved from another group, also re-index the old group
    let reorderedSourceItems: ListItem[] = [];
    if (!isSameGroup) {
      const remainingSourceItems = getSortedGroupItems(
        items.filter((i) => i.id !== sourceItem.id),
        sourceItem.groupId
      );
      reorderedSourceItems = remainingSourceItems.map((item, idx) => ({
        ...item,
        order: (idx + 1) * 1000,
      }));
    }

    const map = new Map<string, ListItem>();
    reorderedTargetItems.forEach((it) => map.set(it.id, it));
    reorderedSourceItems.forEach((it) => map.set(it.id, it));

    setItems((prev) => {
      const updated = prev.map((it) => map.get(it.id) || it);
      if (!updated.some((it) => it.id === movedSourceItem.id)) {
        updated.push(map.get(movedSourceItem.id)!);
      }
      return updated;
    });

    if (user) {
      const targetGroup = groups.find((g) => g.id === targetGroupId);
      const targetListId = targetGroup?.listId || activeListId || 'list-groceries';
      const changedTargetItems = reorderedTargetItems.filter((it) => {
        const existing = items.find((prev) => prev.id === it.id);
        return !existing || existing.order !== it.order || existing.groupId !== it.groupId || existing.isPinned !== it.isPinned;
      });
      if (changedTargetItems.length > 0) {
        saveItemsBatchToFirestore(targetListId, changedTargetItems);
      }

      if (!isSameGroup) {
        const sourceGroup = groups.find((g) => g.id === sourceItem.groupId);
        const sourceListId = sourceGroup?.listId || activeListId || 'list-groceries';
        const changedSourceItems = reorderedSourceItems.filter((it) => {
          const existing = items.find((prev) => prev.id === it.id);
          return !existing || existing.order !== it.order;
        });
        if (changedSourceItems.length > 0) {
          saveItemsBatchToFirestore(sourceListId, changedSourceItems);
        }
      }
    }

    handleDragEnd();
  };

  const handleItemDropInEmptyGroup = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const activeItemId = draggingItemIdRef.current || draggingItemId;
    if (!activeItemId || draggingGroupIdRef.current) {
      handleDragEnd();
      return;
    }

    sounds.playDrop();
    const sourceItem = items.find((i) => i.id === activeItemId);
    if (!sourceItem) {
      handleDragEnd();
      return;
    }

    if (filterState.sortBy !== 'manual') {
      handleFilterChange({ sortBy: 'manual' });
    }

    // Get current items in target group
    const targetGroupItems = getSortedGroupItems(items.filter((i) => i.id !== sourceItem.id), targetGroupId);
    const maxOrder = targetGroupItems.reduce((max, it) => Math.max(max, it.order ?? 0), 0);

    const movedItem: ListItem = {
      ...sourceItem,
      groupId: targetGroupId,
      order: maxOrder + 1000,
    };

    let reorderedSourceItems: ListItem[] = [];
    if (sourceItem.groupId !== targetGroupId) {
      const remaining = getSortedGroupItems(
        items.filter((i) => i.id !== sourceItem.id),
        sourceItem.groupId
      );
      reorderedSourceItems = remaining.map((item, idx) => ({
        ...item,
        order: (idx + 1) * 1000,
      }));
    }

    const map = new Map<string, ListItem>();
    map.set(movedItem.id, movedItem);
    reorderedSourceItems.forEach((it) => map.set(it.id, it));

    setItems((prev) => {
      const updated = prev.map((it) => map.get(it.id) || it);
      if (!updated.some((it) => it.id === movedItem.id)) {
        updated.push(movedItem);
      }
      return updated;
    });

    if (user) {
      const targetGroup = groups.find((g) => g.id === targetGroupId);
      const targetListId = targetGroup?.listId || activeListId || 'list-groceries';
      saveItemsBatchToFirestore(targetListId, [movedItem]);

      if (sourceItem.groupId !== targetGroupId) {
        const sourceGroup = groups.find((g) => g.id === sourceItem.groupId);
        const sourceListId = sourceGroup?.listId || activeListId || 'list-groceries';
        const changedSourceItems = reorderedSourceItems.filter((it) => {
          const existing = items.find((prev) => prev.id === it.id);
          return !existing || existing.order !== it.order;
        });
        if (changedSourceItems.length > 0) {
          saveItemsBatchToFirestore(sourceListId, changedSourceItems);
        }
      }
    }

    handleDragEnd();
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
      let updatedTargetList: AppList | undefined;
      setLists((prevLists) =>
        prevLists.map((l) => {
          if (l.id === targetListId) {
            updatedTargetList = {
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
            };
            return updatedTargetList;
          }
          return l;
        })
      );

      setGroups((prev) => [
        ...prev.filter((g) => (g.listId || 'list-groceries') !== targetListId),
        ...newGroups,
      ]);
      setItems((prev) => [
        ...prev.filter((i) => !activeListGroupIds.has(i.groupId)),
        ...newItems,
      ]);

      if (canSyncTargetList(targetListId)) {
        if (updatedTargetList) {
          saveListToFirestore(updatedTargetList, user.uid);
        }
        saveGroupsBatchToFirestore(targetListId, newGroups);
        saveItemsBatchToFirestore(targetListId, newItems);
      }

      showToast(language === 'ar' ? `تم تحميل "${tpl.name}" وتحديث عنوان القائمة` : `Loaded "${tpl.name}" and updated list title`);
    } else {
      // If appending to an empty list, update the title to the template's localized name as well
      let updatedTargetList: AppList | undefined;
      if (activeListItems.length === 0) {
        setLists((prevLists) =>
          prevLists.map((l) => {
            if (l.id === targetListId) {
              updatedTargetList = {
                ...l,
                title: tpl.name,
                description: tpl.desc,
                icon: tpl.icon || l.icon,
              };
              return updatedTargetList;
            }
            return l;
          })
        );
      }

      setGroups((prev) => [...prev, ...newGroups]);
      setItems((prev) => [...prev, ...newItems]);

      if (canSyncTargetList(targetListId)) {
        if (updatedTargetList) {
          saveListToFirestore(updatedTargetList, user.uid);
        }
        saveGroupsBatchToFirestore(targetListId, newGroups);
        saveItemsBatchToFirestore(targetListId, newItems);
      }

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

  const handleRestoreFromGoogleDrive = (backup: WorkspaceBackupData, mode: 'replace' | 'merge') => {
    sounds.playComplete();
    if (mode === 'replace') {
      if (Array.isArray(backup.lists) && backup.lists.length > 0) {
        setLists(backup.lists);
        setActiveListId(backup.lists[0].id);
      }
      setGroups(backup.groups || []);
      setItems(backup.items || []);
      if (backup.language === 'en' || backup.language === 'ar') {
        setLanguage(backup.language);
      }

      backup.lists?.forEach((l) => {
        if (canSyncTargetList(l.id)) {
          saveListToFirestore(l, user.uid);
          const listGroups = (backup.groups || []).filter((g) => g.listId === l.id);
          const listGroupIds = new Set(listGroups.map((g) => g.id));
          const listItems = (backup.items || []).filter((i) => listGroupIds.has(i.groupId));
          if (listGroups.length > 0) saveGroupsBatchToFirestore(l.id, listGroups);
          if (listItems.length > 0) saveItemsBatchToFirestore(l.id, listItems);
        }
      });
    } else {
      // Merge mode: Add any non-duplicate items
      const existingListIds = new Set(lists.map((l) => l.id));
      const incomingLists = (backup.lists || []).filter((l) => !existingListIds.has(l.id));

      const existingGroupIds = new Set(groups.map((g) => g.id));
      const incomingGroups = (backup.groups || []).filter((g) => !existingGroupIds.has(g.id));

      const existingItemIds = new Set(items.map((i) => i.id));
      const incomingItems = (backup.items || []).filter((i) => !existingItemIds.has(i.id));

      if (incomingLists.length > 0) {
        setLists((prev) => [...prev, ...incomingLists]);
      }
      if (incomingGroups.length > 0) {
        setGroups((prev) => [...prev, ...incomingGroups]);
      }
      if (incomingItems.length > 0) {
        setItems((prev) => [...prev, ...incomingItems]);
      }

      incomingLists.forEach((l) => {
        if (canSyncTargetList(l.id)) {
          saveListToFirestore(l, user.uid);
          const listGroups = incomingGroups.filter((g) => g.listId === l.id);
          const listGroupIds = new Set(listGroups.map((g) => g.id));
          const listItems = incomingItems.filter((i) => listGroupIds.has(i.groupId));
          if (listGroups.length > 0) saveGroupsBatchToFirestore(l.id, listGroups);
          if (listItems.length > 0) saveItemsBatchToFirestore(l.id, listItems);
        }
      });
    }
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
        subscription={subscription}
        onOpenUpgradeModal={() => setIsSubscriptionModalOpen(true)}
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
        subscription={subscription}
        onOpenUpgradeModal={() => setIsSubscriptionModalOpen(true)}
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
              fontFamily={fontFamily}
              onFontFamilyChange={handleFontFamilyChange}
              fontSize={fontSize}
              onFontSizeChange={handleFontSizeChange}
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
              lists={lists}
              groups={groups}
              items={items}
              onRestoreData={handleRestoreFromGoogleDrive}
              showToast={showToast}
              subscription={subscription}
              onOpenUpgradeModal={() => setIsSubscriptionModalOpen(true)}
              onUpdateSubscription={handleUpdateSubscription}
            />
          ) : (
            <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto space-y-6">
              {/* Active List Title & Info Header */}
              {activeList && (
                <div
                  id="main-list-header"
                  className="flex items-center justify-between gap-3 pt-1 pb-0.5"
                >
                  <div className="min-w-0">
                    <h1
                      id="main-list-title"
                      className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 truncate"
                    >
                      {activeList.title}
                    </h1>
                    {activeList.description && (
                      <p
                        id="main-list-description"
                        className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 truncate mt-0.5"
                      >
                        {activeList.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

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

              {/* Daily Quota Notice Banner (when Firestore free tier limit is reached) */}
              {syncStatus === 'quota-exceeded' && (
                <div
                  id="quota-exceeded-banner"
                  className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-neutral-800 dark:text-neutral-200 animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                      <Layers className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {language === 'ar'
                          ? 'تم بلوغ الحد اليومي للمزامنة السحابية المجانية (Spark Quota)'
                          : 'Firestore daily free tier quota reached'}
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                        {language === 'ar'
                          ? 'التطبيق يعمل بكامل ميزاته محلياً على هذا الجهاز بدون انقطاع. ستتم إعادة ضبط الحد المجاني غداً.'
                          : 'The app continues operating seamlessly offline in local storage. The free quota will reset tomorrow.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <a
                      href="https://console.firebase.google.com/project/gen-lang-client-0284690034/firestore/databases/ai-studio-listflow-e569587e-1a30-48a3-a524-76f9129b74cc/data?openUpgradeDialog=true"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl text-amber-900 dark:text-amber-200 bg-amber-200/80 dark:bg-amber-900/70 hover:bg-amber-300 dark:hover:bg-amber-800 transition-colors"
                    >
                      {language === 'ar' ? 'ترقية في Firebase' : 'Upgrade Quota'}
                    </a>
                    <button
                      type="button"
                      onClick={() => setSyncStatus('offline')}
                      className="px-2.5 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 cursor-pointer"
                    >
                      {language === 'ar' ? 'إغلاق' : 'Dismiss'}
                    </button>
                  </div>
                </div>
              )}

              {/* Filter and Group Action Toolbar with Search, Add Item & Add Group */}
              <StatsBanner
                language={language}
                fontSize={fontSize}
                searchQuery={searchQuery}
                onSearchChange={(q) => {
                  handleSearchChange(q);
                  if (q.trim() && currentView === 'settings') {
                    setCurrentView('workspace');
                  }
                }}
                totalTasks={totalItems}
                activeTasks={remainingItems}
                completedTasks={collectedItems}
                highlightedTasks={highlightedItemsCount}
                groups={activeGroups}
                filterState={filterState}
                onFilterChange={handleFilterChange}
                allCollapsed={allCollapsed}
                onToggleCollapseAll={handleToggleCollapseAll}
                onUncheckAll={handleUncheckAll}
                onUnhighlightAll={handleUnhighlightAll}
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
                  {activeGroups.map((group, groupIndex) => {
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
                        countHighlightedOnly={filterState.countHighlightedOnly}
                        onToggleCollapse={handleToggleCollapseGroup}
                        onEditGroup={(g) => {
                          setSelectedGroupForEdit(g);
                          setIsGroupModalOpen(true);
                        }}
                        onDeleteGroup={handleDeleteGroup}
                        onDuplicateGroup={handleDuplicateGroup}
                        onClearCompletedInGroup={handleClearCompletedInGroup}
                        onSortGroupItems={handleSortGroupItems}
                        onMoveGroupUp={() => handleMoveGroup(group.id, 'up')}
                        onMoveGroupDown={() => handleMoveGroup(group.id, 'down')}
                        canMoveUp={groupIndex > 0}
                        canMoveDown={groupIndex < activeGroups.length - 1}
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
                        onToggleHighlight={handleToggleHighlightItem}
                        onMoveToGroup={handleMoveToGroup}
                        onInlineUpdateTitle={handleInlineUpdateTitle}
                        onUpdateQuantity={handleUpdateQuantity}
                        onMoveItemUp={(itemId) => handleMoveItem(itemId, 'up')}
                        onMoveItemDown={(itemId) => handleMoveItem(itemId, 'down')}
                        // Group DnD
                        isDraggingGroup={draggingGroupId === group.id}
                        draggingGroupId={draggingGroupId}
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

      {/* Subscription Plans & Upgrade Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        language={language}
        subscription={subscription}
        currentSubscription={subscription}
        onUpdateSubscription={handleUpdateSubscription}
        onSelectPlan={handleUpdateSubscription}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        showToast={showToast}
        user={user}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} language={language} />
    </div>
  );
}
