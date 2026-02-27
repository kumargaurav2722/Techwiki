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
  views?: number;
  status?: string;
  current_version?: number;
};

export type ArticleVersionRecord = {
  id: number;
  article_id: number;
  markdown: string;
  references_json: string | null;
  status: string;
  created_at: string;
  created_by: number | null;
};

export function getArticle(db: Database, category: string, slug: string) {
  const stmt = db.prepare(
    "SELECT * FROM articles WHERE category = ? AND slug = ? LIMIT 1"
  );
  return stmt.get(category, slug) as ArticleRecord | undefined;
}

export function getArticleById(db: Database, id: number) {
  const stmt = db.prepare("SELECT * FROM articles WHERE id = ? LIMIT 1");
  return stmt.get(id) as ArticleRecord | undefined;
}

export function incrementArticleView(db: Database, id: number) {
  const stmt = db.prepare("UPDATE articles SET views = views + 1 WHERE id = ?");
  stmt.run(id);
}

export function upsertArticle(
  db: Database,
  input: {
    category: string;
    topic: string;
    slug?: string;
    markdown: string;
    references?: unknown;
    status?: "draft" | "approved" | "published";
    createdBy?: number | null;
  }
) {
  const now = new Date().toISOString();
  const slug = input.slug || slugify(input.topic);
  const referencesJson = input.references
    ? JSON.stringify(input.references)
    : null;
  const status = input.status || "published";

  const existing = getArticle(db, input.category, slug);

  if (existing) {
    const stmt = db.prepare(
      `UPDATE articles
       SET topic = ?, markdown = ?, references_json = ?, updated_at = ?, version = version + 1, status = ?, current_version = current_version + 1
       WHERE id = ?`
    );
    stmt.run(input.topic, input.markdown, referencesJson, now, status, existing.id);
    insertArticleVersion(db, existing.id, {
      markdown: input.markdown,
      referencesJson,
      status,
      createdBy: input.createdBy ?? null,
    });
    return getArticle(db, input.category, slug);
  }

  const stmt = db.prepare(
    `INSERT INTO articles (category, topic, slug, markdown, references_json, created_at, updated_at, status, current_version)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const info = stmt.run(
    input.category,
    input.topic,
    slug,
    input.markdown,
    referencesJson,
    now,
    now,
    status,
    1
  );

  const inserted = db
    .prepare("SELECT * FROM articles WHERE id = ?")
    .get(info.lastInsertRowid) as ArticleRecord | undefined;

  if (inserted) {
    insertArticleVersion(db, inserted.id, {
      markdown: input.markdown,
      referencesJson,
      status,
      createdBy: input.createdBy ?? null,
    });
  }

  return inserted;
}

export function updateArticleById(
  db: Database,
  id: number,
  input: { markdown: string; references?: unknown; status?: "draft" | "approved" | "published"; createdBy?: number | null }
) {
  const now = new Date().toISOString();
  const referencesJson = input.references
    ? JSON.stringify(input.references)
    : null;
  const status = input.status || "published";

  const stmt = db.prepare(
    `UPDATE articles
     SET markdown = ?, references_json = ?, updated_at = ?, version = version + 1, status = ?, current_version = current_version + 1
     WHERE id = ?`
  );
  stmt.run(input.markdown, referencesJson, now, status, id);
  insertArticleVersion(db, id, {
    markdown: input.markdown,
    referencesJson,
    status,
    createdBy: input.createdBy ?? null,
  });
  return getArticleById(db, id);
}

export function createDraftVersion(
  db: Database,
  articleId: number,
  input: { markdown: string; references?: unknown; createdBy?: number | null }
) {
  const referencesJson = input.references
    ? JSON.stringify(input.references)
    : null;
  insertArticleVersion(db, articleId, {
    markdown: input.markdown,
    referencesJson,
    status: "draft",
    createdBy: input.createdBy ?? null,
  });
  db.prepare(`UPDATE articles SET status = 'draft' WHERE id = ?`).run(articleId);
  return getArticleById(db, articleId);
}

export function updateArticleStatus(db: Database, articleId: number, status: string) {
  db.prepare(`UPDATE articles SET status = ? WHERE id = ?`).run(status, articleId);
}

export function insertArticleVersion(
  db: Database,
  articleId: number,
  input: { markdown: string; referencesJson: string | null; status: string; createdBy?: number | null }
) {
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT INTO article_versions (article_id, markdown, references_json, status, created_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  stmt.run(
    articleId,
    input.markdown,
    input.referencesJson,
    input.status,
    now,
    input.createdBy ?? null
  );
}

export function listArticleVersions(db: Database, articleId: number) {
  const stmt = db.prepare(
    `SELECT id, article_id, markdown, references_json, status, created_at, created_by
     FROM article_versions
     WHERE article_id = ?
     ORDER BY datetime(created_at) DESC`
  );
  return stmt.all(articleId) as ArticleVersionRecord[];
}

export function getArticleVersionById(db: Database, versionId: number) {
  const stmt = db.prepare(
    `SELECT id, article_id, markdown, references_json, status, created_at, created_by
     FROM article_versions
     WHERE id = ?`
  );
  return stmt.get(versionId) as ArticleVersionRecord | undefined;
}

export function getLatestDraftVersion(db: Database, articleId: number) {
  const stmt = db.prepare(
    `SELECT id, article_id, markdown, references_json, status, created_at, created_by
     FROM article_versions
     WHERE article_id = ? AND status IN ('draft', 'approved')
     ORDER BY datetime(created_at) DESC
     LIMIT 1`
  );
  return stmt.get(articleId) as ArticleVersionRecord | undefined;
}

export function updateArticleVersionStatus(
  db: Database,
  versionId: number,
  status: "draft" | "approved" | "published"
) {
  const stmt = db.prepare(
    `UPDATE article_versions
     SET status = ?
     WHERE id = ?`
  );
  stmt.run(status, versionId);
  return db
    .prepare(
      `SELECT id, article_id, markdown, references_json, status, created_at, created_by
       FROM article_versions
       WHERE id = ?`
    )
    .get(versionId) as ArticleVersionRecord | undefined;
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
    `SELECT a.id, a.category, a.slug, a.topic, a.updated_at,
            snippet(articles_fts, 1, '<mark>', '</mark>', '…', 18) AS snippet
     FROM articles_fts
     JOIN articles a ON a.id = articles_fts.rowid
     WHERE articles_fts MATCH ?
     ORDER BY bm25(articles_fts)
     LIMIT 25`
  );

  return stmt.all(match) as Array<{
    id: number;
    category: string;
    slug: string;
    topic: string;
    updated_at: string;
    snippet: string;
  }>;
}

export function listArticles(
  db: Database,
  options: { query?: string; limit?: number; offset?: number } = {}
) {
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  const query = options.query?.trim();

  if (query) {
    const results = searchArticles(db, query);
    return results.slice(0, limit);
  }

  const stmt = db.prepare(
    `SELECT id, category, slug, topic, updated_at
     FROM articles
     ORDER BY datetime(updated_at) DESC
     LIMIT ? OFFSET ?`
  );

  return stmt.all(limit, offset) as Array<{
    id: number;
    category: string;
    slug: string;
    topic: string;
    updated_at: string;
  }>;
}

export function listRecentArticles(db: Database, limit = 10) {
  const stmt = db.prepare(
    `SELECT id, category, slug, topic, updated_at, views
     FROM articles
     ORDER BY datetime(updated_at) DESC
     LIMIT ?`
  );
  return stmt.all(limit) as Array<{
    id: number;
    category: string;
    slug: string;
    topic: string;
    updated_at: string;
    views: number;
  }>;
}

export function listTrendingArticles(db: Database, limit = 10) {
  const stmt = db.prepare(
    `SELECT id, category, slug, topic, updated_at, views
     FROM articles
     ORDER BY views DESC, datetime(updated_at) DESC
     LIMIT ?`
  );
  return stmt.all(limit) as Array<{
    id: number;
    category: string;
    slug: string;
    topic: string;
    updated_at: string;
    views: number;
  }>;
}

export function getRandomArticle(db: Database) {
  const stmt = db.prepare(
    `SELECT id, category, slug, topic
     FROM articles
     ORDER BY RANDOM()
     LIMIT 1`
  );
  return stmt.get() as { id: number; category: string; slug: string; topic: string } | undefined;
}
