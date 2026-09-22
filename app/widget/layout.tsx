import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HealthyFarm Market Intelligence",
};

export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
