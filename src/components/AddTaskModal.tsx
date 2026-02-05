'use client';

import { useState } from 'react';
import { Task } from '@/types/kanban';
import { X } from 'lucide-react';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, description: string, priority: Task['priority']) => void;
}

export function AddTaskModal({ isOpen, onClose, onAdd }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), description.trim(), priority);
      setTitle('');
      setDescription('');
      setPriority('medium');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded hover:bg-white/10 transition-colors"
        >
          <X size={18} className="text-[var(--muted)]" />
        </button>
        
        <h2 className="text-lg font-semibold mb-4">Add New Task</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg
                text-sm placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]
                transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1.5">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg
                text-sm placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]
                transition-colors resize-none"
            />
          </div>
          
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1.5">Priority</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                    ${priority === p
                      ? p === 'low' ? 'bg-blue-500/30 text-blue-400 border border-blue-500/50'
                        : p === 'medium' ? 'bg-yellow-500/30 text-yellow-400 border border-yellow-500/50'
                        : 'bg-red-500/30 text-red-400 border border-red-500/50'
                      : 'bg-[var(--background)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] text-sm
                hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 px-4 py-2 rounded-lg bg-[var(--accent)] text-black text-sm font-medium
                hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
