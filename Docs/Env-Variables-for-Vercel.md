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
| `AIRTABLE_BASE_ID` | `appxxxxxxxxxxxx` | Your Airtable base ID (from base URL or API docs). |

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

## Copy‑paste checklist (fill the placeholders)

```
NEXT_PUBLIC_APP_URL=https://nanny-wisperer.vercel.app
NEXTAUTH_URL=https://nanny-wisperer.vercel.app
NEXTAUTH_SECRET=<openssl rand -base64 32>
JWT_SECRET=<same or another random string>
AIRTABLE_API_KEY=<your Airtable Personal Access Token (PAT)>
AIRTABLE_BASE_ID=<your Airtable base ID>
GOOGLE_CLIENT_ID=<if using Google login/calendar>
GOOGLE_CLIENT_SECRET=<if using Google>
GOOGLE_CALENDAR_ID=primary
KAYLEY_CALENDAR_ID=<if using VIP overlap>
KAYLEY_REFRESH_TOKEN=<if using VIP overlap>
GHL_API_KEY=<if using GHL>
GHL_ACCOUNT_ID=<if using GHL>
GHL_WEBHOOK_SECRET=<if using GHL webhooks>
```

**Note:** Use either `JWT_SECRET` or `TOKEN_SECRET` (the app checks both); one is enough.  
Airtable uses **Personal Access Tokens** (not API keys); create a PAT in Airtable → Account → Developer hub.
