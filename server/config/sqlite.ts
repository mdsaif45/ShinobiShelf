import initSqlJs, { Database } from "sql.js";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "shinobishelf.sqlite");
const SCHEMA_PATH = path.join(process.cwd(), "server", "db", "schema.sql");

let dbInstance: Database | null = null;
let dbInitPromise: Promise<Database> | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = (async () => {
    const SQL = await initSqlJs();

    if (fs.existsSync(DB_PATH)) {
      try {
        const filebuffer = fs.readFileSync(DB_PATH);
        dbInstance = new SQL.Database(filebuffer);
        console.log("⚡ SQLite (sql.js) loaded existing database file at:", DB_PATH);
      } catch (err) {
        console.error("⚠️ Corrupted SQLite database file detected, reinitializing fresh DB:", err);
        dbInstance = new SQL.Database();
        initSqliteSchema(dbInstance);
      }
    } else {
      dbInstance = new SQL.Database();
      console.log("⚡ SQLite (sql.js) initialized new database at:", DB_PATH);
      initSqliteSchema(dbInstance);
    }

    ensureMigrations(dbInstance);
    saveDb(dbInstance);

    return dbInstance;
  })();

  return dbInitPromise;
}

function initSqliteSchema(db: Database) {
  if (fs.existsSync(SCHEMA_PATH)) {
    const sql = fs.readFileSync(SCHEMA_PATH, "utf-8");
    db.run(sql);
    console.log("✅ SQLite schema initialized successfully from schema.sql.");
  }
}

function ensureMigrations(db: Database) {
  try {
    // Check if google_access_token column exists in users table
    const columns = db.exec("PRAGMA table_info(users)");
    if (columns && columns.length > 0) {
      const colNames = columns[0].values.map((v: any) => v[1]);
      if (!colNames.includes("google_access_token")) {
        db.run("ALTER TABLE users ADD COLUMN google_access_token TEXT;");
        console.log("✅ Added google_access_token column to users table.");
      }
      if (!colNames.includes("password_hash")) {
        db.run("ALTER TABLE users ADD COLUMN password_hash TEXT;");
      }
      if (!colNames.includes("salt")) {
        db.run("ALTER TABLE users ADD COLUMN salt TEXT;");
      }
      if (!colNames.includes("bio")) {
        db.run("ALTER TABLE users ADD COLUMN bio TEXT;");
      }
      if (!colNames.includes("favorite_genres")) {
        db.run("ALTER TABLE users ADD COLUMN favorite_genres TEXT;");
      }
      if (!colNames.includes("notification_preferences")) {
        db.run("ALTER TABLE users ADD COLUMN notification_preferences TEXT;");
      }
    }
  } catch (err) {
    console.error("Migration error:", err);
  }
}

export function saveDb(db: Database) {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error("❌ Failed to save SQLite db:", err);
  }
}

// Promisified Helper Methods for SQLite Queries
export const dbQuery = async <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
  const db = await getDb();
  const stmt = db.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
};

export const dbGet = async <T = any>(sql: string, params: any[] = []): Promise<T | undefined> => {
  const rows = await dbQuery<T>(sql, params);
  return rows[0];
};

export const dbRun = async (sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
  const db = await getDb();
  db.run(sql, params);
  saveDb(db);
  return { lastID: 0, changes: 1 };
};
