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
import {
  createComment,
  createNote,
  listComments,
  listNotes,
  reportComment,
  type Comment,
  type Note,
} from "@/shared/services/collabApi";

export function ArticlePage() {
  const { category, topic } = useParams<{ category: string; topic: string }>();
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [references, setReferences] = useState<Array<{ title: string; url: string }> | null>(null);
  const [views, setViews] = useState<number | null>(null);
  const [articleId, setArticleId] = useState<number | null>(null);
  const [lists, setLists] = useState<ReadingList[]>([]);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [noteText, setNoteText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [collabError, setCollabError] = useState<string | null>(null);
  const [reportingCommentId, setReportingCommentId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const { user } = useAuth();

  const displayTopic = topic ? titleFromSlug(topic) : "Unknown Topic";
  const displayCategory = category ? titleFromSlug(category) : "General";

  useEffect(() => {
    if (!category || !topic) return;

    let isMounted = true;

    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      setArticleId(null);

      try {
        const response = await fetchArticle(category, topic, {
          topic: displayTopic,
        });
        if (isMounted) {
          setContent(response.article.markdown);
          setUpdatedAt(response.article.updated_at);
          setSource(response.source);
          setReferences(response.article.references || null);
          setViews(response.article.views ?? null);
          setArticleId(response.article.id);
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

  useEffect(() => {
    if (!user || !articleId) {
      setNotes([]);
      setComments([]);
      setCollabError(null);
      return;
    }
    let isMounted = true;
    const loadCollab = async () => {
      try {
        const [notesData, commentsData] = await Promise.all([
          listNotes(articleId),
          listComments(articleId),
        ]);
        if (isMounted) {
          setNotes(notesData || []);
          setComments(commentsData || []);
        }
      } catch (err) {
        if (isMounted) {
          setCollabError(err instanceof Error ? err.message : "Failed to load notes or comments");
        }
      }
    };
    loadCollab();
    return () => {
      isMounted = false;
    };
  }, [user, articleId]);

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
      setViews(response.article.views ?? null);
      setArticleId(response.article.id);
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

  const handleSaveNote = async () => {
    if (!user || !articleId || !noteText.trim()) return;
    try {
      const note = await createNote(articleId, noteText.trim());
      setNotes((prev) => [note, ...prev]);
      setNoteText("");
      setCollabError(null);
    } catch (err) {
      setCollabError(err instanceof Error ? err.message : "Failed to save note");
    }
  };

  const handlePostComment = async () => {
    if (!user || !articleId || !commentText.trim()) return;
    try {
      const result = await createComment(articleId, commentText.trim());
      if (result.comment && !result.moderated && result.comment.status !== "hidden") {
        setComments((prev) => [result.comment, ...prev]);
        setReportMessage(null);
      } else {
        setReportMessage("Comment submitted for review.");
      }
      setCommentText("");
      setCollabError(null);
    } catch (err) {
      setCollabError(err instanceof Error ? err.message : "Failed to post comment");
    }
  };

  const handleReportComment = async (commentId: number) => {
    if (!user) return;
    try {
      await reportComment(commentId, reportReason.trim() || undefined);
      setReportMessage("Report submitted. Thanks for helping keep TechWiki clean.");
      setReportingCommentId(null);
      setReportReason("");
    } catch (err) {
      setCollabError(err instanceof Error ? err.message : "Failed to submit report");
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
          {views !== null ? (
            <span className="flex items-center gap-1.5 bg-zinc-100 px-2.5 py-1 rounded-md">
              {views} views
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

      <section className="mt-10 border-t border-zinc-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-bold text-zinc-900">Notes and Discussion</h2>
          {collabError ? <span className="text-xs text-red-600">{collabError}</span> : null}
        </div>
        {reportMessage ? (
          <div className="mb-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
            {reportMessage}
          </div>
        ) : null}
        {!user ? (
          <div className="text-sm text-zinc-500">
            <Link to="/login" className="text-indigo-600 hover:underline">
              Sign in
            </Link>{" "}
            to create notes and join the discussion.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
              <h3 className="text-lg font-semibold text-zinc-900">Personal Notes</h3>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                placeholder="Capture key ideas or reminders..."
              />
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save Note
              </button>
              {notes.length === 0 ? (
                <div className="text-xs text-zinc-500">No notes yet.</div>
              ) : (
                <div className="space-y-2">
                  {notes.map((note) => (
                    <div key={note.id} className="border border-zinc-200 rounded-lg p-3">
                      <div className="text-sm text-zinc-700 whitespace-pre-wrap">{note.content}</div>
                      <div className="text-xs text-zinc-400 mt-2">
                        Updated {new Date(note.updated_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
              <h3 className="text-lg font-semibold text-zinc-900">Discussion</h3>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                placeholder="Share clarifications or interview tips..."
              />
              <button
                onClick={handlePostComment}
                className="px-4 py-2 text-sm font-semibold bg-zinc-900 text-white rounded-md hover:bg-zinc-800"
              >
                Post Comment
              </button>
              {comments.length === 0 ? (
                <div className="text-xs text-zinc-500">No comments yet.</div>
              ) : (
                <div className="space-y-2">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border border-zinc-200 rounded-lg p-3">
                      <div className="text-sm text-zinc-700 whitespace-pre-wrap">{comment.content}</div>
                      <div className="text-xs text-zinc-400 mt-2">
                        User #{comment.user_id} on {new Date(comment.created_at).toLocaleString()}
                      </div>
                      <div className="mt-2">
                        {reportingCommentId === comment.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={reportReason}
                              onChange={(e) => setReportReason(e.target.value)}
                              rows={2}
                              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-xs"
                              placeholder="Optional: why are you reporting this comment?"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleReportComment(comment.id)}
                                className="px-3 py-1 text-xs font-semibold bg-red-600 text-white rounded-md hover:bg-red-700"
                              >
                                Submit Report
                              </button>
                              <button
                                onClick={() => {
                                  setReportingCommentId(null);
                                  setReportReason("");
                                }}
                                className="px-3 py-1 text-xs font-semibold bg-zinc-100 text-zinc-700 rounded-md hover:bg-zinc-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setReportingCommentId(comment.id);
                              setReportReason("");
                              setReportMessage(null);
                            }}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Report
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <footer className="mt-16 pt-8 border-t border-zinc-200 text-sm text-zinc-500 text-center">
        <p>This article was generated by AI and cached in the TechWiki database for faster retrieval.</p>
      </footer>
    </article>
  );
}
