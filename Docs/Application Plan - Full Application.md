# Nanny Whisperer — Full Application Plan

Complete plan for the Nanny Whisperer application: authentication, business logic from docs, host/nanny interfaces, chat, calendar sync, and Google Meet integration.

---

## 1. Application Overview

### 1.1 Purpose

- **Private childcare matchmaking** — no public browsing.
- **Hosts** join (€20), onboard, choose tier (Standard / Fast Track / VIP), receive curated shortlists, chat/interview matched nannies.
- **Nannies** join (€20), onboard, optionally upgrade (Verified / Certified), get matched to hosts, chat/interview via links.

### 1.2 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router), React, TypeScript |
| Auth | NextAuth.js (or Auth.js) — email/password + Google OAuth |
| Database | Airtable (matching, shortlists, interviews) + optional DB for chat/sessions |
| CRM / Payments / Workflows | GHL (onboarding, payments, tags, workflows) |
| Video meetings | Google Meet API |
| Calendar | Google Calendar API (sync + availability) |
| Chat | In-app real-time chat (WebSocket or polling) |
| Styling | Tailwind CSS, Nanny Whisperer brand palette |

### 1.3 Brand Colors (Reference)

- **Pastel Black:** `#2E2E2E` (primary text, headers)
- **Dark Green:** `#3F4C44` (accents, buttons)
- **Light Green:** `#C8D5C4` (backgrounds, soft accents)
- **Light Pink / Pale Peach:** `#EAD5D1` (backgrounds, cards)
- **Off-White:** `#F8F6F2` (page background)

---

## 2. Authentication (Login / Signup)

### 2.1 User Types

- **Host** — “We are a host family”
- **Nanny** — “I am an Au Pair / Nanny”

Role is selected at signup and stored (e.g. `userType: 'host' | 'nanny'`).

### 2.2 Signup Flow

1. **Landing** → “Join the Private Network” (€20/year, 30-day free trial).
2. **Role selection** — Host **or** Nanny (no switching after signup in v1).
3. **Auth method:**
   - **Google OAuth** — one-click signup; fetch name/email; create user with `userType`.
   - **Email + password** — First name, Last name, Email, Password; send verification email if required.
4. **Post-signup:**
   - Redirect to **payment** (GHL/Stripe) for €20 membership (or start trial).
   - After payment/trial start → redirect to **onboarding** (GHL forms or in-app forms that sync to GHL + Airtable).

### 2.3 Login Flow

1. **Login page** — Email + password **or** “Continue with Google”.
2. **Session** — JWT or session cookie; include `userId`, `userType`, `email`, `ghlContactId`, `airtableRecordId`.
3. **Post-login** — Redirect by role:
   - Host → `/host/dashboard`
   - Nanny → `/nanny/dashboard`

### 2.4 Implementation Outline

- **NextAuth.js (Auth.js):**
  - Providers: Credentials (email/password), Google.
  - Callbacks: attach `userType`, `ghlContactId`, `airtableRecordId` to session.
- **Database (app-owned):**
  - Table/Base: `users` — `id`, `email`, `name`, `userType`, `ghlContactId`, `airtableRecordId`, `passwordHash` (if email), `emailVerified`, `createdAt`.
- **GHL sync:**
  - On signup: create or update GHL contact with same email; store `ghlContactId` in app DB and session.
- **Airtable sync:**
  - After onboarding: create/update Host or Nanny record; store `airtableRecordId` in app DB and session.

### 2.5 Routes

| Route | Purpose |
|-------|---------|
| `/login` | Login (email or Google) |
| `/signup` | Role selection + signup |
| `/signup/host` | Host signup (optional dedicated step) |
| `/signup/nanny` | Nanny signup (optional dedicated step) |
| `/forgot-password` | Password reset |

---

## 3. Business Logic (From Docs)

### 3.1 Host Flow (End-to-End)

1. **Landing** → Join (€20 or trial).
2. **Payment** (GHL/Stripe) → Tag: Standard.
3. **Onboarding** (GHL or in-app form) → Sync to Airtable.
4. **Optional tier upgrade** (GHL): Fast Track €500 or VIP €2,500–€3,000.
5. **Matching** (Airtable + app):
   - Standard: first shortlist in 5 days (deliver in 3).
   - Fast Track: first shortlist in 24h (deliver in 12h).
   - VIP: first shortlist in 12h (deliver in 8h), concierge review; can filter to Certified only.
