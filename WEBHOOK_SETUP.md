# GitHub Webhook Setup Guide

## Overview

This guide covers the complete webhook infrastructure for the Iris Dashboard:

1. **GitHub Webhook** → Captures PR events (opened, synchronize, ready_for_review)
2. **Dashboard Webhook Endpoint** → `/api/webhooks/github` receives and logs events
3. **Firestore Activity Logging** → All events are logged to the `activity` collection
4. **Task Auto-Logging** → Task creation and status changes are automatically logged

---

## Part 1: Dashboard Setup (Already Complete)

### Webhook Endpoint

The webhook endpoint is configured at: `src/app/api/webhooks/github/route.ts`

**Endpoint Details:**
- **URL:** `https://your-dashboard-domain.com/api/webhooks/github`
- **Method:** `POST`
- **Accepts:** Pull request events
- **Actions:** `opened`, `synchronize`, `ready_for_review`
- **Authentication:** GitHub webhook signature validation (SHA256)

**Environment Variables (in `.env.local`):**
```env
GITHUB_WEBHOOK_SECRET=ic4Cy01mjsrpBT3SXdUe7ufwJonx6kWb
GITHUB_REPO_OWNER=TimmTechProjects
GITHUB_REPO_NAME=fe-MFV
```

### Activity Logging

Activities are automatically logged to Firestore `activity` collection:
- **Format:** `{ action, taskTitle, details, source, timestamp }`
- **Source:** `github-webhook` for PR events, `dashboard` for task changes
- **Collection:** `activity` in Firebase project `iris-dashboard-c7ddd`

### Task Auto-Logging

The KanbanBoard component automatically logs:
- **Task Creation:** `"Created [taskTitle]"`
- **Task Deletion:** `"Deleted [taskTitle]"`
- **Task Updates:** `"Updated [taskTitle]"`
- **Status Changes:** `"Moved [taskTitle] from [oldStatus] -> [newStatus]"`

---

## Part 2: GitHub Webhook Setup

### Step 1: Get Your Dashboard URL

You need the public URL where your dashboard is deployed. This should be:
```
https://your-dashboard-domain.com
```

For local testing with ngrok:
```bash
ngrok http 3000
# Then use: https://your-ngrok-url.ngrok.io
```

### Step 2: Configure GitHub Webhook

1. Go to the GitHub repository: **TimmTechProjects/fe-MFV**
2. Navigate to **Settings** → **Webhooks**
3. Click **Add webhook**

**Configure the webhook with these settings:**

| Setting | Value |
|---------|-------|
| **Payload URL** | `https://your-dashboard-domain.com/api/webhooks/github` |
| **Content type** | `application/json` |
| **Secret** | `ic4Cy01mjsrpBT3SXdUe7ufwJonx6kWb` |
| **Which events?** | Select "Let me select individual events" |
| **Events to trigger on** | Check only **Pull requests** |
| **Active** | ✅ Checked |

### Step 3: Verify Webhook Delivery

After setup, GitHub will test the webhook:

1. Go to the webhook settings page
2. Scroll to **Recent Deliveries**
3. You should see a test delivery with status `200 OK`
4. Click the delivery to see the response:
   ```json
   {
     "success": true,
     "message": "Not a PR event"
   }
   ```

---

## Part 3: Testing the Webhook

### Test 1: Health Check

```bash
curl -X GET https://your-dashboard-domain.com/api/webhooks/github
```

**Expected Response:**
```json
{
  "status": "webhook endpoint active",
  "endpoint": "/api/webhooks/github",
  "accepts": ["pull_request"],
  "actions": ["opened", "synchronize", "ready_for_review"]
}
```

### Test 2: Simulate PR Event

```bash
# Generate the signature
SECRET="ic4Cy01mjsrpBT3SXdUe7ufwJonx6kWb"
PAYLOAD='{"action":"opened","pull_request":{"number":123,"title":"Test PR","draft":false,"state":"open","html_url":"https://github.com/TimmTechProjects/fe-MFV/pull/123","user":{"login":"testuser"}}}'

# Calculate HMAC SHA256
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" -hex | cut -d' ' -f2)

# Send the request
curl -X POST https://your-dashboard-domain.com/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=$SIGNATURE" \
  -d "$PAYLOAD"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Activity logged",
  "pr": {
    "prNumber": 123,
    "prTitle": "Test PR",
    "prUrl": "https://github.com/TimmTechProjects/fe-MFV/pull/123",
    "author": "testuser",
    "action": "opened",
    "draft": false,
    "state": "open"
  }
}
```

