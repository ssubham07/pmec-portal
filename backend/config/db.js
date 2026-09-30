const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let mode = 'pg';
let pgPool = null;
let sqliteDb = null;
let sqliteInitPromise = null;

function convertPgSqlToSqlite(sql) {
  let converted = sql;

  // Handle sequence call in raw SQL
  if (/nextval\s*\(\s*['"]certificate_seq['"]\s*\)/i.test(converted)) {
    converted = converted.replace(/SELECT\s+nextval\s*\(\s*['"]certificate_seq['"]\s*\)\s+AS\s+n/i, 'SELECT seq_nextval() AS n');
  }

  // Convert PostgreSQL $1, $2... to ?
  converted = converted.replace(/\$\d+/g, '?');

  // Convert PostgreSQL DDL keywords for SQLite compatibility
  converted = converted.replace(/SERIAL PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
  converted = converted.replace(/TIMESTAMPTZ/gi, 'DATETIME');
  converted = converted.replace(/JSONB/gi, 'TEXT');
  converted = converted.replace(/\bnow\(\)/gi, 'CURRENT_TIMESTAMP');
  converted = converted.replace(/DEFAULT\s+'\{\}'::jsonb/gi, "DEFAULT '{}'");

  return converted;
}

async function initSqlite() {
  const dbDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, 'pmec_portal.sqlite');
  sqliteDb = new sqlite3.Database(dbPath);

  // Setup certificate sequence table for SQLite
  await new Promise((res, rej) => {
    sqliteDb.run(
      'CREATE TABLE IF NOT EXISTS _certificate_seq (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)',
      (err) => (err ? rej(err) : res())
    );
  });
}

function runSqliteQuery(sqlText, params = []) {
  return new Promise(async (resolve, reject) => {
    if (!sqliteDb) {
      if (!sqliteInitPromise) sqliteInitPromise = initSqlite();
      await sqliteInitPromise;
    }

    // Special handler for nextval('certificate_seq')
    if (/nextval\s*\(\s*['"]certificate_seq['"]\s*\)/i.test(sqlText)) {
      sqliteDb.run('INSERT INTO _certificate_seq DEFAULT VALUES', function (err) {
        if (err) return reject(err);
        resolve({ rows: [{ n: this.lastID }], rowCount: 1 });
      });
      return;
    }

    const convertedSql = convertPgSqlToSqlite(sqlText);
    const isSelect = /^\s*(SELECT|PRAGMA|EXPLAIN)/i.test(convertedSql);

    // Filter out PostgreSQL procedural blocks & extensions in SQLite
    if (/^\s*(CREATE EXTENSION|DO\s+\$\$|DROP TRIGGER|CREATE TRIGGER|CREATE OR REPLACE FUNCTION|CREATE SEQUENCE)/i.test(sqlText)) {
      return resolve({ rows: [], rowCount: 0 });
    }

    if (isSelect) {
      sqliteDb.all(convertedSql, params, (err, rows) => {
        if (err) return reject(err);
        // Parse JSON fields if they look like stringified JSON
        const processedRows = (rows || []).map((row) => {
          if (row && typeof row.details === 'string') {
            try {
              row.details = JSON.parse(row.details);
            } catch (e) {}
          }
          return row;
        });
        resolve({ rows: processedRows, rowCount: processedRows.length });
      });
    } else {
      sqliteDb.run(convertedSql, params, function (err) {
        if (err) return reject(err);
        const lastID = this.lastID;
        const changes = this.changes;

        // If RETURNING clause is present
        if (/RETURNING/i.test(sqlText)) {
          // Fetch the inserted/updated record
          const tableNameMatch = sqlText.match(/(?:INSERT\s+INTO|UPDATE)\s+([a-zA-Z0-9_]+)/i);
          const tableName = tableNameMatch ? tableNameMatch[1] : null;

          if (lastID && tableName) {
            sqliteDb.get(`SELECT * FROM ${tableName} WHERE id = ?`, [lastID], (getErr, row) => {
              if (row && typeof row.details === 'string') {
                try {
                  row.details = JSON.parse(row.details);
                } catch (e) {}
              }
              resolve({ rows: row ? [row] : [{ id: lastID }], rowCount: changes, lastID });
            });
            return;
          }
          // If updating with parameter (e.g. WHERE id = ?)
          const whereIdMatch = params[params.length - 1];
          if (whereIdMatch && tableName && !lastID) {
            sqliteDb.get(`SELECT * FROM ${tableName} WHERE id = ?`, [whereIdMatch], (getErr, row) => {
              if (row && typeof row.details === 'string') {
                try {
                  row.details = JSON.parse(row.details);
                } catch (e) {}
              }
              resolve({ rows: row ? [row] : [], rowCount: changes });
            });
            return;
          }
        }

        resolve({ rows: lastID ? [{ id: lastID }] : [], rowCount: changes, lastID });
      });
    }
  });
}

const pool = {
  async query(text, params) {
    if (mode === 'pg') {
      try {
        if (!pgPool) {
          pgPool = new Pool({
            host: process.env.PGHOST || 'localhost',
            port: parseInt(process.env.PGPORT || '5432'),
            database: process.env.PGDATABASE || 'pmec_portal',
            user: process.env.PGUSER || 'postgres',
            password: process.env.PGPASSWORD || 'postgres',
            connectionTimeoutMillis: 3000,
          });
        }
        return await pgPool.query(text, params);
      } catch (err) {
        if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.message?.includes('connect')) {
          console.warn('⚠️  PostgreSQL connection unavailable, switching to local SQLite database driver.');
          mode = 'sqlite';
          return runSqliteQuery(text, params);
        }
        throw err;
      }
    } else {
      return runSqliteQuery(text, params);
    }
  },
  async end() {
    if (pgPool) {
      await pgPool.end().catch(() => {});
    }
    if (sqliteDb) {
      await new Promise((res) => sqliteDb.close(res));
    }
  },
  on(event, handler) {
    if (pgPool) pgPool.on(event, handler);
  },
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  getMode: () => mode,
};
