[CmdletBinding()]
param(
  [switch]$ConfirmTestProject,
  [switch]$ConfirmLocalDisposable,
  [string]$ExpectedProjectRef,
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
$manifest = Read-ApprovedMigrationManifest -ManifestPath $ManifestPath -RepositoryRoot $repositoryRoot

if ($ConfirmLocalDisposable) {
  if ($ConfirmTestProject) { throw 'Choose either hosted test-project verification or local-disposable verification, not both.' }
  if ($LocalHost -ne '127.0.0.1') { throw 'Local disposable verification is restricted to 127.0.0.1.' }
  if ($LocalPort -lt 1 -or $LocalPort -gt 65535) { throw 'A valid local PostgreSQL port is required.' }
  if ($LocalDatabase -notmatch '^familyos_disposable_[a-f0-9]{12}$') { throw 'The local database name is not an approved disposable FamilyOS name.' }
  if ([string]::IsNullOrWhiteSpace($LocalUser)) { throw 'A local PostgreSQL user is required.' }
  $connectionArguments = @('-h', $LocalHost, '-p', $LocalPort.ToString(), '-U', $LocalUser, '-d', $LocalDatabase)
} else {
  Import-TestEnvironmentFile -Path $EnvironmentFile
  [void](Assert-TestDatabaseTarget -DatabaseUrl $env:TEST_SUPABASE_DB_URL -ProjectRef $env:TEST_SUPABASE_PROJECT_REF -ExpectedProjectRef $ExpectedProjectRef -Confirmed $ConfirmTestProject.IsPresent -BlockedProjectRefs @($manifest.blockedProjectRefs))
  $connectionArguments = @($env:TEST_SUPABASE_DB_URL)
}

$phases = @('expected schemas','expected tables','expected functions','expected triggers','expected indexes','RLS enabled','anonymous privileges denied','authenticated grants','household policies','auth bootstrap trigger','Relationship OS structures','AI Planning structures and scoping','excluded artifacts absent','demo data absent','migration history aligned')
foreach ($phase in $phases) { Write-Host "Verify: $phase" }
if ($DryRun) { Write-Host 'Verification dry run complete. No database connection occurred.'; exit 0 }
if (-not (Test-Path -LiteralPath $PsqlPath -PathType Leaf) -and -not (Get-Command $PsqlPath -ErrorAction SilentlyContinue)) { throw 'psql is required and was not found.' }

function Sql-Array([object[]]$Values) { return 'array[' + (($Values | ForEach-Object { "'$($_.ToString().Replace("'", "''"))'" }) -join ',') + ']::text[]' }
$schemas = Sql-Array @($manifest.verification.schemas)
$tables = Sql-Array @($manifest.verification.tables)
$functions = Sql-Array @($manifest.verification.functions)
$triggers = Sql-Array @($manifest.verification.triggers)
$indexes = Sql-Array @($manifest.verification.indexes)
$rls = Sql-Array @($manifest.verification.rlsTables)
$authenticated = Sql-Array @($manifest.verification.authenticatedGrantTables)
$anonymous = Sql-Array @($manifest.verification.anonymousDeniedTables)
$policyTables = Sql-Array @($manifest.verification.householdPolicyTables)
$excluded = Sql-Array @($manifest.verification.excludedArtifacts)
$versions = Sql-Array @(@($manifest.approvedMigrations.version) + @($manifest.historyOnlyMigrations.version))
$householdScoped = Sql-Array @($manifest.verification.householdScopedTables)
$userAttributed = Sql-Array @($manifest.verification.userAttributedTables)
$updatedAt = Sql-Array @($manifest.verification.updatedAtTables)
$demoId = $manifest.verification.demoHouseholdId
$expectedCount = [int]$manifest.expectedMigrationCount

$verificationSql = @"
do `$familyos_verify`$
declare missing text[]; unexpected text[]; history_count integer; application_table text; row_count bigint;
begin
  select array_agg(x) into missing from unnest($schemas) x where not exists (select 1 from pg_namespace where nspname=x);
  if missing is not null then raise exception 'Missing expected schemas: %', missing; end if;
  select array_agg(x) into missing from unnest($tables) x where to_regclass('public.'||x) is null;
  if missing is not null then raise exception 'Missing expected tables: %', missing; end if;
  select array_agg(x) into missing from unnest($householdScoped) x where not exists (select 1 from information_schema.columns where table_schema='public' and table_name=x and column_name='household_id' and data_type='uuid' and is_nullable='NO');
  if missing is not null then raise exception 'Household scoping is missing: %', missing; end if;
  select array_agg(x) into missing from unnest($userAttributed) x where not exists (select 1 from information_schema.columns where table_schema='public' and table_name=x and column_name='user_id' and data_type='uuid' and is_nullable='NO');
  if missing is not null then raise exception 'User attribution is missing: %', missing; end if;
  select array_agg(x) into missing from unnest($updatedAt) x where not exists (select 1 from information_schema.columns where table_schema='public' and table_name=x and column_name='updated_at' and data_type='timestamp with time zone' and is_nullable='NO');
  if missing is not null then raise exception 'Updated-at columns are missing: %', missing; end if;
  select array_agg(x) into missing from unnest($householdScoped) x where not exists (
    select 1 from pg_constraint con join pg_class src on src.oid=con.conrelid join pg_namespace src_ns on src_ns.oid=src.relnamespace join pg_class dst on dst.oid=con.confrelid join pg_namespace dst_ns on dst_ns.oid=dst.relnamespace
    where con.contype='f' and src_ns.nspname='public' and src.relname=x and dst_ns.nspname='public' and dst.relname='households'
  );
  if missing is not null then raise exception 'Household foreign keys are missing: %', missing; end if;
  select array_agg(x) into missing from unnest($userAttributed) x where not exists (
    select 1 from pg_constraint con join pg_class src on src.oid=con.conrelid join pg_namespace src_ns on src_ns.oid=src.relnamespace join pg_class dst on dst.oid=con.confrelid join pg_namespace dst_ns on dst_ns.oid=dst.relnamespace
    where con.contype='f' and src_ns.nspname='public' and src.relname=x and dst_ns.nspname='auth' and dst.relname='users'
  );
  if missing is not null then raise exception 'Auth-user foreign keys are missing: %', missing; end if;
  if to_regclass('familyos_internal.household_bootstrap_map') is null then raise exception 'Internal household bootstrap map is missing.'; end if;
  select array_agg(x) into missing from unnest($functions) x where not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=x);
  if missing is not null then raise exception 'Missing expected functions: %', missing; end if;
  select array_agg(x) into missing from unnest($triggers) x where not exists (select 1 from pg_trigger where tgname=x and not tgisinternal);
  if missing is not null then raise exception 'Missing expected triggers: %', missing; end if;
  if not exists (select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where t.tgname='familyos_bootstrap_auth_user_on_insert' and n.nspname='auth' and c.relname='users' and not t.tgisinternal) then raise exception 'Auth bootstrap trigger is not attached to auth.users.'; end if;
  select array_agg(x) into missing from unnest($indexes) x where not exists (select 1 from pg_indexes where schemaname='public' and indexname=x);
  if missing is not null then raise exception 'Missing expected indexes: %', missing; end if;
  select array_agg(x) into missing from unnest($rls) x where not exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=x and c.relrowsecurity);
  if missing is not null then raise exception 'RLS is not enabled: %', missing; end if;
  select array_agg(x) into unexpected from unnest($anonymous) x where has_table_privilege('anon','public.'||x,'SELECT') or has_table_privilege('anon','public.'||x,'INSERT') or has_table_privilege('anon','public.'||x,'UPDATE') or has_table_privilege('anon','public.'||x,'DELETE');
  if unexpected is not null then raise exception 'Anonymous privileges remain: %', unexpected; end if;
  select array_agg(x) into unexpected from unnest($anonymous) x where exists (select 1 from information_schema.table_privileges where table_schema='public' and table_name=x and grantee='PUBLIC' and privilege_type in ('SELECT','INSERT','UPDATE','DELETE'));
  if unexpected is not null then raise exception 'Public privileges remain: %', unexpected; end if;
  select array_agg(x) into missing from unnest($authenticated) x where not (has_table_privilege('authenticated','public.'||x,'SELECT') and has_table_privilege('authenticated','public.'||x,'INSERT') and has_table_privilege('authenticated','public.'||x,'UPDATE') and has_table_privilege('authenticated','public.'||x,'DELETE'));
  if missing is not null then raise exception 'Authenticated CRUD grants are incomplete: %', missing; end if;
  select array_agg(x) into missing from unnest($policyTables) x where not exists (select 1 from pg_policies where schemaname='public' and tablename=x and (coalesce(qual,'')||coalesce(with_check,'')) ~ '(familyos_|household|auth\.uid)');
  if missing is not null then raise exception 'Household policy coverage is missing: %', missing; end if;
  select array_agg(x) into missing from unnest($householdScoped) x where not exists (select 1 from pg_policies where schemaname='public' and tablename=x and coalesce(with_check,'') ~ 'owner' and coalesce(with_check,'') ~ 'adult');
  if missing is not null then raise exception 'Owner/adult write policy coverage is missing: %', missing; end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='pool_readings' and column_name='test_context' and data_type='text' and is_nullable='NO') then raise exception 'Canonical Pool test_context column is missing.'; end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='pool_readings' and column_name='water_appearance' and is_nullable='YES') then raise exception 'Pool water_appearance must be optional.'; end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='pool_readings' and column_name='recent_weather_notes' and is_nullable='YES') then raise exception 'Pool recent_weather_notes must be optional.'; end if;
  if not exists (select 1 from pg_constraint where conrelid='public.pool_action_audits'::regclass and contype='f' and confrelid='public.pool_readings'::regclass) then raise exception 'Pool action audit reading foreign key is missing.'; end if;
  if not exists (select 1 from pg_constraint where conrelid='public.pool_action_audits'::regclass and conname='pool_action_audits_status_check' and contype='c') then raise exception 'Pool action audit canonical status constraint is missing.'; end if;
  if not exists (select 1 from pg_constraint where conrelid='public.relationship_goals'::regclass and contype='f' and confrelid='public.relationships'::regclass) then raise exception 'Relationship goal foreign key is missing.'; end if;
  if not exists (select 1 from pg_constraint where conrelid='public.relationship_activities'::regclass and contype='f' and confrelid='public.relationships'::regclass) then raise exception 'Relationship activity foreign key is missing.'; end if;
  if not exists (select 1 from storage.buckets where id='household-attachments' and public=false) then raise exception 'Private household attachment bucket is missing.'; end if;
  if (select count(*) from pg_policies where schemaname='storage' and tablename='objects' and policyname in ('household_attachments_select','household_attachments_insert','household_attachments_delete')) <> 3 then raise exception 'Household attachment Storage policies are incomplete.'; end if;
  select array_agg(x) into unexpected from unnest($excluded) x where to_regclass('public.'||x) is not null;
  if unexpected is not null then raise exception 'Excluded migration artifacts exist: %', unexpected; end if;
  if exists (select 1 from public.households where id='$demoId'::uuid) then raise exception 'Demo household exists before the separately authorized seed.'; end if;
  if exists (select 1 from auth.users where lower(email)=lower('test@familyos.app')) then raise exception 'Demo auth user exists before the separately authorized seed.'; end if;
  foreach application_table in array $tables loop
    execute format('select count(*) from public.%I', application_table) into row_count;
    if row_count <> 0 then raise exception 'Unexpected application data exists in public.%: % rows', application_table, row_count; end if;
  end loop;
  select count(*) into history_count from supabase_migrations.schema_migrations where version=any($versions);
  if history_count <> $expectedCount then raise exception 'Approved migration history count mismatch: %', history_count; end if;
  if exists (select 1 from supabase_migrations.schema_migrations where version not in (select unnest($versions))) then raise exception 'Migration history contains versions outside the approved 3.3 chain.'; end if;
end
`$familyos_verify`$;
"@

$temporarySql = Join-Path ([IO.Path]::GetTempPath()) ("familyos-verify-" + [guid]::NewGuid().ToString('N') + '.sql')
try {
  Set-Content -LiteralPath $temporarySql -Value $verificationSql -Encoding UTF8
  & $PsqlPath @connectionArguments -X -v ON_ERROR_STOP=1 -f $temporarySql
  if ($LASTEXITCODE -ne 0) { throw 'FamilyOS test database verification failed.' }
} finally {
  Remove-Item -LiteralPath $temporarySql -Force -ErrorAction SilentlyContinue
}
Write-Host "Verification passed: $expectedCount production history versions through Release $($manifest.expectedLatestRelease); no demo data was found."
