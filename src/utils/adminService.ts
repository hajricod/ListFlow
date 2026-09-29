import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import {
  AdminUserRecord,
  SystemAnnouncement,
  SystemConfig,
  AdminAuditLog,
  UserSubscription,
  AppList,
  AppUser,
} from '../types';

export const PRIMARY_ADMIN_EMAIL = 'a.hajri89@gmail.com';

/**
 * Check if the given user has administrator permissions.
 * The primary owner (a.hajri89@gmail.com) is always recognized as Super Admin.
 */
export function isUserAdmin(
  user: User | AppUser | null | undefined,
  profile?: { isAdmin?: boolean; role?: string } | null
): boolean {
  if (!user || !user.email) return false;
  const email = user.email.toLowerCase().trim();
  if (email === PRIMARY_ADMIN_EMAIL.toLowerCase()) return true;
  if (profile?.isAdmin === true) return true;
  if (profile?.role === 'admin') return true;
  return false;
}

/**
 * Log an administrative action to Firestore for auditability
 */
export async function logAdminAudit(
  action: string,
  target?: string,
  details?: string,
  adminEmail?: string
): Promise<void> {
  try {
    const actorEmail = adminEmail || auth.currentUser?.email || PRIMARY_ADMIN_EMAIL;
    const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const logRef = doc(db, 'admin_audit_logs', logId);
    const entry: AdminAuditLog = {
      id: logId,
      action,
      target: target || 'system',
      details: details || '',
      adminEmail: actorEmail,
      timestamp: new Date().toISOString(),
    };
    await setDoc(logRef, entry);
  } catch (err) {
    console.warn('Failed to write admin audit log:', err);
  }
}

/**
 * Fetch all registered users from Firestore
 */
