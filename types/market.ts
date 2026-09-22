export type PriceLevel = "Farmgate" | "Retail";
export type HousingSystem = "Caged" | "Cage-Free";

export type MarketSummaryRow = {
  price_level: PriceLevel;
  system: HousingSystem;
  average_price: number;
  observations: number;
  days: number;
  sources: number;
};

export type TimeSeriesPoint = {
  date: string;
  price: number;
  observations: number;
};

export type TimeSeries = {
  name: HousingSystem;
  price_level: PriceLevel;
  points: TimeSeriesPoint[];
};

export type MatchedComparison = {
  baseline: string;
  target: string;
  baseline_price: number;
  target_price: number;
  difference: number;
  percent: number;
  cells: number;
  days: number;
};

export type FarmerInsight = {
  system: HousingSystem;
  price_level: PriceLevel;
  headline: string;
  observation: string;
  planning_note: string;
  confidence: string;
  evidence_note: string;
  change_percent: number | null;
  baseline_price: number | null;
  recent_price: number | null;
};

export type MarketIntelligence = {
  meta: {
    title: string;
    source: "mock" | "supabase" | "api";
    generated_at: string;
    coverage: { start: string; end: string };
    currency: string;
    unit: string;
    policy_version: string;
  };
  filters: {
    price_levels: PriceLevel[];
    systems: HousingSystem[];
    regions: string[];
    provinces: string[];
    brands: string[];
  };
  summary: MarketSummaryRow[];
  time_series: {
    interval: "Daily" | "Weekly" | "Monthly";
    series: TimeSeries[];
  };
  matched_comparison: {
    housing: MatchedComparison;
    supply_chain: MatchedComparison;
  };
  insights: FarmerInsight[];
  regional_summary: {
    region: string;
    average_price: number;
    observations: number;
  }[];
};
