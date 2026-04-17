$ErrorActionPreference = 'Stop'

Write-Host 'Checking Soroban development environment...' -ForegroundColor Cyan

$checks = @(
  @{ Name = 'rustup'; Command = 'rustup --version' },
  @{ Name = 'cargo'; Command = 'cargo --version' },
  @{ Name = 'soroban'; Command = 'soroban --version' },
  @{ Name = 'rust target'; Command = 'rustup target list --installed' }
)

foreach ($check in $checks) {
  try {
    $output = Invoke-Expression $check.Command | Out-String
    Write-Host ("[ok] {0}" -f $check.Name) -ForegroundColor Green
    Write-Host $output.Trim()
  }
  catch {
    Write-Host ("[missing] {0}" -f $check.Name) -ForegroundColor Yellow
  }
}

$envVars = @(
  'STELLAR_HORIZON_URL',
  'STELLAR_RPC_URL',
  'STELLAR_NETWORK',
  'SOROBAN_ESCROW_CONTRACT_ID',
  'ZARP_SEP24_URL',
  'STITCH_API_KEY',
  'PEACH_ACCESS_TOKEN'
)

Write-Host ''
Write-Host 'Environment variable summary:' -ForegroundColor Cyan
foreach ($name in $envVars) {
  if ([string]::IsNullOrWhiteSpace((Get-Item -Path "Env:$name" -ErrorAction SilentlyContinue).Value)) {
    Write-Host ("[missing] {0}" -f $name) -ForegroundColor Yellow
  }
  else {
    Write-Host ("[ok] {0}" -f $name) -ForegroundColor Green
  }
}