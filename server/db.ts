import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema.js';

// Get database URL from environment or use Replit's default
const databaseUrl = process.env.DATABASE_URL || process.env.REPLIT_DB_URL || 'postgresql://postgres:password@localhost:5432/ecommerce';

if (!process.env.DATABASE_URL && !process.env.REPLIT_DB_URL) {
  console.warn('Warning: Neither DATABASE_URL nor REPLIT_DB_URL environment variables are set.');
  console.warn('Using fallback database connection. For production, set DATABASE_URL in your environment.');
  console.warn('The connection string should look like: postgresql://username:password@host:port/database');
}

console.log('Attempting to connect to database...');

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test the connection
pool.on('connect', () => {
  console.log('Successfully connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

export const db = drizzle(pool, { schema });