### Test 3: Real PR Event

Create a PR on TimmTechProjects/fe-MFV repository:

1. Open the Iris Dashboard
2. Check the **Activity** feed on the right side
3. You should see the PR event logged:
   - **"PR Opened"** for newly opened PRs
   - **"PR Ready for Review"** when draft → ready transition
   - **"PR Updated"** for new commits

---

## Part 4: Activity Log Integration

### Firestore Structure

Activities are stored in the `activity` collection:

```
activity/
├── [doc_id_1]
│   ├── action: "PR Opened"
│   ├── taskTitle: "Add authentication feature"
│   ├── details: "#123 - https://github.com/..."
│   ├── source: "github-webhook"
│   └── timestamp: Timestamp
├── [doc_id_2]
│   ├── action: "Created"
│   ├── taskTitle: "Review PR #123"
│   ├── details: undefined
│   ├── source: "dashboard"
│   └── timestamp: Timestamp
```

### Querying Activities

From the dashboard's `src/lib/storage.ts`:

```typescript
// Activities are automatically fetched and cached
const activities = getActivity(); // Returns latest 50 activities

// Subscribe to real-time updates
subscribeToActivity((newActivities) => {
  console.log('Activity updated:', newActivities);
});
```

---

## Part 5: Troubleshooting

### Webhook Not Receiving Events

**Check:**
1. Is the dashboard deployed and accessible?
2. Is the webhook URL correct in GitHub settings?
3. Check GitHub webhook delivery logs for errors
4. Verify `GITHUB_WEBHOOK_SECRET` matches in both places

**Debug:**
```bash
# View webhook endpoint logs
tail -f dashboard-logs.log | grep "GitHub Webhook"

# Test signature validation with invalid secret
curl -X POST https://your-dashboard-domain.com/api/webhooks/github \
  -H "x-hub-signature-256: sha256=invalid" \
  -d '{"action":"opened","pull_request":{...}}'
# Should return 401 Unauthorized
```

### Activity Not Showing in Dashboard

**Check:**
1. Is Firebase connected? (Check for connection errors in browser console)
2. Is the activity collection in the correct Firebase project?
3. Verify Firestore security rules allow writes:
   ```
   match /activity/{document=**} {
     allow write: if true;
     allow read: if true;
   }
   ```

### PR Events Not Being Logged

**Check:**
1. Is the GitHub webhook active in the repo settings?
2. Are only the correct PR actions enabled? (opened, synchronize, ready_for_review)
3. Check Firestore activity collection for entries with `source: "github-webhook"`

---

## Deployment Checklist

Before deploying to production:

- [ ] Update `GITHUB_WEBHOOK_SECRET` in production `.env.local`
- [ ] Update webhook **Payload URL** in GitHub to production domain
- [ ] Test webhook delivery with real PR event
- [ ] Verify activity appears in Firestore
- [ ] Verify activity appears in dashboard UI
- [ ] Monitor logs for any webhook errors
- [ ] Set up log alerts for webhook failures

---

## API Routes Reference

### `/api/webhooks/github` - POST

**Request Headers:**
```
Content-Type: application/json
X-Hub-Signature-256: sha256=<hmac>
X-GitHub-Event: pull_request
```

**Request Body:**
```json
{
  "action": "opened|synchronize|ready_for_review",
  "pull_request": {
    "number": 123,
    "title": "PR Title",
    "draft": false,
    "state": "open",
    "html_url": "https://...",
    "user": { "login": "author" }
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Activity logged",
  "pr": {
    "prNumber": 123,
    "prTitle": "PR Title",
    "prUrl": "https://...",
    "author": "author",
    "action": "opened",
    "draft": false,
    "state": "open"
  }
}
```

**Response (Invalid Signature):**
```json
{
  "error": "Invalid signature"
}
```
Status: `401`

**Response (Not a PR Event):**
```json
{
  "success": true,
  "message": "Not a PR event"
}
```
Status: `200`

---

## Success Criteria

✅ GitHub webhook endpoint is active
✅ PR events are received and validated
✅ Activities appear in Firestore collection
✅ Activities are displayed in dashboard UI
✅ Task creation/updates are auto-logged
✅ Real-time updates work with Firebase subscriptions