6. **Shortlist delivery** — Host gets email with **tokenized shortlist link** → opens in app.
7. **Shortlist page** — Summary cards of nannies; click → **tokenized CV page**.
8. **CV page** — Full nanny profile; **Proceed / Pass**.
9. **If both Proceed:**
   - **Standard:** Unlock **chat** + offer €200 contract upsell (GHL).
   - **Fast Track:** Host picks **5 time slots** (calendar) → nanny gets tokenized **interview page** → nanny picks 1 slot → **Google Meet** created → links sent.
   - **VIP:** Same 5 slots → app checks **Kayley’s calendar** → nanny sees only overlapping slots → nanny picks 1 → **Google Meet** 3-way (Host, Nanny, Kayley) → links sent.
10. **After interview** → Proceed/Pass again; contract/next steps per tier (GHL + app as needed).

### 3.2 Nanny Flow (End-to-End)

1. **Landing** → Join (€20 or trial).
2. **Payment** (GHL/Stripe).
3. **Onboarding** (GHL or in-app) → Sync to Airtable; profile with “Private Network Member” badge.
4. **Optional upgrades** (GHL): Verified €99, Certified €99 course.
5. **Matching** — Nanny does **not** browse; appears in host shortlists only. Verified nannies can opt-in to receive curated host matches by email.
6. **When shortlisted:** Nanny receives email with link to **CV view** (and/or chat/interview link depending on tier).
7. **Standard:** If both Proceed → **chat** link; €200 contract upsell (GHL).
8. **Fast Track:** Nanny gets **interview page** (tokenized) with host summary + 5 slots → picks 1 (or “None available” → host picks 5 new slots) → Google Meet link.
9. **VIP:** Nanny gets **interview page** with only slots overlapping Kayley → picks 1 → 3-way Google Meet.

### 3.3 Matching Engine (Airtable + App)

- **Must-match filters:** location, start date, live-in/out, availability (days/hours), age groups, special needs.
- **100-point score:** 40 core, 20 skills, 20 values/lifestyle, 20 bonus (language, salary, certs).
- **Queue:** Standard &lt; Fast Track &lt; VIP. VIP sees Certified nannies first; can filter to Certified only.
- **Output:** Shortlist records in Airtable; app generates **tokens** for shortlist/CV/interview pages and stores mapping (token → shortlistId, matchId, hostId, nannyId).

### 3.4 Proceed / Pass

- **Where:** CV page (and/or dedicated “match decision” page) — both host and nanny see Proceed / Pass.
- **Storage:** Airtable (e.g. Match record: `hostProceed`, `nannyProceed`, `bothProceedAt`).
- **GHL:** App sends webhook or API call to GHL when both Proceed (for workflows: contract upsell, interview scheduling emails).
- **Next step:** If both Proceed → unlock chat (Standard) or show slot selection (Fast Track/VIP).

### 3.5 Tokenized Pages (Privacy)

- **Shortlist** — `/shortlist/[token]` (host only).
- **CV** — `/cv/[token]` (host views nanny; nanny can have a “view your CV as host sees it” in dashboard with token).
- **Interview request** — `/interview/[token]` (nanny: host summary + slot picker).
- **Chat** — `/chat/[token]` or `/chat/[matchId]` (after login; matchId from session).
- Tokens: JWT or cryptographically secure one-time tokens; expiry (e.g. 7 days); noindex meta + no-crawl.

---

## 4. User Interfaces (Host & Nanny)

### 4.1 Host Interface

**Dashboard** (`/host/dashboard`)

- Summary: tier, membership status, “Your shortlists”, “Pending decisions”, “Upcoming meetings”.
- **Shortlists** — List of shortlists with “View” (opens tokenized shortlist or in-app shortlist view).
- **Matches** — List of matches with status: Pending / Proceed / Pass / Chat open / Interview scheduled.
- **Meetings** — Upcoming Google Meet meetings (from calendar sync or DB).
- **Profile / onboarding** — Link to edit profile (or GHL form).
- **Upgrade** — CTA to Fast Track / VIP (GHL payment links).

**Shortlist view** (in-app or tokenized)

- Cards: photo, name initial, experience, skills, match %, “View full CV”.
- Click → CV page (tokenized).

**CV view** (tokenized or in-app)

- Full nanny profile (all onboarding fields).
- Proceed / Pass buttons.
- If both Proceed: “Chat” button or “Schedule interview” (Fast Track/VIP).

**Interview scheduling (Fast Track/VIP)**

- “Choose 5 time slots” — calendar UI (from Google Calendar or GHL calendar); send to app.
- After nanny picks: “Meeting scheduled” + Google Meet link + calendar event.

**Chat**

- List of conversations (matches where both Proceed).
- Open thread: messages, input, optional file share.
- Link to Google Meet if a meeting exists for that match.

