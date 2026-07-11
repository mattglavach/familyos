import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, CalendarClock, CalendarDays, CalendarX, Clock, ExternalLink, MapPin, RefreshCw, Users } from "lucide-react";
import { Badge, StatusBadge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyStatePanel } from "../../components/ui/empty-state";
import { SectionHeader } from "../../components/ui/section-header";
import { Skeleton } from "../../components/ui/skeleton";
import { COLORS, S } from "../../theme";
import { normalizeCalendarStatus } from "../../lib/calendarStatus";
import { formatCalendarEventTime, normalizeCalendarEvent } from "../../lib/calendarTime";

function dateKey(value) {
  if (!value) return "";
  return String(value).split("T")[0];
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function eventDateLabel(value, todayString, formatDateFull) {
  const key = dateKey(value);
  if (!key) return "Date unavailable";
  if (key === todayString) return "Today";
  if (key === addDays(todayString, 1)) return "Tomorrow";
  return formatDateFull ? formatDateFull(key) : key;
}

function groupEvents(events, todayString) {
  const tomorrowString = addDays(todayString, 1);
  const weekEndString = addDays(todayString, 6);
  const groups = {
    today: [],
    tomorrow: [],
    thisWeek: [],
    upcoming: [],
  };
  (events || []).forEach(event => {
    if (!event || typeof event !== "object") return;
    const key = dateKey(event.date);
    if (key === todayString) groups.today.push(event);
    else if (key === tomorrowString) groups.tomorrow.push(event);
    else if (key > tomorrowString && key <= weekEndString) groups.thisWeek.push(event);
    else groups.upcoming.push(event);
  });
  const byTime = (a, b) => `${dateKey(a.date)} ${a.time || ""}`.localeCompare(`${dateKey(b.date)} ${b.time || ""}`);
  return {
    today: groups.today.sort(byTime),
    tomorrow: groups.tomorrow.sort(byTime),
    thisWeek: groups.thisWeek.sort(byTime),
    upcoming: groups.upcoming.sort(byTime),
  };
}

export function formatSyncTime(value, now = new Date()) {
  if (!value) return "Not synced yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sync time unavailable";
  const sameDay = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return sameDay ? `Today ${time}` : date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function eventMetaLine(event, todayString, formatDateFull) {
  return `${eventDateLabel(event.date, todayString, formatDateFull)} - ${formatCalendarEventTime(event)}`;
}

export function normalizeEvent(event, index, sourceLabel) {
  const calendarEvent = normalizeCalendarEvent(event);
  return {
    ...calendarEvent,
    id: calendarEvent.id || `${calendarEvent.date || "event"}-${index}`,
    title: calendarEvent.title || "Untitled event",
    member: calendarEvent.member || calendarEvent.owner || "Family",
    source: calendarEvent.source || calendarEvent.calendar || sourceLabel || "Calendar",
    attendees: Array.isArray(calendarEvent.attendees) ? calendarEvent.attendees : [],
    notes: calendarEvent.notes || calendarEvent.description || "",
  };
}

function SummaryTile({ label, value, detail, tone = COLORS.blue, icon }) {
  return (
    <Card style={{ borderLeft: `3px solid ${tone}` }}>
      <CardContent className="min-h-[104px] p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
          {icon}
          {label}
        </div>
        <div className="text-xl font-extrabold leading-tight text-foreground">{value}</div>
        <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{detail}</div>
      </CardContent>
    </Card>
  );
}

function EventCard({ event, todayString, formatDateFull, selected, onSelect }) {
  return (
    <Card className={`min-w-0 max-w-full overflow-hidden ${selected ? "border-primary" : ""}`} style={{ borderLeft: `3px solid ${COLORS.blue}` }}>
      <CardContent className="min-w-0 p-0">
        <button type="button" onClick={() => onSelect(event.id)} className="block min-h-12 w-full px-3 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-foreground">{event.title || "Untitled event"}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {eventMetaLine(event, todayString, formatDateFull)}
              </div>
              {event.location && <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" aria-hidden="true" /><span className="truncate">{event.location}</span></div>}
            </div>
          </div>
        </button>
      </CardContent>
    </Card>
  );
}

function EventSection({ title, events, emptyTitle, emptyDetail, todayString, formatDateFull, selectedId, onSelect }) {
  return (
    <section className="min-w-0 max-w-full">
      <SectionHeader title={title} count={events.length} tone={title === "Today" ? "blue" : "neutral"} />
      {events.length ? (
        <div className="min-w-0 max-w-full space-y-1.5">
          {events.map((event, index) => (
            <EventCard
              key={event.id || `${title}-${index}`}
              event={event}
              selected={selectedId === event.id}
              onSelect={onSelect}
              todayString={todayString}
              formatDateFull={formatDateFull}
            />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyStatePanel title={emptyTitle} detail={emptyDetail} className="py-7" />
        </Card>
      )}
    </section>
  );
}

function EventDetails({ event, todayString, formatDateFull }) {
  if (!event) {
    return (
      <Card>
        <EmptyStatePanel
          icon={<CalendarClock className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />}
          title="Select an event"
          detail="Open any event in the schedule list to see location, notes, attendees, source, and sync details."
          className="py-8"
        />
      </Card>
    );
  }

  const detailRows = [
    { label: "When", value: eventMetaLine(event, todayString, formatDateFull) },
    { label: "Location", value: event.location || "No location listed" },
    { label: "Owner", value: event.member || event.owner || "Family" },
    { label: "Calendar", value: event.source || event.calendar || "Calendar" },
    { label: "Last synced", value: formatSyncTime(event.lastSyncedAt || event.updated) },
  ];

  return (
    <Card className="min-w-0 max-w-full overflow-hidden" style={{ borderLeft: `3px solid ${COLORS.blue}` }}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
          Event Details
        </CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4 px-4 pb-4 pt-0">
        <div>
          <div className="break-words text-lg font-extrabold leading-tight text-foreground">{event.title}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="blue">{event.member || "Family"}</Badge>
            <Badge variant="slate">{event.source || "Calendar"}</Badge>
            {event.status && <Badge variant="slate">{event.status}</Badge>}
          </div>
        </div>
        <div className="grid gap-2">
          {detailRows.map(row => (
            <div key={row.label} className="rounded-lg border border-border bg-secondary/30 p-3">
              <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{row.label}</div>
              <div className="mt-1 break-words text-sm leading-5 text-foreground">{row.value}</div>
            </div>
          ))}
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
            <Users className="h-4 w-4" aria-hidden="true" />
            Attendees
          </div>
          {event.attendees?.length ? (
            <div className="space-y-2">
              {event.attendees.slice(0, 8).map((attendee, index) => (
                <div key={`${attendee.email || attendee.name}-${index}`} className="flex min-h-10 items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2">
                  <div className="min-w-0 truncate text-sm text-foreground">{attendee.name || attendee.email}</div>
                  {attendee.responseStatus && <Badge variant="slate" className="shrink-0">{attendee.responseStatus}</Badge>}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">No attendees listed.</div>
          )}
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Notes</div>
          <div className="mt-2 whitespace-pre-wrap break-words rounded-lg border border-border bg-secondary/30 p-3 text-sm leading-6 text-muted-foreground">
            {event.notes || "No notes listed."}
          </div>
        </div>
        {event.htmlLink && (
          <Button type="button" variant="secondary" asChild>
            <a href={event.htmlLink} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Open in Google Calendar
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function Calendar({ calendar = {}, deps = {}, initialView }) {
  const { TODAY_STR = new Date().toISOString().split("T")[0], formatDateFull } = deps;
  const [selectedEventId, setSelectedEventId] = useState("");
  const safeCalendar = {
    connected: false,
    loading: false,
    error: "",
    status: "disconnected",
    events: [],
    refresh: () => {},
    checkConnection: () => {},
    connect: () => {},
    ...calendar,
  };
  const status = normalizeCalendarStatus(safeCalendar);
  const events = useMemo(
    () => (Array.isArray(safeCalendar.events) ? safeCalendar.events.filter(Boolean).map((event, index) => normalizeEvent(event, index, safeCalendar.sourceLabel)) : []),
    [safeCalendar.events, safeCalendar.sourceLabel]
  );
  const grouped = groupEvents(events, TODAY_STR);
  const selectedEvent = events.find(event => event.id === selectedEventId) || events[0] || null;
  const nextEvent = events.find(event => dateKey(event.date) >= TODAY_STR) || null;
  const visibleGroupCount = grouped.today.length + grouped.tomorrow.length + grouped.thisWeek.length + grouped.upcoming.length;
  const startConnection = () => {
    if (safeCalendar.canConnect === false) {
      safeCalendar.checkConnection?.();
      return;
    }
    safeCalendar.connect?.();
  };

  useEffect(() => {
    if (initialView?.eventId) setSelectedEventId(initialView.eventId);
  }, [initialView]);

  return (
    <div style={S.screen} className="min-w-0 max-w-full space-y-4 overflow-x-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Calendar
          </div>
          <div className="mt-1 text-2xl font-extrabold text-foreground">Today & Upcoming</div>
        </div>
        <Button type="button" variant="secondary" size="xs" onClick={safeCalendar.connected ? safeCalendar.refresh : safeCalendar.checkConnection} loading={safeCalendar.loading} disabled={safeCalendar.loading}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {safeCalendar.connected ? "Refresh" : "Check"}
        </Button>
      </div>

      {safeCalendar.connected && !safeCalendar.error && !status.needsAttention ? (
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2" style={{ borderLeft: `3px solid ${COLORS.green}` }}>
          <div className="min-w-0"><div className="text-sm font-bold text-foreground">Google Calendar <span className="text-emerald-400">✓</span></div><div className="text-xs text-muted-foreground">Last synced: {formatSyncTime(safeCalendar.lastSyncedAt)}</div></div>
          <div className="flex gap-1.5"><Button type="button" variant="secondary" size="xs" onClick={safeCalendar.refresh} loading={safeCalendar.loading}><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Refresh</Button><Button type="button" variant="ghost" size="xs" onClick={startConnection}>Reconnect</Button></div>
        </div>
      ) : <Card style={{ borderLeft: `3px solid ${status.tone === "connected" ? COLORS.green : status.tone === "warning" ? COLORS.amber : COLORS.slate}` }}>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            {safeCalendar.connected ? <CalendarCheck className="h-4 w-4 text-primary" aria-hidden="true" /> : <CalendarX className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
            Calendar Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4 pt-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status.tone}>{status.label}</StatusBadge>
            <Badge variant="slate">{safeCalendar.mode === "secure" ? "Server sync" : "Device fallback"}</Badge>
            {safeCalendar.sourceLabel && <Badge variant="slate">{safeCalendar.sourceLabel}</Badge>}
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{status.detail}</p>
          {safeCalendar.error && (
            <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm leading-6 text-amber-100">
              {safeCalendar.error}
            </div>
          )}
          <div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs leading-5 text-muted-foreground">
            Calendar access lets Family OS show today&apos;s events, upcoming commitments, schedule conflicts, and future reminder context. If connection fails, the rest of Family OS stays available.
          </div>
          {safeCalendar.connected ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={safeCalendar.refresh} loading={safeCalendar.loading}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Refresh Events
              </Button>
              <Button type="button" variant="secondary" onClick={startConnection} loading={safeCalendar.loading}>
                Reconnect Calendar
              </Button>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" onClick={startConnection} loading={safeCalendar.loading} disabled={safeCalendar.canConnect === false}>
                {status.actionLabel}
              </Button>
              <Button type="button" variant="secondary" onClick={safeCalendar.checkConnection} loading={safeCalendar.loading}>
                Check Connection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>}

      <section>
        <SectionHeader title="Schedule Summary" count={events.length} tone="blue" />
        <div className="grid grid-cols-2 gap-2">
          <SummaryTile
            label="Today"
            value={grouped.today.length ? `${grouped.today.length} event${grouped.today.length === 1 ? "" : "s"}` : "Clear"}
            detail={grouped.today[0]?.title || "No events scheduled today."}
            tone={grouped.today.length ? COLORS.blue : COLORS.green}
            icon={<CalendarCheck className="h-4 w-4" aria-hidden="true" />}
          />
          <SummaryTile
            label="Next Event"
            value={nextEvent ? (nextEvent.time || "All day") : "None"}
            detail={nextEvent ? `${nextEvent.title} - ${eventDateLabel(nextEvent.date, TODAY_STR, formatDateFull)}` : "No upcoming events in the current calendar window."}
            tone={nextEvent ? COLORS.amber : COLORS.slate}
            icon={<Clock className="h-4 w-4" aria-hidden="true" />}
          />
        </div>
      </section>

      {safeCalendar.loading ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </CardContent>
        </Card>
      ) : safeCalendar.connected ? (
        visibleGroupCount ? (
          <div className="grid min-w-0 max-w-full gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="min-w-0 space-y-3">
              <EventSection title="Today" events={grouped.today} emptyTitle="Nothing scheduled today" emptyDetail="Connected calendar events for today will appear here." selectedId={selectedEvent?.id} onSelect={setSelectedEventId} todayString={TODAY_STR} formatDateFull={formatDateFull} />
              <EventSection title="Tomorrow" events={grouped.tomorrow} emptyTitle="Nothing scheduled tomorrow" emptyDetail="Tomorrow is clear in the current calendar window." selectedId={selectedEvent?.id} onSelect={setSelectedEventId} todayString={TODAY_STR} formatDateFull={formatDateFull} />
              <EventSection title="This Week" events={grouped.thisWeek} emptyTitle="No other events this week" emptyDetail="Events later this week will appear here." selectedId={selectedEvent?.id} onSelect={setSelectedEventId} todayString={TODAY_STR} formatDateFull={formatDateFull} />
              <EventSection title="Upcoming" events={grouped.upcoming} emptyTitle="No later events" emptyDetail="Events beyond this week will appear here after sync." selectedId={selectedEvent?.id} onSelect={setSelectedEventId} todayString={TODAY_STR} formatDateFull={formatDateFull} />
            </div>
            <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
              <EventDetails event={selectedEvent} todayString={TODAY_STR} formatDateFull={formatDateFull} />
            </div>
          </div>
        ) : (
          <Card>
            <EmptyStatePanel
              icon={<CalendarCheck className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />}
              title="No events found"
              detail="Calendar is connected, but no events were found in the current sync window."
              action="Refresh Events"
              onAction={safeCalendar.refresh}
              className="py-8"
            />
          </Card>
        )
      ) : (
        <Card>
          <EmptyStatePanel
            icon={<CalendarX className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />}
            title="Calendar is not connected"
            detail={status.detail || "Connect Google Calendar to see household events here. You can still use Tasks and Home without a calendar."}
            action={status.actionLabel}
            onAction={startConnection}
            className="py-8"
          />
        </Card>
      )}
    </div>
  );
}
