import express from "express";
import dotenv from "dotenv";
import { initDb } from "./db";
import { generateArticleMarkdown } from "./ai/generate";
import { getArticle, upsertArticle, searchArticles } from "./articles";
import { slugify, titleFromSlug } from "./utils/slugify";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const db = initDb();

app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/article/:category/:slug", async (req, res) => {
  const { category, slug } = req.params;
  const refresh = req.query.refresh === "true" || req.query.refresh === "1";

  try {
    const existing = getArticle(db, category, slug);
    if (existing && !refresh) {
      return res.json({ article: existing, source: "cache" });
    }

    const topic = typeof req.query.topic === "string" ? req.query.topic : titleFromSlug(slug);
    const markdown = await generateArticleMarkdown({ category, topic });

    if (!markdown.trim()) {
      return res.status(500).json({ error: "AI returned empty content." });
    }

    const saved = upsertArticle(db, {
      category,
      topic,
      slug,
      markdown,
    });

    return res.json({ article: saved, source: existing ? "refreshed" : "generated" });
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
      return res.json({ article: existing, source: "cache" });
    }

    const markdown = await generateArticleMarkdown({
      category: String(category),
      topic: String(topic),
    });

    if (!markdown.trim()) {
      return res.status(500).json({ error: "AI returned empty content." });
    }

    const saved = upsertArticle(db, {
      category: String(category),
      topic: String(topic),
      slug: finalSlug,
      markdown,
    });

    return res.json({ article: saved, source: existing ? "refreshed" : "generated" });
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

app.listen(port, () => {
  console.log(`TechWiki API listening on :${port}`);
});
