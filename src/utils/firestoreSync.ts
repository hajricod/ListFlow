import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
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

// 1. Sync User Profile / Session
export async function syncUserProfile(user: User, preferences?: {
  language?: Language;
  theme?: Theme;
  themeColor?: ThemeColor;
  soundEnabled?: boolean;
  activeListId?: string;
}) {
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const existing = await getDoc(userDocRef);

    const payload: Record<string, unknown> = {
      userId: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
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
  } catch (error) {
    console.error('Error syncing user profile to Firestore:', error);
  }
}

// 2. Fetch all user data from Firestore
export async function fetchUserCloudData(userId: string): Promise<UserCloudData | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    const listsSnap = await getDocs(collection(db, 'users', userId, 'lists'));
    const groupsSnap = await getDocs(collection(db, 'users', userId, 'groups'));
    const itemsSnap = await getDocs(collection(db, 'users', userId, 'items'));

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

// 3. Batch Save / Overwrite user lists, groups, and items in Firestore
export async function syncAllToFirestore(
  userId: string,
  lists: AppList[],
  groups: ListGroup[],
  items: ListItem[]
) {
  try {
    // Save lists
    for (const list of lists) {
      await setDoc(doc(db, 'users', userId, 'lists', list.id), {
        ...list,
        userId,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    // Save groups
    for (const group of groups) {
      await setDoc(doc(db, 'users', userId, 'groups', group.id), {
        ...group,
        userId,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    // Save items
    for (const item of items) {
      await setDoc(doc(db, 'users', userId, 'items', item.id), {
        ...item,
        userId,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error syncing all collections to Firestore:', error);
  }
}

// 4. Single Document Operations for Instant Reactivity
export async function firestoreSaveList(userId: string, list: AppList) {
  try {
    await setDoc(doc(db, 'users', userId, 'lists', list.id), {
      ...list,
      userId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving list to Firestore:', error);
  }
}

export async function firestoreDeleteList(userId: string, listId: string) {
  try {
    await deleteDoc(doc(db, 'users', userId, 'lists', listId));
  } catch (error) {
    console.error('Error deleting list from Firestore:', error);
  }
}

export async function firestoreSaveGroup(userId: string, group: ListGroup) {
  try {
    await setDoc(doc(db, 'users', userId, 'groups', group.id), {
      ...group,
      userId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving group to Firestore:', error);
  }
}

export async function firestoreDeleteGroup(userId: string, groupId: string) {
  try {
    await deleteDoc(doc(db, 'users', userId, 'groups', groupId));
  } catch (error) {
    console.error('Error deleting group from Firestore:', error);
  }
}

export async function firestoreSaveItem(userId: string, item: ListItem) {
  try {
    await setDoc(doc(db, 'users', userId, 'items', item.id), {
      ...item,
      userId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving item to Firestore:', error);
  }
}

export async function firestoreDeleteItem(userId: string, itemId: string) {
  try {
    await deleteDoc(doc(db, 'users', userId, 'items', itemId));
  } catch (error) {
    console.error('Error deleting item from Firestore:', error);
  }
}
