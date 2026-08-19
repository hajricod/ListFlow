import React, { useState, useMemo } from 'react';
import {
  X,
  History,
  Trash2,
  Download,
  Search,
  Filter,
  Layers,
  FolderKanban,
  CheckSquare,
  Sliders,
  Database,
  Radio,
  Clock,
  Sparkles,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react';
import { ActivityLog, ActivityTargetType, Language } from '../types';
import { getTranslation } from '../locales/translations';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ActivityLog[];
  onClearHistory: () => void;
  language: Language;
  isLiveListening: boolean;
}

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({
  isOpen,
  onClose,
  activities,
  onClearHistory,
  language,
  isLiveListening,
}) => {
  const t = getTranslation(language);
  const [filterType, setFilterType] = useState<ActivityTargetType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const formatRelativeTime = (isoString: string) => {
    const now = Date.now();
    const time = new Date(isoString).getTime();
    const diffSec = Math.floor((now - time) / 1000);

    if (diffSec < 60) return t.justNow;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return t.minutesAgo.replace('{n}', String(diffMin));
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return t.hoursAgo.replace('{n}', String(diffHours));
    const diffDays = Math.floor(diffHours / 24);
    return t.daysAgo.replace('{n}', String(diffDays));
  };

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchType = filterType === 'all' || act.targetType === filterType;
      const matchSearch =
        !searchQuery.trim() ||
        act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (act.details && act.details.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (act.targetId && act.targetId.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchType && matchSearch;
    });
  }, [activities, filterType, searchQuery]);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(activities, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `database-change-log-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'update':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'delete':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'toggle':
        return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
      case 'reorder':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'clear':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'import':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'batch_sync':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      default:
        return 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create':
        return t.actionCreated;
      case 'update':
        return t.actionUpdated;
      case 'delete':
        return t.actionDeleted;
      case 'toggle':
        return t.actionToggled;
      case 'reorder':
        return t.actionReordered;
      case 'clear':
        return t.actionCleared;
      case 'import':
        return t.actionImported;
      case 'batch_sync':
        return t.actionBatchSynced;
      default:
        return action;
    }
  };

  const getTargetIcon = (type: ActivityTargetType) => {
    switch (type) {
      case 'list':
        return <FolderKanban className="w-4 h-4 text-emerald-500" />;
      case 'group':
        return <Layers className="w-4 h-4 text-blue-500" />;
      case 'item':
        return <CheckSquare className="w-4 h-4 text-indigo-500" />;
      case 'settings':
        return <Sliders className="w-4 h-4 text-amber-500" />;
      case 'batch':
        return <Database className="w-4 h-4 text-sky-500" />;
    }
  };

  return (
    <div
      id="activity-log-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="activity-log-modal-container"
        className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-lg">
                  {t.databaseChanges}
                </h3>
                {isLiveListening && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {t.databaseLiveSync}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {activities.length} {t.recentChanges}
              </p>
            </div>
          </div>

          <button
            id="close-activity-log-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search, Filters & Export */}
        <div className="px-6 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-neutral-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full ps-9 pe-4 py-1.5 text-xs rounded-xl bg-neutral-100/70 dark:bg-neutral-800/70 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              id="export-activity-log-btn"
              onClick={handleExportJSON}
              disabled={activities.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 disabled:opacity-50 transition-colors"
              title={t.exportHistory}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.exportHistory}</span>
            </button>

            <button
              id="clear-activity-log-btn"
              onClick={onClearHistory}
              disabled={activities.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/50 disabled:opacity-50 transition-colors"
              title={t.clearHistory}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.clearHistory}</span>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-6 py-2 bg-neutral-50/70 dark:bg-neutral-900/70 border-b border-neutral-200 dark:border-neutral-800 flex gap-1.5 overflow-x-auto no-scrollbar text-xs">
          {[
            { id: 'all', label: t.filterAll },
            { id: 'list', label: t.filterLists },
            { id: 'group', label: t.filterGroups },
            { id: 'item', label: t.filterItems },
            { id: 'settings', label: t.filterSettings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1 rounded-lg font-medium transition-all whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List of changes */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 divide-y divide-neutral-100 dark:divide-neutral-800">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mx-auto flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
              <p className="font-medium text-sm text-neutral-700 dark:text-neutral-300">
                {t.noChangesLogged}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                {t.noChangesLoggedDesc}
              </p>
            </div>
          ) : (
            filteredActivities.map((log) => (
              <div
                key={log.id}
                id={`activity-card-${log.id}`}
                className="pt-3 first:pt-0 flex items-start gap-3.5 group hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 p-2 rounded-xl transition-colors"
              >
                <div className="mt-0.5 p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60 shrink-0">
                  {getTargetIcon(log.targetType)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md border ${getActionBadgeColor(
                        log.action
                      )}`}
                    >
                      {getActionLabel(log.action)}
                    </span>
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {log.title}
                    </span>
                  </div>

                  {log.details && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-1.5 font-normal">
                      {log.details}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-neutral-400 dark:text-neutral-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span title={new Date(log.timestamp).toLocaleString()}>
                        {formatRelativeTime(log.timestamp)}
                      </span>
                    </span>

                    {log.source && (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-neutral-400" />
                        <span>{log.source}</span>
                      </span>
                    )}

                    {log.targetId && (
                      <span className="text-neutral-400 font-mono text-[10px] hidden sm:inline truncate max-w-[120px]">
                        #{log.targetId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              {isLiveListening ? t.liveListening : t.localDataSaved}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
