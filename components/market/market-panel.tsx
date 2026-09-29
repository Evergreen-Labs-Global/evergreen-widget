"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  FarmerInsight,
  HousingSystem,
  MarketResponse,
  PriceComparison,
  PriceLevel,
  TimeSeriesPoint,
} from "@/types/market";
import { FilterSidebar } from "@/components/market/filter-sidebar";
import {
  defaultFilters,
  filtersToQuery,
  isDefaultFilters,
  type PanelFilters,
} from "@/lib/market/filters";
import { marketQueryString } from "@/lib/market/filters-query";
import {
  formatCount,
  formatPercent,
  formatVnd,
  type MarketOptions,
} from "@/lib/market/get-market-data";
import {
  getMessages,
  labelConfidence,
  labelInterval,
  labelPriceLevel,
  labelRegion,
  labelSystem,
  type Locale,
} from "@/lib/market/i18n";

type Tab = "retail" | "supply" | "coverage";

const COLORS: Record<string, string> = {
  Caged: "#8C1E14",
  "Cage-Free": "#0E9E8B",
  Farmgate: "#192E6D",
  Retail: "#0E9E8B",
};

function PriceChart({
  series,
  label,
}: {
  series: { name: string; color: string; points: TimeSeriesPoint[] }[];
  label: string;
}) {
  const all = series.flatMap((s) => s.points.map((p) => p.price));
  if (!all.length) return null;
  const min = Math.min(...all) * 0.92;
  const max = Math.max(...all) * 1.06;
  const width = 680;
  const height = 220;
  const padL = 52;
  const padR = 12;
  const padY = 16;
  const longest = Math.max(...series.map((s) => s.points.length), 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label={label}>
      {[0, 0.5, 1].map((t) => {
        const y = padY + (1 - t) * (height - padY * 2);
        const value = min + t * (max - min);
        return (
          <g key={t}>
            <line x1={padL} x2={width - padR} y1={y} y2={y} stroke="#e5e2d9" />
            <text x={4} y={y + 4} fontSize={10} fill="#6b6b6b">
              {Math.round(value).toLocaleString()}
            </text>
          </g>
        );
      })}
      {series.map((s) => {
        if (!s.points.length) return null;
        const path = s.points
          .map((p, i) => {
            const x =
              padL +
              (i / Math.max(s.points.length - 1, 1)) * (width - padL - padR);
            const y =
              padY + (1 - (p.price - min) / (max - min || 1)) * (height - padY * 2);
            return `${i === 0 ? "M" : "L"}${x},${y}`;
          })
          .join(" ");
        return (
          <path
            key={s.name}
            d={path}
            fill="none"
            stroke={s.color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
      <text x={width - 8} y={height - 2} fontSize={9} fill="#9a9a9a" textAnchor="end">
        {longest} pts
      </text>
    </svg>
  );
}

function InsightCard({
  insight,
  locale,
}: {
  insight: FarmerInsight;
  locale: Locale;
}) {
  const t = getMessages(locale);
  const limited = insight.confidence.toLowerCase() === "limited";
  return (
    <article
      className={`rounded-2xl border p-5 ${limited ? "border-t-4 border-t-[#D3AA22] bg-[#FFFBF1]" : "border-t-4 border-t-primary bg-white"}`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-primary mb-2">
        {labelSystem(locale, insight.system)} · {labelPriceLevel(locale, insight.price_level)} ·{" "}
        {labelConfidence(locale, insight.confidence)} {t.confidence}
      </p>
      <h3 className="font-serif text-lg font-bold">{insight.headline}</h3>
      <p className="text-sm mt-2">{insight.observation}</p>
      <p className="text-sm text-muted-foreground mt-3">{insight.planning_note}</p>
      <p className="text-xs text-muted-foreground mt-3">
        {insight.evidence_note}
        {insight.change_percent != null ? ` · ${formatPercent(insight.change_percent)}` : ""}
      </p>
    </article>
  );
}

function ComparisonNote({
  title,
  comparison,
  locale,
}: {
  title: string;
  comparison: PriceComparison | null;
  locale: Locale;
}) {
  const t = getMessages(locale);
  if (!comparison) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {locale === "vi"
          ? "Chưa đủ dữ liệu chồng lấn để tính chênh lệch so khớp."
          : "Not enough overlapping observations for a matched comparison."}
      </p>
    );
  }
  return (
    <div className="rounded-xl border bg-[#F9F8F3] p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="font-serif text-3xl font-bold text-primary mt-1">
        {formatPercent(comparison.percent)}
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        {formatVnd(comparison.baseline_price)} → {formatVnd(comparison.target_price)} (
        {formatVnd(comparison.difference)})
        {comparison.cells != null
          ? ` · ${comparison.cells} ${t.cells} · ${comparison.days} ${t.days}`
          : ""}
      </p>
    </div>
  );
}

export function MarketPanel({
  data,
  locale = "en",
}: {
  data: MarketResponse;
  locale?: Locale;
  compact?: boolean;
}) {
  const t = getMessages(locale);
  const rootRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>("retail");
  const bounds = data.meta.dataset_coverage;
  const [filters, setFilters] = useState<PanelFilters>(() => defaultFilters(data.meta.dataset_coverage));
  const [view, setView] = useState(data);
  const [options, setOptions] = useState<MarketOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/market/options", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("options");
        setOptions((await response.json()) as MarketOptions);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (isDefaultFilters(filters, bounds)) {
      setView(data);
      setError(null);
      setLoading(false);
      return;
    }

    const query = filtersToQuery(filters, bounds);
    if ("error" in query) {
      setLoading(false);
      setError(
        query.error === "systems"
          ? locale === "vi"
            ? "Chọn ít nhất một hệ thống chăn nuôi."
            : "Select at least one production system."
          : locale === "vi"
            ? "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc."
            : "Start date must be on or before the end date.",
      );
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      fetch(`/api/market${marketQueryString(query)}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error("market");
          const body = (await response.json()) as MarketResponse;
          setView(body);
          setLoading(false);
        })
        .catch((fetchError: unknown) => {
          if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
          setLoading(false);
          setError(
            locale === "vi"
              ? "Không tải được dữ liệu cho bộ lọc này."
              : "Could not load data for these filters.",
          );
        });
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [filters, bounds, data, locale]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const publish = () => {
      const height = Math.ceil(node.getBoundingClientRect().height + 16);
      window.parent?.postMessage(
        { source: "healthyfarm-market", type: "resize", height },
        "*",
      );
    };
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(node);
    return () => observer.disconnect();
  }, [tab, locale, view, loading, error, filters]);

  const retailSeries = useMemo(
    () =>
      view.retail.time_series.series.map((s) => ({
        name: labelSystem(locale, s.system),
        color: COLORS[s.system] ?? "#3A855D",
        points: s.points,
      })),
    [view.retail.time_series.series, locale],
  );

  const supplySeries = useMemo(
    () =>
      view.supply_chain.time_series.series.map((s) => ({
        name: labelPriceLevel(locale, s.price_level),
        color: COLORS[s.price_level] ?? "#3A855D",
        points: s.points,
      })),
    [view.supply_chain.time_series.series, locale],
  );

  const tabs: { id: Tab; label: string }[] = [
    {
      id: "retail",
      label: locale === "vi" ? "So sánh bán lẻ" : "Retail comparison",
    },
    {
      id: "supply",
      label: locale === "vi" ? "Giá tại trại & bán lẻ" : "Farmgate & retail",
    },
    {
      id: "coverage",
      label: locale === "vi" ? "Độ phủ & phương pháp" : "Coverage & methods",
    },
  ];

  return (
    <div
      ref={rootRef}
      lang={locale}
      className="flex w-full flex-col overflow-hidden rounded-2xl border border-[#e0e9e6] bg-[#F6F9F7] text-[#24304A] lg:flex-row"
    >
      <FilterSidebar
        locale={locale}
        bounds={bounds}
        options={options}
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(defaultFilters(bounds))}
      />
      <div className="min-w-0 flex-1 p-4 md:p-6" aria-busy={loading}>
      {loading ? (
        <p className="mb-3 text-xs font-semibold text-[#0A7F70]">
          {locale === "vi" ? "Đang cập nhật bộ lọc…" : "Updating filters…"}
        </p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-lg border border-[#F0E2B2] bg-[#FFF8E3] px-3 py-2 text-sm text-[#69541B]">
          {error}
        </p>
      ) : null}
      {view.coverage.price_observations === 0 ? (
        <p className="mb-3 rounded-lg border border-[#F0E2B2] bg-[#FFF8E3] px-3 py-2 text-sm text-[#69541B]">
          {locale === "vi"
            ? "Không có quan sát nào khớp bộ lọc này. Hãy nới khoảng ngày hoặc bỏ một lựa chọn."
            : "No observations match these filters. Broaden the date range or clear a selection."}
        </p>
      ) : null}
      <header className="mb-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <img
            src="/healthyfarmlogo.png"
            alt="HealthyFarm"
            className="h-12 w-auto"
          />
          <span className="rounded-full border border-[#CEE7E1] bg-[#ECF7F2] px-3 py-1 text-[11px] font-extrabold text-[#147D6F]">
            {locale === "vi" ? "VI" : "EN"} · {view.meta.policy_version}
          </span>
        </div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#0A7F70]">
          {t.eyebrow}
        </p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-[#192E6D] md:text-3xl">
          {locale === "vi" ? "Tín hiệu giá trứng Việt Nam" : "Vietnam Egg Price Intelligence"}
        </h1>
        <div className="mt-4 h-1 rounded-full bg-[linear-gradient(90deg,#0E9E8B_0%,#0E9E8B_75%,#FFD230_75%,#FFD230_100%)]" />
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          {locale === "vi"
            ? `Kỳ đã chọn ${view.meta.selected_period.start} → ${view.meta.selected_period.end}. Mới nhất trong khung nhìn: ${view.meta.latest_in_view}.`
            : `Selected period ${view.meta.selected_period.start} → ${view.meta.selected_period.end}. Latest in view: ${view.meta.latest_in_view}.`}
        </p>
      </header>

      <div className="rounded-2xl bg-[#192E6D] text-white p-5 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold">
            {locale === "vi"
              ? "Hiểu giá trước khi lên kế hoạch bước tiếp theo."
              : "Understand prices before planning your next move."}
          </h2>
          <p className="text-sm text-[#D8E4F5] mt-2">
            {formatCount(view.coverage.price_observations, locale)}{" "}
            {locale === "vi" ? "quan sát giá trong bộ lọc hiện tại." : "price observations in the current view."}
          </p>
        </div>
        <div className="sm:border-l sm:border-white/20 sm:pl-5">
          <p className="font-serif text-2xl font-bold text-[#FFD230]">
            {view.meta.latest_in_view}
          </p>
          <p className="text-[11px] uppercase tracking-wide text-[#E0E7F4]">
            {locale === "vi" ? "Ngày mới nhất" : "Latest in view"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold border ${
              tab === item.id
                ? "bg-primary text-white border-primary"
                : "bg-white text-foreground hover:bg-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "retail" && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {view.retail.summary_by_system.map((row) => (
              <article
                key={row.system}
                className="rounded-2xl border bg-white p-4"
                style={{ borderTop: `3px solid ${COLORS[row.system]}` }}
              >
                <p className="text-xs font-bold text-muted-foreground">
                  {labelSystem(locale, row.system)} · {labelPriceLevel(locale, "Retail")}
                </p>
                <p className="font-serif text-2xl font-bold text-[#192E6D] mt-1">
                  {formatVnd(row.average_price)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCount(row.observations, locale)} {t.observations} · {row.days} {t.days}
                </p>
              </article>
            ))}
            <article className="rounded-2xl border border-t-[3px] border-t-[#192E6D] p-4">
              <p className="text-xs font-bold text-muted-foreground">
                {locale === "vi" ? "Thương hiệu" : "Brands represented"}
              </p>
              <p className="font-serif text-2xl font-bold text-[#192E6D] mt-1">
                {view.coverage.brands}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {locale === "vi" ? "Trong mẫu bán lẻ đã chọn" : "In the selected retail sample"}
              </p>
            </article>
          </div>

          <ComparisonNote
            locale={locale}
            title={
              locale === "vi"
                ? "So sánh bán lẻ chưa điều chỉnh"
                : "Unadjusted retail comparison"
            }
            comparison={view.retail.unadjusted_comparison}
          />

          <section>
            <h2 className="font-serif text-xl font-bold">{t.priceTrend}</h2>
            <p className="text-sm text-muted-foreground mb-3">
              {labelInterval(locale, view.retail.time_series.interval)} {t.average}
            </p>
            <div className="flex gap-4 text-xs mb-2">
              {retailSeries.map((s) => (
                <span key={s.name} className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
              ))}
            </div>
            <PriceChart series={retailSeries} label={t.chartLabel} />
          </section>

          <ComparisonNote
            locale={locale}
            title={
              locale === "vi"
                ? "Chênh lệch nhà ở đã so khớp"
                : "Matched housing comparison"
            }
            comparison={view.retail.matched_housing_comparison}
          />

          <section className="grid gap-4 md:grid-cols-2">
            {view.retail.insights.map((insight) => (
              <InsightCard
                key={`${insight.system}-${insight.price_level}`}
                insight={insight}
                locale={locale}
              />
            ))}
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold mb-3">{t.regionsTitle}</h2>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-[#EDF5F2] text-left text-xs uppercase">
                  <tr>
                    <th className="p-3">{locale === "vi" ? "Vùng" : "Region"}</th>
                    <th className="p-3">{locale === "vi" ? "Hệ thống" : "System"}</th>
                    <th className="p-3 text-right">{locale === "vi" ? "TB / quả" : "Avg / egg"}</th>
                    <th className="p-3 text-right">{t.observations}</th>
                    <th className="p-3 text-right">{t.days}</th>
                  </tr>
                </thead>
                <tbody>
                  {view.retail.regional_summary.map((row) => (
                    <tr key={`${row.region}-${row.system}`} className="border-t">
                      <td className="p-3">{labelRegion(locale, row.region)}</td>
                      <td className="p-3">{labelSystem(locale, row.system)}</td>
                      <td className="p-3 text-right">{formatVnd(row.average_price)}</td>
                      <td className="p-3 text-right">{formatCount(row.observations, locale)}</td>
                      <td className="p-3 text-right">{row.days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold mb-3">
              {locale === "vi" ? "Chi tiết thương hiệu" : "Brand detail"}
            </h2>
            <div className="overflow-x-auto rounded-xl border max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#EDF5F2] text-left text-xs uppercase sticky top-0">
                  <tr>
                    <th className="p-3">{locale === "vi" ? "Thương hiệu" : "Brand"}</th>
                    <th className="p-3">{locale === "vi" ? "Hệ thống" : "System"}</th>
                    <th className="p-3 text-right">{locale === "vi" ? "TB / quả" : "Avg / egg"}</th>
                    <th className="p-3 text-right">{t.observations}</th>
                  </tr>
                </thead>
                <tbody>
                  {view.retail.brand_summary.map((row, index) => (
                    <tr key={`${row.brand ?? "none"}-${row.system}-${index}`} className="border-t">
                      <td className="p-3">
                        {row.brand ?? (locale === "vi" ? "Không ghi nhận" : "Not recorded")}
                      </td>
                      <td className="p-3">{labelSystem(locale, row.system)}</td>
                      <td className="p-3 text-right">{formatVnd(row.average_price)}</td>
                      <td className="p-3 text-right">{formatCount(row.observations, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {tab === "supply" && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {view.supply_chain.summary_by_level.map((row) => (
              <article
                key={row.price_level}
                className="rounded-2xl border p-4"
                style={{ borderTop: `3px solid ${COLORS[row.price_level]}` }}
              >
                <p className="text-xs font-bold text-muted-foreground">
                  {labelPriceLevel(locale, row.price_level)}
                </p>
                <p className="font-serif text-2xl font-bold text-[#192E6D] mt-1">
                  {formatVnd(row.average_price)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCount(row.observations, locale)} {t.observations} · {row.days} {t.days}
                </p>
              </article>
            ))}
          </div>
          <p className="rounded-xl border-l-4 border-l-primary bg-[#EDF7F1] px-4 py-3 text-sm">
            {locale === "vi"
              ? "Giá bán tại trại không phải giá kệ. Khoảng cách có thể gồm đóng gói, vận chuyển và phân phối — bộ dữ liệu này không đo lợi nhuận."
              : "Farm selling prices are not shelf prices. The gap can include packaging, transport and distribution. This dataset does not measure profit."}
          </p>
          <section>
            <h2 className="font-serif text-xl font-bold mb-3">{t.priceTrend}</h2>
            <div className="flex gap-4 text-xs mb-2">
              {supplySeries.map((s) => (
                <span key={s.name} className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
              ))}
            </div>
            <PriceChart series={supplySeries} label={t.chartLabel} />
          </section>
          <section className="grid gap-3 md:grid-cols-2">
            {(Object.entries(view.supply_chain.spreads_by_system) as [
              HousingSystem,
              PriceComparison | null,
            ][]).map(([system, spread]) => (
              <ComparisonNote
                key={system}
                locale={locale}
                title={`${labelSystem(locale, system)} · ${t.farmgateToRetail}`}
                comparison={spread}
              />
            ))}
          </section>
          <section className="grid gap-4 md:grid-cols-2">
            {view.supply_chain.farmgate_insights.map((insight) => (
              <InsightCard
                key={`${insight.system}-${insight.price_level}`}
                insight={insight}
                locale={locale}
              />
            ))}
          </section>
        </div>
      )}

      {tab === "coverage" && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border p-4">
              <p className="text-xs font-bold text-muted-foreground">
                {locale === "vi" ? "Quan sát giá" : "Price observations"}
              </p>
              <p className="font-serif text-2xl font-bold text-[#192E6D]">
                {formatCount(view.coverage.price_observations, locale)}
              </p>
            </article>
            <article className="rounded-2xl border p-4">
              <p className="text-xs font-bold text-muted-foreground">
                {locale === "vi" ? "Ngày quan sát" : "Observed dates"}
              </p>
              <p className="font-serif text-2xl font-bold text-[#192E6D]">
                {view.coverage.observed_dates}
              </p>
            </article>
            <article className="rounded-2xl border p-4">
              <p className="text-xs font-bold text-muted-foreground">
                {locale === "vi" ? "Thương hiệu" : "Brands"}
              </p>
              <p className="font-serif text-2xl font-bold text-[#192E6D]">
                {view.coverage.brands}
              </p>
            </article>
          </div>
          {view.coverage.unclassified_observations > 0 && (
            <p className="text-sm text-muted-foreground">
              {formatCount(view.coverage.unclassified_observations, locale)}{" "}
              {locale === "vi"
                ? "quan sát chưa phân loại hệ thống chuồng — không vào so sánh hệ thống chăn nuôi."
                : "observations await housing classification and are excluded from production-system comparisons."}
            </p>
          )}
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-[#EDF5F2] text-left text-xs uppercase">
                <tr>
                  <th className="p-3">{locale === "vi" ? "Mức giá" : "Price level"}</th>
                  <th className="p-3">{locale === "vi" ? "Hệ thống" : "System"}</th>
                  <th className="p-3 text-right">{t.observations}</th>
                  <th className="p-3 text-right">{t.days}</th>
                  <th className="p-3 text-right">{locale === "vi" ? "TB / quả" : "Avg / egg"}</th>
                </tr>
              </thead>
              <tbody>
                {view.coverage.matrix.map((row) => (
                  <tr key={`${row.price_level}-${row.system}`} className="border-t">
                    <td className="p-3">{labelPriceLevel(locale, row.price_level as PriceLevel)}</td>
                    <td className="p-3">{labelSystem(locale, row.system)}</td>
                    <td className="p-3 text-right">{formatCount(row.observations, locale)}</td>
                    <td className="p-3 text-right">{row.days}</td>
                    <td className="p-3 text-right">{formatVnd(row.average_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            {locale === "vi"
              ? `Phạm vi dữ liệu ${view.meta.dataset_coverage.start} → ${view.meta.dataset_coverage.end}. Khoảng trống trên biểu đồ nghĩa là không có quan sát, không phải giá bằng 0.`
              : `Dataset coverage ${view.meta.dataset_coverage.start} → ${view.meta.dataset_coverage.end}. Chart gaps mean no observations, not a zero price.`}
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
