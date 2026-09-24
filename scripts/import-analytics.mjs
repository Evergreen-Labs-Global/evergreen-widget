/**
 * Load ANALYTICS_EGG_PRICE_DATA.csv into private hf_analytics_observations.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-analytics.mjs path/to/ANALYTICS_EGG_PRICE_DATA.csv
 *
 * Requires the table from supabase/schema.sql to already exist.
 * Uses the service role. Never use the publishable/anon key.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(process.cwd(), ".env"));
loadEnvFile(resolve(process.cwd(), ".env.local"));

const HEADER_TO_COLUMN = {
  "Record ID": "record_id",
  Date: "observed_on",
  "Scrape Timestamp": "scrape_timestamp",
  Source: "source",
  "Source Type": "source_type",
  "Market Level": "market_level",
  Country: "country",
  Region: "region",
  "Region Label": "region_label",
  "Region Raw": "region_raw",
  Province: "province",
  City: "city",
  Location: "location",
  "Store Name": "store_name",
  "Store Address": "store_address",
  "Store Code": "store_code",
  "Store Group Code": "store_group_code",
  Species: "species",
  "Egg Type Raw": "egg_type_raw",
  "Egg Type Normalized": "egg_type_normalized",
  "Egg Type Label": "egg_type_label",
  "Shell Color": "shell_color",
  "Production System": "production_system",
  Brand: "brand",
  "Product Name": "product_name",
  "Item No": "item_no",
  "Pack Size": "pack_size",
  "Egg Count": "egg_count",
  "Price Raw": "price_raw",
  "Buying Price VND": "buying_price_vnd",
  "Selling Price VND": "selling_price_vnd",
  "Pack Price VND": "pack_price_vnd",
  "Price Per Egg VND": "price_per_egg_vnd",
  "Unit Raw": "unit_raw",
  "Unit Normalized": "unit_normalized",
  "Quantity Sold": "quantity_sold",
  "Stock Quantity": "stock_quantity",
  "Feed Cost VND": "feed_cost_vnd",
  "Buyer Type": "buyer_type",
  "Weather Condition": "weather_condition",
  "Event Impact": "event_impact",
  Availability: "availability",
  "Source URL": "source_url",
  "Quality Flag": "quality_flag",
  Notes: "notes",
  "Date Clean": "date_clean",
  "Scrape Timestamp Clean": "scrape_timestamp_clean",
  "Price Level": "price_level",
  "Region Normalized": "region_normalized",
  "Province Normalized": "province_normalized",
  "City Normalized": "city_normalized",
  "Data Origin": "data_origin",
  "Housing System": "housing_system",
  "Housing Label Status": "housing_label_status",
  "Housing Label Basis": "housing_label_basis",
  "Housing Dashboard Eligible": "housing_dashboard_eligible",
  "Egg Count Clean": "egg_count_clean",
  "Price Per Egg VND Clean": "price_per_egg_vnd_clean",
  "Duplicate Flag": "duplicate_flag",
  "Quality Status": "quality_status",
  "Preprocessing Issues": "preprocessing_issues",
  "Analytics Eligible": "analytics_eligible",
  "Analytics Exclusion Reason": "analytics_exclusion_reason",
  Year: "year",
  "Month Number": "month_number",
  Month: "month_label",
  "Year Month": "year_month",
  Quarter: "quarter",
  Week: "week",
  "Day of Week": "day_of_week",
  "Analytics Price Available": "analytics_price_available",
  "Production System Clean": "production_system_clean",
  "Production System Dashboard Eligible": "production_system_dashboard_eligible",
  "Observation Count": "observation_count",
  "Housing Comparison Count": "housing_comparison_count",
  "Market Price VND Clean": "market_price_vnd_clean",
  "Farmgate Price VND Clean": "farmgate_price_vnd_clean",
  "Retail Price VND Clean": "retail_price_vnd_clean",
  "Caged Price VND Clean": "caged_price_vnd_clean",
  "Cage-Free Price VND Clean": "cage_free_price_vnd_clean",
  "Free-Range Price VND Clean": "free_range_price_vnd_clean",
  "Caged Retail Price VND Clean": "caged_retail_price_vnd_clean",
  "Cage-Free Retail Price VND Clean": "cage_free_retail_price_vnd_clean",
  "Free-Range Retail Price VND Clean": "free_range_retail_price_vnd_clean",
};

const DATE_COLUMNS = new Set(["observed_on", "date_clean"]);
const NUMERIC_COLUMNS = new Set([
  "egg_count",
  "buying_price_vnd",
  "selling_price_vnd",
  "pack_price_vnd",
  "price_per_egg_vnd",
  "quantity_sold",
  "stock_quantity",
  "feed_cost_vnd",
  "egg_count_clean",
  "price_per_egg_vnd_clean",
  "year",
  "month_number",
  "week",
  "observation_count",
  "housing_comparison_count",
  "market_price_vnd_clean",
  "farmgate_price_vnd_clean",
  "retail_price_vnd_clean",
  "caged_price_vnd_clean",
  "cage_free_price_vnd_clean",
  "free_range_price_vnd_clean",
  "caged_retail_price_vnd_clean",
  "cage_free_retail_price_vnd_clean",
  "free_range_retail_price_vnd_clean",
]);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((entry) => entry.some((value) => value.length));
}

function coerce(column, value) {
  const text = value.trim();
  if (!text) return null;
  if (DATE_COLUMNS.has(column)) return text.slice(0, 10);
  if (NUMERIC_COLUMNS.has(column)) {
    const number = Number(text);
    return Number.isFinite(number) ? number : null;
  }
  return text;
}

const csvPath = process.argv[2];
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!csvPath) {
  console.error("Pass the analytics CSV path.");
  process.exit(1);
}
if (!url || !serviceKey) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before importing.",
  );
  process.exit(1);
}

const table = parseCsv(readFileSync(resolve(csvPath), "utf8").replace(/^\uFEFF/, ""));
const headers = table[0];
const missing = headers.filter((header) => !HEADER_TO_COLUMN[header]);
if (missing.length) {
  console.error("Unmapped CSV headers:", missing.join(", "));
  process.exit(1);
}

const records = table.slice(1).map((cells) => {
  const record = {};
  headers.forEach((header, index) => {
    record[HEADER_TO_COLUMN[header]] = coerce(HEADER_TO_COLUMN[header], cells[index] ?? "");
  });
  return record;
});

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const batchSize = 400;
let loaded = 0;
for (let start = 0; start < records.length; start += batchSize) {
  const batch = records.slice(start, start + batchSize);
  const { error } = await supabase
    .from("hf_analytics_observations")
    .upsert(batch, { onConflict: "record_id" });
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  loaded += batch.length;
  console.log(`Loaded ${loaded} / ${records.length}`);
}

console.log(`Finished. ${loaded} private analytics rows upserted.`);