### 4.2 Nanny Interface

**Dashboard** (`/nanny/dashboard`)

- Profile status: Basic / Verified / Certified.
- “You’ve been shortlisted” — count or list (link to CV view or “as host sees you”).
- “Interview requests” — list of tokenized interview pages (or in-app list with “Choose slot”).
- “Your chats” — matches where both Proceed.
- “Upcoming meetings” — Google Meet links.
- **Profile / onboarding** — Edit profile (or GHL).
- **Upgrade** — Verified €99, Certified €99 (GHL).

**Interview request page** (tokenized)

- Host summary (family, location, kids, etc.).
- 5 time slots (or filtered for VIP) — pick one or “None available”.
- After selection: “Meeting scheduled” + Meet link.

**Chat**

- Same concept as host: list of conversations, open thread, optional Meet link.

### 4.3 Shared UX Principles

- **Clear role** — Always show “Host” or “Nanny” and relevant nav.
- **Progress** — Stepper or status for: Onboarding → Matched → Proceed → Chat/Interview → Contract.
- **Mobile-first** — Responsive; touch-friendly buttons and forms.
- **Accessibility** — Labels, contrast (use brand palette), keyboard nav.
- **Empty states** — “You’ll receive your first shortlist in X days” / “When a family shortlists you, you’ll see it here.”

---

## 5. Chat (Connected Nannies & Hosts)

### 5.1 When Chat Is Available

- **Standard:** After both Proceed → chat unlocked.
- **Fast Track / VIP:** After both Proceed, chat can be unlocked in parallel with interview scheduling (or after first call, per product choice).

### 5.2 Chat Model

- **Conversation** = one Host + one Nanny (1:1 per match).
- **Storage:** App database (recommended) or Airtable:
  - `conversations`: `id`, `matchId`, `hostId`, `nannyId`, `createdAt`.
  - `messages`: `id`, `conversationId`, `senderId` (userId), `senderType` ('host'|'nanny'), `content`, `attachmentUrl` (optional), `createdAt`.
- **Real-time:** WebSocket (e.g. Pusher, Socket.io, or serverless WebSocket) or short-interval polling (e.g. every 3–5 s).

### 5.3 Features

- Send text messages.
- Optional: file upload (images, PDFs) — store in S3 or similar; link in `messages`.
- Unread indicator and “last message” preview in conversation list.
- Link to “Schedule meeting” or “Join meeting” (Google Meet) if a meeting exists for that match.

### 5.4 Routes & Permissions

- **Host:** `GET /host/chat`, `GET /host/chat/[conversationId]` — only conversations where host is participant.
- **Nanny:** `GET /nanny/chat`, `GET /nanny/chat/[conversationId]` — only conversations where nanny is participant.
- **API:** `GET /api/chat/conversations`, `GET /api/chat/messages?conversationId=`, `POST /api/chat/send` — auth + check participant.

---

## 6. Calendar Sync & Meeting Scheduling

### 6.1 Calendar Sync (Availability)

- **Host:** Connect Google Calendar (OAuth); read busy/free to suggest “5 time slots” (or use GHL calendar if that’s the source of truth for host).
- **Nanny:** Connect Google Calendar; optional: show busy/free when nanny picks a slot to avoid double-booking.
- **Kayley (VIP):** Concierge calendar (GHL or Google); app reads availability and intersects with host’s 5 slots.

### 6.2 Scheduling Flow (Fast Track)

1. Host selects 5 slots (from Google Calendar free/busy or manual pick).
2. App stores slot offers (e.g. Airtable: `InterviewRequest` with `slot1..slot5`, `hostId`, `nannyId`, `matchId`).
3. Nanny opens tokenized interview page; sees 5 slots; picks 1 (or “None available”).
4. App creates **Google Meet** meeting (see below) at chosen time.
5. App creates **Google Calendar event** for host and nanny (optional: add to their calendars via API) with Meet link.
6. Email/SMS with Meet link (GHL workflow or app).

### 6.3 Scheduling Flow (VIP)

1. Host selects 5 slots.
2. App fetches **Kayley’s** calendar availability (GHL or Google).
3. App computes **overlap** of host slots with Kayley’s free slots.
4. If no overlap: notify host “No overlap with concierge; please choose 5 new slots” (retry).
5. Nanny sees only overlapping slots; picks 1.
6. App creates **Google Meet** 3-way (Host, Nanny, Kayley) and calendar event(s); send links via GHL.

### 6.4 “None Available” Retry

- Nanny clicks “None available” → app records; GHL workflow notifies host to submit 5 new slots.
- New slots → same flow (Fast Track or VIP with overlap check).

