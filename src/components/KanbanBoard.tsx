'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { KanbanState, Task, Column } from '@/types/kanban';
import { loadState, saveState, createTask, createActivity } from '@/lib/kanban-store';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { ActivityLog } from './ActivityLog';
import { AddTaskModal } from './AddTaskModal';

export function KanbanBoard() {
  const [state, setState] = useState<KanbanState | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [targetColumn, setTargetColumn] = useState<string>('backlog');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    if (state) {
      saveState(state);
    }
  }, [state]);

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[var(--muted)]">Loading...</div>
      </div>
    );
  }

  const findColumn = (taskId: string): Column | undefined => {
    return state.columns.find((col) => col.tasks.some((t) => t.id === taskId));
  };

  const findTask = (taskId: string): Task | undefined => {
    for (const col of state.columns) {
      const task = col.tasks.find((t) => t.id === taskId);
      if (task) return task;
    }
    return undefined;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = findTask(event.active.id as string);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumn(activeId);
    const overColumn = state.columns.find((col) => col.id === overId) || findColumn(overId);

    if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) return;

    setState((prev) => {
      if (!prev) return prev;

      const activeColIndex = prev.columns.findIndex((c) => c.id === activeColumn.id);
      const overColIndex = prev.columns.findIndex((c) => c.id === overColumn.id);
      const activeTaskIndex = prev.columns[activeColIndex].tasks.findIndex((t) => t.id === activeId);
      const task = prev.columns[activeColIndex].tasks[activeTaskIndex];

      const newColumns = [...prev.columns];
      newColumns[activeColIndex] = {
        ...newColumns[activeColIndex],
        tasks: newColumns[activeColIndex].tasks.filter((t) => t.id !== activeId),
      };
      newColumns[overColIndex] = {
        ...newColumns[overColIndex],
        tasks: [...newColumns[overColIndex].tasks, task],
      };

      return { ...prev, columns: newColumns };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumn(activeId);
    const overColumn = state.columns.find((col) => col.id === overId) || findColumn(overId);

    if (!activeColumn || !overColumn) return;

    if (activeColumn.id === overColumn.id) {
      const colIndex = state.columns.findIndex((c) => c.id === activeColumn.id);
      const oldIndex = state.columns[colIndex].tasks.findIndex((t) => t.id === activeId);
      const newIndex = state.columns[colIndex].tasks.findIndex((t) => t.id === overId);

      if (oldIndex !== newIndex && newIndex !== -1) {
        setState((prev) => {
          if (!prev) return prev;
          const newColumns = [...prev.columns];
          newColumns[colIndex] = {
            ...newColumns[colIndex],
            tasks: arrayMove(newColumns[colIndex].tasks, oldIndex, newIndex),
          };
          return { ...prev, columns: newColumns };
        });
      }
    }

    // Log activity if column changed
    const task = findTask(activeId);
    if (task && activeColumn.id !== overColumn.id) {
      const activity = createActivity('moved', task.title, activeColumn.title, overColumn.title);
      setState((prev) => {
        if (!prev) return prev;
        return { ...prev, activity: [activity, ...prev.activity].slice(0, 100) };
      });
    }
  };

  const handleAddTask = (columnId: string) => {
    setTargetColumn(columnId);
    setModalOpen(true);
  };

  const handleCreateTask = (title: string, description: string, priority: Task['priority']) => {
    const task = createTask(title, description, priority);
    const activity = createActivity('created', title);
    
    setState((prev) => {
      if (!prev) return prev;
      const colIndex = prev.columns.findIndex((c) => c.id === targetColumn);
      const newColumns = [...prev.columns];
      newColumns[colIndex] = {
        ...newColumns[colIndex],
        tasks: [task, ...newColumns[colIndex].tasks],
      };
      return {
        columns: newColumns,
        activity: [activity, ...prev.activity].slice(0, 100),
      };
    });
  };

  const handleDeleteTask = (taskId: string) => {
    const task = findTask(taskId);
    if (!task) return;

    const activity = createActivity('deleted', task.title);
    
    setState((prev) => {
      if (!prev) return prev;
      const newColumns = prev.columns.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t.id !== taskId),
      }));
      return {
        columns: newColumns,
        activity: [activity, ...prev.activity].slice(0, 100),
      };
    });
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 min-h-[calc(100vh-120px)]">
          <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
            {state.columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
              />
            ))}
          </div>
          
          <ActivityLog activities={state.activity} />
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="rotate-3 opacity-90">
              <KanbanCard task={activeTask} onDelete={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <AddTaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleCreateTask}
      />
    </>
  );
}
