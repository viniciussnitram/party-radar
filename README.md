# Party Radar

Party Radar collects upcoming parties in the Região dos Lagos and Norte Fluminense (Rio de Janeiro, Brazil) — Cabo Frio, Arraial do Cabo, Rio das Ostras, Macaé and Campos dos Goytacazes — and lists them in one place, with date, time, venue, open bar info and the ticket link.

Local parties are announced across dozens of Instagram pages and ticket platforms. Party Radar gathers them automatically from public ticket platform pages, so nobody has to keep track by hand.

## How it works

```
GitHub Actions (3x/day)
        │
        ▼
   collector ──► public ticket platform pages (Sympla, Uticket)
        │
        ▼
Supabase (Postgres + Storage) ◄── web (React, Vercel)
                                     ├─ public party list with filters
                                     └─ admin area (Google / Microsoft login)
```

- **collector**: a TypeScript job that reads public event listings for each configured city, normalizes them, merges duplicates and stores them.
- **web**: a React app that lists upcoming parties, with filters by city, open bar and weekend, plus an admin area to add, fix or remove parties and to manage cities.
- **supabase**: database schema and migrations.

## Principles

- **Zero cost**: everything runs on free tiers (GitHub Actions, Supabase, Vercel).
- **Respectful collection**: only public pages allowed by each site's `robots.txt`, a few requests per run with pauses between them, and no bypassing of bot protection. When a site rate-limits a run, that city is skipped until the next one.
- **No manual work required**: parties are published automatically; admins only step in to fix mistakes or add parties that are not on any platform.

## Project structure

| Path | Description |
|---|---|
| `collector/` | Event collector (TypeScript, Node.js 22) |
| `web/` | Frontend (planned) |
| `supabase/` | Database migrations (planned) |

## Getting started

```bash
cd collector
npm install
npm run collect   # prints the parties found for each city
npm test
```

## Roadmap

- [x] Sympla city page collector
- [ ] Party filter (drop courses, theater, talks) and open bar / category detection
- [ ] Supabase schema, persistence and duplicate merging
- [ ] Uticket collector
- [ ] Scheduled runs on GitHub Actions
- [ ] Web app: public list and admin area
- [ ] Instagram Graph API source for parties that are not on ticket platforms
