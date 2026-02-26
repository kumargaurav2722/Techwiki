export type RunnerStage = {
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

export async function executeCode(input: {
  language: string;
  code: string;
  stdin?: string;
}): Promise<RunnerResult> {
  const response = await fetch("/api/runner/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || "Failed to execute code");
  }

  return data as RunnerResult;
}
