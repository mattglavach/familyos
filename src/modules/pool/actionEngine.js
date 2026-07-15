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

const CHEMISTRY_BASIS = {
  stabilizerOzPer10PpmPer10k: 13,
  chlorineOzPer1PpmPer10k: 12.8,
  saltLbsPer1PpmPer10k: 0.0834,
  acidOzPerPointPhDropPer10k: 16,
  bakingSodaOzPer10PpmPer10k: 24,
  calciumOzPer10PpmPer10k: 20,
};

const DOSE_GUARDS = {
  stabilizerSingleStageOz: 64,
  stabilizerLargeOz: 128,
  liquidChlorineLargeOz: 192,
  saltLargeLbs: 160,
  muriaticAcidLargeOz: 32,
  bakingSodaLargeOz: 160,
  calciumLargeOz: 160,
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

function validPoolGallons(gallons = POOL_RULE_CONFIG.poolGallons) {
  const numeric = numberOrNull(gallons);
  return numeric && numeric >= 1000 && numeric <= 100000 ? numeric : null;
}

function roundDose(value, step = 1) {
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value / step) * step;
}

function poundsAndOunces(ounces) {
  if (!ounces) return "";
  const pounds = ounces / 16;
  return pounds >= 1 ? `${ounces} oz (${pounds.toFixed(1)} lb)` : `${ounces} oz`;
}

function calculationLines(entries) {
  return entries.filter(entry => entry.value !== null && entry.value !== undefined && entry.value !== "").map(entry => `${entry.label}: ${entry.value}`);
}

function addGuard(rec, warning) {
  if (!warning) return rec;
  return { ...rec, warnings: [...(rec.warnings || []), warning] };
}

function acidDose(ph, alkalinity, gallons) {
  const validGallons = validPoolGallons(gallons);
  if (!validGallons || ph === null || ph <= POOL_RULE_CONFIG.targets.ph.idealHigh) return null;
  const target = POOL_RULE_CONFIG.targets.ph.idealLow;
  const change = ph - target;
  const ta = alkalinity || 90;
  const alkalinityFactor = Math.max(0.7, Math.min(1.4, ta / 100));
  const raw = change * CHEMISTRY_BASIS.acidOzPerPointPhDropPer10k * alkalinityFactor * (validGallons / 10000);
  const rounded = roundDose(Math.max(4, raw), 1);
  return {
    current: ph,
    target,
    change,
    raw,
    rounded,
    unit: "oz muriatic acid",
    calculation: calculationLines([
      { label: "Pool volume", value: `${validGallons.toLocaleString()} gal` },
      { label: "Current pH", value: ph },
      { label: "Target pH", value: target },
      { label: "Desired pH drop", value: change.toFixed(2) },
      { label: "Basis", value: "Approx. 16 fl oz 31.45% muriatic acid per 1.0 pH drop per 10,000 gal, adjusted by TA" },
      { label: "TA factor", value: `${ta} ppm -> ${alkalinityFactor.toFixed(2)}x` },
      { label: "Raw calculated dose", value: `${raw.toFixed(1)} oz` },
      { label: "Rounded dose", value: `${rounded} oz` },
    ]),
  };
}

