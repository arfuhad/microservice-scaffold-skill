# PostgreSQL Connection Guide

This guide describes how to set up a robust PostgreSQL connection using the `pg` package in a Node.js microservice.

## Features
- Connection pooling for performance.
- Environment-based configuration.
- Query logging.
- Health check capability.

## Configuration Template

```javascript
// config/database.js
export const pgConfig = {
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'myapp',
  password: process.env.PGPASSWORD || 'secret',
  port: process.env.PGPORT || 5432,
  max: 20, // max number of clients in the pool
  idleTimeoutMillis: 30000,
};
```

## Connection Logic (Pooling)

```javascript
// server/database.js
import pg from 'pg';
import { pgConfig } from '../config/database';

const { Pool } = pg;
const pool = new Pool(pgConfig);

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = (text, params) => pool.query(text, params);

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log(`Connected to PostgreSQL: ${pgConfig.database}`);
    client.release();
  } catch (err) {
    console.error('Failed to connect to PostgreSQL', err);
    process.exit(1);
  }
};

export default pool;
```

## Best Practices
- **Use Pooling:** Always use a `Pool` for web applications to handle concurrent requests efficiently.
- **Parametrized Queries:** Never concatenate strings in queries to prevent SQL injection.
- **Connection Testing:** Perform a simple `SELECT NOW()` or connection attempt during startup.
