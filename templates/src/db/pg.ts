import pg from 'pg';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { onShutdown } from '../lib/shutdown.js';

const { Pool } = pg;

let _pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (_pool) return _pool;

  if (!env.PG_HOST || !env.PG_DATABASE || !env.PG_USER) {
    throw new Error('PG_HOST, PG_DATABASE, and PG_USER must be set');
  }

  _pool = new Pool({
    host: env.PG_HOST,
    port: env.PG_PORT ?? 5432,
    user: env.PG_USER,
    password: env.PG_PASSWORD,
    database: env.PG_DATABASE,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  _pool.on('error', (err) => logger.error({ err }, 'pg pool error'));

  onShutdown('pg', async () => {
    await _pool?.end();
    _pool = null;
    logger.info('pg pool closed');
  });

  return _pool;
}

export const pool = new Proxy({} as pg.Pool, {
  get(_t, prop) {
    const real = getPool() as unknown as Record<PropertyKey, unknown>;
    const value = real[prop];
    return typeof value === 'function' ? (value as Function).bind(real) : value;
  },
});

export async function pingPg(): Promise<void> {
  const client = await getPool().connect();
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
  return getPool().query<T>(text, params);
}

export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
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
