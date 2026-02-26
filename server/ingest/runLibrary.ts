import { initDb } from "../db";
import { ingestLibrary } from "./library";

const db = initDb();

const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const categoryArg = process.argv.find((arg) => arg.startsWith("--category="));

const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;
const category = categoryArg ? categoryArg.split("=")[1] : undefined;

(async () => {
  const status = await ingestLibrary(db, {
    limit: Number.isFinite(limit) ? limit : undefined,
    category: category || undefined,
    onProgress: (progress) => {
      const pct = progress.total ? Math.round((progress.processed / progress.total) * 100) : 0;
      console.log(`Ingest ${progress.processed}/${progress.total} (${pct}%)`);
    },
  });

  console.log("Ingestion complete", status);
})();
