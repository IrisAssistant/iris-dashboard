'use client';
import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners, DragOverlay } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Task, TaskStatus, COLUMNS, ActivityItem } from '@/types/kanban';
import { getTasks, saveTasks, getActivity, addActivity, clearActivity } from '@/lib/storage';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { ActivityLog } from './ActivityLog';
import { AddTaskModal } from './AddTaskModal';

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultStatus, setModalDefaultStatus] = useState<TaskStatus>('backlog');
  const [isLoaded, setIsLoaded] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => { setTasks(getTasks()); setActivities(getActivity()); setIsLoaded(true); }, []);
  useEffect(() => { if (isLoaded) saveTasks(tasks); }, [tasks, isLoaded]);

  const handleDragStart = (event: DragStartEvent) => { const task = tasks.find((t) => t.id === event.active.id); if (task) setActiveTask(task); };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;
    const overColumn = COLUMNS.find((c) => c.id === over.id);
    if (overColumn && activeTask.status !== overColumn.id) {
      setTasks((prev) => prev.map((t) => t.id === active.id ? { ...t, status: overColumn.id, updatedAt: new Date().toISOString() } : t));
      return;
    }
    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask && activeTask.status !== overTask.status) {
      setTasks((prev) => prev.map((t) => t.id === active.id ? { ...t, status: overTask.status, updatedAt: new Date().toISOString() } : t));
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
          setTasks((prev) => [...prev.filter((t) => t.status !== draggingTask.status), ...reordered]);
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

  const logActivity = (action: string, taskTitle: string, details?: string) => { addActivity({ action, taskTitle, details }); setActivities(getActivity()); };
  const handleAddTask = (status: TaskStatus) => { setModalDefaultStatus(status); setIsModalOpen(true); };
  const handleCreateTask = (taskData: { title: string; description: string; status: TaskStatus; priority: 'low' | 'medium' | 'high'; tags: string[] }) => {
    const newTask: Task = { id: crypto.randomUUID(), ...taskData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setTasks((prev) => [...prev, newTask]);
    logActivity('Created', newTask.title);
  };
  const handleDeleteTask = (id: string) => { const task = tasks.find((t) => t.id === id); if (task) { setTasks((prev) => prev.filter((t) => t.id !== id)); logActivity('Deleted', task.title); } };
  const handleClearActivity = () => { clearActivity(); setActivities([]); };
  const getTasksByStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  if (!isLoaded) return <div className="flex items-center justify-center h-screen bg-zinc-950"><div className="text-zinc-500">Loading...</div></div>;

  return (
    <div className="flex h-screen bg-zinc-950">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔮</span>
            <div>
              <h1 className="text-xl font-bold text-zinc-100">Iris Dashboard</h1>
              <p className="text-sm text-zinc-500">Kanban task tracking</p>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-auto p-6">
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 h-full">
              {COLUMNS.map((column) => (<KanbanColumn key={column.id} column={column} tasks={getTasksByStatus(column.id)} onAddTask={handleAddTask} onDeleteTask={handleDeleteTask} />))}
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
      </div>
      <ActivityLog activities={activities} onClear={handleClearActivity} />
      <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleCreateTask} defaultStatus={modalDefaultStatus} />
    </div>
  );
}