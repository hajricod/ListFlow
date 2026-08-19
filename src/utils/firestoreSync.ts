import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { AppList, ListGroup, ListItem, Language, Theme, ThemeColor } from '../types';

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

    await setDoc(userDocRef, payload, { merge: true });
    return true;
  } catch (error) {
    console.error('Error syncing user profile to Firestore:', error);
    return false;
  }
}

// 2. Fetch all user data from Firestore
export async function fetchUserCloudData(userId: string): Promise<UserCloudData | null> {
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

    const groups: ListGroup[] = [];
    groupsSnap.forEach((d) => {
      groups.push(d.data() as ListGroup);
    });

    const items: ListItem[] = [];
    itemsSnap.forEach((d) => {
      items.push(d.data() as ListItem);
    });

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
// This guarantees that added, updated, and deleted items are 100% in sync with the cloud.
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

    // Delete removed lists
    remoteListsSnap.forEach((docSnap) => {
      if (!localListIds.has(docSnap.id)) {
        batch.delete(docSnap.ref);
        opCount++;
      }
    });

    // Delete removed groups
    remoteGroupsSnap.forEach((docSnap) => {
      if (!localGroupIds.has(docSnap.id)) {
        batch.delete(docSnap.ref);
        opCount++;
      }
    });

    // Delete removed items
    remoteItemsSnap.forEach((docSnap) => {
      if (!localItemIds.has(docSnap.id)) {
        batch.delete(docSnap.ref);
        opCount++;
      }
    });

    // Upsert current lists
    for (const list of lists) {
      const ref = doc(db, 'users', userId, 'lists', list.id);
      batch.set(
        ref,
        {
          ...list,
          userId,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      opCount++;
    }

    // Upsert current groups
    for (const group of groups) {
      const ref = doc(db, 'users', userId, 'groups', group.id);
      batch.set(
        ref,
        {
          ...group,
          userId,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      opCount++;
    }

    // Upsert current items
    for (const item of items) {
      const ref = doc(db, 'users', userId, 'items', item.id);
      batch.set(
        ref,
        {
          ...item,
          userId,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      opCount++;
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

// 4. Real-time Subscription for Multi-Tab / Multi-Device Synchronization
export function subscribeToUserCloudData(
  userId: string,
  onUpdate: (data: { lists: AppList[]; groups: ListGroup[]; items: ListItem[] }) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  let latestLists: AppList[] | null = null;
  let latestGroups: ListGroup[] | null = null;
  let latestItems: ListItem[] | null = null;

  const checkAndEmit = () => {
    if (latestLists !== null && latestGroups !== null && latestItems !== null) {
      onUpdate({
        lists: latestLists,
        groups: latestGroups,
        items: latestItems,
      });
    }
  };

  const unsubLists = onSnapshot(
    collection(db, 'users', userId, 'lists'),
    (snapshot) => {
      const arr: AppList[] = [];
      snapshot.forEach((d) => arr.push(d.data() as AppList));
      latestLists = arr;
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
      checkAndEmit();
    },
    (err) => {
      console.error('Items onSnapshot error:', err);
      if (onError) onError(err);
    }
  );

  return () => {
    unsubLists();
    unsubGroups();
    unsubItems();
  };
}

// 5. Granular Document Operations for Instant Reactivity
export async function firestoreSaveList(userId: string, list: AppList): Promise<boolean> {
  try {
    await setDoc(
      doc(db, 'users', userId, 'lists', list.id),
      {
        ...list,
        userId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error('Error saving list to Firestore:', error);
    return false;
  }
}

export async function firestoreDeleteList(userId: string, listId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'users', userId, 'lists', listId));
    return true;
  } catch (error) {
    console.error('Error deleting list from Firestore:', error);
    return false;
  }
}

export async function firestoreSaveGroup(userId: string, group: ListGroup): Promise<boolean> {
  try {
    await setDoc(
      doc(db, 'users', userId, 'groups', group.id),
      {
        ...group,
        userId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error('Error saving group to Firestore:', error);
    return false;
  }
}

export async function firestoreDeleteGroup(userId: string, groupId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'users', userId, 'groups', groupId));
    return true;
  } catch (error) {
    console.error('Error deleting group from Firestore:', error);
    return false;
  }
}

export async function firestoreSaveItem(userId: string, item: ListItem): Promise<boolean> {
  try {
    await setDoc(
      doc(db, 'users', userId, 'items', item.id),
      {
        ...item,
        userId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error('Error saving item to Firestore:', error);
    return false;
  }
}

export async function firestoreDeleteItem(userId: string, itemId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'users', userId, 'items', itemId));
    return true;
  } catch (error) {
    console.error('Error deleting item from Firestore:', error);
    return false;
  }
}

