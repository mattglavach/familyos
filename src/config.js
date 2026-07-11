export const APP_CONFIG = {
  supabaseUrl: process.env.REACT_APP_SUPABASE_URL || "",
  supabaseAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || "",
  googleClientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || "",
  googleCalendarId: process.env.REACT_APP_GOOGLE_CALENDAR_ID || "",
  approvedHouseholdEmails: (process.env.REACT_APP_APPROVED_HOUSEHOLD_EMAILS || "")
    .split(",")
    .map(email => email.trim().toLowerCase())
    .filter(Boolean),
  demoAutoLogin: process.env.REACT_APP_ENABLE_DEMO_AUTO_LOGIN === "true",
  demoEmail: process.env.REACT_APP_DEMO_EMAIL || "test@familyos.app",
  demoPassword: process.env.REACT_APP_DEMO_PASSWORD || "",
};

export function canUseDemoAutoLogin(location = window.location, nodeEnv = process.env.NODE_ENV) {
  const localHost = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  return nodeEnv === "development" && localHost && APP_CONFIG.demoAutoLogin && Boolean(APP_CONFIG.demoPassword);
}

export const REQUIRED_BROWSER_CONFIG = {
  REACT_APP_SUPABASE_URL: APP_CONFIG.supabaseUrl,
  REACT_APP_SUPABASE_ANON_KEY: APP_CONFIG.supabaseAnonKey,
};

export const CONFIG_STATUS = {
  missing: Object.entries(REQUIRED_BROWSER_CONFIG)
    .filter(([, value]) => !value)
    .map(([key]) => key),
  optionalMissing: {
    REACT_APP_GOOGLE_CLIENT_ID: !APP_CONFIG.googleClientId,
    REACT_APP_GOOGLE_CALENDAR_ID: !APP_CONFIG.googleCalendarId,
  },
};
