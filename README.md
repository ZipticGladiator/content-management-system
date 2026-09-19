# Siya | Cybersecurity CMS

A content management system for running Siya's cybersecurity YouTube and TikTok
content, end to end: drafting ideas, tracking production status, writing
scripts, and keeping both platforms' pipelines organized in one place.

## What it does

- **YouTube pipeline** — every video idea moves through six stages (Idea,
  Scripting, Filming, Editing, Scheduled, Published) on a Kanban-style board
  or a sortable list view. Each video tracks its category, due date, editing
  cost, a "Paid" tick, editor, a production checklist, and a "top pick" flag.
- **TikTok pipeline** — its own, faster-moving board (Idea, Script, Film, Edit,
  Posted), kept separate from YouTube since the two move at different speeds.
- **Scripts workspace** — a dedicated space to draft and revise full scripts
  for any video or clip, independent of the pitch/notes on the board itself,
  with draft/final status.
- **Comments & attachments** — a ClickUp-style comment thread on every video/
  clip, plus file uploads (thumbnails, reference docs) stored in Supabase
  Storage.
- **Content calendar** — a month view plotting due/scheduled/posted dates from
  both platforms together, so gaps or clashes in posting cadence are visible
  at a glance.
- **Inspiration** — a directory of competitor and inspiration channels, with
  follower counts and notes on what makes each one worth watching.
- **YouTube Studio & TikTok analytics** — connect each platform's account via
  OAuth to pull real stats (views, watch time, likes, comments) onto
  published videos/clips and a channel/account overview.
- **Onboarding tour** — a step-by-step walkthrough shown once per new browser,
  replayable anytime from the nav.
- **Shared access** — a single passphrase gates the whole app, so it can be
  shared with an editor or collaborator without setting up full accounts.
- **Dark cyber theme** — styled to match the Hacking Hub brand, with a
  light-mode toggle for anyone who prefers it.

## Stack

- **Next.js** (App Router, TypeScript) + Tailwind CSS
- **Prisma** + **PostgreSQL** (hosted on Supabase)
- **Supabase Storage** for file attachments
- **Vercel** for hosting/deploy

## Getting started locally

```bash
npm install
cp .env.example .env   # fill in your database + auth + integration values
npm run db:migrate      # apply the schema to your database
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to the
YouTube board.

### Environment variables

See [.env.example](.env.example) for the full list:

- `DATABASE_URL` / `DIRECT_URL` — Postgres connection strings (pooled for the
  app, direct for migrations).
- `APP_PASSPHRASE` — the shared passphrase gating the app.
- `AUTH_SECRET` — random secret used to sign login session cookies.
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — used server-side to upload
  attachments.
- `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` / `YOUTUBE_OAUTH_BASE_URL` —
  YouTube Studio Analytics OAuth (from Google Cloud Console).
- `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` / `TIKTOK_OAUTH_BASE_URL` —
  TikTok Analytics OAuth (from developers.tiktok.com).

### Useful scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Generate the Prisma client and build for production |
| `npm run lint` | Lint the codebase |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio to browse the database |

## Deployment

Deploys automatically to Vercel on every push to `main` — Vercel's own build
runs type-checking and linting, so there's no separate CI step. All the
environment variables above need to be set in the Vercel project settings too.
