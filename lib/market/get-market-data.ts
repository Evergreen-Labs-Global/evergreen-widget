import type { MarketResponse } from "@/types/market";

const MARKET_API_TIMEOUT_MS = 60_000;

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

export function marketApiBaseUrl(): string {
  const url = process.env.HF_MARKET_API_URL?.trim().replace(/\/$/, "");
  if (!url) {
    throw new Error("HF_MARKET_API_URL is not configured.");
  }
  return url;
}

export async function getMarketIntelligence(): Promise<MarketResponse> {
  const endpoint = `${marketApiBaseUrl()}/api/v1/market`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      signal: AbortSignal.timeout(MARKET_API_TIMEOUT_MS),
      next: { revalidate: 300 },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    throw new Error(`Could not reach the market API: ${message}`);
  }

  if (!response.ok) {
    throw new Error(`Market API returned ${response.status}.`);
  }

  const body: unknown = await response.json();
  if (!isMarketResponse(body)) {
    throw new Error("Market API returned an unexpected response.");
  }

  return body;
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
