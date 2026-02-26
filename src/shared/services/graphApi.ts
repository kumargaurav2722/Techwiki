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

export type GraphResponse = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export async function fetchGraph(options?: {
  mode?: "basic" | "linked";
  maxCrossEdges?: number;
  limit?: number;
}): Promise<GraphResponse> {
  const params = new URLSearchParams();
  if (options?.mode) params.set("mode", options.mode);
  if (options?.maxCrossEdges) params.set("maxCrossEdges", String(options.maxCrossEdges));
  if (options?.limit) params.set("limit", String(options.limit));
  const url = `/api/graph${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to load knowledge graph");
  }
  return res.json();
}
