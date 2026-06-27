export const APP_CONFIG = {
  supabaseUrl: process.env.REACT_APP_SUPABASE_URL || "",
  supabaseAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || "",
  googleClientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || "",
  googleCalendarId: process.env.REACT_APP_GOOGLE_CALENDAR_ID || "",
};

export const REQUIRED_BROWSER_CONFIG = {
  REACT_APP_SUPABASE_URL: APP_CONFIG.supabaseUrl,
  REACT_APP_SUPABASE_ANON_KEY: APP_CONFIG.supabaseAnonKey,
  REACT_APP_GOOGLE_CLIENT_ID: APP_CONFIG.googleClientId,
  REACT_APP_GOOGLE_CALENDAR_ID: APP_CONFIG.googleCalendarId,
};

export const CONFIG_STATUS = {
  missing: Object.entries(REQUIRED_BROWSER_CONFIG)
    .filter(([, value]) => !value)
    .map(([key]) => key),
};
