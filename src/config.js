const env = import.meta.env || {};
const browserEnv = (viteName, legacyName) => env[viteName] || env[legacyName] || "";

export const APP_CONFIG = {
  supabaseUrl: browserEnv("VITE_SUPABASE_URL", "REACT_APP_SUPABASE_URL"),
  supabaseAnonKey: browserEnv("VITE_SUPABASE_ANON_KEY", "REACT_APP_SUPABASE_ANON_KEY"),
  googleClientId: browserEnv("VITE_GOOGLE_CLIENT_ID", "REACT_APP_GOOGLE_CLIENT_ID"),
  googleCalendarId: browserEnv("VITE_GOOGLE_CALENDAR_ID", "REACT_APP_GOOGLE_CALENDAR_ID"),
  approvedHouseholdEmails: browserEnv("VITE_APPROVED_HOUSEHOLD_EMAILS", "REACT_APP_APPROVED_HOUSEHOLD_EMAILS")
    .split(",")
    .map(email => email.trim().toLowerCase())
    .filter(Boolean),
};

export const REQUIRED_BROWSER_CONFIG = {
  VITE_SUPABASE_URL: APP_CONFIG.supabaseUrl,
  VITE_SUPABASE_ANON_KEY: APP_CONFIG.supabaseAnonKey,
  VITE_GOOGLE_CLIENT_ID: APP_CONFIG.googleClientId,
  VITE_GOOGLE_CALENDAR_ID: APP_CONFIG.googleCalendarId,
};

export const CONFIG_STATUS = {
  missing: Object.entries(REQUIRED_BROWSER_CONFIG)
    .filter(([, value]) => !value)
    .map(([key]) => key),
};
