import type { HousingSystem, TrendInterval } from "@/types/market";
import type { MarketQuery } from "@/lib/market/filters-query";

export type PeriodChoice = "all" | "years" | "custom" | "ytd" | "d30" | "d90" | "m12" | "y2";

export type PanelFilters = {
  period: PeriodChoice;
  startYear: number;
  endYear: number;
  startDate: string;
  endDate: string;
  priceLevel: "" | "Farmgate" | "Retail";
  region: string;
  province: string;
  caged: boolean;
  cageFree: boolean;
  brand: string;
  explicitLabelsOnly: boolean;
  includeUnavailable: boolean;
  interval: TrendInterval;
};

export function defaultFilters(bounds: { start: string; end: string }): PanelFilters {
  return {
    period: "all",
    startYear: Number(bounds.start.slice(0, 4)),
    endYear: Number(bounds.end.slice(0, 4)),
    startDate: bounds.start,
    endDate: bounds.end,
    priceLevel: "",
    region: "",
    province: "",
    caged: true,
    cageFree: true,
    brand: "",
    explicitLabelsOnly: false,
    includeUnavailable: false,
    interval: "Weekly",
  };
}

export function isDefaultFilters(filters: PanelFilters, bounds: { start: string; end: string }): boolean {
  const baseline = defaultFilters(bounds);
  return (
    filters.period === baseline.period &&
    filters.priceLevel === "" &&
    filters.region === "" &&
    filters.province === "" &&
    filters.caged &&
    filters.cageFree &&
    filters.brand === "" &&
    !filters.explicitLabelsOnly &&
    !filters.includeUnavailable &&
    filters.interval === "Weekly"
  );
}

function addUtcDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function subtractMonths(iso: string, months: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 - months, day));
  return date.toISOString().slice(0, 10);
}

function clip(start: string, end: string, first: string, last: string): { start: string; end: string } {
  const boundedStart = start < first ? first : start;
  const boundedEnd = end > last ? last : end;
  return { start: boundedStart, end: boundedEnd };
}

export function selectedPeriod(
  filters: PanelFilters,
  bounds: { start: string; end: string },
): { start: string; end: string } | { error: "order" } {
  const { start: first, end: last } = bounds;

  if (filters.period === "all") return { start: first, end: last };

  if (filters.period === "years") {
    const range = clip(`${filters.startYear}-01-01`, `${filters.endYear}-12-31`, first, last);
    if (range.start > range.end) return { error: "order" };
    return range;
  }

  if (filters.period === "custom") {
    if (filters.startDate > filters.endDate) return { error: "order" };
    return clip(filters.startDate, filters.endDate, first, last);
  }

  if (filters.period === "ytd") {
    return clip(`${last.slice(0, 4)}-01-01`, last, first, last);
  }

  if (filters.period === "d30") return clip(addUtcDays(last, -29), last, first, last);
  if (filters.period === "d90") return clip(addUtcDays(last, -89), last, first, last);
  if (filters.period === "m12") return clip(addUtcDays(subtractMonths(last, 12), 1), last, first, last);
  return clip(addUtcDays(subtractMonths(last, 24), 1), last, first, last);
}

export function filtersToQuery(
  filters: PanelFilters,
  bounds: { start: string; end: string },
): MarketQuery | { error: "order" | "systems" } {
  if (!filters.caged && !filters.cageFree) return { error: "systems" };
  const period = selectedPeriod(filters, bounds);
  if ("error" in period) return period;

  const systems: HousingSystem[] = [];
  if (filters.caged) systems.push("Caged");
  if (filters.cageFree) systems.push("Cage-Free");
  const bothSystems = systems.length === 2;

  return {
    startDate: filters.period === "all" ? undefined : period.start,
    endDate: filters.period === "all" ? undefined : period.end,
    priceLevel: filters.priceLevel || null,
    region: filters.region || null,
    province: filters.province || null,
    systems: bothSystems ? [] : systems,
    brand: filters.brand || null,
    explicitLabelsOnly: filters.explicitLabelsOnly,
    includeUnavailable: filters.includeUnavailable,
    interval: filters.interval,
  };
}

export function formatDisplayDate(iso: string, locale: "en" | "vi"): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
