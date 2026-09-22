"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  HousingSystem,
  MarketIntelligence,
  PriceLevel,
} from "@/types/market";
import { formatPercent, formatVnd } from "@/lib/market/get-market-data";
import {
  getMessages,
  labelConfidence,
  labelInterval,
  labelPriceLevel,
  labelRegion,
  labelSystem,
  translateInsight,
  type Locale,
} from "@/lib/market/i18n";

type Props = {
  data: MarketIntelligence;
  locale?: Locale;
  compact?: boolean;
};

function PriceChart({
  series,
  chartLabel,
}: {
  series: MarketIntelligence["time_series"]["series"];
  chartLabel: string;
}) {
  const allPoints = series.flatMap((s) => s.points.map((p) => p.price));
  const min = Math.min(...allPoints) * 0.96;
  const max = Math.max(...allPoints) * 1.02;
  const width = 640;
  const height = 220;
  const pad = 28;

  const colors: Record<string, string> = {
    Caged: "#3A855D",
    "Cage-Free": "#C4A035",
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      role="img"
      aria-label={chartLabel}
    >
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = pad + (1 - t) * (height - pad * 2);
        const value = min + t * (max - min);
        return (
          <g key={t}>
            <line
              x1={pad}
              x2={width - pad}
              y1={y}
              y2={y}
              stroke="#e5e2d9"
              strokeWidth={1}
            />
            <text
              x={4}
              y={y + 4}
              fontSize={10}
              fill="#6b6b6b"
              fontFamily="Open Sans, sans-serif"
            >
              {Math.round(value).toLocaleString()}
            </text>
          </g>
        );
      })}
      {series.map((s) => {
        const pts = s.points;
        if (!pts.length) return null;
        const path = pts
          .map((p, i) => {
            const x =
              pad + (i / Math.max(pts.length - 1, 1)) * (width - pad * 2);
            const y =
              pad + (1 - (p.price - min) / (max - min)) * (height - pad * 2);
            return `${i === 0 ? "M" : "L"}${x},${y}`;
          })
          .join(" ");
        return (
          <path
            key={s.name}
            d={path}
            fill="none"
            stroke={colors[s.name] ?? "#3A855D"}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}

export function MarketPanel({
  data,
  locale = "en",
  compact = false,
}: Props) {
  const t = getMessages(locale);
  const rootRef = useRef<HTMLDivElement>(null);
  const [priceLevel, setPriceLevel] = useState<PriceLevel>("Retail");
  const [systems, setSystems] = useState<HousingSystem[]>([
    "Caged",
    "Cage-Free",
  ]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof window === "undefined") return;

    const publishHeight = () => {
      const height = Math.ceil(node.getBoundingClientRect().height + 24);
      window.parent?.postMessage(
        { source: "healthyfarm-market", type: "resize", height },
        "*",
      );
    };

    publishHeight();
    const observer = new ResizeObserver(publishHeight);
    observer.observe(node);
    window.addEventListener("load", publishHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("load", publishHeight);
    };
  }, [locale, priceLevel, systems]);

  const summary = useMemo(
    () =>
      data.summary.filter(
        (row) =>
          row.price_level === priceLevel && systems.includes(row.system),
      ),
    [data.summary, priceLevel, systems],
  );

  const chartSeries = useMemo(
    () =>
      data.time_series.series.filter(
        (s) => s.price_level === priceLevel && systems.includes(s.name),
      ),
    [data.time_series.series, priceLevel, systems],
  );

  const insights = useMemo(
    () =>
      data.insights.filter(
        (i) => i.price_level === priceLevel && systems.includes(i.system),
      ),
    [data.insights, priceLevel, systems],
  );

  const maxRegional = Math.max(
    ...data.regional_summary.map((r) => r.average_price),
    1,
  );

  function toggleSystem(system: HousingSystem) {
    setSystems((current) => {
      if (current.includes(system)) {
        if (current.length === 1) return current;
        return current.filter((s) => s !== system);
      }
      return [...current, system];
    });
  }

  return (
    <div
      ref={rootRef}
      lang={locale}
      className={`w-full bg-white text-foreground ${compact ? "p-4" : "p-5 md:p-8"} rounded-2xl border border-[#e8e4da] shadow-sm`}
    >
      <header className="mb-6 md:mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {t.eyebrow}
          </p>
          <span className="rounded-full bg-[#F7F5F0] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
            {locale === "vi" ? "VI" : "EN"}
          </span>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight">
          {t.title}
        </h1>
        <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl">
          {t.subtitle}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {t.coverage} {data.meta.coverage.start} → {data.meta.coverage.end}
          {data.meta.source === "mock" ? ` · ${t.sampleData}` : null}
        </p>
      </header>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex rounded-full border bg-muted/40 p-1">
          {data.filters.price_levels.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setPriceLevel(level)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                priceLevel === level
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-white"
              }`}
            >
              {labelPriceLevel(locale, level)}
            </button>
          ))}
        </div>
        <div className="flex rounded-full border bg-muted/40 p-1">
          {data.filters.systems.map((system) => {
            const active = systems.includes(system);
            return (
              <button
                key={system}
                type="button"
                onClick={() => toggleSystem(system)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-[#C4A035] text-white"
                    : "text-foreground hover:bg-white"
                }`}
              >
                {labelSystem(locale, system)}
              </button>
            );
          })}
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {summary.map((row) => (
          <article
            key={`${row.price_level}-${row.system}`}
            className="rounded-2xl border bg-[#F9F8F3] p-4"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {labelSystem(locale, row.system)} ·{" "}
              {labelPriceLevel(locale, row.price_level)}
            </p>
            <p className="font-serif text-2xl font-bold mt-2 text-primary">
              {formatVnd(row.average_price)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {row.observations.toLocaleString(
                locale === "vi" ? "vi-VN" : "en-US",
              )}{" "}
              {t.observations} · {row.days} {t.days}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border p-4 md:p-5 mb-8">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="font-serif text-xl font-bold">{t.priceTrend}</h2>
            <p className="text-sm text-muted-foreground">
              {labelInterval(locale, data.time_series.interval)} {t.average} ·{" "}
              {labelPriceLevel(locale, priceLevel)}
            </p>
          </div>
          <div className="flex gap-4 text-xs">
            {chartSeries.map((s) => (
              <span key={s.name} className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{
                    background:
                      s.name === "Cage-Free" ? "#C4A035" : "#3A855D",
                  }}
                />
                {labelSystem(locale, s.name)}
              </span>
            ))}
          </div>
        </div>
        {chartSeries.length ? (
          <PriceChart series={chartSeries} chartLabel={t.chartLabel} />
        ) : (
          <p className="text-sm text-muted-foreground py-10 text-center">
            {t.selectSystem}
          </p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 mb-8">
        <article className="rounded-2xl border p-5 bg-[#F9F8F3]">
          <h2 className="font-serif text-lg font-bold mb-2">
            {t.cageFreePremium}
          </h2>
          <p className="font-serif text-3xl font-bold text-primary">
            {formatPercent(data.matched_comparison.housing.percent)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {t.matchedVs}{" "}
            {labelSystem(
              locale,
              data.matched_comparison.housing.baseline as HousingSystem,
            )}{" "}
            vs{" "}
            {labelSystem(
              locale,
              data.matched_comparison.housing.target as HousingSystem,
            )}
            : {formatVnd(data.matched_comparison.housing.baseline_price)} →{" "}
            {formatVnd(data.matched_comparison.housing.target_price)}
          </p>
        </article>
        <article className="rounded-2xl border p-5 bg-[#1B2A4A] text-white">
          <h2 className="font-serif text-lg font-bold mb-2">
            {t.farmgateToRetail}
          </h2>
          <p className="font-serif text-3xl font-bold text-[#E8C547]">
            {formatPercent(data.matched_comparison.supply_chain.percent)}
          </p>
          <p className="text-sm text-white/75 mt-2">
            {t.matchedSpread} {data.matched_comparison.supply_chain.cells}{" "}
            {t.cells} · {data.matched_comparison.supply_chain.days} {t.days}
          </p>
        </article>
      </section>

      <section className="rounded-2xl border p-4 md:p-5 mb-8">
        <h2 className="font-serif text-xl font-bold mb-4">{t.regionsTitle}</h2>
        <div className="space-y-3">
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
              <div className="h-2 rounded-full bg-[#F0EEE6] overflow-hidden">
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
      </section>

      {insights.length > 0 && (
        <section>
          <h2 className="font-serif text-xl font-bold mb-1">
            {t.insightsTitle}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t.insightsSubtitle}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {insights.map((insight) => {
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
                  className="rounded-2xl border p-5"
                >
                  <p className="text-xs uppercase tracking-wide text-primary font-semibold mb-2">
                    {labelSystem(locale, insight.system)} ·{" "}
                    {labelPriceLevel(locale, insight.price_level)} ·{" "}
                    {labelConfidence(locale, insight.confidence)} {t.confidence}
                  </p>
                  <h3 className="font-serif text-lg font-bold">
                    {copy.headline}
                  </h3>
                  <p className="text-sm mt-2 text-foreground/90">
                    {copy.observation}
                  </p>
                  <p className="text-sm mt-3 text-muted-foreground">
                    {copy.planning_note}
                  </p>
                  <p className="text-xs mt-3 text-muted-foreground">
                    {copy.evidence_note}
                    {insight.change_percent != null
                      ? ` · ${formatPercent(insight.change_percent)}`
                      : null}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {!compact && (
        <p className="mt-8 text-xs text-muted-foreground text-center">
          {t.footer}
        </p>
      )}
    </div>
  );
}
