import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatCount,
  formatPercent,
  formatVnd,
  getMarketIntelligence,
  marketApiBaseUrl,
} from "@/lib/market/get-market-data";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import type { PriceComparison } from "@/types/market";
import Link from "next/link";
import { connection } from "next/server";

function formatDay(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatGeneratedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
    hourCycle: "h23",
  }).format(date);
}

function apiHost(): string {
  try {
    return new URL(marketApiBaseUrl()).host;
  } catch {
    return "not configured";
  }
}

function spreadLabel(spread: PriceComparison | null | undefined): string {
  if (!spread) return "Not enough overlap";
  return formatPercent(spread.percent);
}

async function DashboardContent() {
  await connection();

  const data = await getMarketIntelligence();
  const host = apiHost();

  let sessionEmail: string | null = null;
  if (hasEnvVars) {
    try {
      const supabase = await createClient();
      const { data: claims } = await supabase.auth.getClaims();
      sessionEmail = (claims?.claims?.email as string | undefined) ?? null;
    } catch {
      sessionEmail = null;
    }
  }

  const insights = [
    ...data.retail.insights,
    ...data.supply_chain.farmgate_insights,
  ];
  const cagedSpread = data.supply_chain.spreads_by_system.Caged;
  const cageFreeSpread = data.supply_chain.spreads_by_system["Cage-Free"];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Admin
          </p>
          <h1 className="font-serif text-3xl font-bold tracking-tight">
            Market dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Live prices from the read-only market API. Dataset{" "}
            {formatDay(data.meta.dataset_coverage.start)} to{" "}
            {formatDay(data.meta.dataset_coverage.end)}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/widget" target="_blank">
              Open panel
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/preview" target="_blank">
              UI preview
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Live</Badge>
          <Badge variant="outline">Read only</Badge>
          <span className="text-sm text-muted-foreground">{host}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {sessionEmail ? `Signed in as ${sessionEmail}` : "Signed in"}
          {" · "}
          Updated {formatGeneratedAt(data.meta.generated_at)} Vietnam
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Price observations</CardDescription>
            <CardTitle className="font-serif text-3xl text-primary">
              {formatCount(data.coverage.price_observations)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            In the client view, after eligibility filters
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Observed dates</CardDescription>
            <CardTitle className="font-serif text-3xl">
              {formatCount(data.coverage.observed_dates)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Latest in view {formatDay(data.meta.latest_in_view)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Brands</CardDescription>
            <CardTitle className="font-serif text-3xl">
              {formatCount(data.coverage.brands)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {formatCount(data.coverage.unclassified_observations)} unclassified
            observations
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Caged farmgate to retail</CardDescription>
            <CardTitle className="font-serif text-3xl text-primary">
              {spreadLabel(cagedSpread)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Cage-Free spread: {spreadLabel(cageFreeSpread)}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Retail by system</CardTitle>
            <CardDescription>
              Average price per egg · {data.retail.time_series.interval}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.retail.summary_by_system.map((row) => (
              <div
                key={row.system}
                className="flex items-baseline justify-between gap-4 border-b py-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{row.system}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCount(row.observations)} observations ·{" "}
                    {formatCount(row.days)} days
                  </p>
                </div>
                <p className="font-serif text-xl font-semibold text-primary">
                  {formatVnd(row.average_price)}
                </p>
              </div>
            ))}
            {data.retail.matched_housing_comparison ? (
              <p className="pt-3 text-xs text-muted-foreground">
                Matched Cage-Free vs Caged:{" "}
                {formatPercent(data.retail.matched_housing_comparison.percent)} across{" "}
                {formatCount(data.retail.matched_housing_comparison.cells ?? 0)} cells
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Farmgate and retail</CardTitle>
            <CardDescription>Average price per egg across the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {data.supply_chain.summary_by_level.map((row) => (
              <div
                key={row.price_level}
                className="flex items-baseline justify-between gap-4 border-b py-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{row.price_level}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCount(row.observations)} observations ·{" "}
                    {formatCount(row.days)} days
                  </p>
                </div>
                <p className="font-serif text-xl font-semibold text-primary">
                  {formatVnd(row.average_price)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Coverage</CardTitle>
          <CardDescription>
            Policy {data.meta.policy_version}
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Level</th>
                <th className="py-2 pr-4 font-medium">System</th>
                <th className="py-2 pr-4 font-medium">Average</th>
                <th className="py-2 pr-4 font-medium">Observations</th>
                <th className="py-2 font-medium">Days</th>
              </tr>
            </thead>
            <tbody>
              {data.coverage.matrix.map((row) => (
                <tr
                  key={`${row.price_level}-${row.system}`}
                  className="border-b last:border-0"
                >
                  <td className="py-2 pr-4">{row.price_level}</td>
                  <td className="py-2 pr-4">{row.system}</td>
                  <td className="py-2 pr-4 font-medium">{formatVnd(row.average_price)}</td>
                  <td className="py-2 pr-4">{formatCount(row.observations)}</td>
                  <td className="py-2">{formatCount(row.days)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Insights</CardTitle>
          <CardDescription>
            {formatCount(insights.length)} signals in this response
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {insights.map((insight) => (
            <div key={`${insight.price_level}-${insight.system}-${insight.headline}`}>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {insight.system} · {insight.price_level}
                </Badge>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {insight.confidence}
                  {insight.sustained ? " · sustained" : ""}
                </span>
              </div>
              <p className="font-medium">{insight.headline}</p>
              <p className="mt-1 text-sm text-muted-foreground">{insight.observation}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          Response interval: {data.applied_filters.interval}. Currency{" "}
          {data.meta.currency} {data.meta.unit}.
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/api/market" target="_blank">
            Open JSON
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading dashboard…</p>}>
      <DashboardContent />
    </Suspense>
  );
}
