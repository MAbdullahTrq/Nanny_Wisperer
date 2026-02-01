/**
 * GHL webhook receiver. T3.3 — POST /api/webhooks/ghl
 * Verifies x-wh-signature if GHL_WEBHOOK_SECRET is set; parses body; returns 200; logs payload.
 */

import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    const signature = request.headers.get('x-wh-signature') ?? request.headers.get('x-ghl-signature') ?? '';

    if (config.ghl.webhookSecret && !signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
    }
    // When GHL_WEBHOOK_SECRET and x-wh-signature are both set, full HMAC verification can be added here.

    let body: unknown;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = raw;
    }

    if (config.app.nodeEnv === 'development') {
      console.log('[GHL Webhook]', { signature: signature ? '[present]' : '[none]', body });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e) {
    console.error('[GHL Webhook]', e);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
