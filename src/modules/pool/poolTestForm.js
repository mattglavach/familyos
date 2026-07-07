import { TODAY_STR } from "../../lib/dates";

export const POOL_TEST_CONTEXT_OPTIONS = {
  rain: "Rain",
};

export const POOL_TEST_FIELD_LABELS = {
  free_chlorine: "FC",
  ph: "pH",
  cc: "CC",
  alkalinity: "TA",
  cya: "CYA",
  salt: "Salt",
  water_temp: "Water temp",
  filter_pressure: "Filter PSI",
  swg_setting: "SWG",
  pump_hours: "Pump runtime",
  calcium_hardness: "Calcium",
};

export const POOL_TEST_FIELD_RANGES = {
  free_chlorine: [0, 50],
  cc: [0, 20],
  ph: [6.2, 9.0],
  alkalinity: [0, 300],
  cya: [0, 200],
  salt: [0, 8000],
  water_temp: [32, 110],
  filter_pressure: [0, 60],
  swg_setting: [0, 100],
  pump_hours: [0, 24],
  calcium_hardness: [0, 1000],
};

export function poolTestNumber(value) {
  return value === undefined || value === null || value === "" ? null : Number(value);
}

export function poolTestFieldError(key, form) {
  const rawValue = form[key];
  if (rawValue === "" || rawValue === undefined || rawValue === null) return "";

  const value = poolTestNumber(rawValue);
  if (!Number.isFinite(value)) return "Enter a number.";

  const range = POOL_TEST_FIELD_RANGES[key];
  if (range && (value < range[0] || value > range[1])) return `Expected ${range[0]}-${range[1]}.`;
  return "";
}

export function hasRainContext(form) {
  return String(form.recent_weather_notes || "").split(",").map(item => item.trim().toLowerCase()).includes("rain");
}

export function setRainContext(form, enabled) {
  const notes = String(form.recent_weather_notes || "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)
    .filter(item => item.toLowerCase() !== "rain");
  if (enabled) notes.unshift(POOL_TEST_CONTEXT_OPTIONS.rain);
  return notes.join(", ");
}

export function hasMeaningfulPoolTestEntry(form) {
  const hasNumber = Object.keys(POOL_TEST_FIELD_RANGES).some(key => {
    const value = form[key];
    return value !== "" && value !== undefined && value !== null;
  });
  return Boolean(
    hasNumber
    || String(form.notes || "").trim()
    || String(form.recent_weather_notes || "").trim()
    || form.recent_heavy_usage
  );
}

export function validatePoolTestForm(form) {
  const invalidFields = Object.keys(POOL_TEST_FIELD_RANGES).filter(key => poolTestFieldError(key, form));
  if (invalidFields.length) {
    return {
      valid: false,
      message: `Check ${invalidFields.map(key => POOL_TEST_FIELD_LABELS[key]).join(", ")} before saving.`,
      fields: invalidFields,
    };
  }

  if (!hasMeaningfulPoolTestEntry(form)) {
    return {
      valid: false,
      message: "Add at least one test result, note, rain, or party/heavy-use context before saving.",
      fields: [],
    };
  }

  return { valid: true, message: "", fields: [] };
}

export function buildPoolReadingRow(form, options = {}) {
  let freeChlorine = poolTestNumber(form.free_chlorine);
  if (form._drops && freeChlorine !== null) freeChlorine = Math.round(freeChlorine * 0.5 * 10) / 10;

  const date = form.date || TODAY_STR;
  const time = form.time || options.time || new Date().toTimeString().slice(0, 5);

  return {
    date,
    logged_at: new Date(`${date}T${time}:00`).toISOString(),
    test_source: form.test_source || options.testSource || "Manual",
    ph: poolTestNumber(form.ph),
    free_chlorine: freeChlorine,
    cc: poolTestNumber(form.cc),
    salt: poolTestNumber(form.salt),
    cya: poolTestNumber(form.cya),
    alkalinity: poolTestNumber(form.alkalinity),
    calcium_hardness: poolTestNumber(form.calcium_hardness),
    water_temp: poolTestNumber(form.water_temp),
    filter_pressure: poolTestNumber(form.filter_pressure),
    swg_setting: poolTestNumber(form.swg_setting),
    pump_hours: poolTestNumber(form.pump_hours),
    recent_weather_notes: form.recent_weather_notes || "",
    recent_heavy_usage: Boolean(form.recent_heavy_usage),
    notes: form.notes || "",
  };
}
