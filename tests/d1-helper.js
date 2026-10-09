import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
export class LocalD1 {
  constructor() { this.db = new DatabaseSync(':memory:'); this.db.exec(readFileSync(new URL('../drizzle/0000_billing.sql', import.meta.url), 'utf8')); this.batches = []; }
  withSession() { return this; }
  prepare(sql) {
    const database = this;
    return { sql, args: [], bind(...args) { return { ...this, args }; }, async first() { return database.db.prepare(sql).get(...this.args) || null; }, async all() { return { results: database.db.prepare(sql).all(...this.args) }; } };
  }
  async batch(statements) {
    this.batches.push(statements.length); this.db.exec('BEGIN');
    try {
      const results = statements.map(statement => ({ results: this.db.prepare(statement.sql).all(...statement.args) }));
      this.db.exec('COMMIT'); return results;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  close() { this.db.close(); }
}
export class LocalBucket {
  constructor() { this.files = new Map(); }
  async put(key, value) { this.files.set(key, value); }
  async get(key) { const content = this.files.get(key); return content === undefined ? null : { async text() { return content; } }; }
}
