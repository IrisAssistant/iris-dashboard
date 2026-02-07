# Webhook API Endpoints

This directory contains webhook handlers for integrating external services with the Iris Dashboard.

## Endpoints

### GitHub Webhooks (`/github`)

**Files:**
- `github/route.ts` - Main webhook handler

**Supported Events:**
- `pull_request` with actions:
  - `opened` - PR created
  - `synchronize` - New commit pushed
  - `ready_for_review` - Draft PR marked ready

**Request Format:**
```
POST /api/webhooks/github
Content-Type: application/json
X-Hub-Signature-256: sha256=<hmac>

{
  "action": "opened|synchronize|ready_for_review",
  "pull_request": {
    "number": <pr_number>,
    "title": "<pr_title>",
    "draft": <boolean>,
    "state": "open|closed",
    "html_url": "<github_url>",
    "user": {
      "login": "<author>"
    }
  }
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Activity logged",
  "pr": {
    "prNumber": 123,
    "prTitle": "Feature title",
    "prUrl": "https://github.com/...",
    "author": "username",
    "action": "opened",
    "draft": false,
    "state": "open"
  }
}
```

**Status Codes:**
- `200 OK` - Event processed successfully
- `401 Unauthorized` - Invalid signature
- `400 Bad Request` - Malformed payload
- `500 Internal Server Error` - Server error

## Security

All webhooks are validated using HMAC SHA256 signatures:

1. GitHub sends `X-Hub-Signature-256: sha256=<hash>`
2. Dashboard validates using `GITHUB_WEBHOOK_SECRET`
3. Invalid signatures return `401 Unauthorized`

**Configuration:**
```env
GITHUB_WEBHOOK_SECRET=your_secret_here
```

## Integration

Webhooks automatically log activities to Firestore:

- **Collection:** `activity`
- **Fields:** action, taskTitle, details, source, timestamp
- **Source:** `"github-webhook"` for PR events

## Testing

### Health Check
```bash
curl GET http://localhost:3000/api/webhooks/github
```

### Send Test Payload
See `WEBHOOK_TESTING.md` for detailed test instructions.

## Documentation

- **Setup:** See `WEBHOOK_SETUP.md`
- **Implementation:** See `WEBHOOK_IMPLEMENTATION_GUIDE.md`
- **Testing:** See `WEBHOOK_TESTING.md`
- **Quick Start:** See `WEBHOOK_QUICK_START.md`

