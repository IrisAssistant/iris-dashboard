'use client';

import { useState } from 'react';
import { Clock, Trash2, X, Activity } from 'lucide-react';
import { ActivityItem } from '@/types/kanban';

interface ActivityLogProps {
  activities: ActivityItem[];
  onClear: () => void;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = Math.max(now - then, 0);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ActivityLog({ activities, onClear, isOpen, onToggle }: ActivityLogProps) {

  return (
    <>
      {/* Mobile toggle button - Always rendered, always accessible */}
      <button
        onClick={() => onToggle(true)}
        className="lg:hidden fixed bottom-4 right-4 z-40 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-colors"
        aria-label="Open activity log"
      >
        <Activity className="h-5 w-5" />
        {activities.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {activities.length > 9 ? '9+' : activities.length}
          </span>
        )}
      </button>

      {/* Mobile overlay - Closes when clicked */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => onToggle(false)}
        />
      )}

      {/* Activity panel */}
      <aside className={`
        fixed lg:relative inset-y-0 right-0 z-50
        w-80 max-w-[85vw] border-l border-zinc-800 bg-zinc-950 px-4 py-5
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-200">Activity</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-zinc-500 hover:text-zinc-200 flex items-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
            <button
              onClick={() => onToggle(false)}
              className="lg:hidden text-zinc-500 hover:text-zinc-200 p-1"
              aria-label="Close activity log"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="text-sm text-zinc-600 border border-dashed border-zinc-800 rounded-lg p-4 text-center">
            No activity yet
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-100px)]">
            {activities.map((item) => (
              <div key={item.id} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-200">
                      {item.action} <span className="font-semibold truncate">{item.taskTitle}</span>
                    </p>
                    {item.details ? (
                      <p className="text-xs text-zinc-500 mt-1 truncate">{item.details}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-500 shrink-0">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(item.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>
    </>
  );
}