function stabilizerDose(cya, gallons) {
  const validGallons = validPoolGallons(gallons);
  if (!validGallons || cya === null) return null;
  if (cya < 0 || cya > 200) return { invalid: true, reason: "CYA reading is outside the supported 0-200 ppm range." };
  if (cya >= POOL_RULE_CONFIG.targets.cya.low) return null;
  const target = cya < 30 ? 30 : POOL_RULE_CONFIG.targets.cya.ideal;
  const change = target - cya;
  if (change <= 0) return null;
  const raw = (change / 10) * (validGallons / 10000) * CHEMISTRY_BASIS.stabilizerOzPer10PpmPer10k;
  const rounded = roundDose(raw, 1);
  const stageOz = Math.min(rounded, DOSE_GUARDS.stabilizerSingleStageOz);
  const staged = rounded > DOSE_GUARDS.stabilizerSingleStageOz;
  return {
    current: cya,
    target,
    change,
    raw,
    rounded,
    stageOz,
    staged,
    unit: "oz cyanuric acid",
    calculation: calculationLines([
      { label: "Pool volume", value: `${validGallons.toLocaleString()} gal` },
      { label: "Current CYA", value: `${cya} ppm` },
      { label: "Target CYA", value: `${target} ppm` },
      { label: "Desired increase", value: `${change} ppm` },
      { label: "Basis", value: "Pure cyanuric acid: 13 oz by weight raises CYA 10 ppm in 10,000 gal" },
      { label: "Raw calculated dose", value: `${raw.toFixed(1)} oz (${(raw / 16).toFixed(1)} lb)` },
      { label: "Rounded total dose", value: poundsAndOunces(rounded) },
      { label: "Staging", value: staged ? `Add ${poundsAndOunces(stageOz)} now, circulate, then retest before adding more` : "Single addition is within the staged-dose guardrail" },
    ]),
  };
}

function saltDose(salt, gallons) {
  const validGallons = validPoolGallons(gallons);
  if (!validGallons || salt === null || salt >= POOL_RULE_CONFIG.targets.salt.low) return null;
  const target = POOL_RULE_CONFIG.targets.salt.ideal;
  const change = target - salt;
  if (change <= 0) return null;
  const raw = change * (validGallons / 10000) * CHEMISTRY_BASIS.saltLbsPer1PpmPer10k;
  const pounds = Math.max(1, roundDose(raw, 1));
  const bags = Math.max(1, Math.ceil(pounds / 40));
  return {
    current: salt,
    target,
    change,
    raw,
    rounded: pounds,
    bags,
    unit: "lb salt",
    calculation: calculationLines([
      { label: "Pool volume", value: `${validGallons.toLocaleString()} gal` },
      { label: "Current salt", value: `${salt} ppm` },
      { label: "Target salt", value: `${target} ppm` },
      { label: "Desired increase", value: `${change} ppm` },
      { label: "Basis", value: "0.0834 lb salt raises salt 1 ppm in 10,000 gal" },
      { label: "Raw calculated dose", value: `${raw.toFixed(1)} lb` },
      { label: "Rounded dose", value: `${pounds} lb (${bags} x 40 lb bags)` },
    ]),
  };
}

function liquidChlorineDose(fc, cya, gallons) {
  const validGallons = validPoolGallons(gallons);
  const minimumFc = Math.max(POOL_RULE_CONFIG.targets.freeChlorine.defaultMinimum, Math.round((cya || POOL_RULE_CONFIG.targets.cya.ideal) * POOL_RULE_CONFIG.targets.freeChlorine.minCyaRatio));
  if (!validGallons || fc === null || fc >= minimumFc) return { minimumFc };
  const target = minimumFc + 2;
  const change = target - fc;
  if (change <= 0) return { minimumFc };
  const raw = change * (validGallons / 10000) * CHEMISTRY_BASIS.chlorineOzPer1PpmPer10k;
  const rounded = roundDose(raw, 1);
  return {
    minimumFc,
    current: fc,
    target,
    change,
    raw,
    rounded,
    unit: "oz 10% liquid chlorine",
    calculation: calculationLines([
      { label: "Pool volume", value: `${validGallons.toLocaleString()} gal` },
      { label: "Current FC", value: `${fc} ppm` },
      { label: "Minimum FC", value: `${minimumFc} ppm` },
      { label: "Target FC", value: `${target} ppm` },
      { label: "Desired increase", value: `${change} ppm` },
      { label: "Basis", value: "10% liquid chlorine: 12.8 fl oz raises FC 1 ppm in 10,000 gal" },
      { label: "Raw calculated dose", value: `${raw.toFixed(1)} oz` },
      { label: "Rounded dose", value: `${rounded} oz` },
    ]),
  };
}

