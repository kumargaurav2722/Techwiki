import fs from "fs";
import path from "path";
import type Database from "better-sqlite3";
import { generateArticleMarkdown } from "../ai/generate";
import { getArticle, upsertArticle } from "../articles";
import { slugify } from "../utils/slugify";
import { parseReferencesFromMarkdown } from "../utils/references";

export type IngestStatus = {
  state: "running" | "completed" | "failed";
  processed: number;
  total: number;
  startedAt: string;
  finishedAt?: string;
  error?: string;
  errorCount?: number;
};

type TopicLibrary = {
  categories: Array<{
    name: string;
    path: string;
    topics: Array<{ name: string; desc?: string }>;
  }>;
};

type IngestOptions = {
  limit?: number;
  category?: string;
  onProgress?: (status: IngestStatus) => void;
};

function loadLibrary(): TopicLibrary {
  const filePath = path.resolve(process.cwd(), "server", "data", "topic-library.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as TopicLibrary;
}

export async function ingestLibrary(db: Database, options: IngestOptions = {}) {
  const library = loadLibrary();
  const items: Array<{ category: string; topic: string }> = [];

  for (const category of library.categories) {
    if (options.category && category.path !== options.category) continue;
    for (const topic of category.topics) {
      items.push({ category: category.path, topic: topic.name });
    }
  }

  const total = options.limit ? Math.min(options.limit, items.length) : items.length;
  const startedAt = new Date().toISOString();
  let processed = 0;
  let errorCount = 0;

  for (const item of items) {
    if (options.limit && processed >= options.limit) break;

    const slug = slugify(item.topic);
    const existing = getArticle(db, item.category, slug);
    if (!existing) {
      try {
        const markdown = await generateArticleMarkdown({
          category: item.category,
          topic: item.topic,
        });
        if (markdown.trim()) {
          const references = parseReferencesFromMarkdown(markdown);
          upsertArticle(db, {
            category: item.category,
            topic: item.topic,
            slug,
            markdown,
            references: references.length ? references : undefined,
          });
        }
      } catch (error) {
        errorCount += 1;
        console.error("Ingest failed for", item.category, item.topic, error);
      }
    }

    processed += 1;
    options.onProgress?.({
      state: "running",
      processed,
      total,
      startedAt,
      errorCount,
    });
  }

  const finishedAt = new Date().toISOString();
  return {
    state: "completed",
    processed,
    total,
    startedAt,
    finishedAt,
    errorCount,
  } satisfies IngestStatus;
}
