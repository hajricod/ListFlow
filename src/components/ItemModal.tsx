import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  Pin,
  FolderKanban,
  FileText,
  Hash,
  Highlighter,
} from 'lucide-react';
import { ListItem, ListGroup, Language, GroceryUnit } from '../types';
import { getTranslation } from '../locales/translations';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ListItem | null;
  groups: ListGroup[];
  defaultGroupId?: string;
  language: Language;
  onSave: (itemData: Partial<ListItem> & { id?: string }) => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  item,
  groups,
  defaultGroupId,
  language,
  onSave,
}) => {
  const t = getTranslation(language);
  const [title, setTitle] = useState('');
  const [groupId, setGroupId] = useState(defaultGroupId || groups[0]?.id || '');
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setGroupId(item.groupId);
      setQuantity(item.quantity !== undefined ? String(item.quantity) : '');
      setUnit(item.unit || '');
      setNotes(item.notes || item.description || '');
      setIsPinned(Boolean(item.isPinned));
      setIsHighlighted(Boolean(item.isHighlighted));
    } else {
      setTitle('');
      setGroupId(defaultGroupId || groups[0]?.id || '');
      setQuantity('');
      setUnit('');
      setNotes('');
      setIsPinned(false);
      setIsHighlighted(false);
    }
  }, [item, defaultGroupId, groups, isOpen, language]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedQty =
      quantity.trim() !== '' && !isNaN(Number(quantity)) && Number(quantity) > 0
        ? Number(quantity)
        : undefined;
    const parsedUnit = unit.trim() ? unit.trim() : undefined;

    onSave({
      id: item?.id,
      title: title.trim(),
      groupId: groupId || groups[0]?.id,
      quantity: parsedQty,
      unit: parsedUnit,
      notes: notes.trim() || undefined,
      isPinned,
      isHighlighted,
    });

    onClose();
  };

  const handleDecrement = () => {
    const current = parseFloat(quantity);
    if (isNaN(current) || current <= 1) {
      setQuantity('');
    } else {
      setQuantity(String(Math.max(0.5, current - 1)));
    }
  };

  const handleIncrement = () => {
    const current = parseFloat(quantity);
    if (isNaN(current)) {
      setQuantity('1');
    } else {
      setQuantity(String(current + 1));
    }
  };

  const commonUnits: { label: string; value: string }[] =
    language === 'ar'
      ? [
          { label: t.noUnit, value: '' },
          { label: 'حبة (قطعة)', value: 'حبة' },
          { label: 'كجم (كيلو)', value: 'كجم' },
          { label: 'جرام (غ)', value: 'غ' },
          { label: 'لتر (L)', value: 'لتر' },
          { label: 'عبوة / كيس', value: 'كيس' },
          { label: 'علبة / كرتون', value: 'علبة' },
          { label: 'باقة / حزمة', value: 'باقة' },
          { label: 'زجاجة / قارورة', value: 'زجاجة' },
        ]
      : [
          { label: t.noUnit, value: '' },
          { label: 'pcs (pieces)', value: 'pcs' },
          { label: 'kg (kilograms)', value: 'kg' },
          { label: 'g (grams)', value: 'g' },
          { label: 'L (liters)', value: 'L' },
          { label: 'pack / bag', value: 'pack' },
          { label: 'box / carton', value: 'box' },
          { label: 'bunch', value: 'bunch' },
          { label: 'bottle / can', value: 'bottle' },
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="item-modal-dialog"
        className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            {item ? t.editItem : t.newItem}
          </h2>
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Grocery Item Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              {t.itemName} <span className="text-rose-500">*</span>
            </label>
            <input
              id="item-title-input"
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.itemNamePlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
          </div>

          {/* Aisle Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              <span className="flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t.selectAisle}</span>
              </span>
            </label>
            <select
              id="item-aisle-select"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.title}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Unit Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Quantity with Stepper */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{t.quantity}</span>
                  </span>
                  <span className="text-[10px] text-neutral-400 font-normal">({t.optional})</span>
                </div>
              </label>
              <div className="flex items-center rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="px-3 py-2.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                  title="Decrease"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  id="item-quantity-input"
                  type="number"
                  min="0.1"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={t.quantityOptionalPlaceholder}
                  className="w-full text-center py-2 bg-transparent text-sm font-semibold text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 placeholder:font-normal focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="px-3 py-2.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                  title="Increase"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                <div className="flex items-center justify-between">
                  <span>{t.unit}</span>
                  <span className="text-[10px] text-neutral-400 font-normal">({t.optional})</span>
                </div>
              </label>
              <select
                id="item-unit-select"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              >
                {commonUnits.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes / Brand */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-neutral-400" />
                <span>{t.notes}</span>
              </span>
            </label>
            <input
              id="item-notes-input"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
          </div>

          {/* Pin Staple Item Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80">
            <div className="flex items-center gap-2">
              <Pin className={`w-4 h-4 ${isPinned ? 'text-amber-500 fill-amber-500' : 'text-neutral-400'}`} />
              <div>
                <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 block">
                  {t.pinItem}
                </span>
                <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                  {language === 'ar' ? 'إبقاء الصنف في أعلى الممر كعنصر أساسي' : 'Keep item pinned at top as essential'}
                </span>
              </div>
            </div>
            <button
              type="button"
              id="pin-toggle-btn"
              onClick={() => setIsPinned(!isPinned)}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                isPinned ? 'bg-amber-500' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  isPinned ? (language === 'ar' ? 'right-5' : 'left-5') : language === 'ar' ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Highlight Item Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80">
            <div className="flex items-center gap-2">
              <Highlighter className={`w-4 h-4 ${isHighlighted ? 'text-emerald-500 fill-emerald-500/40' : 'text-neutral-400'}`} />
              <div>
                <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 block">
                  {t.highlightItem}
                </span>
                <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                  {language === 'ar' ? 'تمييز الصنف ومشاركته مع جميع الأعضاء' : 'Highlight item and sync with all list members'}
                </span>
              </div>
            </div>
            <button
              type="button"
              id="highlight-toggle-btn"
              onClick={() => setIsHighlighted(!isHighlighted)}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                isHighlighted ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  isHighlighted ? (language === 'ar' ? 'right-5' : 'left-5') : language === 'ar' ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              id="cancel-modal-btn"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              id="save-item-btn"
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-sm transition-all cursor-pointer"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
