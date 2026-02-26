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
