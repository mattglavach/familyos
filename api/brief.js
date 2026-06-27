const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

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

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function validateRequestBody(body) {
  if (!body || !Array.isArray(body.messages)) return "messages must be provided";
  if (body.messages.length > 8) return "too many messages";

  const invalidMessage = body.messages.some((message) => (
    !message ||
    !["user", "assistant"].includes(message.role) ||
    typeof message.content !== "string" ||
    message.content.length > 12000
  ));

  return invalidMessage ? "invalid message payload" : null;
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const origin = req.headers.origin;
  if (origin && !getAllowedOrigins().includes(origin)) {
    res.status(403).json({ error: "Origin not allowed" });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured" });
    return;
  }

  const validationError = validateRequestBody(req.body);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const payload = {
    model: req.body.model || "claude-sonnet-4-6",
    max_tokens: Math.min(Number(req.body.max_tokens) || 1000, 1200),
    messages: req.body.messages,
  };

  if (Array.isArray(req.body.tools)) {
    payload.tools = req.body.tools.filter((tool) => tool?.type === "web_search_20250305");
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
