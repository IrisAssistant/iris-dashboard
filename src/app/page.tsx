import { KanbanBoard } from '@/components/KanbanBoard';

export default function Home() {
  return (
    <main className="min-h-screen p-6">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🔮</span>
          <h1 className="text-2xl font-bold">Iris Dashboard</h1>
        </div>
        <p className="text-sm text-[var(--muted)]">
          Track progress, manage tasks, stay organized.
        </p>
      </header>
      
      <KanbanBoard />
    </main>
  );
}
