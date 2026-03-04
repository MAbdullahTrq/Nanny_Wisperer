/**
 * GHL workflow triggers. Optional for MVP: when GHL_WORKFLOW_WEBHOOK_URL is set,
 * POST event payloads so GHL can run workflows (e.g. welcome/chat, shortlist delivery, meeting links).
 * No-ops when URL is not configured.
 */

import { config } from '@/lib/config';

export type WorkflowEventType = 'shortlist_ready' | 'both_proceeded' | 'meeting_created';

export interface WorkflowPayload {
  event: WorkflowEventType;
  contactId?: string;
  [key: string]: unknown;
}

export async function triggerGHLWorkflow(contactId: string, data: Omit<WorkflowPayload, 'event'>): Promise<void> {
  const url = config.ghl.workflowWebhookUrl;
  if (!url?.trim()) return;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId, ...data }),
    });
    if (!res.ok) {
      console.warn('[GHL Workflow] Webhook returned', res.status);
    }
  } catch (err) {
    console.warn('[GHL Workflow] Failed to trigger:', err instanceof Error ? err.message : err);
  }
}

/** Call when shortlist is ready and host should be notified (e.g. GHL sends shortlist link). */
export async function triggerShortlistReady(params: {
  contactId?: string;
  shortlistUrl?: string;
  hostId?: string;
  nannyCount?: number;
}): Promise<void> {
  if (params.contactId) {
    await triggerGHLWorkflow(params.contactId, {
      event: 'shortlist_ready',
      shortlistUrl: params.shortlistUrl,
      hostId: params.hostId,
      nannyCount: params.nannyCount,
    });
  }
}

/** Call when both host and nanny have proceeded (e.g. GHL welcome/chat workflow). */
export async function triggerBothProceeded(params: {
  contactId?: string;
  matchId?: string;
  hostId?: string;
  nannyId?: string;
}): Promise<void> {
  if (params.contactId) {
    await triggerGHLWorkflow(params.contactId, {
      event: 'both_proceeded',
      matchId: params.matchId,
      hostId: params.hostId,
      nannyId: params.nannyId,
    });
  }
}

/** Call when interview meeting is created (e.g. GHL sends join links to both parties). */
export async function triggerMeetingCreated(params: {
  contactId?: string;
  interviewRequestId?: string;
  meetLink?: string;
  hostId?: string;
  nannyId?: string;
}): Promise<void> {
  if (params.contactId) {
    await triggerGHLWorkflow(params.contactId, {
      event: 'meeting_created',
      interviewRequestId: params.interviewRequestId,
      meetLink: params.meetLink,
      hostId: params.hostId,
      nannyId: params.nannyId,
    });
  }
}
