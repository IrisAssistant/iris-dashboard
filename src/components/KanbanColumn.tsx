'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column, Task } from '@/types/kanban';
import { KanbanCard } from './KanbanCard';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  column: Column;
  onAddTask: (columnId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export function KanbanColumn({ column, onAddTask, onDeleteTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="font-semibold text-sm text-[var(--foreground)]">
          {column.title}
          <span className="ml-2 text-xs text-[var(--muted)] font-normal">
            {column.tasks.length}
          </span>
        </h2>
        <button
          onClick={() => onAddTask(column.id)}
          className="p-1 rounded hover:bg-[var(--accent)]/20 transition-colors"
        >
          <Plus size={16} className="text-[var(--accent)]" />
        </button>
      </div>
      
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[200px] p-2 rounded-lg border-2 border-dashed transition-colors
          ${isOver 
            ? 'border-[var(--accent)] bg-[var(--accent)]/5' 
            : 'border-transparent'
          }`}
      >
        <SortableContext items={column.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {column.tasks.map((task) => (
              <KanbanCard key={task.id} task={task} onDelete={onDeleteTask} />
            ))}
          </div>
        </SortableContext>
        
        {column.tasks.length === 0 && !isOver && (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-[var(--muted)]">Drop tasks here</p>
          </div>
        )}
      </div>
    </div>
  );
}
