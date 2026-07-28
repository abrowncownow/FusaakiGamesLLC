import Link from "next/link";
import { business } from "@/config/business";
import { CTA, SectionHeading } from "@/components/Sections";
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
      <section className="relative overflow-hidden py-24 md:py-36">
        <div className="absolute inset-0 [background-image:linear-gradient(30deg,transparent_49%,#c9a45c22_50%,transparent_51%)] [background-size:70px_70px] opacity-30" />
        <div className="relative container">
          <p className="eyebrow">
            Sealed. Thoughtful. Ready for the next game.
          </p>
          <h1 className="display mt-4 max-w-4xl text-5xl md:text-7xl">
            The hobby, handled with care.
          </h1>
          <p className="muted mt-6 max-w-2xl text-lg">
            {business.displayName} is a veteran-owned online retailer of sealed
            trading card game products, curated pack bundles, and accessories,
            serving the hobby from {business.location} since{" "}
            {business.foundedYear}.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="button" href="/products/">
              Browse products
            </Link>
            <Link className="button secondary" href="/contact/">
              Contact us
            </Link>
          </div>
        </div>
      </section>
      <div className="rule" />
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="What we carry"
            title="Built around the collecting experience."
            body="A focused catalog designed for players, collectors, and gift-givers—with availability added only when listings are ready."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {cats.map(([t, d], i) => (
              <article key={t} className="card p-7">
                <span className="text-sm text-[#c9a45c]">0{i + 1}</span>
                <h3 className="display mt-5 text-2xl">{t}</h3>
                <p className="muted mt-2">{d}</p>
              </article>
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
