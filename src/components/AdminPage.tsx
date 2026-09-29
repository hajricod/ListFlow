import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
  Crown,
  Bell,
  Settings,
  Sliders,
  FolderKanban,
  Clock,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
  ExternalLink,
  Trash2,
  Copy,
  Check,
  ArrowLeft,
  Eye,
  Filter,
  Sparkles,
  Lock,
  Unlock,
  Radio,
  Send,
  Database,
  Calendar,
  X,
  Plus,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  AdminUserRecord,
  SystemAnnouncement,
  SystemConfig,
  AdminAuditLog,
  UserSubscription,
  AppList,
  Language,
} from '../types';
import {
  PRIMARY_ADMIN_EMAIL,
  isUserAdmin,
  fetchAdminUsers,
  updateUserSubscription,
  updateUserRole,
  updateUserStatus,
  fetchSystemAnnouncement,
  saveSystemAnnouncement,
  fetchSystemConfig,
  saveSystemConfig,
  fetchAdminWorkspaceLists,
  deleteListAsAdmin,
  fetchAuditLogs,
  DEFAULT_SYSTEM_ANNOUNCEMENT,
  DEFAULT_SYSTEM_CONFIG,
} from '../utils/adminService';

interface AdminPageProps {
  language: Language;
  currentUser: User | null;
  onBackToWorkspace: () => void;
  showToast: (message: string, duration?: number, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

type AdminTab = 'users' | 'announcement' | 'config' | 'workspaces' | 'audit';

export const AdminPage: React.FC<AdminPageProps> = ({
  language,
  currentUser,
  onBackToWorkspace,
  showToast,
}) => {
  const isArabic = language === 'ar';
  const adminAuthorized = isUserAdmin(currentUser);

  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Data states
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [announcement, setAnnouncement] = useState<SystemAnnouncement>(DEFAULT_SYSTEM_ANNOUNCEMENT);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);
  const [workspaces, setWorkspaces] = useState<AppList[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  // User management UI states
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admins' | 'pro' | 'free' | 'suspended'>('all');
  const [selectedUserForInspect, setSelectedUserForInspect] = useState<AdminUserRecord | null>(null);
  const [selectedUserForSub, setSelectedUserForSub] = useState<AdminUserRecord | null>(null);
  const [selectedUserForStatus, setSelectedUserForStatus] = useState<AdminUserRecord | null>(null);
  const [statusReason, setStatusReason] = useState<string>('');
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  // Workspace moderation UI states
  const [workspaceSearch, setWorkspaceSearch] = useState<string>('');
  const [listToDelete, setListToDelete] = useState<AppList | null>(null);

  // Saving states
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState<boolean>(false);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  // Load admin dashboard data
  const loadDashboardData = async () => {
    if (!adminAuthorized) {
      setIsLoading(false);
      return;
    }
    setIsRefreshing(true);
    try {
      const [usersData, announceData, configData, listsData, logsData] = await Promise.all([
        fetchAdminUsers(),
        fetchSystemAnnouncement(),
        fetchSystemConfig(),
        fetchAdminWorkspaceLists(),
        fetchAuditLogs(),
      ]);

      setUsers(usersData);
      setAnnouncement(announceData);
      setSystemConfig(configData);
      setWorkspaces(listsData);
      setAuditLogs(logsData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      showToast(isArabic ? 'فشل تحميل بيانات لوحة الإدارة' : 'Failed to load admin console data', 3000, 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  // Copy UID helper
  const handleCopyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    showToast(isArabic ? 'تم نسخ المعرف' : 'UID copied to clipboard', 2000, 'success');
    setTimeout(() => setCopiedUid(null), 2000);
  };

  // User role toggle (promote / demote)
  const handleToggleRole = async (targetUser: AdminUserRecord) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    const confirmMsg = isArabic
      ? `هل أنت متأكد من تغيير صلاحية ${targetUser.email} إلى ${newRole === 'admin' ? 'مدير' : 'مستخدم عادي'}؟`
      : `Are you sure you want to change ${targetUser.email}'s role to ${newRole.toUpperCase()}?`;

    if (!window.confirm(confirmMsg)) return;

    const res = await updateUserRole(
      targetUser.uid,
      targetUser.email,
      newRole,
      currentUser?.email || PRIMARY_ADMIN_EMAIL
    );

    if (res.success) {
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === targetUser.uid
            ? { ...u, role: newRole, isAdmin: newRole === 'admin' }
            : u
        )
      );
      showToast(
        isArabic
          ? `تم تحديث صلاحية ${targetUser.email} بنجاح`
          : `Updated role for ${targetUser.email}`,
        3000,
        'success'
      );
    } else {
      showToast(res.message || 'Operation failed', 3000, 'error');
    }
  };

  // User subscription upgrade / downgrade
  const handleApplySubscription = async (
    targetUser: AdminUserRecord,
    tier: 'pro' | 'free',
    durationMonths?: number
  ) => {
    let expiresAt: string | undefined = undefined;
    if (tier === 'pro' && durationMonths && durationMonths > 0) {
      const exp = new Date();
      exp.setMonth(exp.getMonth() + durationMonths);
      expiresAt = exp.toISOString();
    }

    const newSub: UserSubscription = {
      tier,
      status: tier === 'pro' ? 'active' : 'free',
      cycle: durationMonths === 12 ? 'yearly' : 'monthly',
      expiresAt,
      startedAt: new Date().toISOString(),
      autoRenew: tier === 'pro',
    };

    const success = await updateUserSubscription(
      targetUser.uid,
      newSub,
      currentUser?.email || PRIMARY_ADMIN_EMAIL
    );

    if (success) {
      setUsers((prev) =>
        prev.map((u) => (u.uid === targetUser.uid ? { ...u, subscription: newSub } : u))
      );
      setSelectedUserForSub(null);
      showToast(
        isArabic
          ? `تم تحديث اشتراك ${targetUser.email} إلى ${tier.toUpperCase()}`
          : `Subscription updated for ${targetUser.email} to ${tier.toUpperCase()}`,
        3000,
        'success'
      );
    } else {
      showToast(isArabic ? 'فشل تحديث الاشتراك' : 'Failed to update subscription', 3000, 'error');
    }
  };

  // User status toggle (active / suspended)
  const handleApplyStatus = async () => {
    if (!selectedUserForStatus) return;
    const newStatus = selectedUserForStatus.status === 'suspended' ? 'active' : 'suspended';

    const res = await updateUserStatus(
      selectedUserForStatus.uid,
      selectedUserForStatus.email,
      newStatus,
      statusReason,
      currentUser?.email || PRIMARY_ADMIN_EMAIL
    );

    if (res.success) {
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === selectedUserForStatus.uid
            ? { ...u, status: newStatus, notes: statusReason || u.notes }
            : u
        )
      );
      setSelectedUserForStatus(null);
      setStatusReason('');
      showToast(
        isArabic
          ? `تم ${newStatus === 'active' ? 'تفعيل' : 'تعليق'} الحساب بنجاح`
          : `Account has been ${newStatus}`,
        3000,
        'success'
      );
    } else {
      showToast(res.message || 'Operation failed', 3000, 'error');
    }
  };

