import { describe, expect, it } from "vitest";
import { business } from "./business";
describe("business config", () => {
  it("contains a valid public identity", () => {
    expect(business.legalName).toBe("FusaakiGames LLC");
    expect(business.email).toMatch(/@fusaakigames\.com$/);
    expect(business.domain).toBe("fusaakigames.com");
    expect(business.veteranOwned).toBe(true);
    expect(business.foundedYear).toBe(2024);
  });
  it("keeps placeholders hidden by default", () => {
    expect(business.features.showPhone).toBe(false);
    expect(business.features.showFullAddress).toBe(false);
  });
});
