# Webhook Testing Guide

## 🧪 Local Testing

### Prerequisites
- Dashboard running locally: `npm run dev`
- ngrok installed and authenticated
- curl or Postman available
- Firestore project accessible

---

## Test 1: Health Check (No Authentication Required)

### What It Tests
- Endpoint is accessible
- Server is running
- Route is properly configured

### Command
```bash
curl -X GET http://localhost:3000/api/webhooks/github
```

### Expected Response (200 OK)
```json
{
  "status": "webhook endpoint active",
  "endpoint": "/api/webhooks/github",
  "accepts": ["pull_request"],
  "actions": ["opened", "synchronize", "ready_for_review"]
}
```

### Troubleshooting
```bash
# If connection refused:
# 1. Is dashboard running? npm run dev
# 2. Is it running on port 3000? Check output

# If 404 Not Found:
# 1. Check route file exists: src/app/api/webhooks/github/route.ts
# 2. Run: npm run build (to verify TypeScript)
```

---

## Test 2: Invalid Signature (401 Test)

### What It Tests
- Signature validation is working
- Invalid signatures are rejected

### Command
```bash
curl -X POST http://localhost:3000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=invalid" \
  -d '{"action":"opened","pull_request":{"number":123,"title":"Test"}}'
```

### Expected Response (401 Unauthorized)
```json
{
  "error": "Invalid signature"
}
```

### Troubleshooting
```bash
# If you get 200 OK instead of 401:
# GITHUB_WEBHOOK_SECRET is not set in .env.local
# Add it: GITHUB_WEBHOOK_SECRET=ic4Cy01mjsrpBT3SXdUe7ufwJonx6kWb
```

---

## Test 3: Valid PR Opened Event

### What It Tests
- Proper signature validation
- Webhook can parse PR events
- Firestore logging works

### Step 1: Generate Signature

```bash
SECRET="ic4Cy01mjsrpBT3SXdUe7ufwJonx6kWb"
PAYLOAD='{"action":"opened","pull_request":{"number":123,"title":"Add authentication feature","draft":false,"state":"open","html_url":"https://github.com/TimmTechProjects/fe-MFV/pull/123","user":{"login":"testuser"}}}'

# Generate HMAC SHA256 signature
# Windows PowerShell:
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($SECRET)
$hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($PAYLOAD))
$signature = "sha256=" + [System.BitConverter]::ToString($hash).Replace("-","").ToLower()
echo $signature

# macOS/Linux:
openssl dgst -sha256 -hmac "$SECRET" <<< "$PAYLOAD" | sed 's/^.*= /sha256=/'
```

### Step 2: Send Request

```bash
# Replace SIGNATURE with the generated signature from above
curl -X POST http://localhost:3000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: SIGNATURE" \
  -d "$PAYLOAD"
```

### Expected Response (200 OK)
```json
{
  "success": true,
  "message": "Activity logged",
  "pr": {
    "prNumber": 123,
    "prTitle": "Add authentication feature",
    "prUrl": "https://github.com/TimmTechProjects/fe-MFV/pull/123",
    "author": "testuser",
    "action": "opened",
    "draft": false,
    "state": "open"
  }
}
```

### Verification in Firestore

1. Open Firebase Console
2. Go to Firestore Database
3. Check `activity` collection
4. Should see new document:
   ```
   {
     action: "PR Opened"
     taskTitle: "Add authentication feature"
     details: "#123 - https://github.com/TimmTechProjects/fe-MFV/pull/123"
     source: "github-webhook"
     timestamp: <server timestamp>
   }
   ```

---

## Test 4: PR Ready for Review Event

### Payload
```bash
SECRET="ic4Cy01mjsrpBT3SXdUe7ufwJonx6kWb"
PAYLOAD='{"action":"ready_for_review","pull_request":{"number":456,"title":"Refactor database layer","draft":false,"state":"open","html_url":"https://github.com/TimmTechProjects/fe-MFV/pull/456","user":{"login":"developer"}}}'

# Generate signature (use method from Test 3)
SIGNATURE="sha256=<generated>"

curl -X POST http://localhost:3000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: $SIGNATURE" \
  -d "$PAYLOAD"
```

### Expected Activity
```
action: "PR Ready for Review"
taskTitle: "Refactor database layer"
details: "#456 - https://..."
```

---

