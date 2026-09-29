"use client";

import type { ReactNode } from "react";
import type { MarketOptions } from "@/lib/market/get-market-data";
import {
  formatDisplayDate,
  selectedPeriod,
  type PanelFilters,
  type PeriodChoice,
} from "@/lib/market/filters";
import { labelPriceLevel, labelSystem, type Locale } from "@/lib/market/i18n";

const PERIODS: { id: PeriodChoice; en: string; vi: string }[] = [
  { id: "all", en: "All available history", vi: "Toàn bộ lịch sử" },
  { id: "years", en: "Choose years", vi: "Chọn năm" },
  { id: "custom", en: "Custom dates", vi: "Ngày cụ thể" },
  { id: "ytd", en: "Year to date (latest data year)", vi: "Từ đầu năm dữ liệu mới nhất" },
  { id: "d30", en: "Latest 30 days", vi: "30 ngày gần nhất" },
  { id: "d90", en: "Latest 90 days", vi: "90 ngày gần nhất" },
  { id: "m12", en: "Latest 12 months", vi: "12 tháng gần nhất" },
  { id: "y2", en: "Latest 2 years", vi: "2 năm gần nhất" },
];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-extrabold text-[#31584F]">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] leading-snug text-[#687587]">{hint}</span> : null}
    </label>
  );
}

const controlClass =
  "w-full rounded-lg border border-[#d5e4de] bg-white px-2.5 py-2 text-sm text-[#24304A] outline-none focus:border-[#0E9E8B]";

