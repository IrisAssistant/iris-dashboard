'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Column, Task, TaskStatus } from '@/types/kanban';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
}

export function KanbanColumn({ column, tasks, onAddTask, onDeleteTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col w-72 shrink-0 rounded-xl bg-zinc-900/60 border border-zinc-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{column.title}</span>
          <span className="text-xs text-zinc-500">({tasks.length})</span>
        </div>
        <button
          type="button"
          onClick={() => onAddTask(column.id)}
          className="p-1 rounded-md text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition"
          aria-label={`Add task to ${column.title}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 p-3 space-y-3 overflow-y-auto ${isOver ? 'bg-zinc-800/40' : ''}`}
      >
        <SortableContext items={tasks.map((task) => task.id)} strategy={rectSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="text-sm text-zinc-600 border border-dashed border-zinc-800 rounded-lg p-3 text-center">
              Drop tasks here
            </div>
          ) : (
            tasks.map((task) => (
              <KanbanCard key={task.id} task={task} onDelete={() => onDeleteTask(task.id)} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
