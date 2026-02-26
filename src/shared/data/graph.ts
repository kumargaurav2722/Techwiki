import { CATEGORIES } from "@/shared/data/categories";
import { slugify } from "@/shared/lib/slug";

export type GraphNode = {
  id: string;
  label: string;
  type: "category" | "topic";
  category?: string;
};

export type GraphEdge = {
  from: string;
  to: string;
  type: "category" | "cross";
};

export const GRAPH_NODES: GraphNode[] = [];
export const GRAPH_EDGES: GraphEdge[] = [];

CATEGORIES.forEach((category) => {
  const catId = `cat:${category.path}`;
  GRAPH_NODES.push({ id: catId, label: category.name, type: "category" });

  category.topics.forEach((topic) => {
    const topicId = `topic:${category.path}:${slugify(topic.name)}`;
    GRAPH_NODES.push({ id: topicId, label: topic.name, type: "topic", category: category.path });
    GRAPH_EDGES.push({ from: catId, to: topicId, type: "category" });
  });
});

export const CROSS_LINKS: Array<{ from: string; to: string }> = [
  { from: "system-design:load-balancing", to: "networking:tcp-ip" },
  { from: "dsa:graphs", to: "system-design:consistent-hashing" },
  { from: "backend:rest-apis", to: "security:authentication" },
  { from: "dbms:transactions", to: "system-design:cap-theorem" },
  { from: "frontend:web-performance", to: "networking:cdn" },
  { from: "cryptography:rsa", to: "security:encryption" },
  { from: "devops:ci-cd", to: "system-design:observability" },
  { from: "languages:javascript", to: "frontend:react" }
];

function findTopicId(path: string, slug: string) {
  return `topic:${path}:${slug}`;
}

CROSS_LINKS.forEach((link) => {
  const [fromCat, fromSlug] = link.from.split(":");
  const [toCat, toSlug] = link.to.split(":");
  const fromId = findTopicId(fromCat, slugify(fromSlug));
  const toId = findTopicId(toCat, slugify(toSlug));
  GRAPH_EDGES.push({ from: fromId, to: toId, type: "cross" });
});
