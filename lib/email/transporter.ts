/**
 * SMTP2Go HTTP API client.
 * Docs: https://apidoc.smtp2go.com/documentation/#/POST/email/send
 */

import { config } from '@/lib/config';

const API_URL = 'https://api.smtp2go.com/v3/email/send';

export function isEmailConfigured(): boolean {
  return Boolean(config.smtp2go.apiKey);
}

export async function sendViaSmtp2Go(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isEmailConfigured()) {
    if (config.app.nodeEnv === 'development') {
      console.log(`[Email] SMTP2GO_API_KEY not set — skipping email to ${params.to}: "${params.subject}"`);
    }
    return { success: false, error: 'SMTP2Go not configured' };
  }

  const sender = `${config.smtp2go.fromName} <${config.smtp2go.fromEmail}>`;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: config.smtp2go.apiKey,
      to: [params.to],
      sender,
      subject: params.subject,
      html_body: params.html,
    }),
  });

  const data = await res.json();

  if (res.ok && data?.data?.succeeded > 0) {
    if (config.app.nodeEnv === 'development') {
      console.log(`[Email] Sent to ${params.to}: "${params.subject}"`);
    }
    return { success: true, messageId: data?.request_id };
  }

  const error = data?.data?.error || data?.data?.failures?.[0] || `HTTP ${res.status}`;
  console.error(`[Email] Failed to send to ${params.to}: "${params.subject}" —`, error);
  return { success: false, error: String(error) };
}
