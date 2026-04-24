import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "syncfit — Miami moves in sync",
  description:
    "The one app for Miami's boutique fitness community. Discover, book, and organize every studio you love — with an AI coach that plans your week.",
  applicationName: "syncfit",
  appleWebApp: { capable: true, title: "syncfit", statusBarStyle: "black-translucent" },
  openGraph: {
    title: "syncfit — Miami moves in sync",
    description: "Boutique fitness, one calendar.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAFAF7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="bg-paper text-ink-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
