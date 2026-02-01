# Nanny Whisperer — Single-Prompt Achievable Tasks

Each task is designed to be completed in **one focused prompt/session**. Dependencies are listed so you can run tasks in order or in parallel where possible.

**Tech stack: Next.js + Airtable only.** No separate SQL database. All app data (users, chat, interview requests, etc.) lives in one Airtable base. GHL handles payments, workflows, and calendars as availability sources; the app reads/writes Airtable and exposes tokenized pages + APIs.

---

## Airtable Base Structure (Next.js + Airtable)

Use **one Airtable base** with these tables. All task prompts assume this structure.

| Table | Purpose | Key fields |
|-------|---------|------------|
| **Users** | App auth: login, session link to Airtable records | `id`, `email`, `name`, `userType` (Host/Nanny), `passwordHash`, `ghlContactId`, `airtableHostId`, `airtableNannyId`, `emailVerified`, `createdTime` |
| **Hosts** | Host onboarding & profile | Onboarding doc fields + `userId` (link to Users or email match) |
| **Nannies** | Nanny onboarding & profile | Onboarding doc fields + `userId`, `badge` (Basic/Verified/Certified) |
| **Matches** | Host–nanny match + Proceed/Pass | `hostId`, `nannyId`, `score`, `hostProceed`, `nannyProceed`, `bothProceedAt`, `status` |
| **Shortlists** | Curated list for a host | `hostId`, `matchIds` (linked records), `createdTime`, `deliveredAt` |
| **Conversations** | Chat: one per match | `matchId`, `hostId`, `nannyId`, `createdTime` |
| **Messages** | Chat messages | `conversationId`, `senderId`, `senderType` (Host/Nanny), `content`, `attachmentUrl`, `createdTime` |
| **InterviewRequests** | 5 slots + selection + Meet | `matchId`, `hostId`, `nannyId`, `slot1`..`slot5`, `selectedSlotIndex`, `googleMeetLink`, `googleCalendarEventId`, `status`, `isVip`, `createdTime` |
| **PasswordResetTokens** | Forgot password | `email`, `token`, `expiresAt`, `createdTime` |
| **GoogleCalendarTokens** (optional) | Google Calendar OAuth per user | `userId`, `refreshToken`, `calendarId`, `updatedTime` |

- **Users**: one record per app account; `airtableHostId` / `airtableNannyId` set after onboarding (so session knows which Host/Nanny record to use).
- **Hosts / Nannies**: one record per profile; link to User by `userId` (Users.id) or by email.
- All IDs in prompts refer to Airtable record IDs unless stated otherwise.

---

## Legend

| Symbol | Meaning |
|-------|--------|
| **ID** | Task identifier |
| **Depends on** | Task IDs that must be done first (optional if empty) |
| **Prompt** | What to ask in a single prompt |
| **Scope** | Files/routes to create or modify |
| **Done when** | Acceptance criteria |

---

## Phase 1: Project Setup & Design System

### T1.1 — Next.js app with TypeScript and Tailwind

**Depends on:** —

**Prompt:**  
Set up a new Next.js 14+ app with App Router, TypeScript, and Tailwind CSS. Include `tailwind.config.ts` with the Nanny Whisperer brand colors as CSS variables: Pastel Black `#2E2E2E`, Dark Green `#3F4C44`, Light Green `#C8D5C4`, Light Pink `#EAD5D1`, Off-White `#F8F6F2`. Add a simple layout with a header and footer placeholder.

**Scope:**  
`package.json`, `tsconfig.json`, `tailwind.config.ts`, `app/layout.tsx`, `app/globals.css`, `next.config.js`

**Done when:**  
`npm run dev` runs; brand colors are available as Tailwind theme or CSS variables; layout renders.

---

### T1.2 — Design system: buttons, inputs, cards

**Depends on:** T1.1

**Prompt:**  
Create reusable UI components using the Nanny Whisperer palette: `Button` (primary/secondary/ghost), `Input` (text, email, password), `Card` (with optional image and footer). Export them from `components/ui/` and add a simple demo page that shows all variants.

**Scope:**  
`components/ui/Button.tsx`, `Input.tsx`, `Card.tsx`, `components/ui/index.ts`, `app/demo-ui/page.tsx` (optional, can remove later)

**Done when:**  
Components render with brand colors; TypeScript types are exported; no lint errors.

---

### T1.3 — Environment and config

**Depends on:** T1.1

