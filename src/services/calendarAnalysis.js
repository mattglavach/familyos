const toDate = value => { const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date; };
const startOf = event => toDate(event.start?.dateTime || event.start);
const endOf = event => toDate(event.end?.dateTime || event.end || event.start?.dateTime || event.start);
export function analyzeCalendar(events = [], options = {}) {
  const now = toDate(options.now) || new Date(), timezone = options.timezone || "America/New_York", minGap = Number(options.preparationMinutes || 30);
  const timed = events.map(event => ({ ...event, _start: startOf(event), _end: endOf(event) })).filter(event => event._start && event._end && event._end >= now).sort((a, b) => a._start - b._start);
  const conflicts = [], tightTransitions = [];
  timed.forEach((event, index) => { const next = timed[index + 1]; if (!next) return; const gapMinutes = Math.round((next._start - event._end) / 60000); if (gapMinutes < 0) conflicts.push({ type: "overlap", eventIds: [event.id, next.id].filter(Boolean), minutes: Math.abs(gapMinutes), title: `${event.title || event.summary || "Event"} overlaps ${next.title || next.summary || "event"}` }); else if (gapMinutes < minGap) tightTransitions.push({ type: "tight-transition", eventIds: [event.id, next.id].filter(Boolean), minutes: gapMinutes, title: `Only ${gapMinutes} minutes between commitments` }); });
  const byDay = timed.reduce((map, event) => { const key = new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(event._start); (map[key] ||= []).push(event); return map; }, {});
  const overloadedDays = Object.entries(byDay).filter(([, rows]) => rows.length >= (options.maxDailyCommitments || 5)).map(([date, rows]) => ({ date, count: rows.length }));
  const openWindows = [];
  Object.entries(byDay).forEach(([date, rows]) => { for (let index = 0; index < rows.length - 1; index += 1) { const minutes = Math.round((rows[index + 1]._start - rows[index]._end) / 60000); if (minutes >= 60) openWindows.push({ date, start: rows[index]._end.toISOString(), end: rows[index + 1]._start.toISOString(), durationMinutes: minutes, rationale: "Open time between existing commitments" }); } });
  return { conflicts, tightTransitions, overloadedDays, openWindows: openWindows.slice(0, 8), timezone };
}
