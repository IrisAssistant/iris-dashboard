/**
 * GitHub-related utilities for webhook integration
 */

/**
 * Generate GitHub webhook signature for testing
 * 
 * @param payload - The webhook payload as a string
 * @param secret - The webhook secret
 * @returns The signature string (sha256=...)
 */
export function generateGitHubSignature(payload: string, secret: string): string {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return `sha256=${hash}`;
}

/**
 * Create a mock PR event payload for testing
 */
export function createMockPRPayload(
  action: 'opened' | 'synchronize' | 'ready_for_review',
  prNumber: number = 1,
  prTitle: string = 'Test PR',
  isDraft: boolean = false,
  author: string = 'testuser'
): string {
  const payload = {
    action,
    pull_request: {
      number: prNumber,
      title: prTitle,
      draft: isDraft,
      state: 'open',
      html_url: `https://github.com/TimmTechProjects/fe-MFV/pull/${prNumber}`,
      user: {
        login: author,
      },
    },
  };
  return JSON.stringify(payload);
}

/**
 * Format a PR message for activity logging
 */
export function formatPRActivityMessage(
  action: 'opened' | 'synchronize' | 'ready_for_review',
  prNumber: number,
  isDraft: boolean = false
): string {
  if (action === 'opened') {
    return isDraft ? `PR #${prNumber} (Draft)` : `PR #${prNumber}`;
  }
  if (action === 'ready_for_review') {
    return `PR #${prNumber} Ready for Review`;
  }
  if (action === 'synchronize') {
    return `PR #${prNumber} Updated`;
  }
  return `PR #${prNumber} - ${action}`;
}

/**
 * Extract PR information from GitHub webhook payload
 */
export interface PRInfo {
  prNumber: number;
  prTitle: string;
  prUrl: string;
  author: string;
  action: string;
  isDraft: boolean;
  state: string;
}

export function extractPRInfo(payload: any): PRInfo | null {
  const action = payload.action;
  const pr = payload.pull_request;

  if (!pr) {
    return null;
  }

  return {
    prNumber: pr.number,
    prTitle: pr.title,
    prUrl: pr.html_url,
    author: pr.user?.login || 'unknown',
    action,
    isDraft: pr.draft || false,
    state: pr.state || 'unknown',
  };
}

/**
 * Webhook test data - use for testing endpoints
 */
export const WEBHOOK_TEST_CASES = {
  prOpened: {
    action: 'opened',
    description: 'PR opened',
    isDraft: false,
  },
  prDraft: {
    action: 'opened',
    description: 'PR opened as draft',
    isDraft: true,
  },
  prReadyForReview: {
    action: 'ready_for_review',
    description: 'Draft PR marked ready for review',
    isDraft: false,
  },
  prSynchronize: {
    action: 'synchronize',
    description: 'New commit pushed to PR',
    isDraft: false,
  },
  prClosed: {
    action: 'closed',
    description: 'PR closed (not tracked)',
    isDraft: false,
  },
} as const;
