import { useParams, Link } from "react-router-dom";
import { BookOpen, Code2, Database, Globe, Cpu, Layout as LayoutIcon, Layers, Shield, Terminal } from "lucide-react";

const CATEGORIES = [
  { name: "Languages", icon: Code2, path: "languages", topics: ["Python", "Java", "Rust", "Go", "JavaScript", "TypeScript"], desc: "Explore programming languages, their syntax, and use cases." },
  { name: "Frontend", icon: LayoutIcon, path: "frontend", topics: ["React", "Next.js", "Angular", "Vue.js"], desc: "Learn about building user interfaces and web applications." },
  { name: "Backend", icon: Terminal, path: "backend", topics: ["Node.js", "Express", "Spring Boot", "Django"], desc: "Server-side programming, APIs, and database interactions." },
  { name: "DSA", icon: Layers, path: "dsa", topics: ["Arrays", "Linked Lists", "Trees", "Graphs", "Dynamic Programming"], desc: "Data Structures and Algorithms for efficient problem solving." },
  { name: "System Design", icon: Database, path: "system-design", topics: ["Consistent Hashing", "CAP Theorem", "Microservices", "Load Balancing"], desc: "Architecting scalable and reliable software systems." },
  { name: "DevOps", icon: Cpu, path: "devops", topics: ["Docker", "Kubernetes", "CI/CD", "Terraform"], desc: "Practices and tools for software delivery and infrastructure." },
  { name: "Blockchain", icon: Globe, path: "blockchain", topics: ["Smart Contracts", "Ethereum", "Consensus Mechanisms"], desc: "Decentralized technologies and cryptographic ledgers." },
  { name: "Cryptography", icon: Shield, path: "cryptography", topics: ["RSA", "AES", "Hash Functions"], desc: "Secure communication and data protection techniques." },
];

export function Category() {
  const { category } = useParams<{ category: string }>();
  
  const catData = CATEGORIES.find(c => c.path === category);

  if (!catData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-zinc-900">Category not found</h2>
        <p className="text-zinc-600 mt-2">The category you are looking for does not exist.</p>
        <Link to="/" className="text-indigo-600 hover:underline mt-4 inline-block">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-8 pb-8 border-b border-zinc-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <catData.icon className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-zinc-900 tracking-tight">
            {catData.name}
          </h1>
        </div>
        <p className="text-lg text-zinc-600">
          {catData.desc}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {catData.topics.map((topic) => {
          const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          return (
            <Link
              key={topic}
              to={`/wiki/${catData.path}/${slug}`}
              className="group flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-xl hover:border-indigo-500 hover:shadow-sm transition-all"
            >
              <span className="font-medium text-zinc-900 group-hover:text-indigo-600 transition-colors">
                {topic}
              </span>
              <BookOpen className="w-4 h-4 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
