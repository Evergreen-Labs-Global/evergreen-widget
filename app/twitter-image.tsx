import { ImageResponse } from "next/og";

export const alt = "Evergreen Widget";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
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
          }}
        >
          <div
            style={{
              width: 40,
              height: 56,
              borderRadius: "50% 50% 50% 0",
              backgroundColor: "#F7F5F0",
              transform: "rotate(-45deg)",
            }}
          />
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#1a1a1a",
            letterSpacing: "-0.02em",
          }}
        >
          Evergreen Widget
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#3A855D",
            marginTop: 16,
          }}
        >
          Analytics dashboard and embedded widgets
        </div>
      </div>
    ),
    { ...size },
  );
}
