'use client';

import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { GripVertical, Trash2 } from 'lucide-react';
import { Task } from '@/types/kanban';

interface KanbanCardProps {
  task: Task;
  onDelete: () => void;
  onClick?: () => void;
  isOverlay?: boolean;
}

const priorityStyles: Record<Task['priority'], { dot: string; text: string }> = {
  high: { dot: 'bg-red-500', text: 'text-red-400' },
  medium: { dot: 'bg-yellow-500', text: 'text-yellow-300' },
  low: { dot: 'bg-emerald-500', text: 'text-emerald-400' },
};

export function KanbanCard({ task, onDelete, onClick, isOverlay = false }: KanbanCardProps) {
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
      className={`group relative rounded-xl border border-zinc-800 bg-zinc-900/80 p-2.5 sm:p-3 shadow-sm transition touch-manipulation ${
        isDragging ? 'opacity-60' : 'opacity-100'
      }`}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex items-start gap-1.5 sm:gap-2 min-w-0 flex-1">
          <button
            type="button"
            className="text-zinc-500 hover:text-zinc-300 mt-0.5 touch-manipulation shrink-0"
            aria-label="Drag task"
            {...dragHandleProps}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div 
            className="min-w-0 flex-1 cursor-pointer"
            onClick={onClick}
          >
            <h3 className="text-xs sm:text-sm font-semibold text-zinc-100 break-words hover:text-purple-300 transition">{task.title}</h3>
            {task.description ? (
              <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{task.description}</p>
            ) : null}
          </div>
        </div>
        {isOverlay ? null : (
          <button
            type="button"
            onClick={onDelete}
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition text-zinc-500 hover:text-red-400 p-1 -mr-1 shrink-0"
            aria-label={`Delete ${task.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-2 sm:mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs shrink-0">
          <span className={`h-2 w-2 rounded-full ${priority.dot}`} />
          <span className={`${priority.text} capitalize`}>{task.priority}</span>
        </div>
        {task.tags && task.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1 justify-end min-w-0">
            {task.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 truncate max-w-[60px] sm:max-w-none"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500">
                +{task.tags.length - 2}
              </span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
