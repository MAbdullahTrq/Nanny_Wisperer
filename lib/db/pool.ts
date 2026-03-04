/**
 * PostgreSQL connection pool. Used by all lib/db/* modules.
 */

import { Pool } from 'pg';
import { config } from '@/lib/config';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const url = config.database.url;
    if (!url) throw new Error('DATABASE_URL is required. Set it in .env.');
    pool = new Pool({
      connectionString: url,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const result = await getPool().query(text, params);
  return { rows: (result.rows as T[]), rowCount: result.rowCount ?? 0 };
}
