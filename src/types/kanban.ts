export type TaskStatus = 'backlog' | 'in-progress' | 'revision' | 'review' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskHistoryEntry {
  timestamp: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  link?: string;
  history?: TaskHistoryEntry[];
}

export interface Column {
  id: TaskStatus;
  title: string;
  icon: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  taskTitle: string;
  timestamp: string;
  details?: string;
}

export interface KanbanState {
  columns: Array<{
    id: TaskStatus;
    title: string;
    tasks: Task[];
  }>;
  activity: ActivityItem[];
}

export const COLUMNS: Column[] = [
  { id: 'backlog', title: 'Backlog', icon: 'B' },
  { id: 'in-progress', title: 'In Progress', icon: 'P' },
  { id: 'revision', title: 'Revision', icon: '⟲' },
  { id: 'review', title: 'Review', icon: 'R' },
  { id: 'done', title: 'Done', icon: 'D' },
];