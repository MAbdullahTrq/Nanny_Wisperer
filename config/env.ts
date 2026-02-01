/**
 * Env config alias. T1 uses lib/config.ts; existing code imports `env` with flat keys.
 */

import { config } from '@/lib/config';

export const env = {
  NEXT_PUBLIC_APP_URL: config.app.url,
  NEXTAUTH_URL: config.auth.nextAuthUrl,
  NEXTAUTH_SECRET: config.auth.nextAuthSecret,
  AIRTABLE_API_KEY: config.airtable.apiKey,
  AIRTABLE_BASE_ID: config.airtable.baseId,
  GHL_API_KEY: config.ghl.apiKey,
  GHL_ACCOUNT_ID: config.ghl.accountId,
  ...config,
} as const;

export { config };
