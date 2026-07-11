import { createAttentionItem, normalizeAttentionItems } from "../../services/attentionItems";

export const POOL_CONTEXT_VERSION = "2.0";
export const STALE_TEST_HOURS = 72;
export const CHEMICAL_SEPARATION_HOURS = 4;
const METRICS = ["free_chlorine", "cc", "ph", "cya", "salt", "water_temp", "pump_hours", "swg_setting"];

export function hoursSince(value, now = new Date()) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? (now.getTime() - timestamp) / 3600000 : Infinity;
}
function timestamp(item) { return new Date(item?.logged_at || `${item?.date || ""}T12:00:00`).getTime(); }
function value(item, key) { const number = Number(item?.[key]); return Number.isFinite(number) ? number : null; }
function sorted(items = []) { return [...items].sort((a, b) => timestamp(b) - timestamp(a)); }

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

export function classifyTrend(readings = [], key, { now = new Date(), staleHours = STALE_TEST_HOURS } = {}) {
  const points = sorted(readings).filter(item => value(item, key) !== null).slice(0, 8);
  if (points.length < 3) return { metric: key, state: "insufficient-data", observation: "Insufficient data", review: "Log at least three comparable records.", recordsUsed: points.length };
  if (hoursSince(points[0].logged_at || points[0].date, now) > staleHours) return { metric: key, state: "stale-data", observation: "Stale data", review: "Log a current record before interpreting the trend.", recordsUsed: points.length };
  const chronological = [...points].reverse();
  const first = value(chronological[0], key), last = value(chronological[chronological.length - 1], key);
  const average = chronological.reduce((sum, item) => sum + value(item, key), 0) / chronological.length;
  const tolerance = Math.max(Math.abs(average) * 0.05, key === "ph" ? 0.1 : 0.25);
  const delta = last - first;
  const intervals = chronological.slice(1).map((item, index) => (timestamp(item) - timestamp(chronological[index])) / 3600000);
  const irregular = intervals.length > 1 && Math.max(...intervals) > Math.min(...intervals) * 2.5;
  const state = Math.abs(delta) <= tolerance ? "stable" : delta > 0 ? "rising" : "falling";
  return { metric: key, state, observation: `${state[0].toUpperCase()}${state.slice(1)} across ${points.length} records`, review: "Observed history only. Review current conditions before acting.", recordsUsed: points.length, delta: Number(delta.toFixed(2)), irregularIntervals: irregular };
}

function hasChlorineTreatment(item) { return Number(item.liquid_chlorine_oz) > 0 || Number(item.shock_lbs) > 0 || /chlorine|shock/i.test(item.treatment || ""); }
function hasAcidTreatment(item) { return Number(item.muriatic_acid_oz) > 0 || /acid/i.test(item.treatment || ""); }

export function summarizeChlorineDemand({ readings = [], treatments = [], now = new Date() } = {}) {
  const points = sorted(readings).filter(item => value(item, "free_chlorine") !== null);
  if (points.length < 2) return { state: "insufficient-data", explanation: "At least two free-chlorine tests are required.", recordsUsed: points.length };
  if (hoursSince(points[0].logged_at || points[0].date, now) > STALE_TEST_HOURS) return { state: "stale-data", explanation: "The latest chlorine test is stale.", recordsUsed: points.length };
  const intervals = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const end = points[i], start = points[i + 1], hours = (timestamp(end) - timestamp(start)) / 3600000;
    if (hours <= 0 || hours > 96) continue;
    const contaminated = treatments.some(item => hasChlorineTreatment(item) && timestamp(item) > timestamp(start) && timestamp(item) < timestamp(end));
    intervals.push({ start: start.logged_at || start.date, end: end.logged_at || end.date, hours, contaminated, dailyChange: Number(((value(start, "free_chlorine") - value(end, "free_chlorine")) / hours * 24).toFixed(2)) });
  }
  const usable = intervals.filter(item => !item.contaminated);
  if (!usable.length) return { state: intervals.length ? "treatment-contaminated" : "insufficient-data", explanation: intervals.length ? "Every comparable interval includes a recorded chlorine treatment." : "No comparable test intervals were found.", recordsUsed: points.length, intervals };
  const estimate = usable.reduce((sum, item) => sum + item.dailyChange, 0) / usable.length;
  return { state: "observed", observedDailyFcDemand: Number(estimate.toFixed(2)), unit: "ppm/day", dateRange: { start: usable[usable.length - 1].start, end: usable[0].end }, recordsUsed: usable.length + 1, intervals, explanation: "Observed field estimate, not laboratory accuracy. Do not adjust SWG or dose from this summary alone." };
}

