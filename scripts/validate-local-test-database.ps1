[CmdletBinding()]
param(
  [string]$ManifestPath,
  [string]$PostgresBin
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repositoryRoot = Split-Path $PSScriptRoot -Parent
if ([string]::IsNullOrWhiteSpace($ManifestPath)) { $ManifestPath = Join-Path $repositoryRoot 'supabase/approved-migrations.json' }
Import-Module (Join-Path $PSScriptRoot 'lib/TestDatabaseSafety.psm1') -Force
$manifest = Read-ApprovedMigrationManifest -ManifestPath $ManifestPath -RepositoryRoot $repositoryRoot

if ([string]::IsNullOrWhiteSpace($PostgresBin)) {
  $PostgresBin = Get-ChildItem -LiteralPath 'C:\Program Files\PostgreSQL' -Directory -ErrorAction SilentlyContinue |
    Sort-Object { try { [version]$_.Name } catch { [version]'0.0' } } -Descending |
    ForEach-Object { Join-Path $_.FullName 'bin' } |
    Where-Object { Test-Path -LiteralPath (Join-Path $_ 'initdb.exe') -PathType Leaf } |
    Select-Object -First 1
}
if ([string]::IsNullOrWhiteSpace($PostgresBin)) { throw 'A local PostgreSQL binary directory containing initdb is required.' }

$requiredTools = @('initdb.exe','pg_ctl.exe','psql.exe','createdb.exe')
foreach ($tool in $requiredTools) {
  if (-not (Test-Path -LiteralPath (Join-Path $PostgresBin $tool) -PathType Leaf)) { throw "Required PostgreSQL tool is missing: $tool" }
}

$instanceId = [guid]::NewGuid().ToString('N')
$databaseName = 'familyos_disposable_' + $instanceId.Substring(0, 12)
$databaseUser = 'familyos_local_admin'
$temporaryRoot = Join-Path ([IO.Path]::GetTempPath()) ('familyos-local-pg-' + $instanceId)
$dataDirectory = Join-Path $temporaryRoot 'data'
$passwordFile = Join-Path $temporaryRoot 'password.txt'
$postgresLog = Join-Path $temporaryRoot 'postgres.log'
$bootstrapFile = Join-Path $temporaryRoot 'supabase-local-compatibility.sql'
$authTestFile = Join-Path $temporaryRoot 'auth-bootstrap-validation.sql'
$baselinePath = Join-Path $repositoryRoot ($manifest.baseline.file -replace '/', [IO.Path]::DirectorySeparatorChar)
$passwordBytes = New-Object byte[] 32
$randomNumberGenerator = [Security.Cryptography.RandomNumberGenerator]::Create()
try { $randomNumberGenerator.GetBytes($passwordBytes) } finally { $randomNumberGenerator.Dispose() }
$password = ([BitConverter]::ToString($passwordBytes)).Replace('-', '').ToLowerInvariant()
[Array]::Clear($passwordBytes, 0, $passwordBytes.Length)
$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
$listener.Start()
$port = ([Net.IPEndPoint]$listener.LocalEndpoint).Port
$listener.Stop()
$clusterStarted = $false
$previousPassword = [Environment]::GetEnvironmentVariable('PGPASSWORD', 'Process')

Write-Host 'FamilyOS disposable database validation plan'
Write-Host "Local validation method: isolated PostgreSQL temporary cluster"
Write-Host "Disposable database: $databaseName"
Write-Host "Baseline: $($manifest.baseline.file)"
Write-Host "Executable migrations: $($manifest.expectedExecutionMigrationCount)"
Write-Host "History-only versions: $($manifest.expectedHistoryOnlyCount)"
Write-Host "Target release: $($manifest.expectedLatestRelease)"
Write-Host 'Network boundary: 127.0.0.1 only. No hosted endpoint will be contacted.'

$bootstrapSql = @'
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create schema storage;
create schema extensions;
create extension pgcrypto;
create table auth.users (
  id uuid primary key,
  email text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create or replace function auth.uid()
returns uuid
language sql
stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create table storage.buckets (
  id text primary key,
  name text not null unique,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
alter table storage.objects enable row level security;
create or replace function storage.foldername(name text)
returns text[]
language sql
immutable
as $$ select string_to_array(name, '/') $$;
grant usage on schema auth, storage, extensions to anon, authenticated, service_role;
'@

$authTestSql = @'
begin;
do $familyos_auth_test$
declare test_user_id uuid := gen_random_uuid();
begin
  insert into auth.users(id, email, raw_user_meta_data)
  values (test_user_id, 'disposable-auth-bootstrap@invalid.example', '{"full_name":"Disposable Validation"}'::jsonb);
  if not exists (select 1 from public.profiles where id=test_user_id) then raise exception 'Auth bootstrap did not create a profile.'; end if;
  if not exists (select 1 from public.households where bootstrap_source_user_id=test_user_id) then raise exception 'Auth bootstrap did not create a household.'; end if;
  if not exists (select 1 from public.household_members where user_id=test_user_id and role='owner' and status='active') then raise exception 'Auth bootstrap did not create owner membership.'; end if;
  if not exists (select 1 from public.household_settings hs join public.households h on h.id=hs.household_id where h.bootstrap_source_user_id=test_user_id) then raise exception 'Auth bootstrap did not create household settings.'; end if;
  if not exists (select 1 from public.user_preferences where user_id=test_user_id) then raise exception 'Auth bootstrap did not create user preferences.'; end if;
  if not exists (select 1 from familyos_internal.household_bootstrap_map where user_id=test_user_id) then raise exception 'Auth bootstrap did not create its internal mapping.'; end if;
end
$familyos_auth_test$;
rollback;
'@

try {
  New-Item -ItemType Directory -Path $temporaryRoot -Force | Out-Null
  Set-Content -LiteralPath $passwordFile -Value $password -Encoding UTF8 -NoNewline
  & (Join-Path $PostgresBin 'initdb.exe') -D $dataDirectory --username=$databaseUser --pwfile=$passwordFile --auth-host=scram-sha-256 --auth-local=scram-sha-256 --encoding=UTF8 --no-locale
  if ($LASTEXITCODE -ne 0) { throw 'Local PostgreSQL cluster initialization failed.' }
  Remove-Item -LiteralPath $passwordFile -Force

  & (Join-Path $PostgresBin 'pg_ctl.exe') -D $dataDirectory -o "-h 127.0.0.1 -p $port" -l $postgresLog -w start
  if ($LASTEXITCODE -ne 0) { throw 'Local PostgreSQL cluster startup failed.' }
  $clusterStarted = $true
  [Environment]::SetEnvironmentVariable('PGPASSWORD', $password, 'Process')

  & (Join-Path $PostgresBin 'createdb.exe') -h 127.0.0.1 -p $port -U $databaseUser $databaseName
  if ($LASTEXITCODE -ne 0) { throw 'Disposable FamilyOS database creation failed.' }

  Set-Content -LiteralPath $bootstrapFile -Value $bootstrapSql -Encoding UTF8
  & (Join-Path $PostgresBin 'psql.exe') -h 127.0.0.1 -p $port -U $databaseUser -d $databaseName -X -v ON_ERROR_STOP=1 -f $bootstrapFile
  if ($LASTEXITCODE -ne 0) { throw 'Local Supabase compatibility bootstrap failed.' }

  & (Join-Path $PSScriptRoot 'initialize-test-database.ps1') -ConfirmLocalDisposable -LocalHost 127.0.0.1 -LocalPort $port -LocalDatabase $databaseName -LocalUser $databaseUser -ManifestPath $ManifestPath -PsqlPath (Join-Path $PostgresBin 'psql.exe')
  if ($LASTEXITCODE -ne 0) { throw 'The repository initializer failed against the disposable database.' }

  Set-Content -LiteralPath $authTestFile -Value $authTestSql -Encoding UTF8
  & (Join-Path $PostgresBin 'psql.exe') -h 127.0.0.1 -p $port -U $databaseUser -d $databaseName -X -v ON_ERROR_STOP=1 -f $authTestFile
  if ($LASTEXITCODE -ne 0) { throw 'Transactional auth bootstrap behavior validation failed.' }

  Write-Host "Disposable validation passed: baseline plus $($manifest.expectedExecutionMigrationCount) executable migrations, $($manifest.expectedMigrationCount) history versions, Release $($manifest.expectedLatestRelease), repository verifier, empty application data, and auth bootstrap behavior."
} catch {
  Write-Error $_
  if (Test-Path -LiteralPath $postgresLog -PathType Leaf) {
    Write-Host 'Local PostgreSQL diagnostic log tail:'
    Get-Content -LiteralPath $postgresLog -Tail 80
  }
  throw
} finally {
  [Environment]::SetEnvironmentVariable('PGPASSWORD', $previousPassword, 'Process')
  $password = $null
  if ($clusterStarted) {
    & (Join-Path $PostgresBin 'pg_ctl.exe') -D $dataDirectory -m fast -w stop | Out-Host
  }
  $resolvedTemp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
  $resolvedRoot = [IO.Path]::GetFullPath($temporaryRoot)
  if ($resolvedRoot.StartsWith($resolvedTemp, [StringComparison]::OrdinalIgnoreCase) -and (Split-Path $resolvedRoot -Leaf) -like 'familyos-local-pg-*') {
    Remove-Item -LiteralPath $resolvedRoot -Recurse -Force -ErrorAction SilentlyContinue
  } else {
    Write-Warning 'Disposable directory cleanup was skipped because its path failed the safety check.'
  }
}

Write-Host 'Cleanup passed: the disposable PostgreSQL cluster and database were removed.'
