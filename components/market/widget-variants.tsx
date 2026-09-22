"use client";

import type { MarketIntelligence } from "@/types/market";
import { formatPercent, formatVnd } from "@/lib/market/get-market-data";
import {
  getMessages,
  labelPriceLevel,
  labelRegion,
  labelSystem,
  translateInsight,
  type Locale,
} from "@/lib/market/i18n";
import type { HousingSystem } from "@/types/market";

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
    nameEn: "Full market dashboard",
    nameVi: "Bảng thị trường đầy đủ",
    descEn:
      "Filters, KPI cards, trend chart, premiums, regions, and farmer insights.",
    descVi:
      "Bộ lọc, thẻ KPI, biểu đồ xu hướng, phụ phí, vùng miền và thông tin cho trang trại.",
    bestForEn: "Dedicated market / prediction page",
    bestForVi: "Trang thị trường / dự đoán chuyên dụng",
  },
  {
    id: "retail-cards",
    nameEn: "Retail comparison cards",
    nameVi: "Thẻ so sánh giá bán lẻ",
    descEn: "Caged vs Cage-Free retail averages with a simple bar comparison.",
    descVi: "Trung bình bán lẻ nuôi nhốt vs không nhốt kèm so sánh cột đơn giản.",
    bestForEn: "Mid-page section on What We Offer",
    bestForVi: "Phần giữa trang Chúng tôi cung cấp",
  },
  {
    id: "compact-strip",
    nameEn: "Compact KPI strip",
    nameVi: "Dải KPI gọn",
    descEn: "Four headline prices in one horizontal strip — minimal height.",
    descVi: "Bốn mức giá nổi bật trên một dải ngang — chiều cao tối thiểu.",
    bestForEn: "Below hero or above fold",
    bestForVi: "Dưới hero hoặc phần đầu trang",
  },
  {
    id: "insights",
    nameEn: "Farmer insight cards",
    nameVi: "Thẻ thông tin cho trang trại",
    descEn: "Planning-focused explanations without charts.",
    descVi: "Giải thích hướng lập kế hoạch, không có biểu đồ.",
    bestForEn: "Member / farmer dashboard body",
    bestForVi: "Nội dung bảng điều khiển thành viên / trang trại",
  },
  {
    id: "regional",
    nameEn: "Regional snapshot",
    nameVi: "Ảnh chụp theo vùng",
    descEn: "North / Central / South average prices with progress bars.",
    descVi: "Giá trung bình Bắc / Trung / Nam với thanh tiến độ.",
    bestForEn: "Impact or market intelligence section",
    bestForVi: "Phần tác động hoặc thông tin thị trường",
  },
  {
    id: "hero-banner",
    nameEn: "Hero banner + stats",
    nameVi: "Banner hero + thống kê",
    descEn:
      "Navy banner with planning headline and observation count (Streamlit-style).",
    descVi:
      "Banner xanh navy với tiêu đề lập kế hoạch và số lượng quan sát (kiểu Streamlit).",
    bestForEn: "Top of prediction page",
    bestForVi: "Đầu trang dự đoán",
  },
];

