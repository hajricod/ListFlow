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
  Calendar,
  Clock,
  Bell,
  AlertCircle,
  CheckSquare,
  Square,
  Trash2,
  Flag,
  ListTodo,
} from 'lucide-react';
import { ListItem, ListGroup, Language, ListType, Priority, SubTask } from '../types';
import { getTranslation } from '../locales/translations';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ListItem | null;
  groups: ListGroup[];
  defaultGroupId?: string;
  language: Language;
  listType?: ListType;
  onSave: (itemData: Partial<ListItem> & { id?: string }) => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  item,
  groups,
  defaultGroupId,
  language,
  listType = 'groceries',
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

  // Task-specific fields
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [reminder, setReminder] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setGroupId(item.groupId);
      setQuantity(item.quantity !== undefined ? String(item.quantity) : '');
      setUnit(item.unit || '');
      setNotes(item.notes || item.description || '');
      setIsPinned(Boolean(item.isPinned));
      setIsHighlighted(Boolean(item.isHighlighted));
      setStartDate(item.startDate || '');
      setDueDate(item.dueDate || '');
      setReminder(item.reminder || '');
      setPriority(item.priority || 'medium');
      setSubtasks(item.subtasks ? [...item.subtasks] : []);
    } else {
      setTitle('');
      setGroupId(defaultGroupId || groups[0]?.id || '');
      setQuantity('');
      setUnit('');
      setNotes('');
      setIsPinned(false);
      setIsHighlighted(false);
      setStartDate('');
      setDueDate('');
      setReminder('');
      setPriority('medium');
      setSubtasks([]);
    }
    setNewSubtaskTitle('');
  }, [item, defaultGroupId, groups, isOpen, language]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isTask = listType === 'tasks';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isTask) {
      // Save Task item (no counter / quantity / unit)
      onSave({
        id: item?.id,
        title: title.trim(),
        groupId: groupId || groups[0]?.id,
        startDate: startDate.trim() || undefined,
        dueDate: dueDate.trim() || undefined,
        reminder: reminder.trim() || undefined,
        priority,
        subtasks,
        notes: notes.trim() || undefined,
        isPinned,
        isHighlighted,
        quantity: undefined,
        unit: undefined,
      });
    } else {
      // Save Grocery item (with counter / quantity / unit)
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
    }

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

  const setQuickDate = (field: 'start' | 'due', daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(field === 'start' ? 9 : 18, 0, 0, 0);
    const isoString = d.toISOString().slice(0, 16);
    if (field === 'start') {
      setStartDate(isoString);
    } else {
      setDueDate(isoString);
    }
  };

  const handleAddSubtask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const newSub: SubTask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    setSubtasks((prev) => [...prev, newSub]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subId: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleDeleteSubtask = (subId: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== subId));
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
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="item-modal-dialog"
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isTask
                  ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isTask ? <CheckSquare className="w-4 h-4" /> : <ListTodo className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {isTask
                  ? item
                    ? t.editTask || 'Edit Task'
                    : t.newTask || 'New Task'
                  : item
                  ? t.editItem
                  : t.newItem}
              </h2>
            </div>
          </div>
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
            {/* Title / Name */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                {isTask ? t.taskName || 'Task Title' : t.itemName} <span className="text-rose-500">*</span>
              </label>
              <input
                id="item-title-input"
                type="text"
                required
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isTask ? (t.taskNamePlaceholder || 'e.g. Prepare presentation, Submit code review...') : t.itemNamePlaceholder}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 ${
                  isTask
                    ? 'focus:ring-indigo-500/40 focus:border-indigo-500'
                    : 'focus:ring-emerald-500/40 focus:border-emerald-500'
                }`}
              />
            </div>

            {/* Section / Category / Aisle Selection */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <FolderKanban className={`w-3.5 h-3.5 ${isTask ? 'text-indigo-500' : 'text-emerald-500'}`} />
                  <span>{isTask ? (t.taskSection || 'Section / Category') : t.selectAisle}</span>
                </span>
              </label>
              <select
                id="item-aisle-select"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 ${
                  isTask
                    ? 'focus:ring-indigo-500/40 focus:border-indigo-500'
                    : 'focus:ring-emerald-500/40 focus:border-emerald-500'
                }`}
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.title}
                  </option>
                ))}
              </select>
            </div>

            {/* TASK SPECIFIC: Priority, Dates, Reminders, Subtasks */}
            {isTask ? (
              <>
                {/* Priority Selector */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Flag className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{t.priority || 'Priority'}</span>
                    </span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(
                      [
                        { key: 'low', label: t.priorityLow || 'Low', color: 'border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 bg-neutral-100/60 dark:bg-neutral-800/60' },
                        { key: 'medium', label: t.priorityMedium || 'Medium', color: 'border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-950/40' },
                        { key: 'high', label: t.priorityHigh || 'High', color: 'border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/40' },
                        { key: 'urgent', label: t.priorityUrgent || 'Urgent', color: 'border-rose-400 dark:border-rose-600 text-rose-700 dark:text-rose-300 bg-rose-50/60 dark:bg-rose-950/40' },
                      ] as const
                    ).map((p) => {
                      const isSelected = priority === p.key;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setPriority(p.key)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                            isSelected
                              ? `${p.color} ring-2 ring-indigo-500/30 font-bold shadow-xs scale-[1.02]`
                              : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-700'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dates: Start Date and End/Due Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Start Date */}
                  <div className="p-3 rounded-xl bg-neutral-50/80 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{t.startDate || 'Start Date'}</span>
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setQuickDate('start', 0)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-600 transition-colors"
                        >
                          {t.today || 'Today'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickDate('start', 1)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-600 transition-colors"
                        >
                          {t.tomorrow || 'Tomorrow'}
                        </button>
                      </div>
                    </div>
                    <input
                      id="item-start-date-input"
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {startDate && (
                      <button
                        type="button"
                        onClick={() => setStartDate('')}
                        className="text-[10px] text-neutral-400 hover:text-rose-500 mt-1 cursor-pointer"
                      >
                        {language === 'ar' ? 'إزالة تاريخ البدء' : 'Clear start date'}
                      </button>
                    )}
                  </div>

                  {/* Due Date / End Date */}
                  <div className="p-3 rounded-xl bg-neutral-50/80 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                        <span>{t.endDate || 'Due / End Date'}</span>
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setQuickDate('due', 0)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:text-rose-600 transition-colors"
                        >
                          {t.today || 'Today'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickDate('due', 1)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:text-rose-600 transition-colors"
                        >
                          {t.tomorrow || 'Tomorrow'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickDate('due', 7)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:text-rose-600 transition-colors"
                        >
                          {t.nextWeek || '+1W'}
                        </button>
                      </div>
                    </div>
                    <input
                      id="item-due-date-input"
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    {dueDate && (
                      <button
                        type="button"
                        onClick={() => setDueDate('')}
                        className="text-[10px] text-neutral-400 hover:text-rose-500 mt-1 cursor-pointer"
                      >
                        {language === 'ar' ? 'إزالة تاريخ الاستحقاق' : 'Clear due date'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Reminder Selector */}
                <div className="p-3 rounded-xl bg-neutral-50/80 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/80">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t.reminder || 'Reminder'}</span>
                    </span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { key: '', label: t.noReminder || 'None' },
                      { key: 'at_start', label: t.reminderAtStart || 'At start time' },
                      { key: '1h', label: t.reminder1h || '1h before' },
                      { key: '1d', label: t.reminder1d || '1d before' },
                    ].map((r) => {
                      const isSelected = reminder === r.key;
                      return (
                        <button
                          key={r.key}
                          type="button"
                          onClick={() => setReminder(r.key)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-100 dark:bg-amber-950/50 border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-200 font-semibold shadow-2xs'
                              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          {r.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subtasks Checklist */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{t.subtasks || 'Subtasks'}</span>
                      {subtasks.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold">
                          {subtasks.filter((s) => s.completed).length}/{subtasks.length}
                        </span>
                      )}
                    </label>
                  </div>

                  {/* Existing Subtasks */}
                  {subtasks.length > 0 && (
                    <div className="space-y-1.5 mb-2.5 max-h-36 overflow-y-auto">
                      {subtasks.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 group"
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleSubtask(sub.id)}
                            className="flex items-center gap-2 text-start flex-1 cursor-pointer"
                          >
                            {sub.completed ? (
                              <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-neutral-400 shrink-0" />
                            )}
                            <span
                              className={`text-xs ${
                                sub.completed
                                  ? 'line-through text-neutral-400 dark:text-neutral-500'
                                  : 'text-neutral-800 dark:text-neutral-200'
                              }`}
                            >
                              {sub.title}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubtask(sub.id)}
                            className="p-1 rounded text-neutral-400 hover:text-rose-500 opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Remove subtask"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Subtask Input */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubtask();
                        }
                      }}
                      placeholder={t.subtaskPlaceholder || 'Add a subtask step...'}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSubtask()}
                      disabled={!newSubtaskTitle.trim()}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* GROCERY SPECIFIC: Quantity & Unit Row */
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
            )}

            {/* Notes / Details */}
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
                placeholder={isTask ? (language === 'ar' ? 'ملاحظات تفصيلية، روابط، أو مراجع...' : 'Detailed instructions, links, or notes...') : t.notesPlaceholder}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 ${
                  isTask
                    ? 'focus:ring-indigo-500/40 focus:border-indigo-500'
                    : 'focus:ring-emerald-500/40 focus:border-emerald-500'
                }`}
              />
            </div>

            {/* Pin Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80">
              <div className="flex items-center gap-2">
                <Pin className={`w-4 h-4 ${isPinned ? 'text-amber-500 fill-amber-500' : 'text-neutral-400'}`} />
                <div>
                  <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 block">
                    {t.pinItem}
                  </span>
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                    {language === 'ar' ? 'تثبيت العنصر في أعلى القسم' : 'Keep pinned to the top of section'}
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

            {/* Highlight Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80">
              <div className="flex items-center gap-2">
                <Highlighter className={`w-4 h-4 ${isHighlighted ? (isTask ? 'text-indigo-500 fill-indigo-500/40' : 'text-emerald-500 fill-emerald-500/40') : 'text-neutral-400'}`} />
                <div>
                  <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 block">
                    {t.highlightItem}
                  </span>
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                    {language === 'ar' ? 'تمييز العنصر ومشاركته مع باقي الأعضاء' : 'Highlight item and sync with all list members'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                id="highlight-toggle-btn"
                onClick={() => setIsHighlighted(!isHighlighted)}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isHighlighted ? (isTask ? 'bg-indigo-600' : 'bg-emerald-500') : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    isHighlighted ? (language === 'ar' ? 'right-5' : 'left-5') : language === 'ar' ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Fixed Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/90 backdrop-blur-xs shrink-0">
            <button
              type="button"
              id="cancel-modal-btn"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer active:scale-95"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              id="save-item-btn"
              className={`px-5 py-2 rounded-xl text-sm font-semibold text-white active:scale-95 shadow-sm transition-all cursor-pointer ${
                isTask
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
