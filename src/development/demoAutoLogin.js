const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function canAttemptDevelopmentDemoLogin(location, environment = process.env) {
  return environment.NODE_ENV === "development" &&
    LOOPBACK_HOSTS.has(location.hostname) &&
    environment.REACT_APP_ENABLE_DEMO_AUTO_LOGIN === "true" &&
    Boolean(environment.REACT_APP_DEMO_EMAIL) &&
    Boolean(environment.REACT_APP_DEMO_PASSWORD);
}

export async function tryDevelopmentDemoLogin(client, location = window.location, environment = process.env) {
  if (!canAttemptDevelopmentDemoLogin(location, environment)) return { attempted: false, session: null, error: "" };
  const { data, error } = await client.auth.signInWithPassword({
    email: environment.REACT_APP_DEMO_EMAIL,
    password: environment.REACT_APP_DEMO_PASSWORD,
  });
  return {
    attempted: true,
    session: data?.session || null,
    error: error ? "Local demo sign-in could not complete. Reset the demo data and verify the test environment." : "",
  };
}
