# Kanban Dashboard Build Instructions

Build a Next.js Kanban dashboard with these requirements:

## Tech Stack
- Next.js 16+ (already scaffolded)
- TypeScript
- Tailwind CSS
- @dnd-kit/core and @dnd-kit/sortable (already installed)
- lucide-react (already installed)

## Features Needed

### 1. Kanban Board
- 4 columns: Backlog, In Progress, Review, Done
- Drag and drop cards between columns
- Cards show: title, description, priority (color dot), tags

### 2. Task Cards
- Draggable with grip handle
- Delete button (appears on hover)
- Priority indicator: red=high, yellow=medium, green=low
- Tags as small pills

### 3. Add Task Modal
- Opens when clicking + on a column
- Fields: title, description, status, priority, tags (comma-separated)
- Creates task with unique ID

### 4. Activity Log Sidebar
- Right side panel, 320px wide
- Shows recent actions: "Created [task]", "Moved [task]", "Deleted [task]"
- Timestamps (relative: "2m ago", "1h ago")
- Clear button

### 5. Data Persistence
- Save to localStorage
- Load on mount with default sample tasks

## File Structure
```
src/
  types/kanban.ts      - Types: Task, Column, ActivityItem, TaskStatus, TaskPriority, COLUMNS array
  lib/storage.ts       - localStorage functions: getTasks, saveTasks, getActivity, addActivity, clearActivity
  components/
    KanbanBoard.tsx    - Main board with DndContext
    KanbanColumn.tsx   - Single column with droppable area
    KanbanCard.tsx     - Draggable task card
    ActivityLog.tsx    - Sidebar activity feed
    AddTaskModal.tsx   - Modal for creating tasks
  app/
    page.tsx           - Just renders <KanbanBoard />
    layout.tsx         - Basic layout
    globals.css        - Dark theme (zinc-950 background)
```

## Design
- Dark theme: zinc-950 background, zinc-800/900 cards
- Accent: emerald-500 for buttons/highlights
- Header with "🔮 Iris Dashboard" title
- Clean, minimal, professional

## Default Tasks
Include 3 sample tasks:
1. "Build Kanban Dashboard" - done, high priority, tag: iris
2. "Test PetListings.com" - backlog, medium priority, tag: petlistings  
3. "Review MFV codebase" - in-progress, high priority, tag: mfv

Build all components. Make sure everything works together. Use 'use client' where needed.
