import type Database from "better-sqlite3";
import { slugify } from "./utils/slugify";

export type ArticleRecord = {
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

export function getArticle(db: Database, category: string, slug: string) {
  const stmt = db.prepare(
    "SELECT * FROM articles WHERE category = ? AND slug = ? LIMIT 1"
  );
  return stmt.get(category, slug) as ArticleRecord | undefined;
}

export function upsertArticle(
  db: Database,
  input: {
    category: string;
    topic: string;
    slug?: string;
    markdown: string;
    references?: unknown;
  }
) {
  const now = new Date().toISOString();
  const slug = input.slug || slugify(input.topic);
  const referencesJson = input.references
    ? JSON.stringify(input.references)
    : null;

  const existing = getArticle(db, input.category, slug);

  if (existing) {
    const stmt = db.prepare(
      `UPDATE articles
       SET topic = ?, markdown = ?, references_json = ?, updated_at = ?, version = version + 1
       WHERE id = ?`
    );
    stmt.run(input.topic, input.markdown, referencesJson, now, existing.id);
    return getArticle(db, input.category, slug);
  }

  const stmt = db.prepare(
    `INSERT INTO articles (category, topic, slug, markdown, references_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const info = stmt.run(
    input.category,
    input.topic,
    slug,
    input.markdown,
    referencesJson,
    now,
    now
  );

  const inserted = db
    .prepare("SELECT * FROM articles WHERE id = ?")
    .get(info.lastInsertRowid) as ArticleRecord | undefined;

  return inserted;
}

export function searchArticles(db: Database, query: string) {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean)
    .map((token) => `${token}*`);

  if (tokens.length === 0) return [];

  const match = tokens.join(" ");

  const stmt = db.prepare(
    `SELECT a.id, a.category, a.slug, a.topic,
            snippet(articles_fts, 1, '<mark>', '</mark>', '…', 18) AS snippet
     FROM articles_fts
     JOIN articles a ON a.id = articles_fts.rowid
     WHERE articles_fts MATCH ?
     ORDER BY rank
     LIMIT 25`
  );

  return stmt.all(match) as Array<{
    id: number;
    category: string;
    slug: string;
    topic: string;
    snippet: string;
  }>;
}
