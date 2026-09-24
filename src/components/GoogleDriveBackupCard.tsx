import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  LogOut,
  Layers,
  Check,
  X,
} from 'lucide-react';
import { Language, ShoppingList, ListGroup, ListItem } from '../types';
import { getTranslation } from '../locales/translations';
import {
  connectGoogleDrive,
  getCachedDriveToken,
  setCachedDriveToken,
} from '../lib/firebase';
import {
  listGoogleDriveBackups,
  uploadGoogleDriveBackup,
  downloadGoogleDriveBackup,
  deleteGoogleDriveBackup,
  DriveBackupFile,
  WorkspaceBackupData,
} from '../lib/googleDrive';
import { User } from 'firebase/auth';

interface GoogleDriveBackupCardProps {
  language: Language;
  user: User | null;
  lists: ShoppingList[];
  groups: ListGroup[];
  items: ListItem[];
  onRestoreData: (backup: WorkspaceBackupData, mode: 'replace' | 'merge') => void;
  showToast: (message: string, duration?: number, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const GoogleDriveBackupCard: React.FC<GoogleDriveBackupCardProps> = ({
  language,
  user,
  lists,
  groups,
  items,
  onRestoreData,
  showToast,
}) => {
  const t = getTranslation(language);
  const [token, setToken] = useState<string | null>(getCachedDriveToken());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [backups, setBackups] = useState<DriveBackupFile[]>([]);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => {
    return localStorage.getItem('listflow_last_drive_backup');
  });

  // Modal states for destructive actions (MANDATORY per Workspace skill)
  const [restoreTarget, setRestoreTarget] = useState<DriveBackupFile | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [isRestoring, setIsRestoring] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<DriveBackupFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync token state
  useEffect(() => {
    setToken(getCachedDriveToken());
  }, [user]);

  // Fetch backups whenever token becomes available
  const fetchBackups = async (activeToken: string) => {
    setIsLoadingBackups(true);
    try {
      const files = await listGoogleDriveBackups(activeToken);
      setBackups(files);
    } catch (err: any) {
      console.warn('Could not list Google Drive backups:', err);
      // If token expired, clear cached token
      if (err.message && (err.message.includes('401') || err.message.includes('Invalid Credentials'))) {
        setCachedDriveToken(null);
        setToken(null);
      }
    } finally {
      setIsLoadingBackups(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBackups(token);
    } else {
      setBackups([]);
    }
  }, [token]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await connectGoogleDrive();
      setToken(res.accessToken);
      showToast(
        language === 'ar'
          ? 'تم ربط Google Drive بنجاح!'
          : 'Google Drive connected successfully!',
        3000,
        'success'
      );
      await fetchBackups(res.accessToken);
    } catch (err: any) {
      console.error('Failed to connect Google Drive:', err);
      showToast(
        language === 'ar'
          ? 'فشل الاتصال بـ Google Drive. يرجى المحاولة ثانية.'
          : 'Failed to connect Google Drive. Please try again.',
        4000,
        'error'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setCachedDriveToken(null);
    setToken(null);
    setBackups([]);
    showToast(
      language === 'ar' ? 'تم فصل Google Drive' : 'Google Drive disconnected',
      2500,
      'info'
    );
  };

  const handleBackupNow = async () => {
    let activeToken = token;
    if (!activeToken) {
      try {
        setIsConnecting(true);
        const res = await connectGoogleDrive();
        activeToken = res.accessToken;
        setToken(activeToken);
      } catch (err) {
        setIsConnecting(false);
        showToast(
          language === 'ar'
            ? 'يرجى تسجيل الدخول وإعطاء الإذن لـ Google Drive'
            : 'Please authorize Google Drive to backup your lists',
          4000,
          'error'
        );
        return;
      } finally {
        setIsConnecting(false);
      }
    }

    setIsBackingUp(true);
    try {
      const payload: WorkspaceBackupData = {
        version: '3.0',
        type: 'listflow_workspace',
        exportedAt: new Date().toISOString(),
        language,
        lists,
        groups,
        items,
      };

      const newFile = await uploadGoogleDriveBackup(activeToken, payload);
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastBackupTime(nowStr);
      localStorage.setItem('listflow_last_drive_backup', nowStr);

      showToast(
        language === 'ar'
          ? 'تم حفظ النسخة الاحتياطية بنجاح في Google Drive!'
          : 'Backup successfully saved to Google Drive!',
        3500,
        'success'
      );

      // Refresh backup list
      await fetchBackups(activeToken);
    } catch (err: any) {
      console.error('Backup failed:', err);
      showToast(
        language === 'ar'
          ? 'فشل رفع النسخة الاحتياطية إلى Google Drive.'
          : 'Failed to upload backup to Google Drive.',
        4000,
        'error'
      );
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!restoreTarget || !token) return;
    setIsRestoring(true);
    try {
      const data = await downloadGoogleDriveBackup(token, restoreTarget.id);
      onRestoreData(data, restoreMode);
      setRestoreTarget(null);
      showToast(
        language === 'ar'
          ? 'تمت استعادة النسخة الاحتياطية بنجاح!'
          : 'Backup restored successfully from Google Drive!',
        3500,
        'success'
      );
    } catch (err: any) {
      console.error('Restore failed:', err);
      showToast(
        language === 'ar'
          ? 'فشلت استعادة النسخة الاحتياطية.'
          : 'Failed to restore backup from Google Drive.',
        4000,
        'error'
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteTarget || !token) return;
    setIsDeleting(true);
    try {
      await deleteGoogleDriveBackup(token, deleteTarget.id);
      setBackups((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast(
        language === 'ar'
          ? 'تم حذف النسخة الاحتياطية من Google Drive'
          : 'Backup deleted from Google Drive',
        3000,
        'info'
      );
    } catch (err: any) {
      console.error('Delete failed:', err);
      showToast(
        language === 'ar'
          ? 'فشل حذف الملف من Google Drive.'
          : 'Failed to delete backup from Google Drive.',
        4000,
        'error'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (sizeBytes?: string) => {
    if (!sizeBytes) return '—';
    const bytes = parseInt(sizeBytes, 10);
    if (isNaN(bytes)) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 overflow-hidden shadow-xs">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800/80 bg-linear-to-r from-sky-50/60 via-emerald-50/40 to-transparent dark:from-sky-950/20 dark:via-emerald-950/10 dark:to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs flex items-center justify-center shrink-0">
            {/* Google Drive Logo colors */}
            <svg className="w-5 h-5" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">
                {language === 'ar' ? 'النسخ الاحتياطي في Google Drive' : 'Google Drive Cloud Backup'}
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                {language === 'ar' ? 'مجاني للجميع' : 'Free Local Plan'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {language === 'ar'
                ? 'احفظ قوائمك بأمان في حسابك الخاص على Google Drive بإذنك، بدون اشتراك مدفوع.'
                : 'Safely backup and restore your lists to your personal Google Drive with permission, no subscription required.'}
            </p>
          </div>
        </div>

        {/* Connection status tag */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {token ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{user?.email || (language === 'ar' ? 'متصل' : 'Connected')}</span>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title={language === 'ar' ? 'فصل Drive' : 'Disconnect Drive'}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              disabled={isConnecting}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 transition-all flex items-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {isConnecting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              )}
              <span>{language === 'ar' ? 'ربط Google Drive' : 'Connect Google Drive'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Quick Action: Backup Now */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-800">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                {language === 'ar' ? 'بيانات مساحة العمل الحالية' : 'Current Workspace Data'}
              </span>
              <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                ({lists.length} {language === 'ar' ? 'قوائم' : 'lists'} • {groups.length} {language === 'ar' ? 'مجموعات' : 'groups'} • {items.length} {language === 'ar' ? 'عناصر' : 'items'})
              </span>
            </div>
            {lastBackupTime && (
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                {language === 'ar' ? `آخر نسخة احتياطية: ${lastBackupTime}` : `Last backed up: ${lastBackupTime}`}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleBackupNow}
            disabled={isBackingUp || isConnecting}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isBackingUp ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CloudUpload className="w-4 h-4" />
            )}
            <span>
              {isBackingUp
                ? language === 'ar'
                  ? 'جاري الحفظ في Drive...'
                  : 'Backing up to Drive...'
                : language === 'ar'
                ? 'نسخ احتياطي إلى Drive'
                : 'Backup to Google Drive'}
            </span>
          </button>
        </div>

        {/* Available Backups List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {language === 'ar' ? 'النسخ الاحتياطية في Drive' : 'Backups in Google Drive'}
            </span>
            {token && (
              <button
                type="button"
                onClick={() => fetchBackups(token)}
                disabled={isLoadingBackups}
                className="text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 flex items-center gap-1 cursor-pointer transition-colors"
                title={language === 'ar' ? 'تحديث القائمة' : 'Refresh backups'}
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingBackups ? 'animate-spin' : ''}`} />
                <span>{language === 'ar' ? 'تحديث' : 'Refresh'}</span>
              </button>
            )}
          </div>

          {!token ? (
            <div className="text-center py-6 px-4 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500 text-xs">
              <Cloud className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-500" />
              <p>
                {language === 'ar'
                  ? 'اضغط "ربط Google Drive" أو "نسخ احتياطي" لرؤية النسخ السحابية المحفوظة.'
                  : 'Connect Google Drive or tap "Backup to Google Drive" to view your stored cloud backups.'}
              </p>
            </div>
          ) : isLoadingBackups ? (
            <div className="flex items-center justify-center py-8 gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
              <span>{language === 'ar' ? 'جاري البحث عن النسخ الاحتياطية...' : 'Checking Google Drive for backups...'}</span>
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-6 px-4 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500 text-xs">
              <p>
                {language === 'ar'
                  ? 'لم يتم العثور على نسخ احتياطية في Google Drive بعد. اضغط "نسخ احتياطي" لإنشاء أول نسخة.'
                  : 'No backups found in Google Drive yet. Tap "Backup to Google Drive" to create your first one.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80 rounded-xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {formatDate(backup.modifiedTime || backup.createdTime)}
                      </p>
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate">
                        {formatFileSize(backup.size)} • {backup.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setRestoreTarget(backup);
                        setRestoreMode('replace');
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer flex items-center gap-1"
                      title={language === 'ar' ? 'استعادة' : 'Restore'}
                    >
                      <CloudDownload className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'استعادة' : 'Restore'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(backup)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title={language === 'ar' ? 'حذف من Drive' : 'Delete from Drive'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MANDATORY CONFIRMATION MODAL: RESTORE FROM DRIVE */}
      {restoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CloudDownload className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {language === 'ar' ? 'استعادة من Google Drive؟' : 'Restore from Google Drive?'}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {language === 'ar'
                    ? `سيتم استعادة البيانات من النسخة الاحتياطية (${formatDate(
                        restoreTarget.modifiedTime || restoreTarget.createdTime
                      )}). كيف ترغب في تطبيق الاستعادة؟`
                    : `Restore data from backup created on ${formatDate(
                        restoreTarget.modifiedTime || restoreTarget.createdTime
                      )}. How would you like to restore?`}
                </p>
              </div>
            </div>

            {/* Restore Mode Select */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRestoreMode('replace')}
                className={`p-3 rounded-2xl border text-start flex flex-col gap-1 transition-all cursor-pointer ${
                  restoreMode === 'replace'
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">
                    {language === 'ar' ? 'استبدال بالكامل' : 'Replace All'}
                  </span>
                  {restoreMode === 'replace' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <span className="text-[10px] opacity-75">
                  {language === 'ar' ? 'استبدال كل القوائم الحالية' : 'Overwrites current lists'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRestoreMode('merge')}
                className={`p-3 rounded-2xl border text-start flex flex-col gap-1 transition-all cursor-pointer ${
                  restoreMode === 'merge'
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">
                    {language === 'ar' ? 'دمج مع الحالية' : 'Merge with Current'}
                  </span>
                  {restoreMode === 'merge' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <span className="text-[10px] opacity-75">
                  {language === 'ar' ? 'إضافة بدون حذف الحالي' : 'Keeps current lists intact'}
                </span>
              </button>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setRestoreTarget(null)}
                disabled={isRestoring}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={isRestoring}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {isRestoring ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>
                  {isRestoring
                    ? language === 'ar'
                      ? 'جاري الاستعادة...'
                      : 'Restoring...'
                    : language === 'ar'
                    ? 'تأكيد الاستعادة'
                    : 'Confirm Restore'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY CONFIRMATION MODAL: DELETE FROM DRIVE */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {language === 'ar' ? 'حذف من Google Drive؟' : 'Delete from Google Drive?'}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {language === 'ar'
                    ? `هل أنت متأكد من حذف النسخة الاحتياطية (${formatDate(
                        deleteTarget.modifiedTime || deleteTarget.createdTime
                      )}) من Google Drive؟ لا يمكن التراجع عن هذا الإجراء.`
                    : `Are you sure you want to permanently delete backup from ${formatDate(
                        deleteTarget.modifiedTime || deleteTarget.createdTime
                      )}? This cannot be undone.`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {isDeleting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>
                  {isDeleting
                    ? language === 'ar'
                      ? 'جاري الحذف...'
                      : 'Deleting...'
                    : language === 'ar'
                    ? 'حذف نهائياً'
                    : 'Delete'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
