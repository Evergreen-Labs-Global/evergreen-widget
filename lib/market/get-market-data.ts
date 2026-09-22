import type { MarketResponse } from "@/types/market";
import sample from "@/supabase/HealthyFarm_API_Sample_Response_v1.json";

export async function getMarketIntelligence(): Promise<MarketResponse> {
  // v1 contract sample generated from the HealthyFarm dataset.
  // Replace with GET {API_URL}/api/v1/market when the production URL is available.
  return sample as MarketResponse;
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

export function formatCount(value: number, locale: "en" | "vi" = "en"): string {
  return value.toLocaleString(locale === "vi" ? "vi-VN" : "en-US");
}
