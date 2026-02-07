import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

// Initialize Firebase (server-side)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// GitHub webhook secret for validation
const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';

/**
 * Validate GitHub webhook signature
 * GitHub sends X-Hub-Signature-256 header with HMAC SHA256 signature
 */
function validateGitHubSignature(payload: string, signature: string | null): boolean {
  if (!GITHUB_WEBHOOK_SECRET) {
    console.warn('GITHUB_WEBHOOK_SECRET not configured - skipping signature validation');
    return true; // Allow if no secret configured (dev mode)
  }

  if (!signature) {
    return false;
  }

  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', GITHUB_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  const expectedSignature = `sha256=${hash}`;
  return signature === expectedSignature;
}

/**
 * Parse PR information from GitHub webhook payload
 */
function parsePREvent(payload: any) {
  const action = payload.action; // 'opened', 'synchronize', 'ready_for_review'
  const pr = payload.pull_request;

  if (!pr) {
    return null;
  }

  return {
    prNumber: pr.number,
    prTitle: pr.title,
    prUrl: pr.html_url,
    author: pr.user?.login,
    action,
    draft: pr.draft,
    state: pr.state,
  };
}

/**
 * Create activity entry in Firestore
 */
async function logActivity(action: string, taskTitle: string, details?: string) {
  try {
    const activityRef = collection(db, 'activity');
    await addDoc(activityRef, {
      action,
      taskTitle,
      details: details || undefined,
      source: 'github-webhook',
      timestamp: Timestamp.now(),
    });
    console.log(`[GitHub Webhook] Activity logged: ${action} - ${taskTitle}`);
  } catch (error) {
    console.error('[GitHub Webhook] Failed to log activity:', error);
  }
}

/**
 * Format PR action into activity message
 */
function getActivityMessage(prInfo: any): { action: string; details?: string } {
  const { action, prNumber, draft, prUrl } = prInfo;

  if (action === 'opened') {
    return {
      action: 'PR Opened',
      details: draft ? `#${prNumber} (Draft) - ${prUrl}` : `#${prNumber} - ${prUrl}`,
    };
  }

  if (action === 'ready_for_review') {
    return {
      action: 'PR Ready for Review',
      details: `#${prNumber} - ${prUrl}`,
    };
  }

  if (action === 'synchronize') {
    return {
      action: 'PR Updated',
      details: `#${prNumber} - ${prUrl}`,
    };
  }

  return {
    action: `PR ${action}`,
    details: `#${prNumber} - ${prUrl}`,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature validation
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // Validate GitHub signature
    if (!validateGitHubSignature(rawBody, signature)) {
      console.warn('[GitHub Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse the payload
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Only handle pull_request events
    if (payload.action === undefined || !payload.pull_request) {
      console.log('[GitHub Webhook] Not a PR event, ignoring');
      return NextResponse.json({ success: true, message: 'Not a PR event' });
    }

    // Only handle PR events we care about
    const allowedActions = ['opened', 'synchronize', 'ready_for_review'];
    if (!allowedActions.includes(payload.action)) {
      console.log(`[GitHub Webhook] PR action '${payload.action}' not tracked`);
      return NextResponse.json({ success: true, message: 'Action not tracked' });
    }

    // Parse PR information
    const prInfo = parsePREvent(payload);
    if (!prInfo) {
      return NextResponse.json({ error: 'Invalid PR data' }, { status: 400 });
    }

    // Get activity message
    const { action, details } = getActivityMessage(prInfo);

    // Log to Firestore
    await logActivity(action, prInfo.prTitle, details);

    return NextResponse.json(
      {
        success: true,
        message: 'Activity logged',
        pr: prInfo,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GitHub Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'webhook endpoint active',
    endpoint: '/api/webhooks/github',
    accepts: ['pull_request'],
    actions: ['opened', 'synchronize', 'ready_for_review'],
  });
}
