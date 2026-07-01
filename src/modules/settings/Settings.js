import { useEffect, useState } from "react";
import {
  CalendarCheck,
  Database,
  Info,
  LogOut,
  RefreshCw,
  Save,
  Settings as SettingsIcon,
  Trash2,
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
import { useFamilyMembers } from "../dashboard/useFamilyMembers";
import {
  DEFAULT_SETTINGS,
  LOCAL_DATA_KEYS,
  TASK_CATEGORY_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  localDataSnapshot,
  readLocalSettings,
  writeLocalSettings,
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

export function Settings({ auth, gc }) {
  const family = useFamilyMembers();
  const [settings, setSettings] = useState(() => readLocalSettings());
  const [snapshot, setSnapshot] = useState(() => localDataSnapshot());
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

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

  function saveSettings() {
    try {
      const next = writeLocalSettings(settings);
      setSettings(next);
      setError("");
      refreshSnapshot();
      notify("Settings saved.");
    } catch {
      setError("Settings could not be saved on this device.");
    }
  }

  function reconnectCalendar() {
    gc.signIn();
    notify("Opening Google Calendar connection.");
  }

  function clearCalendarToken() {
    if (!window.confirm("Clear the local Google Calendar token on this device? You can reconnect afterward.")) return;
    gc.clearLocalConnection?.();
    refreshSnapshot();
    notify("Local calendar token cleared.");
  }

  function resetLocalData() {
    if (!window.confirm("Reset local FamilyOS data on this device? This clears local family members, task metadata, settings, and calendar tokens.")) return;
    LOCAL_DATA_KEYS.forEach(key => window.localStorage.removeItem(key));
    gc.clearLocalConnection?.();
    setSettings(DEFAULT_SETTINGS);
    refreshSnapshot();
    notify("Local app data reset. Refresh to reload default family and task metadata.");
  }

  const email = auth.session?.user?.email || "Unknown";
  const userId = auth.session?.user?.id || "Unavailable";
  const activeMembers = family.activeMembers;
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
          <CardDescription>Signed-in Supabase session details for this device.</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <SettingRow label="Email" value={email} />
          <SettingRow label="User ID" value={userId} />
          <SettingRow label="Release" value="Release 0.6B" badge={<Badge variant="blue">0.6B</Badge>} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" aria-hidden="true" />
            Household Defaults
          </CardTitle>
          <CardDescription>These preferences are stored locally until the household profile schema is ready.</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <FormSection>
            <FormGroup>
              <Label htmlFor="household-name">Household Name</Label>
              <Input id="household-name" value={settings.householdName} onChange={event => setSettings(previous => ({ ...previous, householdName: event.target.value }))} />
            </FormGroup>
            <FormRow>
              <FormGroup>
                <Label htmlFor="default-family-member">Default Family Member</Label>
                <Select id="default-family-member" value={settings.defaultFamilyMember} onChange={event => setSettings(previous => ({ ...previous, defaultFamilyMember: event.target.value }))}>
                  <option value="Family">Family</option>
                  {activeMembers.map(member => <option key={member.id} value={member.name}>{member.name}</option>)}
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
            <CalendarCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            Google Calendar
          </CardTitle>
          <CardDescription>Uses the existing browser popup OAuth connection.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4 pt-0">
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
          <CardDescription>Temporary metadata stored on this device for Release 0.6B.</CardDescription>
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
