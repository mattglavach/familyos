function rawMessage(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error.message) return String(error.message);
  if (error.error_description) return String(error.error_description);
  if (error.details) return String(error.details);
  try {
    return JSON.stringify(error);
  } catch {
    return "";
  }
}

export function normalizeError(error, fallback = "An unexpected error occurred.", context = "") {
  if (error instanceof Error) return error;
  const message = rawMessage(error) || fallback;
  const normalized = new Error(context ? `${context}: ${message}` : message);
  normalized.name = "FamilyOSError";
  if (error && typeof error === "object" && typeof error.code === "string") {
    normalized.code = error.code;
  }
  return normalized;
}

function matches(message, patterns) {
  const value = message.toLowerCase();
  return patterns.some(pattern => value.includes(pattern));
}

export function formatUserFacingError(error, fallback = "Something went wrong. Try again.") {
  const message = rawMessage(error);
  if (!message) return fallback;

  if (matches(message, ["network", "failed to fetch", "load failed", "timeout"])) {
    return "Network connection issue. Check your connection and try again.";
  }
  if (matches(message, ["jwt", "session", "auth", "not authenticated", "unauthorized"])) {
    return "Your session needs attention. Sign in again and try once more.";
  }
  if (matches(message, ["permission", "not allowed", "forbidden", "rls", "row-level security"])) {
    return "You do not have permission to do that in this household.";
  }
  if (matches(message, ["duplicate", "already exists", "unique constraint"])) {
    return "That item already exists.";
  }
  if (matches(message, ["rate limit", "too many"])) {
    return "Too many attempts. Wait a moment and try again.";
  }

  return fallback;
}

export function formatCalendarError(error, fallback = "Calendar could not be loaded right now.") {
  const message = rawMessage(error);
  if (!message) return fallback;

  if (matches(message, ["missing sign-in session", "invalid supabase session", "session bearer"])) {
    return "Your Family OS session needs attention. Sign in again, then reconnect Calendar.";
  }
  if (matches(message, ["needs_reauth", "refresh token", "token refresh", "calendar refresh token", "not connected"])) {
    return "Google Calendar needs to be reconnected. Reconnect Calendar and approve calendar access.";
  }
  if (matches(message, ["permission", "approve", "revoked", "access_denied", "denied", "insufficient authentication scopes"])) {
    return "Google Calendar permission is missing. Reconnect Calendar and approve calendar read access.";
  }
  if (matches(message, ["origin not allowed", "origin_mismatch", "redirect_uri_mismatch", "oauth state", "invalid oauth", "oauth client"])) {
    return "Google Calendar setup needs attention for this app URL. Ask the household owner to check the Google OAuth origin and redirect settings.";
  }

  if (matches(message, [
    "supabase_service_role_key",
    "supabase api environment",
    "calendar_connections",
    "not configured",
    "schema cache",
    "does not exist",
    "relation",
  ])) {
    return "Google Calendar is not ready to connect yet. Ask the household owner to finish calendar setup, then try again.";
  }

  return formatUserFacingError(error, fallback);
}

export function formatInvitationError(error, fallback = "Household invitations could not be completed right now.") {
  const message = rawMessage(error);
  if (!message) return fallback;

  if (matches(message, [
    "household_invitations",
    "familyos_create_household_invitation",
    "familyos_get_household_invitation",
    "familyos_accept_household_invitation",
    "familyos_decline_household_invitation",
    "schema cache",
    "does not exist",
    "relation",
    "table",
    "function",
    "rpc",
    "pgrst",
  ])) {
    return "Household invitations are not available yet.";
  }
  if (matches(message, ["already has a pending invitation", "pending invitation"])) {
    return "That email already has a pending household invitation.";
  }
  if (matches(message, ["expired"])) {
    return "This invitation has expired. Ask the household owner for a new invite.";
  }
  if (matches(message, ["revoked"])) {
    return "This invitation has been revoked. Ask the household owner for a new invite.";
  }
  if (matches(message, ["declined"])) {
    return "This invitation has already been declined.";
  }
  if (matches(message, ["accepted", "already a member"])) {
    return "This invitation has already been accepted.";
  }

  return formatUserFacingError(error, fallback);
}
