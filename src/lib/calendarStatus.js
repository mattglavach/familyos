export const CALENDAR_STATUS = {
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  SETUP_REQUIRED: "setup_required",
  PERMISSION_RESTRICTED: "permission_restricted",
  ERROR: "error",
  CHECKING: "checking",
};

const SETUP_PATTERNS = [
  "not ready",
  "setup",
  "finish calendar setup",
  "not available",
  "could not load google calendar",
];

const PERMISSION_PATTERNS = [
  "permission",
  "approve",
  "revoked",
  "access",
  "expired",
];

function includesAny(value, patterns) {
  const text = String(value || "").toLowerCase();
  return patterns.some(pattern => text.includes(pattern));
}

export function normalizeCalendarStatus(calendar = {}) {
  const status = calendar.status || "";
  const error = calendar.error || "";
  const events = Array.isArray(calendar.events) ? calendar.events : [];

  if (calendar.loading) {
    return {
      key: CALENDAR_STATUS.CHECKING,
      tone: "warning",
      label: "Checking",
      detail: "Refreshing calendar status.",
      actionLabel: "Open Calendar",
      actionTarget: "calendar",
      needsAttention: false,
      canRefresh: Boolean(calendar.connected),
    };
  }

  if (status === "permission-error" || status === "needs_reauth" || status === "expired" || includesAny(error, PERMISSION_PATTERNS)) {
    return {
      key: CALENDAR_STATUS.PERMISSION_RESTRICTED,
      tone: "warning",
      label: "Permission needed",
      detail: error || "Reconnect Google Calendar and approve calendar access.",
      actionLabel: "Connect Google Calendar",
      actionTarget: "calendar",
      needsAttention: true,
      canRefresh: false,
    };
  }

  if (error) {
    const setupRequired = includesAny(error, SETUP_PATTERNS);
    return {
      key: setupRequired ? CALENDAR_STATUS.SETUP_REQUIRED : CALENDAR_STATUS.ERROR,
      tone: "warning",
      label: setupRequired ? "Setup needed" : "Needs attention",
      detail: setupRequired
        ? "Calendar connection is not available here yet."
        : "Calendar needs attention. Refresh status or reconnect Google Calendar.",
      actionLabel: "Connect Google Calendar",
      actionTarget: "calendar",
      needsAttention: true,
      canRefresh: false,
    };
  }

  if (calendar.connected) {
    return {
      key: CALENDAR_STATUS.CONNECTED,
      tone: events.length ? "connected" : "info",
      label: "Connected",
      detail: events.length
        ? `${events.length} event${events.length === 1 ? "" : "s"} ready.`
        : "Connected. No events found in the current calendar window.",
      actionLabel: "Open Calendar",
      actionTarget: "calendar",
      needsAttention: false,
      canRefresh: true,
    };
  }

  if (calendar.canConnect === false) {
    return {
      key: CALENDAR_STATUS.SETUP_REQUIRED,
      tone: "warning",
      label: "Setup needed",
      detail: "Calendar connection is not available here yet.",
      actionLabel: "Connect Google Calendar",
      actionTarget: "calendar",
      needsAttention: true,
      canRefresh: false,
    };
  }

  return {
    key: CALENDAR_STATUS.DISCONNECTED,
    tone: "neutral",
    label: "Not connected",
    detail: calendar.detail || "Google Calendar is not connected yet.",
    actionLabel: "Connect Google Calendar",
    actionTarget: "calendar",
    needsAttention: true,
    canRefresh: false,
  };
}

export function canStartCalendarConnection(calendar = {}) {
  const status = normalizeCalendarStatus(calendar);
  return status.key === CALENDAR_STATUS.DISCONNECTED || status.key === CALENDAR_STATUS.PERMISSION_RESTRICTED || status.key === CALENDAR_STATUS.ERROR;
}
