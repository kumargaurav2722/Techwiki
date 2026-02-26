import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { slugify } from "@/shared/lib/slug";
import { Compass } from "lucide-react";
import { fetchGraph, type GraphEdge, type GraphNode } from "@/shared/services/graphApi";

export function GraphPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const layout = useMemo(() => {
    const categoryNodes = nodes.filter((node) => node.type === "category");
    const topicNodes = nodes.filter((node) => node.type === "topic");

    const nodesWithPos = new Map<string, { x: number; y: number; node: GraphNode }>();
    const centerX = 500;
    const centerY = 350;
    const outerRadius = 260;
    const innerRadius = 130;

    if (categoryNodes.length === 0) return nodesWithPos;

    categoryNodes.forEach((node, index) => {
      const angle = (index / categoryNodes.length) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * outerRadius;
      const y = centerY + Math.sin(angle) * outerRadius;
      nodesWithPos.set(node.id, { x, y, node });

      const categorySlug = node.slug || node.id.replace("cat:", "");
      const topics = topicNodes.filter((topic) => topic.category === categorySlug);
      const spread = Math.PI / 3;
      topics.forEach((topic, tIndex) => {
        const tAngle = angle - spread / 2 + (spread * (tIndex + 1)) / (topics.length + 1);
        const tx = centerX + Math.cos(tAngle) * innerRadius;
        const ty = centerY + Math.sin(tAngle) * innerRadius;
        nodesWithPos.set(topic.id, { x: tx, y: ty, node: topic });
      });
    });

    return nodesWithPos;
  }, [nodes]);

  const visibleEdges = edges.filter((edge) => layout.has(edge.from) && layout.has(edge.to));

  useEffect(() => {
    let isMounted = true;
    const loadGraph = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchGraph({ mode: "linked" });
        if (!isMounted) return;
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load knowledge graph");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadGraph();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleNodeClick = (nodeId: string) => {
    const node = layout.get(nodeId)?.node;
    if (!node) return;
    setSelected(nodeId);
    if (node.type === "topic" && node.category) {
      const slug = node.slug || slugify(node.label);
      navigate(`/wiki/${node.category}/${slug}`);
    }
    if (node.type === "category") {
      const categorySlug = node.slug || node.label.toLowerCase().replace(/\s+/g, "-");
      navigate(`/category/${categorySlug}`);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Compass className="w-4 h-4" />
          <span>Knowledge Graph</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-zinc-900">
          Concept Map of TechWiki
        </h1>
        <p className="text-zinc-600 max-w-2xl">
          Explore relationships between topics across categories. Click any node to jump in.
        </p>
      </header>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      ) : null}
      {loading ? (
        <div className="text-sm text-zinc-500">Loading graph...</div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl p-4 overflow-auto">
          <svg viewBox="0 0 1000 700" className="w-full h-[560px]">
            {visibleEdges.map((edge, index) => {
              const from = layout.get(edge.from);
              const to = layout.get(edge.to);
              if (!from || !to) return null;
              return (
                <line
                  key={`${edge.from}-${edge.to}-${index}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={edge.type === "cross" ? "#a5b4fc" : "#e5e7eb"}
                  strokeWidth={edge.type === "cross" ? 2 : 1}
                />
              );
            })}
            {Array.from(layout.values()).map(({ node, x, y }) => (
              <g key={node.id} onClick={() => handleNodeClick(node.id)} className="cursor-pointer">
                <circle
                  cx={x}
                  cy={y}
                  r={node.type === "category" ? 24 : 12}
                  fill={node.type === "category" ? "#6366f1" : "#e0e7ff"}
                  stroke={selected === node.id ? "#111827" : "#c7d2fe"}
                  strokeWidth={selected === node.id ? 3 : 1}
                />
                <text
                  x={x}
                  y={y + (node.type === "category" ? 40 : -18)}
                  textAnchor="middle"
                  className={
                    node.type === "category"
                      ? "fill-zinc-900 text-[12px] font-semibold"
                      : "fill-zinc-600 text-[10px]"
                  }
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}
