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

**Current state:** No notification system. Dashboard cards show `—` for notifications.

**MVP approach (simple polling):**

1. Create a `Notifications` table in Airtable: `id`, `userId`, `type`, `title`, `message`, `read` (checkbox), `link`, `createdTime`.
2. Create API routes:
   - `GET /api/notifications` — fetch unread for current user
   - `PATCH /api/notifications/[id]/read` — mark as read
3. Add a notification bell icon to the navigation with unread count badge.
4. Create notifications at key events: new shortlist, both proceeded, interview request, meeting created.

---

### 4.2 Chat File Attachments

**Current state:** `attachmentUrl` field exists on Messages but no upload UI in chat.

**Implementation:**
1. Reuse the existing `/api/upload/profile-image` pattern (Vercel Blob) with a new `/api/upload/chat-attachment` route.
2. Add a paperclip/attachment button to `ChatThreadClient`.
3. On upload success, send a message with `attachmentUrl` set.
4. Render attachments as clickable links or image previews in the message bubble.

---

### 4.3 Email Verification on Signup

**Current state:** `emailVerified` is set to `false` on user creation and never updated.

**Implementation:**
1. Generate a verification token on signup, store in Airtable.
2. Send verification email with link: `/api/auth/verify-email?token=...`.
3. On click, set `emailVerified = true` in Airtable.
4. Optionally restrict certain features until verified.

---

### 4.4 Contract Management

**Current state:** Placeholder cards on dashboards. `preferredContractType` is collected in onboarding but no contract generation or management exists.

**Post-MVP approach:**
1. Create a `Contracts` table in Airtable.
2. Build a contract template system (PDF generation or rich text).
3. VIP tier: pre-filled contracts based on match data.
4. Contract signing flow (or link to external e-sign like DocuSign).

---

### 4.5 Profile Image Persistence Gap

**Current state:** `/api/upload/profile-image` uploads to Vercel Blob and returns the URL, but does not write the URL back to the user's Airtable profile. The caller (onboarding form) must persist it.

**Verify:** Confirm that the onboarding form's save logic includes `profileImageUrl` in its Airtable update payload. If not, the uploaded image URL is lost when the user navigates away.

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
