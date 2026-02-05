'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types/kanban';
import { GripVertical, Trash2 } from 'lucide-react';

interface KanbanCardProps {
  task: Task;
  onDelete: (id: string) => void;
}

const priorityColors = {
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function KanbanCard({ task, onDelete }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 cursor-default
        hover:bg-[var(--card-hover)] hover:border-[var(--accent)]/30 transition-all
        ${isDragging ? 'opacity-50 shadow-xl ring-2 ring-[var(--accent)]' : ''}`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 p-1 -ml-1 rounded hover:bg-white/10 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical size={14} className="text-[var(--muted)]" />
        </button>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--foreground)] break-words">
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
          </div>
        </div>

        <button
          onClick={() => onDelete(task.id)}
          className="p-1 rounded hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={14} className="text-red-400" />
        </button>
      </div>
    </div>
  );
}
