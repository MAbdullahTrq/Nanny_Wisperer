# Nanny Whisperer – Agent Instructions

## Cursor Cloud specific instructions

### Overview

Nanny Whisperer is a single Next.js 14 (App Router) application — not a monorepo. It uses **PostgreSQL** as its database (see `scripts/schema.sql` and `lib/db/`). Integrations: GoHighLevel, Google Calendar, Zoom, and Vercel Blob. All external integrations degrade gracefully when credentials are absent.

### Running the app

- `npm run dev` starts the dev server on port 3000.
- `npm run build` builds for production.
- `npm run lint` runs ESLint (requires `.eslintrc.json` to exist; see below).
- Health check: `GET /api/health` returns `{"status":"ok",...}`.

### Environment variables

All required secrets are injected as environment variables in Cloud Agent VMs. A `.env.local` must be created from these env vars before starting the dev server. At minimum: `NEXTAUTH_SECRET`, `JWT_SECRET`, `DATABASE_URL` (PostgreSQL). Run `psql "$DATABASE_URL" -f scripts/schema.sql` to create tables. Set `NEXTAUTH_URL=http://localhost:3000` and `NEXT_PUBLIC_APP_URL=http://localhost:3000` for local dev.

### Gotchas

- **ESLint config**: `.eslintrc.json` (extends `next/core-web-vitals`) is committed for standalone `npm run lint`. `next.config.mjs` has `eslint.ignoreDuringBuilds: true` so the pre-existing lint errors don't break `npm run build`.
- **NEXT_PUBLIC_APP_URL**: The signup flow redirects to the value of `NEXT_PUBLIC_APP_URL` after creating a user. Set it to `http://localhost:3000` for local testing; the injected env var may point to the Vercel production URL.
- **No automated test suite**: The project has no unit/integration tests. Validation is done via `npm run lint` and `npm run build`.
- **Deployment**: The app runs on a VPS via SSH. `.cursorrules` instructs the agent not to run Vercel CLI; deployment is done on the VPS.
