import type { Metadata } from "next";
import { CTA, SectionHeading } from "@/components/Sections";
import { business } from "@/config/business";
export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about FusaakiGames LLC, a Washington online-first trading card retailer.",
  alternates: { canonical: "/about/" },
};
export default function About() {
  return (
    <>
      <section className="section">
        <div className="container grid gap-12 md:grid-cols-[1.1fr_.9fr]">
          <div>
            <SectionHeading
              eyebrow="About us"
              title="A small business with a long view."
            />
            <div className="muted space-y-5">
              <p>
                {business.legalName} is a veteran-owned Washington limited
                liability company, established in {business.foundedYear},
                building an online-first retail business around sealed,
                authentic collectible products.
              </p>
              <p>
                We participate in the tabletop gaming hobby ourselves, and that
                experience shapes our priorities: clear listings, careful
                handling, dependable communication, and respect for the games
                and communities we serve.
              </p>
              <p>
                We are building lasting relationships with customers and
                suppliers through consistent, professional operations—not
                exaggerated claims.
              </p>
            </div>
          </div>
          <aside className="card p-8">
            <p className="eyebrow">At a glance</p>
            <dl className="mt-6 space-y-6">
              <div>
                <dt className="muted text-sm">Business</dt>
                <dd className="font-bold">{business.legalName}</dd>
              </div>
              <div>
                <dt className="muted text-sm">Based in</dt>
                <dd className="font-bold">{business.location}</dd>
              </div>
              <div>
                <dt className="muted text-sm">Established</dt>
                <dd className="font-bold">
                  {business.foundedYear} · Veteran-owned
                </dd>
              </div>
              <div>
                <dt className="muted text-sm">Model</dt>
                <dd className="font-bold">Online-first specialty retail</dd>
              </div>
              <div>
                <dt className="muted text-sm">Focus</dt>
                <dd className="font-bold">
                  Sealed collectible products & accessories
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>
      <CTA />
    </>
  );
}
