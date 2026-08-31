import React, { useState, useRef, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  MoreVertical,
  Edit2,
  Copy,
  Trash2,
  CheckSquare,
  Briefcase,
  Sparkles,
  ShoppingCart,
  Layers,
  Target,
  Calendar,
  Home,
  Plane,
  BookOpen,
  Code,
  Dumbbell,
  Heart,
  Star,
  Coffee,
  Palette,
  Flag,
  Zap,
  Bookmark,
  PanelLeftClose,
  Search,
  CheckCircle2,
  ListTodo,
  Settings,
  LogIn,
  LogOut,
  Users,
  UserPlus,
  Eye,
  Crown,
  Languages,
} from 'lucide-react';
import { AppList, AppView, Language, ListGroup, ListItem, SyncStatus, PendingInvitation } from '../types';
import { getTranslation } from '../locales/translations';
import { User } from 'firebase/auth';
import { RefreshCw, CloudCheck, CloudOff, AlertCircle } from 'lucide-react';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  lists: AppList[];
  activeListId: string;
  onSelectList: (id: string) => void;
  onOpenNewListModal: () => void;
  onEditList: (list: AppList) => void;
  onDeleteList: (list: AppList) => void;
  onDuplicateList: (list: AppList) => void;
  onShareList?: (list: AppList) => void;
  pendingInvitations?: PendingInvitation[];
  onOpenPendingInvite?: (invite: PendingInvitation) => void;
  groups: ListGroup[];
  items: ListItem[];
  language: Language;
  onToggleLanguage?: () => void;
  totalTasks: number;
  completedTasks: number;
  currentView?: AppView;
  onOpenSettings: () => void;
  onOpenOnboarding?: () => void;
  user?: User | null;
  syncStatus?: SyncStatus;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
}

const getListIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'check-square':
      return CheckSquare;
    case 'briefcase':
      return Briefcase;
    case 'sparkles':
      return Sparkles;
    case 'shopping-cart':
      return ShoppingCart;
    case 'layers':
      return Layers;
    case 'target':
      return Target;
    case 'calendar':
      return Calendar;
    case 'home':
      return Home;
    case 'plane':
      return Plane;
    case 'book':
      return BookOpen;
    case 'code':
      return Code;
    case 'dumbbell':
      return Dumbbell;
    case 'heart':
      return Heart;
    case 'star':
      return Star;
    case 'coffee':
      return Coffee;
    case 'palette':
      return Palette;
    case 'flag':
      return Flag;
    case 'zap':
      return Zap;
    case 'bookmark':
      return Bookmark;
    default:
      return FolderKanban;
  }
};

