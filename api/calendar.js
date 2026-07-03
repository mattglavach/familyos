import crypto from "crypto";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
];

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const TOKEN_REFRESH_SKEW_MS = 5 * 60 * 1000;
const CALENDAR_SETUP_ERROR = "Google Calendar is not configured for this environment.";

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || "";
}

function getAnonKey() {
  return process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || "";
}

function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

function getGoogleClientId() {
  return process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.REACT_APP_GOOGLE_CLIENT_ID || "";
}

function getGoogleCalendarId() {
  return process.env.GOOGLE_CALENDAR_ID || process.env.REACT_APP_GOOGLE_CALENDAR_ID || "primary";
}

function getBaseUrl(req) {
  const configured = process.env.APP_BASE_URL || process.env.REACT_APP_APP_BASE_URL || "";
  if (configured) return configured.replace(/\/$/, "");
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const proto = req.headers["x-forwarded-proto"] || (host.startsWith("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : "";
}

function getRedirectUri(req) {
  return process.env.GOOGLE_OAUTH_REDIRECT_URI || `${getBaseUrl(req)}/api/calendar?action=callback`;
}

function getAllowedOrigins() {
  const configured = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const vercelUrl = process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : [];
  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...vercelUrl, ...configured])];
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin && getAllowedOrigins().includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getStateSecret() {
  return process.env.GOOGLE_OAUTH_STATE_SECRET || process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || "";
}

function signValue(value) {
  const secret = getStateSecret();
  if (!secret) throw new Error(CALENDAR_SETUP_ERROR);
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function timingSafeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function createSignedState(payload) {
  const body = base64UrlEncode(JSON.stringify({
    ...payload,
    nonce: crypto.randomBytes(16).toString("base64url"),
    issued_at: Date.now(),
  }));
  return `${body}.${signValue(body)}`;
}

function validateSignedState(state) {
  if (!state || typeof state !== "string" || !state.includes(".")) {
    throw new Error("Missing OAuth state");
  }
  const [body, signature] = state.split(".");
  if (!body || !signature || !timingSafeEqual(signature, signValue(body))) {
    throw new Error("Invalid OAuth state signature");
  }
  const payload = JSON.parse(base64UrlDecode(body));
  if (!payload.issued_at || Date.now() - Number(payload.issued_at) > OAUTH_STATE_TTL_MS) {
    throw new Error("OAuth state expired");
  }
  if (payload.provider !== "google" || !payload.household_id || !payload.user_id || !payload.connection_id) {
    throw new Error("OAuth state is missing required fields");
  }
  return payload;
}

function getEncryptionKey() {
  const raw = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || "";
  if (!raw) throw new Error(CALENDAR_SETUP_ERROR);
  const key = Buffer.from(raw, "base64");
  if (key.length === 32) return key;
  const utf8 = Buffer.from(raw, "utf8");
  if (utf8.length === 32) return utf8;
  throw new Error(CALENDAR_SETUP_ERROR);
}

function encryptToken(token) {
  if (!token) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

function decryptToken(value) {
  if (!value) return null;
  const [version, iv, tag, ciphertext] = value.split(".");
  if (version !== "v1" || !iv || !tag || !ciphertext) throw new Error("Unsupported encrypted token format");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function safeConnection(row) {
  return {
    id: row.id,
    household_id: row.household_id,
    provider: row.provider,
    provider_account_email: row.provider_account_email,
    token_expiry: row.token_expiry,
    scopes: row.scopes || [],
    connection_status: row.connection_status,
    last_sync_at: row.last_sync_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    revoked_at: row.revoked_at,
  };
}

function normalizedStatus(rows) {
  const active = rows.find((row) => !row.revoked_at && row.connection_status !== "revoked") || null;
  return {
    connected: active?.connection_status === "connected",
    status: active?.connection_status || "disconnected",
    connection: active ? safeConnection(active) : null,
    connections: rows.map(safeConnection),
  };
}

function normalizeGoogleEvent(event, index, source) {
  const start = event.start?.dateTime || event.start?.date || "";
  if (!start) return null;
  const allDay = !event.start?.dateTime;
  const date = start.split("T")[0];
  const startDate = new Date(start);
  const time = allDay || Number.isNaN(startDate.getTime())
    ? "All day"
    : startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return {
    id: event.id || String(index),
    title: event.summary || "(No title)",
    date,
    time,
    allDay,
    location: event.location || "",
    source,
    htmlLink: event.htmlLink || "",
    status: event.status || "confirmed",
  };
}

async function verifyUser(req) {
  const token = getBearerToken(req);
  const supabaseUrl = getSupabaseUrl();
  const anonKey = getAnonKey();
  if (!token) return { error: "Missing Supabase session bearer token", status: 401 };
  if (!supabaseUrl || !anonKey) return { error: "Calendar service is not configured for this environment.", status: 500 };

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
  });
  const user = await response.json().catch(() => null);
  if (!response.ok || !user?.id) return { error: "Invalid Supabase session", status: 401 };
  return { user, token };
}

async function rest(path, { method = "GET", body, prefer } = {}) {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getServiceRoleKey();
  if (!serviceRoleKey) {
    return { error: { message: "Calendar service is not configured for this environment." }, status: 500 };
  }

  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (prefer) headers.Prefer = prefer;

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) return { error: data, status: response.status };
  return { data, status: response.status };
}

