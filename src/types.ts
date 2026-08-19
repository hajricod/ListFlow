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
  priceEstimate?: number;
}

export interface AppList {
  id: string;
  title: string;
  color: string;
  icon: string;
  description?: string;
  order?: number;
  createdAt: string;
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

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'idle';

export type ActivityAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'toggle'
  | 'reorder'
  | 'clear'
  | 'batch_clear'
  | 'move'
  | 'import'
  | 'batch_sync';

export type ActivityTargetType = 'list' | 'group' | 'item' | 'settings' | 'batch';

export interface ActivityLog {
  id: string;
  userId: string;
  action: ActivityAction;
  targetType: ActivityTargetType;
  targetId?: string;
  title: string;
  details?: string;
  source?: string;
  listId?: string;
  timestamp: string;
}

