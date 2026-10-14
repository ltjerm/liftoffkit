import type { Metadata } from "next";
import { Archivo, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-display", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

// Hides scroll-reveal content only once we know JS will run it back in, and never for reduced-motion users.
const motionBoot = `try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("motion")}catch(e){}`;

export const metadata: Metadata = {
  metadataBase: new URL("https://liftoffkit.app"),
  title: {
    default: "LiftoffKit — Paste a URL, get your launch kit",
    template: "%s · LiftoffKit",
  },
  description:
    "Paste your app URL. Get landing copy, logo & favicon, OG images, store/Product Hunt shots, privacy & terms, and a 7-day X launch plan. $29 Liftoff or $79 Liftoff+ with a hosted landing page set up within 3 business days.",
  keywords: [
    "app launch kit",
    "Product Hunt assets",
    "App Store screenshots",
    "OG images",
    "landing page copy",
    "privacy policy generator",
    "X launch plan",
    "vibe coding",
  ],
  authors: [{ name: "LiftoffKit" }],
  creator: "LiftoffKit",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://liftoffkit.app",
    siteName: "LiftoffKit",
    title: "LiftoffKit — Paste a URL, get your launch kit",
    description:
      "One URL in. Full launch kit out: copy, logo, OG, store shots, legal drafts, and a 7-day X plan. Built for AI builders and vibe coders.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LiftoffKit — Paste a URL, get your launch kit",
    description:
      "One URL in. Full launch kit out: copy, logo, OG, store shots, legal drafts, and a 7-day X plan.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${serif.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionBoot }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
