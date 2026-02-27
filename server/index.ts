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
  incrementArticleView,
  listRecentArticles,
  listTrendingArticles,
  getRandomArticle,
  listArticleVersions,
  getLatestDraftVersion,
  updateArticleVersionStatus,
  createDraftVersion,
  updateArticleStatus,
  getArticleVersionById,
} from "./articles";
import { slugify, titleFromSlug } from "./utils/slugify";
import { ingestLibrary, type IngestStatus } from "./ingest/library";
import { parseReferencesFromMarkdown } from "./utils/references";
import { comparePassword, ensureAdminUser, hashPassword, signToken, verifyToken } from "./auth";
import { clearExpiredBan, createUser, getUserByEmail, getUserById, listUsers, updateUserBan } from "./users";
import {
  addReadingListItem,
  createReadingList,
  deleteBookmark,
  deleteReadingList,
  deleteReadingListItem,
  getReadingListById,
  getReadingLists,
  getReadingListItems,
  listBookmarks,
  upsertBookmark,
} from "./library";
import {
  createTeam,
  listTeamsForUser,
  addTeamMember,
  createNote,
  listNotes,
  createComment,
  listComments,
  getCommentById,
  reportComment,
  getCommentReportById,
  listCommentReports,
  updateCommentReportStatus,
  updateCommentStatus,
  shareReadingList,
  listSharedReadingLists,
} from "./collab";
import { buildGraph } from "./graph";
import { executeRunner } from "./runner";
import { containsModerationKeyword, getModerationAction } from "./utils/moderation";

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

app.get("/api/graph", (req, res) => {
  const mode = req.query.mode === "basic" ? "basic" : "linked";
  const maxCrossEdges = Number(req.query.maxCrossEdges);
  const limit = Number(req.query.limit);
  const graph = buildGraph(db, {
    mode,
    maxCrossEdges: Number.isFinite(maxCrossEdges) ? maxCrossEdges : undefined,
    limit: Number.isFinite(limit) ? limit : undefined,
  });
  return res.json(graph);
});

