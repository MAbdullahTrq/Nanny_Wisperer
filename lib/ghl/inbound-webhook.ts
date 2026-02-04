/**
 * Send signup form data to GHL inbound webhook (Lead Connector).
 * Used when a user signs up as Host or Nanny so GHL can receive the data and run workflows.
 */

import { config } from '@/lib/config';
import type { UserType } from '@/types/airtable';

export interface SignupWebhookPayload {
  email: string;
  name?: string;
  signupType: 'Host' | 'Nanny';
  userId?: string;
  source?: string;
}

/**
 * POST signup data to the GHL inbound webhook. Does nothing if GHL_INBOUND_WEBHOOK_URL is not set.
 * GHL expects a valid JSON body; do not throw on webhook failure so signup still succeeds.
 */
export async function sendSignupToGHLInbound(payload: SignupWebhookPayload): Promise<void> {
  const url = config.ghl.inboundWebhookUrl;
  if (!url) return;

  const body = {
    email: payload.email,
    name: payload.name ?? payload.email,
    signupType: payload.signupType,
    userId: payload.userId,
    source: payload.source ?? 'nanny-whisperer',
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok && config.app.nodeEnv === 'development') {
      console.warn('[GHL Inbound] Webhook returned', res.status, await res.text());
    }
  } catch (e) {
    if (config.app.nodeEnv === 'development') {
      console.warn('[GHL Inbound] Webhook request failed', e);
    }
  }
}
