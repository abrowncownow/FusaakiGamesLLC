import Link from "next/link";
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
