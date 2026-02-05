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

// In-memory cache for synchronous reads
let tasksCache: Task[] = [];
let activityCache: ActivityItem[] = [];
let isInitialized = false;
let initError: Error | null = null;

// Initialize and subscribe to Firestore
export async function initializeStorage(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (isInitialized) return;
  
  try {
    // Load initial tasks
    const tasksRef = doc(db, BOARD_COLLECTION, TASKS_DOC);
    const tasksSnap = await getDoc(tasksRef);
    
    if (tasksSnap.exists()) {
      tasksCache = tasksSnap.data().tasks || [];
    } else {
      // No data yet - start with empty board
      tasksCache = [];
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
        tasksCache = snap.data().tasks || [];
        window.dispatchEvent(new CustomEvent('tasksUpdated', { detail: tasksCache }));
      }
    }, (error) => {
      console.error('Firestore tasks subscription error:', error);
      window.dispatchEvent(new CustomEvent('storageError', { detail: error.message }));
    });
    
    // Subscribe to real-time updates for activity
    onSnapshot(activityQuery, (snap) => {
      activityCache = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      })) as ActivityItem[];
      window.dispatchEvent(new CustomEvent('activityUpdated', { detail: activityCache }));
    }, (error) => {
      console.error('Firestore activity subscription error:', error);
    });
    
    isInitialized = true;
    initError = null;
  } catch (error) {
    console.error('Failed to initialize Firestore storage:', error);
    initError = error instanceof Error ? error : new Error('Failed to connect to database');
    throw initError;
  }
}

export function getInitError(): Error | null {
  return initError;
}

export function isStorageInitialized(): boolean {
  return isInitialized;
}

export function getTasks(): Task[] {
  return tasksCache;
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  tasksCache = tasks;
  
  if (typeof window === 'undefined') return;
  
  const tasksRef = doc(db, BOARD_COLLECTION, TASKS_DOC);
  await setDoc(tasksRef, { tasks, updatedAt: Timestamp.now() });
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
  
  activityCache = [newItem, ...activityCache].slice(0, 50);
  
  if (typeof window === 'undefined') return;
  
  const activityRef = collection(db, ACTIVITY_COLLECTION);
  await addDoc(activityRef, {
    ...item,
    timestamp: Timestamp.now()
  });
}

export async function clearActivity(): Promise<void> {
  activityCache = [];
  
  if (typeof window === 'undefined') return;
  
  const activityRef = collection(db, ACTIVITY_COLLECTION);
  const activityQuery = query(activityRef);
  const snap = await getDocs(activityQuery);
  
  const deletePromises = snap.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
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

export function subscribeToErrors(callback: (error: string) => void): () => void {
  const handler = (event: CustomEvent) => callback(event.detail);
  window.addEventListener('storageError', handler as EventListener);
  return () => window.removeEventListener('storageError', handler as EventListener);
}
