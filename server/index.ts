import express from "express";
import dotenv from "dotenv";
import { initDb } from "./db";
import { generateArticleMarkdown } from "./ai/generate";
import {
  getArticle,
  upsertArticle,
  searchArticles,
  listArticles,
  getArticleById,
  updateArticleById,
} from "./articles";
import { slugify, titleFromSlug } from "./utils/slugify";
import { ingestLibrary, type IngestStatus } from "./ingest/library";
import { parseReferencesFromMarkdown } from "./utils/references";
import { comparePassword, ensureAdminUser, hashPassword, signToken, verifyToken } from "./auth";
import { createUser, getUserByEmail } from "./users";
import {
  addReadingListItem,
  createReadingList,
  deleteBookmark,
  deleteReadingList,
  deleteReadingListItem,
  getReadingListById,
  getReadingLists,
  listBookmarks,
  upsertBookmark,
} from "./library";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const db = initDb();
let ingestStatus: IngestStatus | null = null;

ensureAdminUser(db).catch((error) => {
  console.error("Failed to ensure admin user", error);
});

app.use(express.json({ limit: "2mb" }));

type AuthRequest = express.Request & { user?: { id: number; email: string; role: string } };

function getUserFromRequest(req: AuthRequest) {
  const header = req.header("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  return verifyToken(token);
}

function requireAuth(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.user = user;
  return next();
}

function requireAdmin(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  const adminKey = process.env.ADMIN_API_KEY;
  const provided = req.header("x-admin-key");
  if (adminKey && provided === adminKey) return next();

  const user = getUserFromRequest(req);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  req.user = user;
  return next();
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const existing = getUserByEmail(db, String(email));
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  try {
    const passwordHash = await hashPassword(String(password));
    const user = createUser(db, { email: String(email), passwordHash });
    if (!user) return res.status(500).json({ error: "Failed to create user" });
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error("/api/auth/register error", error);
    return res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = getUserByEmail(db, String(email));
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await comparePassword(String(password), user.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

app.get("/api/auth/me", requireAuth, (req: AuthRequest, res) => {
  return res.json({ user: req.user });
});

app.get("/api/article/:category/:slug", async (req, res) => {
  const { category, slug } = req.params;
  const refresh = req.query.refresh === "true" || req.query.refresh === "1";

  try {
    const existing = getArticle(db, category, slug);
    if (existing && !refresh) {
      let parsedRefs = null;
      if (existing.references_json) {
        try {
          parsedRefs = JSON.parse(existing.references_json);
        } catch {
          parsedRefs = null;
        }
      }
      return res.json({ article: { ...existing, references: parsedRefs }, source: "cache" });
    }

    const topic = typeof req.query.topic === "string" ? req.query.topic : titleFromSlug(slug);
    const markdown = await generateArticleMarkdown({ category, topic });

    if (!markdown.trim()) {
      return res.status(500).json({ error: "AI returned empty content." });
    }

    const references = parseReferencesFromMarkdown(markdown);
    const saved = upsertArticle(db, {
      category,
      topic,
      slug,
      markdown,
      references: references.length ? references : undefined,
    });

    let parsedRefs = null;
    if (saved?.references_json) {
      try {
        parsedRefs = JSON.parse(saved.references_json);
      } catch {
        parsedRefs = null;
      }
    }

    return res.json({
      article: saved ? { ...saved, references: parsedRefs } : null,
      source: existing ? "refreshed" : "generated",
    });
  } catch (error) {
    console.error("/api/article error", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to generate article",
    });
  }
});

app.post("/api/article/generate", async (req, res) => {
  const { category, topic, slug, refresh } = req.body || {};

  if (!category || !topic) {
    return res.status(400).json({ error: "category and topic are required" });
  }

  try {
    const finalSlug = slug ? String(slug) : slugify(String(topic));
    const existing = getArticle(db, String(category), finalSlug);
    if (existing && !refresh) {
      let parsedRefs = null;
      if (existing.references_json) {
        try {
          parsedRefs = JSON.parse(existing.references_json);
        } catch {
          parsedRefs = null;
        }
      }
      return res.json({ article: { ...existing, references: parsedRefs }, source: "cache" });
    }

    const markdown = await generateArticleMarkdown({
      category: String(category),
      topic: String(topic),
    });

    if (!markdown.trim()) {
      return res.status(500).json({ error: "AI returned empty content." });
    }

    const references = parseReferencesFromMarkdown(markdown);
    const saved = upsertArticle(db, {
      category: String(category),
      topic: String(topic),
      slug: finalSlug,
      markdown,
      references: references.length ? references : undefined,
    });

    let parsedRefs = null;
    if (saved?.references_json) {
      try {
        parsedRefs = JSON.parse(saved.references_json);
      } catch {
        parsedRefs = null;
      }
    }

    return res.json({
      article: saved ? { ...saved, references: parsedRefs } : null,
      source: existing ? "refreshed" : "generated",
    });
  } catch (error) {
    console.error("/api/article/generate error", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to generate article",
    });
  }
});

app.get("/api/search", (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q : "";
  if (!query.trim()) {
    return res.json({ results: [] });
  }

  try {
    const results = searchArticles(db, query);
    return res.json({ results });
  } catch (error) {
    console.error("/api/search error", error);
    return res.status(500).json({ error: "Search failed" });
  }
});

app.get("/api/admin/articles", requireAdmin, (req, res) => {
  const query = typeof req.query.query === "string" ? req.query.query : undefined;
  const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
  const offset = typeof req.query.offset === "string" ? Number(req.query.offset) : undefined;

  try {
    const results = listArticles(db, { query, limit, offset });
    return res.json({ results });
  } catch (error) {
    console.error("/api/admin/articles error", error);
    return res.status(500).json({ error: "Failed to list articles" });
  }
});

app.get("/api/admin/article/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const article = getArticleById(db, id);
  if (!article) {
    return res.status(404).json({ error: "Not found" });
  }

  let references = null;
  if (article.references_json) {
    try {
      references = JSON.parse(article.references_json);
    } catch {
      references = null;
    }
  }

  return res.json({ article: { ...article, references } });
});

app.put("/api/admin/article/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const { markdown, references } = req.body || {};
  if (!markdown || typeof markdown !== "string") {
    return res.status(400).json({ error: "markdown is required" });
  }

  try {
    const updated = updateArticleById(db, id, { markdown, references });
    if (!updated) {
      return res.status(404).json({ error: "Not found" });
    }
    let parsedRefs = null;
    if (updated.references_json) {
      try {
        parsedRefs = JSON.parse(updated.references_json);
      } catch {
        parsedRefs = null;
      }
    }
    return res.json({ article: { ...updated, references: parsedRefs } });
  } catch (error) {
    console.error("/api/admin/article/:id error", error);
    return res.status(500).json({ error: "Failed to update article" });
  }
});