async function requireMembership(userId, householdId) {
  if (!householdId) return { error: "household_id is required", status: 400 };
  const query = new URLSearchParams({
    select: "id,role,status",
    household_id: `eq.${householdId}`,
    user_id: `eq.${userId}`,
    status: "eq.active",
    limit: "1",
  });
  const result = await rest(`household_members?${query.toString()}`);
  if (result.error) return { error: result.error.message || "Could not verify household membership", status: result.status };
  if (!result.data?.length) return { error: "User is not an active member of this household", status: 403 };
  return { membership: result.data[0] };
}

async function listConnections(userId, householdId) {
  const query = new URLSearchParams({
    select: "*",
    household_id: `eq.${householdId}`,
    user_id: `eq.${userId}`,
    provider: "eq.google",
    order: "created_at.desc",
  });
  const result = await rest(`calendar_connections?${query.toString()}`);
  if (result.error) return { error: result.error.message || "Could not load calendar connections", status: result.status };
  return { rows: result.data || [] };
}

async function getConnection(connectionId, userId, householdId) {
  const query = new URLSearchParams({
    select: "*",
    id: `eq.${connectionId}`,
    user_id: `eq.${userId}`,
    household_id: `eq.${householdId}`,
    provider: "eq.google",
    limit: "1",
  });
  const result = await rest(`calendar_connections?${query.toString()}`);
  if (result.error) return { error: result.error.message || "Could not load calendar connection", status: result.status };
  if (!result.data?.length) return { error: "Calendar connection not found", status: 404 };
  return { connection: result.data[0] };
}

async function updateConnection(connectionId, payload) {
  const result = await rest(`calendar_connections?id=eq.${connectionId}&select=*`, {
    method: "PATCH",
    body: payload,
    prefer: "return=representation",
  });
  if (result.error) return { error: result.error.message || "Could not update calendar connection", status: result.status };
  return { connection: Array.isArray(result.data) ? result.data[0] : result.data };
}

async function createPendingConnection(userId, householdId) {
  const existing = await listConnections(userId, householdId);
  if (existing.error) return existing;
  const pending = existing.rows.find((row) => (
    row.connection_status === "pending"
    && !row.revoked_at
    && !row.provider_account_email
  ));
  if (pending) return { connection: pending };

  const payload = {
    user_id: userId,
    household_id: householdId,
    provider: "google",
    scopes: GOOGLE_SCOPES,
    connection_status: "pending",
  };
  const result = await rest("calendar_connections?select=*", {
    method: "POST",
    body: payload,
    prefer: "return=representation",
  });
  if (result.error) return { error: result.error.message || "Could not create pending calendar connection", status: result.status };
  return { connection: Array.isArray(result.data) ? result.data[0] : result.data };
}

function buildGoogleAuthorizationUrl({ req, householdId, userId, connectionId }) {
  const clientId = getGoogleClientId();
  if (!clientId) return { error: CALENDAR_SETUP_ERROR };

  const state = createSignedState({
    provider: "google",
    household_id: householdId,
    user_id: userId,
    connection_id: connectionId,
    return_to: getBaseUrl(req) || "/",
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(req),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: GOOGLE_SCOPES.join(" "),
    state,
  });

  return { authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
}

async function exchangeCodeForTokens(req, code) {
  const clientId = getGoogleClientId();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";
  if (!clientId || !clientSecret) throw new Error(CALENDAR_SETUP_ERROR);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getRedirectUri(req),
      grant_type: "authorization_code",
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error_description || data.error || "Google OAuth token exchange failed");
  return data;
}