app.post("/api/runner/execute", async (req, res) => {
  const { language, code, stdin } = req.body || {};
  if (!language || typeof language !== "string") {
    return res.status(400).json({ error: "language is required" });
  }
  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "code is required" });
  }
  if (code.length > 50000) {
    return res.status(400).json({ error: "Code is too large" });
  }

  try {
    const result = await executeRunner({
      language,
      code,
      stdin: typeof stdin === "string" ? stdin : "",
    });
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Runner error";
    return res.status(500).json({ error: message });
  }
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

  if (user.status === "banned") {
    if (user.banned_until) {
      clearExpiredBan(db, user.id);
      const refreshed = getUserById(db, user.id);
      if (refreshed?.status === "banned") {
        return res.status(403).json({ error: "Account is banned" });
      }
    } else {
      return res.status(403).json({ error: "Account is banned" });
    }
  }

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
      incrementArticleView(db, existing.id);
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

    if (saved) {
      incrementArticleView(db, saved.id);
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
      incrementArticleView(db, existing.id);
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

    if (saved) {
      incrementArticleView(db, saved.id);
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

app.get("/api/articles/recent", (req, res) => {
  const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 10;
  const results = listRecentArticles(db, Number.isFinite(limit) ? limit : 10);
  return res.json({ results });
});

app.get("/api/articles/trending", (req, res) => {
  const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 10;
  const results = listTrendingArticles(db, Number.isFinite(limit) ? limit : 10);
  return res.json({ results });
});

app.get("/api/articles/random", (_req, res) => {
  const article = getRandomArticle(db);
  if (!article) return res.status(404).json({ error: "No articles found" });
  return res.json({ article });
});

app.get("/api/stats", (_req, res) => {
  const articleCount = db.prepare("SELECT COUNT(*) as count FROM articles").get() as { count: number };
  const categoryCount = db
    .prepare("SELECT COUNT(DISTINCT category) as count FROM articles")
    .get() as { count: number };
  const recent = listRecentArticles(db, 10);
  const trending = listTrendingArticles(db, 10);
  return res.json({
    counts: { articles: articleCount.count, categories: categoryCount.count },
    recent,
    trending,
  });
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

  const { markdown, references, status } = req.body || {};
  if (!markdown || typeof markdown !== "string") {
    return res.status(400).json({ error: "markdown is required" });
  }

  try {
    const updated = updateArticleById(db, id, {
      markdown,
      references,
      status: status || "published",
      createdBy: req.user?.id ?? null,
    });
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

app.get("/api/admin/article/:id/versions", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const versions = listArticleVersions(db, id).map((version) => {
    let refs = null;
    if (version.references_json) {
      try {
        refs = JSON.parse(version.references_json);
      } catch {
        refs = null;
      }
    }
    return { ...version, references: refs };
  });
  return res.json({ versions });
});

app.post("/api/admin/article/:id/draft", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
  const { markdown, references } = req.body || {};
  if (!markdown || typeof markdown !== "string") {
    return res.status(400).json({ error: "markdown is required" });
  }

  const updated = createDraftVersion(db, id, {
    markdown,
    references,
    createdBy: req.user?.id ?? null,
  });
  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json({ article: updated });
});

app.post("/api/admin/article/:id/approve", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
  const latestDraft = getLatestDraftVersion(db, id);
  if (!latestDraft) return res.status(404).json({ error: "No draft found" });
  const updated = updateArticleVersionStatus(db, latestDraft.id, "approved");
  updateArticleStatus(db, id, "approved");
  return res.json({ version: updated });
});

app.post("/api/admin/article/:id/publish", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
  const latestDraft = getLatestDraftVersion(db, id);
  if (!latestDraft) return res.status(404).json({ error: "No draft found" });
  const refs = latestDraft.references_json ? JSON.parse(latestDraft.references_json) : undefined;
  const updated = updateArticleById(db, id, {
    markdown: latestDraft.markdown,
    references: refs,
    status: "published",
    createdBy: req.user?.id ?? null,
  });
  updateArticleVersionStatus(db, latestDraft.id, "published");
  return res.json({ article: updated });
});

app.post("/api/admin/article/:id/restore", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
  const { versionId, publish } = req.body || {};
  const numericVersionId = Number(versionId);
  if (!Number.isFinite(numericVersionId)) {
    return res.status(400).json({ error: "versionId is required" });
  }

  const version = getArticleVersionById(db, numericVersionId);
  if (!version || version.article_id !== id) {
    return res.status(404).json({ error: "Version not found" });
  }

  let parsedRefs = null;
  if (version.references_json) {
    try {
      parsedRefs = JSON.parse(version.references_json);
    } catch {
      parsedRefs = null;
    }
  }

  const status = publish ? "published" : "draft";
  const updated = updateArticleById(db, id, {
    markdown: version.markdown,
    references: parsedRefs,
    status,
    createdBy: req.user?.id ?? null,
  });
  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json({ article: { ...updated, references: parsedRefs } });
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

app.post("/api/library/reading-lists/:id/share", requireAuth, (req: AuthRequest, res) => {
  const listId = Number(req.params.id);
  if (!Number.isFinite(listId)) return res.status(400).json({ error: "Invalid id" });
  const { teamId } = req.body || {};
  if (!teamId) return res.status(400).json({ error: "teamId required" });
  const list = getReadingListById(db, listId);
  if (!list || list.user_id !== req.user!.id) {
    return res.status(404).json({ error: "List not found" });
  }
  shareReadingList(db, listId, Number(teamId));
  return res.json({ ok: true });
});

app.get("/api/library/shared", requireAuth, (req: AuthRequest, res) => {
  const shared = listSharedReadingLists(db, req.user!.id);
  const lists = shared.map((entry) => ({
    ...entry,
    items: getReadingListItems(db, entry.list_id),
  }));
  return res.json({ lists });
});

app.get("/api/teams", requireAuth, (req: AuthRequest, res) => {
  const teams = listTeamsForUser(db, req.user!.id);
  return res.json({ teams });
});

app.post("/api/teams", requireAuth, (req: AuthRequest, res) => {
  const { name } = req.body || {};
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "name required" });
  }
  const team = createTeam(db, req.user!.id, name.trim());
  return res.json({ team });
});

app.post("/api/teams/:id/members", requireAuth, (req: AuthRequest, res) => {
  const teamId = Number(req.params.id);
  if (!Number.isFinite(teamId)) return res.status(400).json({ error: "Invalid id" });
  const { email } = req.body || {};
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "email required" });
  }
  const team = db.prepare("SELECT * FROM teams WHERE id = ?").get(teamId) as { id: number; owner_id: number } | undefined;
  if (!team || team.owner_id !== req.user!.id) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const user = getUserByEmail(db, email);
  if (!user) return res.status(404).json({ error: "User not found" });
  addTeamMember(db, teamId, user.id);
  return res.json({ ok: true });
});

app.get("/api/notes/:articleId", requireAuth, (req: AuthRequest, res) => {
  const articleId = Number(req.params.articleId);
  if (!Number.isFinite(articleId)) return res.status(400).json({ error: "Invalid article id" });
  const notes = listNotes(db, req.user!.id, articleId);
  return res.json({ notes });
});

app.post("/api/notes/:articleId", requireAuth, (req: AuthRequest, res) => {
  const articleId = Number(req.params.articleId);
  if (!Number.isFinite(articleId)) return res.status(400).json({ error: "Invalid article id" });
  const { content } = req.body || {};
  if (!content || typeof content !== "string") {
    return res.status(400).json({ error: "content required" });
  }
  const note = createNote(db, req.user!.id, articleId, content.trim());
  return res.json({ note });
});

