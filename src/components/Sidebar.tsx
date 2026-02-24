import { Link, NavLink } from "react-router-dom";
import { BookOpen, Code2, Database, Globe, Cpu, Layout as LayoutIcon, Layers, Shield, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { name: "Languages", icon: Code2, path: "/category/languages", topics: ["Python", "Java", "Rust", "Go", "JavaScript", "TypeScript"] },
  { name: "Frontend", icon: LayoutIcon, path: "/category/frontend", topics: ["React", "Next.js", "Angular", "Vue.js"] },
  { name: "Backend", icon: Terminal, path: "/category/backend", topics: ["Node.js", "Express", "Spring Boot", "Django"] },
  { name: "DSA", icon: Layers, path: "/category/dsa", topics: ["Arrays", "Linked Lists", "Trees", "Graphs", "Dynamic Programming"] },
  { name: "System Design", icon: Database, path: "/category/system-design", topics: ["Consistent Hashing", "CAP Theorem", "Microservices", "Load Balancing"] },
  { name: "DevOps", icon: Cpu, path: "/category/devops", topics: ["Docker", "Kubernetes", "CI/CD", "Terraform"] },
  { name: "Blockchain", icon: Globe, path: "/category/blockchain", topics: ["Smart Contracts", "Ethereum", "Consensus Mechanisms"] },
  { name: "Cryptography", icon: Shield, path: "/category/cryptography", topics: ["RSA", "AES", "Hash Functions"] },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-zinc-100 border-r border-zinc-200 h-screen overflow-y-auto sticky top-0 hidden md:block">
      <div className="p-4">
        <Link to="/" className="flex items-center gap-2 font-serif text-xl font-bold text-zinc-900 mb-6">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          TechWiki
        </Link>
        <nav className="space-y-6">
          {CATEGORIES.map((cat) => (
            <div key={cat.name}>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                <cat.icon className="w-4 h-4" />
                {cat.name}
              </h3>
              <ul className="space-y-1">
                {cat.topics.map((topic) => {
                  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  const catSlug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  return (
                    <li key={topic}>
                      <NavLink
                        to={`/wiki/${catSlug}/${slug}`}
                        className={({ isActive }) =>
                          cn(
                            "block px-2 py-1.5 text-sm rounded-md transition-colors",
                            isActive
                              ? "bg-indigo-100 text-indigo-700 font-medium"
                              : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                          )
                        }
                      >
                        {topic}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
