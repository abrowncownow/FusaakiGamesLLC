import type { Metadata } from "next";
import { ProductCard, SectionHeading } from "@/components/Sections";
import { TrademarkDisclaimer } from "@/components/SiteFooter";
export const metadata: Metadata = {
  title: "Products",
  description:
    "Explore the sealed product, curated bundle, and accessory categories from FusaakiGames.",
  alternates: { canonical: "/products/" },
};
const products = [
  [
    "Sealed Booster Packs",
    "Individual factory-sealed packs for players and collectors.",
  ],
  [
    "Three-Pack Booster Bundles",
    "A straightforward curated format of three sealed packs.",
  ],
  [
    "Six-Pack Booster Bundles",
    "A six-pack format suited to opening, play, or gifting.",
  ],
  [
    "Factory-Sealed Booster Boxes",
    "Factory-sealed displays, listed after sourcing and availability are confirmed.",
  ],
  [
    "Sleeves and Storage Accessories",
    "Practical protection and organization for treasured cards.",
  ],
];
export default function Products() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Catalog preview"
          title="Sealed products. Clear expectations."
          body="A preview of the core categories we are preparing to offer. Current inventory and availability will appear only when listings are live."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map(([t, d]) => (
            <ProductCard key={t} title={t} description={d} />
          ))}
        </div>
        <div className="card mt-10 p-6">
          <TrademarkDisclaimer />
        </div>
      </div>
    </section>
  );
}
