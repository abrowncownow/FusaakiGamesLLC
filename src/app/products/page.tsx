import type { Metadata } from "next";
import { ProductCard, SectionHeading } from "@/components/Sections";
import { TrademarkDisclaimer } from "@/components/SiteFooter";
export const metadata: Metadata = {
  title: "Products",
  description:
    "Explore the sealed products and accessories planned for the FusaakiGames catalog.",
  alternates: { canonical: "/products/" },
};
const products = [
  [
    "Sealed Booster Packs",
    "Individual factory-sealed packs for players and collectors.",
  ],
  [
    "Three-Pack Booster Bundles",
    "A convenient curated format of three sealed packs.",
  ],
  [
    "Six-Pack Booster Bundles",
    "A larger curated bundle for opening, play, or gifting.",
  ],
  [
    "Factory-Sealed Booster Boxes",
    "Full factory-sealed displays, listed only when sourcing is finalized.",
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
          eyebrow="Planned catalog"
          title="Sealed products, clearly presented."
          body="This preview reflects the categories we intend to carry. It is not a representation of current inventory or availability."
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
