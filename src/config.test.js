describe("demo auto-login controls", () => {
  const original = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = original;
  });

  test("allows an explicitly enabled localhost development build", () => {
    process.env = { ...original, REACT_APP_ENABLE_DEMO_AUTO_LOGIN: "true", REACT_APP_DEMO_PASSWORD: "test-only" };
    jest.isolateModules(() => {
      const { canUseDemoAutoLogin } = require("./config");
      expect(canUseDemoAutoLogin({ hostname: "localhost" }, "development")).toBe(true);
    });
  });

  test.each([
    ["preview host", "familyos-preview.vercel.app", "development"],
    ["production build", "localhost", "production"],
    ["preview production build", "familyos-preview.vercel.app", "production"],
  ])("rejects %s", (_label, hostname, nodeEnv) => {
    process.env = { ...original, REACT_APP_ENABLE_DEMO_AUTO_LOGIN: "true", REACT_APP_DEMO_PASSWORD: "test-only" };
    jest.isolateModules(() => {
      const { canUseDemoAutoLogin } = require("./config");
      expect(canUseDemoAutoLogin({ hostname }, nodeEnv)).toBe(false);
    });
  });
});
