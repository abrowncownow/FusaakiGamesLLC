#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { FusaakiGamesSiteStack } from "../lib/site-stack.js";

const app = new cdk.App();
const account =
  app.node.tryGetContext("account") ?? process.env.CDK_DEFAULT_ACCOUNT;
const region =
  app.node.tryGetContext("region") ??
  process.env.CDK_DEFAULT_REGION ??
  "us-west-2";
const domainName =
  app.node.tryGetContext("domainName") ??
  process.env.SITE_DOMAIN ??
  "fusaakigames.com";
const hostedZoneId =
  app.node.tryGetContext("hostedZoneId") ?? process.env.HOSTED_ZONE_ID;
const certificateArn =
  app.node.tryGetContext("certificateArn") ?? process.env.CERTIFICATE_ARN;

if (!account || !hostedZoneId || !certificateArn) {
  throw new Error(
    "account, hostedZoneId, and certificateArn must be provided through CDK context or environment variables.",
  );
}

new FusaakiGamesSiteStack(app, "FusaakiGamesSite", {
  env: { account, region },
  domainName,
  hostedZoneId,
  certificateArn,
  crossRegionReferences: true,
  description:
    "Private S3 and CloudFront hosting for the FusaakiGames static website",
});
