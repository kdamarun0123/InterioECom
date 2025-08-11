import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon, neonConfig } from '@neondatabase/serverless';
import * as schema from '../shared/schema.js';

// Configure Neon for serverless environments
neonConfig.fetchConnectionCache = true;

// Get DATABASE_URL from environment or use a default for development
const databaseUrl = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/ecommerce';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not set, using default PostgreSQL connection');
}

const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });
