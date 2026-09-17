#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';

try {
  if (!process.env.DATABASE_URL) throw new Error();
  const sql = neon(process.env.DATABASE_URL);
  const migration = await readFile(new URL('./comments-migration.sql', import.meta.url), 'utf8');
  await sql.transaction(migration.split(';').map(statement => statement.trim()).filter(Boolean).map(statement => sql.query(statement)));
  console.log('Comments database initialized.');
} catch {
  console.error('Comments database initialization failed. Check DATABASE_URL and database permissions.');
  process.exitCode = 1;
}
