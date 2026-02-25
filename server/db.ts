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
      version INTEGER NOT NULL DEFAULT 1
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
  `);

  return db;
}
