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
    "A veteran-owned Washington retailer specializing in sealed trading card products, curated bundles, and accessories.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: business.displayName,
    title: "FusaakiGames",
    description: "Sealed products. Clear standards. Dependable service.",
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
