# Nanny Whisperer — VPS Setup Plan (One-Prompt)

Use this when you've opened the project on a **fresh Ubuntu VPS** via Cursor Remote-SSH. Give Cursor the **One Prompt** below so it can run through the plan and set everything up.

---

## One Prompt (copy this into Cursor on the VPS)

```
I'm on an Ubuntu VPS and this project (Nanny Whisperer) is open via Remote-SSH. Follow the plan in Docs/VPS-Setup-Plan.md from "Phase 1" to "Phase 7" in order.

- Run all commands in the project root unless a path is specified.
- Create any config files at the paths given in the plan.
- When you need a value from me (domain, repo URL, secrets), ask once then continue with placeholders and tell me what to replace.
- After each phase, confirm what was done before moving on.
- By the end, the app should be running under PM2, Nginx should proxy to it, and SSL should be set up if I provided a domain.

Do not skip phases. Execute the plan step by step.
```

---

## Prerequisites (you do these before Cursor)

1. **VPS:** Ubuntu 22.04 or 24.04, root or sudo access, SSH key installed.
2. **Repo:** Code is on GitHub (or GitLab). You'll clone it on the VPS, or you already cloned it and opened that folder in Cursor via Remote-SSH.
3. **Secrets:** You have (or will paste later):
   - `NEXTAUTH_SECRET`, `JWT_SECRET` (e.g. `openssl rand -base64 32`)
   - `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`
   - Optionally: Google OAuth, GHL, Blob token.
4. **Domain (optional):** A domain pointed at the VPS IP (A record). If none, we'll use HTTP on the IP only.

---

## Phase 1 — System and Node

**Goal:** Node 20 LTS and basic tools installed.

1. Update system:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. Install Node 20 (NodeSource):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   node -v   # should show v20.x
   npm -v
   ```

3. Install Git if missing:
   ```bash
   sudo apt install -y git
   ```

---

## Phase 2 — Clone Repo (if not already present)

**Goal:** Project code at a fixed path so Nginx and PM2 can use it.

- **If the project is already open in Cursor on the VPS:** Note the path (e.g. `/home/ubuntu/nanny-wisperer`). Use that as `APP_ROOT` everywhere below. Skip cloning.
- **If you need to clone:** Ask the user for the repo URL (e.g. `https://github.com/USERNAME/Nanny_Wisperer.git`). Then:
  ```bash
  sudo mkdir -p /var/www
  sudo chown "$USER":"$USER" /var/www
  cd /var/www
  git clone <REPO_URL> nanny-wisperer
  cd nanny-wisperer
  ```
  Set `APP_ROOT=/var/www/nanny-wisperer` for later steps.

---

## Phase 3 — Environment File

**Goal:** `.env` exists with all required variables so the app can build and run.

1. From `APP_ROOT`, copy the example and open for editing:
   ```bash
   cp .env.example .env
   ```

2. Set **required** variables (replace placeholders; user must provide secrets):
   - `NEXT_PUBLIC_APP_URL` — production URL, e.g. `https://yourdomain.com` or `http://VPS_IP` for testing.
   - `NEXTAUTH_URL` — same as `NEXT_PUBLIC_APP_URL`.
   - `NEXTAUTH_SECRET` — long random string (e.g. `openssl rand -base64 32`).
   - `JWT_SECRET` or `TOKEN_SECRET` — same or another random string.
   - `AIRTABLE_API_KEY` — Airtable Personal Access Token.
   - `AIRTABLE_BASE_ID` — Airtable base ID (starts with `app`).

