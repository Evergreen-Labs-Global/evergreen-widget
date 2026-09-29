import { NextResponse } from "next/server";
import { getMarketOptions } from "@/lib/market/get-market-data";

export async function GET() {
  try {
    const data = await getMarketOptions();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Failed to load market filter options", error);
    return NextResponse.json(
      { error: "Filter options are temporarily unavailable." },
      { status: 500 },
    );
  }
}