function MiniBars({
  caged,
  cageFree,
}: {
  caged: number;
  cageFree: number;
}) {
  const max = Math.max(caged, cageFree, 1);
  return (
    <div className="space-y-3 mt-4">
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span>Caged</span>
          <span className="font-semibold text-[#8C1E14]">
            {formatVnd(caged)}
          </span>
        </div>
        <div className="h-3 rounded-full bg-[#F0EEE6] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#8C1E14]"
            style={{ width: `${(caged / max) * 100}%` }}
          />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span>Cage-Free</span>
          <span className="font-semibold text-[#0E9E8B]">
            {formatVnd(cageFree)}
          </span>
        </div>
        <div className="h-3 rounded-full bg-[#F0EEE6] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#0E9E8B]"
            style={{ width: `${(cageFree / max) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function WidgetVariant({
  id,
  data,
  locale,
}: {
  id: WidgetVariantId;
  data: MarketIntelligence;
  locale: Locale;
}) {
  const t = getMessages(locale);
  const retailCaged = data.summary.find(
    (r) => r.price_level === "Retail" && r.system === "Caged",
  );
  const retailCageFree = data.summary.find(
    (r) => r.price_level === "Retail" && r.system === "Cage-Free",
  );
  const farmgateCaged = data.summary.find(
    (r) => r.price_level === "Farmgate" && r.system === "Caged",
  );
  const farmgateCageFree = data.summary.find(
    (r) => r.price_level === "Farmgate" && r.system === "Cage-Free",
  );
  const totalObs = data.summary.reduce((sum, r) => sum + r.observations, 0);
  const maxRegional = Math.max(
    ...data.regional_summary.map((r) => r.average_price),
    1,
  );
  const housing = data.matched_comparison.housing;

  if (id === "compact-strip") {
    const cells = [
      {
        label: `${labelSystem(locale, "Caged")} · ${labelPriceLevel(locale, "Retail")}`,
        value: retailCaged?.average_price,
      },
      {
        label: `${labelSystem(locale, "Cage-Free")} · ${labelPriceLevel(locale, "Retail")}`,
        value: retailCageFree?.average_price,
      },
      {
        label: `${labelSystem(locale, "Caged")} · ${labelPriceLevel(locale, "Farmgate")}`,
        value: farmgateCaged?.average_price,
      },
      {
        label: `${labelSystem(locale, "Cage-Free")} · ${labelPriceLevel(locale, "Farmgate")}`,
        value: farmgateCageFree?.average_price,
      },
    ];
    return (
      <div className="w-full rounded-2xl border bg-white p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cells.map((cell) => (
          <div
            key={cell.label}
            className="rounded-xl bg-[#F9F8F3] border px-3 py-3"
          >
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {cell.label}
            </p>
            <p className="font-serif text-xl font-bold text-primary mt-1">
              {formatVnd(cell.value)}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (id === "hero-banner") {
    return (
      <div className="w-full rounded-2xl overflow-hidden bg-[#192E6D] text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="max-w-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#FFD230] mb-2">
            HealthyFarm
          </p>
          <h2 className="font-serif text-2xl md:text-3xl font-bold leading-snug">
            {locale === "vi"
              ? "Hiểu giá trước khi lên kế hoạch bước tiếp theo."
              : "Understand prices before planning your next move."}
          </h2>
          <p className="mt-3 text-sm text-[#D8E4F5] leading-relaxed">
            {locale === "vi"
              ? "So sánh trứng nuôi nhốt và không nhốt chuồng ở mức giá tại trại và bán lẻ."
              : "Compare Caged and Cage-Free eggs at farmgate and retail."}
          </p>
        </div>
        <div className="md:border-l md:border-white/20 md:pl-8 min-w-[140px]">
          <p className="font-serif text-3xl font-bold text-[#FFD230]">
            {totalObs.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")}
          </p>
          <p className="text-[11px] uppercase tracking-wide text-[#E0E7F4] mt-1">
            {locale === "vi" ? "Quan sát giá" : "Price observations"}
          </p>
          <p className="text-xs text-[#D8E4F5] mt-2">
            {t.coverage} {data.meta.coverage.end}
          </p>
        </div>
      </div>
    );
  }

  if (id === "retail-cards") {
    return (
      <div className="w-full rounded-2xl border bg-white p-5 md:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary mb-2">
          {t.eyebrow}
        </p>
        <h2 className="font-serif text-xl font-bold mb-1">
          {locale === "vi"
            ? "So sánh giá bán lẻ theo hệ thống chăn nuôi"
            : "Average retail price by production system"}
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          {locale === "vi"
            ? "Trung bình mẫu — chưa điều chỉnh theo sản phẩm hoặc địa điểm."
            : "Unadjusted sample averages — not proof of causation."}
        </p>
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <article className="rounded-xl border border-t-[3px] border-t-[#8C1E14] p-4">
            <p className="text-xs font-bold text-muted-foreground">
              {labelSystem(locale, "Caged")}
            </p>
            <p className="font-serif text-2xl font-bold text-[#192E6D] mt-1">
              {formatVnd(retailCaged?.average_price)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {retailCaged?.observations.toLocaleString()} {t.observations}
            </p>
          </article>
          <article className="rounded-xl border border-t-[3px] border-t-[#0E9E8B] p-4">
            <p className="text-xs font-bold text-muted-foreground">
              {labelSystem(locale, "Cage-Free")}
            </p>
            <p className="font-serif text-2xl font-bold text-[#192E6D] mt-1">
              {formatVnd(retailCageFree?.average_price)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {retailCageFree?.observations.toLocaleString()} {t.observations}
            </p>
          </article>
          <article className="rounded-xl border border-t-[3px] border-t-[#192E6D] p-4">
            <p className="text-xs font-bold text-muted-foreground">
              {t.cageFreePremium}
            </p>
            <p className="font-serif text-2xl font-bold text-[#192E6D] mt-1">
              {formatPercent(housing.percent)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {housing.cells} {t.cells} · {housing.days} {t.days}
            </p>
          </article>
        </div>
        {retailCaged && retailCageFree ? (
          <MiniBars
            caged={retailCaged.average_price}
            cageFree={retailCageFree.average_price}
          />
        ) : null}
      </div>
    );
  }

  if (id === "regional") {
    return (
      <div className="w-full rounded-2xl border bg-white p-5 md:p-6">
        <h2 className="font-serif text-xl font-bold mb-4">{t.regionsTitle}</h2>
        <div className="space-y-4">
          {data.regional_summary.map((row) => (
            <div key={row.region}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">
                  {labelRegion(locale, row.region)}
                </span>
                <span className="text-primary font-semibold">
                  {formatVnd(row.average_price)}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[#F0EEE6] overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${(row.average_price / maxRegional) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {row.observations.toLocaleString(
                  locale === "vi" ? "vi-VN" : "en-US",
                )}{" "}
                {t.regionObservations}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === "insights") {
    return (
      <div className="w-full rounded-2xl border bg-white p-5 md:p-6">
        <h2 className="font-serif text-xl font-bold mb-1">{t.insightsTitle}</h2>
        <p className="text-sm text-muted-foreground mb-5">
          {t.insightsSubtitle}
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {data.insights.map((insight) => {
            const copy = translateInsight(
              locale,
              insight.system,
              insight.price_level,
              {
                headline: insight.headline,
                observation: insight.observation,
                planning_note: insight.planning_note,
                evidence_note: insight.evidence_note,
              },
            );
            return (
              <article
                key={`${insight.system}-${insight.price_level}`}
                className="rounded-xl border border-t-4 border-t-primary bg-[#F9FCFB] p-5"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-primary mb-2">
                  {labelSystem(locale, insight.system as HousingSystem)} ·{" "}
                  {labelPriceLevel(locale, insight.price_level)}
                </p>
                <h3 className="font-serif text-lg font-bold">{copy.headline}</h3>
                <p className="text-sm mt-2">{copy.observation}</p>
                <p className="text-sm text-muted-foreground mt-3">
                  {copy.planning_note}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  // full — reuse outer MarketPanel via dynamic import would be circular;
  // render a note that full variant is the live /widget. For preview we
  // show a condensed full layout mirroring MarketPanel sections.
  return (
    <div className="w-full rounded-2xl border bg-white p-5 md:p-6 space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary mb-1">
          {t.eyebrow}
        </p>
        <h2 className="font-serif text-2xl font-bold">{t.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {data.summary.map((row) => (
          <div
            key={`${row.price_level}-${row.system}`}
            className="rounded-xl bg-[#F9F8F3] border p-3"
          >
            <p className="text-[11px] text-muted-foreground">
              {labelSystem(locale, row.system)} ·{" "}
              {labelPriceLevel(locale, row.price_level)}
            </p>
            <p className="font-serif text-xl font-bold text-primary mt-1">
              {formatVnd(row.average_price)}
            </p>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-xl border bg-[#F9F8F3] p-4">
          <p className="text-sm font-semibold">{t.cageFreePremium}</p>
          <p className="font-serif text-3xl font-bold text-primary mt-1">
            {formatPercent(housing.percent)}
          </p>
        </div>
        <div className="rounded-xl bg-[#1B2A4A] text-white p-4">
          <p className="text-sm font-semibold">{t.farmgateToRetail}</p>
          <p className="font-serif text-3xl font-bold text-[#E8C547] mt-1">
            {formatPercent(data.matched_comparison.supply_chain.percent)}
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        {locale === "vi"
          ? "Bản đầy đủ có bộ lọc và biểu đồ tại /widget"
          : "Interactive filters + chart live at /widget"}
      </p>
    </div>
  );
}
