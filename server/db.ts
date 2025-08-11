import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema.js';

// Get DATABASE_URL from environment or use a default for development
const databaseUrl = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/ecommerce';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not set, using default PostgreSQL connection');
}

const pool = new Pool({
  connectionString: databaseUrl,
});

export const db = drizzle(pool, { schema });