import { buildNotifications } from "./NotificationCenter";

jest.mock("../../lib/supabase", () => ({ supabase: {} }));

test("generates and deduplicates cross-module notifications including Pool", () => {
  const notifications = buildNotifications([{ id: "1", title: "Late", due_date: "2026-01-01", completed: false }], [], {}, { connected: true }, { attentionItems: [
    { identifier: "pool:test-stale:general", severity: "High", title: "Pool test stale", message: "Retest", navigationDestination: "pool" },
    { identifier: "pool:test-stale:general", severity: "High", title: "Pool test stale", message: "Retest", navigationDestination: "pool" },
  ] });
  expect(notifications.filter(item => item.id === "pool:test-stale:general")).toHaveLength(1);
  expect(notifications.some(item => item.kind === "task")).toBe(true);
});

test("formats Calendar notifications from the provider instant", () => {
  const today = new Date().toISOString().slice(0, 10);
  const notifications = buildNotifications([], [{ id: "event", title: "Known event", date: today, start: "2026-07-11T18:00:00Z", time: "6:00 PM" }], {}, { connected: true });
  expect(notifications.find(item => item.id === "event-today-event")?.detail).toBe("2:00 PM today");
});
