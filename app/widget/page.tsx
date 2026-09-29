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
  const locale = await resolveWidgetLocale(params.lang);

  try {
    const data = await getMarketIntelligence();
    return (
      <main className="h-dvh overflow-hidden bg-white">
        <MarketPanel data={data} locale={locale} framed />
      </main>
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Market data is temporarily unavailable.";
    return (
      <main className="min-h-[240px] flex items-center justify-center p-6 text-sm text-muted-foreground">
        {message}
      </main>
    );
  }
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