function bakingSodaDose(ta, gallons) {
  const validGallons = validPoolGallons(gallons);
  if (!validGallons || ta === null || ta >= POOL_RULE_CONFIG.targets.totalAlkalinity.low) return null;
  const target = POOL_RULE_CONFIG.targets.totalAlkalinity.ideal;
  const change = target - ta;
  if (change <= 0) return null;
  const raw = (change / 10) * (validGallons / 10000) * CHEMISTRY_BASIS.bakingSodaOzPer10PpmPer10k;
  const rounded = roundDose(raw, 1);
  return {
    current: ta,
    target,
    change,
    raw,
    rounded,
    unit: "oz baking soda",
    calculation: calculationLines([
      { label: "Pool volume", value: `${validGallons.toLocaleString()} gal` },
      { label: "Current TA", value: `${ta} ppm` },
      { label: "Target TA", value: `${target} ppm` },
      { label: "Desired increase", value: `${change} ppm` },
      { label: "Basis", value: "Approx. 24 oz baking soda raises TA 10 ppm in 10,000 gal" },
      { label: "Raw calculated dose", value: `${raw.toFixed(1)} oz (${(raw / 16).toFixed(1)} lb)` },
      { label: "Rounded dose", value: poundsAndOunces(rounded) },
    ]),
  };
}