export function summarizePhRise({ readings = [], treatments = [], now = new Date() } = {}) {
  const points = sorted(readings).filter(item => value(item, "ph") !== null);
  if (points.length < 2) return { state: "insufficient-data", explanation: "At least two pH tests are required." };
  if (hoursSince(points[0].logged_at || points[0].date, now) > STALE_TEST_HOURS) return { state: "stale-data", explanation: "The latest pH test is stale." };
  const acid = sorted(treatments).filter(hasAcidTreatment);
  if (acid.length && hoursSince(acid[0].logged_at || acid[0].date, now) <= CHEMICAL_SEPARATION_HOURS) return { state: "recent-treatment", explanation: "Acid was added recently. Wait for the planned retest window." };
  const pairs = acid.map(treatment => {
    const before = [...points].reverse().filter(item => timestamp(item) <= timestamp(treatment)).pop();
    const after = [...points].reverse().find(item => timestamp(item) > timestamp(treatment));
    if (!before || !after) return null;
    return { treatmentId: treatment.id, hoursToRetest: Number(((timestamp(after) - timestamp(treatment)) / 3600000).toFixed(1)), observedChange: Number((value(after, "ph") - value(before, "ph")).toFixed(2)) };
  }).filter(Boolean);
  if (!pairs.length) return { state: "insufficient-data", explanation: "No acid treatment has both a before and after pH test.", acidAdditions: acid.length };
  return { state: "observed", typicalObservedRise: Number((pairs.reduce((sum, item) => sum + item.observedChange, 0) / pairs.length).toFixed(2)), unit: "pH", acidAdditions: acid.length, retestPairs: pairs, explanation: "Observed history only. This does not diagnose chemistry or equipment causes." };
}

export function buildRetestStatuses(treatments = [], readings = [], now = new Date()) {
  return sorted(treatments).map(treatment => {
    const required = Boolean(treatment.retest_at || hasAcidTreatment(treatment) || hasChlorineTreatment(treatment));
    const completedReading = required ? sorted(readings).reverse().find(reading => timestamp(reading) >= timestamp(treatment) && (!treatment.retest_at || timestamp(reading) >= new Date(treatment.retest_at).getTime() - 3600000)) : null;
    const status = !required ? "not-required" : completedReading || treatment.follow_up_result ? "completed" : treatment.retest_at && new Date(treatment.retest_at) < now ? "overdue" : "pending";
    return { treatmentId: treatment.id, relatedReadingId: treatment.related_reading_id || null, retestReadingId: completedReading?.id || null, expectedRetestAt: treatment.retest_at || null, status, followUpNotes: treatment.follow_up_result || "" };
  });
}

export function buildMaintenanceStatus({ schedule = [], equipment = [], readings = [], tasks = [], now = new Date() } = {}) {
  const today = now.toISOString().slice(0, 10);
  const items = schedule.map(item => { const due = item.last_completed && item.interval_days ? new Date(new Date(`${item.last_completed}T12:00:00`).getTime() + Number(item.interval_days) * 86400000).toISOString().slice(0, 10) : null; return { id: item.id, title: item.title, dueDate: due, state: !due ? "not-configured" : due < today ? "overdue" : (new Date(`${due}T12:00:00`) - new Date(`${today}T12:00:00`)) / 86400000 <= 7 ? "due-soon" : "current" }; });
  const equipmentItems = equipment.filter(item => item.active !== false).map(item => ({ id: item.id, title: item.name || item.type, dueDate: item.next_maintenance || null, state: !item.next_maintenance ? "not-configured" : item.next_maintenance < today ? "overdue" : item.next_maintenance <= new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10) ? "due-soon" : "current" }));
  const test = readings[0] ? (hoursSince(readings[0].logged_at || readings[0].date, now) > STALE_TEST_HOURS ? "overdue" : "current") : "insufficient-data";
  return { waterTesting: test, items: [...items, ...equipmentItems], openTasks: tasks.filter(task => !task.completed && (task.module === "pool" || task.category === "Pool")) };
}

