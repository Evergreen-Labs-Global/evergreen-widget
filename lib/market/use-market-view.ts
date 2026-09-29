"use client";

import { useEffect, useState } from "react";
import type { MarketResponse } from "@/types/market";
import {
  defaultFilters,
  filtersToQuery,
  isDefaultFilters,
  type PanelFilters,
} from "@/lib/market/filters";
import { marketQueryString } from "@/lib/market/filters-query";
import type { MarketOptions } from "@/lib/market/get-market-data";
import type { Locale } from "@/lib/market/i18n";

export function useMarketView(data: MarketResponse, locale: Locale) {
  const bounds = data.meta.dataset_coverage;
  const [filters, setFilters] = useState<PanelFilters>(() => defaultFilters(bounds));
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
          setView((await response.json()) as MarketResponse);
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
  }, [filters, bounds, data, locale]);

  return {
    bounds,
    filters,
    setFilters,
    resetFilters: () => setFilters(defaultFilters(bounds)),
    view,
    options,
    loading,
    error,
  };
}
