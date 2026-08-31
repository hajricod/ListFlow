import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  PlusCircle,
  RotateCcw,
  Trash2,
  ChevronsDownUp,
  ChevronsUpDown,
  Search,
  X,
  Columns2,
  Square,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Check,
  Share2,
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
  activeList?: any;
  isOwner?: boolean;
  isShared?: boolean;
  onOpenShareModal?: () => void;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  language,
  searchQuery,
  onSearchChange,
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
  isShared = false,
  onOpenShareModal,
}) => {
  const t = getTranslation(language);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'manual', label: t.sortManual },
    { value: 'alphabetical', label: t.sortAlpha },
    { value: 'createdAt', label: t.sortCreated },
    { value: 'quantity', label: t.sortQuantity },
  ];

  const activeFiltersCount =
    (filterState.hideCompleted ? 1 : 0) + (filterState.sortBy !== 'manual' ? 1 : 0);

  // Quick keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        !isFilterModalOpen
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && isFilterModalOpen) {
        setIsFilterModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFilterModalOpen]);

  const activeSortLabel = sortOptions.find((opt) => opt.value === filterState.sortBy)?.label;

  return (
    <div className="w-full max-w-full space-y-3">
      <div className="flex flex-col gap-3">
        {/* Read-Only Notice Banner */}
        {isReadOnly && (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2 shadow-2xs">
            <span className="font-medium">{t.viewOnlyBanner}</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-bold text-[10px] shrink-0 uppercase tracking-wider">
              {t.viewOnlyBadge}
            </span>
          </div>
        )}

        {/* Card 1: Creation Actions, Filter Button & Search Bar */}
        <div
          id="toolbar-creation-card"
          className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800/90 rounded-2xl p-2.5 sm:p-3 shadow-xs transition-colors flex flex-col gap-2.5"
        >
          {/* Row 1: Action Buttons & Filter Modal Toggle */}
          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
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

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Share Button (Simple, without title) */}
              {onOpenShareModal && (
                <button
                  type="button"
                  id="toolbar-share-list-btn"
                  onClick={onOpenShareModal}
                  className={`inline-flex items-center justify-center h-9 sm:h-9.5 px-3 rounded-xl border transition-all cursor-pointer shadow-2xs active:scale-[0.98] shrink-0 ${
                    isShared
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/80'
                      : 'text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 border-neutral-200/80 dark:border-neutral-700/70'
                  }`}
                  title={t.shareList || 'Share'}
                >
                  <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                </button>
              )}

              {/* Filter Modal Toggle Button */}
              <button
                type="button"
                id="open-filter-modal-btn"
                onClick={() => setIsFilterModalOpen(true)}
                className={`inline-flex items-center justify-center gap-1.5 h-9 sm:h-9.5 px-3 sm:px-3.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer shadow-2xs active:scale-[0.98] shrink-0 ${
                  activeFiltersCount > 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/80 ring-1 ring-emerald-500/20'
                    : 'text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 border-neutral-200/80 dark:border-neutral-700/70'
                }`}
                title={t.filterModalTitle}
              >
                <SlidersHorizontal className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                {/*<span>{t.filterAndTools || t.filters}</span>*/}
                {activeFiltersCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold font-mono">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Row 2: Search Input */}
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

          {/* Active Filter Tags (when filters are active) */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {filterState.hideCompleted && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs shadow-2xs">
                  <EyeOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{t.completedHiddenNotice || t.hideCompleted}</span>
                  {completedTasks > 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-200/80 dark:bg-amber-900/80 text-[10px] font-bold">
                      {completedTasks}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onFilterChange({ hideCompleted: false })}
                    className="ms-1 hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer"
                    title="Remove filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {filterState.sortBy !== 'manual' && activeSortLabel && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs shadow-2xs">
                  <span>
                    {language === 'ar' ? 'الترتيب:' : 'Sort:'} {activeSortLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => onFilterChange({ sortBy: 'manual' })}
                    className="ms-1 hover:text-emerald-950 dark:hover:text-emerald-100 cursor-pointer"
                    title="Reset sort"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => onFilterChange({ hideCompleted: false, sortBy: 'manual' })}
                className="text-[11px] text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 underline underline-offset-2 px-1 cursor-pointer"
              >
                {t.resetFilters || 'Reset all'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter & View Options Modal (replaces inline toolbar-utilities-card) */}
      {isFilterModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsFilterModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="filter-modal-title"
        >
          <div
            id="toolbar-utilities-card"
            className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shrink-0 shadow-2xs">
                  <SlidersHorizontal className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 id="filter-modal-title" className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    {t.filterModalTitle || 'Filters & View Options'}
                  </h3>
                  {/*<p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t.filterModalSubtitle || 'Configure sorting, item visibility, and view layout'}
                  </p>*/}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section 1: Item Visibility & Completed Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {t.visibilitySection || 'Item Visibility'}
              </label>
              <button
                type="button"
                id="filter-toggle-completed-btn"
                onClick={() => {
                  onFilterChange({
                    hideCompleted: !filterState.hideCompleted,
                  });
                }}
                className={`w-full p-3.5 rounded-2xl border transition-all text-start flex items-center justify-between gap-3 cursor-pointer shadow-2xs ${
                  filterState.hideCompleted
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/70 ring-1 ring-amber-500/20'
                    : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200/80 dark:border-neutral-700/60 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      filterState.hideCompleted
                        ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400'
                        : 'bg-neutral-200/60 dark:bg-neutral-700/60 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {filterState.hideCompleted ? (
                      <EyeOff className="w-4.5 h-4.5" />
                    ) : (
                      <Eye className="w-4.5 h-4.5" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        filterState.hideCompleted
                          ? 'text-amber-950 dark:text-amber-200'
                          : 'text-neutral-900 dark:text-neutral-100'
                      }`}
                    >
                      {filterState.hideCompleted ? t.showCompleted : t.hideCompleted}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {filterState.hideCompleted
                        ? `${completedTasks} ${t.collected || 'completed'} ${t.items || 'items'} hidden from view`
                        : 'Display all active and completed items'}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center shrink-0 ${
                    filterState.hideCompleted
                      ? 'bg-amber-500 justify-end'
                      : 'bg-neutral-300 dark:bg-neutral-600 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </div>
              </button>
            </div>

            {/* Section 2: Sorting Order */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {t.sortSection || 'Sort Order'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sortOptions.map((opt) => {
                  const isSelected = filterState.sortBy === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onFilterChange({ sortBy: opt.value })}
                      className={`p-3 rounded-2xl border text-start transition-all flex items-center justify-between gap-2 cursor-pointer shadow-2xs ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700/80 ring-1 ring-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-semibold'
                          : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200/80 dark:border-neutral-700/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium'
                      }`}
                    >
                      <span className="text-xs">{opt.label}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Display Layout (Columns) */}
            {onGridColumnsChange && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  {t.layoutSection || 'Display Layout'}
                </label>
                <div className="grid grid-cols-2 gap-2" id="grid-column-toggle-group">
                  <button
                    type="button"
                    id="grid-cols-2-btn"
                    onClick={() => onGridColumnsChange(2)}
                    className={`p-3 rounded-2xl border text-start transition-all flex items-center gap-3 cursor-pointer shadow-2xs ${
                      gridColumns === 2
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700/80 ring-1 ring-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-semibold'
                        : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200/80 dark:border-neutral-700/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        gridColumns === 2
                          ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400'
                          : 'bg-neutral-200/60 dark:bg-neutral-700 text-neutral-500'
                      }`}
                    >
                      <Columns2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{t.twoColumns}</p>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Grid view</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    id="grid-cols-1-btn"
                    onClick={() => onGridColumnsChange(1)}
                    className={`p-3 rounded-2xl border text-start transition-all flex items-center gap-3 cursor-pointer shadow-2xs ${
                      gridColumns === 1
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700/80 ring-1 ring-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-semibold'
                        : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200/80 dark:border-neutral-700/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        gridColumns === 1
                          ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400'
                          : 'bg-neutral-200/60 dark:bg-neutral-700 text-neutral-500'
                      }`}
                    >
                      <Square className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{t.oneColumn}</p>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Full width</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Section 4: Bulk List Actions */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {t.bulkSection || 'Bulk Actions'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Expand / Collapse */}
                <button
                  type="button"
                  id="collapse-all-btn"
                  onClick={onToggleCollapseAll}
                  className="p-3 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/60 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-2.5 transition-colors cursor-pointer shadow-2xs"
                >
                  {allCollapsed ? (
                    <ChevronsUpDown className="w-4 h-4 text-neutral-500 shrink-0" />
                  ) : (
                    <ChevronsDownUp className="w-4 h-4 text-neutral-500 shrink-0" />
                  )}
                  <span className="text-xs font-semibold">
                    {allCollapsed ? t.expand : t.collapse}
                  </span>
                </button>

                {/* Uncheck All */}
                <button
                  type="button"
                  id="uncheck-all-btn"
                  onClick={onUncheckAll}
                  disabled={completedTasks === 0}
                  className="p-3 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/60 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-4 h-4 text-neutral-500 shrink-0" />
                  <span className="text-xs font-semibold">{t.uncheckAll}</span>
                </button>

                {/* Clear Completed */}
                <button
                  type="button"
                  id="clear-completed-btn"
                  onClick={onClearCart}
                  disabled={completedTasks === 0}
                  className="p-3 rounded-2xl border border-rose-200/80 dark:border-rose-800/60 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 flex items-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                >
                  <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="text-xs font-semibold">{t.clearCart}</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3">
              {activeFiltersCount > 0 ? (
                <button
                  type="button"
                  id="reset-filters-btn"
                  onClick={() => onFilterChange({ hideCompleted: false, sortBy: 'manual' })}
                  className="text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer py-1.5 px-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.resetFilters || 'Reset to Defaults'}</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-2 ms-auto"
              >
                <Check className="w-4 h-4" />
                <span>{t.done || 'Done'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

