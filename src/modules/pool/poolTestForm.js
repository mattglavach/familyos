import { TODAY_STR } from "../../lib/dates";

export const POOL_TEST_CONTEXT_OPTIONS = {
  rain: "Rain",
};
export const POOL_TEST_CONTEXTS = ["Routine", "After rain", "Before party", "After party", "Vacation", "Equipment issue", "Algae concern", "Spa use", "Other"];

export const POOL_TEST_FIELD_LABELS = {
  free_chlorine: "FC ppm",
  ph: "pH",
  cc: "CC ppm",
  alkalinity: "TA ppm",
  cya: "CYA ppm",
  salt: "Salt ppm",
  water_temp: "Temperature F",
  filter_pressure: "Filter PSI",
  swg_setting: "SWG %",
  pump_hours: "Pump Runtime",
  calcium_hardness: "Calcium ppm",
};

export const POOL_TEST_VALIDATION_LABELS = {
  free_chlorine: "FC",
  ph: "pH",
  cc: "CC",
  alkalinity: "TA",
  cya: "CYA",
  salt: "Salt",
  water_temp: "water temp",
  filter_pressure: "filter pressure",
  swg_setting: "SWG",
  pump_hours: "pump runtime",
  calcium_hardness: "calcium",
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

export const POOL_TEST_PRIMARY_FIELDS = [
  { key: "free_chlorine", min: 0, max: 50, step: 0.5, inputMode: "decimal", placeholder: "e.g. 5.5" },
  { key: "cc", min: 0, max: 20, step: 0.5, inputMode: "decimal", placeholder: "0" },
  { key: "ph", min: 6.2, max: 9, step: 0.1, inputMode: "decimal" },
  { key: "alkalinity", min: 0, max: 300, inputMode: "numeric" },
  { key: "cya", min: 0, max: 200, inputMode: "numeric" },
  { key: "salt", min: 0, max: 8000, inputMode: "numeric" },
  { key: "water_temp", min: 32, max: 110, inputMode: "numeric" },
];

export const POOL_TEST_ADVANCED_FIELDS = [
  { key: "filter_pressure", min: 0, max: 60, inputMode: "numeric" },
  { key: "swg_setting", min: 0, max: 100, inputMode: "numeric" },
  { key: "pump_hours", min: 0, max: 24, step: 0.5, inputMode: "decimal" },
  { key: "calcium_hardness", min: 0, max: 1000, inputMode: "numeric" },
];

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
  return Object.keys(POOL_TEST_FIELD_RANGES).some(key => {
    const value = form[key];
    return value !== "" && value !== undefined && value !== null;
  });
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ""));
}

export function validatePoolTestForm(form) {
  const date = form.date || TODAY_STR;
  if (!validDate(date)) return { valid: false, message: "Enter a valid test date.", fields: ["date"] };
  if (form.time && !validTime(form.time)) return { valid: false, message: "Enter a valid test time.", fields: ["time"] };
  const invalidFields = Object.keys(POOL_TEST_FIELD_RANGES).filter(key => poolTestFieldError(key, form));
  if (invalidFields.length) {
    return {
      valid: false,
      message: `Check ${invalidFields.map(key => POOL_TEST_VALIDATION_LABELS[key] || POOL_TEST_FIELD_LABELS[key]).join(", ")} before saving.`,
      fields: invalidFields,
    };
  }

  if (!hasMeaningfulPoolTestEntry(form)) {
    return {
      valid: false,
      message: "Add at least one chemistry or water measurement before saving.",
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
    recent_weather_notes: String(form.recent_weather_notes || "").trim() || null,
    recent_heavy_usage: Boolean(form.recent_heavy_usage),
    test_context: form.test_context || "Routine",
    water_appearance: String(form.water_appearance || "").trim() || null,
    notes: String(form.notes || "").trim() || null,
  };
}
