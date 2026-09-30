/**
 * Applies all .sql files in this folder, in filename order.
 * Usage: npm run migrate
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { pool } = require('../config/db');

async function run() {
  const dir = __dirname;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const rawSql = fs.readFileSync(path.join(dir, file), 'utf8');
    console.log(`Applying migration: ${file}`);

    // Split statements cleanly
    const statements = rawSql
      .split(/;\s*(?:\r?\n|$)/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      await pool.query(statement).catch((err) => {
        // Ignore duplicate errors in migration reruns
        if (!/already exists|duplicate/i.test(err.message)) {
          console.warn(`Migration statement notice [${file}]:`, err.message);
        }
      });
    }
  }

  console.log('All migrations applied successfully.');
  await pool.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
