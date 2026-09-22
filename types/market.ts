export type PriceLevel = "Farmgate" | "Retail";
export type HousingSystem = "Caged" | "Cage-Free";
export type TrendInterval = "Daily" | "Weekly" | "Monthly";

export type TimeSeriesPoint = {
  date: string;
  price: number;
  observations: number;
};

export type SystemSummary = {
  system: HousingSystem;
  average_price: number;
  observations: number;
  days: number;
};

export type LevelSummary = {
  price_level: PriceLevel;
  average_price: number;
  observations: number;
  days: number;
};

export type PriceComparison = {
  baseline: string;
  target: string;
  baseline_price: number;
  target_price: number;
  difference: number;
  percent: number;
  cells?: number;
  days?: number;
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
  matched_series: number;
  previous_dates: number;
  recent_dates: number;
  sustained: boolean;
};

export type RegionalSystemRow = {
  region: string;
  system: HousingSystem;
  average_price: number;
  observations: number;
  days: number;
};

export type BrandSystemRow = {
  brand: string | null;
  system: HousingSystem;
  average_price: number;
  observations: number;
  days: number;
};

export type CoverageMatrixRow = {
  price_level: PriceLevel;
  system: HousingSystem;
  average_price: number;
  observations: number;
  days: number;
};

/** GET /api/v1/market — v1 contract */
export type MarketResponse = {
  meta: {
    title: string;
    generated_at: string;
    dataset_coverage: { start: string; end: string };
    selected_period: { start: string; end: string };
    latest_in_view: string;
    currency: string;
    unit: string;
    policy_version: string;
  };
  applied_filters: {
    price_level: PriceLevel | null;
    region: string | null;
    province: string | null;
    systems: HousingSystem[];
    brand: string | null;
    explicit_labels_only: boolean;
    include_unavailable: boolean;
    interval: TrendInterval;
  };
  retail: {
    summary_by_system: SystemSummary[];
    unadjusted_comparison: PriceComparison | null;
    time_series: {
      interval: TrendInterval;
      series: {
        name: string;
        system: HousingSystem;
        points: TimeSeriesPoint[];
      }[];
    };
    matched_housing_comparison: PriceComparison | null;
    regional_summary: RegionalSystemRow[];
    brand_summary: BrandSystemRow[];
    insights: FarmerInsight[];
  };
  supply_chain: {
    summary_by_level: LevelSummary[];
    time_series: {
      interval: TrendInterval;
      series: {
        name: string;
        price_level: PriceLevel;
        points: TimeSeriesPoint[];
      }[];
    };
    spreads_by_system: Record<string, PriceComparison | null>;
    farmgate_insights: FarmerInsight[];
  };
  coverage: {
    price_observations: number;
    observed_dates: number;
    brands: number;
    unclassified_observations: number;
    matrix: CoverageMatrixRow[];
  };
};