### 6.5 Calendar Data Model (App or Airtable)

- **Slots:** `InterviewRequest` with `slot1..slot5` (ISO datetime), `selectedSlotIndex`, `googleMeetLink`, `googleCalendarEventId`, `status` (pending_slots | nanny_selected | meeting_created | cancelled).
- **Sync:** Store host/nanny/Kayley calendar IDs and refresh tokens for Google Calendar API.

---

## 7. Google Meet Integration

### 7.1 Why Google Meet

- Single link for 2-way (Fast Track) or 3-way (VIP) calls.
- Integrates with Google Calendar (event = Meet link).
- No separate “Zoom” account for users; can use existing Google accounts.

### 7.2 Implementation Options

**Option A — Google Calendar API (recommended for simplicity)**

- Create a **Calendar event** with `conferenceData` (Google Meet) via Calendar API.
- Response includes `meetLink` (or `hangoutLink`).
- No separate “Meet API”; just Calendar API with conference creation.

**Option B — Google Meet REST API (if available for your workspace)**

- If using Google Workspace and Meet API is enabled: create space/meeting via API and attach to calendar event.

### 7.3 Flow

1. **After nanny selects slot:** App has: `hostId`, `nannyId`, `selectedDateTime`, `isVip` (Kayley invited).
2. **Create event:**
   - Calendar: use a **service calendar** (e.g. “Nanny Whisperer meetings”) or host’s calendar.
   - Title: e.g. “Nanny Whisperer – Interview” (no real names for privacy).
   - Add **conferenceData** (Google Meet).
   - Attendees: host email, nanny email; if VIP, Kayley’s email.
3. **Store:** Save `googleCalendarEventId`, `meetLink` in Airtable/DB (`InterviewRequest` or `Meetings` table).
4. **Send links:** GHL workflow sends email/SMS with Meet link; optionally “Add to calendar” link.

### 7.4 Privacy (Generic Names)

- Calendar event title: “Nanny Whisperer – Interview” (not “Interview with Maria”).
- Optional: In Meet settings, remind users to rename themselves (e.g. “Family 104”, “Candidate 203”) or document in email.

### 7.5 Environment / Credentials

