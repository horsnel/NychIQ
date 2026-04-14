import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
  weight: ["700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://nychiq.pages.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: "NychIQ - YouTube Analytics & Intelligence Tool | Video Insights, Growth Tools",
  description:
    "AI-powered YouTube analytics platform. Predict viral videos, discover trending niches, optimize content with AI, and outsmart the algorithm. 2.4M+ videos indexed, 17 intelligence modules.",
  keywords: [
    "YouTube analytics",
    "YouTube intelligence",
    "viral prediction",
    "YouTube growth",
    "content strategy",
    "YouTube SEO",
    "AI tools",
    "NychIQ",
    "trending videos",
    "channel audit",
    "YouTube creator tools",
    "video ideas generator",
    "hook generator",
    "thumbnail analyzer",
  ],

  authors: [{ name: "NychIQ Team", url: SITE_URL }],
  creator: "NychIQ",
  publisher: "NychIQ",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },

  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },

  manifest: "/manifest.json",

  openGraph: {
    title: "NychIQ - YouTube Analytics & Intelligence Tool",
    description:
      "AI-powered YouTube analytics. Predict viral videos, discover trending niches, and outsmart the algorithm. 17 intelligence modules for creators and agencies.",
    url: SITE_URL,
    siteName: "NychIQ",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1024,
        height: 1024,
        alt: "NychIQ - YouTube Intelligence Platform",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "NychIQ - YouTube Analytics & Intelligence Tool",
    description:
      "AI-powered YouTube analytics. Predict viral videos, discover trending niches, and outsmart the algorithm.",
    images: ["/og-image.png"],
    creator: "@NychIQ",
  },

  other: {
    "theme-color": "#0D0D0D",
    "color-scheme": "dark",
  },

  alternates: {
    canonical: SITE_URL,
  },
};

export const viewport = {
  width: "device-width" as const,
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0D0D0D",
};

/* ── JSON-LD Structured Data ── */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "NychIQ",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.svg`,
        width: 512,
        height: 512,
      },
      description:
        "AI-powered YouTube intelligence platform for creators and agencies.",
      sameAs: [],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: "NychIQ",
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "15000",
        highPrice: "150000",
        priceCurrency: "NGN",
        offerCount: 4,
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "3200",
        bestRating: "5",
        worstRating: "1",
      },
      description:
        "AI-powered YouTube analytics platform with 17 intelligence modules for viral prediction, content optimization, and channel growth.",
      featureList: [
        "Viral Score Prediction",
        "Live Trend Radar",
        "SEO Toolkit",
        "Hook Generator",
        "Channel Audit",
        "Niche Discovery",
        "AI Script Studio",
        "Competitor Tracking",
        "Revenue Forecaster",
        "Algorithm Intel",
        "Best Post Time",
        "Thumbnail Lab",
        "Video Ideas Generator",
        "Keyword Explorer",
        "Outlier Detection",
        "AI Assistant",
        "Auto Tasks",
      ],
    },
    {
      "@type": "WebPage",
      "@id": SITE_URL,
      url: SITE_URL,
      name: "NychIQ - YouTube Analytics & Intelligence Tool",
      description:
        "AI-powered YouTube analytics platform. Predict viral videos, discover trending niches, and outsmart the algorithm.",
      isPartOf: { "@id": `${SITE_URL}/#organization` },
      about: { "@id": `${SITE_URL}/#software` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.variable} ${interTight.variable} ${jetbrainsMono.variable} antialiased bg-[#0D0D0D] text-[#FFFFFF]`}
        style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#F6A828] focus:text-black focus:rounded-lg focus:font-semibold focus:text-sm"
        >
          Skip to main content
        </a>
        {children}
        <SonnerToaster />
      </body>
    </html>
  );
}
