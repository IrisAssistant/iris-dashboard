# Iris Dashboard Webhook Implementation Guide

## ✅ Completed Setup

### 1. Dashboard Webhook Endpoint
**Status:** ✅ Complete

**Created:** `/src/app/api/webhooks/github/route.ts`

**Features:**
- Receives GitHub pull request events via POST
- Validates webhook signatures using HMAC SHA256
- Parses PR information (number, title, URL, author, action)
- Logs activities to Firestore `activity` collection
- Handles three PR actions:
  - `opened` → "PR Opened"
  - `synchronize` → "PR Updated"
  - `ready_for_review` → "PR Ready for Review"

**Endpoint Details:**
```
POST /api/webhooks/github
Headers: X-Hub-Signature-256: sha256=<signature>
Body: GitHub webhook payload
Response: { success: true, message: "Activity logged", pr: {...} }
```

**Environment Configuration:**
```env
GITHUB_WEBHOOK_SECRET=ic4Cy01mjsrpBT3SXdUe7ufwJonx6kWb
GITHUB_REPO_OWNER=TimmTechProjects
GITHUB_REPO_NAME=fe-MFV
```

### 2. Task Auto-Logging
**Status:** ✅ Complete

**Implementation:** KanbanBoard component (src/components/KanbanBoard.tsx)

**Tracked Events:**
- ✅ Task creation: `logActivity('Created', taskTitle)`
- ✅ Task deletion: `logActivity('Deleted', taskTitle)`
- ✅ Task updates: `logActivity('Updated', taskTitle)`
- ✅ Status changes: `logActivity('Moved', taskTitle, fromStatus → toStatus)`

**Example Activity Entry:**
```typescript
{
  id: "uuid",
  action: "Created",
  taskTitle: "Add authentication",
  timestamp: "2026-02-07T19:29:00Z",
  source: "dashboard"
}
```

### 3. Firestore Activity Collection
**Status:** ✅ Complete

**Location:** Firebase project `iris-dashboard-c7ddd`
**Collection:** `activity`
**Schema:**
```typescript
{
  action: string;        // "Created", "Updated", "Moved", "PR Opened", etc.
  taskTitle: string;     // Task or PR title
  details?: string;      // Additional info (timestamps, URLs, etc.)
  source: string;        // "dashboard" or "github-webhook"
  timestamp: Timestamp;  // Firestore server timestamp
}
```

**Automatic Features:**
- Real-time sync via `subscribeToActivity()` hook
- Display in ActivityLog component
- Latest 50 activities cached
- Custom event dispatching for UI updates

### 4. GitHub Utility Library
**Status:** ✅ Complete

**Created:** `/src/lib/github.ts`

**Exports:**
- `generateGitHubSignature()` - Create test signatures
- `createMockPRPayload()` - Generate test payloads
- `formatPRActivityMessage()` - Format messages
- `extractPRInfo()` - Parse webhook data
- `WEBHOOK_TEST_CASES` - Test data scenarios

---

## 🔧 GitHub Webhook Configuration (To Complete)

### What You Need to Do

You need to set up the webhook in the **TimmTechProjects/fe-MFV** GitHub repository.

### Step-by-Step Instructions

#### 1. Determine Your Public URL

First, you need to know where your dashboard is deployed:

**Option A: Production Deployment**
```
https://your-production-domain.com
```

**Option B: Local Testing with ngrok**
```bash
# Install ngrok from https://ngrok.com/download
# Run your dashboard locally
npm run dev

# In another terminal, create a tunnel
ngrok http 3000
# This gives you: https://xxxx-xxxx-xxxx-xxxx.ngrok.io
```

#### 2. Add GitHub Webhook

1. Navigate to: **https://github.com/TimmTechProjects/fe-MFV/settings/hooks**

2. Click **"Add webhook"** button

3. Fill in the webhook settings:

| Field | Value |
|-------|-------|
| **Payload URL** | `https://your-domain-here.com/api/webhooks/github` |
| **Content type** | `application/json` |
| **Secret** | `ic4Cy01mjsrpBT3SXdUe7ufwJonx6kWb` |

