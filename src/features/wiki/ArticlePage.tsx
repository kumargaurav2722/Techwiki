import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { fetchArticle } from "@/shared/services/wikiApi";
import { titleFromSlug } from "@/shared/lib/slug";
import { Loader2, AlertCircle, Clock, Tag, Bookmark } from "lucide-react";
import { useAuth } from "@/shared/context/AuthContext";
import {
  addBookmark,
  addReadingListItem,
  listReadingLists,
  type ReadingList,
} from "@/shared/services/libraryApi";

export function ArticlePage() {
  const { category, topic } = useParams<{ category: string; topic: string }>();
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [references, setReferences] = useState<Array<{ title: string; url: string }> | null>(null);
  const [lists, setLists] = useState<ReadingList[]>([]);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const { user } = useAuth();

  const displayTopic = topic ? titleFromSlug(topic) : "Unknown Topic";
  const displayCategory = category ? titleFromSlug(category) : "General";

  useEffect(() => {
    if (!category || !topic) return;

    let isMounted = true;

    const fetchContent = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchArticle(category, topic, {
          topic: displayTopic,
        });
        if (isMounted) {
          setContent(response.article.markdown);
          setUpdatedAt(response.article.updated_at);
          setSource(response.source);
          setReferences(response.article.references || null);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "An error occurred");
          setLoading(false);
        }
      }
    };

    fetchContent();

    return () => {
      isMounted = false;
    };
  }, [category, topic, displayCategory, displayTopic]);

  useEffect(() => {
    if (!user) {
      setLists([]);
      setSelectedListId(null);
      return;
    }
    listReadingLists()
      .then((data) => setLists(data || []))
      .catch(() => setLists([]));
  }, [user]);

  const handleRefresh = async () => {
    if (!category || !topic) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetchArticle(category, topic, {
        topic: displayTopic,
        refresh: true,
      });
      setContent(response.article.markdown);
      setUpdatedAt(response.article.updated_at);
      setSource(response.source);
      setReferences(response.article.references || null);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!user || !category || !topic) return;
    try {
      await addBookmark({ category, slug: topic, topic: displayTopic });
      setSaveMessage("Bookmarked.");
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Failed to bookmark");
    }
  };

  const handleAddToList = async () => {
    if (!user || !category || !topic || !selectedListId) return;
    try {
      await addReadingListItem(selectedListId, {
        category,
        slug: topic,
        topic: displayTopic,
      });
      setSaveMessage("Added to reading list.");
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Failed to add to list");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-lg font-medium animate-pulse">Generating comprehensive article for "{displayTopic}"...</p>
        <p className="text-sm">This may take a few seconds as we compile history, concepts, and code examples.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4 text-red-800">
        <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-lg mb-1">Failed to load article</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <article className="animate-in fade-in duration-500">
      <header className="mb-8 pb-8 border-b border-zinc-200">
        <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4">
          <span className="flex items-center gap-1.5 bg-zinc-100 px-2.5 py-1 rounded-md">
            <Tag className="w-4 h-4" />
            {displayCategory}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {updatedAt ? `Updated ${new Date(updatedAt).toLocaleString()}` : "Loading metadata..."}
          </span>
          {source ? (
            <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">
              {source === "cache" ? "Cached" : "Generated"}
            </span>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={handleBookmark}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-indigo-700"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  Bookmark
                </button>
                {lists.length > 0 ? (
                  <>
                    <select
                      value={selectedListId || ""}
                      onChange={(e) => setSelectedListId(Number(e.target.value) || null)}
                      className="text-xs border border-zinc-300 rounded-md px-2 py-1"
                    >
                      <option value="">Add to list...</option>
                      {lists.map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddToList}
                      disabled={!selectedListId}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:text-zinc-400"
                    >
                      Add
                    </button>
                  </>
                ) : null}
              </>
            ) : (
              <span className="text-xs text-zinc-400">Sign in to save</span>
            )}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:text-zinc-400"
            >
              Regenerate
            </button>
          </div>
        </div>
        {saveMessage ? (
          <div className="text-xs text-zinc-500 mb-2">{saveMessage}</div>
        ) : null}
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-zinc-900 tracking-tight mb-4">
          {displayTopic}
        </h1>
        <p className="text-lg text-zinc-600 italic">
          From TechWiki, the free AI-generated tech encyclopedia.
        </p>
      </header>

      <div className="prose prose-zinc prose-lg max-w-none prose-headings:font-serif prose-headings:font-bold prose-a:text-indigo-600 hover:prose-a:text-indigo-800 prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-zinc-800 prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            a: ({ node, ...props }) => {
              // Intercept internal links if they look like Wikipedia links
              const href = props.href || "";
              if (href.startsWith("/wiki/")) {
                return <Link to={href} {...props} />;
              }
              return <a target="_blank" rel="noopener noreferrer" {...props} />;
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {references && references.length > 0 && !/^#{1,3}\\s+References/mi.test(content) ? (
        <section className="mt-10 border-t border-zinc-200 pt-6">
          <h2 className="text-xl font-serif font-bold text-zinc-900 mb-3">References</h2>
          <ul className="space-y-2 text-sm text-zinc-700">
            {references.map((ref) => (
              <li key={ref.url}>
                <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  {ref.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      
      <footer className="mt-16 pt-8 border-t border-zinc-200 text-sm text-zinc-500 text-center">
        <p>This article was generated by AI and cached in the TechWiki database for faster retrieval.</p>
      </footer>
    </article>
  );
}