## Test 5: PR Updated Event (New Commit)

### Payload
```bash
SECRET="ic4Cy01mjsrpBT3SXdUe7ufwJonx6kWb"
PAYLOAD='{"action":"synchronize","pull_request":{"number":789,"title":"Update API docs","draft":false,"state":"open","html_url":"https://github.com/TimmTechProjects/fe-MFV/pull/789","user":{"login":"docs-author"}}}'

# Generate signature and send (use method from Test 3)
```

### Expected Activity
```
action: "PR Updated"
taskTitle: "Update API docs"
```

---

## Test 6: Real PR Event from GitHub

### Prerequisites
- Dashboard deployed to public URL (or ngrok tunnel running)
- GitHub webhook configured

### Steps

1. **Create test branch:**
   ```bash
   cd C:\Users\JzTimm\Desktop\MFV\fe-floralvault
   git checkout -b test/webhook-integration
   echo "# Webhook Test" > WEBHOOK_TEST.md
   git add WEBHOOK_TEST.md
   git commit -m "Test webhook integration"
   git push origin test/webhook-integration
   ```

2. **Create PR on GitHub:**
   - Go to: https://github.com/TimmTechProjects/fe-MFV/pulls
   - Click "New Pull Request"
   - Select `test/webhook-integration` as compare
   - Click "Create Pull Request"

3. **Check GitHub webhook delivery:**
   - Go to: https://github.com/TimmTechProjects/fe-MFV/settings/hooks
   - Click your webhook
   - Scroll to "Recent Deliveries"
   - Should see your PR event with ✅ 200 OK
   - Click it to see full request/response

4. **Verify in Dashboard:**
   - Open Iris Dashboard in browser
   - Check Activity feed (right sidebar)
   - Should see: "PR Opened - Test webhook integration"
   - Should appear within 2-5 seconds

5. **Verify in Firestore:**
   - Firebase Console > Firestore
   - Check `activity` collection
   - Should see entry with `source: "github-webhook"`

---

## Test 7: Task Auto-Logging (Dashboard)

### What It Tests
- Task creation triggers activity logging
- Status changes are tracked
- Local activity persistence works

### Steps

1. **Create a task:**
   - Open Iris Dashboard
   - Click "Add Task" in any column
   - Enter title: "Test Task"
   - Click "Create"

2. **Verify activity:**
   - Check Activity feed
   - Should see: "Created - Test Task"

3. **Move task:**
   - Drag task to another column
   - Check Activity feed
   - Should see: "Moved - Test Task from Backlog -> In Progress"

4. **Verify Firestore:**
   - Check `activity` collection
   - Should have 2+ entries with `source: "dashboard"`

---

## Test 8: Stress Test (Multiple Events)

### What It Tests
- Webhook handles multiple rapid requests
- Firestore keeps up with activity logging
- UI updates correctly

### Command
```bash
# Send 5 PR events rapidly
for i in {1..5}; do
  PAYLOAD="{\"action\":\"opened\",\"pull_request\":{\"number\":$((1000+i)),\"title\":\"PR $i\",\"draft\":false,\"state\":\"open\",\"html_url\":\"https://github.com/TimmTechProjects/fe-MFV/pull/$((1000+i))\",\"user\":{\"login\":\"user$i\"}}}"
  
  # Generate signature for each payload
  SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "ic4Cy01mjsrpBT3SXdUe7ufwJonx6kWb" | sed 's/^.*= /sha256=/')
  
  # Send request
  curl -X POST http://localhost:3000/api/webhooks/github \
    -H "Content-Type: application/json" \
    -H "x-hub-signature-256: $SIGNATURE" \
    -d "$PAYLOAD" &
done

wait  # Wait for all background jobs
```

### Expected Results
- All requests return 200 OK
- Dashboard shows all 5 activities
- Firestore has 5 new entries
- No duplicate activities
- No errors in logs

---

## Test 9: Invalid Payload Test

### What It Tests
- Endpoint handles malformed JSON
- Invalid payloads are rejected safely

### Command
```bash
curl -X POST http://localhost:3000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=somesig" \
  -d '{"invalid": "json"'
```

### Expected Response (400 Bad Request)
```json
{
  "error": "Invalid JSON"
}
```

---

## Test 10: No Events Payload

### What It Tests
- Non-PR events are ignored gracefully

