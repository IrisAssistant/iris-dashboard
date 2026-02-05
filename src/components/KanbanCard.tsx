'use client';

import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { GripVertical, Trash2 } from 'lucide-react';
import { Task } from '@/types/kanban';

interface KanbanCardProps {
  task: Task;
  onDelete: () => void;
  isOverlay?: boolean;
}

const priorityStyles: Record<Task['priority'], { dot: string; text: string }> = {
  high: { dot: 'bg-red-500', text: 'text-red-400' },
  medium: { dot: 'bg-yellow-500', text: 'text-yellow-300' },
  low: { dot: 'bg-emerald-500', text: 'text-emerald-400' },
};

export function KanbanCard({ task, onDelete, isOverlay = false }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = priorityStyles[task.priority];
  const dragHandleProps = isOverlay ? {} : { ...attributes, ...listeners };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 shadow-sm transition ${
        isDragging ? 'opacity-60' : 'opacity-100'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <button
            type="button"
            className="text-zinc-500 hover:text-zinc-300 mt-0.5"
            aria-label="Drag task"
            {...dragHandleProps}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">{task.title}</h3>
            {task.description ? (
              <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{task.description}</p>
            ) : null}
          </div>
        </div>
        {isOverlay ? null : (
          <button
            type="button"
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 transition text-zinc-500 hover:text-red-400"
            aria-label={`Delete ${task.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs">
          <span className={`h-2 w-2 rounded-full ${priority.dot}`} />
          <span className={`${priority.text} capitalize`}>{task.priority}</span>
        </div>
        {task.tags && task.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1 justify-end">
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
