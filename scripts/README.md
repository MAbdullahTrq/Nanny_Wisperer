# Scripts

## Database schema (PostgreSQL)

Create the database and tables:

```bash
createdb nanny_wisperer   # or your DB name
psql "$DATABASE_URL" -f scripts/schema.sql
```

## Migrate data from Airtable to SQL

Use this **once** when switching from Airtable to PostgreSQL so existing data is copied over.

**Prerequisites:**

- `.env` has **Airtable**: `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID` (and optional table names if you changed them).
- `.env` has **PostgreSQL**: `DATABASE_URL`.
- PostgreSQL schema is already applied (see above).

**Run:**

```bash
npm run migrate:airtable-to-sql
```

The script will:

1. Read all records from each Airtable table (Users, Hosts, Nannies, Matches, Shortlists, Conversations, Messages, InterviewRequests, GoogleCalendarTokens).
2. Insert them into PostgreSQL, preserving Airtable record IDs so relationships (e.g. `host_id`, `nanny_id`) stay valid.

Uses `ON CONFLICT (id) DO NOTHING`, so you can run it again safely; existing rows are skipped. Ephemeral tables (EmailVerificationTokens, PasswordResetTokens) are not migrated.
