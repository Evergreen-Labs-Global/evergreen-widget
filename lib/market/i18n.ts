export type Locale = "en" | "vi";

export function resolveLocale(input?: string | null): Locale {
  if (!input) return "en";
  const value = input.toLowerCase().trim();
  if (
    value === "vi" ||
    value === "vn" ||
    value === "vi-vn" ||
    value.startsWith("vi")
  ) {
    return "vi";
  }
  return "en";
}

export function localeFromUrl(url: string): Locale {
  try {
    const href = url.toLowerCase();
    if (href.includes("/vi-vn") || href.includes("vi-vn")) return "vi";
  } catch {
    /* ignore */
  }
  return "en";
}

type Dict = {
  eyebrow: string;
  title: string;
  subtitle: string;
  coverage: string;
  sampleData: string;
  farmgate: string;
  retail: string;
  caged: string;
  cageFree: string;
  observations: string;
  days: string;
  priceTrend: string;
  average: string;
  weekly: string;
  daily: string;
  monthly: string;
  selectSystem: string;
  cageFreePremium: string;
  farmgateToRetail: string;
  matchedVs: string;
  matchedSpread: string;
  cells: string;
  insightsTitle: string;
  insightsSubtitle: string;
  confidence: string;
  confidenceHigh: string;
  confidenceModerate: string;
  confidenceLow: string;
  footer: string;
  chartLabel: string;
  regionsTitle: string;
  regionObservations: string;
};

const en: Dict = {
  eyebrow: "Market intelligence",
  title: "Vietnam egg price signals",
  subtitle:
    "Observed Farmgate and Retail prices for Caged and Cage-Free eggs. Figures are descriptive signals, not forecasts or guaranteed returns.",
  coverage: "Coverage",
  sampleData: "Sample data",
  farmgate: "Farmgate",
  retail: "Retail",
  caged: "Caged",
  cageFree: "Cage-Free",
  observations: "observations",
  days: "days",
  priceTrend: "Price trend",
  average: "average",
  weekly: "Weekly",
  daily: "Daily",
  monthly: "Monthly",
  selectSystem: "Select at least one production system to view trends.",
  cageFreePremium: "Cage-Free premium",
  farmgateToRetail: "Farmgate to Retail",
  matchedVs: "Matched",
  matchedSpread: "Matched spread across",
  cells: "cells",
  insightsTitle: "What this may mean for your farm",
  insightsSubtitle:
    "Evidence-based explanations of observed prices — not predictions.",
  confidence: "confidence",
  confidenceHigh: "high",
  confidenceModerate: "moderate",
  confidenceLow: "low",
  footer: "HealthyFarm · Laying Hen Welfare Network · Prices in VND per egg",
  chartLabel: "Weekly egg price trends",
  regionsTitle: "Regional averages",
  regionObservations: "observations",
};

const vi: Dict = {
  eyebrow: "Thông tin thị trường",
  title: "Tín hiệu giá trứng Việt Nam",
  subtitle:
    "Giá quan sát tại trại và bán lẻ cho trứng nuôi nhốt và không nhốt chuồng. Đây là tín hiệu mô tả, không phải dự báo hay cam kết lợi nhuận.",
  coverage: "Phạm vi dữ liệu",
  sampleData: "Dữ liệu mẫu",
  farmgate: "Giá tại trại",
  retail: "Giá bán lẻ",
  caged: "Nuôi nhốt",
  cageFree: "Không nhốt chuồng",
  observations: "quan sát",
  days: "ngày",
  priceTrend: "Xu hướng giá",
  average: "trung bình",
  weekly: "Tuần",
  daily: "Ngày",
  monthly: "Tháng",
  selectSystem: "Chọn ít nhất một hệ thống chăn nuôi để xem xu hướng.",
  cageFreePremium: "Phụ phí không nhốt chuồng",
  farmgateToRetail: "Từ giá tại trại đến bán lẻ",
  matchedVs: "So khớp",
  matchedSpread: "Chênh lệch so khớp trên",
  cells: "ô dữ liệu",
  insightsTitle: "Điều này có thể nghĩa gì với trang trại của bạn",
  insightsSubtitle:
    "Giải thích dựa trên bằng chứng về giá quan sát — không phải dự đoán.",
  confidence: "độ tin cậy",
  confidenceHigh: "cao",
  confidenceModerate: "trung bình",
  confidenceLow: "thấp",
  footer:
    "HealthyFarm · Mạng lưới phúc lợi gà đẻ trứng · Giá tính bằng VND / quả",
  chartLabel: "Xu hướng giá trứng theo tuần",
  regionsTitle: "Trung bình theo vùng",
  regionObservations: "quan sát",
};

