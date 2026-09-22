import { MarketPanel } from "@/components/market/market-panel";
import { getMarketIntelligence } from "@/lib/market/get-market-data";
import {
  localeFromUrl,
  resolveLocale,
  type Locale,
} from "@/lib/market/i18n";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "HealthyFarm Market Intelligence",
  description:
    "Vietnam egg price signals for Farmgate and Retail, Caged and Cage-Free.",
  robots: {
    index: false,
    follow: false,
  },
};

async function resolveWidgetLocale(langParam?: string): Promise<Locale> {
  if (langParam) return resolveLocale(langParam);

  try {
    const headerStore = await headers();
    const referer = headerStore.get("referer") || headerStore.get("referrer");
    if (referer) return localeFromUrl(referer);
  } catch {
    /* ignore */
  }

  return "en";
}

async function WidgetBody({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const params = await searchParams;
  const [data, locale] = await Promise.all([
    getMarketIntelligence(),
    resolveWidgetLocale(params.lang),
  ]);

  return (
    <main className="min-h-screen bg-transparent p-0 md:p-1">
      <MarketPanel data={data} locale={locale} />
    </main>
  );
}

export default function WidgetPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-[420px] flex items-center justify-center text-sm text-muted-foreground">
          Loading…
        </main>
      }
    >
      <WidgetBody searchParams={searchParams} />
    </Suspense>
  );
}