export function FilterSidebar({
  locale,
  bounds,
  options,
  filters,
  onChange,
  onReset,
}: {
  locale: Locale;
  bounds: { start: string; end: string };
  options: MarketOptions | null;
  filters: PanelFilters;
  onChange: (next: PanelFilters) => void;
  onReset: () => void;
}) {
  const vi = locale === "vi";
  const years = [];
  for (let year = Number(bounds.start.slice(0, 4)); year <= Number(bounds.end.slice(0, 4)); year += 1) {
    years.push(year);
  }
  const endYears = years.filter((year) => year >= filters.startYear);
  const period = selectedPeriod(filters, bounds);
  const regions = options?.regions ?? [];
  const provinces = options?.provinces ?? [];
  const brands = options?.brands ?? [];

  return (
    <aside className="w-full shrink-0 border-[#e0e9e6] bg-white lg:w-[280px] lg:border-r">
      <div className="space-y-4 p-4 lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto">
        <div>
          <h2 className="text-base font-extrabold text-[#192E6D]">
            {vi ? "Khám phá giá trứng" : "Explore egg prices"}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[#687587]">
            {vi
              ? "Chọn kỳ, địa điểm và hệ thống chăn nuôi. Giá tính bằng VND mỗi quả."
              : "Choose a period, location and production system. Prices are VND per egg."}
          </p>
        </div>

        <Field
          label={vi ? "Kỳ quan sát" : "Coverage period"}
          hint={
            vi
              ? `Lịch sử có sẵn: ${formatDisplayDate(bounds.start, locale)} đến ${formatDisplayDate(bounds.end, locale)}`
              : `Available history: ${formatDisplayDate(bounds.start, locale)} to ${formatDisplayDate(bounds.end, locale)}`
          }
        >
          <select
            className={controlClass}
            value={filters.period}
            onChange={(event) =>
              onChange({ ...filters, period: event.target.value as PeriodChoice })
            }
          >
            {PERIODS.map((item) => (
              <option key={item.id} value={item.id}>
                {vi ? item.vi : item.en}
              </option>
            ))}
          </select>
        </Field>

        {filters.period === "years" ? (
          <div className="grid grid-cols-2 gap-2">
            <Field label={vi ? "Năm bắt đầu" : "Start year"}>
              <select
                className={controlClass}
                value={filters.startYear}
                onChange={(event) => {
                  const startYear = Number(event.target.value);
                  onChange({
                    ...filters,
                    startYear,
                    endYear: Math.max(filters.endYear, startYear),
                  });
                }}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={vi ? "Năm kết thúc" : "End year"}>
              <select
                className={controlClass}
                value={filters.endYear}
                onChange={(event) => onChange({ ...filters, endYear: Number(event.target.value) })}
              >
                {endYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        ) : null}

        {filters.period === "custom" ? (
          <div className="grid grid-cols-1 gap-2">
            <Field label={vi ? "Ngày bắt đầu" : "Start date"}>
              <input
                type="date"
                className={controlClass}
                min={bounds.start}
                max={bounds.end}
                value={filters.startDate}
                onChange={(event) => onChange({ ...filters, startDate: event.target.value })}
              />
            </Field>
            <Field label={vi ? "Ngày kết thúc" : "End date"}>
              <input
                type="date"
                className={controlClass}
                min={bounds.start}
                max={bounds.end}
                value={filters.endDate}
                onChange={(event) => onChange({ ...filters, endDate: event.target.value })}
              />
            </Field>
          </div>
        ) : null}

        {"error" in period ? (
          <p className="rounded-lg bg-[#FFF8E3] px-3 py-2 text-xs text-[#69541B]">
            {vi
              ? "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc."
              : "Start date must be on or before the end date."}
          </p>
        ) : (
          <p className="text-[11px] leading-snug text-[#687587]">
            {vi ? "Kỳ đã chọn: " : "Selected period: "}
            {formatDisplayDate(period.start, locale)} – {formatDisplayDate(period.end, locale)}
          </p>
        )}

        <Field label={vi ? "Mức giá" : "Price level"}>
          <select
            className={controlClass}
            value={filters.priceLevel}
            onChange={(event) =>
              onChange({
                ...filters,
                priceLevel: event.target.value as PanelFilters["priceLevel"],
              })
            }
          >
            <option value="">{vi ? "Tất cả" : "All"}</option>
            <option value="Farmgate">{labelPriceLevel(locale, "Farmgate")}</option>
            <option value="Retail">{labelPriceLevel(locale, "Retail")}</option>
          </select>
        </Field>

        <Field label={vi ? "Vùng" : "Region"}>
          <select
            className={controlClass}
            value={filters.region}
            disabled={!options}
            onChange={(event) => onChange({ ...filters, region: event.target.value, province: "" })}
          >
            <option value="">{vi ? "Tất cả" : "All"}</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </Field>

        <Field label={vi ? "Tỉnh / thành phố" : "Province / city"}>
          <select
            className={controlClass}
            value={filters.province}
            disabled={!options}
            onChange={(event) => onChange({ ...filters, province: event.target.value })}
          >
            <option value="">{vi ? "Tất cả" : "All"}</option>
            {provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </Field>

        <fieldset>
          <legend className="mb-1 text-xs font-extrabold text-[#31584F]">
            {vi ? "Hệ thống chăn nuôi" : "Production system"}
          </legend>
          <div className="space-y-1.5">
            {(["Caged", "Cage-Free"] as const).map((system) => {
              const checked = system === "Caged" ? filters.caged : filters.cageFree;
              return (
                <label key={system} className="flex items-center gap-2 text-sm text-[#24304A]">
                  <input
                    type="checkbox"
                    className="accent-[#0E9E8B]"
                    checked={checked}
                    onChange={(event) =>
                      onChange({
                        ...filters,
                        ...(system === "Caged"
                          ? { caged: event.target.checked }
                          : { cageFree: event.target.checked }),
                      })
                    }
                  />
                  {labelSystem(locale, system)}
                </label>
              );
            })}
          </div>
          <p className="mt-1 text-[11px] leading-snug text-[#687587]">
            {vi
              ? "Quan sát chưa phân loại không vào so sánh hệ thống chăn nuôi."
              : "Unclassified observations are not used in production-system comparisons."}
          </p>
        </fieldset>

        <details className="rounded-lg border border-[#e0e9e6] px-3 py-2">
          <summary className="cursor-pointer text-xs font-extrabold text-[#31584F]">
            {vi ? "Thương hiệu và bộ lọc dữ liệu" : "Brand & data filters"}
          </summary>
          <div className="mt-3 space-y-3">
            <Field label={vi ? "Thương hiệu" : "Brand"}>
              <select
                className={controlClass}
                value={filters.brand}
                disabled={!options}
                onChange={(event) => onChange({ ...filters, brand: event.target.value })}
              >
                <option value="">{vi ? "Tất cả" : "All"}</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex items-start gap-2 text-sm text-[#24304A]">
              <input
                type="checkbox"
                className="mt-0.5 accent-[#0E9E8B]"
                checked={filters.explicitLabelsOnly}
                onChange={(event) =>
                  onChange({ ...filters, explicitLabelsOnly: event.target.checked })
                }
              />
              <span>
                {vi ? "Chỉ nhãn sản phẩm rõ ràng" : "Explicit product labels only"}
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm text-[#24304A]">
              <input
                type="checkbox"
                className="mt-0.5 accent-[#0E9E8B]"
                checked={filters.includeUnavailable}
                onChange={(event) =>
                  onChange({ ...filters, includeUnavailable: event.target.checked })
                }
              />
              <span>{vi ? "Gồm sản phẩm hết hàng" : "Include out-of-stock listings"}</span>
            </label>
          </div>
        </details>

        <Field label={vi ? "Khoảng xu hướng" : "Trend interval"}>
          <select
            className={controlClass}
            value={filters.interval}
            onChange={(event) =>
              onChange({ ...filters, interval: event.target.value as PanelFilters["interval"] })
            }
          >
            <option value="Daily">{vi ? "Ngày" : "Daily"}</option>
            <option value="Weekly">{vi ? "Tuần" : "Weekly"}</option>
            <option value="Monthly">{vi ? "Tháng" : "Monthly"}</option>
          </select>
        </Field>

        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-lg border border-[#d5e4de] px-3 py-2 text-sm font-semibold text-[#192E6D] hover:bg-[#F6F9F7]"
        >
          {vi ? "Đặt lại bộ lọc" : "Reset filters"}
        </button>

        <p className="border-t border-[#e0e9e6] pt-3 text-[11px] leading-relaxed text-[#687587]">
          {vi
            ? "So sánh sản xuất có hai nhóm: nuôi nhốt và không nhốt chuồng."
            : "Production comparisons show two groups: Caged and Cage-Free."}
        </p>
      </div>
    </aside>
  );
}
