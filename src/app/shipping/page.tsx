import type { Metadata } from "next";
import { PolicyPage } from "@/components/PolicyPage";
export const metadata: Metadata = {
  title: "Shipping Policy",
  alternates: { canonical: "/shipping/" },
};
export default function Page() {
  return (
    <PolicyPage
      title="Shipping Policy"
      summary="How orders are processed, packed, and delivered."
    >
      <section>
        <h2>Processing and delivery</h2>
        <p>
          In-stock orders will generally be processed within the timeframe shown
          on the applicable listing. Delivery estimates are provided by carriers
          and are not guarantees. Delays caused by carriers, weather, holidays,
          or address issues may occur.
        </p>
      </section>
      <section>
        <h2>Packaging and tracking</h2>
        <p>
          We package products with care and provide tracking when available.
          Customers are responsible for providing a complete, accurate delivery
          address before shipment.
        </p>
      </section>
      <section>
        <h2>Damaged, missing, or incorrect shipments</h2>
        <p>
          Please contact us promptly after delivery with the order number and
          clear photos of the package and contents. We will review the issue and
          work toward a fair resolution consistent with the sales channel’s
          rules.
        </p>
      </section>
    </PolicyPage>
  );
}
