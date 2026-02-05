import { Task, ActivityItem } from '@/types/kanban';
import { db } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  onSnapshot,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';

const TASKS_DOC = 'tasks';
const BOARD_COLLECTION = 'boards';
const ACTIVITY_COLLECTION = 'activity';

const defaultTasks: Task[] = [
  { id: '1', title: 'Build Kanban Dashboard', description: 'Visual dashboard for tracking tasks', status: 'done', priority: 'high', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: ['iris'] },
  { id: '2', title: 'Test PetListings.com', description: 'Create account, make listing, find bugs', status: 'backlog', priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: ['petlistings'] },
  { id: '3', title: 'Review MFV codebase', description: 'Understand architecture', status: 'in-progress', priority: 'high', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: ['mfv'] },
];

// In-memory cache for synchronous reads
let tasksCache: Task[] = defaultTasks;
let activityCache: ActivityItem[] = [];
let isInitialized = false;

// Initialize and subscribe to Firestore
export async function initializeStorage(): Promise<void> {
  if (typeof window === 'undefined' || isInitialized) return;
  
  try {
    // Load initial tasks
    const tasksRef = doc(db, BOARD_COLLECTION, TASKS_DOC);
    const tasksSnap = await getDoc(tasksRef);
    
    if (tasksSnap.exists()) {
      tasksCache = tasksSnap.data().tasks || defaultTasks;
    } else {
      // Initialize with defaults
      await setDoc(tasksRef, { tasks: defaultTasks, updatedAt: Timestamp.now() });
      tasksCache = defaultTasks;
    }
    
    // Load initial activity
    const activityRef = collection(db, ACTIVITY_COLLECTION);
    const activityQuery = query(activityRef, orderBy('timestamp', 'desc'), limit(50));
    const activitySnap = await getDocs(activityQuery);
    activityCache = activitySnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
    })) as ActivityItem[];
    
    // Subscribe to real-time updates for tasks
    onSnapshot(tasksRef, (snap) => {
      if (snap.exists()) {
        tasksCache = snap.data().tasks || defaultTasks;
        // Dispatch custom event for components to react
        window.dispatchEvent(new CustomEvent('tasksUpdated', { detail: tasksCache }));
      }
    });
    
    // Subscribe to real-time updates for activity
    onSnapshot(activityQuery, (snap) => {
      activityCache = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      })) as ActivityItem[];
      window.dispatchEvent(new CustomEvent('activityUpdated', { detail: activityCache }));
    });
    
    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Firestore storage:', error);
    // Fall back to defaults
    tasksCache = defaultTasks;
    activityCache = [];
  }
}

export function getTasks(): Task[] {
  return tasksCache;
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  tasksCache = tasks;
  
  if (typeof window === 'undefined') return;
  
  try {
    const tasksRef = doc(db, BOARD_COLLECTION, TASKS_DOC);
    await setDoc(tasksRef, { tasks, updatedAt: Timestamp.now() });
  } catch (error) {
    console.error('Failed to save tasks to Firestore:', error);
  }
}

export function getActivity(): ActivityItem[] {
  return activityCache;
}

export async function addActivity(item: Omit<ActivityItem, 'id' | 'timestamp'>): Promise<void> {
  const newItem: ActivityItem = { 
    ...item, 
    id: crypto.randomUUID(), 
    timestamp: new Date().toISOString() 
  };
  
  // Update cache immediately
  activityCache = [newItem, ...activityCache].slice(0, 50);
  
  if (typeof window === 'undefined') return;
  
  try {
    const activityRef = collection(db, ACTIVITY_COLLECTION);
    await addDoc(activityRef, {
      ...item,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    console.error('Failed to add activity to Firestore:', error);
  }
}

export async function clearActivity(): Promise<void> {
  activityCache = [];
  
  if (typeof window === 'undefined') return;
  
  try {
    const activityRef = collection(db, ACTIVITY_COLLECTION);
    const activityQuery = query(activityRef);
    const snap = await getDocs(activityQuery);
    
    // Delete all activity documents
    const deletePromises = snap.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Failed to clear activity from Firestore:', error);
  }
}

// Hook for components to subscribe to updates
export function subscribeToTasks(callback: (tasks: Task[]) => void): () => void {
  const handler = (event: CustomEvent) => callback(event.detail);
  window.addEventListener('tasksUpdated', handler as EventListener);
  return () => window.removeEventListener('tasksUpdated', handler as EventListener);
}

export function subscribeToActivity(callback: (activity: ActivityItem[]) => void): () => void {
  const handler = (event: CustomEvent) => callback(event.detail);
  window.addEventListener('activityUpdated', handler as EventListener);
  return () => window.removeEventListener('activityUpdated', handler as EventListener);
}
