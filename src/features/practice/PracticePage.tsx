import { useEffect, useMemo, useState } from "react";
import { CODING_PROMPTS, QUIZZES, SYSTEM_DESIGN_PROMPTS } from "@/shared/data/practice";
import { executeCode } from "@/shared/services/runnerApi";
import { BookOpen, Code2, Brain } from "lucide-react";

const LANGUAGE_LABELS: Record<string, string> = {
  javascript: "JavaScript",
  python: "Python",
  java: "Java",
};

function runJavaScript(code: string, timeoutMs = 1500): Promise<{ output: string; error?: string }> {
  return new Promise((resolve) => {
    const workerCode = `
      self.onmessage = (e) => {
        const code = e.data.code;
        const logs = [];
        const console = { log: (...args) => logs.push(args.join(' ')) };
        try {
          const fn = new Function('console', code);
          fn(console);
          self.postMessage({ output: logs.join('\\n') });
        } catch (err) {
          self.postMessage({ output: logs.join('\\n'), error: err && err.message ? err.message : String(err) });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    const worker = new Worker(URL.createObjectURL(blob));

    const timer = window.setTimeout(() => {
      worker.terminate();
      resolve({ output: "", error: "Execution timed out" });
    }, timeoutMs);

    worker.onmessage = (event) => {
      window.clearTimeout(timer);
      worker.terminate();
      resolve(event.data as { output: string; error?: string });
    };

    worker.postMessage({ code });
  });
}

export function PracticePage() {
  const [tab, setTab] = useState<"quiz" | "system" | "code">("quiz");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [promptId, setPromptId] = useState(CODING_PROMPTS[0]?.id || "");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const selectedPrompt = useMemo(
    () => CODING_PROMPTS.find((prompt) => prompt.id === promptId) || CODING_PROMPTS[0],
    [promptId]
  );

  const availableLanguages = useMemo(() => {
    if (!selectedPrompt) return ["javascript"];
    return Object.keys(selectedPrompt.starters || { javascript: "" });
  }, [selectedPrompt]);

  useEffect(() => {
    if (!selectedPrompt) return;
    const defaultLang = selectedPrompt.defaultLanguage || availableLanguages[0] || "javascript";
    if (!availableLanguages.includes(language)) {
      setLanguage(defaultLang);
    }
  }, [selectedPrompt, availableLanguages, language]);

  useEffect(() => {
    if (!selectedPrompt) return;
    const starter = selectedPrompt.starters?.[language] || "";
    setCode(starter);
    setOutput("");
    setError(null);
  }, [selectedPrompt, language]);

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
    if (!code.trim()) return;
    setError(null);
    setOutput("");
    setRunning(true);
    try {
      if (language === "javascript") {
        const result = await runJavaScript(code);
        setOutput(result.output || "");
        if (result.error) setError(result.error);
        return;
      }
      const result = await executeCode({ language, code, stdin });
      setOutput(result.output || result.stdout || result.stderr || "");
      if (result.error) setError(result.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Execution failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-serif font-bold text-zinc-900">Practice Lab</h1>
        <p className="text-zinc-600">Quizzes, system design prompts, and a multi-language code runner.</p>
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
              value={promptId}
              onChange={(e) => setPromptId(e.target.value)}
            >
              {CODING_PROMPTS.map((prompt) => (
                <option key={prompt.id} value={prompt.id}>
                  {prompt.title}
                </option>
              ))}
            </select>
            {selectedPrompt ? (
              <div className="text-sm text-zinc-600">{selectedPrompt.description}</div>
            ) : null}
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <div className="text-xs font-semibold text-zinc-700 mb-1">Language</div>
                <select
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {availableLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {LANGUAGE_LABELS[lang] || lang}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-zinc-700 mb-1">Standard Input (optional)</div>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Input passed to stdin"
                />
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full min-h-[240px] rounded-md border border-zinc-300 p-3 font-mono text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleRun}
                disabled={running}
                className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
              >
                {running ? "Running..." : `Run ${LANGUAGE_LABELS[language] || language}`}
              </button>
              <button
                onClick={() => {
                  const starter = selectedPrompt?.starters?.[language] || "";
                  setCode(starter);
                }}
                className="px-4 py-2 text-sm font-semibold bg-zinc-100 text-zinc-700 rounded-md hover:bg-zinc-200"
              >
                Reset to starter
              </button>
            </div>
            {error ? <div className="text-xs text-red-600">{error}</div> : null}
            {output ? (
              <div className="bg-zinc-900 text-zinc-100 rounded-md p-3 text-xs font-mono whitespace-pre-wrap">
                {output}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
