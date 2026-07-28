import Link from "next/link";
import { business } from "@/config/business";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-24 md:py-36">
      <div className="absolute inset-0 [background-image:linear-gradient(30deg,transparent_49%,#c9a45c22_50%,transparent_51%)] [background-size:70px_70px] opacity-30" />
      <div className="relative container">
        <p className="eyebrow">Sealed. Thoughtful. Ready for the next game.</p>
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
  );
}

export function CategoryCard({
  index,
  title,
  description,
}: {
  index: number;
  title: string;
  description: string;
}) {
  return (
    <article className="card p-7">
      <span className="text-sm text-[#c9a45c]">
        {String(index).padStart(2, "0")}
      </span>
      <h3 className="display mt-5 text-2xl">{title}</h3>
      <p className="muted mt-2">{description}</p>
    </article>
  );
}

export function ContactInformation() {
  return (
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
        {business.features.showAmazonStorefront &&
          business.amazonStorefrontUrl && (
            <div>
              <dt className="eyebrow">Amazon storefront</dt>
              <dd>
                <a
                  className="text-[#c9a45c]"
                  href={business.amazonStorefrontUrl}
                  rel="noopener noreferrer"
                >
                  Visit our Amazon storefront
                </a>
              </dd>
            </div>
          )}
        {business.features.showSocialLinks &&
          (business.social.instagram || business.social.facebook) && (
            <div>
              <dt className="eyebrow">Social</dt>
              <dd className="flex flex-wrap gap-4">
                {business.social.instagram && (
                  <a
                    className="text-[#c9a45c]"
                    href={business.social.instagram}
                    rel="noopener noreferrer"
                  >
                    Instagram
                  </a>
                )}
                {business.social.facebook && (
                  <a
                    className="text-[#c9a45c]"
                    href={business.social.facebook}
                    rel="noopener noreferrer"
                  >
                    Facebook
                  </a>
                )}
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
            {business.hours.map((hour) => (
              <div key={hour}>{hour}</div>
            ))}
          </dd>
        </div>
      </dl>
    </div>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="display mt-2 text-3xl md:text-5xl">{title}</h2>
      {body && <p className="muted mt-4">{body}</p>}
    </div>
  );
}
export function CTA() {
  return (
    <section className="section">
      <div className="card container p-8 text-center md:p-14">
        <p className="eyebrow">Questions & partnerships</p>
        <h2 className="display mt-2 text-3xl">
          Let’s build something lasting.
        </h2>
        <p className="muted mx-auto mt-4 max-w-xl">
          Customers, suppliers, and distribution partners are welcome to get in
          touch.
        </p>
        <Link className="button mt-6" href="/contact/">
          Contact us
        </Link>
      </div>
    </section>
  );
}
export function ProductCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="card p-6">
      <div className="mb-5 grid aspect-[4/3] place-items-center rounded-lg border border-[#3c382f] bg-[radial-gradient(circle_at_center,#332b20,#171612)]">
        <span className="display text-5xl text-[#c9a45c]" aria-hidden>
          ◇
        </span>
      </div>
      <h3 className="display text-2xl">{title}</h3>
      <p className="muted mt-2">{description}</p>
      <p className="mt-4 text-sm text-[#c9a45c]">
        Product availability and marketplace listings are being finalized.
      </p>
    </article>
  );
}
