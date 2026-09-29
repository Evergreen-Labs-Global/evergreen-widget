import { NextResponse } from "next/server";
import { marketQueryFromSearchParams } from "@/lib/market/filters-query";
import { getMarketIntelligence } from "@/lib/market/get-market-data";

const headers = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  "Access-Control-Allow-Origin": "*",
};

export async function GET(request: Request) {
  try {
    const query = marketQueryFromSearchParams(new URL(request.url).searchParams);
    const data = await getMarketIntelligence(query);
    return NextResponse.json(data, { headers });
  } catch (error) {
    console.error("Failed to load market intelligence", error);
    return NextResponse.json(
      { error: "Market data is temporarily unavailable." },
      { status: 500, headers },
    );
  }
}
