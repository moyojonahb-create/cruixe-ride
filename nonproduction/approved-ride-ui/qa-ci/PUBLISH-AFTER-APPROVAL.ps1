param([switch]$Approved)
# PROPOSAL ONLY. The agent must obtain explicit user approval before running this.
$ErrorActionPreference = 'Stop'
if (-not $Approved) { throw 'Explicit approval for the reviewed branch, commit and push is required.' }
$ciRoot = $PSScriptRoot
$repoRoot = [IO.Path]::GetFullPath((Join-Path $ciRoot '../../..'))
$plan = Get-Content -LiteralPath (Join-Path $ciRoot 'publication-plan.json') -Raw | ConvertFrom-Json
$publishPath = Join-Path $env:TEMP ('cruixe-approved-ui-' + $plan.branch.Split('-')[-1])
if (Test-Path -LiteralPath $publishPath) { throw 'Publication directory already exists; refusing to overwrite it.' }
foreach ($file in $plan.files) {
 $source = Join-Path $repoRoot $file.path
 if ((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant() -ne $file.sha256) { throw ('Reviewed file changed: ' + $file.path) }
}
function Invoke-CruixeGit([string[]]$GitArgs) {
 & git @GitArgs
 if ($LASTEXITCODE -ne 0) { throw ('Git command failed: ' + $GitArgs[0]) }
}
Invoke-CruixeGit -GitArgs @('clone','--no-checkout',$plan.repository,$publishPath)
Invoke-CruixeGit -GitArgs @('-C',$publishPath,'switch','-c',$plan.branch,$plan.base)
$existingBranch = & git -C $publishPath ls-remote --heads origin ('refs/heads/' + $plan.branch)
if ($LASTEXITCODE -ne 0 -or $existingBranch) { throw 'Cannot verify a new branch; refusing to push.' }
foreach ($file in $plan.files) {
 $destination = Join-Path $publishPath $file.path
 [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($destination)) | Out-Null
 [IO.File]::Copy((Join-Path $repoRoot $file.path),$destination,$false)
}
$publishFiles = @($plan.files | ForEach-Object { $_.path })
# Force applies only to the three checksummed files, including the reviewed archive.
Invoke-CruixeGit -GitArgs (@('-C',$publishPath,'add','-f','--') + $publishFiles)
$stagedFiles = @(& git -C $publishPath diff --cached --name-only)
if ($LASTEXITCODE -ne 0 -or (Compare-Object ($stagedFiles | Sort-Object) ($publishFiles | Sort-Object))) { throw 'Unexpected staged files in isolated publication clone.' }
Invoke-CruixeGit -GitArgs @('-C',$publishPath,'diff','--cached','--check')
Invoke-CruixeGit -GitArgs @('-C',$publishPath,'diff','--cached','--stat')
Invoke-CruixeGit -GitArgs @('-C',$publishPath,'commit','-m',$plan.commitMessage)
Invoke-CruixeGit -GitArgs @('-C',$publishPath,'push','--set-upstream','origin',('HEAD:refs/heads/' + $plan.branch))
Write-Output ('Verification branch published: ' + $plan.branch)
Write-Output 'No PR, merge, deployment or changes to the original dirty checkout were performed.'
