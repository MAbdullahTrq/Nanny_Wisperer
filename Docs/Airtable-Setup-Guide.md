 # How to build the Airtable base for Nanny Whisperer

Use **one Airtable base**. Table and field names must match exactly (case-sensitive). Create tables in any order; link fields after both tables exist.

---

## 1. Create a base

1. Go to [airtable.com](https://airtable.com) and sign in.
2. **Add a base** → **Start from scratch** (or duplicate a blank base).
3. Name it (e.g. "Nanny Whisperer").
4. Copy the **Base ID** from the URL: `https://airtable.com/appXXXXXXXXXXXXXX/...` → the `appXXXXXXXXXXXXXX` part. You’ll use it as `AIRTABLE_BASE_ID` in the app.
5. Create a **Personal Access Token** (Account → Developer hub → Personal access tokens) with **read** and **write** access to this base. Use it as `AIRTABLE_API_KEY` in the app.

---

## 2. Create each table and its fields

Create the following tables. **Table names** must be exactly as written. For each field, use the type in parentheses.

---

### Table: **Users**

| Field name       | Type              | Options / notes |
|------------------|-------------------|------------------|
| email            | Single line text  | Unique; used for login. |
| name             | Single line text  | |
| userType         | Single select     | Options: `Host`, `Nanny` |
| passwordHash     | Long text         | Store hashed passwords. |
| ghlContactId     | Single line text  | Optional; GoHighLevel contact ID. |
| airtableHostId   | Single line text  | Optional; Host record ID after onboarding. |
| airtableNannyId  | Single line text  | Optional; Nanny record ID after onboarding. |
| emailVerified    | Checkbox          | Default unchecked. |

*Airtable adds **Created** automatically; the app uses it as `createdTime`.*

---

### Table: **Hosts**

| Field name       | Type              | Notes |
|------------------|-------------------|--------|
| userId           | Single line text  | Users record ID; links this host to a user. |
| firstName        | Single line text  | |
| lastName         | Single line text  | |
| location         | Single line text  | e.g. city for matching. |
| tier             | Single line text  | e.g. `VIP` for matching. |
| (others)         | As needed         | Add any extra onboarding fields (phone, city, postcode, childrenAndAges, etc.) as Single line, Long text, Number, Checkbox, or Single select. |

*The app expects at least `userId`; other fields follow your onboarding form. Add **Created** if you want an explicit created time.*

---

### Table: **Nannies**

| Field name       | Type              | Notes |
|------------------|-------------------|--------|
| userId           | Single line text  | Users record ID. |
| badge            | Single select     | Options: `Basic`, `Verified`, `Certified`. |
| tier             | Single line text  | Can mirror badge. |
| firstName        | Single line text  | |
| lastName         | Single line text  | |
| (others)         | As needed         | Same idea as Hosts; add fields to match onboarding. |

---

### Table: **Matches**

| Field name     | Type              | Options / notes |
|----------------|-------------------|------------------|
| hostId         | Single line text  | Hosts record ID. |
| nannyId        | Single line text  | Nannies record ID. |
| score          | Number            | Match score. |
| hostProceed    | Checkbox          | |
| nannyProceed   | Checkbox          | |
| bothProceedAt  | Single line text  | ISO date string, or use Date. |
| status         | Single select     | Options: `pending`, `shortlisted`, `proceeded`, `passed`. |

---

### Table: **Shortlists**

| Field name   | Type                    | Notes |
|--------------|-------------------------|--------|
| hostId       | Single line text        | Hosts record ID. |
| matchIds     | Link to another record  | Link to **Matches**; allow multiple records. |
| deliveredAt  | Date (or Single line)   | Optional. |

---

### Table: **Conversations**

| Field name | Type             | Notes |
|------------|------------------|--------|
| matchId    | Single line text | Matches record ID. |
| hostId     | Single line text | Hosts record ID. |
| nannyId    | Single line text | Nannies record ID. |

---

### Table: **Messages**

| Field name      | Type             | Options / notes |
|-----------------|------------------|------------------|
| conversationId  | Single line text | Conversations record ID. |
| senderId       | Single line text | Users or Host/Nanny record ID. |
| senderType     | Single select    | Options: `Host`, `Nanny`. |
| content        | Long text        | Message body. |
| attachmentUrl   | Single line text | Optional; URL. |

---

### Table: **InterviewRequests**

| Field name           | Type             | Options / notes |
|----------------------|------------------|------------------|
| matchId              | Single line text | Matches record ID. |
| hostId               | Single line text | Hosts record ID. |
| nannyId              | Single line text | Nannies record ID. |
| slot1                | Single line text | ISO datetime (e.g. `2025-02-01T14:00:00.000Z`). |
| slot2                | Single line text | Same. |
| slot3                | Single line text | Same. |
| slot4                | Single line text | Same. |
| slot5                | Single line text | Same. |
| selectedSlotIndex    | Number           | 0–4 when nanny picks a slot. |
| googleMeetLink       | Single line text | Optional; set when meeting is created. |
| googleCalendarEventId| Single line text | Optional. |
| status               | Single select    | Options: `pending_slots`, `nanny_selected`, `meeting_created`, `none_available`, `cancelled`. |
| isVip                | Checkbox         | Optional; for VIP overlap. |

---

### Table: **PasswordResetTokens**

| Field name | Type             | Notes |
|------------|------------------|--------|
| email      | Single line text | User email. |
| token      | Long text        | Reset token string. |
| expiresAt  | Single line text | ISO date string (or Date). |

---

### Table: **GoogleCalendarTokens**

| Field name    | Type             | Notes |
|---------------|------------------|--------|
| userId        | Single line text | Users record ID. |
| refreshToken  | Long text        | Google OAuth refresh token. |
| calendarId    | Single line text | e.g. `primary` or calendar ID. |
| updatedTime   | Single line text | ISO date (or Date). |

---

## 3. Checklist

- [ ] One base created; Base ID and Personal Access Token saved for the app.
- [ ] **Users** – email, name, userType, passwordHash, ghlContactId, airtableHostId, airtableNannyId, emailVerified.
- [ ] **Hosts** – userId plus any profile/onboarding fields.
- [ ] **Nannies** – userId, badge (or tier) plus any profile/onboarding fields.
- [ ] **Matches** – hostId, nannyId, score, hostProceed, nannyProceed, bothProceedAt, status.
- [ ] **Shortlists** – hostId, matchIds (link to Matches), deliveredAt.
- [ ] **Conversations** – matchId, hostId, nannyId.
- [ ] **Messages** – conversationId, senderId, senderType, content, attachmentUrl.
- [ ] **InterviewRequests** – matchId, hostId, nannyId, slot1–slot5, selectedSlotIndex, googleMeetLink, googleCalendarEventId, status, isVip.
- [ ] **PasswordResetTokens** – email, token, expiresAt.
- [ ] **GoogleCalendarTokens** – userId, refreshToken, calendarId, updatedTime.

---

## 4. IDs in the app

The app stores **Airtable record IDs** (e.g. `recXXXXXXXXXXXXXX`) in fields like `hostId`, `nannyId`, `matchId`, `userId`. It does **not** use Airtable’s “Link to another record” for every relation; many are plain text fields holding the linked record’s ID. So:

- **Users**: `airtableHostId` and `airtableNannyId` are **Single line text** with the Host/Nanny record ID.
- **Matches**: `hostId` and `nannyId` are **Single line text** with the Host/Nanny record ID.
- **Shortlists**: `matchIds` is the one field that works well as **Link to another record** (Matches); the API sends an array of record IDs.

If you prefer, you can use “Link to another record” for relations and the app will still work as long as the API receives the correct record IDs when reading/writing (Airtable returns linked record IDs as arrays).

---

## 5. After the base is ready

1. Put **AIRTABLE_BASE_ID** (base ID) and **AIRTABLE_API_KEY** (Personal Access Token) in your app env.
2. Ensure the PAT has **read** and **write** access to this base (and the right scopes in Developer hub).

You’re done. The app will create and update records in these tables as users sign up, onboard, match, chat, and schedule interviews.
