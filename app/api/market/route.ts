import { NextResponse } from "next/server";
import { getMarketIntelligence } from "@/lib/market/get-market-data";

export async function GET() {
  try {
    const data = await getMarketIntelligence();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Failed to load market intelligence", error);
    return NextResponse.json(
      { error: "Market data is temporarily unavailable." },
      { status: 500 },
    );
  }
}