app.get("/api/comments/:articleId", requireAuth, (req: AuthRequest, res) => {
  const articleId = Number(req.params.articleId);
  if (!Number.isFinite(articleId)) return res.status(400).json({ error: "Invalid article id" });
  const comments = listComments(db, articleId);
  return res.json({ comments });
});

app.post("/api/comments/:articleId", requireAuth, (req: AuthRequest, res) => {
  const articleId = Number(req.params.articleId);
  if (!Number.isFinite(articleId)) return res.status(400).json({ error: "Invalid article id" });
  const { content } = req.body || {};
  if (!content || typeof content !== "string") {
    return res.status(400).json({ error: "content required" });
  }

  const userRecord = getUserById(db, req.user!.id);
  if (userRecord?.status === "banned") {
    if (userRecord.banned_until) {
      clearExpiredBan(db, userRecord.id);
      const refreshed = getUserById(db, userRecord.id);
      if (refreshed?.status === "banned") {
        return res.status(403).json({ error: "Account is banned" });
      }
    } else {
      return res.status(403).json({ error: "Account is banned" });
    }
  }

  const trimmed = content.trim();
  const hasKeyword = containsModerationKeyword(trimmed);
  const action = getModerationAction();
  if (hasKeyword && action === "reject") {
    return res.status(400).json({ error: "Comment contains restricted terms" });
  }

  const status = hasKeyword && action === "hide" ? "hidden" : "visible";
  const comment = createComment(db, req.user!.id, articleId, trimmed, status);
  return res.json({ comment, moderated: status !== "visible" });
});

app.post("/api/comments/:commentId/report", requireAuth, (req: AuthRequest, res) => {
  const commentId = Number(req.params.commentId);
  if (!Number.isFinite(commentId)) return res.status(400).json({ error: "Invalid comment id" });
  const comment = getCommentById(db, commentId);
  if (!comment) return res.status(404).json({ error: "Comment not found" });
  const { reason } = req.body || {};
  const report = reportComment(db, commentId, req.user!.id, typeof reason === "string" ? reason.trim() : undefined);
  return res.json({ report });
});

app.get("/api/admin/comment-reports", requireAdmin, (req: AuthRequest, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const reports = listCommentReports(db, status);
  return res.json({ reports });
});

app.post("/api/admin/comment-reports/:id/action", requireAdmin, (req: AuthRequest, res) => {
  const reportId = Number(req.params.id);
  if (!Number.isFinite(reportId)) return res.status(400).json({ error: "Invalid report id" });
  const { action } = req.body || {};
  if (!action || typeof action !== "string") {
    return res.status(400).json({ error: "action required" });
  }

  const report = getCommentReportById(db, reportId);
  if (!report) return res.status(404).json({ error: "Report not found" });

  if (action === "dismiss") {
    const updated = updateCommentReportStatus(db, reportId, "dismissed", req.user!.id);
    return res.json({ report: updated });
  }
  if (action === "resolve") {
    const updated = updateCommentReportStatus(db, reportId, "resolved", req.user!.id);
    return res.json({ report: updated });
  }
  if (action === "hide") {
    updateCommentStatus(db, report.comment_id, "hidden");
    const updated = updateCommentReportStatus(db, reportId, "resolved", req.user!.id);
    return res.json({ report: updated });
  }

  return res.status(400).json({ error: "Invalid action" });
});

app.get("/api/admin/users", requireAdmin, (req: AuthRequest, res) => {
  const query = typeof req.query.query === "string" ? req.query.query : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const users = listUsers(db, { query, status });
  return res.json({ users });
});

app.post("/api/admin/users/:id/ban", requireAdmin, (req: AuthRequest, res) => {
  const userId = Number(req.params.id);
  if (!Number.isFinite(userId)) return res.status(400).json({ error: "Invalid user id" });
  const { reason, until } = req.body || {};
  const bannedUntil = typeof until === "string" && until.trim() ? until.trim() : null;
  const banReason = typeof reason === "string" && reason.trim() ? reason.trim() : null;
  const updated = updateUserBan(db, userId, {
    status: "banned",
    banReason,
    bannedUntil,
  });
  if (!updated) return res.status(404).json({ error: "User not found" });
  return res.json({ user: updated });
});

app.post("/api/admin/users/:id/unban", requireAdmin, (req: AuthRequest, res) => {
  const userId = Number(req.params.id);
  if (!Number.isFinite(userId)) return res.status(400).json({ error: "Invalid user id" });
  const updated = updateUserBan(db, userId, {
    status: "active",
    banReason: null,
    bannedUntil: null,
  });
  if (!updated) return res.status(404).json({ error: "User not found" });
  return res.json({ user: updated });
});

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