### Command
```bash
SECRET="ic4Cy01mjsrpBT3SXdUe7ufwJonx6kWb"
PAYLOAD='{"action":"opened","issue":{"number":123,"title":"Issue"}}'

# Generate signature and send
SIGNATURE="sha256=..."
curl -X POST http://localhost:3000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: $SIGNATURE" \
  -d "$PAYLOAD"
```

### Expected Response (200 OK)
```json
{
  "success": true,
  "message": "Not a PR event"
}
```

**Note:** No activity is logged for non-PR events

---

## Debugging Tools

### View Server Logs
```bash
# Terminal 1: Start dashboard with logging
npm run dev

# Watch for webhook logs
# Look for: "[GitHub Webhook]" messages
```

### Check Firestore Activity in Real-Time
```bash
# Firebase CLI (if installed)
firebase firestore:query activity --limit 10
```

### Test Signature Generation (Node.js)
```bash
node << 'EOF'
const crypto = require('crypto');
const secret = "ic4Cy01mjsrpBT3SXdUe7ufwJonx6kWb";
const payload = '{"action":"opened","pull_request":{"number":123,"title":"Test","draft":false,"state":"open","html_url":"https://...","user":{"login":"test"}}}';
const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
console.log('sha256=' + signature);
EOF
```

---

## Postman Collection

You can import this collection into Postman:

```json
{
  "info": {
    "name": "Iris Dashboard Webhooks",
    "description": "Test collection for webhook endpoints"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:3000/api/webhooks/github",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "webhooks", "github"]
        }
      }
    },
    {
      "name": "PR Opened (Valid Signature)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "x-hub-signature-256",
            "value": "sha256={{signature}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{{pr_opened_payload}}"
        },
        "url": {
          "raw": "http://localhost:3000/api/webhooks/github",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "webhooks", "github"]
        }
      }
    }
  ]
}
```

---

## Success Criteria for Each Test

| Test | Success Criteria |
|------|-----------------|
| Health Check | 200 OK, endpoint info returned |
| Invalid Signature | 401 Unauthorized |
| Valid Signature | 200 OK, activity logged |
| PR Opened | Activity appears, Firestore entry created |
| PR Ready | Activity with correct action type |
| PR Updated | "PR Updated" activity logged |
| Real PR | Activity shows in UI within 2-5s |
| Task Creation | Dashboard activity appears instantly |
| Task Movement | Status change logged |
| Stress Test | All requests succeed, no duplicates |

---

## Common Test Errors and Fixes

| Error | Likely Cause | Fix |
|-------|-------------|-----|
| `ECONNREFUSED` | Dashboard not running | `npm run dev` |
| `404 Not Found` | Route not deployed | `npm run build` |
| `401 Unauthorized` | Secret mismatch | Check `.env.local` |
| `Invalid JSON` | Malformed payload | Verify JSON syntax |
| No Firestore activity | No write permission | Check Firestore rules |
| Duplicate activities | Multiple webhook fires | Check GitHub settings |

---

## Quick Test Commands (Copy & Paste)

### Windows PowerShell
```powershell
# Health check
Invoke-WebRequest -Uri "http://localhost:3000/api/webhooks/github" -Method Get

# Invalid signature test
$body = '{"action":"opened","pull_request":{"number":123,"title":"Test","draft":false,"state":"open","html_url":"https://github.com/TimmTechProjects/fe-MFV/pull/123","user":{"login":"test"}}}'
Invoke-WebRequest -Uri "http://localhost:3000/api/webhooks/github" `
  -Method Post `
  -Headers @{"x-hub-signature-256"="sha256=invalid";"Content-Type"="application/json"} `
  -Body $body
```

### macOS/Linux bash
```bash
# Health check
curl http://localhost:3000/api/webhooks/github

# Invalid signature test
curl -X POST http://localhost:3000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=invalid" \
  -d '{"action":"opened","pull_request":{"number":123,"title":"Test","draft":false,"state":"open","html_url":"https://github.com/TimmTechProjects/fe-MFV/pull/123","user":{"login":"test"}}}'
```

---

## Next Steps After Testing

1. ✅ All local tests pass → Deploy dashboard
2. ✅ Dashboard deployed → Add GitHub webhook
3. ✅ Webhook added → Create real PR to test
4. ✅ Real PR works → Monitor production
5. ✅ Everything working → Document results

