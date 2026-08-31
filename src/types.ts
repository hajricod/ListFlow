export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export type GroceryUnit =
  | 'pcs'
  | 'kg'
  | 'g'
  | 'pack'
  | 'carton'
  | 'bottle'
  | 'can'
  | 'bunch'
  | 'box'
  | 'bag'
  | 'loaf'
  | 'liters'
  | 'custom';

export interface ListItem {
  id: string;
  groupId: string;
  title: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  description?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  order?: number;
  dueDate?: string;
  priority?: Priority;
  tags?: string[];
  subtasks?: SubTask[];
  isPinned?: boolean;
  isHighlighted?: boolean;
  priceEstimate?: number;
}

export type ShareRole = 'owner' | 'edit' | 'read';

export interface ShareMember {
  uid?: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: ShareRole;
  status: 'active' | 'pending';
  invitedAt: string;
  joinedAt?: string;
  inviteToken?: string;
}

export interface AppList {
  id: string;
  title: string;
  color: string;
  icon: string;
  description?: string;
  order?: number;
  createdAt: string;
  updatedAt?: string;
  ownerId?: string;
  ownerEmail?: string;
  ownerName?: string;
  collaborators?: Record<string, ShareMember>;
  collaboratorUids?: string[];
  invitedEmails?: string[];
  shareLinkEnabled?: boolean;
  shareLinkRole?: 'read' | 'edit';
  shareLinkToken?: string;
  // Computed / client-side properties
  myRole?: ShareRole;
  isShared?: boolean;
}

export interface PendingInvitation {
  listId: string;
  listTitle: string;
  listColor: string;
  listIcon: string;
  ownerEmail: string;
  ownerName?: string;
  role: ShareRole;
  invitedAt: string;
  inviteToken?: string;
}

export interface ListGroup {
  id: string;
  listId?: string;
  title: string;
  color: string;
  icon: string;
  isCollapsed?: boolean;
  order?: number;
  createdAt: string;
}

export type Language = 'en' | 'ar';
export type Theme = 'light' | 'dark' | 'system';
export type ThemeColor =
  | 'emerald'
  | 'indigo'
  | 'blue'
  | 'violet'
  | 'rose'
  | 'amber'
  | 'teal'
  | 'cyan'
  | 'orange';

export type AppView = 'workspace' | 'settings';
export type SortOption = 'manual' | 'alphabetical' | 'createdAt' | 'quantity';
export type SortDirection = 'asc' | 'desc';
export type StatusFilter = 'all' | 'active' | 'completed';

export interface FilterState {
  search: string;
  status: StatusFilter;
  hideCompleted?: boolean;
  priority?: 'all' | Priority;
  tag?: string | null;
  groupId?: string | 'all';
  sortBy: SortOption;
  sortDirection: SortDirection;
}

export interface DragItem {
  type: 'ITEM' | 'GROUP';
  id: string;
  groupId?: string;
  index: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  undoAction?: () => void;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'idle' | 'quota-exceeded';

