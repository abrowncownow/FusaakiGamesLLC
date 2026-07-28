import type { Metadata } from "next";
import { SectionHeading } from "@/components/Sections";
import { business } from "@/config/business";
export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact FusaakiGames LLC for customer service and business inquiries.",
  alternates: { canonical: "/contact/" },
};
export default function Contact() {
  return (
    <section className="section">
      <div className="container grid gap-12 md:grid-cols-[1fr_1fr]">
        <div>
          <SectionHeading
            eyebrow="Contact"
            title="We’d be glad to hear from you."
            body="For customer questions, supplier conversations, or general business inquiries, email is the fastest way to reach us."
          />
          <a className="button" href={`mailto:${business.email}`}>
            Email {business.displayName}
          </a>
        </div>
        <div className="card p-8">
          <dl className="space-y-6">
            <div>
              <dt className="eyebrow">Email</dt>
              <dd className="mt-1">
                <a className="text-[#c9a45c]" href={`mailto:${business.email}`}>
                  {business.email}
                </a>
              </dd>
            </div>
            {business.features.showPhone && (
              <div>
                <dt className="eyebrow">Phone</dt>
                <dd>{business.phone}</dd>
              </div>
            )}
            <div>
              <dt className="eyebrow">Location</dt>
              <dd>{business.location}</dd>
            </div>
            {business.features.showTcgplayerStorefront &&
              business.tcgplayerStorefrontUrl && (
                <div>
                  <dt className="eyebrow">TCGplayer storefront</dt>
                  <dd>
                    <a
                      className="text-[#c9a45c]"
                      href={business.tcgplayerStorefrontUrl}
                      rel="noopener noreferrer"
                    >
                      Visit our TCGplayer page
                    </a>
                  </dd>
                </div>
              )}
            {business.features.showFullAddress && (
              <div>
                <dt className="eyebrow">Mailing address</dt>
                <dd>{business.address}</dd>
              </div>
            )}
            <div>
              <dt className="eyebrow">Business hours</dt>
              <dd>
                {business.hours.map((h) => (
                  <div key={h}>{h}</div>
                ))}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
