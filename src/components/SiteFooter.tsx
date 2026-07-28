import Link from "next/link";
import { business } from "@/config/business";
export function TrademarkDisclaimer() {
  return (
    <p className="muted text-xs">
      All trademarks and product names belong to their respective owners.
      FusaakiGames does not claim sponsorship, affiliation, or authorization
      unless explicitly stated.
    </p>
  );
}
export function SiteFooter() {
  return (
    <footer className="border-t border-[#332f28] py-12">
      <div className="container grid gap-8 md:grid-cols-3">
        <div>
          <p className="font-bold">{business.legalName}</p>
          <p className="muted">{business.location}</p>
          <p className="muted text-sm">
            Veteran-owned · Established {business.foundedYear}
          </p>
          <a href={`mailto:${business.email}`} className="text-[#c9a45c]">
            {business.email}
          </a>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Link href="/shipping/">Shipping</Link>
          <Link href="/returns/">Returns</Link>
          <Link href="/privacy/">Privacy</Link>
          <Link href="/terms/">Terms</Link>
        </div>
        <TrademarkDisclaimer />
      </div>
      <div className="muted container mt-8 border-t border-[#332f28] pt-6 text-xs">
        © {new Date().getFullYear()} {business.legalName}. All rights reserved.
      </div>
    </footer>
  );
}
