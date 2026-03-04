# Nanny Whisperer — Remaining Features

**Last tested:** March 2026 (build and codebase audit)

This list reflects the current state after testing: the app **builds successfully** and many previously listed gaps are **now implemented**. What remains is below.

---

## Summary

| Area | Status |
|------|--------|
| **Critical bugs** | Fixed (nanny proceed/pass token, CV `isHost`, matching consolidation, trigger auth) |
| **Meetings (host & nanny)** | Done (data-driven pages + `GET /api/meetings`) |
| **Nanny interview-requests** | Done (data-driven list + tokenized “Select slot” link) |
| **Interview request → nanny** | Done (email + in-app notification + interview URL after host submits slots) |
| **Matching trigger** | Done (admin/matchmaker auth, single implementation, shortlist email, GHL + notifications) |
| **Admin reported issues** | Done (IssuesList, filter, PATCH status) |
| **In-app notifications** | Done (table, APIs, `/notifications` page, creation at shortlist / both-proceeded / interview-request / meeting-created) |
| **Chat file attachments** | Done (upload API + Chat UI: attach button, image/link display) |
| **CV page links** | Done (Schedule interview for host, Back to shortlist when applicable) |
| **GHL workflows** | Shortlist + both-proceeded wired; meeting_created defined but not called |
| **Google Meet creation** | **Not implemented** — see below |

---

## 1. Google Meet creation after nanny selects a slot (high priority)

**Current behaviour:** When the nanny picks a slot on the tokenized interview page, `POST /api/interview-requests/[id]/select-slot` only updates the request to `status: 'nanny_selected'` and `selectedSlotIndex`. Nothing creates a Google Calendar event or a Meet link. The interview request never moves to `meeting_created` or gets a `googleMeetLink` unless something else (e.g. manual PATCH or external system) sets them.

**Relevant code:**
- `app/api/interview-requests/[id]/select-slot/route.ts` — updates status to `nanny_selected` only.
- `lib/google/calendar.ts` — only free/busy and getFreeSlots; no “create event with Meet”.
- `app/api/interview-requests/[id]/route.ts` — PATCH can set `googleMeetLink` and `status: 'meeting_created'` and then creates in-app notifications; no GHL or email.

**Needed:**
1. **Create Google Calendar event with Meet:**  
   Add a function (e.g. in `lib/google/` or `lib/scheduling/`) that creates a Calendar event at the selected slot time with `conferenceData` (Google Meet). Use a service calendar or configured calendar ID; add host and nanny (and for VIP, Kayley) as attendees; store the returned `meetLink` / `hangoutLink` and event id.
2. **Call it after slot selection:**  
   From `select-slot` (or a small follow-up flow), after updating to `nanny_selected`, create the event, then PATCH the same interview request with `googleMeetLink`, `googleCalendarEventId`, and `status: 'meeting_created'`.
3. **Notify and email:**  
   When setting `meeting_created` (in PATCH or in the same flow), call `sendInterviewScheduledEmail` for host and nanny (with `meetLink` and date/time) and `triggerMeetingCreated` from `lib/ghl/workflows.ts` so GHL can send join links if configured. In-app notifications are already created in the PATCH handler when `status === 'meeting_created'`.

---

## 2. GHL “meeting_created” and email when meeting is set (medium)

**Current state:** `triggerMeetingCreated` exists in `lib/ghl/workflows.ts` but is never called. `sendInterviewScheduledEmail` exists in `lib/email/send.ts` but is not used when a meeting is created.

**Action:** Once Meet creation is implemented (above), in the same code path that sets `status: 'meeting_created'` and `googleMeetLink`:
- Call `triggerMeetingCreated({ contactId, interviewRequestId, meetLink, hostId, nannyId })` for host (and optionally nanny) so GHL can run workflows.
- Call `sendInterviewScheduledEmail` for both host and nanny with the meet link and selected date/time.

---

## 3. Optional polish / lower priority

- **Notification bell in nav:** Notifications exist (table, APIs, `/notifications` page). If desired, add a notification bell + unread count in host/nanny layout and link to `/notifications` or a dropdown.
- **Email verification enforcement:** Verification email and verify-email API exist; optionally restrict sensitive actions (e.g. send message, schedule interview) until `emailVerified` is true.
- **Contract management:** Still placeholder cards only; no contract generation or signing flow (post-MVP).
- **Profile image persistence:** Onboarding includes `profileImageUrl` in the Profile segment and saves it via the existing API; confirm in DB that it persists after save. No code change required unless you want upload-to-save in one step.

---

## 4. Deferred / post-MVP (unchanged)

- Stripe (payments via GHL for now).
- Real-time WebSocket chat (polling is in place).
- GHL calendar integration beyond current use.
- Zoom (Google Meet only for now).
- Advanced payment/revenue dashboards.
- Mobile app / PWA.

---

## Build and test notes

- `npm run build` completes successfully.
- Key routes and APIs present: `/api/meetings`, `/api/nanny/interview-requests`, `/api/notifications`, `/api/upload/chat-attachment`, `/api/admin/issues`, matching trigger (auth + shortlist + email + GHL + notifications), interview-request creation (email + notification + token), proceed-pass (GHL + notifications), CV page (`isHost` and links), nanny CV token (no `hostId`).
- Single matching implementation: `createShortlistForHost` from `lib/matching/shortlist`; trigger uses it and no longer uses the deprecated Airtable matching path for creation.
- Age group mapping in `lib/matching/utils.ts` includes both `teen` and `teens` in each other’s sets.
