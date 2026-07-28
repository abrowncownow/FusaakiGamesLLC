import type { Metadata } from "next";
import { SectionHeading } from "@/components/Sections";
import { business } from "@/config/business";
export const metadata: Metadata = {
  title: "Wholesale Partnerships",
  description:
    "Supplier and wholesale partnership information for FusaakiGames LLC.",
  alternates: { canonical: "/suppliers/" },
};
export default function Suppliers() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Supplier information"
          title="A dependable retail partner."
          body={`${business.legalName} welcomes conversations with established manufacturers and distributors across the tabletop and collectibles industry.`}
        />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-7">
            <h2 className="display text-2xl">How we operate</h2>
            <p className="muted mt-4">
              FusaakiGames operates primarily through online retail and
              third-party marketplaces. Products are stored, packaged, and
              fulfilled using professional inventory-handling practices that
              protect condition and order accuracy.
            </p>
          </div>
          <div className="card p-7">
            <h2 className="display text-2xl">Brand & channel compliance</h2>
            <p className="muted mt-4">
              Supplier documentation, brand restrictions, and authorized sales
              channels are followed as written. We do not list products on
              marketplaces prohibited by a supplier or manufacturer.
            </p>
          </div>
        </div>
        <div className="mt-8 border-l-2 border-[#c9a45c] pl-6">
          <p className="muted">
            FusaakiGames does not claim to be an authorized Wizards of the Coast
            distributor, WPN member, or authorized reseller.
          </p>
          <a
            className="mt-4 inline-block font-bold text-[#c9a45c]"
            href={`mailto:${business.email}?subject=Supplier%20Partnership%20Inquiry`}
          >
            Supplier inquiries: {business.email}
          </a>
        </div>
      </div>
    </section>
  );
}
