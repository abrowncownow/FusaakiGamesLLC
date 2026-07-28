import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "./SiteFooter";
describe("SiteFooter", () => {
  it("shows identity and policy links", () => {
    render(createElement(SiteFooter));
    expect(screen.getByText("FusaakiGames LLC")).toBeDefined();
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute(
      "href",
      "/privacy",
    );
  });
});
