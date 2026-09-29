import type { HousingSystem, PriceLevel, TrendInterval } from "@/types/market";

const PRICE_LEVELS = new Set<PriceLevel>(["Farmgate", "Retail"]);
const SYSTEMS = new Set<HousingSystem>(["Caged", "Cage-Free"]);
const INTERVALS = new Set<TrendInterval>(["Daily", "Weekly", "Monthly"]);

/** Client-safe query shape. Kept separate so the sidebar never imports the server API loader. */
export type MarketQuery = {
  startDate?: string;
  endDate?: string;
  priceLevel?: PriceLevel | null;
  region?: string | null;
  province?: string | null;
  systems?: HousingSystem[];
  brand?: string | null;
  explicitLabelsOnly?: boolean;
  includeUnavailable?: boolean;
  interval?: TrendInterval;
};

export function marketQueryString(query?: MarketQuery): string {
  if (!query) return "";
  const params = new URLSearchParams();
  if (query.startDate) params.set("start_date", query.startDate);
  if (query.endDate) params.set("end_date", query.endDate);
  if (query.priceLevel) params.set("price_level", query.priceLevel);
  if (query.region) params.set("region", query.region);
  if (query.province) params.set("province", query.province);
  for (const system of query.systems ?? []) params.append("system", system);
  if (query.brand) params.set("brand", query.brand);
  if (query.explicitLabelsOnly) params.set("explicit_labels_only", "true");
  if (query.includeUnavailable) params.set("include_unavailable", "true");
  if (query.interval) params.set("interval", query.interval);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function marketQueryFromSearchParams(params: URLSearchParams): MarketQuery {
  const priceLevel = params.get("price_level");
  const interval = params.get("interval");
  const systems = params
    .getAll("system")
    .filter((value): value is HousingSystem => SYSTEMS.has(value as HousingSystem));

  return {
    startDate: params.get("start_date") ?? undefined,
    endDate: params.get("end_date") ?? undefined,
    priceLevel:
      priceLevel && PRICE_LEVELS.has(priceLevel as PriceLevel) ? (priceLevel as PriceLevel) : null,
    region: params.get("region"),
    province: params.get("province"),
    systems,
    brand: params.get("brand"),
    explicitLabelsOnly: params.get("explicit_labels_only") === "true",
    includeUnavailable: params.get("include_unavailable") === "true",
    interval:
      interval && INTERVALS.has(interval as TrendInterval) ? (interval as TrendInterval) : "Weekly",
  };
}
