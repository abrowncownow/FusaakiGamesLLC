import type { ReactNode } from "react";
export function PolicyPage({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <section className="section">
      <article className="container max-w-3xl">
        <p className="eyebrow">Policy</p>
        <h1 className="display mt-3 text-4xl md:text-6xl">{title}</h1>
        <p className="muted mt-5 text-lg">{summary}</p>
        <div className="mt-8 rounded border border-[#735f35] bg-[#251f15] p-4 text-sm text-[#e5d5b3]">
          Starter template: this policy should be reviewed by qualified legal
          counsel before the store begins accepting orders.
        </div>
        <div className="mt-10 space-y-8 [&_h2]:font-serif [&_h2]:text-2xl [&_p]:mt-2 [&_p]:text-[#b9ae9a]">
          {children}
        </div>
        <p className="muted mt-10 text-sm">Last updated: July 27, 2026</p>
      </article>
    </section>
  );
}
