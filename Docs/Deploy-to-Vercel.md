# Deploy Nanny Whisperer to Vercel

## 1. Prerequisites

- **Git**: Your project in a Git repo (GitHub, GitLab, or Bitbucket).
- **Vercel account**: Sign up at [vercel.com](https://vercel.com) (free tier is fine).
- **Environment variables**: You’ll need values for Airtable, NextAuth, Google OAuth, etc. (see Step 4).

---

## 2. Push your code to Git

If the project isn’t in a repo yet:

```bash
cd "d:\Work\Maintainance\Nanny_Wisperer"
git init
git add .
git commit -m "Initial commit"
```

Create a repo on GitHub (or GitLab/Bitbucket), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## 3. Import the project on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **Add New…** → **Project**.
3. **Import** your Git repository (GitHub/GitLab/Bitbucket).
4. Vercel will detect Next.js. Keep the defaults:
   - **Framework Preset**: Next.js  
   - **Build Command**: `next build` (or leave empty)  
   - **Output Directory**: (leave default)  
   - **Install Command**: `npm install` (or leave empty)  
5. **Do not deploy yet** — add environment variables first (Step 4), then deploy.

---

## 4. Environment variables on Vercel

In the project settings (or during import), open **Environment Variables** and add these. Use **Production** (and optionally **Preview**) for each.

| Variable | Example / notes |
|----------|------------------|
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` (use your real Vercel URL after first deploy) |
| `NEXTAUTH_URL` | Same as `NEXT_PUBLIC_APP_URL` |
| `NEXTAUTH_SECRET` | Long random string (e.g. `openssl rand -base64 32`) |
| `JWT_SECRET` or `TOKEN_SECRET` | Long random string (for shortlist/CV/interview tokens) |
| `AIRTABLE_API_KEY` | Your Airtable API token |
| `AIRTABLE_BASE_ID` | Your Airtable base ID |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALENDAR_ID` | (Optional) Default calendar for events |
| `KAYLEY_CALENDAR_ID` | (Optional) VIP overlap |
| `KAYLEY_REFRESH_TOKEN` | (Optional) VIP overlap |
| `GHL_API_KEY` | (Optional) GoHighLevel |
| `GHL_ACCOUNT_ID` | (Optional) |
| `GHL_WEBHOOK_SECRET` | (Optional) Webhook verification |

**Important:** Set `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` to your **actual** Vercel URL (e.g. `https://nanny-wisperer.vercel.app`). You can set a placeholder first, deploy once to get the URL, then update these two and redeploy.

---

## 5. Deploy

1. Click **Deploy**.
2. Wait for the build. If it fails, check the build logs (often a missing env var or TypeScript error).
3. After success, open your project URL (e.g. `https://your-project.vercel.app`).
4. If you used a placeholder for the app URL:
   - Set **Environment Variables** `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` to this URL.
   - Trigger a **Redeploy** (Deployments → … → Redeploy).

---

## 6. Post-deploy: Google OAuth and GHL

Your app URL is now different from localhost. Update:

**Google Cloud Console**

1. [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials) → your OAuth 2.0 Client.
2. Under **Authorized redirect URIs**, add:
   - `https://YOUR_VERCEL_URL/api/auth/callback/google`
   - `https://YOUR_VERCEL_URL/api/calendar/callback`
3. Save.

**GoHighLevel (if used)**

- Set the webhook URL to `https://YOUR_VERCEL_URL/api/webhooks/ghl`.

---

## 7. Custom domain (optional)

1. In Vercel: Project → **Settings** → **Domains**.
2. Add your domain and follow DNS instructions.
3. After the domain is active, set:
   - `NEXT_PUBLIC_APP_URL` = `https://yourdomain.com`
   - `NEXTAUTH_URL` = `https://yourdomain.com`
4. Add the same URLs to Google OAuth redirect URIs and any GHL webhook.
5. Redeploy if needed.

---

## 8. Troubleshooting

| Issue | What to do |
|-------|------------|
| Build fails | Check build logs; fix TypeScript/lint errors and missing env vars. |
| 500 on login | Ensure `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are set; URL must match the deployment URL. |
| Redirect / callback errors | Confirm Google redirect URIs use the exact Vercel (or custom) URL. |
| “Invalid token” or auth errors | Ensure `JWT_SECRET` or `TOKEN_SECRET` is set in Vercel env. |
| Airtable errors | Check `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID`; token must have access to the base. |

---

## Quick checklist

- [ ] Code pushed to GitHub/GitLab/Bitbucket  
- [ ] Project imported on Vercel  
- [ ] All required env vars added (especially `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, Airtable, Google)  
- [ ] First deploy successful  
- [ ] `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` set to the real Vercel URL  
- [ ] Google OAuth redirect URIs updated to production URL  
- [ ] GHL webhook URL updated (if used)
