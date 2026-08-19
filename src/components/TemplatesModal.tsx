import React from 'react';
import { X, Sparkles, CheckSquare, Layers, Calendar, FolderKanban } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../locales/translations';
import { getLocalizedTemplate, TemplateKey } from '../utils/storage';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSelectTemplate: (templateKey: TemplateKey, replace: boolean) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  language,
  onSelectTemplate,
}) => {
  const t = getTranslation(language);
  if (!isOpen) return null;

  const weeklyTpl = getLocalizedTemplate('weekly', language);
  const freshMarketTpl = getLocalizedTemplate('freshMarket', language);
  const bbqTpl = getLocalizedTemplate('bbq', language);
  const pantryTpl = getLocalizedTemplate('pantry', language);

  const templatesList = [
    {
      key: 'weekly' as const,
      title: weeklyTpl.name,
      icon: CheckSquare,
      color: '#10b981',
      groupsCount: weeklyTpl.groups.length,
      itemsCount: weeklyTpl.items.length,
      desc: weeklyTpl.desc,
    },
    {
      key: 'freshMarket' as const,
      title: freshMarketTpl.name,
      icon: Calendar,
      color: '#06b6d4',
      groupsCount: freshMarketTpl.groups.length,
      itemsCount: freshMarketTpl.items.length,
      desc: freshMarketTpl.desc,
    },
    {
      key: 'bbq' as const,
      title: bbqTpl.name,
      icon: Layers,
      color: '#ef4444',
      groupsCount: bbqTpl.groups.length,
      itemsCount: bbqTpl.items.length,
      desc: bbqTpl.desc,
    },
    {
      key: 'pantry' as const,
      title: pantryTpl.name,
      icon: FolderKanban,
      color: '#f59e0b',
      groupsCount: pantryTpl.groups.length,
      itemsCount: pantryTpl.items.length,
      desc: pantryTpl.desc,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-5 sm:p-6 my-8 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {t.templatesTitle}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t.templatesDesc}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template List Cards */}
        <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pe-1">
          {templatesList.map((tpl) => {
            const Icon = tpl.icon;
            return (
              <div
                key={tpl.key}
                className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                    style={{ backgroundColor: tpl.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {tpl.title}
                      </h4>
                      <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                        {tpl.groupsCount} {t.aisles} • {tpl.itemsCount} {t.items}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      {tpl.desc}
                    </p>

                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          onSelectTemplate(tpl.key, false);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700/80 transition-all cursor-pointer"
                      >
                        {t.appendTemplate}
                      </button>
                      <button
                        onClick={() => {
                          onSelectTemplate(tpl.key, true);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-2xs active:scale-95 cursor-pointer"
                      >
                        {t.replaceCurrent}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
