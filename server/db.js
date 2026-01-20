/**
 * Database Connection
 *
 * Establishes and exports a PostgreSQL connection pool.
 * The pool manages multiple connections and automatically handles
 * connection reuse, timeouts, and reconnection.
 *
 * Uses the 'pg' library (node-postgres) for PostgreSQL connectivity.
 * Connection settings are loaded from config.js.
 *
 * Usage:
 * ```javascript
 * import { pool } from './db.js';
 * const result = await pool.query('SELECT * FROM players');
 * ```
 */

import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

/**
 * PostgreSQL connection pool
 *
 * Automatically manages a pool of database connections.
 * Connections are created as needed and returned to the pool after use.
 * Configuration is pulled from config.db settings.
 */
export const pool = new Pool(config.db);

/**
 * Test database connection on server startup
 * Runs a simple query to verify connectivity and logs the result.
 */
pool.query('SELECT NOW()')
  .then(() => console.log('Database connected'))
  .catch((err) => console.error('Database connection error:', err.message));
