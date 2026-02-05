'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { COLUMNS, TaskPriority, TaskStatus } from '@/types/kanban';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    tags: string[];
  }) => void;
  defaultStatus: TaskStatus;
}

const priorityOptions: TaskPriority[] = ['low', 'medium', 'high'];

export function AddTaskModal({ isOpen, onClose, onAdd, defaultStatus }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStatus(defaultStatus);
      setTitle('');
      setDescription('');
      setPriority('medium');
      setTags('');
    }
  }, [isOpen, defaultStatus]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    const tagList = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    onAdd({ title: title.trim(), description: description.trim(), status, priority, tags: tagList });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-0 sm:px-4">
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-zinc-100">Add Task</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 p-1"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 sm:py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              placeholder="Task title"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 sm:py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
              rows={3}
              placeholder="Short description"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as TaskStatus)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 sm:py-2 text-sm text-zinc-100 focus:outline-none appearance-none"
              >
                {COLUMNS.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as TaskPriority)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 sm:py-2 text-sm text-zinc-100 focus:outline-none appearance-none"
              >
                {priorityOptions.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tags</label>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 sm:py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              placeholder="comma-separated tags"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 sm:py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 sm:py-2 rounded-lg bg-emerald-500 text-sm font-medium text-emerald-950 hover:bg-emerald-400 active:bg-emerald-600"
            >
              Create task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
