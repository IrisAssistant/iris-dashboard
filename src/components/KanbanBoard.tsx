'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { KanbanState, Task, Column } from '@/types/kanban';
import { loadState, saveState, createTask, createActivity } from '@/lib/kanban-store';

export function KanbanBoard() {
  const [state, setState] = useState<KanbanState | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { setState(loadState()); }, []);
  useEffect(() => { if (state) saveState(state); }, [state]);

  if (!state) return <div className="text-gray-500">Loading...</div>;

  const handleAddTask = (columnId: string) => {
    if (!newTaskTitle.trim()) return;
    const task = createTask(newTaskTitle);
    const activity = createActivity('created', newTaskTitle);
    setState(prev => {
      if (!prev) return prev;
      const colIndex = prev.columns.findIndex(c => c.id === columnId);
      const newColumns = [...prev.columns];
      newColumns[colIndex] = { ...newColumns[colIndex], tasks: [task, ...newColumns[colIndex].tasks] };
      return { columns: newColumns, activity: [activity, ...prev.activity].slice(0, 100) };
    });
    setNewTaskTitle('');
  };

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    const activity = createActivity('deleted', taskTitle);
    setState(prev => {
      if (!prev) return prev;
      const newColumns = prev.columns.map(col => ({ ...col, tasks: col.tasks.filter(t => t.id !== taskId) }));
      return { columns: newColumns, activity: [activity, ...prev.activity].slice(0, 100) };
    });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners}>
      <div className="flex gap-4">
        {state.columns.map(column => (
          <div key={column.id} className="w-72 bg-zinc-900 rounded-lg p-4">
            <h2 className="font-bold text-white mb-3">{column.title} ({column.tasks.length})</h2>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTask(column.id)}
                placeholder="New task..."
                className="flex-1 px-2 py-1 bg-zinc-800 rounded text-sm text-white"
              />
              <button onClick={() => handleAddTask(column.id)} className="px-2 py-1 bg-green-600 rounded text-sm text-white">+</button>
            </div>
            <div className="space-y-2">
              {column.tasks.map(task => (
                <div key={task.id} className="bg-zinc-800 p-3 rounded group">
                  <div className="flex justify-between items-start">
                    <span className="text-white text-sm">{task.title}</span>
                    <button onClick={() => handleDeleteTask(task.id, task.title)} className="text-red-400 text-xs opacity-0 group-hover:opacity-100">x</button>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${task.priority === 'high' ? 'bg-red-500/30 text-red-400' : task.priority === 'medium' ? 'bg-yellow-500/30 text-yellow-400' : 'bg-blue-500/30 text-blue-400'}`}>{task.priority}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="w-72 bg-zinc-900/50 rounded-lg p-4">
          <h2 className="font-bold text-white mb-3">Activity</h2>
          <div className="space-y-2 text-xs text-gray-400">
            {state.activity.slice(0, 20).map(a => (
              <div key={a.id}>{a.taskTitle} {a.action}</div>
            ))}
          </div>
        </div>
      </div>
    </DndContext>
  );
}
