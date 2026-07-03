import { CalendarCheck, CalendarDays, CalendarX, ExternalLink, RefreshCw } from "lucide-react";
import { Badge, StatusBadge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyStatePanel } from "../../components/ui/empty-state";
import { SectionHeader } from "../../components/ui/section-header";
import { Skeleton } from "../../components/ui/skeleton";
import { COLORS, S } from "../../theme";
import { normalizeCalendarStatus } from "../../lib/calendarStatus";

function dateKey(value) {
  if (!value) return "";
  return String(value).split("T")[0];
}

function eventDateLabel(value, todayString, formatDateFull) {
  const key = dateKey(value);
  if (!key) return "Date unavailable";
  if (key === todayString) return "Today";
  return formatDateFull ? formatDateFull(key) : key;
}

function groupEvents(events, todayString) {
  const today = [];
  const upcoming = [];
  (events || []).forEach(event => {
    if (!event || typeof event !== "object") return;
    if (dateKey(event.date) === todayString) today.push(event);
    else upcoming.push(event);
  });
  const byTime = (a, b) => `${dateKey(a.date)} ${a.time || ""}`.localeCompare(`${dateKey(b.date)} ${b.time || ""}`);
  return { today: today.sort(byTime), upcoming: upcoming.sort(byTime) };
}

function EventCard({ event, todayString, formatDateFull }) {
  return (
    <Card style={{ borderLeft: `3px solid ${COLORS.blue}` }}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-base font-bold text-foreground">{event.title || "Untitled event"}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {eventDateLabel(event.date, todayString, formatDateFull)} - {event.time || "All day"}
            </div>
            {event.location && <div className="mt-1 text-xs leading-5 text-muted-foreground">{event.location}</div>}
          </div>
          <Badge variant="blue" className="shrink-0">{event.member || "Family"}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="slate">{event.source || "Calendar"}</Badge>
          {event.htmlLink && (
            <Button type="button" variant="secondary" size="xs" asChild>
              <a href={event.htmlLink} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Open
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EventSection({ title, events, emptyTitle, emptyDetail, todayString, formatDateFull }) {
  return (
    <section>
      <SectionHeader title={title} count={events.length} tone={title === "Today" ? "blue" : "neutral"} />
      {events.length ? (
        <div className="space-y-3">
          {events.map((event, index) => (
            <EventCard key={event.id || `${title}-${index}`} event={event} todayString={todayString} formatDateFull={formatDateFull} />
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

export function Calendar({ calendar = {}, onNavigate = () => {}, deps = {} }) {
  const { TODAY_STR = new Date().toISOString().split("T")[0], formatDateFull } = deps;
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
  const events = Array.isArray(safeCalendar.events) ? safeCalendar.events.filter(Boolean) : [];
  const grouped = groupEvents(events, TODAY_STR);
  const startConnection = () => {
    if (safeCalendar.canConnect === false) {
      safeCalendar.checkConnection?.();
      return;
    }
    safeCalendar.connect?.();
  };

  return (
    <div style={S.screen} className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Calendar
          </div>
          <div className="mt-1 text-2xl font-extrabold text-foreground">Today & Upcoming</div>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={safeCalendar.refresh} loading={safeCalendar.loading} disabled={safeCalendar.loading}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh Calendar
        </Button>
      </div>

      <Card style={{ borderLeft: `3px solid ${status.tone === "connected" ? COLORS.green : status.tone === "warning" ? COLORS.amber : COLORS.slate}` }}>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            {safeCalendar.connected ? <CalendarCheck className="h-4 w-4 text-primary" aria-hidden="true" /> : <CalendarX className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
            Google Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4 pt-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status.tone}>{status.label}</StatusBadge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{status.detail}</p>
          {safeCalendar.connected ? (
            <Button type="button" className="w-full" variant="secondary" onClick={safeCalendar.refresh} loading={safeCalendar.loading}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh Calendar
            </Button>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" onClick={startConnection} loading={safeCalendar.loading} disabled={safeCalendar.canConnect === false}>
                {status.actionLabel}
              </Button>
              <Button type="button" variant="secondary" onClick={safeCalendar.checkConnection} loading={safeCalendar.loading}>
                Refresh Calendar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {safeCalendar.loading ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </CardContent>
        </Card>
      ) : safeCalendar.connected ? (
        <>
          <EventSection
            title="Today"
            events={grouped.today}
            emptyTitle="Nothing scheduled today"
            emptyDetail="No events found for today."
            todayString={TODAY_STR}
            formatDateFull={formatDateFull}
          />
          <EventSection
            title="Upcoming"
            events={grouped.upcoming}
            emptyTitle="No upcoming events"
            emptyDetail="No upcoming events found."
            todayString={TODAY_STR}
            formatDateFull={formatDateFull}
          />
        </>
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
