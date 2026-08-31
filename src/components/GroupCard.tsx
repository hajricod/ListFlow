import React, { useState, useRef, useEffect } from 'react';
import {
  GripHorizontal,
  ChevronDown,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  Copy,
  CheckCircle2,
  ArrowUpDown,
  ListTodo,
} from 'lucide-react';
import { ListGroup, ListItem, Language, Priority, SortOption } from '../types';
import { getTranslation } from '../locales/translations';
import { IconRenderer } from './IconRenderer';
import { ItemRow } from './ItemRow';
import { sounds } from '../utils/audio';

interface GroupCardProps {
  group: ListGroup;
  items: ListItem[];
  allGroups: ListGroup[];
  language: Language;
  searchQuery?: string;
  isReadOnly?: boolean;
  onToggleCollapse: (groupId: string) => void;
  onEditGroup: (group: ListGroup) => void;
  onDeleteGroup: (groupId: string) => void;
  onDuplicateGroup: (group: ListGroup) => void;
  onClearCompletedInGroup: (groupId: string) => void;
  onSortGroupItems: (groupId: string, option: SortOption) => void;
  // Item operations
  onAddItem: (groupId: string, title: string, priority?: Priority) => void;
  onToggleComplete: (itemId: string) => void;
  onEditItem: (item: ListItem) => void;
  onDeleteItem: (itemId: string) => void;
  onDuplicateItem: (item: ListItem) => void;
  onTogglePin: (itemId: string) => void;
  onToggleHighlight?: (itemId: string) => void;
  onMoveToGroup: (itemId: string, targetGroupId: string) => void;
  onInlineUpdateTitle: (itemId: string, newTitle: string) => void;
  onUpdateQuantity?: (itemId: string, delta: number) => void;
  // Drag & Drop
  isDraggingGroup?: boolean;
  onGroupDragStart: (e: React.DragEvent, groupId: string) => void;
  onGroupDragOver: (e: React.DragEvent, groupId: string) => void;
  onGroupDragLeave: (e: React.DragEvent) => void;
  onGroupDrop: (e: React.DragEvent, targetGroupId: string) => void;
  groupDropPosition?: 'above' | 'below' | null;
  // Item drag & drop within or across groups
  draggingItemId: string | null;
  onItemDragStart: (e: React.DragEvent, itemId: string, sourceGroupId: string) => void;
  onDragEnd?: () => void;
  onItemDragOver: (e: React.DragEvent, targetItemId: string) => void;
  onItemDragLeave: (e: React.DragEvent) => void;
  onItemDrop: (e: React.DragEvent, targetItemId: string, targetGroupId: string) => void;
  itemDropTargetId: string | null;
  itemDropPosition: 'above' | 'below' | null;
  onItemDropInEmptyGroup: (e: React.DragEvent, targetGroupId: string) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  items,
  allGroups,
  language,
  searchQuery,
  isReadOnly = false,
  onToggleCollapse,
  onEditGroup,
  onDeleteGroup,
  onDuplicateGroup,
  onClearCompletedInGroup,
  onSortGroupItems,
  onAddItem,
  onToggleComplete,
  onEditItem,
  onDeleteItem,
  onDuplicateItem,
  onTogglePin,
  onToggleHighlight,
  onMoveToGroup,
  onInlineUpdateTitle,
  onUpdateQuantity,
  isDraggingGroup,
  onGroupDragStart,
  onGroupDragOver,
  onGroupDragLeave,
  onGroupDrop,
  groupDropPosition,
  draggingItemId,
  onItemDragStart,
  onDragEnd,
  onItemDragOver,
  onItemDragLeave,
  onItemDrop,
  itemDropTargetId,
  itemDropPosition,
  onItemDropInEmptyGroup,
}) => {
  const t = getTranslation(language);
  const [quickInput, setQuickInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [isOverEmptyZone, setIsOverEmptyZone] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setSortMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuOpen]);

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    sounds.playPop();
    onAddItem(group.id, quickInput.trim());
    setQuickInput('');
  };

  const handleEmptyZoneDragOver = (e: React.DragEvent) => {
    // Only accept items, never groups
    if (!draggingItemId || isDraggingGroup) return;
    e.preventDefault();
    e.stopPropagation();
    setIsOverEmptyZone(true);
  };

  const handleEmptyZoneDragLeave = () => {
    setIsOverEmptyZone(false);
  };

  const handleEmptyZoneDrop = (e: React.DragEvent) => {
    if (!draggingItemId || isDraggingGroup) return;
    e.preventDefault();
    e.stopPropagation();
    setIsOverEmptyZone(false);
    onItemDropInEmptyGroup(e, group.id);
  };

  return (
    <div
      id={`group-card-${group.id}`}
      onDragOver={(e) => onGroupDragOver(e, group.id)}
      onDragLeave={onGroupDragLeave}
      onDrop={(e) => onGroupDrop(e, group.id)}
      className={`rounded-2xl relative transition-colors duration-150 border bg-white dark:bg-neutral-900/90 shadow-xs flex flex-col ${
        menuOpen
          ? 'z-40'
          : 'hover:z-10 focus-within:z-30 [&:has([data-menu-open=true])]:z-40 [&:has(.item-menu-dropdown)]:z-40'
      } ${
        isDraggingGroup ? 'opacity-30' : 'opacity-100'
      } border-neutral-200/90 dark:border-neutral-800`}
    >
      {/* Drop position indicator lines (Zero Layout Shift) */}
      {groupDropPosition === 'above' && (
        <div className="absolute -top-1.5 inset-x-2 h-1 bg-emerald-500 dark:bg-emerald-400 rounded-full shadow-xs z-30 pointer-events-none" />
      )}
      {groupDropPosition === 'below' && (
        <div className="absolute -bottom-1.5 inset-x-2 h-1 bg-emerald-500 dark:bg-emerald-400 rounded-full shadow-xs z-30 pointer-events-none" />
      )}

      {/* Group Header */}
      <div
        className={`p-3.5 sm:p-4 select-none transition-colors ${
          group.isCollapsed
            ? 'rounded-2xl'
            : 'border-b border-neutral-100 dark:border-neutral-800/80 rounded-t-2xl'
        }`}
      >
        {/* Top Control Bar: Color Pill, Drag Handle, Collapse Button, Count Badge, Progress & Options */}
        <div className="flex items-center justify-between gap-2">
          {/* Left Controls & Status Badge */}
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Group Icon */}
            <div
              className="w-6 h-6 flex items-center justify-center shrink-0 transition-all"
              style={{
                color: group.color || '#10b981',
              }}
              title={group.title}
            >
              <IconRenderer
                name={group.icon || 'shopping-bag'}
                className="w-4 h-4 stroke-[2.2]"
              />
            </div>

            {/* Group Drag Handle */}
            {!isReadOnly && (
              <div
                draggable
                onDragStart={(e) => onGroupDragStart(e, group.id)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-grab active:cursor-grabbing p-1 rounded-lg transition-colors touch-none"
                title={t.dragGroup}
              >
                <GripHorizontal className="w-4 h-4" />
              </div>
            )}

            {/* Collapse/Expand button */}
            <button
              onClick={() => onToggleCollapse(group.id)}
              className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded transition-colors cursor-pointer"
              title={group.isCollapsed ? t.expand : t.collapse}
            >
              {group.isCollapsed ? (
                <ChevronRight className="w-4 h-4 rtl:rotate-180 transition-transform" />
              ) : (
                <ChevronDown className="w-4 h-4 transition-transform" />
              )}
            </button>

            {/* Completed / Total count pill */}
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shrink-0">
              {completedCount}/{totalCount}
            </span>
          </div>

          {/* Right Side: Progress gauge & Group Options Menu */}
          <div className="flex items-center gap-1.5 shrink-0">
            {totalCount > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
                <span className={percentComplete === 100 ? 'text-emerald-500 font-semibold' : ''}>
                  {percentComplete}%
                </span>
              </div>
            )}

            {/* Group Menu Trigger */}
            {!isReadOnly && (
              <div className="relative" ref={menuRef}>
                <button
                  id={`group-menu-btn-${group.id}`}
                  onClick={() => {
                    setMenuOpen(!menuOpen);
                    setSortMenuOpen(false);
                  }}
                  title="Group options"
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {/* Group Options Dropdown */}
                {menuOpen && (
                  <div
                    className="absolute end-0 top-full mt-1.5 z-40 w-48 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-xl py-1 text-xs text-neutral-700 dark:text-neutral-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEditGroup(group);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 transition-colors cursor-pointer text-start"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{t.editGroup}</span>
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDuplicateGroup(group);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 transition-colors cursor-pointer text-start"
                    >
                      <Copy className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{t.duplicate}</span>
                    </button>

                    {/* Sort sub-options */}
                    <div className="relative">
                      <button
                        onClick={() => setSortMenuOpen(!sortMenuOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 transition-colors cursor-pointer text-start"
                      >
                        <div className="flex items-center gap-2">
                          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{t.sortBy}</span>
                        </div>
                        <span className="text-[10px] text-neutral-400">▸</span>
                      </button>

                      {sortMenuOpen && (
                        <div className="ps-4 pe-2 py-1 bg-neutral-50 dark:bg-neutral-900 border-y border-neutral-200 dark:border-neutral-700 space-y-1">
                          <button
                            onClick={() => {
                              onSortGroupItems(group.id, 'alphabetical');
                              setMenuOpen(false);
                            }}
                            className="w-full text-start px-2 py-1 rounded text-[11px] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                          >
                            {t.sortAlpha}
                          </button>
                          <button
                            onClick={() => {
                              onSortGroupItems(group.id, 'quantity');
                              setMenuOpen(false);
                            }}
                            className="w-full text-start px-2 py-1 rounded text-[11px] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                          >
                            {t.sortQuantity}
                          </button>
                        </div>
                      )}
                    </div>

                    {completedCount > 0 && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onClearCompletedInGroup(group.id);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer text-start"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{t.clearCompleted} ({completedCount})</span>
                      </button>
                    )}

                    <div className="my-1 border-t border-neutral-200 dark:border-neutral-700" />

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDeleteGroup(group.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-start"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.deleteGroup}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Separate Row for Group Title: Maximizes space and readability */}
        <div className="mt-2.5 pt-0.5">
          <h3
            onClick={() => onToggleCollapse(group.id)}
            className="text-base sm:text-[17px] font-bold text-neutral-900 dark:text-neutral-100 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors leading-snug break-words"
          >
            {group.title}
          </h3>
        </div>
      </div>

      {/* Group Body (Collapsible) */}
      {!group.isCollapsed && (
        <div className="p-3 sm:p-4 flex-1 flex flex-col space-y-2.5">
          {/* Quick Add Inline Form */}
          {!isReadOnly && (
            <form onSubmit={handleQuickAdd} className="relative">
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder={t.addItemToGroup}
                className="w-full h-9.5 ps-3.5 pe-10 text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
              />
              <button
                type="submit"
                disabled={!quickInput.trim()}
                title={t.addItem}
                className="absolute inset-y-1 end-1 px-2.5 flex items-center justify-center rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-emerald-500 active:scale-95 transition-all shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </form>
          )}

          {/* Items Container & Drop Zone */}
          <div
            onDragOver={!isReadOnly ? handleEmptyZoneDragOver : undefined}
            onDragLeave={!isReadOnly ? handleEmptyZoneDragLeave : undefined}
            onDrop={!isReadOnly ? handleEmptyZoneDrop : undefined}
            className={`space-y-2 min-h-[50px] rounded-xl p-1 transition-colors ${
              isOverEmptyZone ? 'bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-400/50 ring-inset' : ''
            }`}
          >
            {items.length === 0 ? (
              <div className="py-6 text-center text-neutral-400 dark:text-neutral-500">
                <ListTodo className="w-6 h-6 mx-auto mb-2 text-neutral-300 dark:text-neutral-600 stroke-1" />
                <p className="text-xs font-medium">{t.emptyGroup}</p>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                  {t.emptyGroupHint}
                </p>
              </div>
            ) : (
              items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  groups={allGroups}
                  language={language}
                  searchQuery={searchQuery}
                  isReadOnly={isReadOnly}
                  onToggleComplete={onToggleComplete}
                  onEditItem={onEditItem}
                  onDeleteItem={onDeleteItem}
                  onDuplicateItem={onDuplicateItem}
                  onTogglePin={onTogglePin}
                  onToggleHighlight={onToggleHighlight}
                  onMoveToGroup={onMoveToGroup}
                  onInlineUpdateTitle={onInlineUpdateTitle}
                  onUpdateQuantity={onUpdateQuantity}
                  isDragging={draggingItemId === item.id}
                  onDragStart={onItemDragStart}
                  onDragEnd={onDragEnd}
                  onDragOver={onItemDragOver}
                  onDragLeave={onItemDragLeave}
                  onDrop={onItemDrop}
                  dropPosition={itemDropTargetId === item.id ? itemDropPosition : null}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