export async function fetchAdminUsers(): Promise<AdminUserRecord[]> {
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    const users: AdminUserRecord[] = [];

    snapshot.forEach((d) => {
      const data = d.data();
      const uid = d.id;
      const email = data.email || '';
      const isPrimary = email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();

      users.push({
        uid,
        email,
        displayName: data.displayName || email.split('@')[0] || 'User',
        photoURL: data.photoURL || undefined,
        isAdmin: isPrimary || data.isAdmin === true || data.role === 'admin',
        role: isPrimary || data.isAdmin === true || data.role === 'admin' ? 'admin' : 'user',
        status: data.status || 'active',
        subscription: data.subscription || {
          tier: 'free',
          status: 'free',
        },
        createdAt: data.createdAt || data.updatedAt || new Date().toISOString(),
        updatedAt: data.updatedAt || undefined,
        lastActiveAt: data.lastActiveAt || data.updatedAt || undefined,
        notes: data.notes || '',
        listsCount: Array.isArray(data.lists) ? data.lists.length : undefined,
      });
    });

    // If current logged-in user is not yet in snapshot, ensure they appear
    const currentUser = auth.currentUser;
    if (currentUser && !users.some((u) => u.uid === currentUser.uid)) {
      const isPrimary = currentUser.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
      users.unshift({
        uid: currentUser.uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Admin',
        photoURL: currentUser.photoURL || undefined,
        isAdmin: isPrimary,
        role: isPrimary ? 'admin' : 'user',
        status: 'active',
        subscription: {
          tier: isPrimary ? 'pro' : 'free',
          status: isPrimary ? 'active' : 'free',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Sort by role (admins first), then by creation date descending
    users.sort((a, b) => {
      if (a.isAdmin && !b.isAdmin) return -1;
      if (!a.isAdmin && b.isAdmin) return 1;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    return users;
  } catch (err) {
    console.error('Error fetching admin users:', err);
    // Graceful fallback with current user info
    const currentUser = auth.currentUser;
    if (currentUser) {
      const isPrimary = currentUser.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
      return [
        {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Admin',
          photoURL: currentUser.photoURL || undefined,
          isAdmin: isPrimary,
          role: isPrimary ? 'admin' : 'user',
          status: 'active',
          subscription: {
            tier: isPrimary ? 'pro' : 'free',
            status: isPrimary ? 'active' : 'free',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }
    return [];
  }
}

/**
 * Grant or change a user's subscription
 */
export async function updateUserSubscription(
  userId: string,
  subscription: UserSubscription,
  adminEmail: string
): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        subscription,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    await logAdminAudit(
      'update_subscription',
      userId,
      `Tier changed to ${subscription.tier.toUpperCase()} (${subscription.status}, expires: ${subscription.expiresAt || 'Never'})`,
      adminEmail
    );
    return true;
  } catch (err) {
    console.error(`Failed to update subscription for ${userId}:`, err);
    return false;
  }
}

/**
 * Promote or demote a user's admin role
 */
export async function updateUserRole(
  userId: string,
  userEmail: string,
  role: 'admin' | 'user',
  adminEmail: string
): Promise<{ success: boolean; message?: string }> {
  if (userEmail.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase() && role === 'user') {
    return { success: false, message: 'Primary administrator cannot be demoted' };
  }

  try {
    const userRef = doc(db, 'users', userId);
    const isAdmin = role === 'admin';
    await setDoc(
      userRef,
      {
        role,
        isAdmin,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    await logAdminAudit(
      'update_role',
      userEmail || userId,
      `Role changed to ${role.toUpperCase()}`,
      adminEmail
    );
    return { success: true };
  } catch (err) {
    console.error(`Failed to update role for ${userId}:`, err);
    return { success: false, message: (err as Error).message };
  }
}

/**
 * Update user account status (active vs suspended)
 */
export async function updateUserStatus(
  userId: string,
  userEmail: string,
  status: 'active' | 'suspended',
  notes: string = '',
  adminEmail: string
): Promise<{ success: boolean; message?: string }> {
  if (userEmail.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase() && status === 'suspended') {
    return { success: false, message: 'Primary administrator cannot be suspended' };
  }

  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        status,
        notes,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    await logAdminAudit(
      'update_status',
      userEmail || userId,
      `Status set to ${status.toUpperCase()}${notes ? `. Notes: ${notes}` : ''}`,
      adminEmail
    );
    return { success: true };
  } catch (err) {
    console.error(`Failed to update status for ${userId}:`, err);
    return { success: false, message: (err as Error).message };
  }
}

export const DEFAULT_SYSTEM_ANNOUNCEMENT: SystemAnnouncement = {
  enabled: false,
  title: 'Welcome to List Flow',
  message: 'Organize your lists, categories, and shopping with real-time cloud sync and collaborative sharing.',
  type: 'info',
  actionLabel: '',
  actionUrl: '',
  dismissible: true,
};

/**
 * Fetch current system announcement
 */
export async function fetchSystemAnnouncement(): Promise<SystemAnnouncement> {
  try {
    const docRef = doc(db, 'system', 'announcement');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_SYSTEM_ANNOUNCEMENT, ...(snap.data() as SystemAnnouncement) };
    }
  } catch (err) {
    console.warn('Error fetching system announcement:', err);
  }
  return DEFAULT_SYSTEM_ANNOUNCEMENT;
}

/**
 * Save and broadcast system announcement
 */
export async function saveSystemAnnouncement(
  announcement: SystemAnnouncement,
  adminEmail: string
): Promise<boolean> {
  try {
    const docRef = doc(db, 'system', 'announcement');
    const payload = {
      ...announcement,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail,
    };
    await setDoc(docRef, payload);

    await logAdminAudit(
      'broadcast_announcement',
      announcement.title,
      `Announcement ${announcement.enabled ? 'published' : 'disabled'} (type: ${announcement.type})`,
      adminEmail
    );
    return true;
  } catch (err) {
    console.error('Error saving system announcement:', err);
    return false;
  }
}

/**
 * Real-time listener for system broadcast announcements
 */
export function subscribeToSystemAnnouncement(
  callback: (announcement: SystemAnnouncement | null) => void
): Unsubscribe {
  const docRef = doc(db, 'system', 'announcement');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SystemAnnouncement;
        callback(data);
      } else {
        callback(null);
      }
    },
    (err) => {
      console.warn('Announcement listener error:', err);
      callback(null);
    }
  );
}

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  maintenanceMode: false,
  maintenanceMessage: 'List Flow is temporarily undergoing scheduled maintenance. Please check back shortly.',
  allowNewRegistrations: true,
  freeTierListLimit: 5,
  enablePublicShareLinks: true,
};

/**
 * Fetch global system configuration
 */
export async function fetchSystemConfig(): Promise<SystemConfig> {
  try {
    const docRef = doc(db, 'system', 'config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_SYSTEM_CONFIG, ...(snap.data() as SystemConfig) };
    }
  } catch (err) {
    console.warn('Error fetching system config:', err);
  }
  return DEFAULT_SYSTEM_CONFIG;
}

/**
 * Save global system configuration
 */
export async function saveSystemConfig(
  config: SystemConfig,
  adminEmail: string
): Promise<boolean> {
  try {
    const docRef = doc(db, 'system', 'config');
    const payload = {
      ...config,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail,
    };
    await setDoc(docRef, payload);

    await logAdminAudit(
      'update_system_config',
      'system_config',
      `Config updated. Maintenance: ${config.maintenanceMode}, Free list limit: ${config.freeTierListLimit}`,
      adminEmail
    );
    return true;
  } catch (err) {
    console.error('Error saving system config:', err);
    return false;
  }
}

/**
 * Subscribe to global system configuration
 */
export function subscribeToSystemConfig(
  callback: (config: SystemConfig) => void
): Unsubscribe {
  const docRef = doc(db, 'system', 'config');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback({ ...DEFAULT_SYSTEM_CONFIG, ...(snap.data() as SystemConfig) });
      } else {
        callback(DEFAULT_SYSTEM_CONFIG);
      }
    },
    (err) => {
      console.warn('Config listener error:', err);
      callback(DEFAULT_SYSTEM_CONFIG);
    }
  );
}

