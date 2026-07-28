param(
  [Parameter(Mandatory = $true)][string]$Account,
  [Parameter(Mandatory = $true)][string]$Region,
  [Parameter(Mandatory = $true)][string]$HostedZoneId,
  [Parameter(Mandatory = $true)][string]$CertificateArn,
  [string]$DomainName = "fusaakigames.com"
)
$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot
try {
  pnpm build
  Push-Location infrastructure
  try {
    pnpm exec cdk deploy --require-approval never --outputs-file cdk-outputs.json `
      -c account=$Account -c region=$Region -c domainName=$DomainName `
      -c hostedZoneId=$HostedZoneId -c certificateArn=$CertificateArn
    $outputs = Get-Content -Raw cdk-outputs.json | ConvertFrom-Json
    $stack = $outputs.FusaakiGamesSite
  } finally { Pop-Location }
  aws s3 sync out "s3://$($stack.BucketName)" --delete
  aws cloudfront create-invalidation --distribution-id $stack.DistributionId --paths "/*"
} finally { Pop-Location }
