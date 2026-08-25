import React, { useRef, useEffect } from 'react';
import {
  Plus,
  PlusCircle,
  RotateCcw,
  Trash2,
  ChevronsDownUp,
  ChevronsUpDown,
  ArrowUpDown,
  Search,
  X,
  Columns2,
  Square,
} from 'lucide-react';
import { FilterState, Language, ListGroup, SortOption } from '../types';
import { getTranslation } from '../locales/translations';

interface StatsBannerProps {
  language: Language;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  groups: ListGroup[];
  filterState: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  allCollapsed: boolean;
  onToggleCollapseAll: () => void;
  onUncheckAll: () => void;
  onClearCart: () => void;
  onOpenNewGroupModal: () => void;
  onOpenNewItemModal?: () => void;
  gridColumns?: 1 | 2;
  onGridColumnsChange?: (cols: 1 | 2) => void;
  isReadOnly?: boolean;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  language,
  searchQuery,
  onSearchChange,
  totalTasks,
  completedTasks,
  filterState,
  onFilterChange,
  allCollapsed,
  onToggleCollapseAll,
  onUncheckAll,
  onClearCart,
  onOpenNewGroupModal,
  onOpenNewItemModal,
  gridColumns = 2,
  onGridColumnsChange,
  isReadOnly = false,
}) => {
  const t = getTranslation(language);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'manual', label: t.sortManual },
    { value: 'alphabetical', label: t.sortAlpha },
    { value: 'createdAt', label: t.sortCreated },
    { value: 'quantity', label: t.sortQuantity },
  ];

  // Quick keyboard shortcut "/" to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full max-w-full space-y-3">
      <div className="flex flex-col gap-3">
        {/* Read-Only Notice Banner */}
        {isReadOnly && (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2 shadow-2xs">
            <span className="font-medium">
              {t.viewOnlyBanner}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-bold text-[10px] shrink-0 uppercase tracking-wider">
              {t.viewOnlyBadge}
            </span>
          </div>
        )}

        {/* Card 1: Creation Actions, Search Bar & Task Count */}
        <div
          id="toolbar-creation-card"
          className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800/90 rounded-2xl p-2.5 sm:p-3 shadow-xs transition-colors flex flex-col gap-2.5"
        >
          {/* Row 1: Action Buttons & Filter Counter Pill */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              {!isReadOnly && (
                <button
                  type="button"
                  id="main-add-group-btn"
                  onClick={onOpenNewGroupModal}
                  className="flex items-center justify-center gap-1.5 h-9 sm:h-9.5 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/90 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 active:scale-[0.98] transition-all cursor-pointer shadow-2xs min-w-0"
                >
                  <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
                  <span className="truncate">{t.addGroup}</span>
                </button>
              )}

              {onOpenNewItemModal && !isReadOnly && (
                <button
                  type="button"
                  id="main-add-item-btn"
                  onClick={onOpenNewItemModal}
                  className="flex items-center justify-center gap-1.5 h-9 sm:h-9.5 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-xs cursor-pointer min-w-0"
                >
                  <PlusCircle className="w-4 h-4 stroke-[2.3] shrink-0" />
                  <span className="truncate">{t.addItem}</span>
                </button>
              )}
            </div>

            {/* Task Status Filter / Counter Pill */}
            <button
              type="button"
              id="filter-all-tasks-btn"
              onClick={() => onFilterChange({ status: 'all', groupId: 'all' })}
              className={`h-9 px-3 rounded-xl text-xs transition-all cursor-pointer shadow-2xs border shrink-0 ${
                filterState.status === 'all' && (!filterState.groupId || filterState.groupId === 'all')
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300/90 dark:border-emerald-800/70 font-semibold ring-1 ring-emerald-500/20'
                  : 'bg-neutral-50 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-neutral-200/70 dark:border-neutral-700/60 font-medium'
              }`}
            >
              <span>{t.allTasks}</span>
              <span className="ms-1.5 opacity-85 font-semibold font-mono">({totalTasks})</span>
            </button>
          </div>

          {/* Row 2: Search Input inside Main Content */}
          <div className="relative w-full">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-neutral-400 dark:text-neutral-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="main-search-input"
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full h-9 ps-9 pe-9 text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200/90 dark:border-neutral-700/80 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
            />
            {searchQuery ? (
              <button
                id="clear-search-btn"
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <div className="hidden sm:flex absolute inset-y-0 end-0 items-center pe-2.5 pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 dark:text-neutral-500 bg-neutral-200/60 dark:bg-neutral-700/60 rounded border border-neutral-300 dark:border-neutral-600">
                  /
                </kbd>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: View Utilities, Bulk Operations & Sort Filter */}
        <div
          id="toolbar-utilities-card"
          className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800/90 rounded-2xl p-2.5 sm:p-3 shadow-xs transition-colors flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5"
        >
          {/* Quick Bulk Utilities */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Expand / Collapse All */}
            <button
              type="button"
              id="collapse-all-btn"
              onClick={onToggleCollapseAll}
              className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 border border-neutral-200/70 dark:border-neutral-700/60 transition-colors active:scale-95 cursor-pointer shadow-2xs"
              title={allCollapsed ? t.expand : t.collapse}
            >
              {allCollapsed ? (
                <>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span className="text-[11px] sm:text-xs">{t.expand}</span>
                </>
              ) : (
                <>
                  <ChevronsDownUp className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span className="text-[11px] sm:text-xs">{t.collapse}</span>
                </>
              )}
            </button>

            {/* Uncheck All */}
            <button
              type="button"
              id="uncheck-all-btn"
              onClick={onUncheckAll}
              disabled={completedTasks === 0}
              className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 border border-neutral-200/70 dark:border-neutral-700/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-95 cursor-pointer shadow-2xs"
              title={t.uncheckAllConfirmDesc}
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <span className="text-[11px] sm:text-xs">{t.uncheckAll}</span>
            </button>

            {/* Clear Completed Cart */}
            {completedTasks > 0 && (
              <button
                type="button"
                id="clear-completed-btn"
                onClick={onClearCart}
                className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-800/70 transition-colors active:scale-95 cursor-pointer shadow-2xs"
                title={t.clearCart}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="text-[11px] sm:text-xs">{t.clearCart}</span>
              </button>
            )}
          </div>

          {/* Controls on the end of row: Sort Dropdown & Column View Toggle */}
          <div className="flex items-center justify-between sm:justify-start lg:justify-end gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {/* Sort Dropdown Selector */}
            <div className="flex-initial flex items-center justify-between sm:justify-start gap-2 h-9 px-3 sm:px-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/70 shadow-2xs">
              <div className="flex items-center gap-1.5 min-w-0 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                  {language === 'ar' ? 'الترتيب:' : 'Sort:'}
                </span>
              </div>
              <select
                id="sort-select-filter"
                value={filterState.sortBy}
                onChange={(e) => onFilterChange({ sortBy: e.target.value as SortOption })}
                className="bg-transparent text-neutral-800 dark:text-neutral-200 font-semibold text-xs focus:outline-none cursor-pointer pe-1 text-end sm:text-start"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Grid Column View Toggle (2 columns default or 1 column on large screens) */}
            {onGridColumnsChange && (
              <div
                id="grid-column-toggle-group"
                className="hidden lg:flex items-center p-0.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/70 shadow-2xs shrink-0"
                title={t.viewColumns}
              >
                {/* 2 Columns Button (Default) */}
                <button
                  type="button"
                  id="grid-cols-2-btn"
                  onClick={() => onGridColumnsChange(2)}
                  className={`h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    gridColumns === 2
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                  }`}
                  title={t.twoColumns}
                >
                  <Columns2 className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium">{t.twoColumns}</span>
                </button>

                {/* 1 Column Button */}
                <button
                  type="button"
                  id="grid-cols-1-btn"
                  onClick={() => onGridColumnsChange(1)}
                  className={`h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    gridColumns === 1
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                  }`}
                  title={t.oneColumn}
                >
                  <Square className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium">{t.oneColumn}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
