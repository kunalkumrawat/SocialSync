import initSqlJs, { Database } from 'sql.js'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

export class DatabaseService {
  private db: Database | null = null
  private dbPath: string
  private initialized = false

  constructor() {
    const userDataPath = app.getPath('userData')
    this.dbPath = path.join(userDataPath, 'socialsync.db')
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    const SQL = await initSqlJs()

    // Load existing database or create new one
    if (fs.existsSync(this.dbPath)) {
      const fileBuffer = fs.readFileSync(this.dbPath)
      this.db = new SQL.Database(fileBuffer)
    } else {
      this.db = new SQL.Database()
    }

    // Run migrations
    await this.runMigrations()

    this.initialized = true
    console.log('[DatabaseService] Initialized at:', this.dbPath)
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    // Create migrations table if not exists
    this.db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Get applied migrations
    const applied = new Set<string>()
    const result = this.db.exec('SELECT name FROM migrations')
    if (result.length > 0) {
      result[0].values.forEach((row) => applied.add(row[0] as string))
    }

    // Run pending migrations
    for (const migration of migrations) {
      if (!applied.has(migration.name)) {
        console.log(`[DatabaseService] Running migration: ${migration.name}`)
        this.db.run(migration.sql)
        this.db.run('INSERT INTO migrations (name) VALUES (?)', [migration.name])
      }
    }

    // Save after migrations
    this.save()
  }

  save(): void {
    if (!this.db) return
    const data = this.db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(this.dbPath, buffer)
  }

  // Generic query methods
  run(sql: string, params: unknown[] = []): void {
    if (!this.db) throw new Error('Database not initialized')
    this.db.run(sql, params)
    this.save()
  }

  get<T>(sql: string, params: unknown[] = []): T | null {
    if (!this.db) throw new Error('Database not initialized')
    const stmt = this.db.prepare(sql)
    stmt.bind(params)
    if (stmt.step()) {
      const row = stmt.getAsObject()
      stmt.free()
      return row as T
    }
    stmt.free()
    return null
  }

  all<T>(sql: string, params: unknown[] = []): T[] {
    if (!this.db) throw new Error('Database not initialized')
    const stmt = this.db.prepare(sql)
    stmt.bind(params)
    const results: T[] = []
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T)
    }
    stmt.free()
    return results
  }

  close(): void {
    if (this.db) {
      this.save()
      this.db.close()
      this.db = null
      this.initialized = false
    }
  }
}

// Migration definitions
const migrations = [
  {
    name: '001_initial_schema',
    sql: `
      -- Connected platform accounts
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        account_name TEXT,
        account_id TEXT,
        connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT
      );

      -- Configured Drive folders to monitor
      CREATE TABLE IF NOT EXISTS drive_folders (
        id TEXT PRIMARY KEY,
        folder_id TEXT NOT NULL,
        folder_name TEXT,
        account_id TEXT REFERENCES accounts(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Content items from Drive
      CREATE TABLE IF NOT EXISTS content_items (
        id TEXT PRIMARY KEY,
        drive_file_id TEXT NOT NULL,
        folder_id TEXT REFERENCES drive_folders(id),
        filename TEXT,
        mime_type TEXT,
        size_bytes INTEGER,
        duration_seconds INTEGER,
        created_at DATETIME,
        discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending'
      );

      -- Posting schedules per platform
      CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        account_id TEXT REFERENCES accounts(id),
        days_of_week TEXT,
        times TEXT,
        timezone TEXT DEFAULT 'UTC',
        enabled INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Posting queue
      CREATE TABLE IF NOT EXISTS queue (
        id TEXT PRIMARY KEY,
        content_id TEXT REFERENCES content_items(id),
        platform TEXT NOT NULL,
        account_id TEXT REFERENCES accounts(id),
        scheduled_for DATETIME,
        status TEXT DEFAULT 'pending',
        attempts INTEGER DEFAULT 0,
        last_error TEXT,
        posted_at DATETIME,
        platform_post_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Activity log
      CREATE TABLE IF NOT EXISTS activity_log (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        content_id TEXT,
        platform TEXT,
        message TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- App settings
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },
]

// Singleton instance
let instance: DatabaseService | null = null

export function getDatabase(): DatabaseService {
  if (!instance) {
    instance = new DatabaseService()
  }
  return instance
}
