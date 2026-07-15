[CmdletBinding()]
param(
  [switch]$ConfirmTestProject,
  [switch]$ConfirmLocalDisposable,
  [string]$ExpectedProjectRef,
  [switch]$AllowNonEmptyTestDatabase,
  [switch]$DryRun,
  [string]$ManifestPath,
  [string]$EnvironmentFile,
  [string]$LocalHost,
  [int]$LocalPort,
  [string]$LocalDatabase,
  [string]$LocalUser,
  [string]$PsqlPath = 'psql'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$repositoryRoot = Split-Path $PSScriptRoot -Parent
if ([string]::IsNullOrWhiteSpace($ManifestPath)) { $ManifestPath = Join-Path $repositoryRoot 'supabase/approved-migrations.json' }
if ([string]::IsNullOrWhiteSpace($EnvironmentFile)) { $EnvironmentFile = Join-Path $repositoryRoot '.env.test.local' }
Import-Module (Join-Path $PSScriptRoot 'lib/TestDatabaseSafety.psm1') -Force

function Invoke-PsqlFile {
  param([string]$Label, [string]$FilePath)
  Write-Host "Applying $Label"
  & $PsqlPath @connectionArguments -X -v ON_ERROR_STOP=1 -f $FilePath
  if ($LASTEXITCODE -ne 0) { throw "Failed while applying $Label. The target may be partially initialized." }
}

function Invoke-PsqlScalar {
  param([string]$Sql)
  $result = & $PsqlPath @connectionArguments -X -v ON_ERROR_STOP=1 -t -A -c $Sql 2>&1
  if ($LASTEXITCODE -ne 0) { throw 'A protected database preflight query failed.' }
  return ($result | Select-Object -Last 1).ToString().Trim()
}

function Invoke-PsqlCommand {
  param([string]$Sql, [string]$Label)
  & $PsqlPath @connectionArguments -X -v ON_ERROR_STOP=1 -q -c $Sql
  if ($LASTEXITCODE -ne 0) { throw "Protected database command failed: $Label" }
}

function Record-MigrationHistory {
  param([object]$Migration, [string]$Treatment)
  $name = ([IO.Path]::GetFileNameWithoutExtension($Migration.file).Substring(15)).Replace("'", "''")
  $version = $Migration.version.Replace("'", "''")
  Invoke-PsqlCommand -Sql "insert into supabase_migrations.schema_migrations(version,statements,name) values ('$version',array[]::text[],'$name') on conflict (version) do update set name=excluded.name;" -Label "$Treatment migration history record $version"
}

$manifest = Read-ApprovedMigrationManifest -ManifestPath $ManifestPath -RepositoryRoot $repositoryRoot
if ($ConfirmLocalDisposable) {
  if ($ConfirmTestProject) { throw 'Choose either hosted test-project initialization or local-disposable initialization, not both.' }
  if ($LocalHost -ne '127.0.0.1') { throw 'Local disposable initialization is restricted to 127.0.0.1.' }
  if ($LocalPort -lt 1 -or $LocalPort -gt 65535) { throw 'A valid local PostgreSQL port is required.' }
  if ($LocalDatabase -notmatch '^familyos_disposable_[a-f0-9]{12}$') { throw 'The local database name is not an approved disposable FamilyOS name.' }
  if ([string]::IsNullOrWhiteSpace($LocalUser)) { throw 'A local PostgreSQL user is required.' }
  $connectionArguments = @('-h', $LocalHost, '-p', $LocalPort.ToString(), '-U', $LocalUser, '-d', $LocalDatabase)
  $projectRef = $null
} else {
  Import-TestEnvironmentFile -Path $EnvironmentFile
  $databaseUrl = $env:TEST_SUPABASE_DB_URL
  $projectRef = $env:TEST_SUPABASE_PROJECT_REF
  [void](Assert-TestDatabaseTarget -DatabaseUrl $databaseUrl -ProjectRef $projectRef -ExpectedProjectRef $ExpectedProjectRef -Confirmed $ConfirmTestProject.IsPresent -BlockedProjectRefs @($manifest.blockedProjectRefs))
  $connectionArguments = @($databaseUrl)
}

Write-Host "FamilyOS test initialization plan: one baseline plus $($manifest.expectedExecutionMigrationCount) executable migrations through Release $($manifest.expectedLatestRelease)."
Write-Host "Production history alignment: $($manifest.expectedMigrationCount) versions, including $($manifest.expectedHistoryOnlyCount) history-only superseded/redundant files that are not executed."
Write-Host "Baseline: $($manifest.baseline.file)"
foreach ($migration in $manifest.approvedMigrations) { Write-Host "Approved: $($migration.file) [$($migration.release)]" }
foreach ($migration in $manifest.historyOnlyMigrations) { Write-Host "History only, not executed: $($migration.file) - $($migration.reason)" }
foreach ($excluded in $manifest.excludedFiles) { Write-Host "Excluded: $($excluded.file) - $($excluded.reason)" }
Write-Host 'Verification phases: schemas, tables, functions, triggers, indexes, RLS, grants, policies, auth bootstrap, Relationship OS, AI Planning, excluded artifacts, demo-data absence, migration history.'

if ($DryRun) {
  Write-Host 'Dry run complete. No database connection or remote operation occurred.'
  exit 0
}

if (-not (Test-Path -LiteralPath $PsqlPath -PathType Leaf) -and -not (Get-Command $PsqlPath -ErrorAction SilentlyContinue)) { throw 'psql is required and was not found.' }

$tableNames = @($manifest.verification.tables | ForEach-Object { "'$($_.Replace("'", "''"))'" }) -join ','
$existingCount = [int](Invoke-PsqlScalar -Sql "select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p') and c.relname in ($tableNames);")
Assert-EmptyDatabaseResult -ExistingFamilyOsTableCount $existingCount -AllowNonEmpty $AllowNonEmptyTestDatabase.IsPresent

$baselinePath = Join-Path $repositoryRoot ($manifest.baseline.file -replace '/', [IO.Path]::DirectorySeparatorChar)
Invoke-PsqlFile -Label 'FamilyOS baseline' -FilePath $baselinePath

$historySql = @'
create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (
  version text primary key,
  statements text[],
  name text
);
'@
Invoke-PsqlCommand -Sql $historySql -Label 'migration history initialization'
foreach ($historyOnly in @($manifest.historyOnlyMigrations | Where-Object { $_.satisfiedBy -eq $manifest.baseline.file })) {
  Record-MigrationHistory -Migration $historyOnly -Treatment 'baseline-satisfied'
}

foreach ($migration in $manifest.approvedMigrations) {
  $migrationPath = Join-Path $repositoryRoot ($migration.file -replace '/', [IO.Path]::DirectorySeparatorChar)
  try {
    Invoke-PsqlFile -Label $migration.file -FilePath $migrationPath
    Record-MigrationHistory -Migration $migration -Treatment 'executed'
    foreach ($historyOnly in @($manifest.historyOnlyMigrations | Where-Object { $_.satisfiedBy -eq $migration.version })) {
      Record-MigrationHistory -Migration $historyOnly -Treatment 'superseded'
    }
  } catch {
    throw "Migration failed: $($migration.file). $($_.Exception.Message)"
  }
}

if ($ConfirmLocalDisposable) {
  & (Join-Path $PSScriptRoot 'verify-test-database.ps1') -ConfirmLocalDisposable -LocalHost $LocalHost -LocalPort $LocalPort -LocalDatabase $LocalDatabase -LocalUser $LocalUser -ManifestPath $ManifestPath -PsqlPath $PsqlPath
} else {
  & (Join-Path $PSScriptRoot 'verify-test-database.ps1') -ConfirmTestProject -ExpectedProjectRef $projectRef -ManifestPath $ManifestPath -PsqlPath $PsqlPath
}
if ($LASTEXITCODE -ne 0) { throw 'Post-initialization verification failed.' }
Write-Host "Initialization verified: baseline plus $($manifest.expectedExecutionMigrationCount) executable migrations, aligned to $($manifest.expectedMigrationCount) production history versions through Release $($manifest.expectedLatestRelease). Demo seed was not run."
