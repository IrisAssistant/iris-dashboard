import { Task, ActivityItem } from '@/types/kanban';

const TASKS_KEY = 'iris-kanban-tasks';
const ACTIVITY_KEY = 'iris-kanban-activity';

const defaultTasks: Task[] = [
  { id: '1', title: 'Build Kanban Dashboard', description: 'Visual dashboard for tracking tasks', status: 'done', priority: 'high', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: ['iris'] },
  { id: '2', title: 'Test PetListings.com', description: 'Create account, make listing, find bugs', status: 'backlog', priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: ['petlistings'] },
  { id: '3', title: 'Review MFV codebase', description: 'Understand architecture', status: 'in-progress', priority: 'high', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: ['mfv'] },
];

export function getTasks(): Task[] {
  if (typeof window === 'undefined') return defaultTasks;
  const stored = localStorage.getItem(TASKS_KEY);
  if (!stored) { saveTasks(defaultTasks); return defaultTasks; }
  return JSON.parse(stored);
}

export function saveTasks(tasks: Task[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function getActivity(): ActivityItem[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(ACTIVITY_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function addActivity(item: Omit<ActivityItem, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return;
  const activity = getActivity();
  const newItem: ActivityItem = { ...item, id: crypto.randomUUID(), timestamp: new Date().toISOString() };
  activity.unshift(newItem);
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity.slice(0, 50)));
}

export function clearActivity(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify([]));
}