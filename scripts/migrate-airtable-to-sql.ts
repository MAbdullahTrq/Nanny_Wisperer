/**
 * One-off migration: copy all data from Airtable to PostgreSQL.
 *
 * Prerequisites:
 *   - .env has AIRTABLE_API_KEY, AIRTABLE_BASE_ID (and optional table names).
 *   - .env has DATABASE_URL pointing at PostgreSQL.
 *   - PostgreSQL schema is applied: psql "$DATABASE_URL" -f scripts/schema.sql
 *
 * Run: npm run migrate:airtable-to-sql
 *
 * Order: users → hosts → nannies → matches → shortlists → shortlist_matches
 *        → conversations → messages → interview_requests → google_calendar_tokens
 */

import 'dotenv/config';
import { config } from '../lib/config';
import { airtableGet } from '../lib/airtable/client';
import { getPool } from '../lib/db/pool';
import { airtableFieldsToHost } from '../lib/airtable/host-field-names';
import { airtableFieldsToNanny } from '../lib/airtable/nanny-field-names';

const PAGE_SIZE = 100;

async function fetchAllAirtable<T = Record<string, unknown>>(
  tableName: string,
  params?: { filterByFormula?: string }
): Promise<Array<{ id: string; fields: T; createdTime?: string }>> {
  const all: Array<{ id: string; fields: T; createdTime?: string }> = [];
  let offset: string | undefined;
  do {
    const res = await airtableGet<T>(tableName, { maxRecords: PAGE_SIZE, offset, ...params });
    all.push(...res.records);
    offset = res.offset;
  } while (offset);
  return all;
}