- Google Cloud project; enable **Google Calendar API**.
- OAuth 2.0 or service account with domain-wide delegation (if creating events on behalf of users).
- Store: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALENDAR_ID` (for NW meeting calendar if using one).

---

## 8. GHL Integration (Recap)

- **GHL does:** Onboarding forms, payments (€20, €500, €3,000, €200), tier tagging, pipelines, workflow automations, calendar *creation* (host + concierge), courses, PDFs, “Proceed/Pass” status via webhooks.
- **App does:** Login/signup, tokenized pages, matching logic (with Airtable), Proceed/Pass UI and persistence, **chat**, **5-slot selection and nanny approval**, **calendar overlap (VIP)**, **Google Meet creation**, and sending Meet links (or triggering GHL to send).

### 8.1 Webhooks (GHL → App)

- **Onboarding complete** → Sync to Airtable; trigger matching.
- **Payment success** → Update tier; trigger shortlist timing.
- **Proceed/Pass updated** → App may consume to keep Airtable in sync or trigger next step.
- **Shortlist ready** → App generates shortlist tokens and returns shortlist/CV links for GHL to email.

### 8.2 App → GHL

- **Create/update contact** on signup (if not using GHL form for signup).
- **Trigger workflow** (e.g. “send shortlist email”) by API if supported.
- **Read** calendars (host, concierge) for slot availability if GHL exposes calendar API.

---

## 9. Data Model Summary

### 9.1 App Database (e.g. PostgreSQL or Airtable)

- **users** — id, email, name, userType, ghlContactId, airtableRecordId, emailVerified, createdAt.
- **conversations** — id, matchId, hostId, nannyId, createdAt.
- **messages** — id, conversationId, senderId, senderType, content, attachmentUrl, createdAt.
- **tokens** — id, token, type (shortlist|cv|interview), payload (matchId, shortlistId, etc.), expiresAt, usedAt.

### 9.2 Airtable (Existing + Extensions)

- **Hosts** — onboarding fields, tier, ghlContactId, userId.
- **Nannies** — onboarding fields, Verified/Certified, ghlContactId, userId.
- **Matches** — hostId, nannyId, score, hostProceed, nannyProceed, bothProceedAt, status.
- **Shortlists** — hostId, nannyIds[], matchIds[], createdAt, deliveredAt.
- **InterviewRequests** — matchId, hostId, nannyId, slot1..slot5, selectedSlotIndex, googleMeetLink, googleCalendarEventId, status, isVip.

---

## 10. Route Map (Full)

| Route | Who | Purpose |
|-------|-----|---------|
| `/` | All | Landing |
| `/login` | All | Login |
| `/signup` | All | Role + signup |
| `/host/dashboard` | Host | Dashboard |
| `/host/shortlists` | Host | Shortlists list |
| `/host/shortlist/[id]` | Host | Shortlist view |
| `/host/matches` | Host | Matches list |
| `/host/chat` | Host | Chat list |
| `/host/chat/[id]` | Host | Chat thread |
| `/host/meetings` | Host | Upcoming meetings |
| `/host/profile` | Host | Profile / onboarding |
| `/nanny/dashboard` | Nanny | Dashboard |
| `/nanny/matches` | Nanny | “Shortlisted” / matches |
| `/nanny/chat` | Nanny | Chat list |
| `/nanny/chat/[id]` | Nanny | Chat thread |
| `/nanny/meetings` | Nanny | Upcoming meetings |
| `/nanny/profile` | Nanny | Profile / onboarding |
| `/shortlist/[token]` | Anonymous (token) | Tokenized shortlist |
| `/cv/[token]` | Anonymous (token) | Tokenized CV |
| `/interview/[token]` | Anonymous (token) | Interview slot picker |
| `/api/auth/*` | — | NextAuth |
| `/api/webhooks/ghl/*` | GHL | Webhooks |
| `/api/chat/*` | Auth | Chat API |
| `/api/scheduling/*` | Auth / token | Slots, selection, Meet |
| `/api/calendar/*` | Auth | Google Calendar sync |

---

## 11. Implementation Phases

### Phase 1 — Foundation (Weeks 1–2)

- Next.js app + TypeScript + Tailwind + brand palette.
- NextAuth: email/password + Google; role (host/nanny); session with ghlContactId, airtableRecordId.
- Users table (app DB or Airtable).
- GHL webhook endpoints (onboarding, payment, proceed-pass) — stub or minimal logic.
- Airtable client: Hosts, Nannies, Matches, Shortlists read/write.

### Phase 2 — Onboarding & Matching (Weeks 3–4)

- Host/Nanny onboarding (in-app forms that mirror docs and sync to GHL + Airtable), or deep link to GHL forms + webhook sync.
- Matching: run 100-point algorithm on Airtable (formulas or app); create Shortlists and Matches.
- Token generation for shortlist/CV/interview; store in DB; noindex tokenized pages.

### Phase 3 — Host & Nanny Dashboards (Weeks 5–6)

- Host dashboard: shortlists, matches, Proceed/Pass, link to CV/shortlist.
- Nanny dashboard: “shortlisted”, interview requests, link to interview page.
- Shortlist page (tokenized): cards, link to CV.
- CV page (tokenized): full profile, Proceed/Pass; call GHL webhook on update.

### Phase 4 — Chat (Weeks 7–8)

- Conversations and messages tables; API: list conversations, get messages, send message.
- Real-time: polling or WebSocket.
- Host/Nanny chat UI: list + thread; unread hint; optional file upload.

### Phase 5 — Calendar & Google Meet (Weeks 9–10)

- Google OAuth for Calendar (host/nanny); read busy/free.
- Slot selection UI (host: 5 slots); store in InterviewRequest.
- Interview page (tokenized): show slots; nanny picks 1 or “None available”; VIP: overlap with Kayley’s calendar.
- Google Calendar API: create event with Meet link; store link; send via GHL or app email.
- “None available” retry flow.

### Phase 6 — Polish & Launch (Weeks 11–12)

- Branding pass (colors, typography, empty states).
- Error handling, loading states, basic analytics.
- Security: rate limits, token expiry, input validation.
- Testing: auth, matching, Proceed/Pass, chat, scheduling, Meet creation.

---

## 12. Environment Variables

```env
# App
NEXT_PUBLIC_APP_URL=
NODE_ENV=development

# Auth (NextAuth)
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Google OAuth (sign-in + Calendar + Meet)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALENDAR_ID=          # Optional: NW meeting calendar

# GHL
GHL_API_KEY=
GHL_ACCOUNT_ID=
GHL_WEBHOOK_SECRET=

# Airtable
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=

# Database (if not using Airtable for chat/sessions)
DATABASE_URL=

# Optional: file upload for chat
S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

---

This plan covers **login/signup**, **all doc-based logic**, **host and nanny interfaces**, **chat**, **calendar sync**, and **Google Meet** in one place. You can implement it phase by phase and adjust GHL vs app responsibilities as you get more detail from the GHL VA.
