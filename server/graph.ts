import type Database from "better-sqlite3";
import { titleFromSlug } from "./utils/slugify";

export type GraphNode = {
  id: string;
  label: string;
  type: "category" | "topic";
  category?: string;
  slug?: string;
  articleId?: number;
};

export type GraphEdge = {
  from: string;
  to: string;
  type: "category" | "cross";
};

type GraphOptions = {
  mode?: "basic" | "linked";
  maxCrossEdges?: number;
  limit?: number;
  cacheMs?: number;
};

type GraphPayload = { nodes: GraphNode[]; edges: GraphEdge[] };

const DEFAULT_MAX_CROSS = 1500;
const DEFAULT_CACHE_MS = 5 * 60 * 1000;

let cached: { key: string; expiresAt: number; payload: GraphPayload } | null = null;

function buildCacheKey(options: GraphOptions) {
  return JSON.stringify({
    mode: options.mode || "linked",
    maxCrossEdges: options.maxCrossEdges ?? DEFAULT_MAX_CROSS,
    limit: options.limit ?? null,
  });
}

function parseInternalLinks(markdown: string) {
  const results: Array<{ category: string; slug: string }> = [];
  const regex = /\[[^\]]*\]\(\/wiki\/([^/]+)\/([^)#?\s]+)[^)]*\)/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    const category = decodeURIComponent(match[1]).toLowerCase();
    const slug = decodeURIComponent(match[2]).toLowerCase();
    if (category && slug) {
      results.push({ category, slug });
    }
  }
  return results;
}

export function buildGraph(db: Database, options: GraphOptions = {}): GraphPayload {
  const mode = options.mode || "linked";
  const maxCrossEdges = options.maxCrossEdges ?? DEFAULT_MAX_CROSS;
  const limit = options.limit;
  const cacheMs = options.cacheMs ?? DEFAULT_CACHE_MS;
  const key = buildCacheKey({ mode, maxCrossEdges, limit });

  if (cached && cached.key === key && Date.now() < cached.expiresAt) {
    return cached.payload;
  }

  const includeCross = mode === "linked";
  const fields = includeCross ? "id, category, slug, topic, markdown" : "id, category, slug, topic";
  const sql = `SELECT ${fields}
    FROM articles
    WHERE COALESCE(status, 'published') != 'draft'
    ORDER BY views DESC, datetime(updated_at) DESC${limit ? " LIMIT ?" : ""}`;
  const stmt = db.prepare(sql);
  const rows = limit ? stmt.all(limit) : stmt.all();

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const categoryMap = new Map<string, GraphNode>();
  const topicMap = new Map<string, GraphNode>();
  const edgeSet = new Set<string>();

  rows.forEach((row: { id: number; category: string; slug: string; topic: string }) => {
    const category = row.category.toLowerCase();
    let categoryNode = categoryMap.get(category);
    if (!categoryNode) {
      categoryNode = {
        id: `cat:${category}`,
        label: titleFromSlug(category),
        type: "category",
        slug: category,
      };
      categoryMap.set(category, categoryNode);
      nodes.push(categoryNode);
    }

    const topicKey = `${category}:${row.slug.toLowerCase()}`;
    let topicNode = topicMap.get(topicKey);
    if (!topicNode) {
      topicNode = {
        id: `topic:${category}:${row.slug.toLowerCase()}`,
        label: row.topic,
        type: "topic",
        category,
        slug: row.slug.toLowerCase(),
        articleId: row.id,
      };
      topicMap.set(topicKey, topicNode);
      nodes.push(topicNode);
    }

    const edgeKey = `${categoryNode.id}->${topicNode.id}`;
    if (!edgeSet.has(edgeKey)) {
      edges.push({ from: categoryNode.id, to: topicNode.id, type: "category" });
      edgeSet.add(edgeKey);
    }
  });

  if (includeCross) {
    const crossSet = new Set<string>();
    let crossCount = 0;
    for (const row of rows as Array<{
      id: number;
      category: string;
      slug: string;
      markdown: string;
    }>) {
      if (crossCount >= maxCrossEdges) break;
      const sourceKey = `${row.category.toLowerCase()}:${row.slug.toLowerCase()}`;
      const sourceNode = topicMap.get(sourceKey);
      if (!sourceNode) continue;
      const links = parseInternalLinks(row.markdown || "");
      for (const link of links) {
        if (crossCount >= maxCrossEdges) break;
        const targetNode = topicMap.get(`${link.category}:${link.slug}`);
        if (!targetNode || targetNode.id === sourceNode.id) continue;
        const edgeKey = `${sourceNode.id}->${targetNode.id}`;
        if (crossSet.has(edgeKey)) continue;
        edges.push({ from: sourceNode.id, to: targetNode.id, type: "cross" });
        crossSet.add(edgeKey);
        crossCount += 1;
      }
    }
  }

  const payload = { nodes, edges };
  cached = { key, expiresAt: Date.now() + cacheMs, payload };
  return payload;
}
