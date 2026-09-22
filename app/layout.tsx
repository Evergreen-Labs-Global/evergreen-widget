import type { Metadata } from "next";
import { Merriweather, Open_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "HealthyFarm",
    template: "%s | HealthyFarm",
  },
  description:
    "Vietnam's Laying Hen Welfare Network — market intelligence, farmer tools, and admin dashboard.",
};

const openSans = Open_Sans({
  variable: "--font-open-sans",
  display: "swap",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  display: "swap",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${openSans.variable} ${merriweather.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
