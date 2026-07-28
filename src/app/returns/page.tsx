import type { Metadata } from "next";
import { PolicyPage } from "@/components/PolicyPage";
export const metadata: Metadata = {
  title: "Return & Refund Policy",
  description:
    "Return eligibility and refund guidance for sealed products purchased from FusaakiGames.",
  alternates: { canonical: "/returns/" },
};
export default function Page() {
  return (
    <PolicyPage
      title="Return & Refund Policy"
      summary="A fair starting framework for returns and order concerns."
    >
      <section>
        <h2>Return eligibility</h2>
        <p>
          Sealed products may be eligible for return only when unopened,
          untampered with, and in their original condition and packaging. Opened
          trading card products and randomized products generally cannot be
          returned because their condition and contents cannot be restored.
        </p>
      </section>
      <section>
        <h2>Marketplace purchases</h2>
        <p>
          Orders placed through Amazon or another marketplace are subject to
          that marketplace’s return and refund rules, which may differ from this
          policy and will control where applicable.
        </p>
      </section>
      <section>
        <h2>Requesting a return</h2>
        <p>
          Contact us promptly with your order number and reason for the request.
          Do not ship a return until instructions are provided. Approved refunds
          are issued to the original payment method after inspection, subject to
          applicable law.
        </p>
      </section>
    </PolicyPage>
  );
}
