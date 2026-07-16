[CmdletBinding()]
param([string]$EnvironmentFile, [string]$PsqlPath = 'C:\Program Files\PostgreSQL\18\bin\psql.exe')

$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path $PSScriptRoot -Parent
if ([string]::IsNullOrWhiteSpace($EnvironmentFile)) { $EnvironmentFile = Join-Path $repositoryRoot '.env.test.local' }
Import-Module (Join-Path $PSScriptRoot 'lib/TestDatabaseSafety.psm1') -Force
Import-TestEnvironmentFile -Path $EnvironmentFile
$manifest = Read-ApprovedMigrationManifest -ManifestPath (Join-Path $repositoryRoot 'supabase/approved-migrations.json') -RepositoryRoot $repositoryRoot
[void](Assert-TestDatabaseTarget -DatabaseUrl $env:TEST_SUPABASE_DB_URL -ProjectRef $env:TEST_SUPABASE_PROJECT_REF -ExpectedProjectRef $env:TEST_SUPABASE_PROJECT_REF -Confirmed $true -BlockedProjectRefs @($manifest.blockedProjectRefs))
if (-not (Test-Path -LiteralPath $PsqlPath -PathType Leaf)) { throw 'PostgreSQL psql client is required.' }

$marker = 'release-3.4-upgrade-' + [guid]::NewGuid().ToString('N')
$fixtureSql = @"
insert into public.recommendation_history(household_id,user_id,recommendation_key,action,trigger_signature)
select hm.household_id,hm.user_id,'$marker','generated','$marker'
from public.household_members hm where hm.user_id is not null and hm.status='active' limit 1;
do `$fixture_verify`$ begin if (select count(*) from public.recommendation_history where recommendation_key='$marker') <> 1 then raise exception 'Representative fixture was not created.'; end if; end `$fixture_verify`$;
"@
& $PsqlPath $env:TEST_SUPABASE_DB_URL -X -v ON_ERROR_STOP=1 -q -c $fixtureSql
if ($LASTEXITCODE -ne 0) { throw 'Could not create the representative Release 3.3 fixture.' }
try {
  & $PsqlPath $env:TEST_SUPABASE_DB_URL -X -v ON_ERROR_STOP=1 -f (Join-Path $repositoryRoot 'supabase/migrations/20260715010000_release_3_4_intelligent_recommendations.sql')
  if ($LASTEXITCODE -ne 0) { throw 'Release 3.4 migration rerun failed.' }
  $verifySql = @"
do `$upgrade_verify`$
begin
  if not exists(select 1 from public.recommendation_history where recommendation_key='$marker' and trigger_signature='$marker') then raise exception 'Pre-3.4 record was not preserved.'; end if;
  if (select count(*) from supabase_migrations.schema_migrations where version='20260715010000') <> 1 then raise exception 'Release 3.4 ledger entry is not unique.'; end if;
  if to_regclass('public.recommendation_feedback') is null or to_regclass('public.recommendation_effectiveness') is null or to_regclass('public.recommendation_learning') is null or to_regclass('public.recommendation_dependencies') is null then raise exception 'Release 3.4 structures are incomplete.'; end if;
  if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in('recommendation_feedback','recommendation_effectiveness','recommendation_learning','recommendation_dependencies') and not c.relrowsecurity) then raise exception 'Release 3.4 RLS is incomplete.'; end if;
end
`$upgrade_verify`$;
"@
  & $PsqlPath $env:TEST_SUPABASE_DB_URL -X -v ON_ERROR_STOP=1 -q -c $verifySql
  if ($LASTEXITCODE -ne 0) { throw 'Release 3.3-to-3.4 preservation verification failed.' }
  Write-Host 'Release 3.3-to-3.4 hosted-test upgrade and rerun validation passed: representative history preserved, structures/RLS present, and ledger unique.'
} finally {
  & $PsqlPath $env:TEST_SUPABASE_DB_URL -X -v ON_ERROR_STOP=1 -q -c "delete from public.recommendation_history where recommendation_key='$marker';" | Out-Null
}
