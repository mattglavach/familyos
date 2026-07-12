import { configuredWeatherLocation } from "./weatherService";

test("optional weather configuration tolerates a missing settings row", () => {
  expect(configuredWeatherLocation(null)).toBe("");
  expect(configuredWeatherLocation({ zip_code: "15217" })).toBe("15217");
});
