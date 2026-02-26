import { Link } from "react-router-dom";
import { LEARNING_PATHS, INTERVIEW_TRACKS } from "@/shared/data/learningPaths";
import { slugify, titleFromSlug } from "@/shared/lib/slug";
import { BookOpen, GraduationCap } from "lucide-react";

export function LearningPathsPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <GraduationCap className="w-4 h-4" />
          <span>Learning Paths</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-zinc-900">
          Structured Paths for Deep Learning
        </h1>
        <p className="text-zinc-600 max-w-2xl">
          Follow curated sequences that build real-world depth for interviews and production work.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-serif font-bold text-zinc-900">Core Learning Paths</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {LEARNING_PATHS.map((path) => (
            <div key={path.id} className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-zinc-900">{path.name}</h3>
                <p className="text-sm text-zinc-600 mt-1">{path.description}</p>
              </div>
              <div className="space-y-2">
                {path.steps.map((step) => (
                  <Link
                    key={`${path.id}-${step.title}`}
                    to={`/wiki/${step.category}/${slugify(step.title)}`}
                    className="flex items-center justify-between text-sm text-zinc-700 hover:text-indigo-600"
                  >
                    <span>{step.title}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-400">
                      {titleFromSlug(step.category)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h2 className="text-2xl font-serif font-bold text-zinc-900">Interview Tracks</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {INTERVIEW_TRACKS.map((track) => (
            <div key={track.id} className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-zinc-900">{track.name}</h3>
                <p className="text-sm text-zinc-600 mt-1">{track.description}</p>
              </div>
              <div className="space-y-2">
                {track.steps.map((step) => (
                  <Link
                    key={`${track.id}-${step.title}`}
                    to={`/wiki/${step.category}/${slugify(step.title)}`}
                    className="flex items-center justify-between text-sm text-zinc-700 hover:text-indigo-600"
                  >
                    <span>{step.title}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-400">
                      {titleFromSlug(step.category)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
