import { canAttemptDevelopmentDemoLogin, tryDevelopmentDemoLogin } from "./demoAutoLogin";

const enabled = { NODE_ENV: "development", REACT_APP_ENABLE_DEMO_AUTO_LOGIN: "true", REACT_APP_DEMO_EMAIL: "demo@example.test", REACT_APP_DEMO_PASSWORD: "test-only" };

test("requires development, loopback, flag, and both credentials", () => {
  expect(canAttemptDevelopmentDemoLogin({ hostname: "localhost" }, enabled)).toBe(true);
  expect(canAttemptDevelopmentDemoLogin({ hostname: "preview.example" }, enabled)).toBe(false);
  expect(canAttemptDevelopmentDemoLogin({ hostname: "localhost" }, { ...enabled, NODE_ENV: "production" })).toBe(false);
  expect(canAttemptDevelopmentDemoLogin({ hostname: "localhost" }, { ...enabled, NODE_ENV: "test" })).toBe(false);
  expect(canAttemptDevelopmentDemoLogin({ hostname: "localhost" }, { ...enabled, REACT_APP_ENABLE_DEMO_AUTO_LOGIN: "false" })).toBe(false);
  expect(canAttemptDevelopmentDemoLogin({ hostname: "localhost" }, { ...enabled, REACT_APP_DEMO_PASSWORD: "" })).toBe(false);
});

test("does not call authentication when disabled", async () => {
  const signInWithPassword = jest.fn();
  await expect(tryDevelopmentDemoLogin({ auth: { signInWithPassword } }, { hostname: "preview.example" }, enabled)).resolves.toMatchObject({ attempted: false });
  expect(signInWithPassword).not.toHaveBeenCalled();
});

test("returns the authenticated session when enabled", async () => {
  const session = { access_token: "test" };
  const signInWithPassword = jest.fn().mockResolvedValue({ data: { session }, error: null });
  await expect(tryDevelopmentDemoLogin({ auth: { signInWithPassword } }, { hostname: "127.0.0.1" }, enabled)).resolves.toEqual({ attempted: true, session, error: "" });
});
