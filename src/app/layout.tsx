import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
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
        className={`${inter.variable} antialiased bg-[#0D0D0D] text-[#E8E8E8]`}
        style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
      >
        {children}
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  );
}
