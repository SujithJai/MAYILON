import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Poppins, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { EstimateProvider } from "@/components/estimate/EstimateProvider";
import { CinematicIntro } from "@/components/fx/CinematicIntro";
import { FireworksBackdrop } from "@/components/fx/FireworksBackdrop";
import { ScrollFuse } from "@/components/fx/ScrollFuse";
import { Footer } from "@/components/layout/Footer";
import { MobileDock } from "@/components/layout/MobileDock";
import { Navbar } from "@/components/layout/Navbar";
import { SITE } from "@/lib/slug";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const body = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Mayilon Crackers — Premium Sivakasi Fireworks | Factory Direct Price",
    template: "%s | Mayilon Crackers",
  },
  description:
    "Premium Sivakasi fireworks direct from the factory. Sky shots, rockets, flower pots, sparklers & gift boxes at up to 80% off MRP. Instant online estimate, wholesale & dealer pricing, safe nationwide dispatch.",
  keywords: [
    "Sivakasi crackers",
    "buy fireworks online",
    "wholesale crackers Tamil Nadu",
    "Deepavali crackers price list",
    "sky shots",
    "Mayilon Crackers",
  ],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: "Mayilon Crackers — Premium Sivakasi Fireworks",
    description:
      "Cinematic fireworks experience + instant estimate platform. Factory-direct Sivakasi quality at up to 80% off MRP.",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mayilon Crackers — Premium Sivakasi Fireworks",
    description: "Factory direct fireworks. Build an estimate in 60 seconds.",
  },
  robots: { index: true, follow: true },
};

const orgSchema = {
  "@context": "https://schema.org",
  "@type": ["Organization", "LocalBusiness"],
  name: SITE.name,
  url: SITE.url,
  telephone: SITE.phone,
  email: SITE.email,
  slogan: SITE.taglineEn,
  address: {
    "@type": "PostalAddress",
    streetAddress: "142, Sattur Main Road",
    addressLocality: "Sivakasi",
    addressRegion: "Tamil Nadu",
    postalCode: "626123",
    addressCountry: "IN",
  },
  areaServed: ["Tamil Nadu", "Karnataka", "Kerala", "Andhra Pradesh", "Telangana", "Puducherry"],
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "1284" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <EstimateProvider>
          <CinematicIntro />
          <FireworksBackdrop />
          <ScrollFuse />
          <Navbar />
          <main className="relative z-10 pt-[106px]">{children}</main>
          <Footer />
          <MobileDock />
        </EstimateProvider>
      </body>
    </html>
  );
}
