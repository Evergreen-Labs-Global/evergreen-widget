import { ImageResponse } from "next/og";

export const alt = "HealthyFarm";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F7F5F0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 9999,
            backgroundColor: "#3A855D",
            marginBottom: 32,
            color: "white",
            fontSize: 40,
            fontWeight: 700,
          }}
        >
          HF
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#1a1a1a",
            letterSpacing: "-0.02em",
          }}
        >
          HealthyFarm
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#3A855D",
            marginTop: 16,
          }}
        >
          Vietnam Laying Hen Welfare Network
        </div>
      </div>
    ),
    { ...size },
  );
}
