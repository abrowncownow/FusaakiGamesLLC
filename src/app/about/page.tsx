import type { Metadata } from "next";
import { CTA, SectionHeading } from "@/components/Sections";
import { business } from "@/config/business";
export const metadata: Metadata = {
  title: "About",
  description:
    "Meet FusaakiGames LLC, a veteran-owned Washington retailer established in 2024.",
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
              title="Built for the long game."
            />
            <div className="muted space-y-5">
              <p>
                {business.legalName} is a veteran-owned Washington limited
                liability company established in {business.foundedYear}. We are
                an online-first retailer specializing in sealed collectible
                products and practical accessories.
              </p>
              <p>
                We participate in tabletop gaming ourselves. That experience
                shapes our priorities: accurate listings, careful handling,
                dependable communication, and respect for the games and their
                communities.
              </p>
              <p>
                Our approach is straightforward: operate professionally,
                communicate clearly, and build lasting relationships with
                customers and suppliers.
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