function calciumDose(calcium, gallons) {
  const validGallons = validPoolGallons(gallons);
  const targetLow = 150;
  const target = 200;
  if (!validGallons || calcium === null || calcium >= targetLow) return null;
  const change = target - calcium;
  if (change <= 0) return null;
  const raw = (change / 10) * (validGallons / 10000) * CHEMISTRY_BASIS.calciumOzPer10PpmPer10k;
  const rounded = roundDose(raw, 1);
  return {
    current: calcium,
    target,
    change,
    raw,
    rounded,
    unit: "oz calcium hardness increaser",
    calculation: calculationLines([
      { label: "Pool volume", value: `${validGallons.toLocaleString()} gal` },
      { label: "Current calcium hardness", value: `${calcium} ppm` },
      { label: "Target calcium hardness", value: `${target} ppm` },
      { label: "Desired increase", value: `${change} ppm` },
      { label: "Basis", value: "Approx. 20 oz calcium chloride raises CH 10 ppm in 10,000 gal; confirm product label" },
      { label: "Raw calculated dose", value: `${raw.toFixed(1)} oz (${(raw / 16).toFixed(1)} lb)` },
      { label: "Rounded dose", value: poundsAndOunces(rounded) },
    ]),
  };
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
  if (attention) return { status: "Attention", color: COLORS.amber, summary: "" };
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
  const calcium = numberOrNull(reading.calcium_hardness);
  const waterTemp = numberOrNull(reading.water_temp);
  const pumpHours = numberOrNull(reading.pump_hours);
  const swg = numberOrNull(reading.swg_setting);
  const poolGallons = validPoolGallons(POOL_RULE_CONFIG.poolGallons);
  const chlorineDose = liquidChlorineDose(fc, cya, poolGallons);
  const minimumFc = chlorineDose.minimumFc;
  const heavyUse = [...recentNotes, reading.notes].some(note => /party|heavy use|many swimmers|lots of swimmers/i.test(String(note || "")));
  const weatherStress = [...recentNotes, reading.notes].some(note => /storm|rain|heat|hot|sun/i.test(String(note || "")));
  const treatmentNames = recentTreatments.map(item => Object.keys(item || {}).filter(key => /_oz$|_lbs$/.test(key) && item[key]).join(" ")).join(" ");

  if (!poolGallons) {
    recs.push({
      id: "pool-volume-missing",
      priority: "critical",
      category: "Setup",
      action: "Confirm pool volume before adding chemicals.",
      amount: "",
      timing: "Before chemical dosing",
      retest: "Log a new test after the volume is corrected.",
      explanation: "Chemical doses scale directly with pool volume. Recommendations are paused because the configured volume is missing or outside a reasonable range.",
      confidence: "High",
      safetyNote: "Do not add calculated doses until pool volume is verified.",
      color: COLORS.red,
      warnings: ["Pool volume is required for safe dose calculations."],
      calculation: ["Pool volume: missing or invalid", "Guardrail: chemical recommendations are blocked until volume is verified."],
    });
    return recs;
  }

  if (ph !== null && ph > POOL_RULE_CONFIG.targets.ph.high) {
    const dose = acidDose(ph, ta, poolGallons);
    let rec = {
      id: "ph-high",
      priority: ph >= 8.2 ? "critical" : "high",
      category: "Chemical",
      action: `Add ${formatAmount(dose?.rounded, "oz")} muriatic acid.`,
      amount: formatAmount(dose?.rounded, "oz muriatic acid"),
      timing: "Tonight with pump running",
      retest: "Run pump at least 30 minutes, then retest pH after circulation.",
      explanation: `pH ${ph} makes chlorine less effective and can irritate swimmers. Lowering toward 7.4 helps the chlorine you already have work better.`,
      confidence: dose?.rounded ? "Medium" : "Low",
      safetyNote: POOL_RULE_CONFIG.safetyNote,
      color: COLORS.red,
      calculation: dose?.calculation || [],
      expectedOutcome: "pH should move closer to the 7.4-7.6 operating range.",
      howToAdd: "Pour acid slowly in front of a return with the pump running. Keep acid away from chlorine products.",
    };
    if (dose?.rounded > DOSE_GUARDS.muriaticAcidLargeOz) rec = addGuard(rec, "Large acid dose. Add half, circulate, retest pH, then decide whether more is needed.");
    recs.push(rec);
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

  const combinedChlorineHigh = cc !== null && cc > POOL_RULE_CONFIG.targets.combinedChlorine.high;
  if (combinedChlorineHigh) {
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
      warnings: ["Resolve combined chlorine before following normal FC maintenance dosing."],
      calculation: calculationLines([
        { label: "Current CC", value: `${cc} ppm` },
        { label: "High threshold", value: `${POOL_RULE_CONFIG.targets.combinedChlorine.high} ppm` },
        { label: "Guardrail", value: "Suppress normal FC-low dose to avoid duplicate chlorine recommendations" },
      ]),
    });
  }

  if (!combinedChlorineHigh && fc !== null && fc < minimumFc) {
    const target = targetSwgPercent(reading);
    const chlorineAction = chlorineDose?.rounded ? `Add ${chlorineDose.rounded} oz 10% liquid chlorine and increase SWG to ${target}%.` : `Increase SWG to ${target}%.`;
    let rec = {
      id: "fc-low",
      priority: "high",
      category: "Chemical",
      action: chlorineAction,
      amount: chlorineDose?.rounded ? `${chlorineDose.rounded} oz 10% liquid chlorine + ${target}% SWG` : `${target}% SWG`,
      timing: "Today with pump running",
      retest: "Retest FC tomorrow.",
      explanation: `FC ${fc} is below the practical minimum of ${minimumFc} for current CYA. Liquid chlorine corrects the immediate gap; the SWG setting helps maintain it.`,
      confidence: chlorineDose?.rounded ? "Medium" : "Low",
      safetyNote: POOL_RULE_CONFIG.safetyNote,
      color: COLORS.amber,
      calculation: chlorineDose?.calculation || [],
      expectedOutcome: `FC should rise toward ${chlorineDose?.target || minimumFc} ppm and hold better over the next day.`,
      howToAdd: "Pour liquid chlorine slowly in front of a return with the pump running. Brush any concentrated area.",
    };
    if (chlorineDose?.rounded > DOSE_GUARDS.liquidChlorineLargeOz) rec = addGuard(rec, "Large chlorine addition. Confirm FC and CYA before adding the full amount.");
    recs.push(rec);
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
      expectedOutcome: "FC should drift down as sunlight and normal demand use chlorine.",
      howToAdd: "No chemical addition is recommended for high FC.",
      calculation: calculationLines([
        { label: "Current FC", value: `${fc} ppm` },
        { label: "High threshold", value: `${POOL_RULE_CONFIG.targets.freeChlorine.high} ppm` },
        { label: "Guardrail", value: "Do not add chemicals to lower FC; reduce production and retest" },
      ]),
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
        expectedOutcome: "FC should hold steadier after the SWG output matches demand.",
        howToAdd: "Adjust the salt cell output only after confirming pump runtime.",
        calculation: calculationLines([
          { label: "Current SWG", value: `${swg}%` },
          { label: "Recommended SWG", value: `${target}%` },
          { label: "Basis", value: "Output target uses FC, CYA, water temperature, and pump runtime" },
        ]),
      });
    }
  }

  if (salt !== null && salt < POOL_RULE_CONFIG.targets.salt.low) {
    const dose = saltDose(salt, poolGallons);
    let rec = {
      id: "salt-low",
      priority: "medium",
      category: "Chemical",
      action: `Add ${dose.bags} bag${dose.bags === 1 ? "" : "s"} of pool salt.`,
      amount: `${dose.rounded} lb salt (${dose.bags} x 40 lb bags)`,
      timing: "Today",
      retest: "Retest salt after full circulation.",
      explanation: `Salt ${salt} is below the generator's normal operating range, so chlorine production may be limited.`,
      confidence: "Medium",
      safetyNote: "Broadcast salt per bag directions and brush until dissolved before relying on the SWG reading.",
      color: COLORS.amber,
      calculation: dose.calculation,
      expectedOutcome: `Salt should move toward ${dose.target} ppm after full circulation.`,
      howToAdd: "Broadcast across the shallow end, brush to dissolve, and keep the pump running.",
    };
    if (dose.rounded > DOSE_GUARDS.saltLargeLbs) rec = addGuard(rec, "Large salt addition. Confirm pool volume and salt test before adding all bags.");
    recs.push(rec);
  }

  if (cya !== null && cya < POOL_RULE_CONFIG.targets.cya.low) {
    const dose = stabilizerDose(cya, poolGallons);
    if (dose?.invalid) {
      recs.push({
        id: "cya-invalid",
        priority: "high",
        category: "Reading",
        action: "Retest CYA before adding stabilizer.",
        amount: "",
        timing: "Before adding stabilizer",
        retest: "Repeat CYA with a reliable test.",
        explanation: dose.reason,
        confidence: "High",
        safetyNote: "Do not add stabilizer from an invalid CYA reading.",
        color: COLORS.red,
        warnings: [dose.reason],
      });
    } else if (dose?.rounded) {
      let rec = {
        id: "cya-low",
        priority: dose.rounded > DOSE_GUARDS.stabilizerLargeOz ? "high" : "medium",
        category: "Chemical",
        action: dose.staged ? `Add ${poundsAndOunces(dose.stageOz)} stabilizer now; retest before adding more.` : `Add ${poundsAndOunces(dose.rounded)} stabilizer.`,
        amount: dose.staged ? `${poundsAndOunces(dose.stageOz)} now of ${poundsAndOunces(dose.rounded)} calculated total` : `${poundsAndOunces(dose.rounded)} cyanuric acid`,
        timing: "Today with pump running",
        retest: "Retest CYA in one week before adding more stabilizer.",
        explanation: `CYA ${cya} is low for a salt pool, so sunlight can burn off chlorine quickly. This calculation assumes pure cyanuric acid by weight.`,
        confidence: "Medium",
        safetyNote: "Do not add more stabilizer until CYA is retested. CYA can take several days to fully register.",
        color: dose.rounded > DOSE_GUARDS.stabilizerLargeOz ? COLORS.red : COLORS.amber,
        warnings: [],
        calculation: dose.calculation,
        expectedOutcome: `CYA should move toward ${dose.target} ppm after the product dissolves and circulates.`,
        howToAdd: "Use the sock/skimmer method recommended by the product label. Do not broadcast undissolved stabilizer onto a vinyl liner.",
      };
      if (dose.rounded > DOSE_GUARDS.stabilizerLargeOz) rec = addGuard(rec, "Unusually large stabilizer calculation. Confirm pool volume and CYA result before dosing.");
      if (dose.staged) rec = addGuard(rec, "Staged addition required. Add only the first stage, circulate, and retest before adding the remainder.");
      recs.push(rec);
    }
  } else if (cya !== null && cya >= POOL_RULE_CONFIG.targets.cya.high) {
    recs.push({
      id: "cya-high",
      priority: "medium",
      category: "Reading",
      action: "Do not add stabilizer.",
      amount: "",
      timing: "Now",
      retest: "Retest CYA before the next stabilizer decision.",
      explanation: `CYA ${cya} is already at or above the upper target. Stabilizer cannot practically lower CYA.`,
      confidence: "High",
      safetyNote: "Avoid stabilized chlorine products until CYA is back in range.",
      color: COLORS.amber,
      calculation: calculationLines([
        { label: "Current CYA", value: `${cya} ppm` },
        { label: "High threshold", value: `${POOL_RULE_CONFIG.targets.cya.high} ppm` },
        { label: "Guardrail", value: "No stabilizer recommendation when current CYA is at or above target" },
      ]),
    });
  }

  if (ta !== null && ta < POOL_RULE_CONFIG.targets.totalAlkalinity.low) {
    const dose = bakingSodaDose(ta, poolGallons);
    let rec = {
      id: "ta-low",
      priority: "medium",
      category: "Chemical",
      action: `Add ${poundsAndOunces(dose.rounded)} baking soda.`,
      amount: `${poundsAndOunces(dose.rounded)} baking soda`,
      timing: "This week",
      retest: "Retest TA and pH after circulation.",
      explanation: `TA ${ta} can let pH swing too easily. Raise alkalinity in controlled steps.`,
      confidence: "Medium",
      safetyNote: POOL_RULE_CONFIG.safetyNote,
      color: COLORS.amber,
      calculation: dose.calculation,
      expectedOutcome: `TA should move toward ${dose.target} ppm without overshooting pH.`,
      howToAdd: "Broadcast across the pool surface with the pump running. Brush any settled product.",
    };
    if (dose.rounded > DOSE_GUARDS.bakingSodaLargeOz) rec = addGuard(rec, "Large alkalinity dose. Split into multiple additions and retest between them.");
    recs.push(rec);
  } else if (ta !== null && ta > POOL_RULE_CONFIG.targets.totalAlkalinity.high) {
    recs.push({
      id: "ta-high",
      priority: "low",
      category: "Reading",
      action: "Do not add alkalinity increaser.",
      amount: "",
      timing: "Monitor",
      retest: "Retest TA with the next full chemistry check.",
      explanation: `TA ${ta} is above target. Lowering TA is not a simple chemical-addition recommendation.`,
      confidence: "High",
      safetyNote: "Avoid adding baking soda or alkalinity increaser while TA is high.",
      color: COLORS.blue,
      calculation: calculationLines([
        { label: "Current TA", value: `${ta} ppm` },
        { label: "High threshold", value: `${POOL_RULE_CONFIG.targets.totalAlkalinity.high} ppm` },
        { label: "Guardrail", value: "No chemical-addition dose is generated for high TA" },
      ]),
    });
  }

  if (calcium !== null) {
    const dose = calciumDose(calcium, poolGallons);
    if (dose?.rounded) {
      let rec = {
        id: "calcium-low",
        priority: "low",
        category: "Chemical",
        action: `Add ${poundsAndOunces(dose.rounded)} calcium hardness increaser.`,
        amount: `${poundsAndOunces(dose.rounded)} calcium hardness increaser`,
        timing: "This week",
        retest: "Retest calcium hardness after full circulation.",
        explanation: `Calcium hardness ${calcium} is low. Vinyl pools are more forgiving than plaster, so confirm your target before dosing.`,
        confidence: "Low",
        safetyNote: "Confirm the product label and pool surface target before adding calcium hardness increaser.",
        color: COLORS.blue,
        calculation: dose.calculation,
        expectedOutcome: `Calcium hardness should move toward ${dose.target} ppm.`,
        howToAdd: "Pre-dissolve or add per product label with pump running.",
      };
      if (dose.rounded > DOSE_GUARDS.calciumLargeOz) rec = addGuard(rec, "Large calcium dose. Confirm pool surface type, volume, and test result before adding.");
      recs.push(rec);
    }
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
