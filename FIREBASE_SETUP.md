# Firebase Backend Setup - Complete ✅

## What Iris Set Up

### Firebase Project
- **Project Name:** iris-dashboard
- **Project ID:** iris-dashboard-c7ddd
- **Owner:** iris.b.assistant@gmail.com (Iris's Google account)

### Services Enabled
1. **Firestore Database** - for storing tasks, columns, and activity log
   - Location: nam5 (United States)
   - Mode: Test mode (open for 30 days until 2026-03-07)
   
2. **Google Analytics** - for usage tracking

3. **Web App** - iris-dashboard-web

## Files Created

1. `src/lib/firebase.ts` - Firebase initialization and config
2. `src/lib/firestore-storage.ts` - Firestore CRUD operations for Kanban data
3. Updated `package.json` - Added firebase dependency

## To Deploy the Changes

### Step 1: Install Firebase package
```bash
cd C:\Users\JzTimm\Desktop\iris-dashboard
npm install
```

### Step 2: Deploy to Vercel
Push changes to your Vercel-connected repo, or run:
```bash
vercel --prod
```

### Step 3: Test
Visit https://iris-dashboard-iota.vercel.app/ and:
- Add a task
- Move it between columns
- Refresh the page - data should persist!

## Firebase Console Access
- URL: https://console.firebase.google.com/project/iris-dashboard-c7ddd
- Login: iris.b.assistant@gmail.com / Irispass2026!

## Next Steps (Optional)
- [ ] Add Authentication (so only you can access the board)
- [ ] Update security rules before test mode expires (March 7, 2026)
- [ ] Connect Iris to update the board programmatically

## Data Structure in Firestore

### Collection: kanban-boards
```
{
  columns: KanbanColumn[],
  updatedAt: Timestamp
}
```

### Collection: activity-log
```
{
  action: string,
  details: string,
  timestamp: Timestamp
}
```
