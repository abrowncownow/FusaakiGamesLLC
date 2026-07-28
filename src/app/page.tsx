import { business } from "@/config/business";
import { CategoryCard, CTA, Hero, SectionHeading } from "@/components/Sections";
const cats = [
  ["Sealed Booster Packs", "Factory-sealed packs from collectible card games."],
  [
    "Curated Pack Bundles",
    "Thoughtfully assembled multi-pack formats for convenient collecting.",
  ],
  [
    "Booster Boxes",
    "Factory-sealed display boxes when sourcing and listings are finalized.",
  ],
  [
    "Trading Card Accessories",
    "Sleeves, storage, and practical tools that protect a collection.",
  ],
];
export default function Home() {
  return (
    <>
      {business.features.showLaunchingSoonBanner && (
        <div className="bg-[#8f3028] py-2 text-center text-sm font-semibold">
          Our online store is launching soon. Business and supplier inquiries
          are open.
        </div>
      )}
      <Hero />
      <div className="rule" />
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="What we carry"
            title="Built around the collecting experience."
            body="A focused catalog designed for players, collectors, and gift-givers—with availability added only when listings are ready."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {cats.map(([title, description], index) => (
              <CategoryCard
                key={title}
                index={index + 1}
                title={title}
                description={description}
              />
            ))}
          </div>
        </div>
      </section>
      <section className="section bg-[#161511]">
        <div className="container">
          <SectionHeading
            eyebrow="Why FusaakiGames"
            title="Simple standards. Earned trust."
          />
          <div className="grid gap-8 md:grid-cols-4">
            {[
              [
                "Authentic sealed products",
                "We focus on factory-sealed goods sourced through legitimate channels.",
              ],
              [
                "Careful packaging",
                "Orders will be packed to protect condition through transit.",
              ],
              [
                "Clear descriptions",
                "Listings will explain exactly what customers can expect.",
              ],
              [
                "Reliable support",
                "Straightforward help before and after an order.",
              ],
            ].map(([t, d]) => (
              <div key={t}>
                <h3 className="font-bold text-[#c9a45c]">{t}</h3>
                <p className="muted mt-2 text-sm">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CTA />
    </>
  );
}
