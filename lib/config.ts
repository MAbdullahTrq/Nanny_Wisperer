/**
 * Central config for environment variables.
 * All keys have safe defaults so the app does not crash when vars are missing.
 */

function getEnv(key: string, defaultValue = ''): string {
  if (typeof process.env[key] === 'string') {
    return process.env[key]!;
  }
  return defaultValue;
}

export const config = {
  app: {
    url: getEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
    nodeEnv: getEnv('NODE_ENV', 'development'),
  },
  auth: {
    nextAuthUrl: getEnv('NEXTAUTH_URL', 'http://localhost:3000'),
    nextAuthSecret: getEnv('NEXTAUTH_SECRET', ''),
    jwtSecret: getEnv('JWT_SECRET', getEnv('TOKEN_SECRET', '')),
  },
  google: {
    clientId: getEnv('GOOGLE_CLIENT_ID', ''),
    clientSecret: getEnv('GOOGLE_CLIENT_SECRET', ''),
    /** Calendar on which to create interview events (with Meet links). Use with GOOGLE_MEET_CALENDAR_REFRESH_TOKEN. */
    calendarId: getEnv('GOOGLE_CALENDAR_ID', ''),
    /** Refresh token for the account that owns GOOGLE_CALENDAR_ID; used to create events with Meet. See Docs/Meet-And-Calendar-Setup.md. */
    meetCalendarRefreshToken: getEnv('GOOGLE_MEET_CALENDAR_REFRESH_TOKEN', ''),
  },
  kayley: {
    calendarId: getEnv('KAYLEY_CALENDAR_ID', ''),
    refreshToken: getEnv('KAYLEY_REFRESH_TOKEN', ''),
  },
  ghl: {
    apiKey: getEnv('GHL_API_KEY', ''),
    accountId: getEnv('GHL_ACCOUNT_ID', ''),
    webhookSecret: getEnv('GHL_WEBHOOK_SECRET', ''),
    /** Inbound webhook URL for signup form data (Host/Nanny) */
    inboundWebhookUrl: getEnv('GHL_INBOUND_WEBHOOK_URL', ''),
    /** Inbound webhook URL for workflow triggers (shortlist_ready, both_proceeded, meeting_created) */
    workflowWebhookUrl: getEnv('GHL_WORKFLOW_WEBHOOK_URL', ''),
  },
  smtp2go: {
    apiKey: getEnv('SMTP2GO_API_KEY', ''),
    fromEmail: getEnv('SMTP2GO_FROM_EMAIL', 'noreply@nannywhisperer.com'),
    fromName: getEnv('SMTP2GO_FROM_NAME', 'Nanny Whisperer'),
  },
  database: {
    /** PostgreSQL connection string (e.g. postgresql://user:pass@localhost:5432/nanny_wisperer) */
    url: getEnv('DATABASE_URL', ''),
  },
  airtable: {
    /** Personal Access Token (PAT) from Airtable → Account → Developer hub */
    apiKey: getEnv('AIRTABLE_API_KEY', ''),
    baseId: getEnv('AIRTABLE_BASE_ID', ''),
    /** Table name for user accounts; must match the table name in your base exactly (default: Users) */
    usersTableName: getEnv('AIRTABLE_USERS_TABLE_NAME', 'Users'),
    /** Chat: table names must match your base exactly (default: Conversations, Messages) */
    conversationsTableName: getEnv('AIRTABLE_CONVERSATIONS_TABLE_NAME', 'Conversations'),
    messagesTableName: getEnv('AIRTABLE_MESSAGES_TABLE_NAME', 'Messages'),
    /** Hosts and Nannies table names (default: Hosts, Nannies) */
    hostsTableName: getEnv('AIRTABLE_HOSTS_TABLE_NAME', 'Hosts'),
    nanniesTableName: getEnv('AIRTABLE_NANNIES_TABLE_NAME', 'Nannies'),
    /** Set to "true" if your Nannies table has a "nannyType" column (Single select: Nanny, Au Pair). When false, we omit it so saves succeed without that column. */
    nanniesHaveNannyTypeField: getEnv('AIRTABLE_NANNIES_HAVE_NANNY_TYPE') === 'true',
  },
} as const;

export type Config = typeof config;
