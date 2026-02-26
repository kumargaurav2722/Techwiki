import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

export type ArticleRow = {
  id: number;
  category: string;
  topic: string;
  slug: string;
  markdown: string;
  references_json: string | null;
  created_at: string;
  updated_at: string;
  version: number;
};

const dbPath = path.resolve(process.cwd(), "server", "data", "techwiki.db");

export function initDb() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      topic TEXT NOT NULL,
      slug TEXT NOT NULL,
      markdown TEXT NOT NULL,
      references_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'published',
      current_version INTEGER NOT NULL DEFAULT 1,
      views INTEGER NOT NULL DEFAULT 0
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_category_slug
      ON articles (category, slug);

    CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
      title,
      body,
      category,
      topic,
      slug,
      content='articles',
      content_rowid='id'
    );

    CREATE TRIGGER IF NOT EXISTS articles_ai AFTER INSERT ON articles BEGIN
      INSERT INTO articles_fts(rowid, title, body, category, topic, slug)
      VALUES (new.id, new.topic, new.markdown, new.category, new.topic, new.slug);
    END;

    CREATE TRIGGER IF NOT EXISTS articles_au AFTER UPDATE ON articles BEGIN
      INSERT INTO articles_fts(articles_fts, rowid, title, body, category, topic, slug)
      VALUES('delete', old.id, old.topic, old.markdown, old.category, old.topic, old.slug);
      INSERT INTO articles_fts(rowid, title, body, category, topic, slug)
      VALUES (new.id, new.topic, new.markdown, new.category, new.topic, new.slug);
    END;

    CREATE TRIGGER IF NOT EXISTS articles_ad AFTER DELETE ON articles BEGIN
      INSERT INTO articles_fts(articles_fts, rowid, title, body, category, topic, slug)
      VALUES('delete', old.id, old.topic, old.markdown, old.category, old.topic, old.slug);
    END;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      slug TEXT NOT NULL,
      topic TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, category, slug),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reading_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reading_list_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      slug TEXT NOT NULL,
      topic TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(list_id, category, slug),
      FOREIGN KEY(list_id) REFERENCES reading_lists(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS article_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      markdown TEXT NOT NULL,
      references_json TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL,
      created_by INTEGER,
      FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE,
      FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      owner_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TEXT NOT NULL,
      UNIQUE(team_id, user_id),
      FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      article_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      article_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shared_reading_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id INTEGER NOT NULL,
      team_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(list_id, team_id),
      FOREIGN KEY(list_id) REFERENCES reading_lists(id) ON DELETE CASCADE,
      FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE
    );
  `);

  const columns = db.prepare("PRAGMA table_info(articles)").all() as Array<{ name: string }>;
  const ensureColumn = (name: string, ddl: string) => {
    if (!columns.some((col) => col.name === name)) {
      db.exec(ddl);
    }
  };

  ensureColumn("views", "ALTER TABLE articles ADD COLUMN views INTEGER NOT NULL DEFAULT 0");
  ensureColumn("status", "ALTER TABLE articles ADD COLUMN status TEXT NOT NULL DEFAULT 'published'");
  ensureColumn(
    "current_version",
    "ALTER TABLE articles ADD COLUMN current_version INTEGER NOT NULL DEFAULT 1"
  );

  return db;
}
