Set-StrictMode -Version Latest

function Import-TestEnvironmentFile {
  param([string]$Path)
  if ([string]::IsNullOrWhiteSpace($Path) -or -not (Test-Path -LiteralPath $Path -PathType Leaf)) { return }
  foreach ($line in Get-Content -LiteralPath $Path) {
    if ($line -notmatch '^\s*([^#][^=]*)=(.*)$') { continue }
    $name = $matches[1].Trim()
    $rawValue = $matches[2]
    if ($name -notmatch '^[A-Za-z_][A-Za-z0-9_]*$' -or -not [string]::IsNullOrEmpty([Environment]::GetEnvironmentVariable($name, 'Process'))) { continue }
    $value = $rawValue.Trim()
    if ($value.Length -ge 2 -and (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'")))) { $value = $value.Substring(1, $value.Length - 2) }
    [Environment]::SetEnvironmentVariable($name, $value, 'Process')
  }
}

function Get-SafeProjectRef {
  param([Parameter(Mandatory)][string]$Value)
  $normalized = $Value.Trim().ToLowerInvariant()
  if ($normalized -notmatch '^[a-z0-9]{20}$') {
    throw 'TEST_SUPABASE_PROJECT_REF must be a 20-character lowercase Supabase project reference.'
  }
  return $normalized
}

function Get-DatabaseUrlProjectRef {
  param([Parameter(Mandatory)][string]$DatabaseUrl)
  if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) { throw 'TEST_SUPABASE_DB_URL is required.' }
  try { $uri = [System.Uri]$DatabaseUrl } catch { throw 'TEST_SUPABASE_DB_URL is malformed.' }
  if (-not $uri.IsAbsoluteUri -or $uri.Scheme -notin @('postgres', 'postgresql') -or [string]::IsNullOrWhiteSpace($uri.Host) -or [string]::IsNullOrWhiteSpace($uri.UserInfo)) {
    throw 'TEST_SUPABASE_DB_URL must be an absolute PostgreSQL connection URL.'
  }
  $hostMatch = [regex]::Match($uri.Host.ToLowerInvariant(), '^db\.([a-z0-9]{20})\.supabase\.co$')
  if ($hostMatch.Success) { return $hostMatch.Groups[1].Value }
  $username = ($uri.UserInfo -split ':', 2)[0].ToLowerInvariant()
  $userMatch = [regex]::Match($username, '^postgres\.([a-z0-9]{20})$')
  if ($userMatch.Success) { return $userMatch.Groups[1].Value }
  throw 'The database URL does not identify a Supabase project reference.'
}

function Read-ApprovedMigrationManifest {
  param([Parameter(Mandatory)][string]$ManifestPath, [Parameter(Mandatory)][string]$RepositoryRoot)
  if (-not (Test-Path -LiteralPath $ManifestPath -PathType Leaf)) { throw "Migration manifest is missing: $ManifestPath" }
  try { $manifest = Get-Content -Raw -LiteralPath $ManifestPath | ConvertFrom-Json } catch { throw 'The approved migration manifest is not valid JSON.' }
  if ($manifest.expectedLatestRelease -ne '3.3.0') { throw 'The approved manifest must target Release 3.3.0.' }
  if ($manifest.expectedMigrationCount -ne 26) { throw 'The production migration-history count must be exactly 26.' }
  if ($manifest.expectedExecutionMigrationCount -ne 24 -or $manifest.approvedMigrations.Count -ne 24) { throw 'The executable migration count must be exactly 24.' }
  if ($manifest.expectedHistoryOnlyCount -ne 2 -or $manifest.historyOnlyMigrations.Count -ne 2) { throw 'The history-only migration count must be exactly 2.' }
  $executionVersions = @($manifest.approvedMigrations | ForEach-Object { $_.version })
  $historyOnlyVersions = @($manifest.historyOnlyMigrations | ForEach-Object { $_.version })
  $versions = @($executionVersions + $historyOnlyVersions | Sort-Object)
  if (($versions | Select-Object -Unique).Count -ne 26) { throw 'Production migration versions must be unique.' }
  if (($executionVersions -join ',') -ne ((@($executionVersions | Sort-Object)) -join ',')) { throw 'Executable migrations are not in ascending version order.' }
  if ($manifest.approvedMigrations[-1].release -ne '3.3.0' -or $manifest.approvedMigrations[-1].version -ne '20260715000000' -or $manifest.approvedMigrations[-1].file -ne $manifest.expectedLatestMigrationFile) { throw 'The latest approved migration does not align with Release 3.3.0.' }
  $availableDependencies = @($manifest.baseline.file)
  foreach ($historyOnly in @($manifest.historyOnlyMigrations | Where-Object { $_.satisfiedBy -eq $manifest.baseline.file })) {
    $availableDependencies += $historyOnly.version
    $availableDependencies += $historyOnly.file
  }
  foreach ($migration in $manifest.approvedMigrations) {
    if ([IO.Path]::GetFileName($migration.file) -notmatch "^$([regex]::Escape($migration.version))_") { throw "Migration version does not match its filename: $($migration.file)" }
    foreach ($dependency in @($migration.dependencies)) {
      if ($availableDependencies -notcontains $dependency) { throw "Migration dependency is missing or out of order: $($migration.file) requires $dependency" }
    }
    if (-not [string]::IsNullOrWhiteSpace($migration.requiresEarlierMigration) -and $availableDependencies -notcontains $migration.requiresEarlierMigration) {
      throw "Required earlier migration is missing or out of order: $($migration.file)"
    }
    $availableDependencies += $migration.version
    $availableDependencies += $migration.file
    foreach ($historyOnly in @($manifest.historyOnlyMigrations | Where-Object { $_.satisfiedBy -eq $migration.version })) {
      $availableDependencies += $historyOnly.version
      $availableDependencies += $historyOnly.file
    }
  }
  $excluded = @($manifest.excludedFiles | ForEach-Object { $_.file })
  foreach ($migration in $manifest.approvedMigrations) {
    if ($excluded -contains $migration.file) { throw "Excluded SQL cannot be approved: $($migration.file)" }
  }
  foreach ($historyOnly in $manifest.historyOnlyMigrations) {
    if ($excluded -notcontains $historyOnly.file) { throw "History-only SQL must be explicitly excluded from execution: $($historyOnly.file)" }
  }
  $required = @($manifest.baseline.file) + @($manifest.approvedMigrations | ForEach-Object { $_.file }) + @($manifest.historyOnlyMigrations | ForEach-Object { $_.file })
  foreach ($relativePath in $required) {
    $absolutePath = Join-Path $RepositoryRoot ($relativePath -replace '/', [IO.Path]::DirectorySeparatorChar)
    if (-not (Test-Path -LiteralPath $absolutePath -PathType Leaf)) { throw "Required SQL file is missing: $relativePath" }
  }
  $classified = @($manifest.baseline.file) + @($manifest.approvedMigrations.file) + @($manifest.historyOnlyMigrations.file) + @($manifest.excludedFiles.file)
  $repositorySql = @(Get-ChildItem -LiteralPath (Join-Path $RepositoryRoot 'supabase') -Filter '*.sql' -File) + @(Get-ChildItem -LiteralPath (Join-Path $RepositoryRoot 'supabase/migrations') -Filter '*.sql' -File)
  foreach ($file in $repositorySql) {
    $relative = $file.FullName.Substring($RepositoryRoot.Length + 1).Replace('\', '/')
    if ($classified -notcontains $relative) { throw "SQL file is not classified by the manifest: $relative" }
  }
  return $manifest
}

function Assert-TestDatabaseTarget {
  param(
    [string]$DatabaseUrl,
    [string]$ProjectRef,
    [string]$ExpectedProjectRef,
    [bool]$Confirmed,
    [string[]]$BlockedProjectRefs
  )
  if (-not $Confirmed) { throw 'Pass -ConfirmTestProject to authorize this dedicated test target.' }
  $actual = Get-SafeProjectRef -Value $ProjectRef
  if ($BlockedProjectRefs -contains $actual -or $actual -match 'prod') { throw 'The configured project reference is prohibited for test initialization.' }
  if (-not [string]::IsNullOrWhiteSpace($ExpectedProjectRef)) {
    $expected = Get-SafeProjectRef -Value $ExpectedProjectRef
    if ($expected -ne $actual) { throw 'Expected and configured project references do not match.' }
  }
  $urlRef = Get-DatabaseUrlProjectRef -DatabaseUrl $DatabaseUrl
  if ($urlRef -ne $actual) { throw 'The database URL and configured project references do not match.' }
  return $actual
}

function Assert-EmptyDatabaseResult {
  param([int]$ExistingFamilyOsTableCount, [bool]$AllowNonEmpty)
  if ($ExistingFamilyOsTableCount -gt 0 -and -not $AllowNonEmpty) {
    throw 'FamilyOS tables already exist. Use -AllowNonEmptyTestDatabase only after independently confirming this dedicated test target.'
  }
}

function Protect-SecretText {
  param([string]$Text, [string[]]$Secrets)
  $safe = $Text
  foreach ($secret in $Secrets) {
    if (-not [string]::IsNullOrEmpty($secret)) { $safe = $safe.Replace($secret, '[REDACTED]') }
  }
  return $safe
}

Export-ModuleMember -Function Import-TestEnvironmentFile, Get-SafeProjectRef, Get-DatabaseUrlProjectRef, Read-ApprovedMigrationManifest, Assert-TestDatabaseTarget, Assert-EmptyDatabaseResult, Protect-SecretText
