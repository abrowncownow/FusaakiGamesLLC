import type { Metadata } from "next";
import { ContactInformation, SectionHeading } from "@/components/Sections";
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
            title="We’re ready to help."
            body="For customer support, supplier conversations, or general business inquiries, email is the fastest way to reach us."
          />
          <a className="button" href={`mailto:${business.email}`}>
            Email {business.displayName}
          </a>
        </div>
        <ContactInformation />
      </div>
    </section>
  );
}
