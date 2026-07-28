import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { business } from "@/config/business";
export const metadata: Metadata = {
  metadataBase: new URL(`https://${business.domain}`),
  title: {
    default: "FusaakiGames | Sealed Trading Card Products",
    template: "%s | FusaakiGames",
  },
  description:
    "A Washington-based online retailer focused on sealed trading card game products, curated bundles, and accessories.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: business.displayName,
    title: "FusaakiGames",
    description: "Sealed products. Thoughtfully handled. Built for the hobby.",
  },
  twitter: { card: "summary_large_image" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: business.legalName,
    url: `https://${business.domain}`,
    email: business.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Yelm",
      addressRegion: "WA",
      addressCountry: "US",
    },
  };
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
