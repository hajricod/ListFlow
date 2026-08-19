import React, { useState, useRef, useEffect } from 'react';
import {
  GripVertical,
  Check,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  FolderInput,
  Pin,
  Plus,
  Minus,
} from 'lucide-react';
import { ListItem, ListGroup, Language } from '../types';
import { getTranslation } from '../locales/translations';
import { sounds } from '../utils/audio';

interface ItemRowProps {
  item: ListItem;
  groups: ListGroup[];
  language: Language;
  searchQuery?: string;
  onToggleComplete: (id: string) => void;
  onEditItem: (item: ListItem) => void;
  onDeleteItem: (id: string) => void;
  onDuplicateItem: (item: ListItem) => void;
  onTogglePin: (id: string) => void;
  onMoveToGroup: (itemId: string, targetGroupId: string) => void;
  onInlineUpdateTitle: (id: string, newTitle: string) => void;
  onUpdateQuantity?: (id: string, delta: number) => void;
  // Drag and Drop props
  isDragging?: boolean;
  onDragStart: (e: React.DragEvent, id: string, groupId: string) => void;
  onDragEnd?: () => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string, groupId: string) => void;
  dropPosition?: 'above' | 'below' | null;
}

const HighlightText: React.FC<{ text: string; query?: string }> = ({ text, query }) => {
  if (!query || !query.trim()) return <>{text}</>;
  const trimmed = query.trim();
  const regex = new RegExp(`(${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-amber-200/90 dark:bg-amber-700/60 text-amber-950 dark:text-amber-100 font-semibold px-0.5 rounded"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

export const ItemRow: React.FC<ItemRowProps> = ({
  item,
  groups,
  language,
  searchQuery,
  onToggleComplete,
  onEditItem,
  onDeleteItem,
  onDuplicateItem,
  onTogglePin,
  onMoveToGroup,
  onInlineUpdateTitle,
  onUpdateQuantity,
  isDragging,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  dropPosition,
}) => {
  const t = getTranslation(language);
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [inlineTitle, setInlineTitle] = useState(item.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moveMenuOpen, setMoveMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setMoveMenuOpen(false);
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

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.completed) {
      sounds.playComplete();
    } else {
      sounds.playPop();
    }
    onToggleComplete(item.id);
  };

  const handleInlineSubmit = (e: React.FormEvent | React.FocusEvent) => {
    e.preventDefault();
    if (inlineTitle.trim() && inlineTitle !== item.title) {
      onInlineUpdateTitle(item.id, inlineTitle.trim());
    } else {
      setInlineTitle(item.title);
    }
    setIsEditingInline(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInlineSubmit(e);
    } else if (e.key === 'Escape') {
      setInlineTitle(item.title);
      setIsEditingInline(false);
    }
  };

  const handleQuickQuantity = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    sounds.playPop();
    if (onUpdateQuantity) {
      onUpdateQuantity(item.id, delta);
    }
  };

  const otherGroups = groups.filter((g) => g.id !== item.groupId);

  return (
    <div
      id={`grocery-item-${item.id}`}
      data-menu-open={menuOpen ? 'true' : undefined}
      draggable
      onDragStart={(e) => onDragStart(e, item.id, item.groupId)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, item.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, item.id, item.groupId)}
      className={`group/item relative flex flex-col gap-1.5 p-3 rounded-xl transition-colors duration-150 border ${
        menuOpen ? 'z-40' : 'z-1 hover:z-10'
      } ${
        isDragging ? 'opacity-30' : 'opacity-100'
      } ${
        item.completed
          ? 'bg-neutral-50/70 dark:bg-neutral-900/40 border-neutral-200/60 dark:border-neutral-800/40 opacity-75'
          : item.isPinned
          ? 'bg-amber-50/30 dark:bg-amber-950/15 border-amber-200/70 dark:border-amber-900/40 shadow-2xs'
          : 'bg-white dark:bg-neutral-900 border-neutral-200/90 dark:border-neutral-800/90 shadow-2xs hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-xs'
      }`}
    >
      {/* Drop position indicator lines (Zero Layout Shift) */}
      {dropPosition === 'above' && (
        <div className="absolute -top-1 inset-x-2 h-0.5 bg-emerald-500 dark:bg-emerald-400 rounded-full shadow-xs z-30 pointer-events-none" />
      )}
      {dropPosition === 'below' && (
        <div className="absolute -bottom-1 inset-x-2 h-0.5 bg-emerald-500 dark:bg-emerald-400 rounded-full shadow-xs z-30 pointer-events-none" />
      )}

      {/* Top Meta Bar: Drag Handle, Checkbox, Pinned, Quantity Badge & Actions */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: Drag Grip, Checkbox, Pinned, Quantity */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Drag Grip Handle */}
          <div
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-grab active:cursor-grabbing p-0.5 -ms-1 rounded transition-colors touch-none shrink-0"
            title={t.dragToReorder}
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* In-Cart Checkbox Button */}
          <button
            id={`checkbox-${item.id}`}
            type="button"
            onClick={handleCheckboxClick}
            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 border cursor-pointer ${
              item.completed
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs'
                : 'border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 hover:border-emerald-500 dark:hover:border-emerald-400'
            }`}
            aria-label={item.completed ? t.toBuy : t.inCart}
          >
            {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          {item.isPinned && (
            <span title={t.pinItem} className="text-amber-500 dark:text-amber-400 shrink-0">
              <Pin className="w-3.5 h-3.5 fill-amber-500" />
            </span>
          )}

          {/* Quantity & Unit Pill with Quick Adjustment Buttons */}
          {(item.quantity !== undefined || Boolean(item.unit)) && (
            <div className="flex items-center gap-1">
              {/* Quick Decrement */}
              {onUpdateQuantity && item.quantity !== undefined && (
                <button
                  id={`qty-minus-${item.id}`}
                  type="button"
                  onClick={(e) => handleQuickQuantity(e, -1)}
                  className="w-5 h-5 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 opacity-0 group-hover/item:opacity-100 transition-opacity cursor-pointer"
                  title="Decrease quantity"
                >
                  <Minus className="w-3 h-3" />
                </button>
              )}

              {/* Quantity Badge */}
              <span
                onClick={() => onEditItem(item)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  item.completed
                    ? 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-400 dark:text-neutral-500'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60'
                }`}
              >
                {item.quantity !== undefined && <span>{item.quantity}</span>}
                {item.unit && <span className="font-normal opacity-85">{item.unit}</span>}
              </span>

              {/* Quick Increment */}
              {onUpdateQuantity && item.quantity !== undefined && (
                <button
                  id={`qty-plus-${item.id}`}
                  type="button"
                  onClick={(e) => handleQuickQuantity(e, 1)}
                  className="w-5 h-5 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 opacity-0 group-hover/item:opacity-100 transition-opacity cursor-pointer"
                  title="Increase quantity"
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: More Options Menu */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="relative" ref={menuRef}>
            <button
              id={`menu-trigger-${item.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
                setMoveMenuOpen(false);
              }}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title={t.moreActions}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                className={`item-menu-dropdown absolute ${
                  language === 'ar' ? 'left-0' : 'right-0'
                } top-full mt-1 w-44 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-50 py-1 text-xs`}
              >
                {/* Edit */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEditItem(item);
                  }}
                  className="w-full px-3 py-2 text-start flex items-center gap-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{t.edit}</span>
                </button>

                {/* Pin/Unpin */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onTogglePin(item.id);
                  }}
                  className="w-full px-3 py-2 text-start flex items-center gap-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  <Pin className={`w-3.5 h-3.5 ${item.isPinned ? 'fill-amber-500 text-amber-500' : ''}`} />
                  <span>{item.isPinned ? t.unpinItem : t.pinItem}</span>
                </button>

                {/* Duplicate */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDuplicateItem(item);
                  }}
                  className="w-full px-3 py-2 text-start flex items-center gap-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t.duplicate}</span>
                </button>

                {/* Move to another Aisle */}
                {otherGroups.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setMoveMenuOpen(!moveMenuOpen)}
                      className="w-full px-3 py-2 text-start flex items-center justify-between text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <FolderInput className="w-3.5 h-3.5" />
                        <span>{t.moveToGroup}</span>
                      </span>
                      <span className="text-[10px] text-neutral-400">›</span>
                    </button>

                    {moveMenuOpen && (
                      <div
                        className={`absolute ${
                          language === 'ar' ? 'right-full me-1' : 'left-full ms-1'
                        } top-0 w-44 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg z-40 py-1`}
                      >
                        {otherGroups.map((g) => (
                          <button
                            key={g.id}
                            onClick={() => {
                              onMoveToGroup(item.id, g.id);
                              setMenuOpen(false);
                              setMoveMenuOpen(false);
                            }}
                            className="w-full px-3 py-2 text-start flex items-center gap-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 truncate cursor-pointer"
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: g.color }}
                            />
                            <span className="truncate">{g.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

                {/* Delete */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDeleteItem(item.id);
                  }}
                  className="w-full px-3 py-2 text-start flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.delete}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dedicated Separate Row for Item Title & Notes: Maximizes Text Space */}
      <div className="w-full min-w-0 pt-0.5">
        {isEditingInline ? (
          <input
            type="text"
            autoFocus
            value={inlineTitle}
            onChange={(e) => setInlineTitle(e.target.value)}
            onBlur={handleInlineSubmit}
            onKeyDown={handleKeyDown}
            className="w-full text-sm font-medium bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1.5 rounded-lg border border-emerald-500 text-neutral-900 dark:text-neutral-100 focus:outline-none"
          />
        ) : (
          <div
            onClick={() => onEditItem(item)}
            className="cursor-pointer group/title w-full"
          >
            <p
              className={`text-sm font-medium transition-all break-words leading-relaxed ${
                item.completed
                  ? 'line-through text-neutral-400 dark:text-neutral-500'
                  : 'text-neutral-900 dark:text-neutral-100'
              }`}
            >
              <HighlightText text={item.title} query={searchQuery} />
            </p>

            {/* Notes / Brand / Description preview */}
            {item.notes && (
              <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500 break-words leading-normal">
                <HighlightText text={item.notes} query={searchQuery} />
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
