import { useMemo, useState } from "react";
import { CODING_PROMPTS, QUIZZES, SYSTEM_DESIGN_PROMPTS } from "@/shared/data/practice";
import { BookOpen, Code2, Brain } from "lucide-react";

function runJavaScript(code: string, timeoutMs = 1500): Promise<{ logs: string[]; error?: string }> {
  return new Promise((resolve) => {
    const workerCode = `
      self.onmessage = (e) => {
        const code = e.data.code;
        const logs = [];
        const console = { log: (...args) => logs.push(args.join(' ')) };
        try {
          const fn = new Function('console', code);
          fn(console);
          self.postMessage({ logs });
        } catch (err) {
          self.postMessage({ logs, error: err && err.message ? err.message : String(err) });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    const worker = new Worker(URL.createObjectURL(blob));

    const timer = window.setTimeout(() => {
      worker.terminate();
      resolve({ logs: [], error: "Execution timed out" });
    }, timeoutMs);

    worker.onmessage = (event) => {
      window.clearTimeout(timer);
      worker.terminate();
      resolve(event.data as { logs: string[]; error?: string });
    };

    worker.postMessage({ code });
  });
}

export function PracticePage() {
  const [tab, setTab] = useState<"quiz" | "system" | "code">("quiz");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [code, setCode] = useState(CODING_PROMPTS[0]?.starter || "");
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const score = useMemo(() => {
    let total = 0;
    let correct = 0;
    QUIZZES.forEach((q) => {
      if (quizAnswers[q.id] !== undefined) {
        total += 1;
        if (quizAnswers[q.id] === q.answerIndex) correct += 1;
      }
    });
    return { total, correct };
  }, [quizAnswers]);

  const handleRun = async () => {
    setError(null);
    const result = await runJavaScript(code);
    setOutput(result.logs || []);
    if (result.error) setError(result.error);
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-serif font-bold text-zinc-900">Practice Lab</h1>
        <p className="text-zinc-600">Quizzes, system design prompts, and a lightweight JS code runner.</p>
      </header>

      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded-md text-sm font-semibold ${
            tab === "quiz" ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-700"
          }`}
          onClick={() => setTab("quiz")}
        >
          <BookOpen className="w-4 h-4 inline-block mr-2" />
          Quizzes
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-semibold ${
            tab === "system" ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-700"
          }`}
          onClick={() => setTab("system")}
        >
          <Brain className="w-4 h-4 inline-block mr-2" />
          System Design
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-semibold ${
            tab === "code" ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-700"
          }`}
          onClick={() => setTab("code")}
        >
          <Code2 className="w-4 h-4 inline-block mr-2" />
          Code Runner
        </button>
      </div>

      {tab === "quiz" ? (
        <div className="space-y-6">
          <div className="text-sm text-zinc-500">
            Score: {score.correct} / {score.total}
          </div>
          {QUIZZES.map((quiz) => (
            <div key={quiz.id} className="bg-white border border-zinc-200 rounded-xl p-5 space-y-3">
              <div className="font-semibold text-zinc-900">{quiz.question}</div>
              <div className="space-y-2">
                {quiz.options.map((option, index) => (
                  <label key={option} className="flex items-center gap-2 text-sm text-zinc-700">
                    <input
                      type="radio"
                      name={quiz.id}
                      checked={quizAnswers[quiz.id] === index}
                      onChange={() => setQuizAnswers((prev) => ({ ...prev, [quiz.id]: index }))}
                    />
                    {option}
                  </label>
                ))}
              </div>
              {quizAnswers[quiz.id] !== undefined ? (
                <div className="text-xs text-zinc-500">{quiz.explanation}</div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {tab === "system" ? (
        <div className="space-y-6">
          {SYSTEM_DESIGN_PROMPTS.map((prompt) => (
            <div key={prompt.id} className="bg-white border border-zinc-200 rounded-xl p-6 space-y-3">
              <h2 className="text-lg font-semibold text-zinc-900">{prompt.title}</h2>
              <p className="text-sm text-zinc-700">{prompt.prompt}</p>
              <div className="text-sm text-zinc-500">Follow-ups:</div>
              <ul className="list-disc pl-4 text-sm text-zinc-700 space-y-1">
                {prompt.followUps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "code" ? (
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
            <div className="text-sm font-semibold text-zinc-900">Select prompt</div>
            <select
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              onChange={(e) => setCode(CODING_PROMPTS.find((p) => p.id === e.target.value)?.starter || "")}
            >
              {CODING_PROMPTS.map((prompt) => (
                <option key={prompt.id} value={prompt.id}>
                  {prompt.title}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-2">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full min-h-[240px] rounded-md border border-zinc-300 p-3 font-mono text-sm"
            />
            <button
              onClick={handleRun}
              className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Run JavaScript
            </button>
            {error ? <div className="text-xs text-red-600">{error}</div> : null}
            {output.length > 0 ? (
              <div className="bg-zinc-900 text-zinc-100 rounded-md p-3 text-xs font-mono">
                {output.map((line, index) => (
                  <div key={`${line}-${index}`}>{line}</div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
