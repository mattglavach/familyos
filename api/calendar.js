const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
];

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || "";
}

function getAnonKey() {
  return process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || "";
}

function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
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

async function verifyUser(req) {
  const token = getBearerToken(req);
  const supabaseUrl = getSupabaseUrl();
  const anonKey = getAnonKey();
  if (!token) return { error: "Missing Supabase session bearer token", status: 401 };
  if (!supabaseUrl || !anonKey) return { error: "Supabase API environment is not configured", status: 500 };

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

async function rest(path, { method = "GET", body, token, prefer } = {}) {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getServiceRoleKey();
  if (!serviceRoleKey) {
    return { error: { message: "SUPABASE_SERVICE_ROLE_KEY is not configured" }, status: 500 };
  }

  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
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

function buildGoogleAuthorizationUrl({ householdId, userId, origin }) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.REACT_APP_GOOGLE_CLIENT_ID || "";
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || `${origin || ""}/api/calendar?action=callback`;
  if (!clientId) return { error: "GOOGLE_OAUTH_CLIENT_ID is not configured" };

  const state = Buffer.from(JSON.stringify({
    provider: "google",
    household_id: householdId,
    user_id: userId,
    created_at: new Date().toISOString(),
  })).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES.join(" "),
    state,
  });

  return { authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
}

async function ensurePendingConnection(userId, householdId) {
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

async function disconnectConnection(userId, householdId, connectionId) {
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

async function handleAction(req, res, auth) {
  const body = parseBody(req);
  const action = req.query.action || body.action || "status";
  const householdId = req.query.household_id || body.household_id;
  const userId = auth.user.id;

  if (action === "callback") {
    res.status(501).json({
      error: "Google OAuth callback token exchange is intentionally a server-side placeholder in Release 0.8.",
      required_env: ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REDIRECT_URI", "SUPABASE_SERVICE_ROLE_KEY"],
    });
    return;
  }

  const membership = await requireMembership(userId, householdId);
  if (membership.error) {
    res.status(membership.status).json({ error: membership.error });
    return;
  }

  if (action === "connect") {
    const pending = await ensurePendingConnection(userId, householdId);
    if (pending.error) {
      res.status(pending.status).json({ error: pending.error });
      return;
    }
    const authorization = buildGoogleAuthorizationUrl({
      householdId,
      userId,
      origin: req.headers.origin,
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

  const connections = await listConnections(userId, householdId);
  if (connections.error) {
    res.status(connections.status).json({ error: connections.error });
    return;
  }

  if (action === "connections" || action === "status") {
    res.status(200).json(normalizedStatus(connections.rows));
    return;
  }

  if (action === "events") {
    res.status(200).json({
      ...normalizedStatus(connections.rows),
      events: [],
      note: "Server-side Google Calendar event fetch is a Release 0.8 placeholder until OAuth callback token exchange is configured.",
    });
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
    res.status(501).json({
      error: "Google OAuth callback token exchange is intentionally a server-side placeholder in Release 0.8.",
      required_env: ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REDIRECT_URI", "SUPABASE_SERVICE_ROLE_KEY"],
    });
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
    res.status(500).json({ error: error.message || "Calendar API failed" });
  }
}
