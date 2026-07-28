"use client";
import Link from "next/link";
import { useState } from "react";
import { business } from "@/config/business";
const links = [
  ["/", "Home"],
  ["/products/", "Products"],
  ["/about/", "About"],
  ["/suppliers/", "Suppliers"],
  ["/contact/", "Contact"],
];
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="border-b border-[#332f28] bg-[#11110fee]">
      <div className="container flex min-h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 font-bold">
          <span
            aria-hidden
            className="grid h-10 w-10 rotate-45 place-items-center border border-[#c9a45c] text-[#c9a45c]"
          >
            <span className="-rotate-45">F</span>
          </span>
          {business.displayName}
        </Link>
        <button
          className="rounded border border-[#4a4439] px-3 py-2 md:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="primary-nav"
        >
          Menu
        </button>
        <nav
          id="primary-nav"
          aria-label="Primary"
          className={`${open ? "flex" : "hidden"} absolute top-20 left-0 z-10 w-full flex-col gap-5 border-b border-[#332f28] bg-[#11110f] p-6 md:static md:flex md:w-auto md:flex-row md:border-0 md:bg-transparent md:p-0`}
        >
          {links
            .filter(
              ([p]) => p != "/products/" || business.features.showProductsPage,
            )
            .map(([p, l]) => (
              <Link
                onClick={() => setOpen(false)}
                key={p}
                href={p}
                className="text-sm font-semibold text-[#d7cdbc] hover:text-[#c9a45c]"
              >
                {l}
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}
