import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema.js';

// Get database URL from environment or use Replit's default
const databaseUrl = process.env.DATABASE_URL || process.env.REPLIT_DB_URL;

if (!databaseUrl) {
  console.error('Database connection error: Neither DATABASE_URL nor REPLIT_DB_URL environment variables are set.');
  console.error('Please set DATABASE_URL in your Replit secrets to your PostgreSQL connection string.');
  console.error('The connection string should look like: postgresql://username:password@host:port/database');
  throw new Error('Database connection not configured. Please set DATABASE_URL in Replit secrets.');
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