app.post("/api/admin/ingest", requireAdmin, async (req, res) => {
  if (ingestStatus?.state === "running") {
    return res.status(409).json({ error: "Ingestion already running" });
  }

  const limit = typeof req.body?.limit === "number" ? req.body.limit : undefined;
  const category = typeof req.body?.category === "string" ? req.body.category : undefined;

  ingestStatus = { state: "running", processed: 0, total: 0, startedAt: new Date().toISOString() };

  ingestLibrary(db, {
    limit,
    category,
    onProgress: (progress) => {
      ingestStatus = { ...ingestStatus!, ...progress };
    },
  })
    .then((final) => {
      ingestStatus = final;
    })
    .catch((error) => {
      ingestStatus = {
        state: "failed",
        processed: ingestStatus?.processed || 0,
        total: ingestStatus?.total || 0,
        startedAt: ingestStatus?.startedAt || new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Ingestion failed",
      };
    });

  return res.json({ status: ingestStatus });
});

app.get("/api/admin/ingest/status", requireAdmin, (_req, res) => {
  return res.json({ status: ingestStatus });
});

app.get("/api/library/bookmarks", requireAuth, (req: AuthRequest, res) => {
  const bookmarks = listBookmarks(db, req.user!.id);
  return res.json({ bookmarks });
});

