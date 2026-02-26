type RunnerStage = {
  stdout: string;
  stderr: string;
  output: string;
  code?: number;
  signal?: string;
};

export type RunnerResult = {
  language: string;
  output: string;
  stdout: string;
  stderr: string;
  compile?: RunnerStage;
  run?: RunnerStage;
  error?: string;
};

type RunnerRequest = {
  language: string;
  code: string;
  stdin?: string;
};

type RuntimeConfig = {
  language: string;
  fileName: string;
  version?: string;
};

const DEFAULT_VERSION = process.env.CODE_RUNNER_DEFAULT_VERSION || "latest";

const LANGUAGE_MAP: Record<string, RuntimeConfig> = {
  javascript: {
    language: "javascript",
    fileName: "main.js",
    version: process.env.CODE_RUNNER_JAVASCRIPT_VERSION || DEFAULT_VERSION,
  },
  python: {
    language: "python",
    fileName: "main.py",
    version: process.env.CODE_RUNNER_PYTHON_VERSION || DEFAULT_VERSION,
  },
  java: {
    language: "java",
    fileName: "Main.java",
    version: process.env.CODE_RUNNER_JAVA_VERSION || DEFAULT_VERSION,
  },
  cpp: {
    language: "cpp",
    fileName: "main.cpp",
    version: process.env.CODE_RUNNER_CPP_VERSION || DEFAULT_VERSION,
  },
};

const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  javascript: "javascript",
  node: "javascript",
  py: "python",
  python: "python",
  java: "java",
  "c++": "cpp",
  cpp: "cpp",
};

function normalizeLanguage(input: string) {
  const normalized = input.trim().toLowerCase();
  return LANGUAGE_ALIASES[normalized] || null;
}

function normalizeStage(stage: any): RunnerStage {
  return {
    stdout: stage?.stdout ? String(stage.stdout) : "",
    stderr: stage?.stderr ? String(stage.stderr) : "",
    output: stage?.output ? String(stage.output) : "",
    code: typeof stage?.code === "number" ? stage.code : undefined,
    signal: stage?.signal ? String(stage.signal) : undefined,
  };
}

async function executeWithPiston(input: RunnerRequest, runtime: RuntimeConfig): Promise<RunnerResult> {
  const endpoint = process.env.CODE_RUNNER_API || "https://emkc.org/api/v2/piston/execute";
  const compileTimeout = Number(process.env.CODE_RUNNER_COMPILE_TIMEOUT_MS || 10000);
  const runTimeout = Number(process.env.CODE_RUNNER_RUN_TIMEOUT_MS || 3000);

  const payload: Record<string, unknown> = {
    language: runtime.language,
    files: [{ name: runtime.fileName, content: input.code }],
    stdin: input.stdin || "",
    args: [],
    compile_timeout: compileTimeout,
    run_timeout: runTimeout,
  };

  if (runtime.version) payload.version = runtime.version;

  if (typeof fetch !== "function") {
    throw new Error("Fetch is not available in this runtime.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = data?.message || data?.error || `Runner error (${response.status})`;
    throw new Error(message);
  }

  const data = await response.json().catch(() => ({}));
  const compile = data?.compile ? normalizeStage(data.compile) : undefined;
  const run = data?.run ? normalizeStage(data.run) : undefined;

  const stdout = [compile?.stdout, run?.stdout].filter(Boolean).join("\n");
  const stderr = [compile?.stderr, run?.stderr].filter(Boolean).join("\n");
  const output = [compile?.output, run?.output].filter(Boolean).join("\n");
  const error =
    (compile?.code && compile.code !== 0) || (run?.code && run.code !== 0)
      ? stderr || "Execution failed"
      : undefined;

  return {
    language: runtime.language,
    output: output || stdout || stderr,
    stdout,
    stderr,
    compile,
    run,
    error,
  };
}

export async function executeRunner(input: RunnerRequest): Promise<RunnerResult> {
  const normalized = normalizeLanguage(input.language);
  if (!normalized) {
    throw new Error("Unsupported language");
  }
  const runtime = LANGUAGE_MAP[normalized];
  if (!runtime) {
    throw new Error("Unsupported language");
  }

  const provider = (process.env.CODE_RUNNER_PROVIDER || "piston").toLowerCase();
  if (provider !== "piston") {
    throw new Error("Code runner provider is disabled.");
  }

  return executeWithPiston(input, runtime);
}
