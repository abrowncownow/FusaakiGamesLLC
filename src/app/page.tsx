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
    "Factory-sealed display boxes, listed as sourcing and availability are confirmed.",
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
          FusaakiGames is preparing to launch online. Customer, business, and
          supplier inquiries are open.
        </div>
      )}
      <Hero />
      <div className="rule" />
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="What we carry"
            title="A focused catalog for players and collectors."
            body="Sealed products, practical accessories, and curated formats—presented clearly and added only when listings are ready."
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
            title="Clear standards. Dependable service."
          />
          <div className="grid gap-8 md:grid-cols-4">
            {[
              [
                "Authentic sealed products",
                "Our catalog centers on factory-sealed goods sourced through legitimate channels.",
              ],
              [
                "Careful packaging",
                "Every order is packed to protect product condition in transit.",
              ],
              [
                "Clear descriptions",
                "Each listing explains exactly what customers can expect.",
              ],
              [
                "Dependable support",
                "Straightforward help before and after every order.",
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