**Prompt:**  
Add a central config for environment variables: `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GHL_API_KEY`, `GHL_ACCOUNT_ID`, `GHL_WEBHOOK_SECRET`, `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `JWT_SECRET` (or `TOKEN_SECRET`). Create `lib/config.ts` that reads and exports typed env (with safe defaults for missing vars). Add `.env.example` listing all keys. No DATABASE_URL — all data is in Airtable.

**Scope:**  
`lib/config.ts`, `.env.example`

**Done when:**  
Config is typed; app does not crash when vars are missing; `.env.example` documents all keys.

---

## Phase 2: Authentication

### T2.1 — Users table in Airtable and client

**Depends on:** T1.3

**Prompt:**  
Add a **Users** table in the same Airtable base with fields: `email` (unique), `name`, `userType` (single select: Host | Nanny), `passwordHash` (long text), `ghlContactId`, `airtableHostId` (link to Hosts or empty), `airtableNannyId` (link to Nannies or empty), `emailVerified` (checkbox), `createdTime`. Create `lib/airtable/users.ts` with: `getUserByEmail(email)`, `getUserById(id)`, `createUser({ email, name, userType, passwordHash })`, `updateUser(id, fields)`. Use the existing Airtable client and base id from config. Enforce `userType` in types.

**Scope:**  
Airtable base: Users table, `lib/airtable/users.ts`, `types/airtable.ts` (User type)

**Done when:**  
Can create and read users by id/email from Airtable; `userType` is enforced; session will use `airtableHostId` or `airtableNannyId` for host/nanny record lookup.

---

### T2.2 — NextAuth setup with Credentials and Google

**Depends on:** T1.3, T2.1

**Prompt:**  
Configure NextAuth.js (or Auth.js) with Credentials provider (email + password) and Google OAuth. On sign-in/sign-up, load or create user from Airtable Users table and attach `userId`, `userType`, `email`, `name`, `ghlContactId`, `airtableHostId`, `airtableNannyId` to the session (use `airtableHostId` for hosts and `airtableNannyId` for nannies when reading Host/Nanny records). Implement login page at `/login` with email/password form and “Continue with Google” button. Redirect after login to `/host/dashboard` or `/nanny/dashboard` based on `userType`.

**Scope:**  
`app/api/auth/[...nextauth]/route.ts`, `app/login/page.tsx`, `lib/auth.ts` (or auth config), session callback

**Done when:**  
Login with email and with Google works; session contains user fields; role-based redirect works.

---

### T2.3 — Signup page with role selection

**Depends on:** T2.2

**Prompt:**  
Add signup flow: `/signup` shows “I am a Nanny” and “We are a host family” (role selection). Choosing one goes to `/signup/[role]` (host or nanny). There, show either Google signup or email form (First name, Last name, Email, Password). On submit, create user in Airtable Users table with `userType`, then sign in and redirect to the correct dashboard. Do not implement payment or onboarding yet.

**Scope:**  
`app/signup/page.tsx`, `app/signup/[role]/page.tsx`, signup API or logic in auth

**Done when:**  
User can choose role and sign up with email or Google; user record has correct `userType`; redirect to dashboard works.

---

### T2.4 — Password hashing and Credentials validation

**Depends on:** T2.1, T2.2

**Prompt:**  
For email signup, hash passwords with bcrypt (or similar) before storing. In Credentials provider, verify password on login and return user object. Add basic validation: email format, password min length (e.g. 8). Store only hashed password in Airtable Users table (`passwordHash` field).

**Scope:**  
`lib/auth/password.ts` (hash, verify), Credentials authorize in NextAuth config

**Done when:**  
Signup stores hashed password; login validates password; invalid credentials are rejected.

---

### T2.5 — Auth middleware and protected routes

**Depends on:** T2.2

**Prompt:**  
Add middleware that protects `/host/*` (only `userType === 'host'`), `/nanny/*` (only `userType === 'nanny'`), and redirects unauthenticated users to `/login`. Redirect hosts from `/nanny/*` and nannies from `/host/*` to their dashboard. Allow public access to `/`, `/login`, `/signup`, `/shortlist/[token]`, `/cv/[token]`, `/interview/[token]`.

**Scope:**  
`middleware.ts`

**Done when:**  
Unauthenticated user cannot access host/nanny routes; wrong role is redirected; tokenized routes stay public.

---

### T2.6 — Forgot password (request + reset)

**Depends on:** T2.2, T2.4

**Prompt:**  
Add “Forgot password?” on login page linking to `/forgot-password`. That page has an email input; on submit, generate a secure reset token (e.g. crypto.randomBytes), store it with expiry (e.g. 1 hour) in Airtable **PasswordResetTokens** table (fields: `email`, `token`, `expiresAt`, `createdTime`), and send a link `/reset-password?token=...` via email (use a stub or Resend/Nodemailer). Add `/reset-password` page that accepts token and new password, validates token, updates password hash, and redirects to login.

**Scope:**  
`app/forgot-password/page.tsx`, `app/reset-password/page.tsx`, `app/api/auth/forgot-password/route.ts`, `app/api/auth/reset-password/route.ts`, Airtable PasswordResetTokens table + `lib/airtable/password-reset.ts`

**Done when:**  
Requesting reset sends email with link; reset link allows setting new password; invalid/expired token is rejected.

---

## Phase 3: Data Layer (Airtable & GHL)

### T3.1 — Airtable client and types

**Depends on:** T1.3

**Prompt:**  
Create a typed Airtable client: `lib/airtable/client.ts` (using official Airtable JS lib or fetch). Define TypeScript types for Host and Nanny records (fields from Onboarding doc: name, contact, location, availability, skills, etc.). Add helper functions: `getHost(id)`, `getNanny(id)`, `getHosts()`, `getNannies()` with proper typing.

**Scope:**  
`lib/airtable/client.ts`, `lib/airtable/types.ts`, `types/airtable.ts`

**Done when:**  
Can fetch host and nanny records from Airtable; types match onboarding fields.

---

### T3.2 — Airtable: Matches and Shortlists tables

**Depends on:** T3.1

**Prompt:**  
Define Airtable types and client methods for Matches (hostId, nannyId, score, hostProceed, nannyProceed, bothProceedAt, status) and Shortlists (hostId, nannyIds or matchIds, createdAt, deliveredAt). Implement: `getMatchesByHost`, `getMatchesByNanny`, `getShortlist(id)`, `createMatch`, `updateMatch`, `createShortlist`, `updateShortlist`.

**Scope:**  
`lib/airtable/matches.ts`, `lib/airtable/shortlists.ts`, extend `types/airtable.ts`

**Done when:**  
Matches and shortlists can be read/written via typed functions.

---

### T3.3 — GHL API client (contacts and webhooks)

**Depends on:** T1.3

**Prompt:**  
Create a minimal GHL API client: `lib/ghl/client.ts`. Implement: get contact by id, create/update contact (email, name, custom fields for userType). Add a webhook route `POST /api/webhooks/ghl` that verifies signature (if GHL sends one), parses body, and returns 200. Log payload for now; do not persist. Document required GHL webhook URL and secret.

**Scope:**  
`lib/ghl/client.ts`, `app/api/webhooks/ghl/route.ts`, env for `GHL_API_KEY`, `GHL_WEBHOOK_SECRET`

**Done when:**  
GHL client can read/update contacts; webhook endpoint accepts POST and logs payload.

---

## Phase 4: Onboarding

### T4.1 — Onboarding form fields (Host) — data only

**Depends on:** T3.1

**Prompt:**  
From the Onboarding doc, list all Host onboarding fields and add them to Airtable Host type and to a JSON schema or Zod schema for validation. Include: profile (name, DOB, image), contact (address, phone), location & living (job location, accommodation, languages, travel, children), schedule (start/finish date, hours, days, weekends), childcare needs (age groups, special needs, max children), skills, lifestyle, dietary, compensation, about. Do not build UI yet.

**Scope:**  
`lib/airtable/types.ts` (Host), `lib/validation/host-onboarding.ts` (Zod or JSON schema)

**Done when:**  
Host type and validation schema cover all onboarding fields.

---

### T4.2 — Onboarding form fields (Nanny) — data only

**Depends on:** T3.1

**Prompt:**  
Same as T4.1 but for Nanny: profile, contact, about (location, nationality, experience, driving, smoke, diet), language skills, location preferences, schedule & availability, experience, skills, lifestyle, dietary, compensation, about text. Add to Airtable Nanny type and validation schema. No UI.

**Scope:**  
`lib/airtable/types.ts` (Nanny), `lib/validation/nanny-onboarding.ts`

**Done when:**  
Nanny type and validation schema cover all onboarding fields.

---

### T4.3 — Host onboarding page (multi-step form)

**Depends on:** T4.1, T2.5

**Prompt:**  
Build Host onboarding at `/host/onboarding` (or `/host/profile/edit`): multi-step form that collects all Host fields from T4.1. Use the validation schema from T4.1 on submit. On submit, call Airtable to create/update Host record and update the current user’s `airtableHostId` in the Airtable Users table (link to the Host record). Redirect to `/host/dashboard` after success. Use existing UI components and brand colors.

**Scope:**  
`app/host/onboarding/page.tsx` (or profile edit), `app/api/host/onboarding/route.ts`, form state and steps

**Done when:**  
Host can complete all steps and submit; Airtable has record; user’s `airtableRecordId` is updated.

---

### T4.4 — Nanny onboarding page (multi-step form)

**Depends on:** T4.2, T2.5

**Prompt:**  
Same as T4.3 but for Nanny at `/nanny/onboarding`: multi-step form for all Nanny fields, validation, submit to Airtable, update user’s `airtableNannyId` in the Airtable Users table (link to the Nanny record), redirect to `/nanny/dashboard`.

**Scope:**  
`app/nanny/onboarding/page.tsx`, `app/api/nanny/onboarding/route.ts`

**Done when:**  
Nanny can complete all steps and submit; Airtable has record; user record updated.

---

### T4.5 — Sync new user to GHL on signup

**Depends on:** T2.3, T3.3

**Prompt:**  
When a user signs up (email or Google), after creating the user in Airtable Users table, create or update a GHL contact with the same email and name. Store the returned `ghlContactId` on the Airtable User record and in session. If GHL has a custom field for userType (host/nanny), set it. Handle “contact already exists” by updating and storing id.

**Scope:**  
Signup flow (e.g. in auth callback or signup API), `lib/ghl/client.ts` (createOrUpdateContact)

**Done when:**  
Every new user has a GHL contact and `ghlContactId` stored; session includes `ghlContactId`.

---

## Phase 5: Matching & Shortlists

### T5.1 — Matching algorithm (100-point score) — logic only

**Depends on:** T3.1, T3.2

**Prompt:**  
Implement the 100-point matching algorithm from the docs: must-match filters (location, start date, live-in/out, availability, age groups, special needs) — if any fail, score 0. Then compute: Core 40, Skills 20, Values 20, Bonus 20. Expose a function `computeMatchScore(host, nanny)` and `getEligibleNannies(host)` that returns nannies passing must-match, sorted by score. No UI, no Airtable write yet.

**Scope:**  
`lib/matching/algorithm.ts`, `lib/matching/filters.ts`, unit tests optional

**Done when:**  
Given host and nanny records, score is computed correctly; eligible nannies are filtered and sorted.

---

### T5.2 — Shortlist creation and Airtable write

**Depends on:** T5.1, T3.2

**Prompt:**  
When a shortlist is created for a host: run `getEligibleNannies(host)` (respecting tier: Standard/Fast Track/VIP and Certified-only for VIP). Create Match records in Airtable for top N candidates (e.g. 5–10). Create one Shortlist record linking hostId and those matchIds. Implement `createShortlistForHost(hostId)` and call it from an API route `POST /api/shortlists/generate` (protected, host only). Do not send emails yet.

**Scope:**  
`lib/matching/shortlist.ts`, `app/api/shortlists/generate/route.ts`

**Done when:**  
Calling the API creates Matches and one Shortlist in Airtable for the given host.

---

### T5.3 — Token generation and validation (shortlist, CV, interview)

**Depends on:** T1.3

**Prompt:**  
Add a token service: generate short-lived JWT (or signed payload) for types `shortlist`, `cv`, `interview` with payload `{ type, shortlistId?, matchId?, hostId?, nannyId?, exp }`. Expiry e.g. 7 days. Provide `generateToken(type, payload)` and `validateToken(token)` returning payload or null. Store secret in env. No routes yet.

**Scope:**  
`lib/auth/tokens.ts`, `lib/config.ts` (JWT_SECRET or TOKEN_SECRET)

**Done when:**  
Generated token validates and returns correct payload; expired or invalid token returns null.

---

### T5.4 — Tokenized shortlist page

**Depends on:** T5.3, T3.2, T1.2

**Prompt:**  
Implement `/shortlist/[token]`: validate token (type `shortlist`). Load shortlist and match/nanny data from Airtable. Render a grid of nanny summary cards (photo placeholder, name initial, experience, match %, “View full CV”). Each “View full CV” links to `/cv/[cvToken]` where `cvToken` is a new token of type `cv` for that match. Add noindex meta and optional no-crawl headers. Use brand UI components.

**Scope:**  
`app/shortlist/[token]/page.tsx`, `app/api/shortlist/[token]/route.ts` (optional; can load in page), token validation and CV token generation

**Done when:**  
Valid token shows shortlist; invalid/expired shows error; CV link has valid cv token; page is noindex.

---

### T5.5 — Tokenized CV page and Proceed/Pass buttons

**Depends on:** T5.3, T3.1, T3.2, T1.2

**Prompt:**  
Implement `/cv/[token]`: validate token (type `cv`). Load match and nanny full profile from Airtable. Show full CV (all onboarding fields). Add Proceed and Pass buttons. On click, call API `POST /api/matches/proceed-pass` with token and choice (proceed|pass). API updates Match in Airtable (hostProceed/nannyProceed), and if both Proceed, set bothProceedAt and optionally call GHL webhook. Return success. Show “You chose Proceed/Pass” and, if both Proceed, show “Chat” or “Schedule interview” link (link can be placeholder). Do not build chat or scheduling yet.

**Scope:**  
`app/cv/[token]/page.tsx`, `app/api/matches/proceed-pass/route.ts`, Airtable update, optional GHL notify

**Done when:**  
CV page shows full nanny profile; Proceed/Pass update Airtable; both Proceed sets bothProceedAt and shows next-step placeholder.

---

## Phase 6: Host & Nanny Dashboards

### T6.1 — Host dashboard layout and nav

**Depends on:** T2.5, T1.2

**Prompt:**  
Build Host dashboard at `/host/dashboard`: layout with sidebar or top nav (Dashboard, Shortlists, Matches, Chat, Meetings, Profile). Dashboard home shows summary cards: tier (from GHL tag or Airtable — mock “Standard” for now), membership status, count of shortlists, count of pending matches, count of upcoming meetings. Use brand colors and Card components. All counts can be 0 or mocked.

**Scope:**  
`app/host/layout.tsx`, `app/host/dashboard/page.tsx`

**Done when:**  
Host sees dashboard with nav and summary cards; navigation links exist (pages can be placeholder).

---

### T6.2 — Host shortlists list page

**Depends on:** T6.1, T3.2, T5.2

**Prompt:**  
At `/host/shortlists`, list shortlists for the current host (from Airtable, by hostId = user’s session `airtableHostId` — the linked Host record id). Each row: date, count of nannies, “View” link. “View” opens the tokenized shortlist: generate a shortlist token for that shortlist and redirect to `/shortlist/[token]`. Use brand UI.

**Scope:**  
`app/host/shortlists/page.tsx`, `app/api/host/shortlists/route.ts`, token generation for shortlist

**Done when:**  
Host sees list of shortlists; “View” redirects to tokenized shortlist page with correct data.

---

### T6.3 — Host matches list page

**Depends on:** T6.1, T3.2

**Prompt:**  
At `/host/matches`, list matches for the current host with status: Pending, Proceed, Pass, Both Proceed. Each row: nanny name initial, match score, status, “View CV” (opens tokenized CV page with cv token). Use Airtable Matches filtered by hostId. Use brand UI.

**Scope:**  
`app/host/matches/page.tsx`, `app/api/host/matches/route.ts`

**Done when:**  
Host sees matches with status; “View CV” opens correct tokenized CV page.

---

### T6.4 — Nanny dashboard layout and nav

**Depends on:** T2.5, T1.2

**Prompt:**  
Build Nanny dashboard at `/nanny/dashboard`: layout with nav (Dashboard, Shortlisted, Interview requests, Chat, Meetings, Profile). Dashboard home shows: profile badge (Basic/Verified/Certified — mock Basic), count “You’ve been shortlisted” (matches where nanny appears), count of interview requests, count of chats, upcoming meetings. Use brand UI.

**Scope:**  
`app/nanny/layout.tsx`, `app/nanny/dashboard/page.tsx`

**Done when:**  
Nanny sees dashboard with nav and summary; counts can be 0 or mocked.

---

### T6.5 — Nanny “shortlisted” and matches list

**Depends on:** T6.4, T3.2

**Prompt:**  
At `/nanny/matches`, list matches where the current nanny is the nanny (from Airtable). Show: host family summary (e.g. location, kids count), match score, status (Pending / Both Proceed / etc.). “View my CV as they see it” opens tokenized CV page (cv token for that match). Use brand UI.

**Scope:**  
`app/nanny/matches/page.tsx`, `app/api/nanny/matches/route.ts`

**Done when:**  
Nanny sees list of matches; “View my CV” opens correct tokenized CV page.

---

## Phase 7: Chat

### T7.1 — Chat schema and API (Airtable: Conversations, Messages)

**Depends on:** T2.1

**Prompt:**  
Add two Airtable tables in the same base: **Conversations** (fields: `matchId`, `hostId`, `nannyId`, `createdTime`), **Messages** (fields: `conversationId` link, `senderId`, `senderType` single select Host|Nanny, `content` long text, `attachmentUrl` url, `createdTime`). Create `lib/airtable/chat.ts` with: createConversation(matchId, hostId, nannyId), getConversationByMatchId(matchId), getMessages(conversationId), addMessage(conversationId, senderId, senderType, content). API routes: GET/POST for conversations (filter by session user), GET messages, POST send. Enforce that only the host or nanny of that match can access (check session airtableHostId/airtableNannyId against conversation hostId/nannyId).

**Scope:**  
Airtable: Conversations and Messages tables, `lib/airtable/chat.ts`, `app/api/chat/conversations/route.ts`, `app/api/chat/messages/route.ts`, `app/api/chat/send/route.ts`

**Done when:**  
Can create a conversation per match; can list messages and send a message; auth checks participant; all data in Airtable.

---

### T7.2 — Create conversation when both Proceed

**Depends on:** T5.5, T7.1

**Prompt:**  
When both host and nanny click Proceed (in proceed-pass API), after updating Airtable Match, create a Conversation for that matchId if it does not exist. Do not create duplicate conversations. Expose “Open chat” on CV page when both Proceed: link to `/host/chat/[conversationId]` or `/nanny/chat/[conversationId]` (get conversationId from matchId).

**Scope:**  
`app/api/matches/proceed-pass/route.ts`, CV page “Chat” link, `app/api/chat/conversation-by-match/route.ts` (get conversationId by matchId)

**Done when:**  
When both Proceed, conversation exists; host and nanny can open chat via link using conversationId or matchId.

---

### T7.3 — Host chat list and thread UI

**Depends on:** T7.1, T6.1

**Prompt:**  
At `/host/chat`, list conversations for the current host (from Airtable Conversations table, filtered by hostId = session airtableHostId). Each row: nanny name initial, last message preview, unread indicator (optional). Click opens `/host/chat/[conversationId]`. Thread page: load messages, show them in a scrollable list, input at bottom. On submit, POST to send API and refetch or optimistically add message. Use brand UI. Real-time not required (polling or manual refresh is enough for this task).

**Scope:**  
`app/host/chat/page.tsx`, `app/host/chat/[conversationId]/page.tsx`, `app/api/chat/conversations/route.ts`, `app/api/chat/messages/route.ts`, `app/api/chat/send/route.ts`

**Done when:**  
Host sees conversation list and can open a thread and send messages; messages persist and display.

---

### T7.4 — Nanny chat list and thread UI

**Depends on:** T7.1, T6.4

**Prompt:**  
Same as T7.3 but for Nanny: `/nanny/chat`, `/nanny/chat/[conversationId]`. List conversations for current nanny; thread with messages and send. Use same API; enforce nanny can only see their conversations.

**Scope:**  
`app/nanny/chat/page.tsx`, `app/nanny/chat/[conversationId]/page.tsx`

**Done when:**  
Nanny sees conversation list and can send/receive messages in thread.

---

### T7.5 — Chat polling or real-time updates

**Depends on:** T7.3, T7.4

**Prompt:**  
On the chat thread page, poll for new messages every 3–5 seconds (or use Server-Sent Events / WebSocket). Update the message list when new messages arrive. Optionally show “typing” or “last seen” if easy. Keep it simple; polling is acceptable.

**Scope:**  
`app/host/chat/[conversationId]/page.tsx`, `app/nanny/chat/[conversationId]/page.tsx`, optional `app/api/chat/poll/route.ts`

**Done when:**  
Opening the thread in two browsers (host and nanny) shows new messages within a few seconds without refresh.

---

## Phase 8: Calendar & Interview Scheduling

### T8.1 — InterviewRequest table in Airtable and API

**Depends on:** T3.2

**Prompt:**  
Add **InterviewRequests** table in the same Airtable base: fields `matchId`, `hostId`, `nannyId`, `slot1`..`slot5` (datetime or text ISO), `selectedSlotIndex` (number 0–4 or empty), `googleMeetLink` (url), `googleCalendarEventId` (text), `status` (single select: pending_slots | nanny_selected | meeting_created | none_available | cancelled), `isVip` (checkbox), `createdTime`. Create `lib/airtable/interview-requests.ts`: createInterviewRequest(), getById(id), getByMatchId(matchId), updateInterviewRequest(id, fields). API routes: POST create, GET by id, PATCH update (e.g. selectedSlotIndex, googleMeetLink, status).

**Scope:**  
Airtable: InterviewRequests table, `lib/airtable/interview-requests.ts`, `app/api/interview-requests/route.ts`, `app/api/interview-requests/[id]/route.ts`

**Done when:**  
Can create an interview request with 5 slots and later update with selected slot and Meet link; all data in Airtable.

---

### T8.2 — Host: “Choose 5 time slots” page

**Depends on:** T6.1, T8.1, T5.5

**Prompt:**  
For a match where both Proceed and host is Fast Track or VIP, show “Schedule interview” in host dashboard or on CV page. Link to `/host/schedule-interview/[matchId]`. That page: calendar or datetime picker to choose 5 time slots (start time only, duration e.g. 30 min fixed). Submit to API to create InterviewRequest with slot1..slot5 and status pending_slots. Redirect to “Slots sent; nanny will choose one.” Use brand UI.

**Scope:**  
`app/host/schedule-interview/[matchId]/page.tsx`, `app/api/interview-requests/route.ts` (POST), slot validation

**Done when:**  
Host can select 5 slots and submit; InterviewRequest is created; nanny can be notified (manual or next task).

---

### T8.3 — Tokenized interview page (nanny picks slot)

**Depends on:** T5.3, T8.1, T3.1

**Prompt:**  
Implement `/interview/[token]`: validate token (type `interview`). Load InterviewRequest and host summary from Airtable. Show host summary (family, location, kids) and 5 time slots as buttons. Nanny picks one or “None available”. On pick: call API to set selectedSlotIndex and status nanny_selected (or “none_available”). If “None available”, do not create Meet; show “Host will send new slots.” If a slot is picked, show “Meeting will be scheduled shortly” (Meet creation in next task). Use brand UI.

**Scope:**  
`app/interview/[token]/page.tsx`, `app/api/interview-requests/[id]/select-slot/route.ts`, token validation

**Done when:**  
Nanny sees host summary and 5 slots; can pick one or None available; InterviewRequest updates correctly.

---

### T8.4 — Google Calendar OAuth and read busy/free

**Depends on:** T1.3

**Prompt:**  
Add Google Calendar API: OAuth scope for calendar read. After host (or nanny) connects calendar, store refresh token in Airtable **GoogleCalendarTokens** table (userId, refreshToken, calendarId) or in a long-text field on Users if preferred. Implement “Get busy/free for date range” returning list of busy intervals. Expose `getFreeSlots(userId, dateFrom, dateTo)` for the host so the “Choose 5 slots” page can suggest only free times. Optional: same for nanny to avoid double-booking. Use one calendar per user (primary or a chosen calendar id). Do not create events yet.

**Scope:**  
`lib/google/calendar.ts`, `app/api/calendar/connect/route.ts`, `app/api/calendar/free-busy/route.ts`, OAuth flow and token storage

**Done when:**  
User can connect Google Calendar; API returns free/busy for a date range; host can use this to pick 5 slots.

---

### T8.5 — VIP: overlap with Kayley’s calendar

**Depends on:** T8.1, T8.4

**Prompt:**  
For VIP matches, Kayley’s calendar id (or GHL calendar) is configured in env. When showing slots to the nanny, filter the host’s 5 slots to only those where Kayley is free (call getFreeSlots for Kayley’s calendar). If no overlap, return a clear message “No overlap with concierge; host will send new slots” and do not show any slot. Store isVip on InterviewRequest and use it in the interview page. Do not create Meet yet.

**Scope:**  
`lib/scheduling/calendar-overlap.ts`, `app/interview/[token]/page.tsx` (filter slots for VIP), env `KAYLEY_CALENDAR_ID` or GHL calendar read

**Done when:**  
VIP interview page shows only slots that overlap with Kayley; non-VIP shows all 5 slots.

---

## Phase 9: Google Meet

### T9.1 — Google Calendar event with Meet link

**Depends on:** T8.4, T8.1

**Prompt:**  
When nanny has selected a slot (selectedSlotIndex set), create a Google Calendar event at that time with `conferenceData` (Google Meet). Use a service calendar (e.g. “Nanny Whisperer meetings”) or the host’s calendar; store calendar id in env. Event title: “Nanny Whisperer – Interview”. Add attendees: host email, nanny email; if VIP, add Kayley’s email. After creation, read event to get `meetLink` (or hangoutLink). Save googleMeetLink and googleCalendarEventId on InterviewRequest and set status meeting_created. Expose this as an API or background job triggered after slot selection.

**Scope:**  
`lib/google/meet.ts` (create event with conferenceData), `app/api/interview-requests/[id]/create-meeting/route.ts`, update InterviewRequest

**Done when:**  
Selecting a slot triggers event creation; event has Meet link; InterviewRequest has meet link and event id.

---

### T9.2 — Send Meet link to host and nanny (email or in-app)

**Depends on:** T9.1

**Prompt:**  
After Meet is created, send the link to host and nanny. Option A: call GHL workflow/API to send email/SMS with link. Option B: in-app only: show “Upcoming meetings” on host and nanny dashboards with this Meet link and datetime. Implement Option B at minimum: add “Upcoming meetings” section that lists InterviewRequests with status meeting_created and shows Meet link. Optionally add webhook or API call to GHL for email.

**Scope:**  
`app/host/meetings/page.tsx`, `app/nanny/meetings/page.tsx`, `app/api/host/meetings/route.ts`, `app/api/nanny/meetings/route.ts`, optional GHL notify

**Done when:**  
Host and nanny see the meeting and Meet link in their dashboard; optional email sent via GHL.

---

### T9.3 — “None available” retry: host resubmits 5 slots

**Depends on:** T8.2, T8.3

**Prompt:**  
When nanny clicks “None available”, set InterviewRequest status to none_available and optionally notify host (in-app notification or GHL). On host dashboard, show “Nanny couldn’t make these times – choose 5 new slots” for that match with a link to `/host/schedule-interview/[matchId]`. Host can submit 5 new slots; create a new InterviewRequest (or update existing and reset slots). Nanny receives new interview link (token) via email or in-app “Interview requests” list. Implement in-app path: host goes to schedule page again; new token generated for nanny for the new request.

**Scope:**  
`app/host/schedule-interview/[matchId]/page.tsx` (allow resubmit), `app/api/interview-requests/route.ts`, nanny “Interview requests” list with new link, optional GHL email

**Done when:**  
Nanny can decline; host can submit new slots; nanny gets new interview page with new 5 slots.

---

## Phase 10: GHL Integration & Webhooks

### T10.1 — Webhook: onboarding complete

**Depends on:** T3.3, T3.1

**Prompt:**  
GHL sends “onboarding complete” webhook with contact id and payload (or link to contact). Implement handler in `/api/webhooks/ghl`: parse payload, fetch contact from GHL if needed, create or update Host or Nanny in Airtable with onboarding data. Map GHL custom fields to Airtable fields. Update app User’s `airtableHostId` or `airtableNannyId` in Airtable Users table if email matches. Return 200. Document payload format for GHL VA.

**Scope:**  
`app/api/webhooks/ghl/route.ts` (or dedicated onboarding route), `lib/ghl/map-to-airtable.ts`

**Done when:**  
Webhook receives onboarding complete; Airtable Host/Nanny record is created/updated; user link updated if applicable.

---

### T10.2 — Webhook: payment success (tier tagging)

**Depends on:** T3.3, T2.1

**Prompt:**  
GHL sends “payment success” webhook with contact id and payment type (e.g. membership, Fast Track, VIP, contract upsell). Handler updates tier: set a tier field on the Airtable Host record (or User record if you store tier there) and/or trigger shortlist generation for Fast Track/VIP. If using Airtable for host tier, update Host record. Return 200. Document payload for GHL VA.

**Scope:**  
`app/api/webhooks/ghl/route.ts` or `app/api/webhooks/ghl/payment/route.ts`, user/Host tier update, optional shortlist trigger

**Done when:**  
Payment webhook updates tier; optional: trigger shortlist generation for upgraded host.

---

### T10.3 — Webhook: shortlist ready (send tokenized link)

**Depends on:** T5.2, T5.3, T3.3

**Prompt:**  
When GHL (or internal cron) says “shortlist ready for host X”, app generates shortlist token for that shortlist and returns the link `{APP_URL}/shortlist/[token]`. GHL workflow can then send that link by email. Implement API: `POST /api/shortlists/send-link` (or called by GHL webhook) with hostId or shortlistId; generate token; return link. Optionally send email from app if GHL cannot. Document for GHL VA.

**Scope:**  
`app/api/shortlists/send-link/route.ts` or webhook handler, token generation, link response or email

**Done when:**  
Given shortlist id, app returns tokenized shortlist URL; GHL or app can send it to host.

---

### T10.4 — Notify GHL when both Proceed (contract / interview workflow)

**Depends on:** T5.5, T3.3

**Prompt:**  
When both host and nanny click Proceed, call GHL API or webhook to notify “both proceeded” for this contact/match (e.g. contact id, custom field or tag). GHL can then trigger: Standard → contract upsell email; Fast Track/VIP → “choose 5 slots” or “interview request” email. Implement: after updating Airtable in proceed-pass API, call `lib/ghl/notify-both-proceed.ts` with contact id and match tier. Document for GHL VA.

**Scope:**  
`lib/ghl/notify-both-proceed.ts`, `app/api/matches/proceed-pass/route.ts`

**Done when:**  
Both Proceed triggers a call to GHL with contact and tier; GHL VA can use it for workflows.

---

## Phase 11: Landing, Profile, and Polish

### T11.1 — Landing page

**Depends on:** T1.1, T1.2

**Prompt:**  
Build landing at `/`: headline “Join the Private Network” (€20/year, 30-day free trial). Two CTAs: “I am a Nanny” and “We are a host family” linking to `/signup/nanny` and `/signup/host`. No pricing upsells (Fast Track/VIP) on this page. Use brand colors and existing components. Responsive.

**Scope:**  
`app/page.tsx`

**Done when:**  
Landing renders with two signup CTAs; links go to correct signup routes.

---

### T11.2 — Host profile view and edit link

**Depends on:** T4.3, T6.1

**Prompt:**  
At `/host/profile`, show read-only summary of Host onboarding data (from Airtable). “Edit” links to `/host/onboarding`. If no onboarding yet, show “Complete your profile” and link to onboarding. Use brand UI.

**Scope:**  
`app/host/profile/page.tsx`, `app/api/host/profile/route.ts`

**Done when:**  
Host can view profile and go to edit (onboarding); empty state handled.

---

### T11.3 — Nanny profile view and edit link

**Depends on:** T4.4, T6.4

**Prompt:**  
Same as T11.2 for Nanny: `/nanny/profile`, read-only summary, “Edit” to onboarding, “Complete your profile” if empty.

**Scope:**  
`app/nanny/profile/page.tsx`, `app/api/nanny/profile/route.ts`

**Done when:**  
Nanny can view and edit profile; empty state handled.

---

### T11.4 — Nanny “Interview requests” list with links

**Depends on:** T8.3, T6.4

**Prompt:**  
At `/nanny/interview-requests`, list InterviewRequests where nanny is the nanny and status is pending_slots or nanny_selected. Each row: host summary, “Choose slot” link that opens tokenized interview page (generate interview token if needed). Use brand UI.

**Scope:**  
`app/nanny/interview-requests/page.tsx`, `app/api/nanny/interview-requests/route.ts`, token generation for interview

**Done when:**  
Nanny sees list of interview requests and can open tokenized interview page from dashboard.

---

### T11.5 — Error and loading states

**Depends on:** T1.2

**Prompt:**  
Add loading skeletons or spinners for: dashboard, shortlist, CV, chat thread, schedule interview. Add error boundaries or error messages for: invalid token, 404, API errors (e.g. “Something went wrong – try again”). Use brand colors. Keep copy short and friendly.

**Scope:**  
`components/ui/Loading.tsx`, `components/ui/ErrorBoundary.tsx` or error.tsx in key routes, error messages in forms

**Done when:**  
Key pages show loading state; invalid token and API errors show clear message.

---

### T11.6 — Noindex and privacy headers for tokenized pages

**Depends on:** T5.4, T5.5, T8.3

**Prompt:**  
On `/shortlist/[token]`, `/cv/[token]`, `/interview/[token]`, add `<meta name="robots" content="noindex, nofollow">` and optionally `X-Robots-Tag: noindex` in response. Ensure no sensitive data in page title or meta description (e.g. generic “Nanny Whisperer” title).

**Scope:**  
`app/shortlist/[token]/page.tsx`, `app/cv/[token]/page.tsx`, `app/interview/[token]/page.tsx`, layout or metadata export

**Done when:**  
Tokenized pages return noindex; no sensitive data in meta.

---

## Phase 12: Optional Enhancements (Single-Prompt Each)

### T12.1 — File upload in chat (optional)

**Prompt:**  
Allow attaching one image or PDF per message. Upload to S3 or similar; store URL in Message.attachmentUrl. Show thumbnails or links in thread. Max file size e.g. 5MB. Use brand UI.

**Scope:**  
`app/api/chat/upload/route.ts`, Message input component, message display

---

### T12.2 — Unread count in chat nav (optional)

**Prompt:**  
Store “last read at” per user per conversation. Compute unread count (messages after last read). Show badge on “Chat” in host/nanny nav. Mark as read when opening thread.

**Scope:**  
Airtable: add `lastReadAt` per user per conversation (e.g. ConversationReads table or field on Conversations), `app/api/chat/unread/route.ts`, nav component

---

### T12.3 — Google Meet link in chat thread (optional)

**Prompt:**  
If the match has an InterviewRequest with googleMeetLink, show “Join meeting” button at top of chat thread linking to that Meet URL. Use brand button.

**Scope:**  
Chat thread page, load InterviewRequest by matchId

---

### T12.4 — Email verification for email signup (optional)

**Prompt:**  
After email signup, send verification email with link. Mark user as emailVerified when link is clicked. Optional: restrict “send message” or “schedule interview” until verified.

**Scope:**  
Airtable: EmailVerificationTokens table (email, token, expiresAt) or store on Users; `/verify-email` page, email sending

---

## Task Dependency Graph (Summary)

```
Phase 1: T1.1 → T1.2, T1.3
Phase 2: T2.1 → T2.2 → T2.3, T2.5; T2.2 → T2.4, T2.5, T2.6
Phase 3: T3.1 → T3.2; T1.3 → T3.3
Phase 4: T3.1 → T4.1, T4.2 → T4.3, T4.4; T2.3, T3.3 → T4.5
Phase 5: T3.1, T3.2 → T5.1 → T5.2; T1.3 → T5.3 → T5.4, T5.5
Phase 6: T2.5, T1.2 → T6.1 → T6.2, T6.3; T6.4 → T6.5
Phase 7: T2.1 → T7.1; T5.5, T7.1 → T7.2; T7.1, T6.1 → T7.3; T7.1, T6.4 → T7.4; T7.3, T7.4 → T7.5
Phase 8: T3.2 → T8.1; T8.1, T5.5 → T8.2; T5.3, T8.1 → T8.3; T1.3 → T8.4; T8.1, T8.4 → T8.5
Phase 9: T8.4, T8.1 → T9.1 → T9.2; T8.2, T8.3 → T9.3
Phase 10: T3.3, T3.1 → T10.1; T3.3, T2.1 → T10.2; T5.2, T5.3, T3.3 → T10.3; T5.5, T3.3 → T10.4
Phase 11: T1.1, T1.2 → T11.1; T4.3, T6.1 → T11.2; T4.4, T6.4 → T11.3; T8.3, T6.4 → T11.4; T1.2 → T11.5; T5.4, T5.5, T8.3 → T11.6
```

---

## How to Use This List

1. **One task = one prompt.** Copy the “Prompt” block (and optionally “Scope” / “Done when”) into your prompt.
2. **Respect dependencies.** Run tasks in order or in parallel only when “Depends on” is satisfied.
3. **Stack: Next.js + Airtable only.** All app data lives in one Airtable base; no separate SQL database. Use the Airtable base structure table at the top for table and field names.
4. **Optional tasks.** T12.x can be skipped or done later.

End of task list.
