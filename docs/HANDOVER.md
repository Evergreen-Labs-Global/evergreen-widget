# HealthyFarm IT handover

**Date:** 29 September 2026  
**Status:** Panel embed + live API + daily Cloud runner are in place. Optional alerts/monitoring can wait.

This note is for handing over what IT built: website embed, FastAPI Cloud Run service, Supabase data layer, and the scheduled daily pipeline.

---

## Quick links

| What | URL |
|---|---|
| Live market panel | https://evergreen-widget.vercel.app/widget |
| UI preview (layout options) | https://evergreen-widget.vercel.app/preview |
| Admin dashboard (login required) | https://evergreen-widget.vercel.app/dashboard |
| GitHub repo | https://github.com/Evergreen-Labs-Global/evergreen-widget |
| Vercel project | https://vercel.com/evergreen-labs1/evergreen-widget |
| Read-only market API | https://healthyfarm-market-api-631782470854.asia-southeast1.run.app |
| API health | https://healthyfarm-market-api-631782470854.asia-southeast1.run.app/health |
| API market | https://healthyfarm-market-api-631782470854.asia-southeast1.run.app/api/v1/market |
| API options | https://healthyfarm-market-api-631782470854.asia-southeast1.run.app/api/v1/options |
| English site page | https://www.evergreenlabs.org/healthyfarm-network/egg-prediction |
| Vietnamese site page | https://www.evergreenlabs.org/vi-vn/healthyfarm-network/egg-prediction |

---

## What was delivered

### 1. Website / Next.js app (Vercel)

- Next.js App Router app with HealthyFarm branding
- Public embed at `/widget` (no site header/footer)
- Layout preview at `/preview`
- Auth-gated admin at `/dashboard`
- Language: English by default; Vietnamese chrome when the host URL contains `vi-vn` or `?lang=vi`
- Panel logo removed so Memberstack/Webflow page branding stays primary
- Panel body uses a plain white frame for clean embed

**Source of market numbers:** the panel does **not** read a static sample JSON file. It calls the live FastAPI service through the Next.js server (`HF_MARKET_API_URL`).

**Important Vercel env vars**

| Name | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel | Auth + project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel | Browser/auth publishable key |
| `HF_MARKET_API_URL` | Vercel (server-only) | Cloud Run API base URL, no trailing slash |

Do **not** put `SUPABASE_SERVICE_ROLE_KEY` in any `NEXT_PUBLIC_*` variable or in Webflow.

### 2. Embed on Memberstack / Webflow pages

Recommended embed:

```html
<div id="app" data-height="860"></div>
<script src="https://evergreen-widget.vercel.app/embed.js" async></script>
```

- `embed.js` mounts an iframe to `/widget`
- Fixed iframe height so left filters stay put; results scroll inside the panel
- `vi-vn` pages get Vietnamese labels automatically

### 3. Streamlit-aligned panel UX

The production panel follows the Streamlit client dashboard as the functional reference:

- Left filters: coverage period, price level, region, province/city, production system, brand, explicit labels, out-of-stock, trend interval
- Tabs: Retail comparison, Farmgate & retail, Coverage & methods
- Matched comparison / spread empty states follow Streamlit wording (not a false “failed filter” alert on every change)
- Desktop: fixed filter rail, scrollable results
- Mobile: Filters button + drawer + active chips
- Spinner while a filter request is in flight

Calculations stay in Python (FastAPI). The React app does not recompute averages in the browser.

### 4. Read-only FastAPI on Cloud Run

| Item | Value |
|---|---|
| GCP project | `healthyfarm-market-scraper` (number `631782470854`) |
| Service | `healthyfarm-market-api` |
| Region | `asia-southeast1` |
| Role | Read-only. Reads `hf_analytics_observations`. Does **not** scrape. Writes are off (`HF_WRITE_ANALYTICS=false`, `HF_WRITE_SNAPSHOTS=false`) |

**Secrets in Secret Manager**

- `supabase-url`
- `supabase-service-role-key`

Compute service account needs `Secret Manager Secret Accessor` on those secrets.

### 5. Supabase data layer

| Table | Access | Purpose |
|---|---|---|
| `hf_analytics_observations` | Private (service role) | 84-column analytics rows FastAPI reads |
| `hf_market_snapshots` | Latest row readable publicly via RLS | Canonical published market JSON |

Baseline confirmed with Lucas:

- MASTER: 6,189 rows
- Analytics: 6,145 rows
- Through: 18 September 2026

