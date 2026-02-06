'use client';

import { useState } from 'react';
import { X, Pencil, ExternalLink, History, Check } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, COLUMNS } from '@/types/kanban';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (task: Task) => void;
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

export function TaskDetailModal({ task, onClose, onUpdate }: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    status: 'backlog' as TaskStatus,
    tags: '',
    link: '',
  });

  if (!task) return null;

  const priority = priorityStyles[task.priority];

  const startEditing = () => {
    setEditForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      tags: task.tags?.join(', ') || '',
      link: task.link || '',
    });
    setIsEditing(true);
  };

  const saveChanges = () => {
    const history = task.history || [];
    const newHistory = [...history];
    
    // Track changes
    if (editForm.title !== task.title) {
      newHistory.push({ timestamp: new Date().toISOString(), field: 'title', oldValue: task.title, newValue: editForm.title });
    }
    if (editForm.description !== (task.description || '')) {
      newHistory.push({ timestamp: new Date().toISOString(), field: 'description', oldValue: task.description || '', newValue: editForm.description });
    }
    if (editForm.priority !== task.priority) {
      newHistory.push({ timestamp: new Date().toISOString(), field: 'priority', oldValue: task.priority, newValue: editForm.priority });
    }
    if (editForm.status !== task.status) {
      newHistory.push({ timestamp: new Date().toISOString(), field: 'status', oldValue: task.status, newValue: editForm.status });
    }
    if (editForm.link !== (task.link || '')) {
      newHistory.push({ timestamp: new Date().toISOString(), field: 'link', oldValue: task.link || '', newValue: editForm.link });
    }

    const updatedTask: Task = {
      ...task,
      title: editForm.title,
      description: editForm.description || undefined,
      priority: editForm.priority,
      status: editForm.status,
      tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      link: editForm.link || undefined,
      updatedAt: new Date().toISOString(),
      history: newHistory.length > 0 ? newHistory : task.history,
    };

    onUpdate(updatedTask);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-4 sm:p-6 border-b border-zinc-800">
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full text-lg font-bold bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 border border-zinc-700 focus:border-purple-500 focus:outline-none"
              />
            ) : (
              <h2 className="text-lg sm:text-xl font-bold text-zinc-100 break-words">{task.title}</h2>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {isEditing ? (
                <>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as TaskPriority })}
                    className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as TaskStatus })}
                    className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700"
                  >
                    {COLUMNS.map(col => (
                      <option key={col.id} value={col.id}>{col.title}</option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <span className={`text-xs px-2 py-1 rounded-full ${priority.bg} ${priority.text} capitalize`}>
                    {task.priority} priority
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                    {statusLabels[task.status] || task.status}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isEditing && (
              <button
                onClick={startEditing}
                className="p-2 rounded-lg text-zinc-400 hover:text-purple-400 hover:bg-zinc-800 transition"
                aria-label="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[45vh]">
          {/* Link */}
          {isEditing ? (
            <div className="mb-4">
              <label className="text-sm font-medium text-zinc-400 mb-1 block">Link/URL</label>
              <input
                type="url"
                value={editForm.link}
                onChange={(e) => setEditForm({ ...editForm, link: e.target.value })}
                placeholder="https://github.com/..."
                className="w-full text-sm bg-zinc-800 text-zinc-200 rounded-lg px-3 py-2 border border-zinc-700 focus:border-purple-500 focus:outline-none"
              />
            </div>
          ) : task.link ? (
            <a
              href={task.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mb-4 text-sm text-purple-400 hover:text-purple-300 transition"
            >
              <ExternalLink className="w-4 h-4" />
              Open Link
            </a>
          ) : null}

          {/* Description */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Description</h3>
            {isEditing ? (
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Add a description..."
                rows={4}
                className="w-full text-sm bg-zinc-800 text-zinc-200 rounded-lg px-3 py-2 border border-zinc-700 focus:border-purple-500 focus:outline-none resize-none"
              />
            ) : task.description ? (
              <p className="text-zinc-200 text-sm whitespace-pre-wrap">{task.description}</p>
            ) : (
              <p className="text-zinc-500 text-sm italic">No description provided.</p>
            )}
          </div>

          {/* Tags */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Tags</h3>
            {isEditing ? (
              <input
                type="text"
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                placeholder="tag1, tag2, tag3"
                className="w-full text-sm bg-zinc-800 text-zinc-200 rounded-lg px-3 py-2 border border-zinc-700 focus:border-purple-500 focus:outline-none"
              />
            ) : task.tags && task.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <span key={tag} className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-300">
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm italic">No tags.</p>
            )}
          </div>

          {/* Timestamps */}
          <div className="text-xs text-zinc-500 space-y-1 mb-4">
            <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
            <p>Updated: {new Date(task.updatedAt).toLocaleString()}</p>
          </div>

          {/* History */}
          {task.history && task.history.length > 0 && !isEditing && (
            <div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300 transition"
              >
                <History className="w-4 h-4" />
                {showHistory ? 'Hide' : 'Show'} History ({task.history.length})
              </button>
              {showHistory && (
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                  {task.history.slice().reverse().map((entry, i) => (
                    <div key={i} className="text-xs text-zinc-500 bg-zinc-800/50 rounded p-2">
                      <span className="text-zinc-400">{entry.field}</span> changed from{' '}
                      <span className="text-red-400/70">"{entry.oldValue || '(empty)'}"</span> to{' '}
                      <span className="text-emerald-400/70">"{entry.newValue || '(empty)'}"</span>
                      <br />
                      <span className="text-zinc-600">{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-zinc-800 bg-zinc-900/50">
          {isEditing ? (
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveChanges}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm font-medium flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition text-sm font-medium"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
