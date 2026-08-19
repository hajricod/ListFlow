import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  orderBy,
  limit,
  Unsubscribe,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import {
  AppList,
  ListGroup,
  ListItem,
  Language,
  Theme,
  ThemeColor,
  ActivityLog,
  ActivityAction,
  ActivityTargetType,
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively removes all undefined values from objects/arrays so Firestore WriteBatch / setDoc doesn't reject them.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (value !== undefined) {
        clean[key] = sanitizeForFirestore(value);
      }
    }
    return clean as unknown as T;
  }
  return data;
}

export interface UserCloudData {
  lists: AppList[];
  groups: ListGroup[];
  items: ListItem[];
  language?: Language;
  theme?: Theme;
  themeColor?: ThemeColor;
  soundEnabled?: boolean;
  activeListId?: string;
}

// 1. Sync User Profile / Preferences
export async function syncUserProfile(
  user: User,
  preferences?: {
    language?: Language;
    theme?: Theme;
    themeColor?: ThemeColor;
    soundEnabled?: boolean;
    activeListId?: string;
  }
): Promise<boolean> {
  const userPath = `users/${user.uid}`;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const existing = await getDoc(userDocRef);

    const payload: Record<string, unknown> = {
      userId: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      lastActiveAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!existing.exists()) {
      payload.createdAt = new Date().toISOString();
    }

    if (preferences) {
      if (preferences.language) payload.language = preferences.language;
      if (preferences.theme) payload.theme = preferences.theme;
      if (preferences.themeColor) payload.themeColor = preferences.themeColor;
      if (preferences.soundEnabled !== undefined) payload.soundEnabled = preferences.soundEnabled;
      if (preferences.activeListId) payload.activeListId = preferences.activeListId;
    }

    await setDoc(userDocRef, sanitizeForFirestore(payload), { merge: true });
    return true;
  } catch (error) {
    console.error('Error syncing user profile to Firestore:', error);
    return false;
  }
}

// 2. Fetch all user data from Firestore
export async function fetchUserCloudData(userId: string): Promise<UserCloudData | null> {
  const userPath = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    const [listsSnap, groupsSnap, itemsSnap] = await Promise.all([
      getDocs(collection(db, 'users', userId, 'lists')),
      getDocs(collection(db, 'users', userId, 'groups')),
      getDocs(collection(db, 'users', userId, 'items')),
    ]);

    const lists: AppList[] = [];
    listsSnap.forEach((d) => {
      lists.push(d.data() as AppList);
    });
    lists.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const groups: ListGroup[] = [];
    groupsSnap.forEach((d) => {
      groups.push(d.data() as ListGroup);
    });
    groups.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const items: ListItem[] = [];
    itemsSnap.forEach((d) => {
      items.push(d.data() as ListItem);
    });
    items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const userData = userDocSnap.data();

    return {
      lists,
      groups,
      items,
      language: userData?.language,
      theme: userData?.theme,
      themeColor: userData?.themeColor,
      soundEnabled: userData?.soundEnabled,
      activeListId: userData?.activeListId,
    };
  } catch (error) {
    console.error('Error fetching user cloud data:', error);
    return null;
  }
}

