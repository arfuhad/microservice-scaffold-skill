import pg from 'pg';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

const { Pool } = pg;

if (!env.PG_HOST || !env.PG_DATABASE || !env.PG_USER) {
  throw new Error('PG_HOST, PG_DATABASE, and PG_USER must be set');
}

export const pool = new Pool({
  host: env.PG_HOST,
  port: env.PG_PORT ?? 5432,
  user: env.PG_USER,
  password: env.PG_PASSWORD,
  database: env.PG_DATABASE,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => logger.error({ err }, 'pg pool error'));

export async function pingPg(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    logger.info({ db: env.PG_DATABASE }, 'pg connected');
  } finally {
    client.release();
  }
}

export function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

const close = async () => {
  await pool.end();
  logger.info('pg pool closed');
};
process.on('SIGINT', close);
process.on('SIGTERM', close);
