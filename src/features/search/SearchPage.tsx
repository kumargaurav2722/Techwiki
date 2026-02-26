import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, BookOpen } from "lucide-react";
import { searchArticles, type SearchResult } from "@/shared/services/wikiApi";
import { CATEGORIES } from "@/shared/data/categories";
import { slugify, titleFromSlug } from "@/shared/lib/slug";

export function SearchPage() {
  const [params] = useSearchParams();
  const query = (params.get("q") || "").trim();

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    const matches: Array<{ category: string; slug: string; topic: string; desc: string }> = [];

    for (const category of CATEGORIES) {
      for (const topic of category.topics) {
        if (topic.name.toLowerCase().includes(q)) {
          matches.push({
            category: category.path,
            slug: slugify(topic.name),
            topic: topic.name,
            desc: topic.desc,
          });
        }
      }
    }

    return matches.slice(0, 8);
  }, [query]);

  useEffect(() => {
    let active = true;
    if (!query) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    searchArticles(query)
      .then((data) => {
        if (active) setResults(data);
      })
      .catch(() => {
        if (active) setError("Search failed. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [query]);

  const generatedSlug = slugify(query || "topic");

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Search className="w-4 h-4" />
          <span>Search results</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-zinc-900">
          {query ? `Results for "${query}"` : "Search TechWiki"}
        </h1>
        <p className="text-zinc-600">
          Explore cached articles or generate a new deep-dive article instantly.
        </p>
      </header>

      {!query ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CATEGORIES.map((category) => (
              <Link
                key={category.path}
                to={`/category/${category.path}`}
                className="group block p-5 bg-white border border-zinc-200 rounded-xl hover:border-indigo-500 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                    <category.icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                    {category.name}
                  </h3>
                </div>
                <p className="text-sm text-zinc-600">{category.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : loading ? (
        <div className="text-zinc-500">Searching...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="space-y-6">
          {results.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {results.map((result) => (
                <Link
                  key={`${result.category}-${result.slug}`}
                  to={`/wiki/${result.category}/${result.slug}`}
                  className="group block p-5 bg-white border border-zinc-200 rounded-xl hover:border-indigo-500 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                        {result.topic}
                      </h3>
                      <p className="text-xs uppercase tracking-wide text-zinc-400 mt-1">
                        {titleFromSlug(result.category)}
                      </p>
                    </div>
                    <span className="text-xs text-zinc-500">Open</span>
                  </div>
                  {result.snippet ? (
                    <p
                      className="text-sm text-zinc-600 mt-2 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: result.snippet }}
                    />
                  ) : null}
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-zinc-600">
              No cached articles found for this query.
            </div>
          )}

          {suggestions.length > 0 ? (
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 mb-3">Suggested Topics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.map((item) => (
                  <Link
                    key={`${item.category}-${item.slug}`}
                    to={`/wiki/${item.category}/${item.slug}`}
                    className="group block p-4 bg-zinc-50 border border-zinc-200 rounded-xl hover:border-indigo-500 hover:bg-white transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                        {item.topic}
                      </span>
                      <span className="text-xs uppercase tracking-wide text-zinc-400">{titleFromSlug(item.category)}</span>
                    </div>
                    <p className="text-sm text-zinc-600 mt-1">{item.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {query ? (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 flex items-start gap-4">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-indigo-900">Generate a new article</h3>
                <p className="text-sm text-indigo-700 mt-1">
                  Create a deep, interview-ready article for this topic even if it doesn’t exist yet.
                </p>
                <Link
                  to={`/wiki/general/${generatedSlug}`}
                  className="inline-flex items-center mt-3 text-sm font-semibold text-indigo-700 hover:underline"
                >
                  Generate “{query}”
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
