"use client";

import { useMemo, useState } from "react";
import type { MarketResponse } from "@/types/market";
import type { Locale } from "@/lib/market/i18n";
import { MarketPanel } from "@/components/market/market-panel";
import { FilterSidebar } from "@/components/market/filter-sidebar";
import {
  WIDGET_VARIANTS,
  WidgetVariant,
  type WidgetVariantId,
} from "@/components/market/widget-variants";
import { useMarketView } from "@/lib/market/use-market-view";
import Link from "next/link";

export function PreviewClient({ data }: { data: MarketResponse }) {
  const [locale, setLocale] = useState<Locale>("en");
  const [active, setActive] = useState<WidgetVariantId>("full");
  const market = useMarketView(data, locale);

  const meta = useMemo(
    () => WIDGET_VARIANTS.find((v) => v.id === active)!,
    [active],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:py-12">
      <header className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          HealthyFarm · UI preview
        </p>
        <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
          {locale === "vi"
            ? "Các kiểu panel thị trường có thể nhúng"
            : "Embeddable market panel options"}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          {locale === "vi"
            ? "Các bố cục dùng cùng phản hồi thị trường đã lọc từ FastAPI — cùng logic với dashboard Streamlit. Chọn kiểu để xem trước trước khi nhúng Webflow."
            : "Layouts use the same filtered FastAPI market response as the Streamlit dashboard. Pick a style to preview before embedding on Webflow."}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLocale("en")}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
              locale === "en"
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-white hover:bg-muted"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLocale("vi")}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
              locale === "vi"
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-white hover:bg-muted"
            }`}
          >
            Tiếng Việt
          </button>
          <Link
            href={`/widget?lang=${locale}`}
            target="_blank"
            className="rounded-full border bg-white px-4 py-1.5 text-sm font-medium hover:bg-muted"
          >
            {locale === "vi" ? "Mở /widget" : "Open live /widget"}
          </Link>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {WIDGET_VARIANTS.map((variant) => {
          const selected = active === variant.id;
          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => setActive(variant.id)}
              className={`rounded-2xl border p-4 text-left transition ${
                selected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                  : "bg-white hover:border-primary/40"
              }`}
            >
              <p className="font-serif text-base font-bold">
                {locale === "vi" ? variant.nameVi : variant.nameEn}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {locale === "vi" ? variant.descVi : variant.descEn}
              </p>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-primary">
                {locale === "vi" ? variant.bestForVi : variant.bestForEn}
              </p>
            </button>
          );
        })}
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-serif text-xl font-bold">
              {locale === "vi" ? meta.nameVi : meta.nameEn}
            </h2>
            <p className="text-sm text-muted-foreground">
              {locale === "vi" ? meta.descVi : meta.descEn}
            </p>
          </div>
          <code className="rounded bg-muted px-2 py-1 text-xs">variant={active}</code>
        </div>

        {active === "full" ? (
          <div className="overflow-hidden rounded-3xl border border-[#e0e9e6] bg-[#F4F7F6]">
            <MarketPanel data={data} locale={locale} framed={false} />
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-[#e0e9e6] bg-[#F4F7F6]">
            <div className="flex min-h-[640px] flex-col lg:flex-row">
              <div className="h-[420px] border-b border-[#e0e9e6] bg-white lg:h-auto lg:w-[300px] lg:border-b-0 lg:border-r">
                <FilterSidebar
                  locale={locale}
                  bounds={market.bounds}
                  options={market.options}
                  filters={market.filters}
                  onChange={market.setFilters}
                  onReset={market.resetFilters}
                />
              </div>
              <div className="relative min-w-0 flex-1 p-4 md:p-5">
                {market.loading ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#F4F7F6]/70">
                    <div className="flex flex-col items-center gap-3 rounded-2xl border bg-white px-5 py-4">
                      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#d5e4de] border-t-[#0E9E8B]" />
                      <p className="text-sm font-semibold text-[#192E6D]">
                        {locale === "vi" ? "Đang cập nhật…" : "Updating…"}
                      </p>
                    </div>
                  </div>
                ) : null}
                {market.error ? (
                  <p className="mb-3 rounded-xl bg-[#FFF8E3] px-3 py-2 text-sm text-[#69541B]">
                    {market.error}
                  </p>
                ) : null}
                <div className={market.loading ? "opacity-55" : ""}>
                  <WidgetVariant id={active} data={market.view} locale={locale} />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-2 rounded-2xl border bg-white p-5 text-sm text-muted-foreground">
        <p className="font-serif text-base font-bold text-foreground">
          {locale === "vi" ? "Cách nhúng (Webflow)" : "How to embed (Webflow)"}
        </p>
        <p>
          {locale === "vi"
            ? "Bản live đầy đủ nằm tại /widget. Iframe dùng chiều cao cố định; bộ lọc bên trái giữ nguyên khi cuộn kết quả."
            : "The live full panel is at /widget. The iframe uses a fixed height; left filters stay put while results scroll."}
        </p>
        <pre className="overflow-x-auto rounded-xl bg-[#1B2A4A] p-4 text-xs text-[#E8C547]">
{`<div id="app" data-height="860"></div>
<script src="https://evergreen-widget.vercel.app/embed.js" async></script>`}
        </pre>
      </section>
    </div>
  );
}