const dictionaries: Record<Locale, Dict> = { en, vi };

export function getMessages(locale: Locale): Dict {
  return dictionaries[locale] ?? dictionaries.en;
}

export function labelPriceLevel(
  locale: Locale,
  level: "Farmgate" | "Retail",
): string {
  const t = getMessages(locale);
  return level === "Farmgate" ? t.farmgate : t.retail;
}

export function labelSystem(
  locale: Locale,
  system: "Caged" | "Cage-Free",
): string {
  const t = getMessages(locale);
  return system === "Caged" ? t.caged : t.cageFree;
}

export function labelConfidence(locale: Locale, value: string): string {
  const t = getMessages(locale);
  const key = value.toLowerCase();
  if (key === "high") return t.confidenceHigh;
  if (key === "moderate") return t.confidenceModerate;
  if (key === "low") return t.confidenceLow;
  return value;
}

export function labelInterval(
  locale: Locale,
  interval: "Daily" | "Weekly" | "Monthly",
): string {
  const t = getMessages(locale);
  if (interval === "Daily") return t.daily;
  if (interval === "Monthly") return t.monthly;
  return t.weekly;
}

type InsightCopy = {
  headline: string;
  observation: string;
  planning_note: string;
  evidence_note: string;
};

const insightCopy: Record<
  string,
  Record<Locale, InsightCopy>
> = {
  "Caged|Retail": {
    en: {
      headline: "Caged retail prices edged higher",
      observation:
        "Matched retail series rose about 3.2% over the latest 28 days versus the prior window.",
      planning_note:
        "Check feed costs and local buyer demand before changing flock plans. This is an observed signal, not a forecast.",
      evidence_note:
        "Based on 18 matched product series across 12 observation days.",
    },
    vi: {
      headline: "Giá bán lẻ trứng nuôi nhốt tăng nhẹ",
      observation:
        "Các chuỗi bán lẻ so khớp tăng khoảng 3,2% trong 28 ngày gần nhất so với cửa sổ trước đó.",
      planning_note:
        "Hãy kiểm tra chi phí thức ăn và nhu cầu người mua địa phương trước khi thay đổi kế hoạch đàn. Đây là tín hiệu quan sát, không phải dự báo.",
      evidence_note:
        "Dựa trên 18 chuỗi sản phẩm so khớp trong 12 ngày quan sát.",
    },
  },
  "Cage-Free|Retail": {
    en: {
      headline: "Cage-Free retail premium held steady",
      observation:
        "Cage-Free retail averaged about 28% above matched Caged listings in the selected period.",
      planning_note:
        "Confirm packing, certification, and buyer requirements before expanding Cage-Free capacity.",
      evidence_note:
        "Based on 22 matched product series across 14 observation days.",
    },
    vi: {
      headline: "Phụ phí bán lẻ không nhốt chuồng vẫn ổn định",
      observation:
        "Giá bán lẻ không nhốt chuồng trung bình cao hơn khoảng 28% so với danh mục nuôi nhốt được so khớp trong kỳ đã chọn.",
      planning_note:
        "Hãy xác nhận đóng gói, chứng nhận và yêu cầu người mua trước khi mở rộng công suất không nhốt chuồng.",
      evidence_note:
        "Dựa trên 22 chuỗi sản phẩm so khớp trong 14 ngày quan sát.",
    },
  },
};

export function translateInsight(
  locale: Locale,
  system: string,
  priceLevel: string,
  fallback: InsightCopy,
): InsightCopy {
  const key = `${system}|${priceLevel}`;
  return insightCopy[key]?.[locale] ?? fallback;
}

export function labelRegion(locale: Locale, region: string): string {
  if (locale !== "vi") return region;
  const map: Record<string, string> = {
    North: "Miền Bắc",
    Central: "Miền Trung",
    South: "Miền Nam",
  };
  return map[region] ?? region;
}
