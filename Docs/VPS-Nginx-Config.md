# Nginx config for Nanny Whisperer (Next.js 14)

Use this config so the app and `_next/static` chunks load correctly. **Important:** Next.js 14 returns **400 Bad Request** for static/chunk requests if Nginx sends duplicate or invalid `X-Forwarded-*` headers.

## Quick diagnostic (run on the VPS)

See whether the 400 comes from Nginx or from Node:

```bash
# 1. From the server, request the same path Node would get (direct to Node)
curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/_next/static/css/1165a58cb35b387a.css"
# If this prints 200 → Node is fine; the 400 is from Nginx. Fix Nginx (see below).

# 2. Via Nginx (same as the browser)
curl -s -o /dev/null -w "%{http_code}" -H "Host: 46.101.68.166" "http://127.0.0.1:3000/_next/static/css/1165a58cb35b387a.css"
# If this prints 400 → Node returns 400 when it sees that Host. Try the minimal config below.
```

Check Nginx error log while you load the page in the browser:

```bash
sudo tail -f /var/log/nginx/error.log
```

## Recommended config (minimal – avoids 400 on static files)

Use **only one** `proxy_set_header` per header. Do not include other snippets that add `X-Forwarded-For` or `Host` again.

Create or edit `/etc/nginx/sites-available/nanny-wisperer`:

**Using IP (e.g. http://46.101.68.166):**

```nginx
server {
    listen 80;
    server_name 46.101.68.166;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_buffering off;
    }
}
```

**Using a domain:**

```nginx
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_buffering off;
    }
}
```

Replace `your_domain.com` and `46.101.68.166` with your domain or IP.

## Fixing "400 Bad Request" on chunks (ChunkLoadError)

If the app shows **"Application error: a client-side exception"** and the browser console has **ChunkLoadError** and **400** on `/_next/static/chunks/...`:

1. **Avoid duplicate `X-Forwarded-For`**  
   Have **only one** `proxy_set_header X-Forwarded-For ...` in the `location /` block. If you include another config (e.g. from Certbot or a snippet), make sure it doesn’t add a second one.

2. **Check the full Nginx config**  
   ```bash
   sudo nginx -T | grep -A2 X-Forwarded
   ```  
   If `X-Forwarded-For` appears twice for the same server, remove the duplicate.

3. **Reload Nginx**  
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

4. **Hard-refresh the site**  
   Ctrl+Shift+R (or Cmd+Shift+R) so the browser doesn’t use old cached chunks.

## Apply and test

```bash
sudo ln -sf /etc/nginx/sites-available/nanny-wisperer /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Then open `http://46.101.68.166` (or your domain) and check the browser console for chunk errors.
