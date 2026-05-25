import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://circle-arc-net.vercel.app";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#030712",
};

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Agora Forge | Multichain Portfolio · Bridge · Swap on Arc",
  description:
    "Live multichain USDC portfolio (Zerion, GoldRush, CoinGecko) with Circle CCTP bridge, swap, and send on Arc testnet.",
  keywords: [
    "Circle",
    "Arc",
    "USDC",
    "CCTP",
    "adaptive portfolio",
    "Agora Hackathon",
  ],
  openGraph: {
    title: "Agora Forge",
    description: "Adaptive portfolio + Circle CCTP cross-chain execution",
    url: appUrl,
    siteName: "Agora Forge",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${outfit.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
