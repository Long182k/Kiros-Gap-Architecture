/**
 * Database Migration Runner
 */
const { Pool } = require('pg');
const { readFileSync, readdirSync } = require('fs');
const { join } = require('path');

require('dotenv').config();

const isSSL = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require');
const connectionString = process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/(\?|&)sslmode=require/, '') : undefined;

const pool = new Pool({
  connectionString,
  ssl: isSSL ? { rejectUnauthorized: false } : undefined
});

async function runMigrations() {
  console.log('Running database migrations...\n');

  const migrationsDir = join(__dirname, '../src/db/migrations');
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    console.log(`Executing: ${file}`);
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    
    try {
      await pool.query(sql);
      console.log(`✓ ${file} completed\n`);
    } catch (error) {
      console.error(`✗ ${file} failed:`, error.message);
      process.exit(1);
    }
  }

  console.log('All migrations completed successfully!');
  await pool.end();
}

runMigrations();
