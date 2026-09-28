import { createClient } from "@supabase/supabase-js";
import type { MarketResponse } from "@/types/market";

function isMarketResponse(value: unknown): value is MarketResponse {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.meta === "object" &&
    record.meta !== null &&
    typeof record.retail === "object" &&
    record.retail !== null &&
    typeof record.supply_chain === "object" &&
    record.supply_chain !== null &&
    typeof record.coverage === "object" &&
    record.coverage !== null
  );
}

export async function getMarketIntelligence(): Promise<MarketResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("hf_market_snapshots")
    .select("response")
    .eq("is_latest", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not read the latest market snapshot: ${error.message}`);
  }

  if (!isMarketResponse(data?.response)) {
    throw new Error("No latest market snapshot is published in Supabase.");
  }

  return data.response;
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