async function refreshAccessToken(connection) {
  const refreshToken = decryptToken(connection.refresh_token_ciphertext);
  if (!refreshToken) throw new Error("Calendar refresh token is unavailable");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getGoogleClientId(),
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error_description || data.error || "Google Calendar token refresh failed");

  const tokenExpiry = new Date(Date.now() + Number(data.expires_in || 3600) * 1000).toISOString();
  const updated = await updateConnection(connection.id, {
    access_token_ciphertext: encryptToken(data.access_token),
    token_expiry: tokenExpiry,
    scopes: data.scope ? data.scope.split(" ") : connection.scopes || GOOGLE_SCOPES,
    connection_status: "connected",
  });
  if (updated.error) throw new Error(updated.error);
  return { accessToken: data.access_token, connection: updated.connection };
}

async function getUsableAccessToken(connection) {
  if (connection.connection_status !== "connected" || connection.revoked_at) {
    throw new Error("Google Calendar is not connected");
  }
  const expiry = connection.token_expiry ? new Date(connection.token_expiry).getTime() : 0;
  if (!connection.access_token_ciphertext || !expiry || expiry - Date.now() < TOKEN_REFRESH_SKEW_MS) {
    return refreshAccessToken(connection);
  }
  return { accessToken: decryptToken(connection.access_token_ciphertext), connection };
}

async function fetchGoogleUserInfo(accessToken) {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return {};
  return response.json().catch(() => ({}));
}

async function fetchGoogleEvents(accessToken) {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + 30);
  const calendarId = getGoogleCalendarId();
  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
  });
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || "Google Calendar event fetch failed");
  const source = !calendarId || calendarId === "primary" ? "Google Calendar" : calendarId;
  return (data.items || []).map((event, index) => normalizeGoogleEvent(event, index, source)).filter(Boolean);
}

async function revokeGoogleToken(connection) {
  const token = decryptToken(connection.refresh_token_ciphertext) || decryptToken(connection.access_token_ciphertext);
  if (!token) return;
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  }).catch(() => null);
}

function sendCallbackPage(res, { ok, message, returnTo }) {
  const title = ok ? "Google Calendar connected" : "Calendar connection not completed";
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(ok ? 200 : 400).send(`<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="font-family:system-ui,sans-serif;background:#0f172a;color:#f8fafc;padding:24px">
<h1>${title}</h1>
<p>${message}</p>
<p><a style="color:#93c5fd" href="${returnTo || "/"}">Return to Family OS</a></p>
</body></html>`);
}

async function handleCallback(req, res) {
  try {
    const { code, state, error } = req.query || {};
    if (error) {
      let returnTo = "/";
      try {
        returnTo = validateSignedState(state)?.return_to || "/";
      } catch {}
      sendCallbackPage(res, {
        ok: false,
        message: "Calendar connection was not completed. Nothing changed in Family OS.",
        returnTo,
      });
      return;
    }
    if (!code) throw new Error("Missing Google authorization code");
    const payload = validateSignedState(state);
    const membership = await requireMembership(payload.user_id, payload.household_id);
    if (membership.error) throw new Error(membership.error);

    const connectionResult = await getConnection(payload.connection_id, payload.user_id, payload.household_id);
    if (connectionResult.error) throw new Error(connectionResult.error);

    const tokenData = await exchangeCodeForTokens(req, code);
    const userInfo = await fetchGoogleUserInfo(tokenData.access_token);
    const existingRefreshToken = connectionResult.connection.refresh_token_ciphertext;
    const tokenExpiry = new Date(Date.now() + Number(tokenData.expires_in || 3600) * 1000).toISOString();
    const updated = await updateConnection(payload.connection_id, {
      provider_account_email: userInfo.email || connectionResult.connection.provider_account_email || null,
      access_token_ciphertext: encryptToken(tokenData.access_token),
      refresh_token_ciphertext: tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : existingRefreshToken,
      token_expiry: tokenExpiry,
      scopes: tokenData.scope ? tokenData.scope.split(" ") : GOOGLE_SCOPES,
      connection_status: tokenData.refresh_token || existingRefreshToken ? "connected" : "needs_reauth",
      revoked_at: null,
    });
    if (updated.error) throw new Error(updated.error);

    sendCallbackPage(res, {
      ok: true,
      message: "Your Google Calendar connection is now stored server-side.",
      returnTo: payload.return_to,
    });
  } catch (error) {
    sendCallbackPage(res, {
      ok: false,
      message: "Google Calendar could not be connected right now. Return to Family OS and try again when you are ready.",
      returnTo: "/",
    });
  }
}

