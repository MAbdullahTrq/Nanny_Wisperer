# Configuring Meet Links and Calendar Events

To create **Google Meet links** and **calendar events** when a nanny selects an interview slot, you need the following.

---

## 1. Google Cloud project

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. **Enable the Google Calendar API:**  
   APIs & Services → Enable APIs and Services → search “Google Calendar API” → Enable.

---

## 2. OAuth credentials (already used for login and calendar connect)

The app already uses these for:
- Google sign-in (NextAuth)
- Calendar OAuth callback (host/nanny connect their calendar for free/busy)
- Refreshing tokens (e.g. in `lib/google/calendar.ts`)

| Env variable           | Purpose |
|------------------------|--------|
| `GOOGLE_CLIENT_ID`     | OAuth 2.0 Client ID (Web application). |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client secret. |

**Where to get them:**  
APIs & Services → Credentials → Create Credentials → OAuth client ID → Application type “Web application”. Add authorised redirect URIs, e.g.:

- `http://localhost:3000/api/auth/callback/google`
- `http://localhost:3000/api/calendar/callback`
- Your production URLs for the same paths.

---

## 3. Calendar where interview events are created

Interview events (with Meet links) must be created on **one** calendar that the app controls. The app already has:

| Env variable        | Purpose |
|---------------------|--------|
| `GOOGLE_CALENDAR_ID` | Calendar ID on which to create interview events. |

**You need to decide who owns that calendar and how the app gets access:**

### Option A — Dedicated Google account (simplest)

1. Create a Google account for the app (e.g. `meetings@yourdomain.com` or a dedicated Gmail).
2. (Recommended) Use **Google Workspace** for that account so Meet creation is reliable; consumer Gmail can work but Workspace is better supported.
3. In that account, create a calendar (or use “Primary”) and note its **Calendar ID**:
   - For “Primary” it is usually the account’s email (e.g. `meetings@yourdomain.com`).
   - Or: Calendar → Settings → the calendar → “Integrate calendar” → “Calendar ID”.
4. Get a **refresh token** for that account:
   - Run a one-time OAuth flow (same client ID/secret as above) with scopes:  
     `https://www.googleapis.com/auth/calendar` and  
     `https://www.googleapis.com/auth/calendar.events`
   - Exchange the code for tokens and store the **refresh_token**.
5. Configure the app:
   - `GOOGLE_CALENDAR_ID` = that calendar ID.
   - Add a new env var for the app to use when creating events, e.g. **`GOOGLE_MEET_CALENDAR_REFRESH_TOKEN`** = the refresh token from step 4.

The app code (when implemented) will: refresh an access token from this refresh token, then call Calendar API `events.insert` on `GOOGLE_CALENDAR_ID` with `conferenceData` and `conferenceDataVersion: 1` to create the event and get the Meet link.

### Option B — Service account (Google Workspace only)

1. In Cloud Console create a **Service account** (APIs & Services → Credentials → Service accounts).
2. In **Google Workspace Admin**: enable Domain-Wide Delegation for that service account and grant the Calendar scope (e.g. `https://www.googleapis.com/auth/calendar`).
3. Use a **Workspace user** who owns (or has write access to) the calendar you use for interviews.
4. In the app, use the service account to obtain credentials and **impersonate** that user when calling the Calendar API; create events on that user’s calendar (e.g. `GOOGLE_CALENDAR_ID` = primary or a shared calendar ID).

This requires storing the service account JSON (or key) securely and using a Google API client that supports impersonation. No refresh token from a browser OAuth flow is needed.

---

## 4. VIP / Kayley (already in config)

For VIP interviews, the app filters the host’s 5 slots to those where Kayley is free. That only needs **read** access to Kayley’s calendar:

| Env variable          | Purpose |
|-----------------------|--------|
| `KAYLEY_CALENDAR_ID`  | Kayley’s calendar ID (often her email if primary). |
| `KAYLEY_REFRESH_TOKEN`| Refresh token for Kayley’s Google account (one-time OAuth with calendar read scope). |

No change needed here for Meet creation; these are only used for free/busy in `lib/scheduling/calendar-overlap.ts`.

---

## 5. Summary: what you need for Meet + calendar events

| Item | Used for | Status in app |
|------|----------|----------------|
| **GOOGLE_CLIENT_ID** | OAuth (login, calendar connect, token refresh) | ✅ In config |
| **GOOGLE_CLIENT_SECRET** | Same | ✅ In config |
| **GOOGLE_CALENDAR_ID** | Which calendar to create interview events on | ✅ In config (not yet used for creation) |
| **GOOGLE_MEET_CALENDAR_REFRESH_TOKEN** (or equivalent) | Access to create events on `GOOGLE_CALENDAR_ID` | ❌ Not in config yet; add when implementing creation |
| **KAYLEY_CALENDAR_ID** | VIP slot overlap (read-only) | ✅ In config |
| **KAYLEY_REFRESH_TOKEN** | VIP slot overlap (read-only) | ✅ In config |

---

## 6. API details (for implementation)

To create an event **with a Meet link**:

- **Endpoint:** `POST https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events`
- **Query:** `conferenceDataVersion=1` (required for Meet to be created).
- **Body:** Include:
  - `summary` (e.g. “Nanny Whisperer – Interview”)
  - `start.dateTime`, `end.dateTime` (ISO), `start.timeZone`, `end.timeZone`
  - `attendees`: `[{ email: hostEmail }, { email: nannyEmail }]` (and for VIP, Kayley’s email)
  - `conferenceData.createRequest`: `{ requestId: "<unique-string>", conferenceSolutionKey: { type: "hangoutsMeet" } }`

The response includes `conferenceData.entryPoints` with the Meet link (or `hangoutLink` in older API responses). Store that as `googleMeetLink` on the interview request and set `status: 'meeting_created'`.

**Scopes** for the token that creates events:  
`https://www.googleapis.com/auth/calendar` and `https://www.googleapis.com/auth/calendar.events`.

---

## 7. Optional: GHL workflow when meeting is created

After the app creates the Meet and updates the interview request, it can call:

- **GHL:** `triggerMeetingCreated({ contactId, meetLink, ... })` (if `GHL_WORKFLOW_WEBHOOK_URL` is set) so GHL can send join-link emails/SMS.
- **In-app:** Notifications are already created when the interview request is PATCHed to `status: 'meeting_created'`.
- **Email:** Call `sendInterviewScheduledEmail` for host and nanny with the Meet link and time.

These are described in `Docs/Remaining-Features.md`.