Client-view filtered observation count on the panel is typically **6,132** (after eligibility / display rules). That is expected and not a missing-data bug.

Schema reference in repo: `supabase/schema.sql`

### 6. Daily production pipeline (Cloud)

| Item | Value |
|---|---|
| GCP project | `healthyfarm-market-scraper` |
| MASTER bucket | `gs://healthyfarm-master-data/master/MASTER_EGG_PRICE_DATA.csv` |
| Bucket protections | Soft delete + object versioning (3 versions, 7-day non-current expiry), public access prevented |
| Cloud Run Job | `healthyfarm-daily-pipeline` |
| Mode | `HF_PIPELINE_MODE=production` |
| Writes | `HF_WRITE_ANALYTICS=true`, `HF_WRITE_SNAPSHOTS=true` |
| Scheduler | `healthyfarm-daily-0530-vn` |
| Schedule | `0 5 * * *` |
| Timezone | `Asia/Ho_Chi_Minh` |
| Scheduler retries | `0` |
| Job max retries | `0` |
| Tasks | `1` |

**Flow**

```text
Cloud Scheduler (05:00 VN)
  -> Cloud Run Job healthyfarm-daily-pipeline
  -> restore MASTER from GCS
  -> scrape once (main.py)
  -> preprocess analytics
  -> UPSERT hf_analytics_observations
  -> publish hf_market_snapshots
  -> verify latest snapshot
  -> persist MASTER back to GCS
```

Opening the website or refreshing the panel **never** triggers scraping.

**Recovery if scrape already succeeded but a later stage failed**

Do **not** scrape again the same day. Re-run the job with:

```text
HF_PIPELINE_MODE=skip-scrape
```

(or execute an equivalent skip-scrape run), which recovers from the existing MASTER.

**First validation already done**

- Skip-scrape publish test completed successfully on 29 Sep 2026
- Latest snapshot regenerated; live API returned the published view

---

## How the pieces connect

```text
Daily Cloud Job
  -> writes analytics + snapshot in Supabase

Read-only Cloud Run API
  -> reads hf_analytics_observations
  -> serves /api/v1/options and /api/v1/market

Next.js on Vercel
  -> server calls HF_MARKET_API_URL
  -> /widget and /preview render the panel
  -> Memberstack/Webflow pages embed /embed.js or /widget
```

---

## IAM / ownership notes

| Principal | Notes |
|---|---|
| `kasia@evergreenlabs.org` | GCP project Owner |
| `mohitwalia5490@gmail.com` | Editor + Cloud Run Admin + Secret Manager Admin (as granted) |
| `631782470854-compute@developer.gserviceaccount.com` | Runs Cloud Run service/job; Secret Accessor; GCS objectAdmin on MASTER bucket; run.invoker on daily job |

---

## Optional (not required for current handover)

These can wait:

- Failure email / alerting on Scheduler or Job failure
- Manual full scrape test before the first 05:00 VN automatic run
- Closing public `/widget` access if Memberstack-only access is required later
- README refresh in GitHub (older README text may still mention mock/sample data; this handover note is the current source of truth)

---

## Ops cheat sheet

**Check API**

```bash
curl https://healthyfarm-market-api-631782470854.asia-southeast1.run.app/health
```

**Run daily job once (production scrape)**

```bash
gcloud run jobs execute healthyfarm-daily-pipeline \
  --project healthyfarm-market-scraper \
  --region asia-southeast1 \
  --wait
```

**Run publish-only recovery (no scrape)**

Update job env `HF_PIPELINE_MODE=skip-scrape`, execute once, then set back to `production`.

**Scheduler**

```bash
gcloud scheduler jobs describe healthyfarm-daily-0530-vn \
  --project healthyfarm-market-scraper \
  --location asia-southeast1
```

---

## Repo map (frontend)

```text
app/widget/                 Public embed page
app/preview/                Layout preview
app/dashboard/              Admin dashboard
app/api/market/             Proxies filtered market JSON
app/api/market/options/     Proxies filter options
components/market/          Panel, filters, variants
lib/market/                 API loader, filter helpers
public/embed.js             Webflow/Memberstack embed script
supabase/schema.sql         Supabase tables + RLS
```

Private pipeline sources used for Cloud Run Job packaging live outside the public app tree (handover zip / Cloud Shell `~/healthyfarm-pipeline`). Do not commit Supabase service-role keys or `.env` files.
