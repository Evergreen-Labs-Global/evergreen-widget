"use client";

import { useMemo, useState } from "react";
import type { MarketResponse } from "@/types/market";
import type { Locale } from "@/lib/market/i18n";
import { MarketPanel } from "@/components/market/market-panel";
import {
  WIDGET_VARIANTS,
  WidgetVariant,
  type WidgetVariantId,
} from "@/components/market/widget-variants";
import Link from "next/link";

export function PreviewClient({ data }: { data: MarketResponse }) {
  const [locale, setLocale] = useState<Locale>("en");
  const [active, setActive] = useState<WidgetVariantId>("full");

  const meta = useMemo(
    () => WIDGET_VARIANTS.find((v) => v.id === active)!,
    [active],
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12 space-y-8">
      <header className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          HealthyFarm · UI preview
        </p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">
          {locale === "vi"
            ? "Các kiểu panel thị trường có thể nhúng"
            : "Embeddable market panel options"}
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          {locale === "vi"
            ? "Các bố cục dưới đây dựa trên cùng dữ liệu mẫu và các phần của dashboard giá trứng (so sánh bán lẻ, KPI, thông tin trang trại, vùng miền, banner). Chọn một kiểu để xem trước — sau đó nhúng trên Webflow."
            : "Layouts below use the same sample data and map to sections from the egg-price dashboard (retail comparison, KPIs, farmer insights, regions, hero banner). Pick a style to preview — then embed on Webflow."}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLocale("en")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium border ${
              locale === "en"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white hover:bg-muted"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLocale("vi")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium border ${
              locale === "vi"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white hover:bg-muted"
            }`}
          >
            Tiếng Việt
          </button>
          <Link
            href={`/widget?lang=${locale}`}
            target="_blank"
            className="rounded-full px-4 py-1.5 text-sm font-medium border bg-white hover:bg-muted"
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
              className={`text-left rounded-2xl border p-4 transition ${
                selected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                  : "bg-white hover:border-primary/40"
              }`}
            >
              <p className="font-serif font-bold text-base">
                {locale === "vi" ? variant.nameVi : variant.nameEn}
              </p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {locale === "vi" ? variant.descVi : variant.descEn}
              </p>
              <p className="text-[11px] text-primary font-semibold mt-3 uppercase tracking-wide">
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
          <code className="text-xs bg-muted px-2 py-1 rounded">
            variant={active}
          </code>
        </div>

        <div className="rounded-3xl bg-[#F7F5F0] border p-3 md:p-5">
          {active === "full" ? (
            <MarketPanel data={data} locale={locale} />
          ) : (
            <WidgetVariant id={active} data={data} locale={locale} />
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 text-sm text-muted-foreground space-y-2">
        <p className="font-serif text-base font-bold text-foreground">
          {locale === "vi" ? "Cách nhúng (Webflow)" : "How to embed (Webflow)"}
        </p>
        <p>
          {locale === "vi"
            ? "Hiện tại bản live đầy đủ nằm tại /widget (tự nhận vi-vn). Các biến thể gọn hơn có thể được xuất thành đường dẫn riêng sau khi bạn chọn."
            : "The live full panel is at /widget (auto language from vi-vn). Compact variants can be published as dedicated routes once you pick a preferred style."}
        </p>
        <pre className="overflow-x-auto rounded-xl bg-[#1B2A4A] text-[#E8C547] p-4 text-xs">
{`<div id="app"></div>
<script src="https://evergreen-widget.vercel.app/embed.js" async></script>`}
        </pre>
      </section>
    </div>
  );
}
