# HealthyFarm

Next.js application for the [HealthyFarm Laying Hen Welfare Network](https://www.evergreenlabs.org/healthyfarm-network/home): public market intelligence embeds, admin dashboard, and Supabase authentication.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase Auth (SSR cookies)
- Merriweather + Open Sans
- Brand green `#3A855D`

## Features

- **Public market panel** at `/widget` — no site header/footer, ready for Webflow iframe embeds
- **Script embed** via `/embed.js` — mounts the panel into a `#app` div
- **Admin dashboard** at `/dashboard` — auth-gated connection status and mock payload preview
- **Mock market API** at `GET /api/market` — sample JSON until live endpoints are wired
- **Supabase schema** in `supabase/schema.sql` for future aggregate storage

> Market API responses are **mocked** from `data/mock/market-intelligence.json`. Swap the loader in `lib/market/get-market-data.ts` when live URLs are available.

## Getting started

```bash
npm install
cp .env.example .env.local   # or create .env.local from the variables below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

(Some templates use `NEXT_PUBLIC_SUPABASE_ANON_KEY` — match whatever `lib/supabase/*` expects in this repo.)

## Embed in Webflow (two options)

### 1. Iframe

Add an Embed element:

```html
<iframe
  src="https://YOUR_DOMAIN/widget"
  title="HealthyFarm Market Intelligence"
  style="width:100%;min-height:920px;border:0;"
  loading="lazy"
></iframe>
```

### 2. Script + `#app` div

In the page body:

```html
<div id="app"></div>
```

In the page footer (before `</body>`):

```html
<script src="https://YOUR_DOMAIN/embed.js" async></script>
```

Optional attributes on the div:

```html
<div id="app" data-height="960" data-src="https://YOUR_DOMAIN/widget"></div>
```

## Admin dashboard

1. Sign up / sign in via `/auth/sign-up` or `/auth/login`
2. Open `/dashboard` to review Supabase session status, mock API source, and schema notes
3. Preview the public panel from the dashboard link

## Supabase schema

Run `supabase/schema.sql` in the Supabase SQL editor to create:

| Table | Purpose |
|-------|---------|
| `egg_price_observations` | Optional raw analytics rows (auth read) |
| `market_summaries` | Aggregated averages (public read) |
| `market_time_series` | Trend buckets (public read) |
| `market_comparisons` | Matched premiums (public read) |
| `market_insights` | Farmer-facing explanations (public read) |

## Project layout

```
app/
  page.tsx                 # HealthyFarm landing
  widget/                  # Public embeddable market panel
  dashboard/               # Auth-gated admin
  api/market/              # Mock JSON endpoint
  auth/                    # Login, sign-up, password flows
components/
  market/market-panel.tsx  # Shared market UI
  site-header.tsx
  site-footer.tsx
data/mock/                 # Mock market intelligence payload
supabase/schema.sql
public/
  healthyfarmlogo.png
  embed.js
types/market.ts
```

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # run production build
npm run lint     # ESLint
```

## Deployment

Deploy the frontend on **Vercel**. Set the Supabase environment variables in the project settings. Point Webflow embeds at your production domain.

## Brand

- Site: [HealthyFarm Network](https://www.evergreenlabs.org/healthyfarm-network/home)
- Organization: Evergreen Labs (`info@evergreenlabs.org`)
