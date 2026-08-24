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
  where,
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
  ShareRole,
  ShareMember,
  PendingInvitation,
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
  pendingInvitations?: PendingInvitation[];
  language?: Language;
  theme?: Theme;
  themeColor?: ThemeColor;
  soundEnabled?: boolean;
  activeListId?: string;
}

// 1. Sync User Profile / Preferences
export async function syncUserProfile(
  userOrUid: User | string,
  preferences?: {
    language?: Language;
    theme?: Theme;
    themeColor?: ThemeColor;
    soundEnabled?: boolean;
    activeListId?: string;
  }
): Promise<boolean> {
  const uid = typeof userOrUid === 'string' ? userOrUid : userOrUid?.uid || auth.currentUser?.uid;
  if (!uid) return false;

  const email = (typeof userOrUid === 'object' && userOrUid !== null ? userOrUid.email : auth.currentUser?.email) || '';
  const displayName = (typeof userOrUid === 'object' && userOrUid !== null ? userOrUid.displayName : auth.currentUser?.displayName) || '';
  const photoURL = (typeof userOrUid === 'object' && userOrUid !== null ? userOrUid.photoURL : auth.currentUser?.photoURL) || '';

  try {
    const userDocRef = doc(db, 'users', uid);
    const existing = await getDoc(userDocRef);

    const payload: Record<string, unknown> = {
      userId: uid,
      email,
      displayName,
      photoURL,
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

// 2. Sync all user lists, groups, and items in Firestore
export async function syncAllToFirestore(
  userIdOrUser: string | User,
  listsOrEmail: AppList[] | string,
  groupsOrName?: ListGroup[] | string,
  itemsOrPhoto?: ListItem[] | string,
  maybeLists?: AppList[],
  maybeGroups?: ListGroup[],
  maybeItems?: ListItem[]
): Promise<boolean> {
  let userId = '';
  let userEmail = '';
  let userName = '';
  let userPhoto = '';
  let lists: AppList[] = [];
  let groups: ListGroup[] = [];
  let items: ListItem[] = [];

  if (typeof userIdOrUser === 'object' && userIdOrUser !== null) {
    userId = userIdOrUser.uid;
    userEmail = userIdOrUser.email || '';
    userName = userIdOrUser.displayName || '';
    userPhoto = userIdOrUser.photoURL || '';
    lists = (listsOrEmail as AppList[]) || [];
    groups = (groupsOrName as ListGroup[]) || [];
    items = (itemsOrPhoto as ListItem[]) || [];
  } else if (Array.isArray(listsOrEmail)) {
    userId = String(userIdOrUser);
    userEmail = auth.currentUser?.email || '';
    userName = auth.currentUser?.displayName || '';
    userPhoto = auth.currentUser?.photoURL || '';
    lists = listsOrEmail;
    groups = (groupsOrName as ListGroup[]) || [];
    items = (itemsOrPhoto as ListItem[]) || [];
  } else {
    userId = String(userIdOrUser);
    userEmail = String(listsOrEmail || '');
    userName = String(groupsOrName || '');
    userPhoto = String(itemsOrPhoto || '');
    lists = maybeLists || [];
    groups = maybeGroups || [];
    items = maybeItems || [];
  }

  if (!userId) return false;

  try {
    const batch = writeBatch(db);
    let opCount = 0;

    // Upsert lists in /lists/{listId} (and /users/{userId}/lists/{listId})
    for (let i = 0; i < lists.length; i++) {
      const list = lists[i];
      const isOwner = !list.ownerId || list.ownerId === userId || list.ownerId === 'local-user';
      
      const ownerId = (list.ownerId && list.ownerId !== 'local-user') ? list.ownerId : userId;
      const ownerEmail = list.ownerEmail || userEmail;
      const ownerName = list.ownerName || userName || 'User';

      const collaboratorUids = Array.from(
        new Set([...(list.collaboratorUids || []), ownerId, userId])
      );

      const existingCollaborators = list.collaborators || {};
      if (!existingCollaborators[ownerId]) {
        existingCollaborators[ownerId] = {
          uid: ownerId,
          email: ownerEmail,
          displayName: ownerName,
          photoURL: userPhoto || '',
          role: 'owner',
          status: 'active',
          invitedAt: list.createdAt || new Date().toISOString(),
          joinedAt: list.createdAt || new Date().toISOString(),
        };
      }

      const listPayload: AppList = {
        ...list,
        ownerId,
        ownerEmail,
        ownerName,
        order: list.order !== undefined ? list.order : i,
        collaboratorUids,
        collaborators: existingCollaborators,
        invitedEmails: list.invitedEmails || [],
        shareLinkEnabled: list.shareLinkEnabled ?? false,
        shareLinkRole: list.shareLinkRole ?? 'edit',
        shareLinkToken: list.shareLinkToken || `tok_${Math.random().toString(36).substring(2, 10)}`,
        updatedAt: new Date().toISOString(),
      };

      // Only owner or authorized collaborator writes to /lists/{listId}
      const listRef = doc(db, 'lists', list.id);
      batch.set(listRef, sanitizeForFirestore(listPayload), { merge: true });
      opCount++;

      // Also mirror to private /users/{userId}/lists for backup
      if (isOwner) {
        const userListRef = doc(db, 'users', userId, 'lists', list.id);
        batch.set(userListRef, sanitizeForFirestore(listPayload), { merge: true });
        opCount++;
      }
    }

    // Upsert groups
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const targetList = lists.find((l) => l.id === group.listId) || lists[0];
      const listId = group.listId || targetList?.id || 'list-groceries';
      const groupRef = doc(db, 'lists', listId, 'groups', group.id);
      batch.set(
        groupRef,
        sanitizeForFirestore({
          ...group,
          listId,
          order: group.order !== undefined ? group.order : i,
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      );
      opCount++;
    }

    // Upsert items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const parentGroup = groups.find((g) => g.id === item.groupId);
      const itemExplicitListId = (item as unknown as { listId?: string }).listId;
      const targetList = lists.find((l) => l.id === itemExplicitListId || l.id === parentGroup?.listId) || lists[0];
      const listId = itemExplicitListId || parentGroup?.listId || targetList?.id || 'list-groceries';
      const itemRef = doc(db, 'lists', listId, 'items', item.id);
      batch.set(
        itemRef,
        sanitizeForFirestore({
          ...item,
          listId,
          order: item.order !== undefined ? item.order : i,
          updatedAt: new Date().toISOString(),
        }),
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

// 3. Real-time Subscription for Multi-User & Shared Lists Synchronization
export function subscribeToUserCloudData(
  userOrUid: User | string,
  onUpdate: (data: {
    lists: AppList[];
    groups: ListGroup[];
    items: ListItem[];
    pendingInvitations?: PendingInvitation[];
    preferences?: Partial<UserCloudData>;
  }) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  let userId = '';
  let userEmail = '';

  if (typeof userOrUid === 'string') {
    userId = userOrUid;
    userEmail = (auth.currentUser?.email || '').toLowerCase().trim();
  } else if (userOrUid && typeof userOrUid === 'object') {
    userId = userOrUid.uid || '';
    userEmail = (userOrUid.email || auth.currentUser?.email || '').toLowerCase().trim();
  }

  if (!userId) {
    console.warn('subscribeToUserCloudData called without valid userId');
    return () => {};
  }

  let memberLists: AppList[] = [];
  let invitedLists: AppList[] = [];
  let activeGroupsMap: Map<string, ListGroup> = new Map();
  let activeItemsMap: Map<string, ListItem> = new Map();
  let groupSubUnsubs: Map<string, Unsubscribe> = new Map();
  let itemSubUnsubs: Map<string, Unsubscribe> = new Map();
  let latestUserData: Partial<UserCloudData> | null = null;

  const emitCombinedData = () => {
    // Combine member lists
    const combinedListsMap = new Map<string, AppList>();
    memberLists.forEach((l) => {
      // Look up current user's role in this list
      let roleFound: ShareRole | undefined = l.collaborators?.[userId]?.role;
      if (!roleFound && userEmail) {
        const emailKey = userEmail.replace(/[\.\#\$\[\]]/g, '_');
        if (l.collaborators?.[emailKey]?.role) {
          roleFound = l.collaborators[emailKey].role;
        } else {
          const match = Object.values(l.collaborators || {}).find(
            (m) =>
              (m.uid && m.uid === userId) ||
              (m.email && m.email.toLowerCase() === userEmail)
          );
          if (match?.role) roleFound = match.role;
        }
      }

      const myRole: ShareRole =
        l.ownerId === userId
          ? 'owner'
          : (roleFound || l.shareLinkRole || (l.collaboratorUids?.includes(userId) ? 'edit' : 'read'));
      const isShared =
        (l.collaboratorUids && l.collaboratorUids.length > 1) ||
        (l.invitedEmails && l.invitedEmails.length > 0) ||
        l.ownerId !== userId;

      combinedListsMap.set(l.id, {
        ...l,
        myRole,
        isShared,
      });
    });

    const sortedLists = Array.from(combinedListsMap.values()).sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );

    // Extract pending invitations for current user
    const pendingInvites: PendingInvitation[] = [];
    invitedLists.forEach((l) => {
      if (!combinedListsMap.has(l.id)) {
        const inviteInfo = Object.values(l.collaborators || {}).find(
          (m) => m.email.toLowerCase() === userEmail && m.status === 'pending'
        );
        pendingInvites.push({
          listId: l.id,
          listTitle: l.title,
          listColor: l.color,
          listIcon: l.icon,
          ownerEmail: l.ownerEmail || '',
          ownerName: l.ownerName || '',
          role: inviteInfo?.role || 'edit',
          invitedAt: inviteInfo?.invitedAt || l.createdAt,
          inviteToken: inviteInfo?.inviteToken,
        });
      }
    });

    const sortedGroups = Array.from(activeGroupsMap.values()).sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
    const sortedItems = Array.from(activeItemsMap.values()).sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );

    onUpdate({
      lists: sortedLists,
      groups: sortedGroups,
      items: sortedItems,
      pendingInvitations: pendingInvites,
      preferences: latestUserData || undefined,
    });
  };

  const updateSubcollectionsListeners = (listsList: AppList[]) => {
    const activeListIds = new Set(listsList.map((l) => l.id));

    // Cleanup unsubscribed lists
    for (const [listId, unsub] of groupSubUnsubs.entries()) {
      if (!activeListIds.has(listId)) {
        unsub();
        groupSubUnsubs.delete(listId);
        // delete groups for this list
        for (const [gid, g] of activeGroupsMap.entries()) {
          if (g.listId === listId) activeGroupsMap.delete(gid);
        }
      }
    }

    for (const [listId, unsub] of itemSubUnsubs.entries()) {
      if (!activeListIds.has(listId)) {
        unsub();
        itemSubUnsubs.delete(listId);
        // delete items for this list
        for (const [iid, item] of activeItemsMap.entries()) {
          const itm = item as unknown as { listId?: string };
          if (itm.listId === listId) activeItemsMap.delete(iid);
        }
      }
    }

    // Attach listeners for new lists
    listsList.forEach((list) => {
      if (!groupSubUnsubs.has(list.id)) {
        const unsubG = onSnapshot(
          collection(db, 'lists', list.id, 'groups'),
          (snap) => {
            snap.forEach((docSnap) => {
              activeGroupsMap.set(docSnap.id, docSnap.data() as ListGroup);
            });
            snap.docChanges().forEach((change) => {
              if (change.type === 'removed') {
                activeGroupsMap.delete(change.doc.id);
              }
            });
            emitCombinedData();
          },
          (err) => {
            console.warn(`Groups listener error for list ${list.id}:`, err);
          }
        );
        groupSubUnsubs.set(list.id, unsubG);
      }

      if (!itemSubUnsubs.has(list.id)) {
        const unsubI = onSnapshot(
          collection(db, 'lists', list.id, 'items'),
          (snap) => {
            snap.forEach((docSnap) => {
              activeItemsMap.set(docSnap.id, docSnap.data() as ListItem);
            });
            snap.docChanges().forEach((change) => {
              if (change.type === 'removed') {
                activeItemsMap.delete(change.doc.id);
              }
            });
            emitCombinedData();
          },
          (err) => {
            console.warn(`Items listener error for list ${list.id}:`, err);
          }
        );
        itemSubUnsubs.set(list.id, unsubI);
      }
    });
  };

  // 1. Listen to user document
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
        emitCombinedData();
      }
    },
    (err) => {
      console.warn('User preferences onSnapshot warning:', err);
    }
  );

  // 2. Query lists where user is owner or collaborator
  const qMembers = query(
    collection(db, 'lists'),
    where('collaboratorUids', 'array-contains', userId)
  );

  const unsubMemberLists = onSnapshot(
    qMembers,
    (snapshot) => {
      const arr: AppList[] = [];
      snapshot.forEach((d) => arr.push(d.data() as AppList));
      memberLists = arr;
      updateSubcollectionsListeners(memberLists);
      emitCombinedData();
    },
    (err) => {
      console.error('Member lists query onSnapshot error:', err);
      if (onError) onError(err);
    }
  );

  // 3. Query lists where user's email is invited
  let unsubInvitedLists: Unsubscribe = () => {};
  if (userEmail) {
    const qInvited = query(
      collection(db, 'lists'),
      where('invitedEmails', 'array-contains', userEmail)
    );
    unsubInvitedLists = onSnapshot(
      qInvited,
      (snapshot) => {
        const arr: AppList[] = [];
        snapshot.forEach((d) => arr.push(d.data() as AppList));
        invitedLists = arr;
        emitCombinedData();
      },
      (err) => {
        console.warn('Invited lists query error:', err);
      }
    );
  }

  return () => {
    unsubUser();
    unsubMemberLists();
    unsubInvitedLists();
    groupSubUnsubs.forEach((unsub) => unsub());
    itemSubUnsubs.forEach((unsub) => unsub());
  };
}

// 4. Invite a User to a List (by Email)
export async function inviteUserToList(
  listId: string,
  currentUser: User | { uid: string; email?: string | null; displayName?: string | null },
  targetEmail: string,
  role: 'read' | 'edit'
): Promise<{ success: boolean; inviteToken: string; message?: string }> {
  const emailNorm = targetEmail.trim().toLowerCase();
  if (!emailNorm || !emailNorm.includes('@')) {
    return { success: false, inviteToken: '', message: 'Invalid email address' };
  }

  const currentUid = currentUser?.uid || auth.currentUser?.uid;
  if (!currentUid) {
    return { success: false, inviteToken: '', message: 'User is not authenticated' };
  }

  try {
    const listRef = doc(db, 'lists', listId);
    let listSnap = await getDoc(listRef);

    if (!listSnap.exists()) {
      // Create it with owner info if not synced yet
      const initialPayload: Record<string, unknown> = {
        id: listId,
        ownerId: currentUid,
        ownerEmail: currentUser.email || auth.currentUser?.email || '',
        ownerName: currentUser.displayName || auth.currentUser?.displayName || 'User',
        collaboratorUids: [currentUid],
        collaborators: {
          [currentUid]: {
            uid: currentUid,
            email: currentUser.email || auth.currentUser?.email || '',
            displayName: currentUser.displayName || auth.currentUser?.displayName || 'User',
            role: 'owner',
            status: 'active',
            invitedAt: new Date().toISOString(),
            joinedAt: new Date().toISOString(),
          },
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(listRef, sanitizeForFirestore(initialPayload), { merge: true });
      listSnap = await getDoc(listRef);
    }

    const listData = listSnap.data() as AppList;
    const inviteToken = `inv_${Math.random().toString(36).substring(2, 12)}`;

    const collaborators = { ...(listData.collaborators || {}) };
    const invitedEmails = new Set(listData.invitedEmails || []);
    invitedEmails.add(emailNorm);

    // Save pending invite record keyed by clean email
    const emailKey = emailNorm.replace(/[\.\#\$\[\]]/g, '_');
    collaborators[emailKey] = {
      email: emailNorm,
      role,
      status: 'pending',
      invitedAt: new Date().toISOString(),
      inviteToken,
    };

    await setDoc(
      listRef,
      sanitizeForFirestore({
        ownerId: listData.ownerId || currentUid,
        collaborators,
        invitedEmails: Array.from(invitedEmails),
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );

    return { success: true, inviteToken };
  } catch (error) {
    console.error('Error inviting user to list:', error);
    return { success: false, inviteToken: '', message: String(error) };
  }
}

// 5. Update Collaborator Role (Owner only)
export async function updateCollaboratorRole(
  listId: string,
  targetKey: string,
  newRole: 'read' | 'edit'
): Promise<boolean> {
  try {
    const listRef = doc(db, 'lists', listId);
    const listSnap = await getDoc(listRef);
    if (!listSnap.exists()) return false;

    const listData = listSnap.data() as AppList;
    const collaborators = { ...(listData.collaborators || {}) };

    // Search for collaborator by direct key, uid, or email
    let matchedKey = targetKey;
    if (!collaborators[matchedKey]) {
      const foundKey = Object.keys(collaborators).find(
        (k) =>
          k === targetKey ||
          collaborators[k]?.uid === targetKey ||
          collaborators[k]?.email?.toLowerCase() === targetKey.toLowerCase()
      );
      if (foundKey) matchedKey = foundKey;
    }

    if (collaborators[matchedKey]) {
      collaborators[matchedKey] = {
        ...collaborators[matchedKey],
        role: newRole,
      };

      await setDoc(
        listRef,
        sanitizeForFirestore({
          ownerId: listData.ownerId,
          collaborators,
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      );
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating collaborator role:', error);
    return false;
  }
}

// 6. Remove Collaborator from List (Owner only)
export async function removeCollaboratorFromList(
  listId: string,
  targetKey: string,
  targetEmail?: string,
  targetUid?: string
): Promise<boolean> {
  try {
    const listRef = doc(db, 'lists', listId);
    const listSnap = await getDoc(listRef);
    if (!listSnap.exists()) return false;

    const listData = listSnap.data() as AppList;
    const collaborators = { ...(listData.collaborators || {}) };

    // Find and delete matching entries
    delete collaborators[targetKey];
    if (targetUid && collaborators[targetUid]) {
      delete collaborators[targetUid];
    }
    if (targetEmail) {
      const emailKey = targetEmail.toLowerCase().replace(/[\.\#\$\[\]]/g, '_');
      delete collaborators[emailKey];
    }
    Object.keys(collaborators).forEach((k) => {
      const m = collaborators[k];
      if (
        (targetUid && m.uid === targetUid) ||
        (targetEmail && m.email?.toLowerCase() === targetEmail.toLowerCase())
      ) {
        delete collaborators[k];
      }
    });

    const collaboratorUids = (listData.collaboratorUids || []).filter(
      (uid) => uid !== targetUid && uid !== targetKey
    );
    const invitedEmails = (listData.invitedEmails || []).filter(
      (em) => em.toLowerCase() !== targetEmail?.toLowerCase()
    );

    await setDoc(
      listRef,
      sanitizeForFirestore({
        ownerId: listData.ownerId,
        collaborators,
        collaboratorUids,
        invitedEmails,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error('Error removing collaborator from list:', error);
    return false;
  }
}

// 7. Leave a Shared List (Collaborator action)
export async function leaveSharedList(
  listId: string,
  currentUser: User | { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null }
): Promise<boolean> {
  if (!currentUser?.uid) return false;
  try {
    const listRef = doc(db, 'lists', listId);
    const listSnap = await getDoc(listRef);
    if (!listSnap.exists()) return false;

    const listData = listSnap.data() as AppList;
    const userEmailNorm = (currentUser.email || auth.currentUser?.email || '').toLowerCase();
    const emailKey = userEmailNorm ? userEmailNorm.replace(/[\.\#\$\[\]]/g, '_') : '';

    const collaborators = { ...(listData.collaborators || {}) };
    delete collaborators[currentUser.uid];
    if (emailKey) {
      delete collaborators[emailKey];
    }

    const collaboratorUids = (listData.collaboratorUids || []).filter(
      (uid) => uid !== currentUser.uid
    );
    const invitedEmails = (listData.invitedEmails || []).filter(
      (em) => userEmailNorm && em.toLowerCase() !== userEmailNorm
    );

    await setDoc(
      listRef,
      sanitizeForFirestore({
        collaborators,
        collaboratorUids,
        invitedEmails,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error('Error leaving shared list:', error);
    return false;
  }
}

// 8. Accept a Pending List Invitation
export async function acceptPendingInvitation(
  listId: string,
  currentUser: User | { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null }
): Promise<boolean> {
  if (!currentUser?.uid) return false;
  try {
    const listRef = doc(db, 'lists', listId);
    const listSnap = await getDoc(listRef);
    if (!listSnap.exists()) return false;

    const listData = listSnap.data() as AppList;
    const userEmailNorm = (currentUser.email || auth.currentUser?.email || '').toLowerCase();
    const emailKey = userEmailNorm ? userEmailNorm.replace(/[\.\#\$\[\]]/g, '_') : '';

    const collaborators = { ...(listData.collaborators || {}) };
    let pendingInvite = emailKey ? collaborators[emailKey] : undefined;
    if (!pendingInvite) {
      const matchKey = Object.keys(collaborators).find(
        (k) =>
          collaborators[k]?.email?.toLowerCase() === userEmailNorm ||
          collaborators[k]?.uid === currentUser.uid
      );
      if (matchKey) {
        pendingInvite = collaborators[matchKey];
        delete collaborators[matchKey];
      }
    }
    const role: ShareRole = pendingInvite?.role || 'edit';

    // Remove pending key and set active key under currentUser.uid
    if (emailKey) {
      delete collaborators[emailKey];
    }
    collaborators[currentUser.uid] = {
      uid: currentUser.uid,
      email: userEmailNorm,
      displayName: currentUser.displayName || auth.currentUser?.displayName || '',
      photoURL: currentUser.photoURL || auth.currentUser?.photoURL || '',
      role,
      status: 'active',
      invitedAt: pendingInvite?.invitedAt || new Date().toISOString(),
      joinedAt: new Date().toISOString(),
    };

    const collaboratorUids = Array.from(
      new Set([...(listData.collaboratorUids || []), currentUser.uid])
    );
    const invitedEmails = (listData.invitedEmails || []).filter(
      (em) => userEmailNorm && em.toLowerCase() !== userEmailNorm
    );

    await setDoc(
      listRef,
      sanitizeForFirestore({
        ownerId: listData.ownerId,
        collaborators,
        collaboratorUids,
        invitedEmails,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error('Error accepting list invitation:', error);
    return false;
  }
}

// 9. Decline a Pending List Invitation
export async function declinePendingInvitation(
  listId: string,
  currentUserEmail: string
): Promise<boolean> {
  try {
    const listRef = doc(db, 'lists', listId);
    const listSnap = await getDoc(listRef);
    if (!listSnap.exists()) return false;

    const listData = listSnap.data() as AppList;
    const userEmailNorm = currentUserEmail.toLowerCase();
    const emailKey = userEmailNorm.replace(/[\.\#\$\[\]]/g, '_');

    const collaborators = { ...(listData.collaborators || {}) };
    delete collaborators[emailKey];

    const invitedEmails = (listData.invitedEmails || []).filter(
      (em) => em.toLowerCase() !== userEmailNorm
    );

    await setDoc(
      listRef,
      sanitizeForFirestore({
        collaborators,
        invitedEmails,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error('Error declining list invitation:', error);
    return false;
  }
}

// 10. Update Link Sharing Settings (Owner only)
export async function updateListShareLinkSettings(
  listId: string,
  enabled: boolean,
  role: 'read' | 'edit' = 'edit',
  currentUser?: User | { uid: string; email?: string | null; displayName?: string | null }
): Promise<string | null> {
  const currentUid = currentUser?.uid || auth.currentUser?.uid;
  try {
    const listRef = doc(db, 'lists', listId);
    let listSnap = await getDoc(listRef);

    if (!listSnap.exists()) {
      if (!currentUid) return null;
      const token = `tok_${Math.random().toString(36).substring(2, 10)}`;
      const initialPayload: Record<string, unknown> = {
        id: listId,
        ownerId: currentUid,
        ownerEmail: currentUser?.email || auth.currentUser?.email || '',
        ownerName: currentUser?.displayName || auth.currentUser?.displayName || 'User',
        collaboratorUids: [currentUid],
        shareLinkEnabled: enabled,
        shareLinkRole: role,
        shareLinkToken: token,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(listRef, sanitizeForFirestore(initialPayload), { merge: true });
      return token;
    }

    const listData = listSnap.data() as AppList;
    const token = listData.shareLinkToken || `tok_${Math.random().toString(36).substring(2, 10)}`;

    await setDoc(
      listRef,
      sanitizeForFirestore({
        ownerId: listData.ownerId || currentUid,
        shareLinkEnabled: enabled,
        shareLinkRole: role,
        shareLinkToken: token,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );

    return token;
  } catch (error) {
    console.error('Error updating list share link settings:', error);
    return null;
  }
}

// 11. Join List via Share Link
export async function joinListViaShareLink(
  listId: string,
  token: string,
  currentUser: User | { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null }
): Promise<{ success: boolean; list?: AppList; message?: string }> {
  if (!currentUser?.uid) {
    return { success: false, message: 'User is not authenticated' };
  }
  try {
    const listRef = doc(db, 'lists', listId);
    const listSnap = await getDoc(listRef);
    if (!listSnap.exists()) {
      return { success: false, message: 'List not found' };
    }

    const listData = listSnap.data() as AppList;
    if (!listData.shareLinkEnabled) {
      return { success: false, message: 'Link sharing is not enabled for this list' };
    }

    if (listData.shareLinkToken && listData.shareLinkToken !== token) {
      return { success: false, message: 'Invalid or expired share link' };
    }

    const role: ShareRole = listData.shareLinkRole || 'edit';
    const collaborators = { ...(listData.collaborators || {}) };

    collaborators[currentUser.uid] = {
      uid: currentUser.uid,
      email: currentUser.email || auth.currentUser?.email || '',
      displayName: currentUser.displayName || auth.currentUser?.displayName || '',
      photoURL: currentUser.photoURL || auth.currentUser?.photoURL || '',
      role,
      status: 'active',
      invitedAt: new Date().toISOString(),
      joinedAt: new Date().toISOString(),
    };

    const collaboratorUids = Array.from(
      new Set([...(listData.collaboratorUids || []), currentUser.uid])
    );

    await setDoc(
      listRef,
      sanitizeForFirestore({
        collaborators,
        collaboratorUids,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );

    return {
      success: true,
      list: {
        ...listData,
        collaborators,
        collaboratorUids,
        myRole: role,
      },
    };
  } catch (error) {
    console.error('Error joining list via share link:', error);
    return { success: false, message: String(error) };
  }
}

// 12. Delete List (STRICT ENFORCEMENT: Owner only)
export async function deleteListFromFirestore(
  listId: string,
  currentUser: User | { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null }
): Promise<boolean> {
  if (!currentUser?.uid) return false;
  try {
    const listRef = doc(db, 'lists', listId);
    const listSnap = await getDoc(listRef);

    if (listSnap.exists()) {
      const listData = listSnap.data() as AppList;
      // Strict client-side gate + rule enforcement
      if (listData.ownerId && listData.ownerId !== currentUser.uid) {
        throw new Error('Only the list owner can delete this list.');
      }

      // Delete subcollections
      const [groupsSnap, itemsSnap] = await Promise.all([
        getDocs(collection(db, 'lists', listId, 'groups')),
        getDocs(collection(db, 'lists', listId, 'items')),
      ]);

      const batch = writeBatch(db);
      groupsSnap.forEach((d) => batch.delete(d.ref));
      itemsSnap.forEach((d) => batch.delete(d.ref));
      batch.delete(listRef);

      // Also remove from private backup
      const userListRef = doc(db, 'users', currentUser.uid, 'lists', listId);
      batch.delete(userListRef);

      await batch.commit();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting list from Firestore:', error);
    return false;
  }
}

// 13. Fetch User Cloud Data (Single-shot)
export async function fetchUserCloudData(userId: string): Promise<UserCloudData | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userPref = userDoc.exists() ? userDoc.data() : {};

    const listsSnap = await getDocs(
      query(collection(db, 'lists'), where('collaboratorUids', 'array-contains', userId))
    );

    const lists: AppList[] = [];
    const groups: ListGroup[] = [];
    const items: ListItem[] = [];

    for (const listDoc of listsSnap.docs) {
      const l = listDoc.data() as AppList;
      lists.push(l);

      const [gSnap, iSnap] = await Promise.all([
        getDocs(collection(db, 'lists', l.id, 'groups')),
        getDocs(collection(db, 'lists', l.id, 'items')),
      ]);

      gSnap.forEach((g) => groups.push(g.data() as ListGroup));
      iSnap.forEach((i) => items.push(i.data() as ListItem));
    }

    return {
      lists,
      groups,
      items,
      language: userPref.language,
      theme: userPref.theme,
      themeColor: userPref.themeColor,
      soundEnabled: userPref.soundEnabled,
      activeListId: userPref.activeListId,
    };
  } catch (error) {
    console.error('Error fetching cloud data:', error);
    return null;
  }
}

// 14. Convenient aliases and wrappers
export async function shareListWithUser(
  listId: string,
  email: string,
  role: 'read' | 'edit',
  currentUser: User
): Promise<{ success: boolean; inviteToken?: string; error?: string }> {
  const res = await inviteUserToList(listId, currentUser, email, role);
  return {
    success: res.success,
    inviteToken: res.inviteToken,
    error: res.message,
  };
}

export async function updateMemberRole(
  listId: string,
  targetUid: string,
  role: 'read' | 'edit',
  _currentUid?: string
): Promise<boolean> {
  return updateCollaboratorRole(listId, targetUid, role);
}

export async function removeMemberFromList(
  listId: string,
  targetUid: string,
  _currentUid?: string
): Promise<boolean> {
  return removeCollaboratorFromList(listId, targetUid, undefined, targetUid);
}

export async function acceptListInvitation(
  listId: string,
  currentUser: User
): Promise<boolean> {
  return acceptPendingInvitation(listId, currentUser);
}

export async function rejectListInvitation(
  listId: string,
  currentUserEmail: string
): Promise<boolean> {
  return declinePendingInvitation(listId, currentUserEmail);
}

export async function fetchListShareDetails(
  listId: string
): Promise<PendingInvitation | null> {
  try {
    const listSnap = await getDoc(doc(db, 'lists', listId));
    if (!listSnap.exists()) return null;
    const l = listSnap.data() as AppList;
    return {
      listId: l.id,
      listTitle: l.title,
      listColor: l.color,
      listIcon: l.icon,
      ownerEmail: l.ownerEmail || '',
      ownerName: l.ownerName || '',
      role: l.shareLinkRole || 'read',
      invitedAt: l.createdAt || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching list share details:', error);
    return null;
  }
}

export function listenToPendingInvitations(
  userEmail: string,
  callback: (invites: PendingInvitation[]) => void
): Unsubscribe {
  const normalizedEmail = userEmail.trim().toLowerCase();
  if (!normalizedEmail) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, 'lists'),
    where('invitedEmails', 'array-contains', normalizedEmail)
  );

  return onSnapshot(
    q,
    (snap) => {
      const invites: PendingInvitation[] = [];
      snap.forEach((docSnap) => {
        const l = docSnap.data() as AppList;
        const emailKey = normalizedEmail.replace(/[\.\#\$\[\]]/g, '_');
        const inviteInfo = l.collaborators?.[emailKey];
        if (inviteInfo && inviteInfo.status === 'pending') {
          invites.push({
            listId: l.id,
            listTitle: l.title,
            listColor: l.color,
            listIcon: l.icon,
            ownerEmail: l.ownerEmail || '',
            ownerName: l.ownerName || '',
            role: inviteInfo.role || 'read',
            invitedAt: inviteInfo.invitedAt || l.createdAt,
            inviteToken: inviteInfo.inviteToken,
          });
        }
      });
      callback(invites);
    },
    (err) => {
      console.warn('Pending invitations listener error:', err);
      callback([]);
    }
  );
}
