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
  "hasn't verified",
  "has not verified",
  "unverified",
  "origin_mismatch",
  "idpiframe",
];

const PERMISSION_PATTERNS = [
  "permission",
  "approve",
  "revoked",
  "access",
  "expired",
  "denied",
  "access_denied",
];

const CANCELLED_PATTERNS = [
  "cancel",
  "closed",
  "popup_closed",
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
      label: "Refreshing",
      detail: "Refreshing Google Calendar.",
      actionLabel: "Open Calendar",
      actionTarget: "calendar",
      needsAttention: false,
      canRefresh: Boolean(calendar.connected),
    };
  }

  if (status === "cancelled" || includesAny(error, CANCELLED_PATTERNS)) {
    return {
      key: CALENDAR_STATUS.DISCONNECTED,
      tone: "neutral",
      label: "Not connected",
      detail: "Google Calendar was not connected. Nothing changed.",
      actionLabel: "Connect Google Calendar",
      actionTarget: "calendar",
      needsAttention: false,
      canRefresh: false,
    };
  }

  if (status === "permission-error" || status === "needs_reauth" || status === "expired" || includesAny(error, PERMISSION_PATTERNS)) {
    return {
      key: CALENDAR_STATUS.PERMISSION_RESTRICTED,
      tone: "warning",
      label: "Reconnect calendar",
      detail: "Google Calendar access expired or was removed. Reconnect Google Calendar to show events.",
      actionLabel: "Reconnect Calendar",
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
      label: setupRequired ? "Connect unavailable" : "Calendar paused",
      detail: setupRequired
        ? "Google Calendar is not available in this environment. Family OS still works without it."
        : "Refresh Calendar or reconnect Google Calendar to show events.",
      actionLabel: setupRequired ? "Refresh Calendar" : "Reconnect Calendar",
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
      label: "Connect unavailable",
      detail: "Google Calendar is not available in this environment. Family OS still works without it.",
      actionLabel: "Refresh Calendar",
      actionTarget: "calendar",
      needsAttention: false,
      canRefresh: false,
    };
  }

  return {
    key: CALENDAR_STATUS.DISCONNECTED,
    tone: "neutral",
    label: "Not connected",
    detail: calendar.detail || "Connect Google Calendar when your household wants schedule events on Home and Calendar.",
    actionLabel: "Connect Google Calendar",
    actionTarget: "calendar",
    needsAttention: false,
    canRefresh: false,
  };
}

export function canStartCalendarConnection(calendar = {}) {
  const status = normalizeCalendarStatus(calendar);
  return status.key === CALENDAR_STATUS.DISCONNECTED || status.key === CALENDAR_STATUS.PERMISSION_RESTRICTED || status.key === CALENDAR_STATUS.ERROR;
}