3. Optional (can leave empty): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GHL_*`, `BLOB_READ_WRITE_TOKEN`, `KAYLEY_*`.

4. For production build:
   ```bash
   echo "NODE_ENV=production" >> .env
   ```
   (Or set `NODE_ENV=production` in `.env` if not already.)

5. Ensure `.env` is in `.gitignore` and never committed.

---

## Phase 4 — Install Dependencies and Build

**Goal:** App builds successfully.

```bash
cd "$APP_ROOT"
npm ci
npm run build
```

- If `npm ci` fails, try `npm install`.
- If build fails, fix reported errors (often missing env vars or TypeScript/lint). Ensure at least `NEXTAUTH_SECRET`, `JWT_SECRET`, `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID` are set in `.env`.

---

## Phase 5 — Run with PM2

**Goal:** App runs in the background and restarts on reboot.

1. Install PM2 globally:
   ```bash
   sudo npm install -g pm2
   ```

2. Start the app from `APP_ROOT`:
   ```bash
   cd "$APP_ROOT"
   pm2 start npm --name "nanny-wisperer" -- start
   ```

3. Save process list and enable startup script:
   ```bash
   pm2 save
   pm2 startup
   ```
   Run the command that `pm2 startup` prints (usually `sudo env PATH=...`).

4. Check:
   ```bash
   pm2 status
   pm2 logs nanny-wisperer --lines 20
   ```
   App should listen on port 3000. Test locally: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000` → expect 200 or 307.

---

## Phase 6 — Nginx (Reverse Proxy)

**Goal:** Nginx proxies external requests to the Node app on port 3000.

1. Install Nginx:
   ```bash
   sudo apt install -y nginx
   ```

2. Create Nginx config. **If user has a domain** (e.g. `app.example.com`), create:
   ```bash
   sudo nano /etc/nginx/sites-available/nanny-wisperer
   ```
   Paste (replace `your_domain.com` and adjust if needed):

   ```nginx
   server {
       listen 80;
       server_name your_domain.com;
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   **If user has no domain**, use the server’s IP:
   ```nginx
   server {
       listen 80 default_server;
       server_name _;
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. Enable site and reload Nginx:
   ```bash
   sudo ln -sf /etc/nginx/sites-available/nanny-wisperer /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

4. Open port 80 (and 443 for SSL) if using a firewall:
   ```bash
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw allow 22
   sudo ufw --force enable
   ```

---

## Phase 7 — SSL with Certbot (only if domain is set)

**Goal:** HTTPS with a valid certificate.

- **If no domain:** Skip this phase. Tell the user to set `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` to `http://VPS_IP` and that SSL can be added later when they have a domain.
- **If domain is set:** Run:
  ```bash
  sudo apt install -y certbot python3-certbot-nginx
  sudo certbot --nginx -d your_domain.com --non-interactive --agree-tos -m user@example.com
  ```
  Replace `your_domain.com` and `user@example.com`. Certbot will modify the Nginx config and set up HTTPS.

  After SSL:
  - Ensure `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` in `.env` use `https://your_domain.com`.
  - Restart the app so it picks up the URLs: `pm2 restart nanny-wisperer`.

---

## Post-Setup Checklist

- [ ] `pm2 status` shows `nanny-wisperer` online.
- [ ] `curl -I http://127.0.0.1:3000` returns 200 or 307.
- [ ] From browser: open `http://VPS_IP` or `https://your_domain.com` and see the app.
- [ ] If using Google OAuth: add the production callback URL in Google Cloud Console (e.g. `https://your_domain.com/api/auth/callback/google`).
- [ ] If using GHL: set webhook URL to `https://your_domain.com/api/webhooks/ghl`.

---

## Deploy Updates Later

From the project root on the VPS:

```bash
cd "$APP_ROOT"
git pull
npm ci
npm run build
pm2 restart nanny-wisperer
```

---

## If Cursor is Executing This Plan

- **APP_ROOT:** Use the current workspace root (e.g. `/var/www/nanny-wisperer` or `/home/ubuntu/nanny-wisperer`). If in doubt, use `pwd` in the project directory.
- **Placeholders:** When the plan says "replace with domain" or "user must provide," ask the user once, then use their value or a clear placeholder (e.g. `your_domain.com`) and tell them what to replace.
- **Errors:** If a command fails, show the output and suggest a fix before continuing.
- **Order:** Do not run Phase 7 if the user has no domain; state that SSL was skipped and how to add it later.
