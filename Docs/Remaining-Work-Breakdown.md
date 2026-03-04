# Nanny Whisperer — Remaining Work Breakdown

> **Last Updated:** February 27, 2026  
> **Scope:** Everything not yet complete in the MVP, organized by priority.

---

## Table of Contents

1. [Critical Bugs (Fix Immediately)](#1-critical-bugs)
2. [High Priority — Core Flow Gaps](#2-high-priority--core-flow-gaps)
3. [Medium Priority — Feature Completion](#3-medium-priority--feature-completion)
4. [Low Priority — Polish & Enhancements](#4-low-priority--polish--enhancements)
5. [Deferred / Post-MVP](#5-deferred--post-mvp)

---

## 1. Critical Bugs

These are logic errors in existing code that produce wrong results.

---

### 1.1 Nanny Proceed/Pass Updates the Wrong Side

**Problem:** When a nanny views their CV and clicks "Proceed," the system updates `hostProceed` instead of `nannyProceed` because the token includes both `hostId` and `nannyId`. The API uses `Boolean(payload.hostId)` to decide who is acting — since `hostId` is present, it treats the nanny as the host.

**Files:**
- `app/nanny/matches/page.tsx` — generates the token with `hostId` included
- `app/api/matches/proceed-pass/route.ts` — uses `isHost = Boolean(payload.hostId)` to determine side

**Fix:**

In `app/nanny/matches/page.tsx`, change the token generation to omit `hostId`:

```ts
// Before (broken):
generateCvToken(match.id, undefined, match.hostId, airtableNannyId)

// After (correct):
generateCvToken(match.id, undefined, undefined, airtableNannyId)
```

---

### 1.2 `CvProceedPassClient` Hardcodes `isHost={true}`

**Problem:** The CV page's proceed/pass component always renders as if the viewer is the host. When a nanny views the CV page via their token, they see the host's proceed status and their action updates the host side.

**File:** `app/(tokenized)/cv/[token]/CvProceedPassClient.tsx`

**Fix:**

Pass `isHost` from the parent page based on the decoded token payload:

```ts
// In the CV page (page.tsx), decode the token and pass:
<CvProceedPassClient
  matchId={matchId}
  isHost={Boolean(payload.hostId) && !Boolean(payload.nannyId)}
  token={token}
/>

// In CvProceedPassClient.tsx, use the prop instead of hardcoding:
<ProceedPass
  matchId={matchId}
  isHost={isHost}   // was: isHost={true}
  currentStatus={status}
  onAction={handleAction}
/>
```

---

### 1.3 Duplicate Matching Implementations with Different Logic

**Problem:** Two separate matching codebases exist with different filter strictness:

| Aspect | `lib/airtable/matching.ts` (used by `/api/matching/trigger`) | `lib/matching/` (used by `/api/shortlists/generate`) |
|--------|--------------------------------------------------------------|------------------------------------------------------|
| Age groups | Any overlap passes | All host groups must match |
| Start date | No explicit must-match | Explicit must-match |
| Accommodation | No explicit must-match | Explicit must-match |
| Match metadata | No `matchSource` or `sentToHostAt` | Sets both |
| Location | Includes `city` in resolution | Does not include `city` |

**Fix:**

Consolidate into a single implementation. The `lib/matching/` version is more thorough and correct. Steps:

1. Update `/api/matching/trigger` to use `createShortlistForHost` from `lib/matching/shortlist.ts` instead of `createMatchesAndShortlist` from `lib/airtable/matching.ts`.
2. Delete or deprecate the duplicate functions in `lib/airtable/matching.ts` (`findMatchesForHost`, `calculateMatchScore`, `passesMustMatchFilters`, `createMatchesAndShortlist`).
3. Keep `lib/airtable/matching.ts` only for Airtable CRUD operations (`getMatch`, `updateMatch`, `createMatch`, etc.).

---

## 2. High Priority — Core Flow Gaps

These are missing pieces that break user-facing flows.

---

### 2.1 Email Sending (Password Reset, Notifications)

**Current state:** No email provider is installed or configured. Password reset tokens are generated but the link is only logged to the console in development. No signup confirmation, match notification, shortlist delivery, or interview notification emails exist.

**Scope:** 5 email triggers need implementation.

**How to implement:**

1. **Install Resend** (recommended for Next.js):
   ```bash
   npm install resend
   ```

2. **Add config** in `lib/config.ts`:
   ```ts
   email: {
     resendApiKey: getEnv('RESEND_API_KEY', ''),
     fromAddress: getEnv('EMAIL_FROM', 'noreply@nannywhisperer.com'),
   }
   ```

3. **Create `lib/email/client.ts`:**
   ```ts
   import { Resend } from 'resend';
   import { config } from '@/lib/config';

   const resend = new Resend(config.email.resendApiKey);

   export async function sendEmail(params: {
     to: string;
     subject: string;
     html: string;
   }) {
     if (!config.email.resendApiKey) {
       console.warn('[Email] No RESEND_API_KEY — skipping send');
       return;
     }
     return resend.emails.send({
       from: config.email.fromAddress,
       ...params,
     });
   }
   ```

4. **Create email templates** in `lib/email/templates/`:

   | Template | Trigger Point | File to Edit |
   |----------|--------------|--------------|
   | `password-reset.ts` | `app/api/auth/forgot-password/route.ts` (replace TODO on line 33) |
   | `shortlist-ready.ts` | `app/api/matching/trigger/route.ts` (replace TODO on line 29) |
   | `interview-request.ts` | `app/api/interview-requests/route.ts` (add after creating the request) |
   | `interview-confirmed.ts` | `app/api/interview-requests/[id]/select-slot/route.ts` (add after slot selection) |
   | `both-proceeded.ts` | `app/api/matches/proceed-pass/route.ts` (add after conversation creation) |

5. **Wire each template** into its trigger point by importing `sendEmail` and calling it with the rendered template.

---

### 2.2 Interview Request Flow — Nanny Never Receives the Link

**Current state:** When a host creates an interview request, the `InterviewRequest` record is created in Airtable, but no tokenized link is generated and no notification is sent to the nanny. The nanny's interview-requests page is a static placeholder that never fetches data.

**Files to change:**

#### A. Generate interview token after creation

In `app/api/interview-requests/route.ts`, after creating the interview request:

```ts
import { generateInterviewToken } from '@/lib/auth/tokens';
import { sendEmail } from '@/lib/email/client';
import { interviewRequestEmail } from '@/lib/email/templates/interview-request';

// After: const interview = await createInterviewRequest(data);
const token = generateInterviewToken(interview.id, matchId, hostId, nannyId);
const interviewUrl = `${config.app.url}/interview/${token}`;

// Send email to nanny
const nanny = await getNanny(nannyId);
const nannyUser = await getUserByNannyId(nannyId);
if (nannyUser?.email) {
  await sendEmail({
    to: nannyUser.email,
    subject: 'New interview request',
    html: interviewRequestEmail({ interviewUrl, hostName: host.firstName }),
  });
}
```

#### B. Build the nanny interview-requests page

Replace the placeholder in `app/nanny/interview-requests/page.tsx`:

1. Create `GET /api/nanny/interview-requests` that fetches interview requests by `nannyId` from the session.
2. Display each request with: host name, proposed slots, status, and a "Select a slot" link (tokenized).
3. Show status badges: `pending_slots`, `nanny_selected`, `meeting_created`, `none_available`.

---

### 2.3 Meetings Pages — Host and Nanny

**Current state:** Both `app/host/meetings/page.tsx` and `app/nanny/meetings/page.tsx` are static placeholders showing "No upcoming meetings."

**How to implement:**

1. **Create API endpoint** `GET /api/meetings` (or reuse interview-requests with status filter):
   - Accept `role` param (host/nanny).
   - Filter interview requests where `status = 'meeting_created'`.
   - Return: meeting time (selected slot), Google Meet link, other party's name.

2. **Update both meetings pages** to:
   - Fetch from the API on load.
   - Display each meeting as a card: date/time, participant name, "Join meeting" button linking to `googleMeetLink`.
   - Show empty state only when truly no meetings exist.

---

### 2.4 GHL Webhook Processing

**Current state:** The webhook endpoint at `/api/webhooks/ghl` receives payloads and logs them but does nothing. When GHL processes a payment (Fast Track upgrade, VIP upgrade), the user's tier is never updated.

**How to implement:**

1. **Define expected webhook events** — work with the GHL setup to identify the payload shape for:
   - Payment completed (tier upgrade)
   - Onboarding form submitted (if GHL handles forms)

2. **Add HMAC verification** in the webhook handler:
   ```ts
   import crypto from 'crypto';

   const expectedSig = crypto
     .createHmac('sha256', config.ghl.webhookSecret)
     .update(raw)
     .digest('hex');

   if (signature !== expectedSig) {
     return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
   }
   ```

3. **Route by event type** and update Airtable:
   ```ts
   const event = body as { type?: string; contactId?: string; [key: string]: unknown };

   switch (event.type) {
     case 'payment.completed': {
       const user = await getUserByGhlContactId(event.contactId);
       if (!user) break;
       const newTier = mapPaymentToTier(event); // €500 → 'Fast Track', €3000 → 'VIP'
       if (user.airtableHostId) {
         await updateHost(user.airtableHostId, { tier: newTier });
       }
       break;
     }
   }
   ```

4. **Add `getUserByGhlContactId`** to `lib/airtable/users.ts` if it doesn't exist.

---

### 2.5 Authentication on Matching Trigger

**Current state:** `POST /api/matching/trigger` has no authentication check. Anyone who knows a `hostId` can trigger matching.

**Fix:** Add admin or matchmaker auth check:

```ts
const session = await getServerSession(authOptions);
if (!session?.user?.isAdmin && !session?.user?.isMatchmaker) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## 3. Medium Priority — Feature Completion

These items are not blocking but leave the product feeling incomplete.

---

### 3.1 Nanny Interview-Requests Page (Data-Driven)

**Current state:** Static placeholder at `app/nanny/interview-requests/page.tsx`.

**Implementation steps:**

1. Create `GET /api/nanny/interview-requests`:
   ```ts
   // Fetch all InterviewRequests where nannyId matches session user
   const requests = await getInterviewRequestsByNannyId(airtableNannyId);
   ```

2. Add `getInterviewRequestsByNannyId` to `lib/airtable/interview-requests.ts`:
   ```ts
   export async function getInterviewRequestsByNannyId(nannyId: string) {
     return base(INTERVIEW_REQUESTS_TABLE)
       .select({ filterByFormula: `{nannyId} = '${nannyId}'` })
       .all();
   }
   ```

3. Update the page to fetch and render:
   - Host name and family summary
   - 5 proposed time slots
   - Status badge
   - "Select a slot" or "View meeting" depending on status
   - Empty state when no requests exist

---

### 3.2 Admin Subscriptions — Payment Tracking

**Current state:** Shows host counts by tier. No payment history, renewal dates, or revenue tracking.

**Implementation options:**

**Option A — GHL-based (recommended for MVP):**
- Add a `paymentStatus` and `paidAt` field to the Hosts table in Airtable.
- When GHL webhook fires on payment, update these fields.
- Display on the admin subscriptions page.

**Option B — Stripe integration (post-MVP):**
- Install `stripe` package.
- Create checkout sessions for tier upgrades.
- Use Stripe webhooks to update tier and payment status.
- Display Stripe payment data on admin page.

---

### 3.3 Admin Reported Issues

**Current state:** Static placeholder at `app/admin/issues/page.tsx`.

**Implementation steps:**

1. Create a `ReportedIssues` table in Airtable with fields: `id`, `userId`, `userEmail`, `subject`, `description`, `status` (Open/In Progress/Resolved), `createdTime`.
2. Create API routes:
   - `POST /api/issues` — user submits an issue
   - `GET /api/admin/issues` — admin lists all issues
   - `PATCH /api/admin/issues/[id]` — admin updates status
3. Add a "Report an issue" link on host and nanny dashboards.
4. Update the admin page to list issues with status filters.

---

### 3.4 Delete Dead Code

**Files to remove or clean up:**

| File | Issue |
|------|-------|
| `components/ProceedPassClient.tsx` | Calls non-existent `/api/ghl/update-proceed-pass`. Not used anywhere. Delete it. |
| `app/api/scheduling/nanny-select/route.ts` | Uses a stub that always returns `null`. No caller. The real flow uses `/api/interview-requests/[id]/select-slot`. Delete or mark as deprecated. |
| Duplicate matching functions in `lib/airtable/matching.ts` | `findMatchesForHost`, `calculateMatchScore`, `passesMustMatchFilters`, `createMatchesAndShortlist` — consolidate into `lib/matching/`. |

---

### 3.5 Age Group Mapping Typo

**File:** `lib/matching/utils.ts`

**Problem:** `AGE_GROUP_MAP` has asymmetric entries:
```ts
teen: ['teens']    // maps 'teen' → includes 'teens'
// but does NOT map 'teens' → includes 'teen'
```

If host uses "Teen" and nanny uses "Teens" (or vice versa), matching may fail.

**Fix:** Ensure both directions are mapped:
```ts
teen: ['teen', 'teens'],
teens: ['teen', 'teens'],
```

---

### 3.6 GHL Workflow Triggers

Three places where GHL notifications are marked as TODO:

| Trigger Point | File | What to Send |
|---------------|------|-------------|
| Shortlist created | `app/api/matching/trigger/route.ts` | Shortlist tokenized URL to host |
| Both parties proceed | `app/api/matches/proceed-pass/route.ts` | Notify GHL to trigger welcome/chat workflow |
| Interview meeting created | `app/api/scheduling/nanny-select/route.ts` | Meeting join links to both parties |

**How to implement each:**

Create `lib/ghl/workflows.ts`:
```ts
export async function triggerGHLWorkflow(contactId: string, workflowData: Record<string, unknown>) {
  // POST to GHL inbound webhook with event-specific data
  // GHL workflows will handle email sending, pipeline updates, etc.
}
```

Call from each trigger point with the relevant data (shortlist URL, match details, meeting links).

---

## 4. Low Priority — Polish & Enhancements

---

### 4.1 In-App Notifications

**Current state:** No notification system. Dashboard cards (e.g. host dashboard, nanny dashboard) show `—` or static text for notifications. There is no notification bell in the nav and no `notifications` table in the app database.

**Relevant files:**
- Host dashboard: `app/host/dashboard/page.tsx`
- Nanny dashboard: `app/nanny/dashboard/page.tsx`
- Host/nanny layouts (nav): `app/host/layout.tsx`, `app/nanny/layout.tsx`
- PostgreSQL schema: `scripts/schema.sql` (no `notifications` table yet)

**MVP approach (simple polling):**

1. **Schema:** Add a `notifications` table in PostgreSQL (e.g. in `scripts/schema.sql`):
   - `id`, `user_id` (FK to users), `type` (e.g. `shortlist_ready`, `both_proceeded`, `interview_request`, `meeting_created`), `title`, `message`, `read` (boolean, default false), `link` (optional URL), `created_time`.
   - Indexes on `user_id` and `read` for fast “unread for user” queries.

2. **Data layer:** Create `lib/db/notifications.ts` with:
   - `createNotification(userId, { type, title, message, link })`
   - `getUnreadByUserId(userId)`, `markAsRead(id)`, optional `markAllAsRead(userId)`.

3. **API routes:**
   - `GET /api/notifications` — returns unread (and optionally recent read) for the current user; used for bell dropdown and badge count.
   - `PATCH /api/notifications/[id]/read` — mark one as read.
   - Optional: `PATCH /api/notifications/read-all` — mark all as read for current user.

4. **UI:** Add a notification bell icon to the host and nanny layout nav (e.g. next to profile/logout). Show unread count badge; click opens a dropdown or sidebar with list (title, message, link, time). Poll every 30–60 seconds or refetch on focus.

5. **Creation points:** Insert a notification at:
   - New shortlist delivered (host) — e.g. in matching trigger or shortlist delivery flow.
   - Both proceeded on a match (host and nanny) — in `app/api/matches/proceed-pass/route.ts` after creating conversation.
   - Interview request created (nanny) — after creating `InterviewRequest` and sending link.
   - Meeting created (host and nanny) — after Google Meet link is set on `interview_requests`.

---

### 4.2 Chat File Attachments

**Current state:** The `messages` table has an `attachment_url` column (see `scripts/schema.sql` and `lib/db/chat.ts`). The chat send API and types support an optional `attachmentUrl` when creating a message, but the UI does not: there is no upload control and no display of attachments. Messages are text-only in the thread.

**Relevant files:**
- Messages schema: `scripts/schema.sql` (messages.attachment_url), `lib/db/chat.ts` (`addMessage` accepts `attachmentUrl`; row mapping includes `attachment_url`).
- Types: `types/airtable.ts` — `Message` has `attachmentUrl?: string`.
- Chat UI: `app/host/chat/[conversationId]/ChatThreadClient.tsx`, `app/nanny/chat/[conversationId]/page.tsx` (uses same client with `isHost={false}`).
- Upload reference: `app/api/upload/profile-image/route.ts` (Vercel Blob, auth, size limit).

**Implementation:**

1. **Upload API:** Add `app/api/upload/chat-attachment/route.ts`:
   - Require auth; optionally restrict to participants of the conversation (look up by `conversationId` from body or query).
   - Accept `multipart/form-data` or base64 file; max size (e.g. 5 MB); allow images and PDFs (or a safe allowlist).
   - Upload to Vercel Blob under a prefix like `chat-attachments/{conversationId}/`; return `{ url }`.

2. **ChatThreadClient:** In `app/host/chat/[conversationId]/ChatThreadClient.tsx` (and ensure nanny thread uses same component):
   - Add a paperclip/attachment button next to the message input.
   - On file select: call the new upload API, then call `POST /api/chat/send` with `content` (optional caption) and `attachmentUrl: url`.
   - In the message list, for each message: if `msg.attachmentUrl` is set, render a clickable link (“View attachment”) or an image thumbnail (if image/*) that opens in a new tab; keep existing text and timestamp.

3. **Security:** Validate file type and size server-side; do not execute or serve uploaded files as HTML. Consider virus scanning for production.

---

### 4.3 Email Verification on Signup

**Current state:** On user creation, `emailVerified` is set to `false` in the users table and is never updated by the app. The codebase already has verification email sending (`sendVerificationEmail` in `lib/email/send.ts`), a resend endpoint (`app/api/auth/resend-verification/route.ts`), and an email verification token table (`email_verification_tokens` in `scripts/schema.sql`). The missing piece is wiring the verify-email handler to set `emailVerified = true` and optionally enforcing “verified only” for sensitive actions.

**Relevant files:**
- Users: `lib/db/users.ts` (user create/update; need `updateUser(id, { emailVerified: true })`).
- Schema: `scripts/schema.sql` — `users.email_verified`, `email_verification_tokens` table.
- Email: `lib/email/send.ts` (`sendVerificationEmail`), `lib/email/index.ts`.
- Signup: `app/api/auth/signup/route.ts` (create user, send verification email if implemented).
- Verify endpoint: `app/api/auth/verify-email/route.ts` (if present — confirm it reads token, finds user, updates `emailVerified`, deletes/expires token).

**Implementation:**

1. **On signup (email/password):** After creating the user, generate a verification token, store it in `email_verification_tokens` with expiry (e.g. 24 hours), and call `sendVerificationEmail({ to, name, token })`. Link format: `${config.app.url}/api/auth/verify-email?token=...` or a dedicated page that calls that API.

2. **Verify handler:** In `app/api/auth/verify-email/route.ts` (or equivalent): validate token (look up in `email_verification_tokens`, check expiry), get associated email/user, call `updateUser(userId, { emailVerified: true })`, delete or mark token used, redirect to login or dashboard with success message.

3. **Optional enforcement:** Restrict “send message”, “schedule interview”, or “proceed” until `emailVerified` is true; show a banner on dashboard asking user to verify and use existing “Resend verification email” from profile or a dedicated page.

---

### 4.4 Contract Management

**Current state:** Host and nanny dashboards show placeholder cards for “Contract” or “Contract status”. Onboarding collects contract-related preferences (e.g. host: `preferredContractType`, `trialPeriodPreference`; nanny: contract type, preferred days off) and stores them in the host/nanny `data` JSONB. There is no contracts table, no PDF or document generation, and no signing flow.

**Relevant files:**
- Host onboarding: `lib/validation/host-onboarding.ts` (e.g. `preferredContractType`, `trialPeriodPreference`).
- Nanny onboarding: `lib/validation/nanny-onboarding.ts` (contract type, compensation fields).
- Dashboards: `app/host/dashboard/page.tsx`, `app/nanny/dashboard/page.tsx` (placeholder cards).

**Post-MVP approach:**

1. **Schema:** Add a `contracts` table (e.g. in PostgreSQL): `id`, `match_id`, `host_id`, `nanny_id`, `status` (draft / sent / signed / cancelled), `document_url` (optional — link to generated PDF), `signed_at`, `created_time`, `updated_time`. Optionally a `contract_versions` or JSONB `terms` for versioning.

2. **Templates:** Build a contract template (e.g. rich text or Markdown) with placeholders for family name, nanny name, start date, salary, hours, etc., filled from match + host + nanny data. Generate PDF (e.g. with a server-side library or external service) and store in Blob; save URL in `contracts.document_url`.

3. **Flow:** For a given match (e.g. after both proceeded or after interview): allow host or admin to “Generate contract”; create `contracts` row, generate PDF, optionally send link by email (existing email layer). “Sign” can be in-app (checkbox + timestamp) or link to DocuSign/HelloSign; update `status` and `signed_at`.

4. **VIP:** Pre-fill contract from match and tier rules; optionally different template or terms for VIP/Fast Track.

---

### 4.5 Profile Image Persistence Gap

**Current state:** `POST /api/upload/profile-image` (see `app/api/upload/profile-image/route.ts`) uploads the file to Vercel Blob and returns `{ url }`. It does not write to the host or nanny profile itself. The onboarding forms (host and nanny) hold the URL in component state (`profileImageUrl`) and only persist it when the user saves the segment that includes profile (e.g. “Profile” step). Host/nanny data is stored in PostgreSQL: `hosts.data` and `nannies.data` are JSONB and include all onboarding fields; `lib/db/hosts.ts` and `lib/db/nannies.ts` merge incoming fields into `data` on create/update.

**Relevant files:**
- Upload: `app/api/upload/profile-image/route.ts`
- Host onboarding: `app/host/onboarding/page.tsx` (state `profileImageUrl`, save via `saveSegment` with segment `profile`), `lib/validation/host-onboarding.ts` (segment `profile` includes `profileImageUrl`).
- Nanny onboarding: `app/nanny/onboarding/page.tsx` (same pattern), `lib/validation/nanny-onboarding.ts`.
- API: `app/api/host/onboarding/route.ts`, `app/api/nanny/onboarding/route.ts` — segment save sends validated segment keys to `updateHost`/`updateNanny`; Profile segment keys include `profileImageUrl`, so it is persisted if the user saves the Profile step.

**Verify:**

1. Confirm that after uploading a profile image and clicking “Save” on the Profile step, the host or nanny record in the DB has `data.profileImageUrl` (or equivalent) set. Check via admin or a quick GET of the onboarding API.
2. If the user uploads an image but navigates away without saving the Profile segment, the URL is lost (by design — only saved on explicit save). Consider adding a short in-app note: “Save this section to keep your profile photo.”
3. Optional improvement: auto-save `profileImageUrl` in the same request as the upload (e.g. upload API accepts optional `hostId`/`nannyId` and updates the record), so the image is stored even if the user never clicks Save on the Profile step. Weigh against accidental overwrites.

---

### 4.6 CV Page “Schedule interview” and “Back to shortlist” Links

**Current state:** On the tokenized CV page (`app/(tokenized)/cv/[token]/page.tsx`), when both parties have proceeded, the app shows “Open chat” (correct link to `/chat/open/[matchId]`) and “Schedule interview (placeholder)” with `href="#"`. There is also a “Back to shortlist” link with `href="#"`. So the host cannot reach the schedule-interview or shortlist flow from the CV page.

**Relevant files:**
- `app/(tokenized)/cv/[token]/page.tsx` — both-proceeded block and footer links.
- Token payload: `payload.matchId`, `payload.shortlistId`, `payload.hostId` (present when viewer is host).
- Host schedule interview: `app/host/schedule-interview/[matchId]/page.tsx` (requires auth).
- Tokenized shortlist: `/(tokenized)/shortlist/[token]` — needs a shortlist token.

**Implementation:**

1. **Schedule interview:** For the host viewer (e.g. when `payload.hostId` is set), replace the placeholder link with a link to `/host/schedule-interview/[matchId]` using `payload.matchId`. Note: the host must be logged in; if they opened the CV via token while logged out, they may need to log in and then go to that URL (or re-open from dashboard). So either link to `/host/schedule-interview/[matchId]` (works when logged in) or to a tokenized schedule-interview page if you add one later.

2. **Back to shortlist:** If `payload.shortlistId` is present, generate a shortlist token for that shortlist (and host) and set “Back to shortlist” to `/(tokenized)/shortlist/[shortlistToken]`. If not (e.g. nanny viewing their own CV from matches), show “Back to dashboard” linking to `/nanny/dashboard` or hide “Back to shortlist”.

---

## 5. Deferred / Post-MVP

These are mentioned in documentation but explicitly out of scope for the initial release.

| Feature | Notes |
|---------|-------|
| **Stripe payment integration** | GHL handles payments for now. Add Stripe when you need in-app checkout or subscription management. |
| **Real-time WebSocket chat** | `socket.io-client` is installed but unused. Current polling works for MVP. Migrate to WebSocket when scale demands it or for better UX. Requires a persistent server (not serverless). |
| **GHL calendar integration** | `lib/ghl/calendars.ts` is a stub. Implement when GHL calendar booking is needed alongside Google Calendar. |
| **Zoom integration** | Referenced in docs; current implementation uses Google Meet. Add Zoom as an alternative if needed. |
| **Advanced payment tracking** | Revenue dashboards, renewal reminders, failed payment handling. Build after Stripe is integrated. |
| **Mobile app / PWA** | Not in scope. Current responsive web UI serves MVP. |

---

## Implementation Order (Recommended)

```
Phase 1 — Critical Fixes (1-2 days)
├── 1.1  Fix nanny proceed/pass token (hostId leak)
├── 1.2  Fix CvProceedPassClient isHost hardcode
├── 1.3  Consolidate duplicate matching implementations
└── 2.5  Add auth to matching trigger endpoint

Phase 2 — Email & Notifications (2-3 days)
├── 2.1  Install Resend, create email client and templates
├── 2.1a Wire password reset email
├── 2.1b Wire shortlist delivery email
├── 2.1c Wire interview request email
├── 2.1d Wire interview confirmed email
└── 2.1e Wire both-proceeded email

Phase 3 — Complete Interview Flow (2-3 days)
├── 2.2  Generate interview token + send to nanny
├── 3.1  Build nanny interview-requests page (data-driven)
├── 2.3  Build host meetings page (data-driven)
└── 2.3  Build nanny meetings page (data-driven)

Phase 4 — GHL Integration (1-2 days)
├── 2.4  GHL webhook HMAC verification
├── 2.4  GHL payment webhook → tier update
└── 3.6  GHL workflow triggers (shortlist, proceed, meeting)

Phase 5 — Cleanup & Polish (1-2 days)
├── 3.4  Delete dead code (ProceedPassClient, scheduling/nanny-select, duplicate matching)
├── 3.5  Fix age group mapping typo
├── 3.2  Admin subscriptions enhancement
└── 3.3  Admin reported issues (if needed for launch)

Phase 6 — Nice-to-Have (ongoing)
├── 4.1  In-app notifications
├── 4.2  Chat file attachments
├── 4.3  Email verification on signup
└── 4.5  Verify profile image persistence
```

**Estimated total: 7–12 working days** for Phases 1–5, depending on GHL webhook payload discovery and email template design.

---

*This document reflects the codebase as of February 27, 2026.*
