'use client';

import { Clock, Trash2 } from 'lucide-react';
import { ActivityItem } from '@/types/kanban';

interface ActivityLogProps {
  activities: ActivityItem[];
  onClear: () => void;
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

export function ActivityLog({ activities, onClear }: ActivityLogProps) {
  return (
    <aside className="w-80 border-l border-zinc-800 bg-zinc-950 px-4 py-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-200">Activity</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-zinc-500 hover:text-zinc-200 flex items-center gap-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-sm text-zinc-600 border border-dashed border-zinc-800 rounded-lg p-4 text-center">
          No activity yet
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((item) => (
            <div key={item.id} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-zinc-200">
                    {item.action} <span className="font-semibold">{item.taskTitle}</span>
                  </p>
                  {item.details ? (
                    <p className="text-xs text-zinc-500 mt-1">{item.details}</p>
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
  );
}
