import { MarketPanel } from "@/components/market/market-panel";
import { getMarketIntelligence } from "@/lib/market/get-market-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HealthyFarm Market Intelligence",
  description:
    "Vietnam egg price signals for Farmgate and Retail, Caged and Cage-Free.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function WidgetPage() {
  const data = await getMarketIntelligence();

  return (
    <main className="min-h-screen bg-[#F7F5F0] p-3 md:p-4">
      <MarketPanel data={data} />
    </main>
  );
}
