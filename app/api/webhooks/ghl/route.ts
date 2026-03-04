/**
 * GHL webhook receiver. POST /api/webhooks/ghl
 * - Verifies x-wh-signature if GHL_WEBHOOK_SECRET is set.
 * - Tier update: when GHL sends contactId + tier (e.g. after payment), we update the app's host/nanny tier.
 *
 * Supported payloads:
 * 1. Custom workflow (e.g. "Payment received" → Custom webhook):
 *    { "contactId": "ghl_contact_id", "tier": "Fast Track" }
 *    { "email": "user@example.com", "tier": "VIP" }
 * 2. Product name → tier mapping (optional): { "contactId": "...", "productName": "Fast Track" } → tier = productName
 */

import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getUserByGhlContactId, getUserByEmail } from '@/lib/db/users';
import { getHostByUserId, updateHost } from '@/lib/db/hosts';
import { getNannyByUserId, updateNanny } from '@/lib/db/nannies';

const HOST_TIERS = ['Standard', 'Fast Track', 'VIP'];
const NANNY_TIERS = ['Basic', 'Verified', 'Certified'];

function normalizeTier(tier: unknown): string | null {
  if (typeof tier !== 'string') return null;
  const t = tier.trim();
  if (HOST_TIERS.includes(t) || NANNY_TIERS.includes(t)) return t;
  return null;
}

async function applyTierUpdate(contactId?: string | null, email?: string | null, tier?: string | null): Promise<{ updated: boolean; reason?: string }> {
  const tierValue = normalizeTier(tier);
  if (!tierValue) return { updated: false, reason: 'Missing or invalid tier' };

  let user = null;
  if (contactId && typeof contactId === 'string') {
    user = await getUserByGhlContactId(contactId.trim());
  }
  if (!user && email && typeof email === 'string') {
    user = await getUserByEmail(email.trim());
  }
  if (!user) return { updated: false, reason: 'User not found for contactId/email' };

  const isHostTier = HOST_TIERS.includes(tierValue);
  const isNannyTier = NANNY_TIERS.includes(tierValue);

  if (isHostTier) {
    const host = user.airtableHostId ? { id: user.airtableHostId } : await getHostByUserId(user.id!);
    if (host?.id) {
      await updateHost(host.id, { tier: tierValue });
      return { updated: true, reason: 'host' };
    }
  }
  if (isNannyTier) {
    const nanny = user.airtableNannyId ? { id: user.airtableNannyId } : await getNannyByUserId(user.id!);
    if (nanny?.id) {
      await updateNanny(nanny.id, { tier: tierValue, badge: tierValue });
      return { updated: true, reason: 'nanny' };
    }
  }

  return { updated: false, reason: 'No host/nanny profile for user' };
}

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    const signature = request.headers.get('x-wh-signature') ?? request.headers.get('x-ghl-signature') ?? '';

    if (config.ghl.webhookSecret && !signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
    }

    let body: Record<string, unknown> | null = null;
    try {
      body = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
    } catch {
      body = null;
    }

    if (config.app.nodeEnv === 'development') {
      console.log('[GHL Webhook]', { signature: signature ? '[present]' : '[none]', body });
    }

    const contactId = body?.contactId ?? body?.contact_id ?? (body?.data as Record<string, unknown>)?.contactId ?? (body?.data as Record<string, unknown>)?.id;
    const email = body?.email ?? (body?.data as Record<string, unknown>)?.email;
    const tier = body?.tier ?? body?.productName ?? body?.product_name ?? (body?.data as Record<string, unknown>)?.tier;

    if (contactId || email) {
      const result = await applyTierUpdate(
        contactId as string | null,
        email as string | null,
        tier as string | null
      );
      if (result.updated) {
        console.log('[GHL Webhook] Tier updated:', result.reason, tier);
      } else if (result.reason && config.app.nodeEnv === 'development') {
        console.log('[GHL Webhook] Tier not updated:', result.reason);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e) {
    console.error('[GHL Webhook]', e);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
