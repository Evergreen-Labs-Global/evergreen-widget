import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  formatCount,
  formatPercent,
  formatVnd,
  getMarketIntelligence,
} from "@/lib/market/get-market-data";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { connection } from "next/server";

async function DashboardContent() {
  await connection();

  const data = await getMarketIntelligence();
  const supabaseConfigured = Boolean(hasEnvVars);

  let sessionEmail: string | null = null;
  let supabaseReachable = false;

  if (supabaseConfigured) {
    try {
      const supabase = await createClient();
      const { data: claims } = await supabase.auth.getClaims();
      sessionEmail = (claims?.claims?.email as string | undefined) ?? null;
      supabaseReachable = true;
    } catch {
      supabaseReachable = false;
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary mb-2">
          Admin
        </p>
        <h1 className="font-serif text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Review the v1 market contract sample, Supabase readiness, and the public
          panel before live API URLs are connected.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Supabase</CardTitle>
            <CardDescription>Auth and future aggregate store</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Env vars:{" "}
              <span className="font-medium">
                {supabaseConfigured ? "configured" : "missing"}
              </span>
            </p>
            <p>
              Client:{" "}
              <span className="font-medium">
                {supabaseReachable ? "reachable" : "unavailable"}
              </span>
            </p>
            <p className="text-muted-foreground truncate">
              Session: {sessionEmail ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              Schema: <code>supabase/schema.sql</code> (v1)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Market contract</CardTitle>
            <CardDescription>Sample response, not live yet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Policy: <span className="font-medium">{data.meta.policy_version}</span>
            </p>
            <p className="text-muted-foreground">
              Generated {data.meta.generated_at}
            </p>
            <p className="text-muted-foreground text-xs">
              Planned: GET /health · GET /api/v1/options · GET /api/v1/market
            </p>
            <p className="text-muted-foreground text-xs">
              Local mock: <code>GET /api/market</code>
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/api/market" target="_blank">
                Open sample JSON
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Public panel</CardTitle>
            <CardDescription>Embed and layout preview</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild size="sm">
              <Link href="/widget" target="_blank">
                Open /widget
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/preview" target="_blank">
                Open UI preview
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Selected period</CardDescription>
            <CardTitle className="font-serif text-lg">
              {data.meta.selected_period.start}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            to {data.meta.selected_period.end} · latest {data.meta.latest_in_view}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Price observations</CardDescription>
            <CardTitle className="font-serif text-2xl text-primary">
              {formatCount(data.coverage.price_observations)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {data.coverage.observed_dates} dates · {data.coverage.brands} brands
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Matched housing</CardDescription>
            <CardTitle className="font-serif text-2xl text-primary">
              {formatPercent(data.retail.matched_housing_comparison?.percent)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Cage-Free vs Caged retail · {data.retail.matched_housing_comparison?.cells} cells
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Caged farmgate → retail</CardDescription>
            <CardTitle className="font-serif text-2xl text-primary">
              {formatPercent(data.supply_chain.spreads_by_system.Caged?.percent)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Cage-Free spread:{" "}
            {data.supply_chain.spreads_by_system["Cage-Free"]
              ? formatPercent(data.supply_chain.spreads_by_system["Cage-Free"]?.percent)
              : "not available"}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Retail by system</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {data.retail.summary_by_system.map((row) => (
              <div key={row.system} className="flex justify-between border-b pb-2">
                <span>{row.system}</span>
                <span className="font-semibold">{formatVnd(row.average_price)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Supply chain by level</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {data.supply_chain.summary_by_level.map((row) => (
              <div key={row.price_level} className="flex justify-between border-b pb-2">
                <span>{row.price_level}</span>
                <span className="font-semibold">{formatVnd(row.average_price)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Insights in sample</CardTitle>
          <CardDescription>
            {data.retail.insights.length + data.supply_chain.farmgate_insights.length} signals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...data.retail.insights, ...data.supply_chain.farmgate_insights].map(
            (insight) => (
              <div key={`${insight.price_level}-${insight.system}`}>
                <p className="text-xs font-semibold uppercase text-primary">
                  {insight.system} · {insight.price_level} · {insight.confidence}
                </p>
                <p className="font-medium">{insight.headline}</p>
              </div>
            ),
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Applied filters</CardTitle>
          <CardDescription>Empty means the full default view in the sample</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto rounded-md bg-muted/50 p-3">
            {JSON.stringify(data.applied_filters, null, 2)}
          </pre>
        </CardContent>
      </Card>
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
