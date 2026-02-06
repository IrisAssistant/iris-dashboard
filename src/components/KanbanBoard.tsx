'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, TouchSensor, useSensor, useSensors, closestCorners, DragOverlay } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Task, TaskStatus, COLUMNS, ActivityItem } from '@/types/kanban';
import { getTasks, saveTasks, getActivity, addActivity, clearActivity, initializeStorage, subscribeToTasks, subscribeToActivity, subscribeToErrors } from '@/lib/storage';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { ActivityLog } from './ActivityLog';
import { AddTaskModal } from './AddTaskModal';
import { TaskDetailModal } from './TaskDetailModal';

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultStatus, setModalDefaultStatus] = useState<TaskStatus>('backlog');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showActivity, setShowActivity] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Track if we need to save (only for LOCAL changes, not Firebase updates)
  const needsSave = useRef(false);
  const isReceivingUpdate = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  // Save function that only runs when needed
  const saveIfNeeded = useCallback(async (tasksToSave: Task[]) => {
    if (!needsSave.current || isSaving) return;
    needsSave.current = false;
    setIsSaving(true);
    try {
      await saveTasks(tasksToSave);
    } catch (err) {
      console.error('Failed to save:', err);
      setError('Failed to save changes. Please refresh and try again.');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving]);

  useEffect(() => {
    let unsubTasks: (() => void) | undefined;
    let unsubActivity: (() => void) | undefined;
    let unsubErrors: (() => void) | undefined;
    
    async function init() {
      try {
        await initializeStorage();
        setTasks(getTasks());
        setActivities(getActivity());
        setIsLoaded(true);
        setError(null);
        
        // Subscribe to Firebase updates (these should NOT trigger saves)
        unsubTasks = subscribeToTasks((newTasks) => {
          isReceivingUpdate.current = true;
          setTasks(newTasks);
          // Reset flag after state update
          setTimeout(() => { isReceivingUpdate.current = false; }, 0);
        });
        unsubActivity = subscribeToActivity((newActivity) => {
          setActivities(newActivity);
        });
        unsubErrors = subscribeToErrors((errorMsg) => {
          setError(errorMsg);
        });
      } catch (err) {
        console.error('Failed to initialize:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect to database');
        setIsLoaded(true);
      }
    }
    
    init();
    
    return () => {
      unsubTasks?.();
      unsubActivity?.();
      unsubErrors?.();
    };
  }, []);
  
  // Save when tasks change from LOCAL updates only
  useEffect(() => {
    if (isLoaded && !error && needsSave.current) {
      saveIfNeeded(tasks);
    }
  }, [tasks, isLoaded, error, saveIfNeeded]);

  // Helper to update tasks locally (marks for save)
  const updateTasksLocally = useCallback((updater: (prev: Task[]) => Task[]) => {
    needsSave.current = true;
    setTasks(updater);
  }, []);

  const handleDragStart = (event: DragStartEvent) => { 
    const task = tasks.find((t) => t.id === event.active.id); 
    if (task) setActiveTask(task); 
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeTaskItem = tasks.find((t) => t.id === active.id);
    if (!activeTaskItem) return;
    const overColumn = COLUMNS.find((c) => c.id === over.id);
    if (overColumn && activeTaskItem.status !== overColumn.id) {
      updateTasksLocally((prev) => prev.map((t) => t.id === active.id ? { ...t, status: overColumn.id, updatedAt: new Date().toISOString() } : t));
      return;
    }
    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask && activeTaskItem.status !== overTask.status) {
      updateTasksLocally((prev) => prev.map((t) => t.id === active.id ? { ...t, status: overTask.status, updatedAt: new Date().toISOString() } : t));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const draggingTask = activeTask ?? tasks.find((t) => t.id === active.id);
    setActiveTask(null);
    if (!over || !draggingTask) return;
    const overColumn = COLUMNS.find((c) => c.id === over.id);
    if (overColumn && draggingTask.status !== overColumn.id) {
      const fromColumn = COLUMNS.find((c) => c.id === draggingTask.status);
      logActivity('Moved', draggingTask.title, fromColumn?.title + ' -> ' + overColumn.title);
      return;
    }
    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask) {
      if (draggingTask.status === overTask.status) {
        const columnTasks = tasks.filter((t) => t.status === draggingTask.status);
        const oldIndex = columnTasks.findIndex((t) => t.id === active.id);
        const newIndex = columnTasks.findIndex((t) => t.id === over.id);
        if (oldIndex !== newIndex) {
          const reordered = arrayMove(columnTasks, oldIndex, newIndex);
          updateTasksLocally((prev) => [...prev.filter((t) => t.status !== draggingTask.status), ...reordered]);
        }
      } else {
        const fromColumn = COLUMNS.find((c) => c.id === draggingTask.status);
        const toColumn = COLUMNS.find((c) => c.id === overTask.status);
        if (toColumn) {
          logActivity('Moved', draggingTask.title, fromColumn?.title + ' -> ' + toColumn.title);
        }
      }
    }
  };

  const logActivity = (action: string, taskTitle: string, details?: string) => { 
    addActivity({ action, taskTitle, details }).catch(console.error); 
    setActivities(getActivity()); 
  };
  
  const handleAddTask = (status: TaskStatus) => { setModalDefaultStatus(status); setIsModalOpen(true); };
  
  const handleCreateTask = (taskData: { title: string; description: string; status: TaskStatus; priority: 'low' | 'medium' | 'high'; tags: string[] }) => {
    const newTask: Task = { id: crypto.randomUUID(), ...taskData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    updateTasksLocally((prev) => [...prev, newTask]);
    logActivity('Created', newTask.title);
  };
  
  const handleDeleteTask = (id: string) => { 
    const task = tasks.find((t) => t.id === id); 
    if (task) { 
      updateTasksLocally((prev) => prev.filter((t) => t.id !== id)); 
      logActivity('Deleted', task.title); 
    } 
  };
  
  const handleClearActivity = () => { clearActivity().catch(console.error); setActivities([]); };
  const getTasksByStatus = (status: TaskStatus) => {
    const filtered = tasks.filter((t) => t.status === status);
    // Done: newest on top (most recently completed first)
    // Others: oldest on top (work oldest items first)
    if (status === 'done') {
      return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    return filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };
  
  const handleRetry = () => {
    setError(null);
    setIsLoaded(false);
    window.location.reload();
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          <div className="text-zinc-500">Connecting to database...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950 p-4">
        <div className="bg-zinc-900 border border-red-500/30 rounded-lg p-6 sm:p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">Connection Error</h2>
          </div>
          <p className="text-zinc-400 mb-6 text-sm sm:text-base">{error}</p>
          <button
            onClick={handleRetry}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
          >
            Retry Connection
          </button>
          <p className="text-zinc-600 text-xs sm:text-sm mt-4 text-center">
            If this persists, check your internet connection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xl sm:text-2xl">🔮</span>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-zinc-100">Iris Dashboard</h1>
                <p className="text-xs sm:text-sm text-zinc-500 hidden sm:block">Kanban task tracking</p>
              </div>
            </div>
            <button
              onClick={() => setShowActivity(!showActivity)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                showActivity 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
              }`}
              title={showActivity ? 'Hide activity' : 'Show activity'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">Activity</span>
              {activities.length > 0 && !showActivity && (
                <span className="bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activities.length > 9 ? '9+' : activities.length}
                </span>
              )}
            </button>
          </div>
        </header>
        
        <main className="flex-1 overflow-x-auto overflow-y-hidden p-3 sm:p-6">
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
            <div className="flex gap-3 sm:gap-4 h-full min-w-max pb-4">
              {COLUMNS.map((column) => (
                <KanbanColumn 
                  key={column.id} 
                  column={column} 
                  tasks={getTasksByStatus(column.id)} 
                  onAddTask={handleAddTask} 
                  onDeleteTask={handleDeleteTask}
                  onClickTask={setSelectedTask}
                />
              ))}
            </div>
            <DragOverlay>
              {activeTask ? (
                <div className="rotate-3">
                  <KanbanCard task={activeTask} onDelete={() => {}} isOverlay />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </main>
        
        {isSaving && (
          <div className="fixed bottom-4 left-4 bg-zinc-800 text-zinc-400 px-3 py-2 rounded-lg text-sm flex items-center gap-2 z-30">
            <div className="animate-spin rounded-full h-3 w-3 border-t border-b border-purple-500"></div>
            Saving...
          </div>
        )}
      </div>
      
      {showActivity && <ActivityLog activities={activities} onClear={handleClearActivity} />}
      <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleCreateTask} defaultStatus={modalDefaultStatus} />
      <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  );
}
