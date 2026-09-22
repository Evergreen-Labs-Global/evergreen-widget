import type { MarketIntelligence } from "@/types/market";
import mockData from "@/data/mock/market-intelligence.json";

export async function getMarketIntelligence(): Promise<MarketIntelligence> {
  // Live API / Supabase reads will replace this mock source later.
  return mockData as MarketIntelligence;
}

export function formatVnd(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `₫${Math.round(value).toLocaleString("en-US")}`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
