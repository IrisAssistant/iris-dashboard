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
  
  // Filter out undefined values from tasks before saving to Firestore
  const cleanedTasks = tasks.map(task => 
    Object.fromEntries(
      Object.entries(task).filter(([, value]) => value !== undefined)
    )
  ) as Task[];
  
  // Retry logic with exponential backoff
  let retries = 3;
  let lastError: Error | null = null;
  
  while (retries > 0) {
    try {
      await setDoc(tasksRef, { tasks: cleanedTasks, updatedAt: Timestamp.now() });
      return; // Success
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retries--;
      
      // Log the error and retry
      console.warn(`Firestore write failed (retries left: ${retries}):`, lastError.message);
      
      if (retries > 0) {
        // Exponential backoff: 500ms, 1000ms, 2000ms
        await new Promise(resolve => setTimeout(resolve, 500 * (4 - retries)));
      }
    }
  }
  
  // All retries failed
  console.error('Failed to save tasks after 3 retries:', lastError);
  window.dispatchEvent(new CustomEvent('storageError', { 
    detail: `Failed to save tasks: ${lastError?.message}` 
  }));
  throw lastError || new Error('Failed to save tasks to Firestore');
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
  
  // Filter out undefined values before saving to Firestore (Firestore doesn't allow undefined)
  const cleanedItem = Object.fromEntries(
    Object.entries(item).filter(([, value]) => value !== undefined)
  );
  
  // Retry logic with exponential backoff
  let retries = 3;
  let lastError: Error | null = null;
  
  while (retries > 0) {
    try {
      await addDoc(activityRef, {
        ...cleanedItem,
        timestamp: Timestamp.now()
      });
      return; // Success
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retries--;
      
      console.warn(`Firestore activity write failed (retries left: ${retries}):`, lastError.message);
      
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 500 * (4 - retries)));
      }
    }
  }
  
  // Log error but don't crash - activity is secondary
  console.error('Failed to save activity after 3 retries:', lastError);
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

// Re-fetch on visibility change (fixes stale connection in background tabs)
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && isInitialized) {
      try {
        const tasksRef = doc(db, BOARD_COLLECTION, TASKS_DOC);
        const tasksSnap = await getDoc(tasksRef);
        if (tasksSnap.exists()) {
          const freshTasks = tasksSnap.data().tasks || [];
          if (JSON.stringify(freshTasks) !== JSON.stringify(tasksCache)) {
            tasksCache = freshTasks;
            window.dispatchEvent(new CustomEvent('tasksUpdated', { detail: tasksCache }));
          }
        }
      } catch (e) {
        console.warn('Failed to refresh tasks on visibility change:', e);
      }
    }
  });
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
