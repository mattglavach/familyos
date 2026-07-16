$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$repositoryRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Import-Module (Join-Path $PSScriptRoot 'TestDatabaseSafety.psm1') -Force
$manifestPath = Join-Path $repositoryRoot 'supabase/approved-migrations.json'
$passed = 0

function Assert-True([bool]$Condition, [string]$Name) {
  if (-not $Condition) { throw "FAILED: $Name" }
  $script:passed++
}

function Assert-Throws([scriptblock]$Action, [string]$Name) {
  try { & $Action; throw "FAILED: $Name did not throw" } catch {
    if ($_.Exception.Message -like 'FAILED:*') { throw }
    $script:passed++
  }
}

$testRef = 'abcdefghijklmnopqrst'
$testUrl = "postgresql://postgres.${testRef}:offline-secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

Assert-Throws { Get-DatabaseUrlProjectRef -DatabaseUrl '' } 'missing database URL'
Assert-Throws { Get-SafeProjectRef -Value '' } 'missing project reference'
Assert-Throws { Get-SafeProjectRef -Value 'not-a-project-ref' } 'malformed project reference'
Assert-Throws { Assert-TestDatabaseTarget -DatabaseUrl $testUrl -ProjectRef $testRef -ExpectedProjectRef 'zyxwvutsrqponmlkjihg' -Confirmed $true -BlockedProjectRefs @() } 'expected reference mismatch'
Assert-Throws { Assert-TestDatabaseTarget -DatabaseUrl $testUrl -ProjectRef $testRef -ExpectedProjectRef $testRef -Confirmed $false -BlockedProjectRefs @() } 'missing confirmation flag'
Assert-Throws { Assert-TestDatabaseTarget -DatabaseUrl 'postgresql://postgres.dsowansazqleudupnjug:x@aws-0-us-east-1.pooler.supabase.com/postgres' -ProjectRef 'dsowansazqleudupnjug' -ExpectedProjectRef 'dsowansazqleudupnjug' -Confirmed $true -BlockedProjectRefs @('dsowansazqleudupnjug') } 'production reference rejection'
Assert-Throws { Assert-EmptyDatabaseResult -ExistingFamilyOsTableCount 1 -AllowNonEmpty $false } 'non-empty database protection'
Assert-True ((Protect-SecretText -Text "before offline-secret after" -Secrets @('offline-secret')) -eq 'before [REDACTED] after') 'secret redaction'

$manifest = Read-ApprovedMigrationManifest -ManifestPath $manifestPath -RepositoryRoot $repositoryRoot
Assert-True ($manifest.expectedMigrationCount -eq 27 -and $manifest.approvedMigrations.Count -eq 25 -and $manifest.historyOnlyMigrations.Count -eq 2) 'production and execution migration counts reconcile'
Assert-True ($manifest.expectedLatestRelease -eq '3.4.0' -and $manifest.approvedMigrations[-1].version -eq '20260715010000' -and $manifest.approvedMigrations[-1].file -eq $manifest.expectedLatestMigrationFile) 'latest migration aligns to 3.4.0'
Assert-True ((@($manifest.approvedMigrations.version) -join ',') -eq ((@($manifest.approvedMigrations.version) | Sort-Object) -join ',')) 'approved migrations ordered'
Assert-True (@($manifest.approvedMigrations.file) -notcontains 'supabase/migrations/20260626000000_baseline_schema.sql') 'historical baseline SQL is not executed twice'
Assert-True (@($manifest.approvedMigrations.file) -notcontains 'supabase/migrations/20260627000000_household_foundation.sql') 'superseded household foundation is not executable'
$allVersions = @($manifest.approvedMigrations.version) + @($manifest.historyOnlyMigrations.version)
$allFiles = @($manifest.approvedMigrations.file) + @($manifest.historyOnlyMigrations.file)
Assert-True (($allVersions | Select-Object -Unique).Count -eq 27 -and ($allFiles | Select-Object -Unique).Count -eq 27) 'no migration version or file appears twice'
$approvedHashes = @($manifest.approvedMigrations.file | ForEach-Object {
  $sha256 = [Security.Cryptography.SHA256]::Create()
  try { [BitConverter]::ToString($sha256.ComputeHash([IO.File]::ReadAllBytes((Join-Path $repositoryRoot ($_ -replace '/', [IO.Path]::DirectorySeparatorChar))))).Replace('-', '') } finally { $sha256.Dispose() }
})
Assert-True (($approvedHashes | Select-Object -Unique).Count -eq $approvedHashes.Count) 'no approved migration is a byte-identical rename'

