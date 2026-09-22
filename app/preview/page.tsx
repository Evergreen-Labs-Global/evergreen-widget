import { PreviewClient } from "@/components/market/preview-client";
import { getMarketIntelligence } from "@/lib/market/get-market-data";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Widget UI Preview | HealthyFarm",
  description:
    "Preview multiple embeddable HealthyFarm market panel layouts for Webflow.",
  robots: { index: false, follow: false },
};

export default async function PreviewPage() {
  const data = await getMarketIntelligence();

  return (
    <main className="min-h-screen bg-[#F7F5F0]">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between text-sm">
          <Link href="/" className="font-serif font-bold text-primary">
            HealthyFarm
          </Link>
          <div className="flex gap-4 text-muted-foreground">
            <Link href="/widget" className="hover:text-foreground">
              Live panel
            </Link>
            <Link href="/dashboard" className="hover:text-foreground">
              Admin
            </Link>
          </div>
        </div>
      </div>
      <PreviewClient data={data} />
    </main>
  );
}