export function buildPoolContext({ householdIdentifier = null, profile = null, readings = [], treatments = [], equipment = [], maintenance = [], schedule = [], usage = [], tasks = [], recommendations = [], now = new Date() }) {
  const latestReading = sorted(readings)[0] || null;
  const safety = evaluatePoolSafety({ reading: latestReading, treatments, now });
  const retests = buildRetestStatuses(treatments, readings, now);
  const maintenanceStatus = buildMaintenanceStatus({ schedule, equipment, readings: sorted(readings), tasks, now });
  const completeness = [!profile && "missing-profile", latestReading?.cya == null && "missing-cya", !latestReading && "missing-recent-test", profile && !profile.pump && "missing-pump", profile?.saltwater && !profile.salt_cell && "missing-swg", retests.some(item => item.status === "overdue") && "missing-follow-up", equipment.some(item => hoursSince(item.updated_at, now) > 720) && "stale-equipment-data"].filter(Boolean);
  const attentionItems = [];
  if (safety.stale) attentionItems.push(createAttentionItem({ householdIdentifier, sourceModule: "pool", type: latestReading ? "test-stale" : "test-overdue", severity: latestReading ? "High" : "Medium", title: latestReading ? "Pool test is stale" : "Pool test needed", message: "Log a complete water test before making treatment decisions.", relevantDate: latestReading?.date, navigationDestination: "pool" }));
  retests.filter(item => item.status === "overdue").forEach(item => attentionItems.push(createAttentionItem({ householdIdentifier, sourceModule: "pool", sourceRecordId: item.treatmentId, type: "retest-overdue", severity: "High", title: "Pool treatment retest overdue", message: "Log the planned retest and observed outcome.", relevantDate: item.expectedRetestAt, navigationDestination: "pool" })));
  maintenanceStatus.items.filter(item => ["overdue", "due-soon"].includes(item.state)).forEach(item => attentionItems.push(createAttentionItem({ householdIdentifier, sourceModule: "pool", sourceRecordId: item.id, type: `maintenance-${item.state}`, severity: item.state === "overdue" ? "High" : "Medium", title: `${item.title} ${item.state === "overdue" ? "overdue" : "due soon"}`, message: "Review the maintenance schedule.", relevantDate: item.dueDate, navigationDestination: "pool" })));
  recommendations.filter(item => ["critical", "high", "medium", "med"].includes(item.priority)).forEach(item => attentionItems.push(createAttentionItem({ householdIdentifier, sourceModule: "pool", sourceRecordId: item.id || item.param, type: "chemistry-review", severity: item.priority === "critical" || item.priority === "high" ? "High" : "Medium", title: item.action || "Pool chemistry needs review", message: item.explanation || item.detail || "Review current chemistry and confirm any action.", relevantDate: latestReading?.date, navigationDestination: "pool", deduplicationKey: `pool:chemistry:${item.id || item.param || item.action}` })));
  return {
    contract: "familyos.pool-context", version: POOL_CONTEXT_VERSION, generatedAt: now.toISOString(), householdIdentifier,
    profileSummary: profile, latestCompleteTest: latestReading, testFreshness: { state: safety.stale ? "stale" : latestReading ? "current" : "unavailable", stale: safety.stale },
    chemistryStatus: { warnings: safety.warnings, confidence: safety.confidence }, recentReadings: sorted(readings).slice(0, 10), recentTreatments: sorted(treatments).slice(0, 10),
    pendingRetests: retests.filter(item => ["pending", "overdue"].includes(item.status)), retestStatuses: retests,
    chlorineDemandSummary: summarizeChlorineDemand({ readings, treatments, now }), phRiseSummary: summarizePhRise({ readings, treatments, now }),
    maintenanceStatus, equipmentStatus: equipment.filter(item => item.active !== false), openTasks: maintenanceStatus.openTasks,
    dataCompletenessFlags: completeness, attentionItems: normalizeAttentionItems(attentionItems, { householdIdentifier, now }),
    trendSummaries: Object.fromEntries(METRICS.map(key => [key, classifyTrend(readings, key, { now })])),
    safetyConstraints: { humanConfirmationRequired: true, automaticDosing: false, automaticEquipmentControl: false, chemicalSeparationHours: CHEMICAL_SEPARATION_HOURS },
    recommendations, recentUsage: usage.slice(0, 10),
    dataQuality: { stale: safety.stale, missing: safety.missing, confidence: safety.confidence }, activeWarnings: safety.warnings,
    profile, latestReading, equipmentSettings: equipment.filter(item => item.active !== false),
  };
}
