import { daysBetween } from "../../lib/dates";
import { COLORS } from "../../theme";

export const POOL_RULE_CONFIG = {
  poolGallons: 17000,
  targets: {
    ph: { low: 7.2, idealLow: 7.4, idealHigh: 7.6, high: 7.8 },
    freeChlorine: { minCyaRatio: 0.075, defaultMinimum: 3, high: 8 },
    combinedChlorine: { watch: 0.2, high: 0.5 },
    totalAlkalinity: { low: 80, ideal: 100, high: 120 },
    cya: { low: 60, ideal: 70, high: 80 },
    salt: { low: 3200, ideal: 3400, high: 3800 },
    waterTemp: { high: 88 },
    pumpHours: { minimum: 8, heavyUseExtra: 2 },
  },
  maintenance: {
    filterCleaningWarningDays: 4,
  },
  safetyNote: "Confirm product labels, pump state, and swimmer safety before adding chemicals. Never mix chemicals.",
};

function numberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatAmount(value, unit) {
  if (value === null || value === undefined) return "";
  return `${value} ${unit}`.trim();
}

function acidDoseOz(ph, alkalinity, gallons) {
  if (!ph || ph <= POOL_RULE_CONFIG.targets.ph.idealHigh) return null;
  const phDrop = ph - POOL_RULE_CONFIG.targets.ph.idealLow;
  const alkalinityFactor = (alkalinity || 90) / 100;
  return Math.max(4, Math.round(phDrop * 12 * alkalinityFactor * (gallons / 10000)));
}

function stabilizerDoseOz(cya, gallons) {
  if (!cya || cya >= POOL_RULE_CONFIG.targets.cya.low) return null;
  return Math.round((POOL_RULE_CONFIG.targets.cya.ideal - cya) * gallons / 1000000 * 10 * 134);
}

function saltDoseBags(salt, gallons) {
  if (!salt || salt >= POOL_RULE_CONFIG.targets.salt.low) return null;
  const lbs = Math.round((POOL_RULE_CONFIG.targets.salt.ideal - salt) * gallons / 1000000 * 8.34);
  return Math.max(1, Math.ceil(lbs / 40));
}

function targetSwgPercent(reading) {
  const fc = numberOrNull(reading?.free_chlorine);
  const cya = numberOrNull(reading?.cya) || POOL_RULE_CONFIG.targets.cya.ideal;
  const waterTemp = numberOrNull(reading?.water_temp);
  const pumpHours = numberOrNull(reading?.pump_hours) || POOL_RULE_CONFIG.targets.pumpHours.minimum;
  const minimumFc = Math.max(POOL_RULE_CONFIG.targets.freeChlorine.defaultMinimum, Math.round(cya * POOL_RULE_CONFIG.targets.freeChlorine.minCyaRatio));
  const temperatureBoost = waterTemp && waterTemp > 85 ? 1.2 : 1;
  const base = Math.round(60 * temperatureBoost * (POOL_RULE_CONFIG.targets.pumpHours.minimum / pumpHours));
  if (fc !== null && fc < minimumFc) return Math.min(100, base + 25);
  if (fc !== null && fc > minimumFc * 1.7) return Math.max(20, base - 20);
  return Math.min(100, Math.max(20, base));
}

export function getPoolHealth(reading, recommendations = []) {
  if (!reading) return { status: "Attention", color: COLORS.amber, summary: "Log a water test to get today's pool guidance." };
  const critical = recommendations.some(item => item.priority === "critical");
  const attention = recommendations.some(item => item.priority === "high" || item.priority === "medium");
  if (critical) return { status: "Critical", color: COLORS.red, summary: recommendations.find(item => item.priority === "critical")?.action || "Pool needs immediate attention." };
  if (attention) return { status: "Attention", color: COLORS.amber, summary: recommendations[0]?.action || "Pool needs a small adjustment." };
  return { status: "Good", color: COLORS.green, summary: "Pool looks good. Keep normal testing and maintenance on schedule." };
}

