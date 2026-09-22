import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMarketIntelligence, formatVnd } from "@/lib/market/get-market-data";
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
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Monitor connections, review mock market payloads, and open the public
          market panel used for Webflow embeds.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Supabase</CardTitle>
            <CardDescription>Auth and future data layer</CardDescription>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Market API</CardTitle>
            <CardDescription>Current data source</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Source:{" "}
              <span className="font-medium capitalize">{data.meta.source}</span>
            </p>
            <p className="text-muted-foreground">
              Generated {data.meta.generated_at}
            </p>
            <p className="text-muted-foreground">
              Endpoint: <code className="text-xs">GET /api/market</code>
            </p>
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link href="/api/market" target="_blank">
                Open JSON
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Public panel</CardTitle>
            <CardDescription>Embed preview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Iframe path <code className="text-xs">/widget</code> · Script{" "}
              <code className="text-xs">/embed.js</code>
            </p>
            <Button asChild size="sm">
              <Link href="/widget" target="_blank">
                Open public panel
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="font-serif text-xl font-bold mb-4">
          Mock payload snapshot
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.summary.map((row) => (
            <Card key={`${row.price_level}-${row.system}`}>
              <CardHeader className="pb-2">
                <CardDescription>
                  {row.system} · {row.price_level}
                </CardDescription>
                <CardTitle className="font-serif text-2xl text-primary">
                  {formatVnd(row.average_price)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {row.observations.toLocaleString("en-US")} observations
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Schema</CardTitle>
          <CardDescription>
            Apply <code>supabase/schema.sql</code> in the Supabase SQL editor
            when you are ready to store live aggregates.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>
            Tables: egg_price_observations, market_summaries,
            market_time_series,
          </p>
          <p>
            market_comparisons, market_insights — with public read on
            aggregates.
          </p>
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
