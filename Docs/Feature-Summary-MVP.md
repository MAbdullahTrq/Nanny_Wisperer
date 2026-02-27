# Nanny Whisperer — MVP Feature Summary

> **Version:** 1.0 MVP  
> **Last Updated:** February 27, 2026  
> **Stack:** Next.js 14 · TypeScript · Airtable · NextAuth.js · GoHighLevel · Google Calendar · Vercel

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Authentication & User Accounts](#2-authentication--user-accounts)
3. [Host (Family) Account](#3-host-family-account)
4. [Nanny / Au Pair Account](#4-nanny--au-pair-account)
5. [Admin Portal](#5-admin-portal)
6. [Matchmaker Portal](#6-matchmaker-portal)
7. [Matching Algorithm](#7-matching-algorithm)
8. [Interview Scheduling](#8-interview-scheduling)
9. [Chat & Messaging](#9-chat--messaging)
10. [Tokenized Secure Pages](#10-tokenized-secure-pages)
11. [Landing Page & Pricing](#11-landing-page--pricing)
12. [External Integrations](#12-external-integrations)
13. [Known Limitations & Placeholders](#13-known-limitations--placeholders)

---

## 1. Platform Overview

Nanny Whisperer is a **private, curated matchmaking platform** connecting host families with nannies and au pairs across Europe. The platform supports four user roles — **Host**, **Nanny/Au Pair**, **Admin**, and **Matchmaker** — each with a dedicated dashboard and tailored experience.

### Subscription Tiers

| Role | Tiers | Description |
|------|-------|-------------|
| **Host** | Standard · Fast Track · VIP | Increasing levels of matching priority, scheduling automation, and concierge support |
| **Nanny** | Basic · Verified · Certified | Badge levels reflecting verification depth; affects visibility to hosts |

### Pricing (handled via GoHighLevel)

| Item | Price |
|------|-------|
| Membership (Host & Nanny) | €20 |
| Fast Track upgrade | €500 |
| VIP upgrade | €3,000 (€1,000 deposit + €2,000 balance) |
| Contract upsell | €200 |

---

## 2. Authentication & User Accounts

### 2.1 Registration

- **Email/password** signup with bcrypt hashing (minimum 8 characters).
- **Google OAuth** one-click signup and login; auto-creates user record and syncs to GoHighLevel.
- Role selection during signup (Host or Nanny) with separate flows at `/signup/host` and `/signup/nanny`.

### 2.2 Login & Sessions

- JWT-based sessions with a 30-day maximum age.
- Session payload includes: `userId`, `email`, `name`, `userType`, `ghlContactId`, `airtableHostId`, `airtableNannyId`, `isAdmin`, `isMatchmaker`.
- Post-login redirect by role: Hosts → `/host/dashboard`, Nannies → `/nanny/dashboard`, Admins → `/admin`, Matchmakers → `/matchmaker`.

### 2.3 Password Reset

- Forgot-password flow generates a token stored in Airtable with an expiry.
- User navigates to `/reset-password?token=...` to set a new password.
- *Note: In-app email delivery is not yet implemented — password reset links must be communicated manually or via GHL.*

### 2.4 Route Protection & Security

- **Middleware-enforced** role-based access control on all protected routes.
- **Rate limiting** at 100 requests per minute per IP.
- **Account locking** — locked accounts cannot authenticate.
- **Admin impersonation** — token-based "login as user" for support and debugging, redirects to the user's dashboard.

---

## 3. Host (Family) Account

### 3.1 Onboarding — 10-Step Wizard

A comprehensive multi-step form that collects all family and childcare requirements. Each segment saves independently, persists between sessions, and can be completed in any order.

| Step | Section | Fields Collected |
|------|---------|-----------------|
| 1 | **Profile** | First name, last name, date of birth, profile image upload (JPEG/PNG/HEIC, auto-compressed to ~300 KB) |
| 2 | **Contact** | Street & number, postcode, city, country, phone |
| 3 | **Location & Living** | Job location city/area, accommodation type (Live-In / Live-Out / Either), household languages, travel expectations (None / Occasional / Frequent), children and ages |
| 4 | **Schedule** | Desired start date, finish date or ongoing, required hours (Morning / Afternoon / Evening / Overnight), weekends required, required days (Mon–Sun) |
| 5 | **Childcare Needs** | Age group experience (Infant / Toddler / School-age / Teen), special needs care, max children (1–5) |
| 6 | **Skills** | Cooking for children, tutoring/homework, driving, travel assistance, light housekeeping |
| 7 | **Languages** | Primary language required + proficiency level, language spoken with children + proficiency level |
| 8 | **Lifestyle** | Pets in home, smoking policy (No smoking / Outdoor only / Flexible), religious beliefs, parenting style (Gentle / Balanced / Structured), dietary preferences, nanny must follow dietary |
| 9 | **Compensation** | Monthly salary range (€1k–2k / €2k–4k / €4k+), contract type (Part-time / Full-time / Seasonal), trial period (2 weeks / 1 month / None) |
| 10 | **About** | Free-text family description |

### 3.2 Dashboard

- **Profile status** indicator — complete or under review.
- **Tier display** — Standard, Fast Track, or VIP.
- **Metric cards** — matches suggested, shortlists count, sent interview requests, interviews booked.
- **Quick actions** — generate shortlist, navigate to matches, chat, or meetings.
- Placeholder cards for contract status, payments, and notifications.

### 3.3 Profile Management

- View account info (name, email, avatar).
- Change password (redirects to forgot-password flow).
- Edit family profile (returns to onboarding wizard).

### 3.4 Shortlists

- **List view** — all shortlists with creation date and nanny count.
- **Detail view** — each nanny displayed with name, experience summary, match score percentage, and a "View full CV" button linking to a tokenized CV page.

### 3.5 Matches

- View all matches showing: nanny name, caregiver type (Nanny / Au Pair), match score %, and status.
- **Statuses:** Pending → You Proceeded / Nanny Proceeded → Both Proceed / Passed.
- "View CV" button opens a secure, tokenized nanny CV page with Proceed / Pass actions.

### 3.6 Chat

- **Conversation list** — nanny name, last message preview (60 characters), timestamp.
- **Chat thread** — full message history with real-time polling (every 4 seconds), message input, and send button.
- Chat unlocks **only** when both host and nanny click "Proceed" on the match.

### 3.7 Schedule Interview

- Available after both parties proceed on a match.
- Host selects **5 date/time slots** (30-minute duration each).
- Submits the request; nanny receives a tokenized link to pick a slot.
- Confirmation page shown after submission.

### 3.8 Meetings

- *Placeholder page* — intended to display interviews with status `meeting_created`.

---

## 4. Nanny / Au Pair Account

### 4.1 Onboarding — 12-Step Wizard

Supports both **Nanny** and **Au Pair** types with conditional fields. Each segment saves independently.

| Step | Section | Fields Collected |
|------|---------|-----------------|
| 1 | **Profile** | First name, last name, date of birth, gender, profile image upload, caregiver type (Nanny / Au Pair) |
| 2 | **Contact** | Street & number, postcode, city, country, phone |
| 3 | **About You** | Current location, nationality, childcare experience, driving licence, smoker, vegetarian/vegan |
| 4 | **Languages** | Dynamic rows — language + proficiency level (21+ languages supported, at least one required) |
| 5 | **Location Preferences** | Free-text preferred cities/places |
| 6 | **Schedule** | Available start date, finish date or ongoing, available hours, weekends, days (Mon–Sun). Au Pair: EU hours acknowledgment (max 30 h/week) |
| 7 | **Experience** | Years of childcare experience, age groups (0–2 / 3–6 / 7–12 / Teens), special needs experience + details, max children comfortable with |
| 8 | **Skills** | Cooking, tutoring/homework, light housekeeping, travel support |
| 9 | **Lifestyle** | Pet comfort, smoking, religious beliefs, parenting style preference |
| 10 | **Dietary** | Dietary restrictions, willing to cook non-vegetarian, dietary details |
| 11 | **Compensation** | Au Pair: weekly pocket money, preferred days off. Nanny: monthly salary (net), contract type, preferred days off |
| 12 | **About Me** | Free-text self-description |

### 4.2 Dashboard

- **Profile completion percentage** based on 9 key fields.
- **Verification badge** — Basic, Verified, or Certified.
- **Nanny type** indicator.
- **Stats cards** — match suggestions, interview requests, upcoming meetings.
- **Au Pair guidance section** (conditional) — visa information, cultural exchange notes, EU regulation reminder (30 h/week), pocket money display.
- Placeholder cards for saved families, contract status, and availability calendar.

### 4.3 Profile Management

- View account info (name, email, avatar).
- Change password link.
- Caregiver profile status with edit or complete link to onboarding.

### 4.4 Matches

- View all matches where nanny has been shortlisted by hosts.
- Shows: family summary (location + children/ages), match score %, status.
- "View my CV as they see it" generates a tokenized preview of the nanny's own CV.

### 4.5 Tokenized CV Page

- Secure, expiring link (7-day TTL, `noindex`).
- Full nanny profile display: personal info, schedule, experience, skills, lifestyle, about me.
- **Proceed / Pass** buttons for both host and nanny.
- If both proceed: "Open chat" and "Schedule interview" links appear.

### 4.6 Chat

- Mirrors the host chat experience.
- Conversation list with family names, message previews, and timestamps.
- Real-time messaging via 4-second polling.

### 4.7 Interview Requests

- *Placeholder page* — intended to display incoming interview requests from hosts.
- Designed flow: view host's 5 time slots, select one, or mark "None available."
- VIP: only shows slots overlapping with concierge (Kayley's) calendar.

### 4.8 Meetings

- *Placeholder page* — intended to display confirmed interviews with Google Meet links.

---

## 5. Admin Portal

### 5.1 Dashboard

- Key metrics: total hosts, total caregivers (Nanny vs Au Pair breakdown).
- Subscriptions overview with tier-level counts.
- Navigation links to all management sections.

### 5.2 Host Management

- Tabular view of all host families.
- Columns: name, email, location, tier, desired start date.
- Click-through to user detail page.

### 5.3 Caregiver Management

- Tabular view of all nannies and au pairs.
- **Filterable** by type: All / Nanny / Au Pair.
- Columns: name, type, badge tier, location.

### 5.4 User Detail Page

Full account management for any user:

| Action | Description |
|--------|-------------|
| **View Info** | Email, name, role, locked/active status, tier/badge, location |
| **Reset Password** | Set a new password (min 8 characters) |
| **Lock / Unlock** | Toggle account access on or off |
| **Update Tier** | Host: Standard / Fast Track / VIP. Nanny: Basic / Verified / Certified |
| **Impersonate** | Log in as the user and land on their dashboard |

### 5.5 Subscriptions

- Hosts grouped by tier with counts.
- Placeholder note for connecting a payment provider (Stripe or similar).

### 5.6 Reported Issues

- *Placeholder page* — not yet implemented.

---

## 6. Matchmaker Portal

### 6.1 Dashboard

- Entry point for users with the `isMatchmaker` flag.

### 6.2 Queue

- **Select a host** from a list showing names and tiers.
- View **algorithm-suggested nannies** with match scores for the selected host.
- Multi-select nannies for manual curation.
- Choose match source: **Admin Curated** or **Premium Concierge**.
- **Send to host** — creates Match records and a Shortlist in Airtable.

### 6.3 Sent Matches

- View history of previously sent match batches.

### 6.4 Interviews

- Manage and monitor interview requests.

---

## 7. Matching Algorithm

### 7.1 Scoring System — 100 Points

| Category | Max Points | Criteria |
|----------|-----------|----------|
| **Core** | 40 | Location match (10), start date compatibility (5), accommodation preference (5), day availability overlap (10), age group experience (10) |
| **Skills** | 20 | Weighted overlap across cooking, tutoring, driving, travel assistance, housekeeping |
| **Values & Lifestyle** | 20 | Parenting style (5), pet compatibility (5), smoking policy (5), religious beliefs (5) |
| **Bonus** | 20 | Language fluency (10), salary alignment (5), certification badge (5: Certified +5, Verified +3, Basic +0) |

### 7.2 Hard Filters — Instant Exclusion

A nanny is excluded from results if **any** of these fail:

1. **Location** — no overlap between host job location and nanny location/preferences.
2. **Start date** — nanny available date is later than host desired start date.
3. **Accommodation** — type mismatch (unless either party selected "Either").
4. **Day availability** — zero overlap in required vs available days.
5. **Age groups** — nanny lacks experience in one or more required age groups.
6. **Special needs** — host requires special needs care but nanny has no experience.

### 7.3 Tier-Based Visibility

- **VIP hosts** see all nannies, prioritized: Certified → Verified → Basic.
- **Standard / Fast Track hosts** see Verified and Basic nannies only.

### 7.4 Match Sources

| Source | Description |
|--------|-------------|
| `auto` | Algorithm-generated match |
| `admin_curated` | Manually selected by a matchmaker |
| `premium_concierge` | Selected through VIP concierge service |

### 7.5 Thresholds

- **Minimum score:** 60 points (configurable).
- **Shortlist size:** Top 10 matches per generation.

---

## 8. Interview Scheduling

### 8.1 Flow

```
Host selects 5 slots → InterviewRequest created (status: pending_slots)
        ↓
Nanny receives tokenized link → selects a slot (status: nanny_selected)
        ↓
System creates Google Meet meeting (status: meeting_created)
```

### 8.2 Status Lifecycle

`pending_slots` → `nanny_selected` → `meeting_created`  
Alternative paths: `none_available` · `cancelled`

### 8.3 VIP Handling

- Nanny only sees slots that **overlap** with the concierge (Kayley's) Google Calendar availability.
- System creates a **3-way meeting** (Host + Nanny + Kayley).

### 8.4 Data Model

| Field | Description |
|-------|-------------|
| `matchId` | Link to the parent match |
| `hostId` / `nannyId` | Participant references |
| `slot1` – `slot5` | ISO datetime strings for the 5 proposed slots |
| `selectedSlotIndex` | Index (0–4) of the slot the nanny chose |
| `googleMeetLink` | Auto-generated meeting URL |
| `googleCalendarEventId` | Calendar event reference |
| `isVip` | Whether VIP concierge rules apply |

---

## 9. Chat & Messaging

### 9.1 How It Works

- **Trigger:** A conversation is auto-created when both host and nanny click "Proceed" on a match.
- **Storage:** Airtable tables — `Conversations` and `Messages`.
- **Delivery:** Polling-based (every 4 seconds); no WebSocket server in MVP.
- **Access control:** Only match participants can view or send messages.

### 9.2 Features

- Chat bubble UI with sender differentiation and timestamps.
- Host messages appear right-aligned (dark green); nanny messages left-aligned (light green).
- Last message preview (60 characters) on conversation list.
- Tokenized direct chat links via `/(tokenized)/chat/[token]`.

### 9.3 Data Model

| Table | Key Fields |
|-------|------------|
| **Conversations** | `id`, `matchId`, `hostId`, `nannyId`, `createdTime` |
| **Messages** | `id`, `conversationId`, `senderId`, `senderType` (Host/Nanny), `content`, `attachmentUrl`, `createdTime` |

---

## 10. Tokenized Secure Pages

JWT-based tokenized links with a 7-day expiry and `noindex` meta tag, used for sharing sensitive content outside of authenticated sessions.

| Route | Purpose |
|-------|---------|
| `/(tokenized)/shortlist/[token]` | View a shortlist delivered via email |
| `/(tokenized)/cv/[token]` | View a nanny CV with Proceed / Pass actions |
| `/(tokenized)/interview/[token]` | Nanny selects an interview time slot |
| `/(tokenized)/chat/[token]` | Direct access to a chat conversation |

---

## 11. Landing Page & Pricing

### 11.1 Landing Page (`/`)

- **Hero section** — "Join the Private Network" headline with dual call-to-action buttons: "I'm a Host" and "I'm a Nanny."
- **Pricing preview** — two cards for families and nannies linking to signup.

### 11.2 Pricing Pages

- `/pricing` — main pricing overview.
- `/pricing/host` — host-specific pricing details.
- `/pricing/nanny` — nanny-specific pricing details.

---

## 12. External Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| **Airtable** | Primary database — Users, Hosts, Nannies, Matches, Shortlists, Conversations, Messages, InterviewRequests, PasswordResetTokens, GoogleCalendarTokens | Fully integrated |
| **NextAuth.js** | Authentication — email/password credentials + Google OAuth + JWT sessions | Fully integrated |
| **GoHighLevel (GHL)** | CRM, payment processing, email workflows, pipelines, calendars | Webhook endpoint exists; inbound webhook processing (tier updates on payment) not yet active |
| **Google Calendar** | OAuth connection, free/busy availability checks, calendar event creation | Fully integrated |
| **Google Meet** | Auto-generate video meeting links on interview confirmation | Fully integrated |
| **Vercel Blob** | Profile image storage with HEIC conversion and compression | Fully integrated |

---

## 13. Known Limitations & Placeholders

Items **not yet implemented** in the MVP that are referenced in code or documentation:

| Area | Current State | Notes |
|------|---------------|-------|
| **Email notifications** | Not in-app | TODO comments reference Resend / Nodemailer. Currently relies on GHL workflows for all outbound email |
| **Stripe payment integration** | Not connected | Mentioned in docs; all payments currently processed through GHL |
| **GHL webhook processing** | Endpoint exists, logs payload | Does not yet update tiers or trigger shortlist generation on payment events |
| **Nanny meetings page** | Placeholder | Shows "No upcoming meetings" |
| **Host meetings page** | Placeholder | Shows "No upcoming meetings" |
| **Nanny interview requests page** | Placeholder | Shows "No interview requests yet" |
| **Admin reported issues** | Placeholder | Empty page |
| **Contract management** | Placeholder cards | Dashboard cards exist but no underlying functionality |
| **In-app notifications** | Not implemented | No notification bell or toast system |
| **Chat file attachments** | Schema field exists | `attachmentUrl` on Messages table; no upload UI in chat |
| **Real-time WebSocket chat** | Not implemented | `socket.io-client` is a dependency but no server-side Socket.IO; uses HTTP polling |

---

*This document reflects the state of the codebase as of February 27, 2026.*
