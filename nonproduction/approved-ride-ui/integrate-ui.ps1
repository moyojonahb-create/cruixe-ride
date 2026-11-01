param([switch]$Apply)
$ErrorActionPreference = 'Stop'
$uiRoot = $PSScriptRoot
$repoRoot = Split-Path (Split-Path $uiRoot -Parent) -Parent
$manifest = Get-Content -LiteralPath (Join-Path $uiRoot 'integration-manifest.json') -Raw | ConvertFrom-Json
foreach ($entry in $manifest.PSObject.Properties) {
  $target = Join-Path $repoRoot $entry.Name
  if ($null -eq $entry.Value) {
    if (Test-Path -LiteralPath $target) { throw "New UI file already exists: $($entry.Name). Review manually." }
  } else {
    if (!(Test-Path -LiteralPath $target)) { throw "Source file missing: $($entry.Name). Review manually." }
    $actual = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actual -ne $entry.Value) { throw "Source changed since snapshot: $($entry.Name). Review and integrate manually." }
  }
}
if (!$Apply) { Write-Output 'All seven source files are safe to integrate. Stop other agents editing these paths, then rerun with -Apply.'; exit }
foreach ($entry in $manifest.PSObject.Properties) {
  Copy-Item -LiteralPath (Join-Path $uiRoot $entry.Name) -Destination (Join-Path $repoRoot $entry.Name)
}
Write-Output 'Applied the seven reviewed UI files. No backend files, commits, or deployments were changed.'
