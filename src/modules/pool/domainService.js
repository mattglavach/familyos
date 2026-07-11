/** @typedef {'High'|'Medium'|'Low'} Confidence */

export const POOL_CONTEXT_VERSION = "1.0";
export const STALE_TEST_HOURS = 72;
export const CHEMICAL_SEPARATION_HOURS = 4;

export function hoursSince(value, now = new Date()) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? (now.getTime() - timestamp) / 3600000 : Infinity;
}

export function evaluatePoolSafety({ reading, treatments = [], now = new Date() }) {
  const warnings = [];
  const stale = !reading || hoursSince(reading.logged_at || reading.date, now) > STALE_TEST_HOURS;
  if (stale) warnings.push("Water test is stale. Retest before dosing or confirming swim safety.");
  const missing = ["free_chlorine", "ph", "cya"].filter(key => reading?.[key] === null || reading?.[key] === undefined);
  if (missing.length) warnings.push(`Missing safety inputs: ${missing.join(", ")}.`);
  const recent = treatments.filter(item => hoursSince(item.logged_at || item.date, now) <= CHEMICAL_SEPARATION_HOURS);
  const recentAcid = recent.some(item => Number(item.muriatic_acid_oz) > 0 || /acid/i.test(item.treatment || ""));
  const recentChlorine = recent.some(item => Number(item.liquid_chlorine_oz) > 0 || /chlorine|shock/i.test(item.treatment || ""));
  if (recent.length) warnings.push("A recent treatment is still circulating. Do not repeat a dose until its retest window.");
  if (recentAcid) warnings.push("Do not add chlorine until the acid separation window has passed.");
  if (recentChlorine) warnings.push("Do not add acid until the chlorine separation window has passed.");
  return { stale, missing, recentTreatments: recent, warnings, swimStatus: stale || missing.length ? "unknown" : "evaluate", confidence: stale || missing.length ? "Low" : "Medium" };
}

export function buildPoolContext({ profile = null, readings = [], treatments = [], equipment = [], usage = [], tasks = [], recommendations = [], now = new Date() }) {
  const latestReading = readings[0] || null;
  const safety = evaluatePoolSafety({ reading: latestReading, treatments, now });
  return {
    contract: "familyos.pool-context",
    version: POOL_CONTEXT_VERSION,
    generatedAt: now.toISOString(),
    profile,
    latestReading,
    recentReadings: readings.slice(0, 10),
    recentTreatments: treatments.slice(0, 10),
    equipmentSettings: equipment.filter(item => item.active !== false),
    recentUsage: usage.slice(0, 10),
    openTasks: tasks.filter(task => !task.completed && (task.module === "pool" || task.category === "Pool")),
    activeWarnings: safety.warnings,
    recommendations,
    dataQuality: { stale: safety.stale, missing: safety.missing, confidence: safety.confidence },
  };
}
