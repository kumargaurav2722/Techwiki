import { Link } from "react-router-dom";
import { BookOpen, Code2, Database, Layers, Cpu } from "lucide-react";

const FEATURED = [
  { title: "React Hooks", category: "frontend", slug: "react-hooks", icon: Code2, desc: "Learn about useState, useEffect, and custom hooks." },
  { title: "Consistent Hashing", category: "system-design", slug: "consistent-hashing", icon: Database, desc: "A core concept for distributed systems and load balancing." },
  { title: "Dijkstra's Algorithm", category: "dsa", slug: "dijkstras-algorithm", icon: Layers, desc: "Find the shortest path between nodes in a graph." },
  { title: "Docker Basics", category: "devops", slug: "docker-basics", icon: Cpu, desc: "Containerization and how to write your first Dockerfile." },
];

export function Home() {
  return (
    <div className="space-y-10">
      <div className="text-center space-y-4 py-12">
        <div className="flex justify-center mb-4">
          <BookOpen className="w-16 h-16 text-indigo-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-zinc-900 tracking-tight">
          Welcome to TechWiki
        </h1>
        <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
          The AI-powered encyclopedia for everything tech. From Data Structures and Algorithms to System Design, 15+ Programming Languages, and modern Frameworks.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-6 border-b border-zinc-200 pb-2">
          Featured Articles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURED.map((item) => (
            <Link
              key={item.slug}
              to={`/wiki/${item.category}/${item.slug}`}
              className="group block p-6 bg-white border border-zinc-200 rounded-xl hover:border-indigo-500 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                  {item.title}
                </h3>
              </div>
              <p className="text-zinc-600 text-sm leading-relaxed">
                {item.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-zinc-50 rounded-2xl p-8 border border-zinc-200 text-center">
        <h3 className="text-xl font-semibold text-zinc-900 mb-2">How it works</h3>
        <p className="text-zinc-600 max-w-xl mx-auto">
          TechWiki uses Google's Gemini AI to generate comprehensive, Wikipedia-style articles on-demand. 
          Search for any tech topic, and if it doesn't exist in our cache, we'll write it for you instantly.
        </p>
      </div>
    </div>
  );
}
