'use client';

import { X } from 'lucide-react';
import { Task } from '@/types/kanban';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
}

const priorityStyles: Record<Task['priority'], { dot: string; text: string; bg: string }> = {
  high: { dot: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10' },
  medium: { dot: 'bg-yellow-500', text: 'text-yellow-300', bg: 'bg-yellow-500/10' },
  low: { dot: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

const statusLabels: Record<string, string> = {
  backlog: 'Backlog',
  'in-progress': 'In Progress',
  review: 'Review',
  done: 'Done',
};

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  if (!task) return null;

  const priority = priorityStyles[task.priority];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-4 sm:p-6 border-b border-zinc-800">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-100 break-words">{task.title}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${priority.bg} ${priority.text} capitalize`}>
                {task.priority} priority
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                {statusLabels[task.status] || task.status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[50vh]">
          {task.description ? (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Description</h3>
              <p className="text-zinc-200 text-sm whitespace-pre-wrap">{task.description}</p>
            </div>
          ) : (
            <p className="text-zinc-500 text-sm italic mb-6">No description provided.</p>
          )}

          {task.tags && task.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-zinc-500 space-y-1">
            <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
            <p>Updated: {new Date(task.updatedAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-zinc-800 bg-zinc-900/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