async function disconnectConnection(userId, householdId, connectionId) {
  const connections = connectionId
    ? await getConnection(connectionId, userId, householdId)
    : await listConnections(userId, householdId);
  if (connections.error) return connections;

  const rows = connections.connection ? [connections.connection] : connections.rows;
  await Promise.allSettled(rows.map(revokeGoogleToken));

  const filters = new URLSearchParams({
    user_id: `eq.${userId}`,
    household_id: `eq.${householdId}`,
    provider: "eq.google",
  });
  if (connectionId) filters.set("id", `eq.${connectionId}`);

  const result = await rest(`calendar_connections?${filters.toString()}`, {
    method: "PATCH",
    body: {
      connection_status: "revoked",
      revoked_at: new Date().toISOString(),
      access_token_ciphertext: null,
      refresh_token_ciphertext: null,
      token_expiry: null,
    },
    prefer: "return=representation",
  });
  if (result.error) return { error: result.error.message || "Could not disconnect calendar", status: result.status };
  return { connections: (result.data || []).map(safeConnection) };
}

async function handleEvents(res, userId, householdId) {
  const connections = await listConnections(userId, householdId);
  if (connections.error) {
    res.status(connections.status).json({ error: connections.error });
    return;
  }
  const active = connections.rows.find((row) => row.connection_status === "connected" && !row.revoked_at);
  if (!active) {
    res.status(200).json({ ...normalizedStatus(connections.rows), events: [] });
    return;
  }
  try {
    const token = await getUsableAccessToken(active);
    const events = await fetchGoogleEvents(token.accessToken);
    const synced = await updateConnection(token.connection.id, {
      last_sync_at: new Date().toISOString(),
      connection_status: "connected",
    });
    const nextRows = connections.rows.map((row) => row.id === token.connection.id ? (synced.connection || token.connection) : row);
    res.status(200).json({ ...normalizedStatus(nextRows), events });
  } catch (error) {
    await updateConnection(active.id, { connection_status: "needs_reauth" }).catch(() => null);
    res.status(200).json({
      ...normalizedStatus(connections.rows.map((row) => row.id === active.id ? { ...row, connection_status: "needs_reauth" } : row)),
      events: [],
      error: error.message || "Google Calendar events could not be loaded",
    });
  }
}

async function handleAction(req, res, auth) {
  const body = parseBody(req);
  const action = req.query.action || body.action || "status";
  const householdId = req.query.household_id || body.household_id;
  const userId = auth.user.id;

  const membership = await requireMembership(userId, householdId);
  if (membership.error) {
    res.status(membership.status).json({ error: membership.error });
    return;
  }

  if (action === "connect") {
    const pending = await createPendingConnection(userId, householdId);
    if (pending.error) {
      res.status(pending.status).json({ error: pending.error });
      return;
    }
    const authorization = buildGoogleAuthorizationUrl({
      req,
      householdId,
      userId,
      connectionId: pending.connection.id,
    });
    if (authorization.error) {
      res.status(501).json({ error: authorization.error, connection: safeConnection(pending.connection) });
      return;
    }
    res.status(200).json({ ...authorization, connection: safeConnection(pending.connection) });
    return;
  }

  if (action === "disconnect") {
    const disconnected = await disconnectConnection(userId, householdId, body.connection_id || req.query.connection_id);
    if (disconnected.error) {
      res.status(disconnected.status).json({ error: disconnected.error });
      return;
    }
    res.status(200).json({ disconnected: true, connections: disconnected.connections });
    return;
  }

  if (action === "events") {
    await handleEvents(res, userId, householdId);
    return;
  }

  const connections = await listConnections(userId, householdId);
  if (connections.error) {
    res.status(connections.status).json({ error: connections.error });
    return;
  }

  if (action === "connections" || action === "status") {
    res.status(200).json(normalizedStatus(connections.rows));
    return;
  }

  res.status(400).json({ error: `Unsupported calendar action: ${action}` });
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (!["GET", "POST"].includes(req.method)) { res.status(405).json({ error: "Method not allowed" }); return; }

  const origin = req.headers.origin;
  if (origin && !getAllowedOrigins().includes(origin)) {
    res.status(403).json({ error: "Origin not allowed" });
    return;
  }

  const action = req.query.action || parseBody(req).action || "status";
  if (action === "callback") {
    await handleCallback(req, res);
    return;
  }

  try {
    const auth = await verifyUser(req);
    if (auth.error) {
      res.status(auth.status).json({ error: auth.error });
      return;
    }
    await handleAction(req, res, auth);
  } catch (error) {
    res.status(500).json({ error: "Calendar service is unavailable right now." });
  }
}