export function getPoolRecommendations(reading, { schedule = [], recentTreatments = [], recentNotes = [] } = {}) {
  if (!reading) {
    return [{
      id: "log-first-test",
      priority: "high",
      category: "Reading",
      action: "Log a pool water test.",
      amount: "",
      timing: "Today",
      retest: "After the first complete test.",
      explanation: "The assistant needs current FC, pH, salt, and CYA before it can recommend care.",
      confidence: "High",
      safetyNote: POOL_RULE_CONFIG.safetyNote,
      color: COLORS.amber,
    }];
  }

  const recs = [];
  const fc = numberOrNull(reading.free_chlorine);
  const cc = numberOrNull(reading.cc);
  const ph = numberOrNull(reading.ph);
  const ta = numberOrNull(reading.alkalinity);
  const cya = numberOrNull(reading.cya);
  const salt = numberOrNull(reading.salt);
  const waterTemp = numberOrNull(reading.water_temp);
  const pumpHours = numberOrNull(reading.pump_hours);
  const swg = numberOrNull(reading.swg_setting);
  const minimumFc = Math.max(POOL_RULE_CONFIG.targets.freeChlorine.defaultMinimum, Math.round((cya || POOL_RULE_CONFIG.targets.cya.ideal) * POOL_RULE_CONFIG.targets.freeChlorine.minCyaRatio));
  const heavyUse = [...recentNotes, reading.notes].some(note => /party|heavy use|many swimmers|lots of swimmers/i.test(String(note || "")));
  const weatherStress = [...recentNotes, reading.notes].some(note => /storm|rain|heat|hot|sun/i.test(String(note || "")));
  const treatmentNames = recentTreatments.map(item => Object.keys(item || {}).filter(key => /_oz$|_lbs$/.test(key) && item[key]).join(" ")).join(" ");

  if (ph !== null && ph > POOL_RULE_CONFIG.targets.ph.high) {
    const amount = acidDoseOz(ph, ta, POOL_RULE_CONFIG.poolGallons);
    recs.push({
      id: "ph-high",
      priority: ph >= 8.2 ? "critical" : "high",
      category: "Chemical",
      action: `Add ${formatAmount(amount, "oz")} muriatic acid tonight.`,
      amount: formatAmount(amount, "oz muriatic acid"),
      timing: "Tonight with pump running",
      retest: "Retest pH tomorrow morning.",
      explanation: `pH ${ph} makes chlorine less effective and can irritate swimmers. Lowering toward 7.4 helps the chlorine you already have work better.`,
      confidence: amount ? "Medium" : "Low",
      safetyNote: POOL_RULE_CONFIG.safetyNote,
      color: COLORS.red,
    });
  } else if (ph !== null && ph < POOL_RULE_CONFIG.targets.ph.low) {
    recs.push({
      id: "ph-low",
      priority: "high",
      category: "Chemical",
      action: "Raise pH before swimming.",
      amount: "Use label dosing for pH increaser",
      timing: "Today",
      retest: "Retest pH after circulation.",
      explanation: `pH ${ph} is low enough to be uncomfortable and potentially corrosive.`,
      confidence: "Medium",
      safetyNote: POOL_RULE_CONFIG.safetyNote,
      color: COLORS.red,
    });
  }

  if (cc !== null && cc > POOL_RULE_CONFIG.targets.combinedChlorine.high) {
    recs.push({
      id: "cc-high",
      priority: "critical",
      category: "Chemical",
      action: "Raise chlorine and run the pump continuously.",
      amount: "Raise FC to breakpoint based on CYA",
      timing: "Tonight",
      retest: "Retest FC and CC tomorrow morning.",
      explanation: `CC ${cc} means used-up chlorine is building up. The pool needs oxidation before normal care resumes.`,
      confidence: "Medium",
      safetyNote: POOL_RULE_CONFIG.safetyNote,
      color: COLORS.red,
    });
  }

  if (fc !== null && fc < minimumFc) {
    const target = targetSwgPercent(reading);
    recs.push({
      id: "fc-low",
      priority: "high",
      category: "Equipment",
      action: `Increase SWG to ${target}%.`,
      amount: `${target}% SWG`,
      timing: "Today",
      retest: "Retest FC tomorrow.",
      explanation: `FC ${fc} is below the practical minimum of ${minimumFc} for current CYA. The pool may not keep up with sun and swimmer demand.`,
      confidence: "Medium",
      safetyNote: POOL_RULE_CONFIG.safetyNote,
      color: COLORS.amber,
    });
  } else if (fc !== null && fc > POOL_RULE_CONFIG.targets.freeChlorine.high) {
    recs.push({
      id: "fc-high",
      priority: "medium",
      category: "Equipment",
      action: `Lower SWG to ${Math.max(20, targetSwgPercent(reading) - 20)}%.`,
      amount: "SWG adjustment",
      timing: "Today",
      retest: "Retest FC in 48 hours.",
      explanation: `FC ${fc} is above the normal target range. Lower output so chlorine does not continue climbing.`,
      confidence: "Medium",
      safetyNote: "Do not swim when chlorine is above the safe range listed for your test kit and pool product guidance.",
      color: COLORS.amber,
    });
  } else if (swg !== null) {
    const target = targetSwgPercent(reading);
    if (Math.abs(target - swg) >= 15) {
      recs.push({
        id: "swg-adjust",
        priority: "medium",
        category: "Equipment",
        action: `${target > swg ? "Increase" : "Lower"} SWG to ${target}%.`,
        amount: `${target}% SWG`,
        timing: "Today",
        retest: "Retest FC in 48 hours.",
        explanation: "SWG output should match chlorine level, water temperature, and pump runtime.",
        confidence: "Medium",
        safetyNote: POOL_RULE_CONFIG.safetyNote,
        color: COLORS.amber,
      });
    }
  }

  if (salt !== null && salt < POOL_RULE_CONFIG.targets.salt.low) {
    const bags = saltDoseBags(salt, POOL_RULE_CONFIG.poolGallons);
    recs.push({
      id: "salt-low",
      priority: "medium",
      category: "Chemical",
      action: `Add ${bags} bag${bags === 1 ? "" : "s"} of pool salt.`,
      amount: `${bags} x 40 lb bags`,
      timing: "Today",
      retest: "Retest salt after full circulation.",
      explanation: `Salt ${salt} is below the generator's normal operating range, so chlorine production may be limited.`,
      confidence: "Medium",
      safetyNote: "Broadcast salt per bag directions and brush until dissolved before relying on the SWG reading.",
      color: COLORS.amber,
    });
  }

  if (cya !== null && cya < POOL_RULE_CONFIG.targets.cya.low) {
    const oz = stabilizerDoseOz(cya, POOL_RULE_CONFIG.poolGallons);
    recs.push({
      id: "cya-low",
      priority: "medium",
      category: "Chemical",
      action: `Add ${oz} oz stabilizer.`,
      amount: `${oz} oz cyanuric acid`,
      timing: "Today",
      retest: "Retest CYA in one week.",
      explanation: `CYA ${cya} is low for a salt pool, so sunlight can burn off chlorine quickly.`,
      confidence: "Medium",
      safetyNote: POOL_RULE_CONFIG.safetyNote,
      color: COLORS.amber,
    });
  }

  if (ta !== null && ta < POOL_RULE_CONFIG.targets.totalAlkalinity.low) {
    recs.push({
      id: "ta-low",
      priority: "medium",
      category: "Chemical",
      action: "Raise total alkalinity in small steps.",
      amount: "Use label dosing for baking soda",
      timing: "This week",
      retest: "Retest TA and pH after circulation.",
      explanation: `TA ${ta} can let pH swing too easily.`,
      confidence: "Medium",
      safetyNote: POOL_RULE_CONFIG.safetyNote,
      color: COLORS.amber,
    });
  }

  if (heavyUse || weatherStress) {
    recs.push({
      id: heavyUse ? "heavy-use" : "weather-stress",
      priority: "medium",
      category: "Operation",
      action: `Run pump ${POOL_RULE_CONFIG.targets.pumpHours.heavyUseExtra} additional hours.`,
      amount: `${POOL_RULE_CONFIG.targets.pumpHours.heavyUseExtra} pump hours`,
      timing: "Today",
      retest: "Retest FC tomorrow.",
      explanation: heavyUse ? "Heavy swimming adds chlorine demand and lowers circulation margin." : "Heat or storms can change chlorine demand and dilute water balance.",
      confidence: "Low",
      safetyNote: POOL_RULE_CONFIG.safetyNote,
      color: COLORS.blue,
    });
  } else if (pumpHours !== null && pumpHours < POOL_RULE_CONFIG.targets.pumpHours.minimum) {
    recs.push({
      id: "pump-runtime",
      priority: "medium",
      category: "Operation",
      action: "Run pump at least 8 hours.",
      amount: "8 hours total runtime",
      timing: "Today",
      retest: "Retest FC after 24 hours.",
      explanation: "Short pump runtime reduces SWG production and circulation.",
      confidence: "Medium",
      safetyNote: POOL_RULE_CONFIG.safetyNote,
      color: COLORS.blue,
    });
  }

  const dueSoon = schedule
    .map(item => ({ ...item, dueDays: item.last_completed && item.interval_days ? daysBetween(new Date(new Date(item.last_completed).getTime() + Number(item.interval_days) * 86400000).toISOString().slice(0, 10)) : null }))
    .filter(item => item.dueDays !== null && item.dueDays <= POOL_RULE_CONFIG.maintenance.filterCleaningWarningDays)
    .sort((a, b) => a.dueDays - b.dueDays)[0];
  if (dueSoon) {
    recs.push({
      id: `maintenance-${dueSoon.id}`,
      priority: dueSoon.dueDays < 0 ? "high" : "medium",
      category: "Maintenance",
      action: `${dueSoon.title} ${dueSoon.dueDays < 0 ? "is overdue" : `due in ${dueSoon.dueDays} days`}.`,
      amount: "",
      timing: dueSoon.dueDays <= 0 ? "Today" : "This week",
      retest: "Mark completed after the work is done.",
      explanation: "Equipment care prevents water problems and keeps recommendations trustworthy.",
      confidence: "High",
      safetyNote: "Turn off equipment before opening pumps, filters, or cleaners.",
      color: dueSoon.dueDays < 0 ? COLORS.red : COLORS.amber,
    });
  }

  if (!recs.length && !treatmentNames) {
    recs.push({
      id: "all-good",
      priority: "low",
      category: "Status",
      action: "No pool action needed today.",
      amount: "",
      timing: "Keep normal schedule",
      retest: waterTemp && waterTemp > POOL_RULE_CONFIG.targets.waterTemp.high ? "Retest FC tomorrow because water is hot." : "Retest on your normal cadence.",
      explanation: "Current tested values are inside the configured operating ranges.",
      confidence: "High",
      safetyNote: POOL_RULE_CONFIG.safetyNote,
      color: COLORS.green,
    });
  }

  return recs;
}

export function getChemRecommendations(last, readings = [], filterBaseline = null) {
  return getPoolRecommendations(last, { schedule: [], recentTreatments: [], recentNotes: readings.map(reading => reading.notes) })
    .map(item => ({
      priority: item.priority === "critical" ? "high" : item.priority === "medium" ? "med" : item.priority,
      param: item.category,
      action: item.action,
      detail: `${item.explanation} ${item.retest}`,
      color: item.color,
    }));
}