app.post("/api/library/bookmarks", requireAuth, (req: AuthRequest, res) => {
  const { category, slug, topic } = req.body || {};
  if (!category || !slug || !topic) {
    return res.status(400).json({ error: "category, slug, topic required" });
  }
  const bookmark = upsertBookmark(db, req.user!.id, {
    category: String(category),
    slug: String(slug),
    topic: String(topic),
  });
  return res.json({ bookmark });
});

app.delete("/api/library/bookmarks/:id", requireAuth, (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
  deleteBookmark(db, req.user!.id, id);
  return res.json({ ok: true });
});

app.get("/api/library/reading-lists", requireAuth, (req: AuthRequest, res) => {
  const lists = getReadingLists(db, req.user!.id);
  return res.json({ lists });
});

app.post("/api/library/reading-lists", requireAuth, (req: AuthRequest, res) => {
  const { name } = req.body || {};
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "name required" });
  }
  const list = createReadingList(db, req.user!.id, name);
  return res.json({ list: list ? { ...list, items: [] } : null });
});

app.delete("/api/library/reading-lists/:id", requireAuth, (req: AuthRequest, res) => {
  const listId = Number(req.params.id);
  if (!Number.isFinite(listId)) return res.status(400).json({ error: "Invalid id" });
  deleteReadingList(db, req.user!.id, listId);
  return res.json({ ok: true });
});

app.post("/api/library/reading-lists/:id/items", requireAuth, (req: AuthRequest, res) => {
  const listId = Number(req.params.id);
  if (!Number.isFinite(listId)) return res.status(400).json({ error: "Invalid id" });
  const list = getReadingListById(db, listId);
  if (!list || list.user_id !== req.user!.id) {
    return res.status(404).json({ error: "List not found" });
  }
  const { category, slug, topic } = req.body || {};
  if (!category || !slug || !topic) {
    return res.status(400).json({ error: "category, slug, topic required" });
  }
  const item = addReadingListItem(db, listId, {
    category: String(category),
    slug: String(slug),
    topic: String(topic),
  });
  return res.json({ item });
});

app.delete(
  "/api/library/reading-lists/:listId/items/:itemId",
  requireAuth,
  (req: AuthRequest, res) => {
    const listId = Number(req.params.listId);
    const itemId = Number(req.params.itemId);
    if (!Number.isFinite(listId) || !Number.isFinite(itemId)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const list = getReadingListById(db, listId);
    if (!list || list.user_id !== req.user!.id) {
      return res.status(404).json({ error: "List not found" });
    }
    deleteReadingListItem(db, listId, itemId);
    return res.json({ ok: true });
  }
);

if (process.env.INGEST_ON_BOOT === "true") {
  const bootCategory = process.env.INGEST_CATEGORY || undefined;
  const bootLimitRaw = process.env.INGEST_LIMIT ? Number(process.env.INGEST_LIMIT) : undefined;
  const bootLimit = Number.isFinite(bootLimitRaw) ? bootLimitRaw : undefined;
  ingestStatus = { state: "running", processed: 0, total: 0, startedAt: new Date().toISOString() };
  ingestLibrary(db, {
    category: bootCategory,
    limit: bootLimit,
    onProgress: (progress) => {
      ingestStatus = { ...ingestStatus!, ...progress };
    },
  })
    .then((final) => {
      ingestStatus = final;
    })
    .catch((error) => {
      ingestStatus = {
        state: "failed",
        processed: ingestStatus?.processed || 0,
        total: ingestStatus?.total || 0,
        startedAt: ingestStatus?.startedAt || new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Ingestion failed",
      };
    });
}

app.listen(port, () => {
  console.log(`TechWiki API listening on :${port}`);
});
