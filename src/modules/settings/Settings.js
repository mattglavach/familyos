import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Copy,
  Database,
  Info,
  LogOut,
  MailPlus,
  RefreshCw,
  ShieldCheck,
  Save,
  Settings as SettingsIcon,
  Trash2,
  UserMinus,
  UserRound,
  Users,
} from "lucide-react";
import { Badge, StatusBadge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyStatePanel } from "../../components/ui/empty-state";
import { FormError, FormGroup, FormHelp, FormRow, FormSection } from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { SectionHeader } from "../../components/ui/section-header";
import { Select } from "../../components/ui/select";
import { S } from "../../theme";
import { APP_CONFIG, CONFIG_STATUS } from "../../config";
import { useHousehold } from "../../context/HouseholdContext";
import { HOUSEHOLD_ROLES, INVITABLE_ROLES, roleCanManageMembers, roleLabel, useHouseholdInvitations } from "../../hooks/useHouseholdCollaboration";
import { supabase } from "../../lib/supabase";
import { useFamilyMembers } from "../dashboard/useFamilyMembers";
import {
  DEFAULT_SETTINGS,
  LOCAL_DATA_KEYS,
  TASK_CATEGORY_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  localDataSnapshot,
} from "./localSettings";

function formatDateTime(value) {
  if (!value) return "Not synced yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function calendarTone(gc) {
  if (gc.error || gc.status === "expired" || gc.status === "permission-error") return "warning";
  if (gc.loading || gc.status === "syncing" || gc.status === "connecting") return "warning";
  if (gc.token) return "connected";
  return "neutral";
}

function calendarLabel(gc) {
  if (gc.loading || gc.status === "syncing") return "Syncing";
  if (gc.error) return "Needs attention";
  if (!gc.token) return "Disconnected";
  if (gc.status === "empty") return "Connected, no events";
  return "Connected";
}

function serverCalendarTone(calendar) {
  if (calendar.error || calendar.status === "error" || calendar.status === "needs_reauth") return "warning";
  if (calendar.loading || calendar.status === "pending") return "warning";
  if (calendar.connected) return "connected";
  return "neutral";
}

function serverCalendarLabel(calendar) {
  if (calendar.loading) return "Checking";
  if (calendar.error) return "Needs setup";
  if (calendar.status === "pending") return "Pending OAuth";
  if (calendar.status === "needs_reauth") return "Reconnect needed";
  if (calendar.connected) return "Connected";
  return "Disconnected";
}

function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-card-foreground shadow-soft" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <span>{toast.message}</span>
        <Button type="button" variant="ghost" size="xs" onClick={onDismiss}>Dismiss</Button>
      </div>
    </div>
  );
}

function SettingRow({ label, value, badge }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="min-w-0 text-right text-sm font-semibold text-foreground">
        {badge || <span className="break-words">{value}</span>}
      </div>
    </div>
  );
}

function statusTone(status) {
  if (status === "active" || status === "accepted") return "healthy";
  if (status === "pending") return "warning";
  if (status === "removed" || status === "revoked" || status === "declined") return "neutral";
  return "neutral";
}

