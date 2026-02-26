 # How to build the Airtable base for Nanny Whisperer

Use **one Airtable base**. Table and field names must match exactly (case-sensitive). Create tables in any order; link fields after both tables exist.

**→ For a single reference of every field in every table, see [Airtable-Complete-Field-List.md](./Airtable-Complete-Field-List.md).**

---

## 1. Create a base

1. Go to [airtable.com](https://airtable.com) and sign in.
2. **Add a base** → **Start from scratch** (or duplicate a blank base).
3. Name it (e.g. "Nanny Whisperer").
4. Copy the **Base ID** from the URL: `https://airtable.com/appXXXXXXXXXXXXXX/...` → the part that **starts with `app`** (e.g. `appAbc123XYZ`). Use it as `AIRTABLE_BASE_ID`. Do **not** use a table ID (which starts with `tbl`) — that causes 404.
5. Create a **Personal Access Token** (Account → Developer hub → Personal access tokens):
   - Add **Bases** and select **this base** (so the token has access to it).
   - Add scopes **data.records:read** and **data.records:write**.
   - Use the token as `AIRTABLE_API_KEY`. If the token doesn’t have access to the base, the API returns 404.

---

## 2. Create each table and its fields

Create the following tables. **Table names** must be exactly as written. For each field, use the type in parentheses.

---

### Table: **Users**

The app expects this table to be named **Users** by default. If you use a different name (e.g. "User"), set the env var `AIRTABLE_USERS_TABLE_NAME` to that exact name (case-sensitive).

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
| isAdmin          | Checkbox          | Optional; check to grant access to `/admin`. |
| isMatchmaker     | Checkbox          | Optional; check to grant access to `/matchmaker`. |

*Airtable adds **Created** automatically; the app uses it as `createdTime`.*

**To add an admin or matchmaker:** (1) The field names in Airtable must be exactly **isAdmin** and **isMatchmaker** (case-sensitive, no spaces). (2) Ensure the user has a row in Users (they sign up as Host or Nanny, or you create one). (3) In the Users table, check **isAdmin** and/or **isMatchmaker** for that user. (4) They must **log out and log back in** for the new role to apply; after that they will be redirected to `/admin` or `/matchmaker` instead of the host/nanny dashboard.

---

### Table: **Hosts**

**Field names must match exactly** (including spaces and capitals). The app maps to these Airtable field names:

| Field name (exact in Airtable) | Type              | Notes |
|-------------------------------|-------------------|--------|
| userId                        | Single line text  | Users record ID; links this host to a user. |
| First name                    | Single line text  | |
| Last name                     | Single line text  | |
| Date of birth                 | Single line text  | |
| Profile image URL             | Single line text  | |
| Street and number             | Single line text  | |
| Postcode                      | Single line text  | |
| City                          | Single line text  | |
| Country                       | Single line text  | |
| Phone                         | Single line text  | |
| Job location country          | Single line text  | |
| Job location place            | Single line text  | |
| Accommodation type            | Single select     | Live-In, Live-Out, Either |
| Household languages           | Single line / Long text | |
| Travel expectations           | Single select     | None, Occasional, Frequent Travel with Family |
| Children and ages             | Long text         | |
| Desired start date            | Single line text  | |
| Finish date                   | Single line text  | |
| Finish date ongoing           | Checkbox          | |
| Required hours                | Multiple select   | Morning, Afternoon, Evening, Overnight |
| Weekends required             | Checkbox          | |
| Required days                 | Multiple select   | Mon–Sun |
| Age group experience required | Multiple select   | Infant, Toddler, School age, Teen |
| Special needs care            | Checkbox          | |
| Max children                  | Number            | |
| Cooking for children         | Checkbox          | |
| Tutoring homework            | Checkbox          | |
| Driving                      | Checkbox          | |
| Travel assistance            | Checkbox          | |
| Light housekeeping           | Checkbox          | |
| Primary language required    | Single line text  | |
| Primary language level       | Single select     | Mother tongue, Conversational, Basic |
| Language spoken with children | Single line text  | |
| Language spoken with children level | Single select | |
| Pets in home                 | Checkbox          | |
| Smoking policy               | Single select     | No smoking, Outdoor only, Flexible |
| Strong religious beliefs     | Checkbox          | |
| Parenting style              | Single select     | Gentle, Balanced, Structured |
| Dietary preferences          | Multiple select   | Vegan, Vegetarian, etc. |
| Nanny follow dietary         | Checkbox          | |
| Monthly salary range         | Single select     | €1000-€2000, €2000-€4000, €4000+ |
| Preferred contract type      | Single select     | Part time, Full time, Seasonal |
| Trial period preference      | Single select     | 2 weeks, 1 month, No trial |
| About family                 | Long text         | |
| location                      | Single line text  | Optional; e.g. city for matching. |
| tier                          | Single line text  | Optional; e.g. VIP for matching. |

*Add **Created** if you want an explicit created time. You can create only the fields you need; the app will write to any that exist.*

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

## 5. Troubleshooting: 404 NOT_FOUND

If the app logs **Airtable GET Users: 404 {"error":"NOT_FOUND"}**, check:

1. **Base ID, not table ID**  
   `AIRTABLE_BASE_ID` must be the **base** ID (starts with `app`), from the base URL: `airtable.com/appXXXXXXXX/...`. Do **not** use a table ID (starts with `tbl`).

2. **PAT has access to this base**  
   In Airtable → Account → Developer hub → your token: under **Access**, add **this base**. If the token can’t see the base, the API returns 404.

3. **Table name**  
   The Users table must be named exactly **Users** (or set `AIRTABLE_USERS_TABLE_NAME` to your table’s exact name, case-sensitive).

4. **No typos or spaces**  
   In Vercel env, ensure there are no leading/trailing spaces and no quotes around the value.

After changing env vars, **redeploy** so the new values are used.

---

## 6. After the base is ready

1. Put **AIRTABLE_BASE_ID** (base ID) and **AIRTABLE_API_KEY** (Personal Access Token) in your app env.
2. Ensure the PAT has **read** and **write** access to this base (and the right scopes in Developer hub).

You’re done. The app will create and update records in these tables as users sign up, onboard, match, chat, and schedule interviews.