$baselineSql = Get-Content -Raw -LiteralPath (Join-Path $repositoryRoot 'supabase/schema.sql')
$historicalBaselineSql = Get-Content -Raw -LiteralPath (Join-Path $repositoryRoot 'supabase/migrations/20260626000000_baseline_schema.sql')
$historicalTables = @([regex]::Matches($historicalBaselineSql, '(?im)create\s+table\s+if\s+not\s+exists\s+public\.([a-z_][a-z0-9_]*)') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
$currentTables = @([regex]::Matches($baselineSql, '(?im)create\s+table\s+if\s+not\s+exists\s+public\.([a-z_][a-z0-9_]*)') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
Assert-True (@($historicalTables | Where-Object { $currentTables -notcontains $_ }).Count -eq 0) 'schema baseline contains every historical baseline table'
Assert-True ($baselineSql -match 'create extension if not exists "pgcrypto"' -and $baselineSql -match "grant select, insert, update, delete on public\.%I to authenticated") 'schema baseline owns extension and authenticated grants'

$localHouseholdSql = Get-Content -Raw -LiteralPath (Join-Path $repositoryRoot 'supabase/migrations/20260627000000_household_foundation.sql')
$productionHouseholdSql = Get-Content -Raw -LiteralPath (Join-Path $repositoryRoot 'supabase/migrations/20260701010000_release_0_6c_household_foundation.sql')
foreach ($table in @('profiles','households','people','household_members')) {
  Assert-True ($localHouseholdSql -match "create table if not exists public\.$table" -and $productionHouseholdSql -match "create table if not exists public\.$table") "household drafts overlap on $table"
}
Assert-True ($productionHouseholdSql -match 'familyos_bootstrap_auth_user_on_insert' -and $productionHouseholdSql -match 'public\.household_settings' -and $productionHouseholdSql -match 'public\.user_preferences') 'production household migration contains the canonical additions'

$aiSql = Get-Content -Raw -LiteralPath (Join-Path $repositoryRoot 'supabase/migrations/20260714030000_release_3_2_ai_planning.sql')
foreach ($table in @('ai_preferences','ai_recommendations','ai_proposed_actions','ai_feedback')) {
  Assert-True ($aiSql -match "create table if not exists public\.$table" -and $aiSql -match "alter table public\.$table enable row level security") "Release 3.2 creates and protects $table"
}
Assert-True ($aiSql -match '(?is)^\s*begin;.*commit;\s*$' -and $aiSql -notmatch '(?im)^\s*(?:insert\s+into|update\s+public\.|delete\s+from)') 'Release 3.2 is transactional and has no data backfill'

$tempRoot = Join-Path ([IO.Path]::GetTempPath()) ('familyos-db-safety-' + [guid]::NewGuid().ToString('N'))
try {
  New-Item -ItemType Directory -Path (Join-Path $tempRoot 'supabase/migrations') -Force | Out-Null
  Copy-Item -LiteralPath (Join-Path $repositoryRoot 'supabase/schema.sql') -Destination (Join-Path $tempRoot 'supabase/schema.sql')
  Copy-Item -LiteralPath (Join-Path $repositoryRoot 'supabase/backfill-user-id.sql') -Destination (Join-Path $tempRoot 'supabase/backfill-user-id.sql')
  Copy-Item -LiteralPath (Join-Path $repositoryRoot 'supabase/seed.sql') -Destination (Join-Path $tempRoot 'supabase/seed.sql')
  Copy-Item -Path (Join-Path $repositoryRoot 'supabase/migrations/*.sql') -Destination (Join-Path $tempRoot 'supabase/migrations')
  Copy-Item -LiteralPath $manifestPath -Destination (Join-Path $tempRoot 'supabase/approved-migrations.json')
  $tempManifest = Join-Path $tempRoot 'supabase/approved-migrations.json'

  Remove-Item -LiteralPath (Join-Path $tempRoot 'supabase/schema.sql')
  Assert-Throws { Read-ApprovedMigrationManifest -ManifestPath $tempManifest -RepositoryRoot $tempRoot } 'missing baseline file'
  Copy-Item -LiteralPath (Join-Path $repositoryRoot 'supabase/schema.sql') -Destination (Join-Path $tempRoot 'supabase/schema.sql')

  $missingMigration = $manifest.approvedMigrations[4].file -replace '/', [IO.Path]::DirectorySeparatorChar
  Remove-Item -LiteralPath (Join-Path $tempRoot $missingMigration)
  Assert-Throws { Read-ApprovedMigrationManifest -ManifestPath $tempManifest -RepositoryRoot $tempRoot } 'missing migration file'
  Copy-Item -LiteralPath (Join-Path $repositoryRoot $missingMigration) -Destination (Join-Path $tempRoot $missingMigration)

  $tampered = Get-Content -Raw -LiteralPath $tempManifest | ConvertFrom-Json
  $tampered.approvedMigrations[5].file = $tampered.excludedFiles[0].file
  $tampered | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $tempManifest -Encoding UTF8
  Assert-Throws { Read-ApprovedMigrationManifest -ManifestPath $tempManifest -RepositoryRoot $tempRoot } 'excluded migration cannot be approved'
} finally {
  Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
}

$initializer = Get-Content -Raw -LiteralPath (Join-Path $repositoryRoot 'scripts/initialize-test-database.ps1')
$verifier = Get-Content -Raw -LiteralPath (Join-Path $repositoryRoot 'scripts/verify-test-database.ps1')
$localValidator = Get-Content -Raw -LiteralPath (Join-Path $repositoryRoot 'scripts/validate-local-test-database.ps1')
Assert-True ($initializer -match 'supabase/approved-migrations\.json' -and $verifier -match 'supabase/approved-migrations\.json' -and $initializer -match 'Read-ApprovedMigrationManifest' -and $verifier -match 'Read-ApprovedMigrationManifest') 'initializer and verifier consume the same manifest'
Assert-True ($initializer -notmatch '(?im)^\s*(?:&\s*)?pnpm(?:\.cmd)?\s+.*seed:demo') 'demo seed is not invoked'
Assert-True ($initializer -notmatch '(?im)^\s*(?:&\s*)?supabase(?:\.cmd)?\s+.*db\s+push') 'db push is not invoked'
Assert-True ($initializer -notmatch '(?im)^\s*(?:&\s*)?supabase(?:\.cmd)?\s+.*db\s+reset') 'db reset is not invoked'
Assert-True ($initializer -notmatch '(?im)^\s*(?:&\s*)?supabase(?:\.cmd)?\s+.*\blink\b') 'Supabase link is not invoked'
Assert-True ($initializer -notmatch '(?im)^\s*(?:&\s*)?supabase(?:\.cmd)?\s+.*\bunlink\b') 'Supabase unlink is not invoked'
Assert-True ($localValidator -match 'ConfirmLocalDisposable' -and $localValidator -match '127\.0\.0\.1' -and $localValidator -match 'familyos_disposable_') 'local validator is restricted to a disposable loopback target'
Assert-True ($localValidator -notmatch 'TEST_SUPABASE_DB_URL' -and $localValidator -notmatch 'TEST_SUPABASE_PROJECT_REF') 'local validator does not read hosted target configuration'
Assert-True ($localValidator -notmatch '(?im)^\s*(?:&\s*)?(?:pnpm(?:\.cmd)?\s+.*seed:demo|supabase(?:\.cmd)?\s+.*(?:db\s+(?:push|reset)|\blink\b|\bunlink\b))') 'local validator cannot seed or invoke hosted Supabase operations'
Assert-True ($localValidator -match 'approved-migrations\.json' -and $localValidator -notmatch '202607\d{8}.*\.sql') 'local validator consumes manifest order without duplicating migration filenames'

$previousUrl = $env:TEST_SUPABASE_DB_URL
$previousRef = $env:TEST_SUPABASE_PROJECT_REF
try {
  $env:TEST_SUPABASE_DB_URL = $testUrl
  $env:TEST_SUPABASE_PROJECT_REF = $testRef
  $output = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repositoryRoot 'scripts/initialize-test-database.ps1') -ConfirmTestProject -ExpectedProjectRef $testRef -DryRun 2>&1 | Out-String
  Assert-True ($LASTEXITCODE -eq 0) 'dry run succeeds offline'
  Assert-True ($output -notmatch 'offline-secret') 'dry run does not expose secrets'
  Assert-True ($output -match '(?m)^Approved: .*20260715010000_release_3_4_intelligent_recommendations.sql') 'dry run reaches 3.4.0'
  Assert-True ($output -notmatch '(?m)^Approved: .*20260626000000_baseline_schema.sql' -and $output -notmatch '(?m)^Approved: .*20260627000000_household_foundation.sql') 'dry run excludes redundant and superseded SQL'
} finally {
  $env:TEST_SUPABASE_DB_URL = $previousUrl
  $env:TEST_SUPABASE_PROJECT_REF = $previousRef
}

Write-Host "Test database safeguard tests passed: $passed"
