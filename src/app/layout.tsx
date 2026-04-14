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

export const metadata: Metadata = {
  title: "NychIQ — YouTube Intelligence Platform",
  description: "AI-powered YouTube analytics, viral prediction, and content intelligence for creators and agencies.",
  keywords: ["YouTube", "analytics", "viral", "AI", "content intelligence", "NychIQ"],
  authors: [{ name: "NychIQ Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "NychIQ — YouTube Intelligence Platform",
    description: "AI-powered YouTube analytics, viral prediction, and content intelligence.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${interTight.variable} ${jetbrainsMono.variable} antialiased bg-[#0D0D0D] text-[#FFFFFF]`}
        style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
      >
        {children}
        <SonnerToaster />
      </body>
    </html>
  );
}
