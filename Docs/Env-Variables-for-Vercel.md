# Environment variables for Vercel

Add these in **Vercel → Project → Settings → Environment Variables**. Use **Production** (and optionally **Preview**) for each.

Replace placeholders with your real values. After adding, redeploy.

---

## Required (app won’t work without these)

| Variable | Value | Notes |
|---------|--------|--------|
| `NEXT_PUBLIC_APP_URL` | `https://nanny-wisperer.vercel.app` | Your Vercel production URL (no trailing slash). |
| `NEXTAUTH_URL` | `https://nanny-wisperer.vercel.app` | Same as `NEXT_PUBLIC_APP_URL`. |
| `NEXTAUTH_SECRET` | *(long random string)* | e.g. run: `openssl rand -base64 32` and paste the output. |
| `JWT_SECRET` | *(long random string)* | For shortlist/CV/interview tokens. Can use same value as `NEXTAUTH_SECRET` or generate another. |
| `AIRTABLE_API_KEY` | `patxxxxxxxxxxxx` | Airtable **Personal Access Token** (PAT). Create in Airtable → Account → Developer hub; scope read/write on your base. |
| `AIRTABLE_BASE_ID` | `appxxxxxxxxxxxx` | **Base** ID only: from your base URL (`airtable.com/appXXXXXXXX/...`). Must start with `app`. Using a table ID (`tbl...`) causes 404. |
| `AIRTABLE_USERS_TABLE_NAME` | *(optional)* | Name of the table that stores user accounts. Default: `Users`. Set this if your table has a different name (e.g. `User`). |
| `AIRTABLE_HOSTS_TABLE_NAME` | *(optional)* | Name of the Hosts table. Default: `Hosts`. Set if your table has a different name. |
| `AIRTABLE_NANNIES_TABLE_NAME` | *(optional)* | Name of the Nannies/Caregivers table. Default: `Nannies`. Admin Caregivers list and matching read from this table; set if your table has a different name. |

---

## Optional: Google (login + calendar)

| Variable | Value | Notes |
|---------|--------|--------|
| `GOOGLE_CLIENT_ID` | `xxxxx.apps.googleusercontent.com` | From Google Cloud Console → Credentials. |
| `GOOGLE_CLIENT_SECRET` | *(client secret)* | From same OAuth 2.0 client. |
| `GOOGLE_CALENDAR_ID` | `primary` or a calendar ID | Default calendar for creating events (optional). |

---

## Optional: VIP (Kayley calendar overlap)

| Variable | Value | Notes |
|---------|--------|--------|
| `KAYLEY_CALENDAR_ID` | *(calendar ID)* | Kayley’s Google Calendar ID. |
| `KAYLEY_REFRESH_TOKEN` | *(refresh token)* | Google OAuth refresh token for that calendar. |

---

## Optional: GoHighLevel

| Variable | Value | Notes |
|---------|--------|--------|
| `GHL_API_KEY` | *(API key)* | GoHighLevel API key. |
| `GHL_ACCOUNT_ID` | *(account ID)* | GHL account ID. |
| `GHL_WEBHOOK_SECRET` | *(secret)* | Used to verify webhook signatures. |
| `GHL_INBOUND_WEBHOOK_URL` | *(Lead Connector inbound webhook URL)* | GHL receives signup data (email, name, signupType: Host \| Nanny) when users sign up. |

---

## Don’t add (Vercel sets these)

| Variable | Why |
|---------|-----|
| `NODE_ENV` | Vercel sets to `production` in production. |

---

## Optional: SMTP2Go (email notifications)

| Variable | Value | Notes |
|---------|--------|--------|
| `SMTP2GO_API_KEY` | *(your API key)* | From SMTP2Go dashboard → Settings → API Keys. |
| `SMTP2GO_FROM_EMAIL` | `noreply@nannywhisperer.com` | "From" email address. Must be a verified sender domain in SMTP2Go. Default: `noreply@nannywhisperer.com`. |
| `SMTP2GO_FROM_NAME` | `Nanny Whisperer` | Display name for the "From" field. Default: `Nanny Whisperer`. |

**Setup steps:** Log in to [SMTP2Go](https://www.smtp2go.com/) → Settings → API Keys → create a key. Verify your sender domain under Settings → Sender Domains.

---

## Optional: Vercel Blob (profile image uploads)

| Variable | Value | Notes |
|---------|--------|--------|
| `BLOB_READ_WRITE_TOKEN` | *(auto-set when you create a Blob store)* | In Vercel → Project → **Storage** → create a **Blob** store. The token is added automatically. Required for host/nanny profile image upload. |

---

## Copy‑paste checklist (fill the placeholders)

```
NEXT_PUBLIC_APP_URL=https://nanny-wisperer.vercel.app
NEXTAUTH_URL=https://nanny-wisperer.vercel.app
NEXTAUTH_SECRET=<openssl rand -base64 32>
JWT_SECRET=<same or another random string>
AIRTABLE_API_KEY=<your Airtable Personal Access Token (PAT)>
AIRTABLE_BASE_ID=<your Airtable base ID>
# AIRTABLE_USERS_TABLE_NAME=Users   # only if your table has a different name
# AIRTABLE_HOSTS_TABLE_NAME=Hosts
# AIRTABLE_NANNIES_TABLE_NAME=Nannies   # Caregivers list and matching use this table
GOOGLE_CLIENT_ID=<if using Google login/calendar>
GOOGLE_CLIENT_SECRET=<if using Google>
GOOGLE_CALENDAR_ID=primary
KAYLEY_CALENDAR_ID=<if using VIP overlap>
KAYLEY_REFRESH_TOKEN=<if using VIP overlap>
GHL_API_KEY=<if using GHL>
GHL_ACCOUNT_ID=<if using GHL>
GHL_WEBHOOK_SECRET=<if using GHL webhooks>
SMTP2GO_API_KEY=<your SMTP2Go API key>
SMTP2GO_FROM_EMAIL=noreply@nannywhisperer.com
SMTP2GO_FROM_NAME=Nanny Whisperer
# BLOB_READ_WRITE_TOKEN=<auto-set when you create a Blob store in Vercel → Storage>
```

**Note:** Use either `JWT_SECRET` or `TOKEN_SECRET` (the app checks both); one is enough.  
Airtable uses **Personal Access Tokens** (not API keys); create a PAT in Airtable → Account → Developer hub.
