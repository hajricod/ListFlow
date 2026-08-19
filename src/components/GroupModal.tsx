import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Palette, Check } from 'lucide-react';
import { ListGroup, Language } from '../types';
import { getTranslation } from '../locales/translations';
import { AVAILABLE_COLORS, AVAILABLE_ICONS, IconRenderer } from './IconRenderer';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: ListGroup | null;
  language: Language;
  onSave: (groupData: { id?: string; title: string; color: string; icon: string }) => void;
}

export const GroupModal: React.FC<GroupModalProps> = ({
  isOpen,
  onClose,
  group,
  language,
  onSave,
}) => {
  const t = getTranslation(language);
  const [title, setTitle] = useState('');
  const [color, setColor] = useState(AVAILABLE_COLORS[0]);
  const [icon, setIcon] = useState(AVAILABLE_ICONS[0]);

  useEffect(() => {
    if (group) {
      setTitle(group.title);
      setColor(group.color || AVAILABLE_COLORS[0]);
      setIcon(group.icon || AVAILABLE_ICONS[0]);
    } else {
      setTitle('');
      setColor(AVAILABLE_COLORS[Math.floor(Math.random() * AVAILABLE_COLORS.length)]);
      setIcon(AVAILABLE_ICONS[0]);
    }
  }, [group, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: group?.id,
      title: title.trim(),
      color,
      icon,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-5 sm:p-6 my-8 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-2xs"
              style={{ backgroundColor: color }}
            >
              <IconRenderer name={icon} className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {group ? t.editGroup : t.newGroupTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              {t.groupNameLabel} *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.groupNamePlaceholder}
              className="w-full h-10 px-3.5 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Color Picker Palette */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-neutral-400" />
                {t.groupColor}
              </span>
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVAILABLE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-full aspect-square rounded-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-2xs"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              {t.groupIcon}
            </label>
            <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
              {AVAILABLE_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all ${
                    icon === ic
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 ring-2 ring-indigo-500 shadow-xs'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  <IconRenderer name={ic} className="w-4.5 h-4.5" />
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 disabled:opacity-50 shadow-sm shadow-indigo-600/20 active:scale-[0.98] transition-all"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
