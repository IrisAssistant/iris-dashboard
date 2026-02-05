export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

export interface ActivityItem {
  id: string;
  action: string;
  taskTitle: string;
  from?: string;
  to?: string;
  timestamp: string;
}

export interface KanbanState {
  columns: Column[];
  activity: ActivityItem[];
}