function formatInviteExpiry(value) {
  if (!value) return "No expiry";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function Settings({ auth, gc, secureCalendar }) {
  const household = useHousehold();
  const family = useFamilyMembers();
  const invitations = useHouseholdInvitations(household);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "adult" });
  const [snapshot, setSnapshot] = useState(() => localDataSnapshot());
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const defaultPerson = household.userPreferences?.default_person_id;
    const defaultMember = family.members.find(member => member.id === defaultPerson);
    const defaultPriority = household.userPreferences?.default_task_priority || household.householdSettings?.default_task_priority;
    setSettings({
      householdName: household.household?.name || DEFAULT_SETTINGS.householdName,
      profileName: household.profile?.display_name || "",
      defaultFamilyMember: defaultMember?.id || "Family",
      taskDefaultCategory: household.userPreferences?.default_task_category || household.householdSettings?.default_task_category || DEFAULT_SETTINGS.taskDefaultCategory,
      taskDefaultPriority: defaultPriority === "medium" ? "med" : defaultPriority || DEFAULT_SETTINGS.taskDefaultPriority,
    });
  }, [family.members, household.household, household.householdSettings, household.profile, household.userPreferences]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);

  function notify(message) {
    setToast({ message });
  }

  function refreshSnapshot() {
    setSnapshot(localDataSnapshot());
  }

  function dbPriority(value) {
    return value === "med" ? "medium" : value;
  }

  async function saveSettings() {
    try {
      if (!household.householdId) throw new Error("Missing active household.");
      const defaultPersonId = settings.defaultFamilyMember === "Family" ? null : settings.defaultFamilyMember;
      const profileName = String(settings.profileName || "").trim() || null;
      const householdName = String(settings.householdName || "").trim() || DEFAULT_SETTINGS.householdName;
      const taskPriority = dbPriority(settings.taskDefaultPriority);

      const operations = [
        supabase.from("profiles").update({ display_name: profileName }).eq("id", auth.session.user.id),
        supabase.from("household_settings").upsert({
          household_id: household.householdId,
          default_task_category: settings.taskDefaultCategory,
          default_task_priority: taskPriority,
        }),
        supabase.from("user_preferences").upsert({
          user_id: auth.session.user.id,
          default_household_id: household.householdId,
          default_person_id: defaultPersonId,
          default_task_category: settings.taskDefaultCategory,
          default_task_priority: taskPriority,
        }),
      ];
      if (household.canManageHousehold) {
        operations.push(supabase.from("households").update({ name: householdName }).eq("id", household.householdId));
      }
      const results = await Promise.all(operations);
      const failed = results.find(result => result.error);
      if (failed) throw failed.error;
      await household.refresh();
      setError("");
      refreshSnapshot();
      notify("Settings saved.");
    } catch {
      setError("Settings could not be saved on this device.");
    }
  }

  async function switchHousehold(event) {
    const result = await household.switchHousehold(event.target.value);
    if (!result.ok) {
      setError(result.error || "Household could not be switched.");
      return;
    }
    notify("Household switched.");
  }

  async function createInvite() {
    const result = await invitations.createInvitation(inviteForm);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setInviteForm({ email: "", role: "adult" });
    setError("");
    notify("Invitation created.");
  }

  async function copyInviteLink() {
    const link = invitations.createdInvite?.inviteLink;
    if (!link || !navigator.clipboard) return;
    await navigator.clipboard.writeText(link);
    notify("Invite link copied.");
  }

  async function revokeInvite(invitationId) {
    if (!window.confirm("Revoke this household invitation?")) return;
    const result = await invitations.revokeInvitation(invitationId);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    notify("Invitation revoked.");
  }

  async function updateMembership(membership, patch) {
    if (!roleCanManageMembers(household.membership?.role)) {
      setError("Only household owners can change member roles or remove members.");
      return;
    }
    if (membership.user_id === household.user?.id && patch.status && patch.status !== "active") {
      setError("Owners cannot remove themselves from the active household here.");
      return;
    }
    const { error: updateError } = await supabase
      .from("household_members")
      .update(patch)
      .eq("id", membership.id)
      .eq("household_id", household.householdId);
    if (updateError) {
      setError(updateError.message || "Member could not be updated.");
      return;
    }
    await household.refresh();
    notify("Member updated.");
  }

  function reconnectCalendar() {
    gc.signIn();
    notify("Opening Google Calendar connection.");
  }

  async function connectSecureCalendar() {
    const result = await secureCalendar.connect();
    if (result?.authorizationUrl) {
      window.location.assign(result.authorizationUrl);
      return;
    }
    notify("Secure calendar connection placeholder created.");
  }

  async function disconnectSecureCalendar() {
    if (!window.confirm("Disconnect the server-side Google Calendar connection for this household?")) return;
    await secureCalendar.disconnect(secureCalendar.connection?.id);
    notify("Server-side calendar connection disconnected.");
  }

  function clearCalendarToken() {
    if (!window.confirm("Clear the local Google Calendar token on this device? You can reconnect afterward.")) return;
    gc.clearLocalConnection?.();
    refreshSnapshot();
    notify("Local calendar token cleared.");
  }

  function resetLocalData() {
    if (!window.confirm("Reset local FamilyOS browser data on this device? Supabase household, profile, family member, and task data will not be deleted.")) return;
    LOCAL_DATA_KEYS.forEach(key => window.localStorage.removeItem(key));
    gc.clearLocalConnection?.();
    setSettings(DEFAULT_SETTINGS);
    refreshSnapshot();
    notify("Local app data reset. Refresh to reload default family and task metadata.");
  }

  const email = auth.session?.user?.email || "Unknown";
  const userId = auth.session?.user?.id || "Unavailable";
  const activeMembers = family.activeMembers;
  const peopleById = useMemo(() => household.people.reduce((map, person) => {
    map[person.id] = person;
    return map;
  }, {}), [household.people]);
  const currentUserMemberships = household.userMemberships.filter(membership => membership.user_id === household.user?.id && membership.status === "active");
  const userHouseholdNames = useMemo(() => household.userHouseholds.reduce((map, item) => {
    map[item.id] = item.name;
    return map;
  }, {}), [household.userHouseholds]);
  const householdMembers = household.memberships.filter(membership => membership.household_id === household.householdId);
  const canManageMembers = roleCanManageMembers(household.membership?.role);
  const localBytes = snapshot.reduce((total, item) => total + item.bytes, 0);
  const missingConfig = CONFIG_STATUS.missing || [];

  return (
    <div style={S.screen} className="space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
          <SettingsIcon className="h-4 w-4" aria-hidden="true" />
          Settings
        </div>
        <div className="mt-1 text-2xl font-extrabold text-foreground">Profile & App</div>
      </div>

      {error && <div className="rounded-lg border border-destructive/35 bg-destructive/10 p-3 text-sm leading-5 text-destructive">{error}</div>}

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
            Profile
          </CardTitle>
          <CardDescription>Signed-in Supabase profile and session details.</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <FormGroup className="mb-3">
            <Label htmlFor="profile-name">Display Name</Label>
            <Input id="profile-name" value={settings.profileName || ""} onChange={event => setSettings(previous => ({ ...previous, profileName: event.target.value }))} />
          </FormGroup>
          <SettingRow label="Email" value={email} />
          <SettingRow label="User ID" value={userId} />
          <SettingRow label="Household Role" value={roleLabel(household.membership?.role) || "Unavailable"} />
          <SettingRow label="Release" value="Release 1.0" badge={<Badge variant="blue">1.0</Badge>} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" aria-hidden="true" />
            Household Defaults
          </CardTitle>
          <CardDescription>Stored in Supabase household settings and user preferences.</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <FormSection>
            <FormGroup>
              <Label htmlFor="household-name">Household Name</Label>
              <Input id="household-name" value={settings.householdName} disabled={!household.canManageHousehold} onChange={event => setSettings(previous => ({ ...previous, householdName: event.target.value }))} />
            </FormGroup>
            {currentUserMemberships.length > 1 && (
              <FormGroup>
                <Label htmlFor="active-household">Active Household</Label>
                <Select id="active-household" value={household.householdId || ""} onChange={switchHousehold}>
                  {currentUserMemberships.map(membership => (
                    <option key={membership.id} value={membership.household_id}>
                      {userHouseholdNames[membership.household_id] || (membership.household_id === household.householdId ? settings.householdName : "Household")}
                    </option>
                  ))}
                </Select>
              </FormGroup>
            )}
            <FormRow>
              <FormGroup>
                <Label htmlFor="default-family-member">Default Family Member</Label>
                <Select id="default-family-member" value={settings.defaultFamilyMember} onChange={event => setSettings(previous => ({ ...previous, defaultFamilyMember: event.target.value }))}>
                  <option value="Family">Family</option>
                  {activeMembers.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label htmlFor="task-default-category">Task Category</Label>
                <Select id="task-default-category" value={settings.taskDefaultCategory} onChange={event => setSettings(previous => ({ ...previous, taskDefaultCategory: event.target.value }))}>
                  {TASK_CATEGORY_OPTIONS.map(category => <option key={category} value={category}>{category}</option>)}
                </Select>
              </FormGroup>
            </FormRow>
            <FormGroup>
              <Label htmlFor="task-default-priority">Task Priority</Label>
              <Select id="task-default-priority" value={settings.taskDefaultPriority} onChange={event => setSettings(previous => ({ ...previous, taskDefaultPriority: event.target.value }))}>
                {TASK_PRIORITY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
            </FormGroup>
            <Button type="button" className="w-full" onClick={saveSettings}>
              <Save className="h-4 w-4" aria-hidden="true" />
              Save Settings
            </Button>
            {family.error && <FormHelp className="text-amber-300">{family.error}</FormHelp>}
          </FormSection>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" aria-hidden="true" />
            Household Members
          </CardTitle>
          <CardDescription>Directory, roles, pending invitations, and manager controls for this household.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4 pt-0">
          {household.error && <FormError>{household.error}</FormError>}
          {householdMembers.length ? (
            <div className="space-y-2">
              {householdMembers.map(membership => {
                const person = membership.person_id ? peopleById[membership.person_id] : null;
                const name = person?.display_name || person?.first_name || (membership.user_id === household.user?.id ? email : membership.user_id ? "Signed-in member" : "Family profile");
                const isCurrentUser = membership.user_id === household.user?.id;
                return (
                  <div key={membership.id} className="rounded-lg border border-border bg-secondary/35 p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate text-sm font-bold text-foreground">{name}</div>
                          {isCurrentUser && <Badge variant="blue">You</Badge>}
                          <StatusBadge status={statusTone(membership.status)}>{membership.status}</StatusBadge>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {membership.user_id ? "Login member" : "Family profile"}{person?.email ? ` - ${person.email}` : ""}
                        </div>
                      </div>
                      {canManageMembers ? (
                        <div className="grid gap-2 sm:grid-cols-[120px_auto]">
                          <Select
                            value={membership.role}
                            disabled={membership.role === "owner"}
                            onChange={event => updateMembership(membership, { role: event.target.value })}
                            aria-label={`Role for ${name}`}
                          >
                            {HOUSEHOLD_ROLES.map(role => <option key={role} value={role}>{roleLabel(role)}</option>)}
                          </Select>
                          <Button
                            type="button"
                            variant="destructive-outline"
                            size="sm"
                            disabled={membership.role === "owner" || membership.status !== "active"}
                            onClick={() => updateMembership(membership, { status: "removed" })}
                          >
                            <UserMinus className="h-4 w-4" aria-hidden="true" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="slate">{roleLabel(membership.role)}</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyStatePanel title="No household members" detail="Active members will appear here after the household context loads." className="py-7" />
          )}

          {canManageMembers ? (
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <MailPlus className="h-4 w-4 text-primary" aria-hidden="true" />
                Invite Member
              </div>
              <FormSection>
                <FormRow>
                  <FormGroup>
                    <Label htmlFor="invite-email">Email</Label>
                    <Input id="invite-email" type="email" value={inviteForm.email} placeholder="member@example.com" onChange={event => setInviteForm(previous => ({ ...previous, email: event.target.value }))} />
                  </FormGroup>
                  <FormGroup>
                    <Label htmlFor="invite-role">Role</Label>
                    <Select id="invite-role" value={inviteForm.role} onChange={event => setInviteForm(previous => ({ ...previous, role: event.target.value }))}>
                      {INVITABLE_ROLES.map(role => <option key={role} value={role}>{roleLabel(role)}</option>)}
                    </Select>
                  </FormGroup>
                </FormRow>
                <Button type="button" className="w-full" onClick={createInvite} loading={invitations.loading}>
                  <MailPlus className="h-4 w-4" aria-hidden="true" />
                  Create Invite
                </Button>
                {invitations.error && <FormError>{invitations.error}</FormError>}
                {invitations.createdInvite?.inviteLink && (
                  <div className="rounded-md border border-border bg-card p-3">
                    <div className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Invite Link</div>
                    <div className="break-all text-xs text-secondary-foreground">{invitations.createdInvite.inviteLink}</div>
                    <Button type="button" variant="secondary" size="sm" className="mt-3 w-full" onClick={copyInviteLink}>
                      <Copy className="h-4 w-4" aria-hidden="true" />
                      Copy Link
                    </Button>
                  </div>
                )}
              </FormSection>
            </div>
          ) : (
            <FormHelp>Only household owners can invite members or edit membership.</FormHelp>
          )}

          {canManageMembers && (
            <div>
              <SectionHeader title="Pending Invites" count={invitations.pendingInvitations.length} tone="amber" />
              {invitations.pendingInvitations.length ? (
                <div className="space-y-2">
                  {invitations.pendingInvitations.map(invitation => (
                    <div key={invitation.id} className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/35 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-foreground">{invitation.invited_email}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{roleLabel(invitation.role)} - expires {formatInviteExpiry(invitation.expires_at)}</div>
                      </div>
                      <Button type="button" variant="destructive-outline" size="sm" onClick={() => revokeInvite(invitation.id)}>
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyStatePanel title="No pending invites" detail="New invitations will appear here until accepted, declined, expired, or revoked." className="py-7" />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            Google Calendar
          </CardTitle>
          <CardDescription>Secure server-side calendar is preferred. Tokens stay on the server and events are returned as safe app data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4 pt-0">
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              <StatusBadge status={serverCalendarTone(secureCalendar)}>{serverCalendarLabel(secureCalendar)}</StatusBadge>
              <Badge variant="blue">Server-side</Badge>
            </div>
            <SettingRow label="Provider" value="Google Calendar" />
            <SettingRow label="Account" value={secureCalendar.connection?.provider_account_email || "Not connected"} />
            <SettingRow label="Last Sync" value={formatDateTime(secureCalendar.connection?.last_sync_at)} />
            {secureCalendar.error && <FormError>{secureCalendar.error}</FormError>}
            {secureCalendar.note && <FormHelp>{secureCalendar.note}</FormHelp>}
            <FormHelp>
              Connect starts Google OAuth. Disconnect revokes Google access when available and clears stored server tokens.
            </FormHelp>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <Button type="button" onClick={connectSecureCalendar} loading={secureCalendar.loading}>
                {secureCalendar.connection ? "Reconnect" : "Connect"}
              </Button>
              <Button type="button" variant="secondary" onClick={secureCalendar.refresh} loading={secureCalendar.loading}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Check
              </Button>
              <Button type="button" variant="destructive-outline" onClick={disconnectSecureCalendar} disabled={!secureCalendar.connection}>
                Disconnect
              </Button>
            </div>
          </div>

          <div className="pt-1 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Legacy browser fallback</div>
          <FormHelp>
            Temporary fallback for devices that have not moved to the secure server connection. New fallback sessions are no longer saved as browser tokens.
          </FormHelp>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={calendarTone(gc)}>{calendarLabel(gc)}</StatusBadge>
            <Badge variant="slate" className="max-w-full truncate">{gc.sourceLabel || "Google Calendar"}</Badge>
          </div>
          <SettingRow label="Google User" value={gc.userName || "Not connected"} />
          <SettingRow label="Last Sync" value={formatDateTime(gc.lastSyncedAt)} />
          {gc.error && <FormError>{gc.error}</FormError>}
          <div className="grid gap-2 sm:grid-cols-3">
            <Button type="button" variant="secondary" onClick={gc.refresh} loading={gc.loading} disabled={!gc.token}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </Button>
            <Button type="button" onClick={reconnectCalendar} loading={gc.status === "connecting" || gc.status === "script-loading"}>
              Reconnect
            </Button>
            <Button type="button" variant="destructive-outline" onClick={clearCalendarToken} disabled={!gc.token}>
              Clear Token
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4 text-primary" aria-hidden="true" />
            Local Data
          </CardTitle>
          <CardDescription>Remaining browser-only tokens and legacy metadata on this device.</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {snapshot.length ? (
            <div className="space-y-1">
              {snapshot.map(item => (
                <SettingRow
                  key={item.key}
                  label={item.key}
                  value={`${item.bytes} bytes`}
                  badge={<Badge variant={item.present ? "blue" : "slate"}>{item.present ? `${item.bytes} bytes` : "empty"}</Badge>}
                />
              ))}
              <div className="pt-3 text-xs leading-5 text-muted-foreground">Total local metadata: {localBytes} bytes</div>
            </div>
          ) : (
            <EmptyStatePanel title="Local storage unavailable" detail="Device-level preferences cannot be inspected in this browser context." className="py-7" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-primary" aria-hidden="true" />
            App Status
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <SettingRow label="Environment" value={APP_CONFIG.supabaseUrl ? "Configured" : "Missing Supabase URL"} />
          <SettingRow label="Google Client" value={APP_CONFIG.googleClientId ? "Configured" : "Missing Google Client ID"} />
          <SettingRow label="Missing Config" value={missingConfig.length ? missingConfig.join(", ") : "None"} />
        </CardContent>
      </Card>

      <section>
        <SectionHeader title="Account Controls" tone="red" />
        <div className="grid gap-2">
          <Button type="button" variant="secondary" className="w-full" onClick={auth.signOut}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign Out
          </Button>
          <Button type="button" variant="destructive-outline" className="w-full" onClick={resetLocalData}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Reset Local App Data
          </Button>
        </div>
      </section>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
