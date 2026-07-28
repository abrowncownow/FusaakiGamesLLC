import type { Metadata } from "next";
import { PolicyPage } from "@/components/PolicyPage";
export const metadata: Metadata = {
  title: "Terms of Service",
  alternates: { canonical: "/terms/" },
};
export default function Page() {
  return (
    <PolicyPage
      title="Terms of Service"
      summary="The basic terms for using this website and purchasing from FusaakiGames."
    >
      <section>
        <h2>Website information</h2>
        <p>
          Site content is provided for general information and may change.
          Product previews do not represent current inventory, offers, or a
          promise of availability.
        </p>
      </section>
      <section>
        <h2>Orders and listings</h2>
        <p>
          When commerce launches, the terms shown on the applicable product
          listing and sales channel will apply. We may correct errors or cancel
          orders when permitted by law and will provide appropriate notice or
          refunds.
        </p>
      </section>
      <section>
        <h2>Intellectual property and third-party marks</h2>
        <p>
          Original site content belongs to FusaakiGames LLC. Third-party
          trademarks, product names, and game properties belong to their
          respective owners and do not imply affiliation.
        </p>
      </section>
      <section>
        <h2>Limitation and governing law</h2>
        <p>
          To the extent permitted by law, liability is limited to the amount
          paid for the applicable order. These terms are governed by Washington
          law, without limiting mandatory consumer protections.
        </p>
      </section>
    </PolicyPage>
  );
}
