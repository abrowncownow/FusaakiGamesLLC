import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";

export interface FusaakiGamesSiteStackProps extends cdk.StackProps {
  domainName: string;
  hostedZoneId: string;
  certificateArn: string;
}

export class FusaakiGamesSiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FusaakiGamesSiteStackProps) {
    super(scope, id, props);

    const zone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      {
        hostedZoneId: props.hostedZoneId,
        zoneName: props.domainName,
      },
    );
    const certificate = acm.Certificate.fromCertificateArn(
      this,
      "Certificate",
      props.certificateArn,
    );

    const contentBucket = new s3.Bucket(this, "ContentBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    const redirectWww = new cloudfront.Function(this, "RedirectWww", {
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      code: cloudfront.FunctionCode.fromInline(`function handler(event) {
  var request = event.request;
  if (request.headers.host && request.headers.host.value === "www.${props.domainName}") {
    var query = request.querystring;
    var parts = [];
    for (var key in query) {
      if (query[key].multiValue) {
        query[key].multiValue.forEach(function(item) { parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(item.value)); });
      } else if (query[key].value) {
        parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(query[key].value));
      }
    }
    return { statusCode: 301, statusDescription: "Moved Permanently", headers: { location: { value: "https://${props.domainName}" + request.uri + (parts.length ? "?" + parts.join("&") : "") } } };
  }
  return request;
}`),
    });

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      domainNames: [props.domainName, `www.${props.domainName}`],
      certificate,
      defaultRootObject: "index.html",
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      enableIpv6: true,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(contentBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy:
          cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
        functionAssociations: [
          {
            function: redirectWww,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 404,
          responsePagePath: "/404.html",
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: "/404.html",
          ttl: cdk.Duration.minutes(5),
        },
      ],
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    });

    const aliasTarget = route53.RecordTarget.fromAlias(
      new targets.CloudFrontTarget(distribution),
    );
    for (const recordName of [props.domainName, `www.${props.domainName}`]) {
      new route53.ARecord(this, `AliasA-${recordName}`, {
        zone,
        recordName,
        target: aliasTarget,
      });
      new route53.AaaaRecord(this, `AliasAaaa-${recordName}`, {
        zone,
        recordName,
        target: aliasTarget,
      });
    }

    new cdk.CfnOutput(this, "BucketName", { value: contentBucket.bucketName });
    new cdk.CfnOutput(this, "DistributionId", {
      value: distribution.distributionId,
    });
    new cdk.CfnOutput(this, "SiteUrl", {
      value: `https://${props.domainName}`,
    });
  }
}
