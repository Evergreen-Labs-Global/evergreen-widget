"use client";

import type { MarketResponse } from "@/types/market";
import { formatCount, formatPercent, formatVnd } from "@/lib/market/get-market-data";
import {
  labelPriceLevel,
  labelRegion,
  labelSystem,
  type Locale,
} from "@/lib/market/i18n";

export type WidgetVariantId =
  | "full"
  | "retail-cards"
  | "compact-strip"
  | "insights"
  | "regional"
  | "hero-banner";

export const WIDGET_VARIANTS: {
  id: WidgetVariantId;
  nameEn: string;
  nameVi: string;
  descEn: string;
  descVi: string;
  bestForEn: string;
  bestForVi: string;
}[] = [
  {
    id: "full",
    nameEn: "Full market panel",
    nameVi: "Panel thị trường đầy đủ",
    descEn: "Retail, farmgate, matched spreads, insights, brands, and coverage — v1 contract.",
    descVi: "Bán lẻ, giá tại trại, chênh lệch so khớp, thông tin, thương hiệu và độ phủ — hợp đồng v1.",
    bestForEn: "Prediction / market page body",
    bestForVi: "Nội dung trang dự đoán / thị trường",
  },
  {
    id: "retail-cards",
    nameEn: "Retail comparison",
    nameVi: "So sánh bán lẻ",
    descEn: "Caged vs Cage-Free retail averages and the unadjusted gap.",
    descVi: "Trung bình bán lẻ nuôi nhốt vs không nhốt và khoảng chênh chưa điều chỉnh.",
    bestForEn: "Mid-page market section",
    bestForVi: "Phần thị trường giữa trang",
  },
  {
    id: "compact-strip",
    nameEn: "Coverage matrix strip",
    nameVi: "Dải ma trận độ phủ",
    descEn: "One card per price level and housing system from coverage.matrix.",
    descVi: "Một thẻ cho mỗi mức giá và hệ thống chuồng từ coverage.matrix.",
    bestForEn: "Below the hero",
    bestForVi: "Ngay dưới hero",
  },
  {
    id: "insights",
    nameEn: "Farmer insights",
    nameVi: "Thông tin cho trang trại",
    descEn: "Retail and farmgate planning signals from the sample response.",
    descVi: "Tín hiệu lập kế hoạch bán lẻ và giá tại trại từ phản hồi mẫu.",
    bestForEn: "Member dashboard body",
    bestForVi: "Nội dung bảng điều khiển thành viên",
  },
  {
    id: "regional",
    nameEn: "Regional retail",
    nameVi: "Bán lẻ theo vùng",
    descEn: "North, Central, and South averages by production system.",
    descVi: "Trung bình Bắc, Trung, Nam theo hệ thống chăn nuôi.",
    bestForEn: "Market intelligence block",
    bestForVi: "Khối thông tin thị trường",
  },
  {
    id: "hero-banner",
    nameEn: "Hero + observation count",
    nameVi: "Hero + số quan sát",
    descEn: "Navy banner using coverage.price_observations and the selected period.",
    descVi: "Banner navy dùng coverage.price_observations và kỳ đã chọn.",
    bestForEn: "Top of the prediction page",
    bestForVi: "Đầu trang dự đoán",
  },
];

export function WidgetVariant({
  id,
  data,
  locale,
}: {
  id: WidgetVariantId;
  data: MarketResponse;
  locale: Locale;
}) {
  if (id === "hero-banner") {
    return (
      <div className="rounded-2xl bg-[#192E6D] text-white p-6 md:p-8 flex flex-col md:flex-row md:justify-between gap-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#FFD230] mb-2">
            HealthyFarm
          </p>
          <h2 className="font-serif text-2xl font-bold">
            {locale === "vi"
              ? "Hiểu giá trước khi lên kế hoạch bước tiếp theo."
              : "Understand prices before planning your next move."}
          </h2>
          <p className="text-sm text-[#D8E4F5] mt-2">
            {data.meta.selected_period.start} → {data.meta.selected_period.end}
          </p>
        </div>
        <div>
          <p className="font-serif text-3xl font-bold text-[#FFD230]">
            {formatCount(data.coverage.price_observations, locale)}
          </p>
          <p className="text-xs uppercase tracking-wide text-[#E0E7F4]">
            {locale === "vi" ? "Quan sát giá" : "Price observations"}
          </p>
        </div>
      </div>
    );
  }

  if (id === "compact-strip") {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {data.coverage.matrix.map((row) => (
          <div
            key={`${row.price_level}-${row.system}`}
            className="rounded-xl border bg-white p-3"
          >
            <p className="text-[11px] uppercase text-muted-foreground">
              {labelSystem(locale, row.system)} · {labelPriceLevel(locale, row.price_level)}
            </p>
            <p className="font-serif text-xl font-bold text-primary mt-1">
              {formatVnd(row.average_price)}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (id === "retail-cards") {
    return (
      <div className="rounded-2xl border bg-white p-5 space-y-4">
        <h2 className="font-serif text-xl font-bold">
          {locale === "vi" ? "Giá bán lẻ trung bình" : "Average retail price"}
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {data.retail.summary_by_system.map((row) => (
            <article key={row.system} className="rounded-xl border p-4">
              <p className="text-xs font-bold text-muted-foreground">
                {labelSystem(locale, row.system)}
              </p>
              <p className="font-serif text-2xl font-bold text-[#192E6D]">
                {formatVnd(row.average_price)}
              </p>
            </article>
          ))}
          <article className="rounded-xl border p-4">
            <p className="text-xs font-bold text-muted-foreground">
              {locale === "vi" ? "Chênh chưa điều chỉnh" : "Unadjusted gap"}
            </p>
            <p className="font-serif text-2xl font-bold text-[#192E6D]">
              {formatPercent(data.retail.unadjusted_comparison?.percent)}
            </p>
          </article>
        </div>
      </div>
    );
  }

  if (id === "regional") {
    const max = Math.max(...data.retail.regional_summary.map((r) => r.average_price), 1);
    return (
      <div className="rounded-2xl border bg-white p-5 space-y-4">
        <h2 className="font-serif text-xl font-bold">
          {locale === "vi" ? "Bán lẻ theo vùng" : "Regional retail"}
        </h2>
        {data.retail.regional_summary.map((row) => (
          <div key={`${row.region}-${row.system}`}>
            <div className="flex justify-between text-sm mb-1">
              <span>
                {labelRegion(locale, row.region)} · {labelSystem(locale, row.system)}
              </span>
              <span className="font-semibold text-primary">{formatVnd(row.average_price)}</span>
            </div>
            <div className="h-2 rounded-full bg-[#F0EEE6]">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(row.average_price / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (id === "insights") {
    const insights = [
      ...data.retail.insights,
      ...data.supply_chain.farmgate_insights,
    ];
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {insights.map((insight) => (
          <article
            key={`${insight.price_level}-${insight.system}`}
            className="rounded-2xl border bg-white p-5"
          >
            <p className="text-xs font-bold uppercase text-primary mb-2">
              {labelSystem(locale, insight.system)} · {labelPriceLevel(locale, insight.price_level)} ·{" "}
              {insight.confidence}
            </p>
            <h3 className="font-serif text-lg font-bold">{insight.headline}</h3>
            <p className="text-sm mt-2">{insight.observation}</p>
          </article>
        ))}
      </div>
    );
  }

  return null;
}
