export type TaskStatus = 'backlog' | 'in-progress' | 'review' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
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

export const COLUMNS: Column[] = [
  { id: 'backlog', title: 'Backlog', icon: '📋' },
  { id: 'in-progress', title: 'In Progress', icon: '🏃' },
  { id: 'review', title: 'Review', icon: '👀' },
  { id: 'done', title: 'Done', icon: '✅' },
];