// 3. Batch Reconcile & Sync user lists, groups, and items in Firestore
export async function syncAllToFirestore(
  userId: string,
  lists: AppList[],
  groups: ListGroup[],
  items: ListItem[]
): Promise<boolean> {
  if (!userId) return false;

  try {
    // 1. Fetch remote IDs to detect deletions
    const [remoteListsSnap, remoteGroupsSnap, remoteItemsSnap] = await Promise.all([
      getDocs(collection(db, 'users', userId, 'lists')),
      getDocs(collection(db, 'users', userId, 'groups')),
      getDocs(collection(db, 'users', userId, 'items')),
    ]);

    const localListIds = new Set(lists.map((l) => l.id));
    const localGroupIds = new Set(groups.map((g) => g.id));
    const localItemIds = new Set(items.map((i) => i.id));

    const batch = writeBatch(db);
    let opCount = 0;
    let deletedCount = 0;
    let upsertCount = 0;

    // Delete removed lists
    remoteListsSnap.forEach((docSnap) => {
      if (!localListIds.has(docSnap.id)) {
        batch.delete(docSnap.ref);
        opCount++;
        deletedCount++;
      }
    });

    // Delete removed groups
    remoteGroupsSnap.forEach((docSnap) => {
      if (!localGroupIds.has(docSnap.id)) {
        batch.delete(docSnap.ref);
        opCount++;
        deletedCount++;
      }
    });

    // Delete removed items
    remoteItemsSnap.forEach((docSnap) => {
      if (!localItemIds.has(docSnap.id)) {
        batch.delete(docSnap.ref);
        opCount++;
        deletedCount++;
      }
    });

    // Upsert current lists with preserved index order
    for (let i = 0; i < lists.length; i++) {
      const list = lists[i];
      const ref = doc(db, 'users', userId, 'lists', list.id);
      batch.set(
        ref,
        sanitizeForFirestore({
          ...list,
          order: list.order !== undefined ? list.order : i,
          userId,
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      );
      opCount++;
      upsertCount++;
    }

    // Upsert current groups with preserved index order
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const ref = doc(db, 'users', userId, 'groups', group.id);
      batch.set(
        ref,
        sanitizeForFirestore({
          ...group,
          order: group.order !== undefined ? group.order : i,
          userId,
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      );
      opCount++;
      upsertCount++;
    }

    // Upsert current items with preserved index order
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const ref = doc(db, 'users', userId, 'items', item.id);
      batch.set(
        ref,
        sanitizeForFirestore({
          ...item,
          order: item.order !== undefined ? item.order : i,
          userId,
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      );
      opCount++;
      upsertCount++;
    }

    if (opCount > 0) {
      await batch.commit();
    }

    return true;
  } catch (error) {
    console.error('Error syncing all collections to Firestore:', error);
    return false;
  }
}

// 4. Real-time Subscription for Multi-Tab / Multi-Device / Multi-Browser Synchronization
export function subscribeToUserCloudData(
  userId: string,
  onUpdate: (data: {
    lists: AppList[];
    groups: ListGroup[];
    items: ListItem[];
    preferences?: Partial<UserCloudData>;
  }) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  let latestLists: AppList[] | null = null;
  let latestGroups: ListGroup[] | null = null;
  let latestItems: ListItem[] | null = null;
  let hasReceivedLists = false;
  let hasReceivedGroups = false;
  let hasReceivedItems = false;
  let latestUserData: Partial<UserCloudData> | null = null;

  const checkAndEmit = () => {
    if (hasReceivedLists && hasReceivedGroups && hasReceivedItems) {
      const sortedLists = [...(latestLists || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const sortedGroups = [...(latestGroups || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const sortedItems = [...(latestItems || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      onUpdate({
        lists: sortedLists,
        groups: sortedGroups,
        items: sortedItems,
        preferences: latestUserData || undefined,
      });
    }
  };

  const unsubUser = onSnapshot(
    doc(db, 'users', userId),
    (docSnap) => {
      if (docSnap.exists()) {
        const u = docSnap.data();
        latestUserData = {
          language: u.language,
          theme: u.theme,
          themeColor: u.themeColor,
          soundEnabled: u.soundEnabled,
          activeListId: u.activeListId,
        };
      }
    },
    (err) => {
      console.warn('User preferences onSnapshot warning:', err);
    }
  );

  const unsubLists = onSnapshot(
    collection(db, 'users', userId, 'lists'),
    (snapshot) => {
      const arr: AppList[] = [];
      snapshot.forEach((d) => arr.push(d.data() as AppList));
      latestLists = arr;
      hasReceivedLists = true;
      checkAndEmit();
    },
    (err) => {
      console.error('Lists onSnapshot error:', err);
      if (onError) onError(err);
    }
  );

  const unsubGroups = onSnapshot(
    collection(db, 'users', userId, 'groups'),
    (snapshot) => {
      const arr: ListGroup[] = [];
      snapshot.forEach((d) => arr.push(d.data() as ListGroup));
      latestGroups = arr;
      hasReceivedGroups = true;
      checkAndEmit();
    },
    (err) => {
      console.error('Groups onSnapshot error:', err);
      if (onError) onError(err);
    }
  );

  const unsubItems = onSnapshot(
    collection(db, 'users', userId, 'items'),
    (snapshot) => {
      const arr: ListItem[] = [];
      snapshot.forEach((d) => arr.push(d.data() as ListItem));
      latestItems = arr;
      hasReceivedItems = true;
      checkAndEmit();
    },
    (err) => {
      console.error('Items onSnapshot error:', err);
      if (onError) onError(err);
    }
  );

  return () => {
    unsubUser();
    unsubLists();
    unsubGroups();
    unsubItems();
  };
}

// 5. Database Change Tracking & Activity Logging
export async function recordActivityLogInFirestore(
  userId: string,
  entry: {
    action: ActivityAction;
    targetType: ActivityTargetType;
    targetId?: string;
    title: string;
    details?: string;
    source?: string;
  }
): Promise<ActivityLog | null> {
  if (!userId) return null;
  const activityId = `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const activityLog: ActivityLog = {
    id: activityId,
    userId,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    title: entry.title,
    details: entry.details,
    source:
      entry.source ||
      (typeof navigator !== 'undefined'
        ? navigator.userAgent.includes('Mobile')
          ? 'Mobile Device'
          : 'Desktop Browser'
        : 'Web Client'),
    timestamp: new Date().toISOString(),
  };

  const path = `users/${userId}/activities/${activityId}`;
  try {
    await setDoc(
      doc(db, 'users', userId, 'activities', activityId),
      sanitizeForFirestore(activityLog)
    );
    return activityLog;
  } catch (error) {
    console.warn('Could not persist activity record to Firestore:', error);
    return activityLog;
  }
}

// 6. Subscribe to Database Activity Logs in Realtime
export function subscribeToActivityLogs(
  userId: string,
  onUpdate: (logs: ActivityLog[]) => void,
  limitCount = 50
): Unsubscribe {
  const activitiesRef = collection(db, 'users', userId, 'activities');
  const q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(limitCount));

  return onSnapshot(
    q,
    (snapshot) => {
      const logs: ActivityLog[] = [];
      snapshot.forEach((docSnap) => {
        logs.push(docSnap.data() as ActivityLog);
      });
      onUpdate(logs);
    },
    (err) => {
      console.warn('Activities onSnapshot subscription error, falling back:', err);
      // Fallback query without orderBy
      const fallbackUnsub = onSnapshot(collection(db, 'users', userId, 'activities'), (snap) => {
        const fallbackLogs: ActivityLog[] = [];
        snap.forEach((d) => fallbackLogs.push(d.data() as ActivityLog));
        fallbackLogs.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        onUpdate(fallbackLogs.slice(0, limitCount));
      });
      return fallbackUnsub;
    }
  );
}

// 7. Fetch Activity Logs
export async function fetchActivityLogsFromFirestore(
  userId: string,
  limitCount = 50
): Promise<ActivityLog[]> {
  if (!userId) return [];
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'activities'));
    const logs: ActivityLog[] = [];
    snap.forEach((d) => logs.push(d.data() as ActivityLog));
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return logs.slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching activity logs from Firestore:', error);
    return [];
  }
}

// 8. Clear Database Activity Logs
export async function clearActivityLogsFromFirestore(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'activities'));
    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error clearing activity logs:', error);
    return false;
  }
}
