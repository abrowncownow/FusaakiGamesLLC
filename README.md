# FusaakiGames website

Production-oriented static website for FusaakiGames LLC. Built with Next.js App Router, strict TypeScript, and Tailwind CSS. The static `out/` export works on GitHub Pages, S3, CloudFront, or another static host.

## Local setup

Use Node.js 22 or newer. Run `pnpm install`, then `pnpm dev`. Quality checks are `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`. Playwright smoke tests use `pnpm exec playwright install chromium` followed by `pnpm test:e2e`.

## Business information and branding

All editable identity, contact details, hours, marketplace URLs, and feature flags live in `src/config/business.ts`. Replace `public/logo-mark.svg` with another same-path asset or update the header to use a new logo.

## Static export and GitHub Pages

`npm run build` produces `out/`. The Pages workflow publishes that directory after a push to `main`. In repository Settings → Pages, select **GitHub Actions** as the source. GitHub Pages availability for a private repository depends on the GitHub plan, and the published Pages site may still be publicly accessible.

## AWS deployment

The export is compatible with a private S3 origin behind CloudFront. Before production, provision a private bucket, CloudFront Origin Access Control, ACM certificate in `us-east-1`, Route 53 A/AAAA aliases, response headers, and a `www` redirect. The hosted zone must already exist. Prefer a GitHub Actions OIDC role scoped to the repository over access keys; configure the role ARN, bucket, distribution ID, hosted-zone ID, domain, account, and region as repository variables. Run the build, deploy infrastructure, sync `out/`, then invalidate CloudFront.

## Pre-launch checklist

- Replace every placeholder and confirm the business name/address match distributor applications.
- Verify email and phone, review policies with counsel, and confirm no unsupported authorization claims.
- Test mobile layout and all links; deploy HTTPS and confirm domain redirects.
- Confirm marketplace and social URLs before enabling their feature flags.

## Distributor-application checklist

- Confirm legal identity, business contact details, domain email, and operating address are consistent.
- Provide only requested registration and resale documents through secure distributor channels; never add an EIN to this site.
- Review channel restrictions and ensure supplier claims remain accurate.
- Verify the site, policies, supplier page, and customer-support contact are live.

## Remaining placeholders

- Phone number and business mailing address in `src/config/business.ts`.
- Optional Amazon, TCGplayer storefront, and social URLs.
- Final legal review date and approved policy language.
- AWS account, region, hosted-zone ID, OIDC role, bucket, and CloudFront distribution configuration if AWS hosting is used.
