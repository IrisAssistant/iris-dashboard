# Webhook Quick Start Card

## ⚡ TL;DR

Your webhook is ready! Just add it to GitHub.

### GitHub Webhook Settings

1. Go to: https://github.com/TimmTechProjects/fe-MFV/settings/hooks
2. Click **Add webhook**
3. Fill in:
   - **Payload URL:** `https://your-domain.com/api/webhooks/github`
   - **Content type:** `application/json`
   - **Secret:** `ic4Cy01mjsrpBT3SXdUe7ufwJonx6kWb`
4. Select events: **Pull requests** only
5. Click **Add webhook**
6. Create a test PR - you should see it in the dashboard Activity feed

---

## 🔑 Secrets & Keys

```env
GITHUB_WEBHOOK_SECRET=ic4Cy01mjsrpBT3SXdUe7ufwJonx6kWb
```

This is configured in: `.env.local`

---

## 📍 Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/webhooks/github` | GET | Health check |
| `/api/webhooks/github` | POST | Receive PR events |

### Health Check
```bash
curl https://your-domain.com/api/webhooks/github
```

**Response:**
```json
{
  "status": "webhook endpoint active",
  "endpoint": "/api/webhooks/github",
  "accepts": ["pull_request"],
  "actions": ["opened", "synchronize", "ready_for_review"]
}
```

---

## 🧪 Test with curl (Local)

```bash
# 1. Start ngrok tunnel
ngrok http 3000
# Copy the HTTPS URL

# 2. Generate test payload
DOMAIN="https://your-ngrok-url.ngrok.io"
SECRET="ic4Cy01mjsrpBT3SXdUe7ufwJonx6kWb"
PAYLOAD='{"action":"opened","pull_request":{"number":123,"title":"Test PR","draft":false,"state":"open","html_url":"https://github.com/TimmTechProjects/fe-MFV/pull/123","user":{"login":"testuser"}}}'

# 3. Generate signature
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)

# 4. Send request
curl -X POST $DOMAIN/api/webhooks/github \
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
    ...
  }
}
```

---

## 📊 What Gets Logged

When GitHub sends an event:

| GitHub Event | Dashboard Activity |
|--------------|-------------------|
| PR opened | "PR Opened" - #123 Title |
| Draft → Ready | "PR Ready for Review" - #123 |
| New commit | "PR Updated" - #123 |

Each activity includes:
- Title
- PR number
- GitHub URL
- Timestamp

---

## ✅ Verification

After adding webhook to GitHub:

1. **Check webhook delivery:**
   - Go to GitHub webhook settings
   - Should see "Recent Deliveries"
   - Test delivery should show ✅ 200

2. **Create a test PR:**
   - Create/open a PR on fe-MFV
   - Check Iris Dashboard Activity feed
   - Should see "PR Opened - [PR Title]"

3. **Check Firestore:**
   - Firebase Console > Firestore
   - Look in `activity` collection
   - Should see new entries with `source: "github-webhook"`

---

## 🐛 Troubleshooting Quick Fixes

| Problem | Fix |
|---------|-----|
| 401 Unauthorized | Secret doesn't match - check GitHub settings |
| Payload URL unreachable | Dashboard not running or wrong domain |
| No activity appears | Check Firestore rules allow writes |
| Webhook doesn't fire | Make sure "Pull requests" event is selected |

---

## 📝 Files Created

- ✅ `/src/app/api/webhooks/github/route.ts` - Webhook endpoint
- ✅ `/src/lib/github.ts` - Helper utilities
- ✅ `.env.local` - Secrets configured
- ✅ `WEBHOOK_SETUP.md` - Full setup guide
- ✅ `WEBHOOK_IMPLEMENTATION_GUIDE.md` - Detailed guide

---

## 🎯 Next Steps

1. **Get your domain:**
   - Production: `https://your-domain.com`
   - Local testing: Use ngrok tunnel

2. **Add GitHub webhook:**
   - Use settings above
   - Takes 1 minute

3. **Test it:**
   - Create PR or update existing PR
   - Check activity in dashboard

4. **Done!** 🎉

---

## Questions?

See full documentation:
- **Setup Guide:** `WEBHOOK_SETUP.md`
- **Implementation Details:** `WEBHOOK_IMPLEMENTATION_GUIDE.md`
- **Endpoint Code:** `src/app/api/webhooks/github/route.ts`

