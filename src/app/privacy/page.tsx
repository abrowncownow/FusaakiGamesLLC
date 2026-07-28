import type { Metadata } from "next";
import { PolicyPage } from "@/components/PolicyPage";
export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy/" },
};
export default function Page() {
  return (
    <PolicyPage
      title="Privacy Policy"
      summary="How basic business and customer information is handled."
    >
      <section>
        <h2>Information we collect</h2>
        <p>
          We may receive contact, order, shipping, and communication information
          that you provide directly or through a marketplace. This informational
          website does not currently accept payments or create customer
          accounts.
        </p>
      </section>
      <section>
        <h2>How information is used</h2>
        <p>
          Information is used to respond to inquiries, fulfill and support
          orders, prevent fraud, comply with law, and improve operations. We do
          not sell personal information.
        </p>
      </section>
      <section>
        <h2>Service providers and retention</h2>
        <p>
          Necessary information may be shared with marketplaces, payment
          providers, shipping carriers, and professional advisers. We retain
          information only as reasonably needed for operations, legal duties,
          and dispute resolution.
        </p>
      </section>
    </PolicyPage>
  );
}