4. Under **"Which events would you like to trigger this webhook?"**:
   - Click **"Let me select individual events"**
   - ✅ Check **Pull requests**
   - ✅ Uncheck everything else

5. Make sure **Active** is checked ✅

6. Click **"Add webhook"**

#### 3. Test the Webhook

GitHub automatically sends a test delivery:

1. On the webhook settings page, scroll to **"Recent Deliveries"**
2. You should see one delivery
3. Click it to see response: `{"success": true, "message": "Not a PR event"}`
4. If you see `401 Unauthorized`, the secret doesn't match

#### 4. Real-World Test

Create a new pull request on the fe-MFV repository:

1. Open any PR (create one or use existing)
2. Open your Iris Dashboard
3. Check the **Activity** feed on the right side
4. You should see: **"PR Opened"** with PR title and link

---

## 📊 Testing the Complete Workflow

### Test Scenario 1: Create a PR

```bash
# 1. Clone the repo and create a branch
cd C:\Users\JzTimm\Desktop\MFV\fe-floralvault
git checkout -b test/webhook-integration
echo "# Test PR" > TEST.md
git add TEST.md
git commit -m "Test webhook integration"
git push origin test/webhook-integration

# 2. Create PR on GitHub (via web UI)
# Navigate to: https://github.com/TimmTechProjects/fe-MFV/pulls
# Click "New Pull Request"
# Select your test branch
# Click "Create Pull Request"

# 3. Check Iris Dashboard
# Look for new activity: "PR Opened - Test PR Title"
```

**Expected Result:**
- Activity appears in dashboard within 5 seconds
- Firestore shows new entry in `activity` collection
- Activity includes PR number and link

### Test Scenario 2: Update a PR (push new commit)

```bash
# 1. Make another commit to your PR branch
echo "# More changes" >> TEST.md
git add TEST.md
git commit -m "Add more changes"
git push origin test/webhook-integration

# 2. Check Iris Dashboard
# Look for: "PR Updated - Test PR Title"
```

### Test Scenario 3: Mark PR as Ready for Review

If the PR was created as draft:

```bash
# 1. Go to PR on GitHub
# Click "Ready for review" button

# 2. Check Iris Dashboard
# Look for: "PR Ready for Review - Test PR Title"
```

### Test Scenario 4: Task Management Auto-Logging

```
1. Open Iris Dashboard
2. Click "Add Task" in any column
3. Enter task title and click "Create"
4. Watch activity feed: "Created - [Task Title]"
5. Drag task to another column
6. Watch activity feed: "Moved - [Task Title] from [Status] -> [Status]"
```

---

## 🔍 Debugging Guide

### Issue: Webhook Not Triggering

**Check:**
```bash
# 1. Is the dashboard running and accessible?
curl https://your-domain.com/api/webhooks/github
# Should return 200 OK with webhook info

# 2. Check GitHub webhook delivery logs
# Go to: Settings > Webhooks > [Your Webhook] > Recent Deliveries
# Look for the test delivery - should be green (200 OK)
# Click on it to see the full request/response
```

**Solutions:**
- Verify **Payload URL** is correct and accessible
- Check **Secret** matches exactly
- Ensure webhook is **Active** (checkbox checked)
- Verify **Events** include "Pull requests"

### Issue: Invalid Signature Error (401)

**Check:**
```bash
# The secret in GitHub settings doesn't match the code
# GitHub secret: Settings > Webhooks > [Webhook] > Secret
# Code secret: .env.local GITHUB_WEBHOOK_SECRET
```

**Solution:**
1. Get the actual secret from GitHub webhook settings
2. Update `.env.local`:
   ```env
   GITHUB_WEBHOOK_SECRET=your-actual-secret
   ```
3. Restart the dashboard
4. Re-deliver the webhook from GitHub settings

### Issue: Activities Not Appearing in Dashboard

**Check:**
```bash
# 1. Verify Firestore connection
# Open browser DevTools > Console
# Should not see "Failed to connect to database"

# 2. Check Firestore rules
# Go to: Firebase Console > Firestore > Rules
# Verify rules allow writes to 'activity' collection

# 3. Manually trigger activity
# Click "Add Task" in dashboard
# Check if activity appears (tests local logging)
```

