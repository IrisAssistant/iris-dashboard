'use client';

import { ActivityItem } from '@/types/kanban';
import { formatTimestamp } from '@/lib/kanban-store';
import { Activity, ArrowRight, Plus, Trash2 } from 'lucide-react';

interface ActivityLogProps {
  activities: ActivityItem[];
}

const actionIcons: Record<string, typeof Activity> = {
  created: Plus,
  moved: ArrowRight,
  deleted: Trash2,
};

export function ActivityLog({ activities }: ActivityLogProps) {
  return (
    <div className="w-72 shrink-0 border-l border-[var(--border)] pl-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-[var(--accent)]" />
        <h2 className="font-semibold text-sm">Activity</h2>
      </div>
      
      <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
        {activities.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">No activity yet</p>
        ) : (
          activities.slice(0, 50).map((item) => {
            const Icon = actionIcons[item.action] || Activity;
            return (
              <div key={item.id} className="flex gap-3 text-xs">
                <div className="mt-0.5">
                  <Icon size={12} className="text-[var(--muted)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--foreground)]">
                    <span className="font-medium">{item.taskTitle}</span>
                    {item.action === 'moved' && item.from && item.to && (
                      <span className="text-[var(--muted)]">
                        {' '}moved from {item.from} to {item.to}
                      </span>
                    )}
                    {item.action === 'created' && (
                      <span className="text-[var(--muted)]"> created</span>
                    )}
                    {item.action === 'deleted' && (
                      <span className="text-[var(--muted)]"> deleted</span>
                    )}
                  </p>
                  <p className="text-[var(--muted)] mt-0.5">
                    {formatTimestamp(item.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