async function run(): Promise<void> {
  if (!config.airtable.apiKey || !config.airtable.baseId) {
    throw new Error('Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID in .env');
  }
  if (!config.database.url) {
    throw new Error('Set DATABASE_URL in .env');
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    const usersTable = config.airtable.usersTableName;
    const hostsTable = config.airtable.hostsTableName;
    const nanniesTable = config.airtable.nanniesTableName;
    const conversationsTable = config.airtable.conversationsTableName;
    const messagesTable = config.airtable.messagesTableName;

    console.log('Fetching Users...');
    const userRecords = await fetchAllAirtable<Record<string, unknown>>(usersTable);
    console.log('  ', userRecords.length, 'users');
    for (const r of userRecords) {
      const f = r.fields;
      const createdTime = (r.createdTime || f.createdTime) as string | undefined;
      await client.query(
        `INSERT INTO users (id, email, name, user_type, password_hash, ghl_contact_id, airtable_host_id, airtable_nanny_id, email_verified, is_admin, is_matchmaker, locked, created_time)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, COALESCE($13::timestamptz, now()))
         ON CONFLICT (id) DO NOTHING`,
        [
          r.id,
          (f.email as string) ?? '',
          (f.name as string) ?? null,
          (f.userType as string) ?? 'Host',
          (f.passwordHash as string) ?? null,
          (f.ghlContactId as string) ?? null,
          (f.airtableHostId as string) ?? null,
          (f.airtableNannyId as string) ?? null,
          Boolean(f.emailVerified),
          Boolean(f.isAdmin),
          Boolean(f.isMatchmaker),
          Boolean(f.locked),
          createdTime ?? null,
        ]
      );
    }

    console.log('Fetching Hosts...');
    const hostRecords = await fetchAllAirtable<Record<string, unknown>>(hostsTable);
    console.log('  ', hostRecords.length, 'hosts');
    for (const r of hostRecords) {
      const fields = airtableFieldsToHost(r.fields);
      const userId = (fields.userId as string) ?? null;
      const location = (fields.location as string) ?? null;
      const tier = (fields.tier as string) ?? null;
      const data = { ...fields };
      delete data.userId;
      delete data.location;
      delete data.tier;
      const createdTime = (r.createdTime || (r.fields as Record<string, unknown>).createdTime) as string | undefined;
      await client.query(
        `INSERT INTO hosts (id, created_time, user_id, location, tier, data) VALUES ($1, COALESCE($2::timestamptz, now()), $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
        [r.id, createdTime ?? null, userId, location, tier, JSON.stringify(data)]
      );
    }

    console.log('Fetching Nannies...');
    const nannyRecords = await fetchAllAirtable<Record<string, unknown>>(nanniesTable);
    console.log('  ', nannyRecords.length, 'nannies');
    for (const r of nannyRecords) {
      const fields = airtableFieldsToNanny(r.fields);
      const userId = (fields.userId as string) ?? null;
      const location = (fields.location as string) ?? null;
      const tier = (fields.tier as string) ?? null;
      const data = { ...fields };
      delete data.userId;
      delete data.location;
      delete data.tier;
      const createdTime = (r.createdTime || (r.fields as Record<string, unknown>).createdTime) as string | undefined;
      await client.query(
        `INSERT INTO nannies (id, created_time, user_id, location, tier, data) VALUES ($1, COALESCE($2::timestamptz, now()), $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
        [r.id, createdTime ?? null, userId, location, tier, JSON.stringify(data)]
      );
    }

    console.log('Fetching Matches...');
    const matchRecords = await fetchAllAirtable<Record<string, unknown>>('Matches');
    console.log('  ', matchRecords.length, 'matches');
    for (const r of matchRecords) {
      const f = r.fields;
      await client.query(
        `INSERT INTO matches (id, created_time, host_id, nanny_id, score, host_proceed, nanny_proceed, both_proceed_at, status, match_source, sent_to_host_at, sent_to_caregiver_at)
         VALUES ($1, COALESCE($2::timestamptz, now()), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT (id) DO NOTHING`,
        [
          r.id,
          (r.createdTime as string) ?? null,
          (f.hostId as string) ?? '',
          (f.nannyId as string) ?? '',
          (f.score as number) ?? null,
          Boolean(f.hostProceed),
          Boolean(f.nannyProceed),
          (f.bothProceedAt as string) ?? null,
          (f.status as string) ?? 'pending',
          (f.matchSource as string) ?? 'auto',
          (f.sentToHostAt as string) ?? null,
          (f.sentToCaregiverAt as string) ?? null,
        ]
      );
    }

    console.log('Fetching Shortlists...');
    const shortlistRecords = await fetchAllAirtable<Record<string, unknown>>('Shortlists');
    console.log('  ', shortlistRecords.length, 'shortlists');
    for (const r of shortlistRecords) {
      const f = r.fields;
      await client.query(
        `INSERT INTO shortlists (id, created_time, host_id, delivered_at) VALUES ($1, COALESCE($2::timestamptz, now()), $3, $4) ON CONFLICT (id) DO NOTHING`,
        [r.id, (r.createdTime as string) ?? null, (f.hostId as string) ?? '', (f.deliveredAt as string) ?? null]
      );
      const matchIds = Array.isArray(f.matchIds) ? (f.matchIds as string[]) : typeof f.matchIds === 'string' ? (f.matchIds as string).split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      for (let i = 0; i < matchIds.length; i++) {
        await client.query(
          `INSERT INTO shortlist_matches (shortlist_id, match_id, ord) VALUES ($1, $2, $3) ON CONFLICT (shortlist_id, match_id) DO NOTHING`,
          [r.id, matchIds[i], i]
        );
      }
    }

    console.log('Fetching Conversations...');
    const convRecords = await fetchAllAirtable<Record<string, unknown>>(conversationsTable);
    console.log('  ', convRecords.length, 'conversations');
    for (const r of convRecords) {
      const f = r.fields;
      await client.query(
        `INSERT INTO conversations (id, created_time, match_id, host_id, nanny_id) VALUES ($1, COALESCE($2::timestamptz, now()), $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
        [r.id, (r.createdTime as string) ?? null, (f.matchId as string) ?? '', (f.hostId as string) ?? '', (f.nannyId as string) ?? '']
      );
    }

    console.log('Fetching Messages...');
    const msgRecords = await fetchAllAirtable<Record<string, unknown>>(messagesTable);
    console.log('  ', msgRecords.length, 'messages');
    for (const r of msgRecords) {
      const f = r.fields;
      await client.query(
        `INSERT INTO messages (id, created_time, conversation_id, sender_id, sender_type, content, attachment_url) VALUES ($1, COALESCE($2::timestamptz, now()), $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
        [
          r.id,
          (r.createdTime as string) ?? null,
          (f.conversationId as string) ?? '',
          (f.senderId as string) ?? '',
          (f.senderType as string) ?? '',
          (f.content as string) ?? null,
          (f.attachmentUrl as string) ?? null,
        ]
      );
    }

    console.log('Fetching InterviewRequests...');
    const irRecords = await fetchAllAirtable<Record<string, unknown>>('InterviewRequests');
    console.log('  ', irRecords.length, 'interview requests');
    for (const r of irRecords) {
      const f = r.fields;
      await client.query(
        `INSERT INTO interview_requests (id, created_time, match_id, host_id, nanny_id, slot1, slot2, slot3, slot4, slot5, selected_slot_index, google_meet_link, google_calendar_event_id, status, is_vip)
         VALUES ($1, COALESCE($2::timestamptz, now()), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) ON CONFLICT (id) DO NOTHING`,
        [
          r.id,
          (r.createdTime as string) ?? null,
          (f.matchId as string) ?? '',
          (f.hostId as string) ?? '',
          (f.nannyId as string) ?? '',
          (f.slot1 as string) ?? null,
          (f.slot2 as string) ?? null,
          (f.slot3 as string) ?? null,
          (f.slot4 as string) ?? null,
          (f.slot5 as string) ?? null,
          (f.selectedSlotIndex as number) ?? null,
          (f.googleMeetLink as string) ?? null,
          (f.googleCalendarEventId as string) ?? null,
          (f.status as string) ?? 'pending_slots',
          Boolean(f.isVip),
        ]
      );
    }

    console.log('Fetching GoogleCalendarTokens...');
    const gcalRecords = await fetchAllAirtable<Record<string, unknown>>('GoogleCalendarTokens');
    console.log('  ', gcalRecords.length, 'tokens');
    for (const r of gcalRecords) {
      const f = r.fields;
      await client.query(
        `INSERT INTO google_calendar_tokens (id, user_id, refresh_token, calendar_id, updated_time) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
        [
          r.id,
          (f.userId as string) ?? '',
          (f.refreshToken as string) ?? '',
          (f.calendarId as string) ?? null,
          (f.updatedTime as string) ?? new Date().toISOString(),
        ]
      );
    }

    console.log('Done. Data migrated from Airtable to PostgreSQL.');
  } finally {
    client.release();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
