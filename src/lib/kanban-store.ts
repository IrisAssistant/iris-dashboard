import { KanbanState, Task, ActivityItem } from '@/types/kanban';

const STORAGE_KEY = 'iris-kanban-data';

const defaultState: KanbanState = {
  columns: [
    { id: 'backlog', title: 'Backlog', tasks: [] },
    { id: 'in-progress', title: 'In Progress', tasks: [] },
    { id: 'review', title: 'Review', tasks: [] },
    { id: 'done', title: 'Done', tasks: [] },
  ],
  activity: [],
};

export function loadState(): KanbanState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load:', e);
  }
  return defaultState;
}

export function saveState(state: KanbanState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save:', e);
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function createTask(
  title: string,
  status: Task['status'],
  description?: string,
  priority: Task['priority'] = 'medium',
  tags?: string[]
): Task {
  const now = new Date().toISOString();
  return { id: generateId(), title, description, status, priority, tags, createdAt: now, updatedAt: now };
}

export function createActivity(action: string, taskTitle: string, from?: string, to?: string): ActivityItem {
  const details = from && to ? `${from} → ${to}` : undefined;
  return { id: generateId(), action, taskTitle, details, timestamp: new Date().toISOString() };
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return diffMins + 'm ago';
  if (diffHours < 24) return diffHours + 'h ago';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