  // Save Announcement
  const handleSaveAnnouncement = async () => {
    setIsSavingAnnouncement(true);
    const success = await saveSystemAnnouncement(
      announcement,
      currentUser?.email || PRIMARY_ADMIN_EMAIL
    );
    setIsSavingAnnouncement(false);
    if (success) {
      showToast(
        isArabic
          ? 'تم حفظ ونشر الإعلان العام بنجاح'
          : 'System announcement published successfully',
        3000,
        'success'
      );
    } else {
      showToast(isArabic ? 'فشل حفظ الإعلان' : 'Failed to save announcement', 3000, 'error');
    }
  };

  // Save Config
  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    const success = await saveSystemConfig(
      systemConfig,
      currentUser?.email || PRIMARY_ADMIN_EMAIL
    );
    setIsSavingConfig(false);
    if (success) {
      showToast(
        isArabic ? 'تم حفظ إعدادات النظام بنجاح' : 'System configuration saved',
        3000,
        'success'
      );
    } else {
      showToast(isArabic ? 'فشل حفظ الإعدادات' : 'Failed to save configuration', 3000, 'error');
    }
  };

  // Delete List
  const handleDeleteList = async () => {
    if (!listToDelete) return;
    const success = await deleteListAsAdmin(
      listToDelete.id,
      listToDelete.title,
      currentUser?.email || PRIMARY_ADMIN_EMAIL
    );
    if (success) {
      setWorkspaces((prev) => prev.filter((l) => l.id !== listToDelete.id));
      setListToDelete(null);
      showToast(
        isArabic ? `تم حذف القائمة "${listToDelete.title}"` : `Deleted list "${listToDelete.title}"`,
        3000,
        'success'
      );
    } else {
      showToast(isArabic ? 'فشل حذف القائمة' : 'Failed to delete list', 3000, 'error');
    }
  };

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.displayName && u.displayName.toLowerCase().includes(userSearch.toLowerCase())) ||
        u.uid.toLowerCase().includes(userSearch.toLowerCase());

      if (!matchSearch) return false;

      if (userRoleFilter === 'admins') return u.isAdmin || u.role === 'admin';
      if (userRoleFilter === 'pro') return u.subscription?.tier === 'pro';
      if (userRoleFilter === 'free') return !u.subscription || u.subscription.tier === 'free';
      if (userRoleFilter === 'suspended') return u.status === 'suspended';
      return true;
    });
  }, [users, userSearch, userRoleFilter]);

  // Filtered workspaces calculation
  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter((w) => {
      return (
        w.title.toLowerCase().includes(workspaceSearch.toLowerCase()) ||
        (w.ownerEmail && w.ownerEmail.toLowerCase().includes(workspaceSearch.toLowerCase())) ||
        w.id.toLowerCase().includes(workspaceSearch.toLowerCase())
      );
    });
  }, [workspaces, workspaceSearch]);

  // Platform KPIs
  const totalUsersCount = users.length;
  const proUsersCount = users.filter((u) => u.subscription?.tier === 'pro').length;
  const adminUsersCount = users.filter((u) => u.isAdmin || u.role === 'admin').length;
  const conversionRate = totalUsersCount > 0 ? Math.round((proUsersCount / totalUsersCount) * 100) : 0;

  // Access check guard
  if (!adminAuthorized) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 px-4">
        <div className="p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto ring-8 ring-rose-500/10">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {isArabic ? 'وصول مقيد - مطلوب صلاحية مدير' : 'Access Restricted - Admin Privileges Required'}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
              {isArabic
                ? `هذه الصفحة مخصصة لمديري النظام فقط. الحساب الحالي (${currentUser?.email || 'غير مسجل'}) لا يملك صلاحيات المشرف.`
                : `This console is restricted to platform administrators. The current account (${currentUser?.email || 'Not logged in'}) does not have admin permissions.`}
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={onBackToWorkspace}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{isArabic ? 'العودة لمساحة العمل' : 'Back to Workspace'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-850 to-neutral-900 text-white shadow-xl border border-neutral-800 relative overflow-hidden">
        <div className="absolute top-0 end-0 -mt-12 -me-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onBackToWorkspace}
              title={isArabic ? 'الرجوع لمساحة العمل' : 'Back to Workspace'}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  {isArabic ? 'لوحة تحكم المدير' : 'Admin Console'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {currentUser?.email === PRIMARY_ADMIN_EMAIL ? 'Super Admin' : 'Admin'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-300 mt-0.5">
                {isArabic
                  ? 'إدارة حسابات المستخدمين، الاشتراكات، الإعلانات العامة، وإعدادات النظام'
                  : 'Manage users, pro subscriptions, broadcast announcements, and system policies'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center">
            <button
              type="button"
              onClick={loadDashboardData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isArabic ? 'تحديث البيانات' : 'Refresh Data'}</span>
            </button>
            <button
              type="button"
              onClick={onBackToWorkspace}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-sm"
            >
              <span>{isArabic ? 'مساحة العمل' : 'Workspace'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Users */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {isArabic ? 'إجمالي المستخدمين' : 'Total Registered Users'}
            </p>
            <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mt-1">
              {totalUsersCount}
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {adminUsersCount} {isArabic ? 'مشرفين' : 'Admins'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Pro Subscribers */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {isArabic ? 'مشتركي Pro' : 'Pro Subscribers'}
            </p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {proUsersCount}
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {conversionRate}% {isArabic ? 'نسبة التحويل' : 'Conversion'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5" />
          </div>
        </div>

        {/* Cloud Workspaces */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {isArabic ? 'قوائم السحابة' : 'Cloud Workspaces'}
            </p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {workspaces.length}
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {isArabic ? 'مساحات عمل سحابية' : 'Platform lists'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <FolderKanban className="w-5 h-5" />
          </div>
        </div>

        {/* System Health */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {isArabic ? 'حالة النظام' : 'System Health'}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {systemConfig.maintenanceMode
                  ? (isArabic ? 'وضع الصيانة' : 'Maintenance')
                  : (isArabic ? 'يعمل بسلاسة' : 'Operational')}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {announcement.enabled
                ? (isArabic ? 'إعلان مباشر نشط' : 'Live Banner Active')
                : (isArabic ? 'لا توجد تنبيهات' : 'No Active Banner')}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-1 sm:gap-2 overflow-x-auto custom-scrollbar pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
            activeTab === 'users'
              ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{isArabic ? 'إدارة المستخدمين' : 'User Accounts'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
            {users.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('announcement')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
            activeTab === 'announcement'
              ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>{isArabic ? 'الإعلانات العامة' : 'Broadcast Banner'}</span>
          {announcement.enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
            activeTab === 'config'
              ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{isArabic ? 'إعدادات النظام' : 'System Policies'}</span>
          {systemConfig.maintenanceMode && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-white">
              MAINT
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('workspaces')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
            activeTab === 'workspaces'
              ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>{isArabic ? 'مساحات العمل' : 'Workspaces Moderation'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
            {workspaces.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
            activeTab === 'audit'
              ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{isArabic ? 'سجل العمليات' : 'Audit Trail'}</span>
        </button>
      </div>

      {/* 4. Tab Content */}

      {/* TAB 1: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Controls: Search & Filter Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder={isArabic ? 'بحث بالاسم أو البريد أو المعرف...' : 'Search by name, email, or UID...'}
                className="w-full h-10 ps-9 pe-3 text-xs sm:text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              {userSearch && (
                <button
                  type="button"
                  onClick={() => setUserSearch('')}
                  className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setUserRoleFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  userRoleFilter === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {isArabic ? 'الكل' : 'All'} ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setUserRoleFilter('pro')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  userRoleFilter === 'pro'
                    ? 'bg-amber-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                PRO ({users.filter((u) => u.subscription?.tier === 'pro').length})
              </button>
              <button
                type="button"
                onClick={() => setUserRoleFilter('free')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  userRoleFilter === 'free'
                    ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                FREE ({users.filter((u) => !u.subscription || u.subscription.tier === 'free').length})
              </button>
              <button
                type="button"
                onClick={() => setUserRoleFilter('admins')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  userRoleFilter === 'admins'
                    ? 'bg-purple-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {isArabic ? 'المشرفين' : 'Admins'} ({adminUsersCount})
              </button>
              <button
                type="button"
                onClick={() => setUserRoleFilter('suspended')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  userRoleFilter === 'suspended'
                    ? 'bg-rose-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {isArabic ? 'معلق' : 'Suspended'} ({users.filter((u) => u.status === 'suspended').length})
              </button>
            </div>
          </div>

          {/* Users Table / List */}
          <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs sm:text-sm">
                <thead>
                  <tr className="bg-neutral-50/80 dark:bg-neutral-800/50 border-b border-neutral-200/80 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold">
                    <th className="py-3 px-4 text-start">{isArabic ? 'المستخدم' : 'User'}</th>
                    <th className="py-3 px-4 text-start">{isArabic ? 'الرتبة والصلاحية' : 'Role'}</th>
                    <th className="py-3 px-4 text-start">{isArabic ? 'الاشتراك' : 'Plan'}</th>
                    <th className="py-3 px-4 text-start">{isArabic ? 'الحالة' : 'Status'}</th>
                    <th className="py-3 px-4 text-start">{isArabic ? 'تاريخ التسجيل' : 'Registered'}</th>
                    <th className="py-3 px-4 text-end">{isArabic ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-neutral-400 dark:text-neutral-500">
                        {isArabic ? 'لم يتم العثور على مستخدمين يطابقون البحث' : 'No users found matching search criteria'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isPrimaryAdmin = user.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
                      const isPro = user.subscription?.tier === 'pro';
                      const isSuspended = user.status === 'suspended';

                      return (
                        <tr
                          key={user.uid}
                          className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors"
                        >
                          {/* User info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {user.photoURL ? (
                                <img
                                  src={user.photoURL}
                                  alt={user.displayName}
                                  referrerPolicy="no-referrer"
                                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-neutral-200 dark:ring-neutral-700"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                    {user.displayName || 'No Name'}
                                  </p>
                                  {isPrimaryAdmin && (
                                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                                      OWNER
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                  {user.email}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleCopyUid(user.uid)}
                                  className="inline-flex items-center gap-1 text-[10px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 font-mono mt-0.5"
                                  title="Copy UID"
                                >
                                  <span>UID: {user.uid.substring(0, 8)}...</span>
                                  {copiedUid === user.uid ? (
                                    <Check className="w-2.5 h-2.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-2.5 h-2.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3 px-4">
                            {user.isAdmin || user.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                <Shield className="w-3 h-3" />
                                <span>Admin</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                                <span>User</span>
                              </span>
                            )}
                          </td>

                          {/* Plan */}
                          <td className="py-3 px-4">
                            {isPro ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                  <Crown className="w-3 h-3 text-amber-500" />
                                  <span>PRO</span>
                                </span>
                                {user.subscription?.expiresAt && (
                                  <p className="text-[10px] text-neutral-400">
                                    {isArabic ? 'ينتهي:' : 'Expires:'}{' '}
                                    {new Date(user.subscription.expiresAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                                FREE
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            {isSuspended ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                                <UserX className="w-3 h-3" />
                                <span>{isArabic ? 'معلق' : 'Suspended'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                <UserCheck className="w-3 h-3" />
                                <span>{isArabic ? 'نشط' : 'Active'}</span>
                              </span>
                            )}
                          </td>

                          {/* Registered Date */}
                          <td className="py-3 px-4 text-xs text-neutral-500 dark:text-neutral-400">
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString(
                                  isArabic ? 'ar-EG' : 'en-US',
                                  { month: 'short', day: 'numeric', year: 'numeric' }
                                )
                              : '-'}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-end">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Manage Subscription Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedUserForSub(user)}
                                title={isArabic ? 'تعديل خطة الاشتراك' : 'Manage Subscription'}
                                className="p-1.5 rounded-lg text-neutral-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                              >
                                <Crown className="w-4 h-4" />
                              </button>

                              {/* Toggle Role (Admin/User) */}
                              {!isPrimaryAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleRole(user)}
                                  title={
                                    user.isAdmin
                                      ? isArabic ? 'تجريد من رتبة المدير' : 'Demote from Admin'
                                      : isArabic ? 'ترقية إلى مدير' : 'Promote to Admin'
                                  }
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    user.isAdmin
                                      ? 'text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                                      : 'text-neutral-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                                  }`}
                                >
                                  <Shield className="w-4 h-4" />
                                </button>
                              )}

                              {/* Toggle Account Status */}
                              {!isPrimaryAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedUserForStatus(user);
                                    setStatusReason(user.notes || '');
                                  }}
                                  title={
                                    isSuspended
                                      ? isArabic ? 'إلغاء تعليق الحساب' : 'Unsuspend Account'
                                      : isArabic ? 'تعليق الحساب' : 'Suspend Account'
                                  }
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    isSuspended
                                      ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                      : 'text-neutral-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                  }`}
                                >
                                  {isSuspended ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                </button>
                              )}

                              {/* Inspect details */}
                              <button
                                type="button"
                                onClick={() => setSelectedUserForInspect(user)}
                                title={isArabic ? 'عرض التفاصيل' : 'Inspect User'}
                                className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BROADCAST ANNOUNCEMENT */}
      {activeTab === 'announcement' && (
        <div className="max-w-4xl space-y-6 animate-in fade-in duration-200">
          <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  {isArabic ? 'إعلان المنصة العام' : 'Platform Broadcast Banner'}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {isArabic
                    ? 'نشر رسالة تنبيه أو إعلان يظهر في أعلى الشاشة لجميع المستخدمين في الوقت الفعلي'
                    : 'Broadcast a global banner that appears at the top of the app for all active users'}
                </p>
              </div>

              {/* Active Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcement.enabled}
                  onChange={(e) =>
                    setAnnouncement((prev) => ({ ...prev, enabled: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                <span className="ms-3 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {announcement.enabled
                    ? isArabic ? 'مفعل ومباشر' : 'Live & Active'
                    : isArabic ? 'معطل' : 'Disabled'}
                </span>
              </label>
            </div>

            {/* Live Preview Card */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                {isArabic ? 'معاينة فورية للشريط كما يراه المستخدمون:' : 'Live Banner Preview:'}
              </span>
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  announcement.type === 'info'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100'
                    : announcement.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                    : announcement.type === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                }`}
              >
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        announcement.type === 'info'
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                          : announcement.type === 'success'
                          ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300'
                          : announcement.type === 'warning'
                          ? 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300'
                          : 'bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold">
                        {announcement.title || (isArabic ? 'عنوان الإعلان' : 'Announcement Title')}
                      </h4>
                      <p className="text-xs opacity-90 mt-0.5">
                        {announcement.message ||
                          (isArabic ? 'نص الرسالة التنبيهية...' : 'Announcement message body goes here...')}
                      </p>
                    </div>
                  </div>
                  {announcement.actionLabel && (
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white/80 dark:bg-neutral-800/80 shadow-2xs shrink-0 cursor-pointer">
                      {announcement.actionLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {isArabic ? 'عنوان الإعلان' : 'Announcement Title'}
                </label>
                <input
                  type="text"
                  value={announcement.title}
                  onChange={(e) => setAnnouncement((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={isArabic ? 'مثال: تحديث جديد متوفر أو صيانة مجدولة' : 'e.g. Scheduled Maintenance or New Feature Release'}
                  className="w-full h-10 px-3 text-sm bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {isArabic ? 'نص الرسالة' : 'Announcement Message Body'}
                </label>
                <textarea
                  rows={3}
                  value={announcement.message}
                  onChange={(e) => setAnnouncement((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder={isArabic ? 'اكتب تفاصيل التنبيه هنا...' : 'Provide full details for users...'}
                  className="w-full p-3 text-sm bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* Banner Type Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {isArabic ? 'نوع ونمط التنبيه' : 'Banner Severity Type'}
                </label>
                <select
                  value={announcement.type}
                  onChange={(e) =>
                    setAnnouncement((prev) => ({
                      ...prev,
                      type: e.target.value as SystemAnnouncement['type'],
                    }))
                  }
                  className="w-full h-10 px-3 text-sm bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                >
                  <option value="info">{isArabic ? 'معلومات (أزرق)' : 'Information (Blue)'}</option>
                  <option value="success">{isArabic ? 'نجاح وميزات (أخضر)' : 'Success / Feature (Green)'}</option>
                  <option value="warning">{isArabic ? 'تحذير (برتقالي)' : 'Warning (Amber)'}</option>
                  <option value="alert">{isArabic ? 'عاجل وصيانة (أحمر)' : 'Urgent / Alert (Rose)'}</option>
                </select>
              </div>

              {/* Action Button Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {isArabic ? 'نص زر الإجراء (اختياري)' : 'Action Button Label (Optional)'}
                </label>
                <input
                  type="text"
                  value={announcement.actionLabel || ''}
                  onChange={(e) => setAnnouncement((prev) => ({ ...prev, actionLabel: e.target.value }))}
                  placeholder={isArabic ? 'مثال: اعرف المزيد أو ترقية الآن' : 'e.g. Learn More or Upgrade'}
                  className="w-full h-10 px-3 text-sm bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleSaveAnnouncement}
                disabled={isSavingAnnouncement}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSavingAnnouncement
                    ? (isArabic ? 'جاري الحفظ...' : 'Saving...')
                    : (isArabic ? 'حفظ ونشر التنبيه' : 'Publish Announcement')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM CONFIG & POLICIES */}
      {activeTab === 'config' && (
        <div className="max-w-4xl space-y-6 animate-in fade-in duration-200">
          <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {isArabic ? 'إعدادات وسياسات المنصة' : 'System Configuration & Feature Flags'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {isArabic
                  ? 'التحكم في وضع الصيانة، تسجيل الحسابات الجديدة، وحدود الباقة المجانية'
                  : 'Configure maintenance mode, new user registration policies, and free tier limits'}
              </p>
            </div>

            <div className="space-y-5 divide-y divide-neutral-100 dark:divide-neutral-800">
              {/* Maintenance Mode */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                      {isArabic ? 'وضع الصيانة للمنصة' : 'Maintenance Mode'}
                    </span>
                    {systemConfig.maintenanceMode && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {isArabic
                      ? 'عند تفعيله، يظهر شريط صيانة للمستخدمين العاديين بينما يحتفظ المشرفون بالوصول'
                      : 'When enabled, a maintenance alert is shown to non-admin users while admins retain access'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={systemConfig.maintenanceMode}
                    onChange={(e) =>
                      setSystemConfig((prev) => ({ ...prev, maintenanceMode: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600" />
                </label>
              </div>

              {/* Maintenance Notice Message */}
              {systemConfig.maintenanceMode && (
                <div className="pt-4 space-y-1.5 animate-in fade-in">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {isArabic ? 'رسالة الصيانة المعروضة' : 'Maintenance Banner Message'}
                  </label>
                  <input
                    type="text"
                    value={systemConfig.maintenanceMessage || ''}
                    onChange={(e) =>
                      setSystemConfig((prev) => ({ ...prev, maintenanceMessage: e.target.value }))
                    }
                    className="w-full h-10 px-3 text-sm bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                </div>
              )}

              {/* New User Registrations */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    {isArabic ? 'السماح بتسجيل مستخدمين جدد' : 'Allow New User Registrations'}
                  </span>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {isArabic
                      ? 'تمكين أو تعطيل إمكانية إنشاء حسابات جديدة على المنصة'
                      : 'Toggle whether new user signups via Google or Email are permitted'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={systemConfig.allowNewRegistrations}
                    onChange={(e) =>
                      setSystemConfig((prev) => ({
                        ...prev,
                        allowNewRegistrations: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                </label>
              </div>

              {/* Public Share Links */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    {isArabic ? 'تفعيل روابط مشاركة القوائم العامة' : 'Enable Public Share Links'}
                  </span>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {isArabic
                      ? 'السماح للأعضاء بمشاركة روابط الانضمام المباشرة للقوائم'
                      : 'Allow workspace members to invite collaborators via direct share links'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={systemConfig.enablePublicShareLinks}
                    onChange={(e) =>
                      setSystemConfig((prev) => ({
                        ...prev,
                        enablePublicShareLinks: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                </label>
              </div>

              {/* Free Tier List Limit */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    {isArabic ? 'الحد الأقصى للقوائم بالخطة المجانية' : 'Free Tier Workspace List Limit'}
                  </span>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {isArabic
                      ? 'عدد القوائم المسموح بإنشائها قبل طلب الترقية إلى Pro'
                      : 'Number of active lists allowed for free users before upgrade is suggested'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={systemConfig.freeTierListLimit || 5}
                    onChange={(e) =>
                      setSystemConfig((prev) => ({
                        ...prev,
                        freeTierListLimit: parseInt(e.target.value, 10) || 5,
                      }))
                    }
                    className="w-20 h-10 px-3 text-center text-sm font-bold bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <span className="text-xs text-neutral-500">{isArabic ? 'قوائم' : 'lists'}</span>
                </div>
              </div>
            </div>

            {/* Save Config */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end">
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={isSavingConfig}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>
                  {isSavingConfig
                    ? (isArabic ? 'جاري الحفظ...' : 'Saving...')
                    : (isArabic ? 'حفظ إعدادات النظام' : 'Save Policies')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WORKSPACE MODERATION */}
      {activeTab === 'workspaces' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={workspaceSearch}
                onChange={(e) => setWorkspaceSearch(e.target.value)}
                placeholder={isArabic ? 'بحث بعنوان القائمة أو بريد المالك...' : 'Search by list title or owner email...'}
                className="w-full h-10 ps-9 pe-3 text-xs sm:text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <p className="text-xs text-neutral-500 self-center">
              {isArabic
                ? `${filteredWorkspaces.length} قائمة سحابية موجودة`
                : `${filteredWorkspaces.length} workspace lists in Firestore`}
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs sm:text-sm">
                <thead>
                  <tr className="bg-neutral-50/80 dark:bg-neutral-800/50 border-b border-neutral-200/80 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold">
                    <th className="py-3 px-4 text-start">{isArabic ? 'القائمة' : 'List Title'}</th>
                    <th className="py-3 px-4 text-start">{isArabic ? 'المالك' : 'Owner'}</th>
                    <th className="py-3 px-4 text-start">{isArabic ? 'المتعاونين' : 'Collaborators'}</th>
                    <th className="py-3 px-4 text-start">{isArabic ? 'تاريخ الإنشاء' : 'Created'}</th>
                    <th className="py-3 px-4 text-end">{isArabic ? 'الإجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                  {filteredWorkspaces.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-neutral-400">
                        {isArabic ? 'لم يتم العثور على قوائم' : 'No workspace lists found'}
                      </td>
                    </tr>
                  ) : (
                    filteredWorkspaces.map((list) => {
                      const collabCount = list.collaboratorUids ? list.collaboratorUids.length : 1;
                      return (
                        <tr key={list.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-3.5 h-3.5 rounded-full inline-block shrink-0"
                                style={{ backgroundColor: list.color || '#10b981' }}
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                  {list.title}
                                </p>
                                <p className="text-[10px] text-neutral-400 font-mono">
                                  ID: {list.id}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-neutral-600 dark:text-neutral-300">
                            {list.ownerEmail || (isArabic ? 'مجهول' : 'Unknown')}
                          </td>
                          <td className="py-3 px-4 text-neutral-600 dark:text-neutral-300">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold">
                              <Users className="w-3 h-3" />
                              <span>{collabCount}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-neutral-400 text-xs">
                            {new Date(list.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-end">
                            <button
                              type="button"
                              onClick={() => setListToDelete(list)}
                              title={isArabic ? 'حذف القائمة' : 'Delete List (Admin Moderation)'}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="max-w-4xl space-y-4 animate-in fade-in duration-200">
          <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {isArabic ? 'سجل العمليات الإدارية' : 'Admin Action Audit Trail'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {isArabic
                  ? 'سجل غير قابل للتعديل يوثق جميع التغييرات والترقيات التي قام بها المشرفون'
                  : 'Immutable log of administrative operations performed on the platform'}
              </p>
            </div>

            <div className="space-y-2.5">
              {auditLogs.length === 0 ? (
                <div className="py-12 text-center text-neutral-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>{isArabic ? 'لا توجد سجلات عمليات حتى الآن' : 'No audit operations logged yet'}</p>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-700/60 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                          {log.action}
                        </span>
                        <span className="text-neutral-400">•</span>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {log.target}
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-neutral-600 dark:text-neutral-400">
                          {log.details}
                        </p>
                      )}
                      <p className="text-[10px] text-neutral-400">
                        {isArabic ? 'بواسطة:' : 'By:'} {log.adminEmail}
                      </p>
                    </div>
                    <span className="text-[10px] text-neutral-400 whitespace-nowrap shrink-0">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Manage User Subscription */}
      {selectedUserForSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    {isArabic ? 'إدارة اشتراك المستخدم' : 'Manage Subscription'}
                  </h4>
                  <p className="text-xs text-neutral-500 truncate max-w-[220px]">
                    {selectedUserForSub.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForSub(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleApplySubscription(selectedUserForSub, 'pro', 1)}
                className="w-full p-3 rounded-xl border border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-start flex items-center justify-between transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {isArabic ? 'ترقية إلى Pro (شهر واحد)' : 'Grant 1-Month Pro'}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {isArabic ? 'صالحة لمدة 30 يوماً من اليوم' : 'Active for 30 days'}
                  </p>
                </div>
                <Crown className="w-4 h-4 text-amber-500" />
              </button>

              <button
                type="button"
                onClick={() => handleApplySubscription(selectedUserForSub, 'pro', 12)}
                className="w-full p-3 rounded-xl border border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-start flex items-center justify-between transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {isArabic ? 'ترقية إلى Pro (سنة كاملة)' : 'Grant 1-Year Pro'}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {isArabic ? 'صالحة لمدة 365 يوماً' : 'Active for 1 full year'}
                  </p>
                </div>
                <Crown className="w-4 h-4 text-amber-500" />
              </button>

              <button
                type="button"
                onClick={() => handleApplySubscription(selectedUserForSub, 'pro', 0)}
                className="w-full p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-start flex items-center justify-between transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {isArabic ? 'ترقية إلى Pro مدى الحياة' : 'Grant Lifetime Pro'}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {isArabic ? 'بدون تاريخ انتهاء صلاحية' : 'Never expires'}
                  </p>
                </div>
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </button>

              <button
                type="button"
                onClick={() => handleApplySubscription(selectedUserForSub, 'free')}
                className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-start flex items-center justify-between transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {isArabic ? 'إعادة إلى الباقة المجانية (Free)' : 'Revert to Free Tier'}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {isArabic ? 'إلغاء مزايا ومزامنة Pro السحابية' : 'Cancel cloud pro features'}
                  </p>
                </div>
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Suspend / Unsuspend User */}
      {selectedUserForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  selectedUserForStatus.status === 'suspended'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-rose-50 text-rose-600'
                }`}
              >
                {selectedUserForStatus.status === 'suspended' ? (
                  <Unlock className="w-5 h-5" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {selectedUserForStatus.status === 'suspended'
                    ? isArabic ? 'إلغاء تعليق الحساب' : 'Unsuspend User Account'
                    : isArabic ? 'تعليق حساب المستخدم' : 'Suspend User Account'}
                </h4>
                <p className="text-xs text-neutral-500 truncate max-w-[220px]">
                  {selectedUserForStatus.email}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {isArabic ? 'سبب الإجراء أو ملاحظات الإدارة' : 'Reason / Administrative Notes'}
              </label>
              <textarea
                rows={3}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder={isArabic ? 'اكتب ملاحظة أو سبب التعديل...' : 'e.g. Terms violation, requested hold...'}
                className="w-full p-2.5 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUserForStatus(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleApplyStatus}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors ${
                  selectedUserForStatus.status === 'suspended'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {selectedUserForStatus.status === 'suspended'
                  ? (isArabic ? 'تأكيد التفعيل' : 'Confirm Unsuspend')
                  : (isArabic ? 'تأكيد التعليق' : 'Confirm Suspend')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Inspect User Record */}
      {selectedUserForInspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                {selectedUserForInspect.photoURL ? (
                  <img
                    src={selectedUserForInspect.photoURL}
                    alt={selectedUserForInspect.displayName}
                    className="w-10 h-10 rounded-xl object-cover ring-1 ring-neutral-300"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center">
                    {(selectedUserForInspect.displayName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    {selectedUserForInspect.displayName || 'User Profile'}
                  </h4>
                  <p className="text-xs text-neutral-500">{selectedUserForInspect.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForInspect(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <span className="text-neutral-400 font-medium">{isArabic ? 'المعرف الفريد' : 'UID'}</span>
                <p className="font-mono font-bold text-neutral-800 dark:text-neutral-200 truncate mt-1">
                  {selectedUserForInspect.uid}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <span className="text-neutral-400 font-medium">{isArabic ? 'خطة الاشتراك' : 'Subscription'}</span>
                <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-1 uppercase">
                  {selectedUserForInspect.subscription?.tier || 'FREE'} (
                  {selectedUserForInspect.subscription?.status || 'inactive'})
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <span className="text-neutral-400 font-medium">{isArabic ? 'تاريخ التسجيل' : 'Registered At'}</span>
                <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-1">
                  {selectedUserForInspect.createdAt
                    ? new Date(selectedUserForInspect.createdAt).toLocaleString()
                    : '-'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <span className="text-neutral-400 font-medium">{isArabic ? 'آخر نشاط' : 'Last Active'}</span>
                <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-1">
                  {selectedUserForInspect.lastActiveAt
                    ? new Date(selectedUserForInspect.lastActiveAt).toLocaleString()
                    : '-'}
                </p>
              </div>

              {selectedUserForInspect.notes && (
                <div className="col-span-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                  <span className="text-neutral-400 font-medium">{isArabic ? 'ملاحظات المشرف' : 'Admin Notes'}</span>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200 mt-1">
                    {selectedUserForInspect.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedUserForInspect(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
              >
                {isArabic ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete List Confirmation */}
      {listToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {isArabic ? 'تأكيد حذف القائمة' : 'Delete Workspace List'}
                </h4>
                <p className="text-xs text-neutral-500">
                  {isArabic ? 'إجراء إداري رقابي' : 'Admin moderation action'}
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              {isArabic
                ? `هل أنت متأكد من حذف القائمة "${listToDelete.title}" نهائياً من قاعدة بيانات Firestore؟`
                : `Are you sure you want to permanently delete "${listToDelete.title}" and all its subcollections from Firestore?`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setListToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleDeleteList}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors cursor-pointer"
              >
                {isArabic ? 'حذف القائمة' : 'Delete List'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
