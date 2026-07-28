export type BusinessConfig = {
  legalName: string;
  displayName: string;
  location: string;
  email: string;
  domain: string;
  foundedYear: number;
  veteranOwned: boolean;
  phone: string;
  address: string;
  amazonStorefrontUrl?: string;
  tcgplayerStorefrontUrl?: string;
  social: { instagram?: string; facebook?: string };
  hours: readonly string[];
  features: {
    showAmazonStorefront: boolean;
    showTcgplayerStorefront: boolean;
    showSocialLinks: boolean;
    showPhone: boolean;
    showFullAddress: boolean;
    showProductsPage: boolean;
    showLaunchingSoonBanner: boolean;
  };
};
export const business: BusinessConfig = {
  legalName: "FusaakiGames LLC",
  displayName: "FusaakiGames",
  location: "Yelm, Washington",
  email: "contact@fusaakigames.com",
  domain: "fusaakigames.com",
  foundedYear: 2024,
  veteranOwned: true,
  phone: "[PHONE NUMBER — REPLACE BEFORE LAUNCH]",
  address: "[BUSINESS MAILING ADDRESS — REPLACE BEFORE LAUNCH]",
  amazonStorefrontUrl: undefined,
  tcgplayerStorefrontUrl: undefined,
  social: {},
  hours: [
    "Monday–Friday: 9:00 AM–5:00 PM Pacific",
    "Saturday–Sunday: Email support monitored",
  ],
  features: {
    showAmazonStorefront: false,
    showTcgplayerStorefront: false,
    showSocialLinks: false,
    showPhone: false,
    showFullAddress: false,
    showProductsPage: true,
    showLaunchingSoonBanner: true,
  },
};
