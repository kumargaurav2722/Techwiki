<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e0d6b4f8-d19d-49ce-a058-dc32323dbd7a

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Create a `.env` file in the project root with:
   `GEMINI_API_KEY=your_key_here`
   `AI_PROVIDER=gemini` (or `groq`)
   `GROQ_API_KEY=your_groq_key` (if using Groq)
   `GROQ_MODEL=your_groq_model` (if using Groq)
   `ADMIN_API_KEY=your_admin_key` (optional, protects admin endpoints)
   `JWT_SECRET=your_jwt_secret` (recommended)
   `ADMIN_EMAIL=admin@example.com` (optional, seed admin account)
   `ADMIN_PASSWORD=strongpassword` (optional, seed admin account)
   `RAG_ENABLED=true` (optional, enable citations from sources)
   `RAG_PROVIDER=wikipedia` (or `tavily`)
   `RAG_ENABLED=true` uses Wikipedia search by default to fetch citations.
   `TAVILY_API_KEY=...` (if using Tavily)
   `RAG_MAX_SOURCES=4`
   `RAG_MAX_CHARS=2500`
   `INGEST_ON_BOOT=false` (optional, set `true` to ingest on server start)
   `INGEST_CATEGORY=dsa` (optional, only when ingesting)
   `INGEST_LIMIT=20` (optional, only when ingesting)
   `CODE_RUNNER_PROVIDER=piston` (optional, enables multi-language code runner)
   `CODE_RUNNER_API=https://emkc.org/api/v2/piston/execute`
   `CODE_RUNNER_DEFAULT_VERSION=latest` (optional)
   `CODE_RUNNER_RUN_TIMEOUT_MS=3000` (optional)
   `CODE_RUNNER_COMPILE_TIMEOUT_MS=10000` (optional)
   `MODERATION_KEYWORDS=spam,scam,offensive` (optional, comma-separated)
   `MODERATION_KEYWORD_ACTION=reject` (or `hide`)
3. Start the API server (port 4000):
   `npm run dev:server`
4. Start the frontend (port 3000):
   `npm run dev`

Content is cached in `server/data/techwiki.db`.

To run background ingestion manually:
`npm run ingest:library`
Optional flags: `--limit=20` or `--category=dsa`

Admin editor: open `/admin` in the frontend. If `ADMIN_API_KEY` is set, enter it in the Admin page before saving.

Learning paths: open `/learn` for curated tracks.

Library: open `/library` for bookmarks and reading lists. Sign in via `/login`.

Explore: open `/explore` for trending, recent, and topic browsing.

Practice: open `/practice` for quizzes, system design prompts, and multi-language code execution.

## Features

- AI-generated, in-depth technical articles across DSA, system design, programming languages, devops, databases, and more
- Provider switch for AI generation (`AI_PROVIDER=gemini|groq`)
- On-demand generation with caching in SQLite (`server/data/techwiki.db`)
- Background ingestion for a prebuilt topic library (manual or on boot)
- Real citation sourcing with RAG (Wikipedia or Tavily) and inline references
- Full-text search (FTS5) with snippets
- Explore hub with trending, recent, random, and per-category browsing
- Knowledge graph concept map driven by the API (nodes + cross-links)
- Learning paths for curated study tracks
- Practice lab with quizzes, system design prompts, and a multi-language code runner
- Admin editor for curated content, references, and article lifecycle
- Drafts, approvals, publishing workflow with version history
- Restore any version to draft or publish
- Version diff view for side-by-side changes
- User accounts with JWT auth and role-based admin access
- Library with bookmarks and reading lists
- Team collaboration with shared reading lists
- Notes per article and public comments
- Comment reporting and moderation queue
- Keyword filtering and auto-hide or reject actions
- User moderation with ban and unban controls
- Article view counts and basic analytics for trending
