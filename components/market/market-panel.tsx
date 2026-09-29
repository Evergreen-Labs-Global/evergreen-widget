"use client";

import { useEffect, useMemo, useState } from "react";
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
  formatDisplayDate,
  isDefaultFilters,
  selectedPeriod,
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
      className={`rounded-2xl border p-5 ${limited ? "border-t-4 border-t-[#D3AA22] bg-[#FFFBF1]" : "border-t-4 border-t-[#0E9E8B] bg-white"}`}
    >
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#0A7F70]">
        {labelSystem(locale, insight.system)} · {labelPriceLevel(locale, insight.price_level)} ·{" "}
        {labelConfidence(locale, insight.confidence)} {t.confidence}
      </p>
      <h3 className="font-serif text-lg font-bold text-[#192E6D]">{insight.headline}</h3>
      <p className="mt-2 text-sm text-[#24304A]">{insight.observation}</p>
      <p className="mt-3 text-sm text-[#687587]">{insight.planning_note}</p>
      <p className="mt-3 text-xs text-[#687587]">
        {insight.evidence_note}
        {insight.change_percent != null ? ` · ${formatPercent(insight.change_percent)}` : ""}
      </p>
    </article>
  );
}

function InfoNote({
  title,
  body,
  warn = false,
}: {
  title: string;
  body: string;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${
        warn
          ? "border-[#F0E2B2] border-l-4 border-l-[#D3AA22] bg-[#FFF8E3] text-[#69541B]"
          : "border-[#d6e9df] border-l-4 border-l-[#0E9E8B] bg-[#EDF7F1] text-[#294A43]"
      }`}
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{body}</p>
    </div>
  );
}

function ComparisonCard({
  title,
  comparison,
  locale,
  missingTitle,
  missingBody,
}: {
  title: string;
  comparison: PriceComparison | null;
  locale: Locale;
  missingTitle: string;
  missingBody: string;
}) {
  const t = getMessages(locale);
  if (!comparison) {
    return <InfoNote title={missingTitle} body={missingBody} warn />;
  }
  return (
    <div className="rounded-2xl border border-[#e0e9e6] bg-white p-4">
      <p className="text-sm font-semibold text-[#24304A]">{title}</p>
      <p className="mt-1 font-serif text-3xl font-bold text-[#0E9E8B]">
        {formatPercent(comparison.percent)}
      </p>
      <p className="mt-2 text-sm text-[#687587]">
        {formatVnd(comparison.baseline_price)} → {formatVnd(comparison.target_price)} (
        {formatVnd(comparison.difference)})
        {comparison.cells != null
          ? ` · ${comparison.cells} ${t.cells} · ${comparison.days} ${t.days}`
          : ""}
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <div
      className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#d5e4de] border-t-[#0E9E8B]"
      aria-hidden
    />
  );
}

function activeChips(filters: PanelFilters, bounds: { start: string; end: string }, locale: Locale) {
  const chips: string[] = [];
  const period = selectedPeriod(filters, bounds);
  if (!("error" in period) && filters.period !== "all") {
    chips.push(
      `${formatDisplayDate(period.start, locale)} – ${formatDisplayDate(period.end, locale)}`,
    );
  }
  if (filters.priceLevel) chips.push(labelPriceLevel(locale, filters.priceLevel));
  if (filters.region) chips.push(filters.region);
  if (filters.province) chips.push(filters.province);
  if (!(filters.caged && filters.cageFree)) {
    if (filters.caged) chips.push(labelSystem(locale, "Caged"));
    if (filters.cageFree) chips.push(labelSystem(locale, "Cage-Free"));
  }
  if (filters.brand) chips.push(filters.brand);
  if (filters.explicitLabelsOnly) {
    chips.push(locale === "vi" ? "Nhãn rõ ràng" : "Explicit labels");
  }
  if (filters.includeUnavailable) {
    chips.push(locale === "vi" ? "Gồm hết hàng" : "Incl. out of stock");
  }
  if (filters.interval !== "Weekly") chips.push(labelInterval(locale, filters.interval));
  return chips;
}

export function MarketPanel({
  data,
  locale = "en",
  framed = true,
  onViewChange,
}: {
  data: MarketResponse;
  locale?: Locale;
  compact?: boolean;
  framed?: boolean;
  onViewChange?: (view: MarketResponse) => void;
}) {
  const t = getMessages(locale);
  const bounds = data.meta.dataset_coverage;
  const [tab, setTab] = useState<Tab>("retail");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<PanelFilters>(() =>
    defaultFilters(data.meta.dataset_coverage),
  );
  const [view, setView] = useState(data);
  const [options, setOptions] = useState<MarketOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spreadSystem, setSpreadSystem] = useState<HousingSystem>("Caged");

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
      onViewChange?.(data);
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
          onViewChange?.(body);
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
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [filters, bounds, data, locale, onViewChange]);

  const bothSystems = filters.caged && filters.cageFree;
  const chips = activeChips(filters, bounds, locale);
  const presentSystems = view.retail.summary_by_system.map((row) => row.system);
  const spreadChoices = useMemo(
    () =>
      (["Caged", "Cage-Free"] as HousingSystem[]).filter((system) =>
        Object.prototype.hasOwnProperty.call(view.supply_chain.spreads_by_system, system),
      ),
    [view.supply_chain.spreads_by_system],
  );
  const activeSpread = spreadChoices.includes(spreadSystem)
    ? spreadSystem
    : (spreadChoices[0] ?? "Caged");
  const spread = view.supply_chain.spreads_by_system[activeSpread] ?? null;

  useEffect(() => {
    if (spreadChoices.length && !spreadChoices.includes(spreadSystem)) {
      setSpreadSystem(spreadChoices[0]);
    }
  }, [spreadChoices, spreadSystem]);

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

  const empty = view.coverage.price_observations === 0;
  const shellClass = framed
    ? "flex h-dvh w-full overflow-hidden bg-white text-[#24304A]"
    : "flex h-[min(860px,85vh)] w-full overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white text-[#24304A]";

  return (
    <div lang={locale} className={shellClass}>
      <div className="hidden h-full w-[300px] shrink-0 border-r border-[#ececec] bg-white lg:block">
        <FilterSidebar
          locale={locale}
          bounds={bounds}
          options={options}
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(defaultFilters(bounds))}
        />
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#192E6D]/40"
            aria-label={locale === "vi" ? "Đóng bộ lọc" : "Close filters"}
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[min(100%,340px)] border-r border-[#ececec] bg-white shadow-xl">
            <FilterSidebar
              locale={locale}
              bounds={bounds}
              options={options}
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters(defaultFilters(bounds))}
              onClose={() => setFiltersOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-[#ececec] bg-white px-4 py-3 md:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#0A7F70]">
                {t.eyebrow}
              </p>
              <p className="truncate font-serif text-base font-bold text-[#192E6D] md:text-lg">
                {locale === "vi"
                  ? "Tín hiệu giá trứng Việt Nam"
                  : "Vietnam Egg Price Intelligence"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden rounded-full border border-[#CEE7E1] bg-[#ECF7F2] px-3 py-1 text-[11px] font-extrabold text-[#147D6F] sm:inline">
                {locale === "vi" ? "VI" : "EN"} · {view.meta.policy_version}
              </span>
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="min-h-11 rounded-full bg-[#192E6D] px-4 text-sm font-semibold text-white lg:hidden"
              >
                {locale === "vi" ? "Bộ lọc" : "Filters"}
                {chips.length ? ` · ${chips.length}` : ""}
              </button>
            </div>
          </div>
          {chips.length ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:flex-wrap">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="shrink-0 rounded-full bg-[#EDF5F2] px-3 py-1 text-[11px] font-semibold text-[#31584F]"
                >
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
        </header>

        <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {loading ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/75 backdrop-blur-[1px]">
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#ececec] bg-white px-6 py-5 shadow-sm">
                <Spinner />
                <p className="text-sm font-semibold text-[#192E6D]">
                  {locale === "vi" ? "Đang cập nhật…" : "Updating…"}
                </p>
              </div>
            </div>
          ) : null}

          <div
            className={`space-y-5 p-4 md:p-6 ${loading ? "pointer-events-none opacity-55" : ""}`}
            aria-busy={loading}
          >
            {error ? (
              <p className="rounded-xl border border-[#F0E2B2] bg-[#FFF8E3] px-4 py-3 text-sm text-[#69541B]">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-4 rounded-2xl bg-[#192E6D] p-5 text-white sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold md:text-2xl">
                  {locale === "vi"
                    ? "Hiểu giá trước khi lên kế hoạch bước tiếp theo."
                    : "Understand prices before planning your next move."}
                </h2>
                <p className="mt-2 text-sm text-[#D8E4F5]">
                  {locale === "vi"
                    ? `So sánh trứng nuôi nhốt và không nhốt tại trại và bán lẻ. Kỳ đã chọn: ${formatDisplayDate(view.meta.selected_period.start, locale)} đến ${formatDisplayDate(view.meta.selected_period.end, locale)}.`
                    : `Compare Caged and Cage-Free eggs at farmgate and retail. Selected period: ${formatDisplayDate(view.meta.selected_period.start, locale)} to ${formatDisplayDate(view.meta.selected_period.end, locale)}.`}
                </p>
              </div>
              <div className="sm:border-l sm:border-white/20 sm:pl-5">
                <p className="font-serif text-3xl font-bold text-[#FFD230]">
                  {formatCount(view.coverage.price_observations, locale)}
                </p>
                <p className="text-[11px] uppercase tracking-wide text-[#E0E7F4]">
                  {locale === "vi" ? "Quan sát giá" : "Price observations"}
                </p>
                <p className="mt-1 text-xs text-[#D8E4F5]">
                  {locale === "vi" ? "Mới nhất: " : "Latest in view: "}
                  {view.meta.latest_in_view
                    ? formatDisplayDate(view.meta.latest_in_view, locale)
                    : "—"}
                </p>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-extrabold border ${
                    tab === item.id
                      ? "border-[#0E9E8B] bg-[#0E9E8B] text-white"
                      : "border-[#d5e4de] bg-white text-[#24304A]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {empty ? (
              <InfoNote
                title={
                  locale === "vi" ? "Không có quan sát khớp" : "No matching observations"
                }
                body={
                  locale === "vi"
                    ? "Không có quan sát nào khớp bộ lọc này. Hãy nới khoảng ngày hoặc bỏ một lựa chọn."
                    : "No observations match these filters. Broaden the date range or clear a selection."
                }
                warn
              />
            ) : null}

            {!empty && tab === "retail" ? (
              <div className="space-y-6">
                {presentSystems.length === 0 ? (
                  <InfoNote
                    title={
                      locale === "vi"
                        ? "Không có dữ liệu bán lẻ đã phân loại"
                        : "No classified retail data"
                    }
                    body={
                      locale === "vi"
                        ? "Không có dữ liệu bán lẻ đã phân loại khớp lựa chọn này. Đặt mức giá thành Tất cả hoặc Bán lẻ và nới bộ lọc."
                        : "No classified retail data matches this selection. Set Price level to All or Retail and broaden the filters."
                    }
                  />
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {view.retail.summary_by_system.map((row) => (
                        <article
                          key={row.system}
                          className="rounded-2xl border border-[#DDE8E3] bg-white p-4"
                          style={{ borderTop: `3px solid ${COLORS[row.system]}` }}
                        >
                          <p className="text-xs font-extrabold text-[#637486]">
                            {labelSystem(locale, row.system)} ·{" "}
                            {labelPriceLevel(locale, "Retail")}
                          </p>
                          <p className="mt-1 font-serif text-2xl font-bold text-[#192E6D]">
                            {formatVnd(row.average_price)}
                          </p>
                          <p className="mt-1 text-xs text-[#697687]">
                            {formatCount(row.observations, locale)} {t.observations} · {row.days}{" "}
                            {t.days}
                          </p>
                        </article>
                      ))}
                      <article className="rounded-2xl border border-[#DDE8E3] border-t-[3px] border-t-[#192E6D] bg-white p-4">
                        <p className="text-xs font-extrabold text-[#637486]">
                          {locale === "vi" ? "Thương hiệu" : "Brands represented"}
                        </p>
                        <p className="mt-1 font-serif text-2xl font-bold text-[#192E6D]">
                          {view.coverage.brands}
                        </p>
                        <p className="mt-1 text-xs text-[#697687]">
                          {locale === "vi"
                            ? "Trong mẫu bán lẻ đã chọn"
                            : "In the selected retail sample"}
                        </p>
                      </article>
                    </div>

                    {bothSystems && presentSystems.length === 2 ? (
                      <InfoNote
                        title={
                          locale === "vi"
                            ? "Cách đọc so sánh này"
                            : "How to read this comparison"
                        }
                        body={
                          view.retail.unadjusted_comparison
                            ? locale === "vi"
                              ? `Trung bình Cage-Free trong lựa chọn này ${formatVnd(Math.abs(view.retail.unadjusted_comparison.difference))} mỗi quả ${view.retail.unadjusted_comparison.difference > 0 ? "cao hơn" : "thấp hơn"} (${formatPercent(view.retail.unadjusted_comparison.percent)}) so với Caged. Đây là so sánh mẫu chưa điều chỉnh.`
                              : `The Cage-Free average in this selection is ${formatVnd(Math.abs(view.retail.unadjusted_comparison.difference))} per egg ${view.retail.unadjusted_comparison.difference > 0 ? "higher" : "lower"} (${formatPercent(view.retail.unadjusted_comparison.percent)}) than Caged. This is an unadjusted sample comparison, not proof that housing caused the difference.`
                            : locale === "vi"
                              ? "Chỉ có một hệ thống chăn nuôi đã phân loại trong bộ lọc này."
                              : "Only one classified production system is available under these filters."
                        }
                      />
                    ) : (
                      <InfoNote
                        title={
                          locale === "vi"
                            ? "Cách đọc so sánh này"
                            : "How to read this comparison"
                        }
                        body={
                          locale === "vi"
                            ? "Chỉ có một hệ thống chăn nuôi đã phân loại trong bộ lọc này. Không thể tính phụ phí nếu thiếu nhóm thứ hai."
                            : "Only one classified production system is available under these filters. A premium cannot be calculated without a comparable second group."
                        }
                      />
                    )}

                    <section>
                      <h2 className="font-serif text-xl font-bold text-[#192E6D]">
                        {t.priceTrend}
                      </h2>
                      <p className="mb-3 text-sm text-[#687587]">
                        {labelInterval(locale, view.retail.time_series.interval)} {t.average}.{" "}
                        {locale === "vi"
                          ? "Khoảng trống nghĩa là không có quan sát, không phải giá bằng 0."
                          : "Gaps mean no observations, not a zero price."}
                      </p>
                      <div className="mb-2 flex gap-4 text-xs">
                        {retailSeries.map((s) => (
                          <span key={s.name} className="inline-flex items-center gap-1.5">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ background: s.color }}
                            />
                            {s.name}
                          </span>
                        ))}
                      </div>
                      <div className="rounded-2xl border border-[#e0e9e6] bg-white p-3">
                        <PriceChart series={retailSeries} label={t.chartLabel} />
                      </div>
                    </section>

                    <section className="grid gap-4 md:grid-cols-2">
                      {view.retail.insights.map((insight) => (
                        <InsightCard
                          key={`${insight.system}-${insight.price_level}`}
                          insight={insight}
                          locale={locale}
                        />
                      ))}
                    </section>

                    {bothSystems ? (
                      <section className="space-y-3">
                        <h2 className="font-serif text-xl font-bold text-[#192E6D]">
                          {locale === "vi"
                            ? "Giá bán lẻ Cage-Free cao hơn hay thấp hơn?"
                            : "Is Cage-Free retail pricing higher or lower?"}
                        </h2>
                        <p className="text-sm text-[#687587]">
                          {locale === "vi"
                            ? "So sánh sát hơn dùng ngày, địa điểm và kênh thu thập chồng lấn."
                            : "A closer comparison using overlapping dates, locations and collection channels."}
                        </p>
                        <ComparisonCard
                          locale={locale}
                          title={
                            locale === "vi"
                              ? "Chênh lệch bán lẻ đã so khớp"
                              : "Cage-Free matched retail difference"
                          }
                          comparison={view.retail.matched_housing_comparison}
                          missingTitle={
                            locale === "vi"
                              ? "Cần thêm quan sát chồng lấn"
                              : "More overlapping observations are needed"
                          }
                          missingBody={
                            locale === "vi"
                              ? "Cả hai nhóm phải có trong các nhóm ngày/địa điểm/kênh tương đương. Thiếu một phía không có nghĩa là giá bằng nhau."
                              : "Both groups must be represented in comparable date/location/channel groups. No matched premium is calculated when one side is missing. This does not mean their prices are equal."
                          }
                        />
                      </section>
                    ) : null}

                    <section>
                      <h2 className="mb-3 font-serif text-xl font-bold text-[#192E6D]">
                        {t.regionsTitle}
                      </h2>
                      <div className="overflow-x-auto rounded-xl border border-[#e0e9e6] bg-white">
                        <table className="w-full text-sm">
                          <thead className="bg-[#EDF5F2] text-left text-xs uppercase text-[#31584F]">
                            <tr>
                              <th className="p-3">
                                {locale === "vi" ? "Vùng" : "Region"}
                              </th>
                              <th className="p-3">
                                {locale === "vi" ? "Hệ thống" : "System"}
                              </th>
                              <th className="p-3 text-right">
                                {locale === "vi" ? "TB / quả" : "Avg / egg"}
                              </th>
                              <th className="p-3 text-right">{t.observations}</th>
                              <th className="p-3 text-right">{t.days}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {view.retail.regional_summary.map((row) => (
                              <tr
                                key={`${row.region}-${row.system}`}
                                className="border-t border-[#edf1ee]"
                              >
                                <td className="p-3">{labelRegion(locale, row.region)}</td>
                                <td className="p-3">{labelSystem(locale, row.system)}</td>
                                <td className="p-3 text-right">
                                  {formatVnd(row.average_price)}
                                </td>
                                <td className="p-3 text-right">
                                  {formatCount(row.observations, locale)}
                                </td>
                                <td className="p-3 text-right">{row.days}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    <details className="rounded-xl border border-[#e0e9e6] bg-white p-4">
                      <summary className="cursor-pointer font-serif text-lg font-bold text-[#192E6D]">
                        {locale === "vi" ? "Chi tiết thương hiệu" : "Brand detail"}
                      </summary>
                      <div className="mt-3 max-h-72 overflow-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-[#EDF5F2] text-left text-xs uppercase text-[#31584F]">
                            <tr>
                              <th className="p-3">
                                {locale === "vi" ? "Thương hiệu" : "Brand"}
                              </th>
                              <th className="p-3">
                                {locale === "vi" ? "Hệ thống" : "System"}
                              </th>
                              <th className="p-3 text-right">
                                {locale === "vi" ? "TB / quả" : "Avg / egg"}
                              </th>
                              <th className="p-3 text-right">{t.observations}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {view.retail.brand_summary.map((row, index) => (
                              <tr
                                key={`${row.brand ?? "none"}-${row.system}-${index}`}
                                className="border-t border-[#edf1ee]"
                              >
                                <td className="p-3">
                                  {row.brand ??
                                    (locale === "vi" ? "Không ghi nhận" : "Not recorded")}
                                </td>
                                <td className="p-3">{labelSystem(locale, row.system)}</td>
                                <td className="p-3 text-right">
                                  {formatVnd(row.average_price)}
                                </td>
                                <td className="p-3 text-right">
                                  {formatCount(row.observations, locale)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  </>
                )}
              </div>
            ) : null}

            {!empty && tab === "supply" ? (
              <div className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {view.supply_chain.summary_by_level.map((row) => (
                    <article
                      key={row.price_level}
                      className="rounded-2xl border border-[#DDE8E3] bg-white p-4"
                      style={{ borderTop: `3px solid ${COLORS[row.price_level]}` }}
                    >
                      <p className="text-xs font-extrabold text-[#637486]">
                        {labelPriceLevel(locale, row.price_level)}
                      </p>
                      <p className="mt-1 font-serif text-2xl font-bold text-[#192E6D]">
                        {formatVnd(row.average_price)}
                      </p>
                      <p className="mt-1 text-xs text-[#697687]">
                        {formatCount(row.observations, locale)} {t.observations} · {row.days}{" "}
                        {t.days}
                      </p>
                    </article>
                  ))}
                </div>

                <InfoNote
                  title={
                    locale === "vi"
                      ? "Giá bán tại trại không phải giá kệ"
                      : "Farm selling prices are not shelf prices"
                  }
                  body={
                    locale === "vi"
                      ? "Khoảng cách có thể gồm đóng gói, vận chuyển và phân phối. Bộ dữ liệu này không đo lợi nhuận."
                      : "The gap can include packaging, handling, transport and distribution. This dataset does not measure those costs or profit."
                  }
                />

                <section className="space-y-3">
                  <h2 className="font-serif text-xl font-bold text-[#192E6D]">
                    {locale === "vi"
                      ? "Chênh lệch từ trại đến bán lẻ"
                      : "Farmgate to retail spread"}
                  </h2>
                  {spreadChoices.length ? (
                    <label className="block max-w-xs">
                      <span className="mb-1.5 block text-xs font-extrabold text-[#31584F]">
                        {locale === "vi"
                          ? "Hệ thống cho chênh lệch này"
                          : "Production system for this spread"}
                      </span>
                      <select
                        className="min-h-11 w-full rounded-xl border border-[#d5e4de] bg-white px-3 text-sm"
                        value={activeSpread}
                        onChange={(event) =>
                          setSpreadSystem(event.target.value as HousingSystem)
                        }
                      >
                        {spreadChoices.map((system) => (
                          <option key={system} value={system}>
                            {labelSystem(locale, system)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <ComparisonCard
                    locale={locale}
                    title={`${labelSystem(locale, activeSpread)} · ${t.farmgateToRetail}`}
                    comparison={spread}
                    missingTitle={
                      locale === "vi"
                        ? "Chưa có chênh lệch so sánh được"
                        : "A comparable spread is not available"
                    }
                    missingBody={
                      locale === "vi"
                        ? `${labelSystem(locale, activeSpread)} cần cả quan sát Farmgate và Retail cùng ngày trong cùng vùng. Thiếu dữ liệu không được thay bằng hệ thống khác hay số 0.`
                        : `${labelSystem(locale, activeSpread)} needs both Farmgate and Retail observations on the same dates in the same regions. Missing data is not replaced with a different production system or zero.`
                    }
                  />
                </section>

                <section>
                  <h2 className="mb-3 font-serif text-xl font-bold text-[#192E6D]">
                    {t.priceTrend}
                  </h2>
                  <div className="mb-2 flex gap-4 text-xs">
                    {supplySeries.map((s) => (
                      <span key={s.name} className="inline-flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: s.color }}
                        />
                        {s.name}
                      </span>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-[#e0e9e6] bg-white p-3">
                    <PriceChart series={supplySeries} label={t.chartLabel} />
                  </div>
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
            ) : null}

            {!empty && tab === "coverage" ? (
              <div className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <article className="rounded-2xl border border-[#DDE8E3] bg-white p-4">
                    <p className="text-xs font-extrabold text-[#637486]">
                      {locale === "vi" ? "Quan sát giá" : "Price observations"}
                    </p>
                    <p className="font-serif text-2xl font-bold text-[#192E6D]">
                      {formatCount(view.coverage.price_observations, locale)}
                    </p>
                  </article>
                  <article className="rounded-2xl border border-[#DDE8E3] bg-white p-4">
                    <p className="text-xs font-extrabold text-[#637486]">
                      {locale === "vi" ? "Ngày quan sát" : "Observed dates"}
                    </p>
                    <p className="font-serif text-2xl font-bold text-[#192E6D]">
                      {view.coverage.observed_dates}
                    </p>
                  </article>
                  <article className="rounded-2xl border border-[#DDE8E3] bg-white p-4">
                    <p className="text-xs font-extrabold text-[#637486]">
                      {locale === "vi" ? "Thương hiệu" : "Brands"}
                    </p>
                    <p className="font-serif text-2xl font-bold text-[#192E6D]">
                      {view.coverage.brands}
                    </p>
                  </article>
                </div>

                {view.coverage.unclassified_observations > 0 ? (
                  <p className="text-sm text-[#687587]">
                    {formatCount(view.coverage.unclassified_observations, locale)}{" "}
                    {locale === "vi"
                      ? "quan sát chưa phân loại hệ thống chuồng — không vào so sánh hệ thống chăn nuôi."
                      : "observations await housing classification and are excluded from production-system comparisons."}
                  </p>
                ) : null}

                <div className="overflow-x-auto rounded-xl border border-[#e0e9e6] bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-[#EDF5F2] text-left text-xs uppercase text-[#31584F]">
                      <tr>
                        <th className="p-3">
                          {locale === "vi" ? "Mức giá" : "Price level"}
                        </th>
                        <th className="p-3">
                          {locale === "vi" ? "Hệ thống" : "System"}
                        </th>
                        <th className="p-3 text-right">{t.observations}</th>
                        <th className="p-3 text-right">{t.days}</th>
                        <th className="p-3 text-right">
                          {locale === "vi" ? "TB / quả" : "Avg / egg"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {view.coverage.matrix.map((row) => (
                        <tr
                          key={`${row.price_level}-${row.system}`}
                          className="border-t border-[#edf1ee]"
                        >
                          <td className="p-3">
                            {labelPriceLevel(locale, row.price_level as PriceLevel)}
                          </td>
                          <td className="p-3">{labelSystem(locale, row.system)}</td>
                          <td className="p-3 text-right">
                            {formatCount(row.observations, locale)}
                          </td>
                          <td className="p-3 text-right">{row.days}</td>
                          <td className="p-3 text-right">
                            {formatVnd(row.average_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <InfoNote
                  title={
                    locale === "vi"
                      ? "Hai nhóm cho bảng điều khiển này"
                      : "Two groups for this dashboard"
                  }
                  body={
                    locale === "vi"
                      ? "Caged và Cage-Free là nhóm hiển thị cho khách hàng. Cage-Free là nhóm không nhốt rộng, không đồng nghĩa một tiêu chuẩn chuồng giống hệt."
                      : "Caged and Cage-Free are the client-facing groups. Cage-Free is a broad non-caged category; it does not imply one identical housing standard or certification."
                  }
                />
                <div className="space-y-3 text-sm leading-relaxed text-[#687587]">
                  <p>
                    <strong className="text-[#192E6D]">
                      {locale === "vi" ? "Mức giá: " : "Price levels: "}
                    </strong>
                    {locale === "vi"
                      ? "Nhóm giá thị trường trước đây được trình bày là Farmgate theo xác nhận của khách hàng. Retail vẫn tách biệt."
                      : "The former market-price category is presented as Farmgate following client confirmation. Retail remains separate."}
                  </p>
                  <p>
                    <strong className="text-[#192E6D]">
                      {locale === "vi" ? "Giá trung bình: " : "Average prices: "}
                    </strong>
                    {locale === "vi"
                      ? "Mỗi quan sát hợp lệ có trọng số bằng nhau. Đây không phải chỉ số quốc gia đại diện."
                      : "Each valid observation has equal weight. They are not a representative national index."}
                  </p>
                  <p>
                    <strong className="text-[#192E6D]">
                      {locale === "vi" ? "So sánh so khớp: " : "Matched comparisons: "}
                    </strong>
                    {locale === "vi"
                      ? "Trong cùng hệ thống, farmgate-to-retail cần cùng ngày và vùng. So sánh hệ thống bán lẻ còn khớp kênh thu thập."
                      : "Within the same production system, farmgate-to-retail comparisons require the same date and region. Production-system retail comparisons also match the collection channel."}
                  </p>
                  <p>
                    <strong className="text-[#192E6D]">
                      {locale === "vi" ? "Độ tin cậy: " : "Confidence: "}
                    </strong>
                    {locale === "vi"
                      ? "Limited, Low hoặc Moderate mô tả độ phủ bằng chứng, không phải xác suất giá tương lai."
                      : "Limited, Low or Moderate describes evidence coverage. It is not a probability of future prices."}
                  </p>
                </div>
              </div>
            ) : null}

            <p className="border-t border-[#dfe9e4] pt-4 text-[11px] leading-relaxed text-[#718080]">
              {locale === "vi"
                ? "HealthyFarm / Thông tin giá trứng Việt Nam. Giá quan sát và gợi ý lập kế hoạch — không phải dự báo hay cam kết thu nhập."
                : "HealthyFarm / Vietnam Egg Price Intelligence. Observed prices and planning prompts for informed decisions. Not a forecast or a guarantee of farm income."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
