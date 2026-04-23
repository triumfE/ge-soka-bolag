# GE Söka Bolag — Setup Guide

## 1. Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- Anthropic API key (for AI classification)

## 2. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to **SQL Editor**
3. Paste and run the contents of `supabase/schema.sql`
4. Copy your project URL and anon key from **Settings → API**

## 3. Environment Variables

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
ANTHROPIC_API_KEY=sk-ant-...your-key
```

## 4. Install & Run

```bash
cd ge-soka-bolag
npm install
npm run dev
```

App runs at http://localhost:3000

## 5. Seed Sources

Once the app is running, seed the initial crawl sources:

```bash
curl -X POST http://localhost:3000/api/seed
```

This adds 8 pre-configured sources (Bolagsplatsen, Konkurslistan, etc.)

## 6. Run a Crawl

Trigger a crawl of all enabled sources:

```bash
curl -X POST http://localhost:3000/api/crawl
```

Or crawl a specific source:

```bash
curl -X POST http://localhost:3000/api/crawl \
  -H "Content-Type: application/json" \
  -d '{"source_id": "uuid-of-source"}'
```

You can also click "Run Crawl" in the dashboard UI.

## 7. How It Works

1. **Crawl** — fetches listing pages from each source
2. **Parse** — extracts company listings from HTML
3. **Classify** — Claude AI analyzes each listing for relevance, scores, and signals
4. **Store** — normalized company records saved to Supabase
5. **Display** — dashboard shows ranked companies with AI scores

## Architecture

```
src/
├── app/
│   ├── dashboard/     # Main dashboard with KPIs + deal table
│   ├── pipeline/      # Kanban board + list view
│   ├── sources/       # Source library management
│   ├── company/[id]/  # Company detail + AI brief
│   └── api/
│       ├── crawl/     # POST — run crawlers
│       ├── classify/  # POST — AI classification
│       └── seed/      # POST — seed initial sources
├── lib/
│   ├── ai/
│   │   ├── classify.ts  # AI classification + scoring
│   │   └── brief.ts     # AI deal brief generation
│   ├── crawler/
│   │   ├── base.ts          # Base crawler class
│   │   ├── bolagsplatsen.ts # Bolagsplatsen adapter
│   │   ├── konkurslistan.ts # Konkurslistan adapter
│   │   ├── objektvision.ts  # Objektvision adapter
│   │   ├── ackordscentralen.ts
│   │   ├── bolagsbron.ts
│   │   └── carler.ts
│   ├── db.ts         # Database access layer
│   ├── supabase.ts   # Supabase client
│   └── types.ts      # TypeScript types
└── supabase/
    └── schema.sql    # Full database schema
```

## Demo Mode

Without Supabase configured, the dashboard shows mock data with 5 sample companies.
Connect Supabase + run a crawl to see real data.

## Notes

- Crawlers use CSS selectors that may need adjustment as source sites change
- Some sites may require Playwright for JS rendering (not yet implemented)
- AI classification costs ~$0.01-0.02 per listing (Claude Sonnet)
- Rate limiting: crawlers wait between requests to avoid being blocked
