import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { addActivity } from '@/lib/storage';

/**
 * Vercel Webhook Handler
 * Receives deployment events and logs them to dashboard activity
 * 
 * Events: deployment.created, deployment.succeeded, deployment.failed, deployment.canceled
 */

function verifyVercelSignature(body: Buffer, signature: string): boolean {
  const secret = process.env.VERCEL_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('VERCEL_WEBHOOK_SECRET not configured');
    return false;
  }

  const hash = createHmac('sha256', secret).update(body).digest('base64');
  return hash === signature;
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.arrayBuffer();
    const signature = request.headers.get('x-vercel-signature');

    // Verify the signature
    if (!verifyVercelSignature(Buffer.from(rawBody), signature || '')) {
      console.error('Invalid Vercel webhook signature');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = JSON.parse(Buffer.from(rawBody).toString());
    const { type, deployment } = body;

    if (!deployment) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { id, url, projectId, status, createdAt, creator } = deployment;

    // Map Vercel status to action
    const statusMap: Record<string, string> = {
      BUILDING: 'Building',
      READY: 'Deployed',
      ERROR: 'Failed',
      CANCELED: 'Canceled',
    };

    const action = statusMap[status] || status;
    const projectName = projectId || 'Dashboard';

    // Build activity details
    let details = `${projectName} → ${status}`;
    if (url) details += ` | ${url}`;
    if (creator?.username) details += ` | by ${creator.username}`;

    // Log to activity feed
    await addActivity({
      action: `Deployment ${action}`,
      taskTitle: `Vercel: ${projectName}`,
      details,
    });

    // Alert on failure
    if (status === 'ERROR') {
      console.error('⚠️ DEPLOYMENT FAILURE', {
        project: projectName,
        deployment: id,
        url: `https://vercel.com/${projectId}/deployments/${id}`,
      });

      // Could add Telegram alert here if needed
      return NextResponse.json(
        { message: 'Deployment failed', alert: true },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: 'Deployment logged', status },
      { status: 200 }
    );
  } catch (error) {
    console.error('Vercel webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Health check for webhook endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/webhooks/vercel',
    events: ['deployment.created', 'deployment.succeeded', 'deployment.failed', 'deployment.canceled'],
  });
}