export const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  lists,
  activeListId,
  onSelectList,
  onOpenNewListModal,
  onEditList,
  onDeleteList,
  onDuplicateList,
  onShareList,
  pendingInvitations = [],
  onOpenPendingInvite,
  groups,
  items,
  language,
  onToggleLanguage,
  totalTasks,
  completedTasks,
  currentView = 'workspace',
  onOpenSettings,
  onOpenOnboarding,
  user,
  syncStatus = 'idle',
  onOpenAuthModal,
  onSignOut,
}) => {
  const t = getTranslation(language);
  const [listSearch, setListSearch] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<{ list: AppList; rect: DOMRect } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close floating dropdown on outside click or scroll
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAnchor(null);
      }
    };
    const handleScrollOrResize = () => {
      setMenuAnchor(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, []);

  // Handle ESC key to dismiss drawer or dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (menuAnchor) {
          setMenuAnchor(null);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, menuAnchor, onClose]);

  // Lock body scroll on small screens when drawer is open
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Compute stats per list
  const getListStats = (listId: string) => {
    const listGroupIds = new Set(
      groups.filter((g) => g.listId === listId || (!g.listId && listId === 'default-list')).map((g) => g.id)
    );
    const listItems = items.filter((i) => listGroupIds.has(i.groupId));
    const total = listItems.length;
    const completed = listItems.filter((i) => i.completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, progress };
  };

  const filteredLists = lists.filter((l) =>
    l.title.toLowerCase().includes(listSearch.trim().toLowerCase())
  );

  // Safe floating menu position calculations
  const getFloatingMenuStyle = () => {
    if (!menuAnchor) return {};
    const menuWidth = 190;
    const menuHeight = 150;
    let top = menuAnchor.rect.bottom + 4;
    if (top + menuHeight > window.innerHeight) {
      top = Math.max(10, menuAnchor.rect.top - menuHeight - 4);
    }

    let left = menuAnchor.rect.left;
    if (language === 'ar') {
      left = Math.max(12, menuAnchor.rect.right - menuWidth);
    } else {
      left = Math.min(window.innerWidth - menuWidth - 12, Math.max(12, menuAnchor.rect.left));
    }

    return {
      position: 'fixed' as const,
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 9999,
    };
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/60 backdrop-blur-xs transition-opacity lg:hidden animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Fixed Full-Height Side Menu from Top (0) to Bottom (0) */}
      <aside
        id="app-side-menu"
        className={`fixed top-0 bottom-0 start-0 z-50 h-screen w-72 sm:w-80 bg-white dark:bg-neutral-900 border-e border-neutral-200/90 dark:border-neutral-800/90 shadow-2xl flex flex-col select-none transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
        }`}
      >
        {/* Top Header of Sidebar */}
        <div className="h-16 px-4 border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between gap-2 shrink-0 bg-white/95 dark:bg-neutral-900/95">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                  {t.myLists}
                </h2>
                {/* {<span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  {lists.length}
                </span>} */}
              </div>
              {/* {<p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                {language === 'ar' ? 'تصفح وإدارة مساحات العمل' : 'Workspaces & categories'}
              </p>} */}
            </div>
          </div>

          {/* Single Hide Button */}
          <button
            type="button"
            id="side-menu-hide-btn"
            onClick={onClose}
            title={language === 'ar' ? 'إخفاء القائمة الجانبية' : 'Hide side menu'}
            className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <PanelLeftClose className="w-5 h-5 rtl:rotate-180" />
          </button>
        </div>

        {/* Quick Search & New List Button */}
        <div className="p-3 border-b border-neutral-100 dark:border-neutral-800/60 space-y-2 shrink-0">
          {lists.length > 4 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute inset-y-0 start-2.5 my-auto text-neutral-400" />
              <input
                type="text"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder={language === 'ar' ? 'بحث في القوائم...' : 'Filter lists...'}
                className="w-full h-8 ps-8 pe-2 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 rounded-lg text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          )}

          <button
            type="button"
            id="side-menu-new-list-btn"
            onClick={() => {
              onOpenNewListModal();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 active:scale-[0.98] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t.newList}</span>
          </button>
        </div>

        {/* Scrollable Lists Area */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
          {/* Pending Invitations Banner in Sidenav */}
          {pendingInvitations && pendingInvitations.length > 0 && (
            <div className="mb-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 dark:text-amber-200">
                <span className="flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{t.pendingInvites} ({pendingInvitations.length})</span>
                </span>
              </div>
              <div className="space-y-1">
                {pendingInvitations.map((inv) => (
                  <button
                    key={inv.listId}
                    type="button"
                    onClick={() => onOpenPendingInvite && onOpenPendingInvite(inv)}
                    className="w-full text-start p-1.5 rounded-lg bg-white/80 dark:bg-neutral-850/80 border border-amber-200/50 dark:border-amber-800/40 hover:bg-white dark:hover:bg-neutral-800 text-xs flex items-center justify-between gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                      {inv.listTitle}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 shrink-0">
                      {t.acceptInvite}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredLists.length === 0 ? (
            <div className="text-center py-8 px-2 text-neutral-400 dark:text-neutral-500 text-xs">
              <p>{t.noListsFound}</p>
            </div>
          ) : (
            filteredLists.map((list) => {
              const isActive = currentView === 'workspace' && list.id === activeListId;
              const stats = getListStats(list.id);
              const IconComp = getListIconComponent(list.icon);
              const accentColor = list.color || '#10b981';
              const isShared = list.isShared || (list.collaboratorUids && list.collaboratorUids.length > 1) || (list.invitedEmails && list.invitedEmails.length > 0);
              const isReadOnly = list.myRole === 'read';

              return (
                <div
                  key={list.id}
                  onClick={() => {
                    onSelectList(list.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`group/item relative flex flex-col p-2.5 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-neutral-100/90 dark:bg-neutral-800/90'
                      : 'hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover/item:scale-105 shadow-2xs relative"
                        style={{
                          backgroundColor: `${accentColor}18`,
                          color: accentColor,
                        }}
                      >
                        <IconComp className="w-4 h-4" />
                        {isShared && (
                          <div
                            className="absolute -bottom-1 -end-1 w-3.5 h-3.5 rounded-full bg-white dark:bg-neutral-800 shadow-2xs flex items-center justify-center text-neutral-600 dark:text-neutral-300 ring-1 ring-neutral-200 dark:ring-neutral-700"
                            title={t.sharedList}
                          >
                            <Users className="w-2.2 h-2.2" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex items-center gap-1.5">
                        <span
                          className={`text-xs font-semibold block truncate ${
                            isActive
                              ? 'text-neutral-900 dark:text-neutral-50 font-bold'
                              : 'text-neutral-700 dark:text-neutral-300 group-hover/item:text-neutral-900 dark:group-hover/item:text-neutral-100'
                          }`}
                        >
                          {list.title}
                        </span>

                        {isReadOnly && (
                          <span
                            className="px-1 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-[9px] font-bold text-neutral-500 dark:text-neutral-400 shrink-0 flex items-center gap-0.5"
                            title={t.viewOnlyBanner}
                          >
                            <Eye className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* 3-dots action menu */}
                      <button
                        type="button"
                        id={`sidebar-list-menu-${list.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          if (menuAnchor?.list.id === list.id) {
                            setMenuAnchor(null);
                          } else {
                            setMenuAnchor({ list, rect });
                          }
                        }}
                        className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 opacity-100 sm:opacity-0 group-hover/item:opacity-100 transition-opacity cursor-pointer"
                        title="List Options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Section of Sidenav: User profile & Settings */}
        <div className="p-3 bg-neutral-50/70 dark:bg-neutral-900/70 shrink-0 space-y-2.5">
          {/* User Account / Sign In card in Sidenav */}
          {user ? (
            <div
              id="sidenav-user-profile-card"
              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-neutral-800/90 shadow-2xs"
            >
              <button
                type="button"
                id="sidenav-user-profile-btn"
                onClick={() => {
                  onOpenSettings();
                  if (window.innerWidth < 1024) onClose();
                }}
                title={`${t.signedInAs}: ${user.displayName || user.email}`}
                className="flex items-center gap-2.5 min-w-0 text-start flex-1 cursor-pointer group"
              >
                <div className="relative shrink-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-lg object-cover ring-1 ring-emerald-500/30"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div
                    className={`absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-neutral-800 ${
                      syncStatus === 'syncing'
                        ? 'bg-amber-500 animate-pulse'
                        : syncStatus === 'offline'
                        ? 'bg-neutral-400'
                        : syncStatus === 'error'
                        ? 'bg-red-500'
                        : 'bg-emerald-500'
                    }`}
                    title={
                      syncStatus === 'syncing'
                        ? t.syncingToCloud
                        : syncStatus === 'offline'
                        ? t.syncOffline
                        : syncStatus === 'error'
                        ? t.syncError
                        : t.syncedToCloud
                    }
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                    {syncStatus === 'syncing' && (
                      <RefreshCw className="w-2.5 h-2.5 text-amber-500 animate-spin shrink-0" />
                    )}
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate flex items-center gap-1">
                    <span>{syncStatus === 'syncing' ? t.syncingToCloud : syncStatus === 'offline' ? t.syncOffline : t.syncedToCloud}</span>
                  </div>
                </div>
              </button>

              {onSignOut && (
                <button
                  type="button"
                  id="sidenav-signout-btn"
                  onClick={onSignOut}
                  title={t.signOut}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            onOpenAuthModal && (
              <button
                type="button"
                id="sidenav-signin-btn"
                onClick={() => {
                  onOpenAuthModal();
                  if (window.innerWidth < 1024) onClose();
                }}
                title={t.login}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4 shrink-0" />
                <span>{t.login} / {t.signup}</span>
              </button>
            )
          )}

        </div>
      </aside>

      {/* Floating 3-dots Context Menu */}
      {menuAnchor && (
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          style={getFloatingMenuStyle()}
          className="w-48 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl py-1 text-neutral-800 dark:text-neutral-200 text-xs animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-1.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-1.5 truncate">
            <span
              className="w-2 h-2 rounded-full inline-block shrink-0"
              style={{ backgroundColor: menuAnchor.list.color || '#10b981' }}
            />
            <span className="truncate">{menuAnchor.list.title}</span>
          </div>

          <button
            onClick={() => {
              const currentList = menuAnchor.list;
              setMenuAnchor(null);
              if (onShareList) onShareList(currentList);
            }}
            className="w-full px-3 py-2 text-start flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer font-medium"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{t.shareList}</span>
          </button>

          <button
            onClick={() => {
              const currentList = menuAnchor.list;
              setMenuAnchor(null);
              onEditList(currentList);
            }}
            className="w-full px-3 py-2 text-start flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-neutral-500" />
            <span>{t.editList}</span>
          </button>

          <button
            onClick={() => {
              const currentList = menuAnchor.list;
              setMenuAnchor(null);
              onDuplicateList(currentList);
            }}
            className="w-full px-3 py-2 text-start flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-neutral-500" />
            <span>{t.duplicateList}</span>
          </button>

          <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />

          {/* Delete List (Owner only) or Leave List (Collaborators) */}
          {(!menuAnchor.list.ownerId || (user && menuAnchor.list.ownerId === user.uid)) ? (
            <button
              onClick={() => {
                const currentList = menuAnchor.list;
                setMenuAnchor(null);
                onDeleteList(currentList);
              }}
              disabled={lists.length <= 1}
              className="w-full px-3 py-2 text-start flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.deleteList}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                const currentList = menuAnchor.list;
                setMenuAnchor(null);
                if (onShareList) onShareList(currentList);
              }}
              className="w-full px-3 py-2 text-start flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{t.leaveList}</span>
            </button>
          )}
        </div>
      )}
    </>
  );
};