/**
 * Fetch all workspace lists across the platform for moderation
 */
export async function fetchAdminWorkspaceLists(): Promise<AppList[]> {
  try {
    const listsCol = collection(db, 'lists');
    const snapshot = await getDocs(listsCol);
    const lists: AppList[] = [];

    snapshot.forEach((d) => {
      const data = d.data();
      lists.push({
        id: d.id,
        title: data.title || 'Untitled List',
        color: data.color || '#10b981',
        icon: data.icon || 'folder',
        description: data.description || '',
        order: data.order || 0,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || undefined,
        ownerId: data.ownerId || '',
        ownerEmail: data.ownerEmail || '',
        ownerName: data.ownerName || '',
        collaborators: data.collaborators || {},
        collaboratorUids: data.collaboratorUids || [],
        shareLinkEnabled: data.shareLinkEnabled || false,
      });
    });

    lists.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return lists;
  } catch (err) {
    console.error('Error fetching admin workspace lists:', err);
    return [];
  }
}

/**
 * Delete a list by admin for moderation
 */
export async function deleteListAsAdmin(
  listId: string,
  listTitle: string,
  adminEmail: string
): Promise<boolean> {
  try {
    const listRef = doc(db, 'lists', listId);
    await deleteDoc(listRef);

    await logAdminAudit(
      'delete_list',
      listTitle || listId,
      `Workspace list ${listId} deleted by admin`,
      adminEmail
    );
    return true;
  } catch (err) {
    console.error(`Error deleting list ${listId} as admin:`, err);
    return false;
  }
}

/**
 * Fetch audit logs
 */
export async function fetchAuditLogs(): Promise<AdminAuditLog[]> {
  try {
    const logsCol = collection(db, 'admin_audit_logs');
    const q = query(logsCol, orderBy('timestamp', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    const logs: AdminAuditLog[] = [];

    snapshot.forEach((d) => {
      const data = d.data();
      logs.push({
        id: d.id,
        action: data.action || '',
        target: data.target || '',
        details: data.details || '',
        adminEmail: data.adminEmail || '',
        timestamp: data.timestamp || new Date().toISOString(),
      });
    });

    return logs;
  } catch (err) {
    console.warn('Error fetching audit logs:', err);
    return [];
  }
}
