import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckSquare,
  Briefcase,
  FolderKanban,
  ShoppingCart,
  Home,
  Calendar,
  Plane,
  BookOpen,
  Code,
  Dumbbell,
  Heart,
  Star,
  Zap,
  Coffee,
  Bookmark,
  Layers,
  Flag,
  Target,
  Palette,
} from 'lucide-react';
import { AppList, Language } from '../types';
import { getTranslation } from '../locales/translations';

interface ListModalProps {
  isOpen: boolean;
  onClose: () => void;
  listToEdit?: AppList | null;
  onSave: (listData: { title: string; color: string; icon: string; description?: string }) => void;
  language: Language;
}

const COLOR_PALETTE = [
  { name: 'Emerald', hex: '#10b981', bg: 'bg-emerald-500' },
  { name: 'Indigo', hex: '#6366f1', bg: 'bg-indigo-500' },
  { name: 'Amber', hex: '#f59e0b', bg: 'bg-amber-500' },
  { name: 'Rose', hex: '#f43f5e', bg: 'bg-rose-500' },
  { name: 'Cyan', hex: '#06b6d4', bg: 'bg-cyan-500' },
  { name: 'Violet', hex: '#8b5cf6', bg: 'bg-violet-500' },
  { name: 'Teal', hex: '#14b8a6', bg: 'bg-teal-500' },
  { name: 'Pink', hex: '#ec4899', bg: 'bg-pink-500' },
  { name: 'Blue', hex: '#3b82f6', bg: 'bg-blue-500' },
  { name: 'Orange', hex: '#f97316', bg: 'bg-orange-500' },
];

const AVAILABLE_ICONS = [
  { id: 'check-square', label: 'Checklist', icon: CheckSquare },
  { id: 'briefcase', label: 'Work', icon: Briefcase },
  { id: 'sparkles', label: 'Goals', icon: Sparkles },
  { id: 'shopping-cart', label: 'Cart', icon: ShoppingCart },
  { id: 'folder', label: 'Folder', icon: FolderKanban },
  { id: 'layers', label: 'Layers', icon: Layers },
  { id: 'target', label: 'Target', icon: Target },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'home', label: 'Home', icon: Home },
  { id: 'plane', label: 'Travel', icon: Plane },
  { id: 'book', label: 'Reading', icon: BookOpen },
  { id: 'code', label: 'Code', icon: Code },
  { id: 'dumbbell', label: 'Fitness', icon: Dumbbell },
  { id: 'heart', label: 'Health', icon: Heart },
  { id: 'star', label: 'Favorites', icon: Star },
  { id: 'coffee', label: 'Daily', icon: Coffee },
  { id: 'palette', label: 'Creative', icon: Palette },
  { id: 'flag', label: 'Milestones', icon: Flag },
  { id: 'zap', label: 'Habits', icon: Zap },
  { id: 'bookmark', label: 'Saved', icon: Bookmark },
];

export const ListModal: React.FC<ListModalProps> = ({
  isOpen,
  onClose,
  listToEdit,
  onSave,
  language,
}) => {
  const t = getTranslation(language);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0].hex);
  const [selectedIcon, setSelectedIcon] = useState(AVAILABLE_ICONS[0].id);
  const [error, setError] = useState('');

  useEffect(() => {
    if (listToEdit) {
      setTitle(listToEdit.title);
      setDescription(listToEdit.description || '');
      setSelectedColor(listToEdit.color || COLOR_PALETTE[0].hex);
      setSelectedIcon(listToEdit.icon || AVAILABLE_ICONS[0].id);
    } else {
      setTitle('');
      setDescription('');
      setSelectedColor(COLOR_PALETTE[0].hex);
      setSelectedIcon(AVAILABLE_ICONS[0].id);
    }
    setError('');
  }, [listToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(language === 'ar' ? 'يرجى إدخال اسم القائمة' : 'Please enter a list name');
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      color: selectedColor,
      icon: selectedIcon,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: selectedColor }}
            >
              <FolderKanban className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {listToEdit ? t.editList : t.newListTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* List Title */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              {t.listName} *
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder={t.listNamePlaceholder}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800 border ${
                error
                  ? 'border-rose-500 focus:ring-rose-500'
                  : 'border-neutral-200 dark:border-neutral-700 focus:border-emerald-500 dark:focus:border-emerald-400'
              } text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all`}
            />
            {error && <p className="text-xs text-rose-500 mt-1 font-medium">{error}</p>}
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              {language === 'ar' ? 'الوصف (اختياري)' : 'Description (Optional)'}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'ar' ? 'وصف موجز لمحتوى القائمة...' : 'Brief summary of this list...'}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all"
            />
          </div>

          {/* Theme Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              {t.listColor}
            </label>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_PALETTE.map((c) => {
                const isSelected = selectedColor === c.hex;
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setSelectedColor(c.hex)}
                    className={`w-7 h-7 rounded-xl ${c.bg} transition-all transform hover:scale-110 active:scale-95 cursor-pointer relative ${
                      isSelected ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-neutral-100 scale-110 shadow-xs' : 'opacity-80 hover:opacity-100'
                    }`}
                    title={c.name}
                  />
                );
              })}
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              {t.listIcon}
            </label>
            <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1 border border-neutral-100 dark:border-neutral-800 rounded-xl">
              {AVAILABLE_ICONS.map((item) => {
                const IconComp = item.icon;
                const isSelected = selectedIcon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedIcon(item.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs font-semibold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                    title={item.label}
                  >
                    <IconComp className="w-4 h-4 mb-1" />
                    <span className="text-[10px] truncate max-w-full">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