**Firestore Rules (allow writes):**
```
match /activity/{document=**} {
  allow read, write: if true;
}
```

### Issue: Can't Access Dashboard Locally

**Solution: Use ngrok**
```bash
# 1. Install ngrok: https://ngrok.com/download

# 2. Get ngrok token and authenticate
ngrok config add-authtoken YOUR_TOKEN

# 3. Start tunnel to your local dashboard
ngrok http 3000

# 4. Copy the HTTPS URL (e.g., https://xxxx-xxxx-xxxx.ngrok.io)

# 5. Update GitHub webhook Payload URL to the ngrok URL

# 6. Test webhook delivery in GitHub settings
```

---

## 📋 Verification Checklist

Before considering setup complete:

- [ ] Webhook endpoint created at `/api/webhooks/github`
- [ ] Environment variables configured in `.env.local`
- [ ] GitHub webhook added to TimmTechProjects/fe-MFV
- [ ] Webhook Payload URL points to dashboard
- [ ] Webhook Secret configured correctly
- [ ] Pull requests event selected in GitHub
- [ ] Webhook Active toggle is enabled
- [ ] Test webhook delivery shows 200 OK
- [ ] Created test PR and saw activity in dashboard
- [ ] Activity appears in Firestore `activity` collection
- [ ] Task creation/updates auto-log in dashboard
- [ ] Dashboard displays activities in real-time

---

## 🚀 Deployment Notes

### Production Deployment

When deploying to production:

1. **Update Webhook URL in GitHub:**
   ```
   https://your-production-domain.com/api/webhooks/github
   ```

2. **Ensure Environment Variables:**
   ```bash
   # On your production server
   export GITHUB_WEBHOOK_SECRET=ic4Cy01mjsrpBT3SXdUe7ufwJonx6kWb
   ```

3. **Test Webhook:**
   - Create PR on GitHub
   - Verify activity appears
   - Check Firestore logs

4. **Monitor:**
   - Watch GitHub webhook Recent Deliveries for errors
   - Monitor Firestore for activity entries
   - Set up alerts for webhook failures

### Local Development

For local testing:

```bash
# Terminal 1: Run dashboard
cd C:\Users\JzTimm\Desktop\iris-dashboard
npm run dev
# Starts at http://localhost:3000

# Terminal 2: Create ngrok tunnel
ngrok http 3000
# Creates https://xxxx-xxxx-xxxx.ngrok.io

# Terminal 3: Watch logs
tail -f ~/.ngrok2/ngrok.log
```

---

## 📚 File Reference

### Created Files

1. **`src/app/api/webhooks/github/route.ts`**
   - Main webhook endpoint
   - Signature validation
   - Firestore logging

2. **`src/lib/github.ts`**
   - Helper utilities
   - Test payload generators
   - Signature generators

3. **`WEBHOOK_SETUP.md`**
   - Complete setup guide
   - Testing instructions
   - Troubleshooting

4. **`.env.example`**
   - Environment variable template
   - Webhook configuration

5. **`.env.local`**
   - Webhook secret (generated)
   - Repository info

### Modified Files

1. **`src/components/KanbanBoard.tsx`**
   - Already has task auto-logging
   - Uses `addActivity()` from storage
   - Logs: Created, Deleted, Updated, Moved

---

## 🔗 Resource Links

- **GitHub Webhook Docs:** https://docs.github.com/en/developers/webhooks-and-events/webhooks/about-webhooks
- **Firebase Firestore:** https://firebase.google.com/docs/firestore
- **Next.js API Routes:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **ngrok Documentation:** https://ngrok.com/docs

---

## Summary

**What's Ready:**
- ✅ Webhook endpoint (Next.js API route)
- ✅ Signature validation
- ✅ Firestore integration
- ✅ Activity logging
- ✅ Task auto-logging
- ✅ Real-time dashboard updates

**What You Need to Do:**
1. Access the GitHub repository settings
2. Add webhook with provided URL and secret
3. Test with a real PR event
4. Verify activity appears in dashboard

**Expected Behavior:**
When a PR event occurs on GitHub → Dashboard logs it → Activity appears in real-time → Developers see PR activity in dashboard feed

