import { useParams, Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { CATEGORIES } from "@/shared/data/categories";

export function CategoryPage() {
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

  const relatedCategories = CATEGORIES.filter(c => c.path !== category).sort(() => 0.5 - Math.random()).slice(0, 3);

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

      <div className="mb-12">
        <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-6">Topics in {catData.name}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {catData.topics.map((topic) => {
            const slug = topic.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            return (
              <Link
                key={topic.name}
                to={`/wiki/${catData.path}/${slug}`}
                className="group flex flex-col p-5 bg-white border border-zinc-200 rounded-xl hover:border-indigo-500 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                    {topic.name}
                  </span>
                  <BookOpen className="w-4 h-4 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  {topic.desc}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="pt-8 border-t border-zinc-200">
        <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-6">Related Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {relatedCategories.map((relatedCat) => (
            <Link
              key={relatedCat.path}
              to={`/category/${relatedCat.path}`}
              className="group block p-5 bg-zinc-50 border border-zinc-200 rounded-xl hover:border-indigo-500 hover:bg-white transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <relatedCat.icon className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                  {relatedCat.name}
                </h3>
              </div>
              <p className="text-sm text-zinc-600 line-clamp-2">
                {relatedCat.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
