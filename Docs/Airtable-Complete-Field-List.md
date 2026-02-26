# Airtable – Complete field list for every table

**403 "Invalid permissions or model not found"?** Ensure every table below exists in your base and that your Personal Access Token has access to that base (and all tables). Table names must match exactly, or set `AIRTABLE_*_TABLE_NAME` env vars.

**Chat page 403 (Conversations / Messages)?** The host and nanny Chat pages need two tables in the same base:
- **Conversations** – fields: `matchId`, `hostId`, `nannyId` (each Single line text with the record ID).
- **Messages** – fields: `conversationId`, `senderId`, `senderType` (single select: Host | Nanny), `content` (Long text), `attachmentUrl` (optional).

Create these tables in your base if they are missing. The default names are `Conversations` and `Messages`; if you use different names, set `AIRTABLE_CONVERSATIONS_TABLE_NAME` and `AIRTABLE_MESSAGES_TABLE_NAME` in Vercel (and locally). Also confirm your Personal Access Token was created with access to **this base** and has at least **Read** (and Write if you use chat) for its tables.

**Still 403 with table name "Conversations"?** Try using the **table ID** instead of the name (the Airtable API accepts either in the URL):

1. Get the Conversations table ID (starts with `tbl`): in [Airtable → Developer hub](https://airtable.com/developers/web/guides/get-started) open your base, or call `GET https://api.airtable.com/v0/meta/bases/{yourBaseId}/tables` with your PAT and find the `id` for the Conversations table. You can also look up [Finding Airtable IDs](https://support.airtable.com/docs/finding-airtable-ids) in Airtable Support.
2. In Vercel (and locally), set `AIRTABLE_CONVERSATIONS_TABLE_NAME` to that ID, e.g. `tblXXXXXXXXXXXXXX`. Do the same for `AIRTABLE_MESSAGES_TABLE_NAME` if the Messages table also 403s.
3. Redeploy.

Also double-check your **Personal Access Token**: in Airtable → Account → Developer hub → Personal access tokens, open the token used as `AIRTABLE_API_KEY` and ensure **this base** is in the token’s “Access” list and that **Read** (and **Write** if you use chat) is enabled for that base.

## Checklist

- [ ] **Users** – email, name, userType, passwordHash, ghlContactId, airtableHostId, airtableNannyId, emailVerified, isAdmin (checkbox), isMatchmaker (checkbox), locked (checkbox)
- [ ] **Hosts** – all fields above with **exact** “Title with spaces” names
- [ ] **Nannies** – userId, badge, nannyType (Nanny | Au Pair), expectedWeeklyPocketMoney, euAuPairHoursAcknowledged, plus other camelCase onboarding fields
- [ ] **Matches** – hostId, nannyId, score, hostProceed, nannyProceed, bothProceedAt, status, matchSource (auto | admin_curated | premium_concierge), sentToHostAt, sentToCaregiverAt
- [ ] **Shortlists** – hostId, matchIds, deliveredAt
- [ ] **Conversations** – matchId, hostId, nannyId
- [ ] **Messages** – conversationId, senderId, senderType, content, attachmentUrl
- [ ] **InterviewRequests** – matchId, hostId, nannyId, slot1–slot5, selectedSlotIndex, status, isVip
- [ ] **PasswordResetTokens** – email, token, expiresAt
- [ ] **GoogleCalendarTokens** – userId, refreshToken, calendarId, updatedTime
