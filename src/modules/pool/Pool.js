import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, ClipboardList, Droplets, FlaskConical, HelpCircle, History, Pencil, Settings2, ThermometerSun, Trash2, Wrench } from "lucide-react";
import { EmptyState, Loading, Modal, SwipeCard, SwipeHint } from "../../components/common";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ExpandableSection } from "../../components/ui/expandable-section";
import { DateTimeField, FormGroup, FormRow, FormSection, NotesField, NumberField, SaveCancelFooter, ToggleField, ValidationSummary } from "../../components/ui/form";
import { ChipGroup, SegmentedControl } from "../../components/ui/segmented-control";
import { roleCanManage } from "../../hooks/useHouseholdCollaboration";
import { useHousehold } from "../../context/HouseholdContext";
import { TODAY_STR, daysAgo, daysBetween, formatDate, nextDueDate } from "../../lib/dates";
import { formatUserFacingError } from "../../lib/userFacingErrors";
import { supabase } from "../../lib/supabase";
import { treatmentPrefill } from "./poolWorkflow";
import { useTable } from "../../hooks/useTable";
import { maintColor, maintStatus, statusColor } from "../../utils/status";
import { COLORS, S } from "../../theme";
import { getChemRecommendations, getPoolHealth, getPoolRecommendations, POOL_RULE_CONFIG } from "./actionEngine";
import { buildPoolReadingRow, hasRainContext, POOL_TEST_ADVANCED_FIELDS, POOL_TEST_CONTEXTS, POOL_TEST_FIELD_LABELS, POOL_TEST_PRIMARY_FIELDS, poolTestFieldError, setRainContext, validatePoolTestForm } from "./poolTestForm";

export { getChemRecommendations };

export function poolStatus(param, value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "grey";
  const ranges = {
    ph: { low: 7.2, goodHigh: 7.6, high: 7.8 },
    free_chlorine: { low: 3, goodHigh: 7, high: 8 },
    cc: { low: 0, goodHigh: 0.2, high: 0.5 },
    salt: { low: 3200, goodHigh: 3600, high: 3800 },
    cya: { low: 60, goodHigh: 80, high: 90 },
    alkalinity: { low: 80, goodHigh: 120, high: 140 },
    calcium_hardness: { low: 150, goodHigh: 300, high: 400 },
  };
  const range = ranges[param];
  if (!range) return "green";
  if (Number(value) < range.low || Number(value) > range.high) return "red";
  if (Number(value) <= range.goodHigh) return "green";
  return "amber";
}

const TEST_SOURCES = ["Taylor Kit", "Pool Store", "Manual"];
const HISTORY_FILTERS = ["All", "Chemical", "Reading", "Maintenance", "Note"];
const EQUIPMENT_TYPES = ["Pump", "Salt Cell (SWG)", "Filter", "Heater", "Robot Cleaner", "Betta Skimmer", "Solar Cover", "Test Kit"];
const HELP_COPY = [
  ["FC", "Free chlorine is the active sanitizer. Keep it high enough for current CYA before swimming."],
  ["CC", "Combined chlorine points to used-up sanitizer. High CC means oxidize and retest before normal care."],
  ["pH", "pH affects comfort and chlorine strength. Correct it in controlled steps before fine-tuning other chemistry."],
  ["TA", "Total alkalinity buffers pH. Low TA causes swings; high TA can make pH drift up."],
  ["CYA", "Stabilizer protects chlorine from sun. Add slowly because CYA is hard to lower."],
  ["Salt", "Salt feeds the chlorine generator. Low salt limits production; high salt can stress equipment."],
  ["CH", "Calcium hardness protects some surfaces. Confirm pool surface and product label before dosing."],
];
const MAINTENANCE_PRESETS = [
  ["Filter Cleaning", 30],
  ["SWG Cleaning", 90],
  ["Pump Inspection", 60],
  ["Robot Maintenance", 30],
  ["Betta Cleaning", 14],
  ["Reagent Replacement", 180],
  ["Season Opening", 365],
  ["Season Closing", 365],
];

function num(value) {
  return value === undefined || value === null || value === "" ? null : Number(value);
}

function dateTime(date, time) {
  return new Date(`${date || TODAY_STR}T${time || new Date().toTimeString().slice(0, 5)}:00`).toISOString();
}

function latestReadingValues(readings) {
  const latest = readings[0];
  if (!latest) return null;
  const findLatest = key => {
    const row = readings.find(reading => reading[key] !== null && reading[key] !== undefined);
    return row ? row[key] : null;
  };
  return {
    ...latest,
    ph: findLatest("ph"),
    free_chlorine: findLatest("free_chlorine"),
    cc: findLatest("cc"),
    salt: findLatest("salt"),
    cya: findLatest("cya"),
    alkalinity: findLatest("alkalinity"),
    water_temp: findLatest("water_temp"),
    swg_setting: findLatest("swg_setting"),
    pump_hours: findLatest("pump_hours"),
  };
}

function trend(readings, key) {
  const values = readings.filter(reading => reading[key] !== null && reading[key] !== undefined).slice(0, 2);
  if (values.length < 2) return { label: "No trend", color: COLORS.slate };
  const current = Number(values[0][key]);
  const prior = Number(values[1][key]);
  if (!Number.isFinite(current) || !Number.isFinite(prior)) return { label: "No trend", color: COLORS.slate };
  const delta = current - prior;
  if (Math.abs(delta) < 0.1) return { label: "Steady", color: COLORS.green };
  return { label: `${delta > 0 ? "Up" : "Down"} ${Math.abs(delta).toFixed(key === "ph" ? 1 : 0)}`, color: delta > 0 ? COLORS.amber : COLORS.blue };
}

function trendDetail(readings, key, suffix = "") {
  const values = readings.filter(reading => reading[key] !== null && reading[key] !== undefined).slice(0, 5).reverse();
  const current = values.length ? values[values.length - 1]?.[key] : null;
  const points = values.map(reading => Number(reading[key])).filter(Number.isFinite);
  const max = points.length ? Math.max(...points) : 1;
  const min = points.length ? Math.min(...points) : 0;
  return {
    ...trend(readings, key),
    current: current ?? "--",
    suffix,
    bars: points.map(value => ({ value, pct: max === min ? 55 : 24 + ((value - min) / (max - min)) * 66 })),
  };
}

function retestGuidance(latest, recommendations) {
  if (!latest) return { label: "Due now", detail: "Log a full test before any treatment plan.", color: COLORS.amber };
  const age = daysAgo(latest.date);
  const urgent = recommendations.some(rec => ["critical", "high"].includes(rec.priority));
  const chemical = recommendations.some(rec => rec.category === "Chemical" && rec.priority !== "low");
  if (urgent || chemical) return { label: "After treatment", detail: recommendations.find(rec => rec.priority !== "low")?.retest || "Retest after circulation.", color: COLORS.amber };
  if (age >= 3) return { label: "Due today", detail: `Last full test was ${age} days ago.`, color: COLORS.amber };
  return { label: "On cadence", detail: "Retest within 2-3 days, sooner after heat, rain, or heavy swimming.", color: COLORS.green };
}

function chemistrySummary(latest) {
  if (!latest) return [];
  return [
    ["FC", latest.free_chlorine, "ppm", "free_chlorine"],
    ["CC", latest.cc, "ppm", "cc"],
    ["pH", latest.ph, "", "ph"],
    ["TA", latest.alkalinity, "ppm", "alkalinity"],
    ["CYA", latest.cya, "ppm", "cya"],
    ["Salt", latest.salt, "ppm", "salt"],
    ["CH", latest.calcium_hardness, "ppm", "calcium_hardness"],
  ];
}

function actionGroup(rec) {
  if (rec.id === "all-good") return "Monitor";
  if (/retest/i.test(`${rec.action} ${rec.timing}`) || rec.category === "Reading") return "Retest";
  if (rec.priority === "critical" || rec.priority === "high" || /today|tonight|now/i.test(rec.timing || "")) return "Do Today";
  if (/week/i.test(rec.timing || "")) return "This Week";
  return "Monitor";
}

function buildActionPlan(recommendations) {
  const groups = { "Do Today": [], Retest: [], "This Week": [], Monitor: [] };
  recommendations.forEach(rec => groups[actionGroup(rec)].push(rec));
  return groups;
}

function totalChemicalText(recs) {
  const chemicals = recs.filter(rec => rec.category === "Chemical" && rec.amount);
  if (!chemicals.length) return "No chemical additions in this plan.";
  return chemicals.map(rec => rec.amount).join(" + ");
}

function expectedChemistry(latest, recs) {
  if (!latest) return "A current test is required before estimating treatment outcome.";
  const expected = recs.map(rec => rec.expectedOutcome).filter(Boolean);
  if (expected.length) return expected.join(" ");
  return "Expect readings to move toward the configured operating range after circulation and retesting.";
}

function stagedAdditions(recs) {
  const staged = recs.flatMap(rec => rec.warnings || []).filter(note => /stage|half|split|large/i.test(note));
  if (staged.length) return staged;
  return ["Add only one treatment at a time when products interact, circulate, then retest before adding more."];
}

function latestChemicalText(treatment) {
  if (!treatment) return "No recent chemical additions logged.";
  return [
    treatment.muriatic_acid_oz && `${treatment.muriatic_acid_oz} oz acid`,
    treatment.salt_lbs && `${treatment.salt_lbs} lb salt`,
    treatment.cya_oz && `${treatment.cya_oz} oz CYA`,
    treatment.liquid_chlorine_oz && `${treatment.liquid_chlorine_oz} oz chlorine`,
    treatment.swg_pct_after && `SWG to ${treatment.swg_pct_after}%`,
  ].filter(Boolean).join(", ") || treatment.notes || "Treatment logged";
}

function maintenanceGuidance(latest, dueMaintenance, equipment) {
  const guidance = [];
  const pumpHours = num(latest?.pump_hours);
  const temp = num(latest?.water_temp);
  if (pumpHours !== null && pumpHours < POOL_RULE_CONFIG.targets.pumpHours.minimum) {
    guidance.push({ title: "Pump runtime", detail: "Run at least 8 hours today so circulation and SWG output can catch up.", color: COLORS.amber });
  } else {
    guidance.push({ title: "Pump runtime", detail: temp && temp >= 88 ? "Hot water increases chlorine demand. Consider extra runtime today." : "Keep normal runtime unless FC starts drifting.", color: temp && temp >= 88 ? COLORS.amber : COLORS.green });
  }
  const due = dueMaintenance.find(item => item.status === "overdue" || item.status === "due-soon");
  if (due) guidance.push({ title: due.title, detail: due.status === "overdue" ? "Maintenance is overdue. Complete it before chasing chemistry changes." : "Maintenance is due soon. Plan it this week.", color: maintColor(due.status) });
  if (equipment.some(item => /salt cell|swg/i.test(item.type || item.name || ""))) guidance.push({ title: "Salt cell", detail: "Inspect for scale when chlorine output or flow seems off.", color: COLORS.blue });
  if (equipment.some(item => /robot|skimmer|betta/i.test(item.type || item.name || ""))) guidance.push({ title: "Cleaner checks", detail: "Empty robot/skimmer baskets after storms or heavy debris days.", color: COLORS.blue });
  return guidance.slice(0, 4);
}

function contextGuidance(latest, readings) {
  const notes = readings.slice(0, 5).map(item => `${item.notes || ""} ${item.recent_weather_notes || ""}`).join(" ");
  const temp = num(latest?.water_temp);
  return [
    temp && temp >= POOL_RULE_CONFIG.targets.waterTemp.high ? "Summer heat: retest FC tomorrow and consider extra pump runtime." : "Summer mode: retest more often during hot, sunny stretches.",
    /rain|storm/i.test(notes) ? "Heavy rain: check water level, baskets, pH, and FC after circulation." : "Heavy rain: log a note after storms so recommendations can account for dilution and debris.",
    /party|heavy/i.test(notes) ? "Heavy swimmer load: run pump longer and retest FC the next morning." : "Pool party: test before guests, raise FC within safe range, and retest after.",
    "Vacation mode: before travel, test fully, clean baskets/filter, verify SWG and pump schedule, and ask someone to check water level.",
  ];
}

function historyDetail(item, nextReading) {
  if (item.kind === "Reading") return `Source: ${item.test_source || "Manual"}${item.water_temp ? ` | Temp ${item.water_temp} F` : ""}${item.recent_heavy_usage ? " | Heavy use" : ""}`;
  if (item.kind === "Chemical" && nextReading) return `Next test: FC ${nextReading.free_chlorine ?? "--"} / pH ${nextReading.ph ?? "--"} on ${formatDate(nextReading.date)}`;
  if (item.water_clarity) return `Water clarity: ${item.water_clarity}`;
  return "";
}

function isMajorHistoryItem(item) {
  if (item.kind === "Chemical") return Boolean(item.muriatic_acid_oz || item.salt_lbs || item.cya_oz || item.liquid_chlorine_oz);
  if (item.kind === "Reading") return ["free_chlorine", "ph", "cc", "salt", "cya"].some(key => poolStatus(key, item[key]) === "red");
  return /filter|swg|storm|party|green|cloud/i.test(`${item.type || ""} ${item.notes || ""} ${item.water_clarity || ""}`);
}

function recommendationCard(rec, onReview, editable) {
  const Icon = rec.priority === "critical" || rec.priority === "high" ? AlertTriangle : CheckCircle2;
  return (
    <div key={rec.id} style={{ ...S.statusCard(rec.color), marginBottom: 10 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Icon size={20} color={rec.color} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.white, lineHeight: 1.35 }}>{rec.action}</div>
          {rec.amount && <div style={{ fontSize: 13, color: rec.color, fontWeight: 800, marginTop: 4 }}>{rec.amount}</div>}
          <div style={{ fontSize: 13, color: COLORS.slateLight, lineHeight: 1.5, marginTop: 6 }}>{rec.explanation}</div>
          {Boolean(rec.warnings?.length) && (
            <div style={{ border: `1px solid ${COLORS.amber}`, borderRadius: 8, padding: 8, marginTop: 8, color: COLORS.amber, fontSize: 12, lineHeight: 1.45 }}>
              {rec.warnings.map(warning => <div key={warning}>{warning}</div>)}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
            <div style={{ fontSize: 12, color: COLORS.slate }}><b style={{ color: COLORS.white }}>When:</b> {rec.timing}</div>
            <div style={{ fontSize: 12, color: COLORS.slate }}><b style={{ color: COLORS.white }}>Retest:</b> {rec.retest}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6, marginTop: 8 }}>
            {rec.howToAdd && <div style={{ fontSize: 12, color: COLORS.slate, lineHeight: 1.45 }}><b style={{ color: COLORS.white }}>How:</b> {rec.howToAdd}</div>}
            {rec.expectedOutcome && <div style={{ fontSize: 12, color: COLORS.slate, lineHeight: 1.45 }}><b style={{ color: COLORS.white }}>Expected:</b> {rec.expectedOutcome}</div>}
          </div>
          <div style={{ fontSize: 12, color: COLORS.slate, lineHeight: 1.45, marginTop: 8 }}>{rec.safetyNote}</div>
          {Boolean(rec.calculation?.length) && (
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: "pointer", color: COLORS.blue, fontSize: 12, fontWeight: 800 }}>Show calculation</summary>
              <div style={{ display: "grid", gap: 5, marginTop: 8 }}>
                {rec.calculation.map(line => <div key={line} style={{ fontSize: 12, color: COLORS.slate, lineHeight: 1.45 }}>{line}</div>)}
              </div>
            </details>
          )}
        </div>
      </div>
      {editable && rec.priority !== "low" && (
        <Button type="button" className="mt-3 w-full" onClick={() => onReview(rec)}>Review Plan</Button>
      )}
    </div>
  );
}

export function Pool({ initialView }) {
  const readings = useTable("pool_readings", "logged_at");
  const treatments = useTable("pool_treatments", "logged_at");
  const maintenance = useTable("pool_maintenance", "date");
  const schedule = useTable("pool_schedule", "title", true);
  const maintenanceHistory = useTable("pool_maintenance_history", "completed_at");
  const equipment = useTable("pool_equipment", "type", true);
  const audits = useTable("pool_action_audits", "created_at");
  const profiles = useTable("pool_profiles", "name", true);
  const household = useHousehold();
  const editable = roleCanManage(household.membership?.role);
  const [tab, setTab] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [activeSwipe, setActiveSwipe] = useState(null);
  const [historyFilter, setHistoryFilter] = useState("All");
  const [sourceMode, setSourceMode] = useState("Taylor Kit");
  const [showAdvancedTest, setShowAdvancedTest] = useState(false);
  const [testSaveError, setTestSaveError] = useState("");
  const [testInvalidFields, setTestInvalidFields] = useState([]);
  const [testSubmitting, setTestSubmitting] = useState(false);
  const testSubmissionRef = useRef(false);
  const [testSaveSuccess, setTestSaveSuccess] = useState("");
  const [poolActionError, setPoolActionError] = useState("");
  const [reviewRec, setReviewRec] = useState(null);
  const [treatmentSubmitting,setTreatmentSubmitting]=useState(false);
  const [deleteHistoryItem, setDeleteHistoryItem] = useState(null);

  useEffect(() => {
    if (initialView?.view === "history") setTab("history");
    if (initialView?.workflow === "note" && initialView?.ts) {
      setTab("history");
      setForm({ date: initialView.prefill?.date || TODAY_STR, type: "AI recommendation review", notes: initialView.prefill?.description || initialView.prefill?.title || "" });
      setModal("maintenance");
    }
  }, [initialView]);

  const latest = latestReadingValues(readings.data);
  const recommendations = useMemo(
    () => getPoolRecommendations(latest, {
      schedule: schedule.data,
      recentTreatments: treatments.data.slice(0, 5),
      recentNotes: [...readings.data.slice(0, 5).map(item => item.notes), ...maintenance.data.slice(0, 5).map(item => item.notes)],
    }),
    [latest, maintenance.data, readings.data, schedule.data, treatments.data]
  );
  const health = getPoolHealth(latest, recommendations);
  const nextAction = recommendations[0];
  const retest = retestGuidance(latest, recommendations);
  const actionPlan = useMemo(() => buildActionPlan(recommendations), [recommendations]);
  const treatmentPlan = useMemo(() => reviewRec ? [reviewRec, ...recommendations.filter(rec => rec.id !== reviewRec.id && rec.category === "Chemical" && rec.priority !== "low")] : [], [recommendations, reviewRec]);
  const trends = [
    { name: "FC", ...trendDetail(readings.data, "free_chlorine", "ppm") },
    { name: "pH", ...trendDetail(readings.data, "ph") },
    { name: "CYA", ...trendDetail(readings.data, "cya", "ppm") },
    { name: "Salt", ...trendDetail(readings.data, "salt", "ppm") },
    { name: "TA", ...trendDetail(readings.data, "alkalinity", "ppm") },
    { name: "Temp", ...trendDetail(readings.data, "water_temp", "F") },
  ];
  const recentTreatment = treatments.data[0];
  const dueMaintenance = schedule.data
    .map(item => ({ ...item, status: maintStatus(item), due: item.last_completed ? nextDueDate(item.last_completed, item.interval_days) : null }))
    .sort((a, b) => ({ overdue: 0, "due-soon": 1, ok: 2 }[a.status] - { overdue: 0, "due-soon": 1, ok: 2 }[b.status]));
  const equipmentGuidance = maintenanceGuidance(latest, dueMaintenance, equipment.data);
  const seasonalGuidance = contextGuidance(latest, readings.data);

  const history = useMemo(() => {
    const rows = [
      ...readings.data.map(item => ({ ...item, kind: "Reading", sort: item.logged_at || item.date, text: `pH ${item.ph ?? "--"} FC ${item.free_chlorine ?? "--"} Salt ${item.salt ?? "--"}` })),
      ...treatments.data.map(item => ({ ...item, kind: "Chemical", sort: item.logged_at || item.date, text: [
        item.muriatic_acid_oz && `${item.muriatic_acid_oz} oz acid`,
        item.salt_lbs && `${item.salt_lbs} lb salt`,
        item.cya_oz && `${item.cya_oz} oz CYA`,
        item.liquid_chlorine_oz && `${item.liquid_chlorine_oz} oz chlorine`,
        item.swg_pct_after && `SWG to ${item.swg_pct_after}%`,
      ].filter(Boolean).join(", ") || "Treatment logged" })),
      ...maintenance.data.map(item => ({ ...item, kind: /note|party|weather|clarity/i.test(item.type) ? "Note" : "Maintenance", sort: item.date, text: item.type })),
    ].sort((a, b) => new Date(b.sort) - new Date(a.sort));
    if (historyFilter === "All") return rows;
    return rows.filter(item => item.kind === historyFilter);
  }, [historyFilter, maintenance.data, readings.data, treatments.data]);
  const groupedHistory = useMemo(() => history.reduce((groups, item) => {
    const key = item.date || String(item.sort || "").slice(0, 10) || "Unknown";
    return { ...groups, [key]: [...(groups[key] || []), item] };
  }, {}), [history]);

  function fieldError(key) {
    return poolTestFieldError(key, form);
  }

  function setTestField(key, value) {
    setTestSaveError("");
    setTestInvalidFields(previous => previous.filter(field => field !== key));
    setForm(previous => ({ ...previous, [key]: value }));
  }

  function renderPoolNumberField(field) {
    return (
      <NumberField
        key={field.key}
        label={POOL_TEST_FIELD_LABELS[field.key]}
        aria-label={POOL_TEST_FIELD_LABELS[field.key]}
        value={form[field.key]}
        min={field.min}
        max={field.max}
        step={field.step}
        inputMode={field.inputMode}
        placeholder={field.placeholder}
        error={fieldError(field.key)}
        onChange={value => setTestField(field.key, value)}
      />
    );
  }

  function showPoolMutationError(error, fallback) {
    setPoolActionError(formatUserFacingError(error, fallback));
  }

  async function confirmHistoryDelete() {
    const item = deleteHistoryItem;
    if (!item) return;
    setPoolActionError("");
    try {
      if (item.kind === "Reading") await readings.remove(item.id);
      else if (item.kind === "Chemical") await treatments.remove(item.id);
      else await maintenance.remove(item.id);
      setDeleteHistoryItem(null);
    } catch (error) {
      showPoolMutationError(error, "Pool history item could not be deleted right now.");
    }
  }

  function openTest(row = null) {
    setTestSaveError("");
    setTestInvalidFields([]);
    setTestSaveSuccess("");
    setPoolActionError("");
    setForm(row ? { ...row, time: row.logged_at ? new Date(row.logged_at).toTimeString().slice(0, 5) : "" } : { date: TODAY_STR, test_source: "Taylor Kit" });
    setSourceMode(row?.test_source || "Taylor Kit");
    setModal("test");
  }

  async function saveTest() {
    if (testSubmissionRef.current) return;
    setTestSaveError("");
    setPoolActionError("");
    const validation = validatePoolTestForm(form);
    if (!validation.valid) {
      setTestSaveError(validation.message);
      setTestInvalidFields(validation.fields);
      return;
    }
    const row = buildPoolReadingRow(form, { testSource: sourceMode, time: form.time });
    try {
      testSubmissionRef.current = true;
      setTestSubmitting(true);
      if (form.id) await readings.update(form.id, row);
      else await readings.insert(row);
      await readings.reload?.();
      setTestSaveSuccess(form.id ? "Pool test updated." : "Pool test saved.");
      setModal(null); setForm({});
    } catch (error) {
      setTestSaveError(formatUserFacingError(error, "Pool test could not be saved right now."));
    } finally {
      testSubmissionRef.current = false;
      setTestSubmitting(false);
    }
  }

  function openReview(rec) {
    setReviewRec(rec);
    setModal("review");
  }

  function confirmReviewedPlan() {
    if (!reviewRec) return;
    setForm({...treatmentPrefill(treatmentPlan,latest),_recommendation:reviewRec});
    setModal("treatment");
    setReviewRec(null);
  }

  async function saveTreatment() {
    if(treatmentSubmitting)return;
    const row = {
      date: form.date || TODAY_STR,
      logged_at: dateTime(form.date || TODAY_STR, form.time),
      muriatic_acid_oz: num(form.muriatic_acid_oz),
      soda_ash_oz: num(form.soda_ash_oz),
      sodium_bicarb_oz: num(form.sodium_bicarb_oz),
      salt_lbs: num(form.salt_lbs),
      cya_oz: num(form.cya_oz),
      liquid_chlorine_oz: num(form.liquid_chlorine_oz),
      shock_lbs: num(form.shock_lbs),
      algaecide_oz: num(form.algaecide_oz),
      swg_pct_before: num(form.swg_pct_before),
      swg_pct_after: num(form.swg_pct_after),
      brushed: Boolean(form.brushed),
      vacuumed: Boolean(form.vacuumed),
      cleaned_skimmer: Boolean(form.cleaned_skimmer),
      cleaned_filter: Boolean(form.cleaned_filter),
      cleaned_cell: Boolean(form.cleaned_cell),
      checked_flow: Boolean(form.checked_flow),
      water_clarity: form.water_clarity || "",
      treatment: form.treatment || "",
      amount: num(form.amount),
      unit: form.unit || "",
      product_concentration: form.product_concentration || "",
      reason: form.reason || "",
      related_reading_id: form.related_reading_id || latest?.id || null,
      pump_status: form.pump_status || "",
      pump_speed_rpm: num(form.pump_speed_rpm),
      expected_result: form.expected_result || "",
      retest_at: form.retest_at ? new Date(form.retest_at).toISOString() : null,
      follow_up_result: form.follow_up_result || "",
      notes: form.notes || "",
    };
    setPoolActionError("");
    try {
      setTreatmentSubmitting(true);
      if (form.id) await treatments.update(form.id, row);
      else await treatments.insert(row);
      if(form._recommendation)await audits.insert({reading_id:latest?.id||null,recommendation_id:form._recommendation.id,action:form._recommendation.action,explanation:form._recommendation.explanation,confidence:form._recommendation.confidence,safety_note:form._recommendation.safetyNote,status:"completed",created_at:new Date().toISOString(),confirmed_at:new Date().toISOString(),completed_at:new Date().toISOString()});
      setModal(null); setForm({});
    } catch (error) {
      showPoolMutationError(error, "Pool treatment could not be saved right now.");
    } finally { setTreatmentSubmitting(false); }
  }

  async function saveProfile() {
    const row = {
      name: form.name || "Pool",
      volume_gallons: Number(form.volume_gallons),
      surface_type: form.surface_type || "",
      sanitizer_type: form.sanitizer_type || "",
      saltwater: Boolean(form.saltwater),
      automation_system: form.automation_system || "", pump: form.pump || "", filter: form.filter || "", heater: form.heater || "", salt_cell: form.salt_cell || "",
      spa_relationship: form.spa_relationship || "", normal_pump_runtime_hours: num(form.normal_pump_runtime_hours), normal_pump_speed_rpm: num(form.normal_pump_speed_rpm), minimum_salt_cell_rpm: num(form.minimum_salt_cell_rpm), swg_output_percent: num(form.swg_output_percent),
      seasonal_notes: form.seasonal_notes || "", notes: form.notes || "",
    };
    if (!row.volume_gallons || !row.surface_type || !row.sanitizer_type) { setPoolActionError("Pool volume, surface type, and sanitizer type are required."); return; }
    try { if (form.id) await profiles.update(form.id, row); else await profiles.insert(row); setModal(null); setForm({}); } catch (error) { showPoolMutationError(error, "Pool profile could not be saved right now."); }
  }

  async function saveMaintenance() {
    const row = {
      date: form.date || TODAY_STR,
      type: form.type || "Pool Note",
      equipment_id: form.equipment_id || null,
      water_clarity: form.water_clarity || "",
      notes: form.notes || "",
    };
    setPoolActionError("");
    try {
      if (form.id) await maintenance.update(form.id, row);
      else await maintenance.insert(row);
      setModal(null); setForm({});
    } catch (error) {
      showPoolMutationError(error, "Pool maintenance entry could not be saved right now.");
    }
  }

  async function saveEquipment() {
    const row = {
      type: form.type || "Pump",
      name: form.name || form.type || "Pool equipment",
      brand: form.brand || "",
      model: form.model || "",
      install_date: form.install_date || null,
      last_maintenance: form.last_maintenance || null,
      next_maintenance: form.next_maintenance || null,
      warranty_notes: form.warranty_notes || "",
      manual_link: form.manual_link || "",
      notes: form.notes || "",
      active: form.active !== false,
    };
    setPoolActionError("");
    try {
      if (form.id) await equipment.update(form.id, row);
      else await equipment.insert(row);
      setModal(null); setForm({});
    } catch (error) {
      showPoolMutationError(error, "Pool equipment could not be saved right now.");
    }
  }

  async function saveSchedule() {
    const row = {
      title: form.title || "Pool reminder",
      maintenance_type: form.maintenance_type || form.title || "Pool reminder",
      equipment_id: form.equipment_id || null,
      last_completed: form.last_completed || TODAY_STR,
      interval_days: Number(form.interval_days || 30),
      notes: form.notes || "",
    };
    setPoolActionError("");
    try {
      if (form.id) await schedule.update(form.id, row);
      else await schedule.insert(row);
      setModal(null); setForm({});
    } catch (error) {
      showPoolMutationError(error, "Pool reminder could not be saved right now.");
    }
  }

  async function markScheduleDone(item) {
    setPoolActionError("");
    try {
      const idempotencyKey = `${item.id}:${TODAY_STR}`;
      const { error } = await supabase.rpc("complete_pool_maintenance", { p_schedule_id: item.id, p_notes: item.notes || "", p_idempotency_key: idempotencyKey });
      if (error) throw error;
      await Promise.all([schedule.reload({ throwOnError: true }), maintenanceHistory.reload({ throwOnError: true })]);
      setTestSaveSuccess(`${item.title} completed. Next due ${formatDate(nextDueDate(TODAY_STR, item.interval_days))}.`);
    } catch (error) {
      showPoolMutationError(error, "Pool reminder could not be completed right now.");
    }
  }

  const loading = readings.loading || treatments.loading || maintenance.loading || maintenanceHistory.loading || schedule.loading || equipment.loading || audits.loading || profiles.loading;

  return (
    <div style={S.screen}>
      {testSaveSuccess && <div className="mb-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300" role="status">{testSaveSuccess}</div>}
      <div style={{ ...S.statusCard(health.color), marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 12, color: COLORS.slate, fontWeight: 800, textTransform: "uppercase" }}>Pool Status</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: health.color, marginTop: 2 }}>{health.status}</div>
            <div style={{ fontSize: 13, color: COLORS.slateLight, lineHeight: 1.45, marginTop: 4 }}>{health.summary}</div>
          </div>
          <Droplets size={26} color={health.color} aria-hidden="true" />
        </div>
        <div style={{ display: "grid", gap: 5, marginTop: 10, fontSize: 12, color: COLORS.slateLight }}>
          <div><b style={{ color: COLORS.white }}>Last tested:</b> {latest ? `${formatDate(latest.date)} (${daysAgo(latest.date) === 0 ? "today" : `${daysAgo(latest.date)} days ago`})` : "No test logged"}</div>
          <div><b style={{ color: COLORS.white }}>Next test:</b> {retest.detail}</div>
          {latest?.water_temp != null && <div><b style={{ color: COLORS.white }}>Water temperature:</b> {latest.water_temp} F</div>}
          <div><b style={{ color: COLORS.white }}>Last treatment:</b> {latestChemicalText(recentTreatment)}{recentTreatment?.date ? `, ${formatDate(recentTreatment.date)}` : ""}</div>
        </div>
        <div style={{ borderTop: `1px solid ${COLORS.border}`, marginTop: 10, paddingTop: 10 }}>
          <div style={{ fontSize: 12, color: COLORS.slate, fontWeight: 800, textTransform: "uppercase" }}>Recommended next step</div>
          <div style={{ fontSize: 16, color: COLORS.white, fontWeight: 900, lineHeight: 1.35, marginTop: 4 }}>{nextAction?.action || "No action needed"}</div>
          <div style={{ fontSize: 12, color: COLORS.slateLight, lineHeight: 1.45, marginTop: 3 }}>{nextAction?.explanation || `Test again ${retest.detail.toLowerCase()}`}</div>
          {nextAction?.retest && <div style={{ fontSize: 12, color: COLORS.slate, marginTop: 4 }}>{nextAction.retest}</div>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>{editable&&<Button type="button" size="sm" onClick={() => openTest()}>Log Test</Button>}{editable&&nextAction&&nextAction.priority!=="low"&&<Button type="button" size="sm" variant="secondary" onClick={() => openReview(nextAction)}>Review Recommendation</Button>}</div>
        </div>
        {latest && <ExpandableSection title="Water Test Results" preferenceKey="familyos.pool.water-test-results.expanded" className="mt-3 bg-transparent">
          {chemistrySummary(latest).map(([label, value, unit, key]) => {
            const status = poolStatus(key, value);
            const targets = { free_chlorine: "3–7", cc: "0–0.2", ph: "7.2–7.6", alkalinity: "80–120", cya: "60–80", salt: "3200–3600", calcium_hardness: "150–300" };
            return <div key={label} style={{ display: "grid", gridTemplateColumns: "48px 64px 1fr 58px", gap: 8, alignItems: "center", minHeight: 34, borderBottom: `1px solid ${COLORS.border}`, fontSize: 12 }}>
              <b>{label}</b><span style={{ color: statusColor(status), fontWeight: 900 }}>{value ?? "--"}{unit ? ` ${unit}` : ""}</span><span style={{ color: COLORS.slate }}>Target {targets[key]}</span><span style={{ color: statusColor(status), textAlign: "right", fontWeight: 800 }}>{status === "green" ? "Good" : status === "amber" ? "Watch" : status === "red" ? "Action" : "Unknown"}</span>
            </div>
          })}
        </ExpandableSection>}
      </div>

      {poolActionError && (
        <div style={{ border: `1px solid ${COLORS.red}`, borderRadius: 8, padding: 10, color: COLORS.red, fontSize: 13, marginBottom: 12 }}>
          {poolActionError}
        </div>
      )}

      <div style={S.tabs}>
        {[
          ["dashboard", ClipboardList],
          ["history", History],
          ["equipment", Wrench],
          ["maintenance", Settings2],
        ].map(([id, Icon]) => (
          <button key={id} style={S.tabBtn(tab === id)} onClick={() => setTab(id)}>
            <Icon size={14} aria-hidden="true" style={{ display: "inline", marginRight: 4, verticalAlign: "-2px" }} />{id === "dashboard" ? "Actions" : id[0].toUpperCase() + id.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <Loading /> : (
        <>
          {tab === "dashboard" && <>
            {history.length > 0 && <ExpandableSection title="Recent Activity" preferenceKey="familyos.pool.recent-activity.expanded" className="mb-2.5">
              {history.slice(0, 5).map(item => <div key={`recent-${item.kind}-${item.id}`} style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: 8, borderTop: `1px solid ${COLORS.border}`, padding: "7px 0", fontSize: 12 }}><span style={{ color: COLORS.slate }}>{item.date === TODAY_STR || String(item.sort).slice(0, 10) === TODAY_STR ? "Today" : formatDate(item.date || item.sort)}</span><span style={{ color: COLORS.slateLight }}>{item.kind === "Reading" ? "Water tested" : item.text}</span></div>)}
              {history.length > 5 && <Button type="button" variant="ghost" size="xs" onClick={() => setTab("history")}>View More Activity</Button>}
            </ExpandableSection>}
            {readings.data.length >= 2 && <ExpandableSection title="Trend Charts" preferenceKey="familyos.pool.trend-charts.expanded" className="mb-2.5">
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {trends.filter(item => item.bars.length >= 2).map(item => <div key={`trend-${item.name}`} style={{ display: "grid", gridTemplateColumns: "48px 1fr 76px", gap: 8, alignItems: "center" }}><b style={{ fontSize: 12 }}>{item.name}</b><div style={{ display: "flex", alignItems: "end", gap: 3, height: 28, borderBottom: `1px solid ${COLORS.border}` }}>{item.bars.map((bar, index) => <div key={`${item.name}-${index}`} style={{ flex: 1, height: `${bar.pct}%`, minHeight: 4, borderRadius: 3, background: item.color }} />)}</div><span style={{ fontSize: 11, color: item.color, textAlign: "right" }}>{item.label}</span></div>)}
              </div>
            </ExpandableSection>}
          </>}
          {false && tab === "dashboard" && (
            <>
              <div style={S.card}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <ClipboardList size={18} color={COLORS.blue} aria-hidden="true" />
                  <div style={{ fontSize: 16, fontWeight: 900 }}>Action Plan</div>
                </div>
                {Object.entries(actionPlan).map(([group, items]) => (
                  <div key={group} style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 12, color: COLORS.slate, fontWeight: 900, textTransform: "uppercase" }}>{group}</div>
                    {items.length ? items.map(rec => (
                      <div key={`${group}-${rec.id}`} style={{ borderLeft: `3px solid ${rec.color}`, padding: "8px 0 8px 10px", marginTop: 6 }}>
                        <div style={{ fontSize: 14, color: COLORS.white, fontWeight: 900 }}>{rec.action}</div>
                        <div style={{ fontSize: 12, color: COLORS.slateLight, lineHeight: 1.45, marginTop: 3 }}>{rec.explanation}</div>
                        <div style={{ fontSize: 12, color: COLORS.slate, marginTop: 4 }}>{rec.timing} | {rec.retest}</div>
                        {rec.safetyNote && <div style={{ fontSize: 12, color: COLORS.slate, marginTop: 4 }}>Safety: {rec.safetyNote}</div>}
                        {rec.expectedOutcome && <div style={{ fontSize: 12, color: COLORS.slate, marginTop: 4 }}>Expected: {rec.expectedOutcome}</div>}
                        {editable && rec.priority !== "low" && <Button type="button" size="sm" variant="secondary" className="mt-2" onClick={() => openReview(rec)}>Review</Button>}
                      </div>
                    )) : <div style={{ fontSize: 12, color: COLORS.slate, marginTop: 6 }}>No actions in this group.</div>}
                  </div>
                ))}
              </div>

              <div style={S.card}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <FlaskConical size={18} color={COLORS.green} aria-hidden="true" />
                  <div style={{ fontSize: 16, fontWeight: 900 }}>Current Chemistry</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(76px, 1fr))", gap: 8 }}>
                  {chemistrySummary(latest).map(([label, value, unit, key]) => (
                    <div key={label} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 8 }}>
                      <div style={{ fontSize: 11, color: COLORS.slate }}>{label}</div>
                      <div style={{ fontSize: 16, color: statusColor(poolStatus(key, value)), fontWeight: 900 }}>{value ?? "--"}</div>
                      {unit && <div style={{ fontSize: 11, color: COLORS.slate }}>{unit}</div>}
                    </div>
                  ))}
                </div>
              </div>

              <div style={S.card}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <ThermometerSun size={18} color={COLORS.amber} aria-hidden="true" />
                  <div style={{ fontSize: 16, fontWeight: 900 }}>Trends</div>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {trends.map(item => (
                    <div key={`trend-${item.name}`} style={{ display: "grid", gridTemplateColumns: "52px 1fr 78px", gap: 8, alignItems: "center" }}>
                      <div style={{ fontSize: 13, color: COLORS.white, fontWeight: 800 }}>{item.name}</div>
                      <div style={{ display: "flex", alignItems: "end", gap: 3, height: 34, borderBottom: `1px solid ${COLORS.border}` }}>
                        {item.bars.length ? item.bars.map((bar, index) => <div key={`${item.name}-${index}`} style={{ flex: 1, height: `${bar.pct}%`, minHeight: 4, borderRadius: 4, background: item.color }} />) : <div style={{ fontSize: 12, color: COLORS.slate }}>Log more tests</div>}
                      </div>
                      <div style={{ fontSize: 12, color: item.color, textAlign: "right", fontWeight: 800 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {recommendations.map(rec => recommendationCard(rec, openReview, editable))}

              <div style={S.card}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <HelpCircle size={18} color={COLORS.blue} aria-hidden="true" />
                  <div style={{ fontSize: 16, fontWeight: 900 }}>Why This Matters</div>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {HELP_COPY.map(([label, copy]) => (
                    <details key={label} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 10px" }}>
                      <summary style={{ cursor: "pointer", color: COLORS.white, fontSize: 13, fontWeight: 900 }}>{label}</summary>
                      <div style={{ fontSize: 12, color: COLORS.slateLight, lineHeight: 1.45, marginTop: 6 }}>{copy}</div>
                    </details>
                  ))}
                </div>
              </div>

              <div style={S.card}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>Seasonal Context</div>
                {seasonalGuidance.map(item => <div key={item} style={{ fontSize: 13, color: COLORS.slateLight, lineHeight: 1.5, marginTop: 6 }}>{item}</div>)}
              </div>

              <div style={S.card}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>Action Engine</div>
                <div style={{ fontSize: 13, color: COLORS.slateLight, lineHeight: 1.55 }}>Rules are local and configurable. They use FC, CC, pH, TA, CYA, salt, temperature, SWG %, pump runtime, recent notes, treatment history, and maintenance dates. Future AI can explain these rules, but actions stay human-confirmed.</div>
                <div style={{ fontSize: 12, color: COLORS.slate, marginTop: 8 }}>Pool volume: {POOL_RULE_CONFIG.poolGallons.toLocaleString()} gal. Safety note is shown on every recommendation.</div>
              </div>
            </>
          )}

          {tab === "history" && (
            <>
              <ChipGroup value={historyFilter} options={HISTORY_FILTERS} ariaLabel="History filter" onValueChange={setHistoryFilter} />
              {editable && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  <Button type="button" onClick={() => openTest()}>Pool Test</Button>
                  <Button type="button" variant="secondary" onClick={() => { setForm({ date: TODAY_STR }); setModal("treatment"); }}>Chemical Added</Button>
                  <Button type="button" variant="secondary" onClick={() => { setForm({ date: TODAY_STR, type: "Maintenance Completed" }); setModal("maintenance"); }}>Maintenance</Button>
                  <Button type="button" variant="secondary" onClick={() => { setForm({ date: TODAY_STR, type: "Pool Note" }); setModal("maintenance"); }}>Pool Note</Button>
                </div>
              )}
              {!history.length && <EmptyState title="No pool history yet" detail="Log a test, treatment, maintenance item, or pool note to build the timeline." />}
              {Object.entries(groupedHistory).map(([date, items]) => (
                <section key={date} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: COLORS.slate, fontWeight: 900, textTransform: "uppercase", margin: "8px 0" }}>{formatDate(date)}</div>
                  {items.map(item => {
                    const nextReading = item.kind === "Chemical" ? readings.data.find(reading => new Date(reading.logged_at || reading.date) > new Date(item.sort || item.date)) : null;
                    const major = isMajorHistoryItem(item);
                    return (
                      <div key={`${item.kind}-${item.id}`} className="mb-2 rounded-lg border border-border bg-card px-3 py-2" style={{ borderLeft: `3px solid ${major ? COLORS.amber : COLORS.border}` }}>
                        <div className="flex min-w-0 items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span className="text-xs font-extrabold" style={{ color: item.kind === "Chemical" ? COLORS.amber : item.kind === "Reading" ? COLORS.blue : COLORS.green }}>{item.kind}{major ? " · major" : ""}</span>
                              <span className="text-xs text-muted-foreground">{item.sort && String(item.sort).includes("T") ? new Date(item.sort).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : ""}</span>
                            </div>
                            <div className="mt-0.5 text-sm font-bold leading-5 text-foreground">{item.text}</div>
                            {historyDetail(item, nextReading) && <div className="mt-0.5 line-clamp-1 text-xs leading-5 text-muted-foreground">{historyDetail(item, nextReading)}</div>}
                            {item.notes && <div className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.notes}</div>}
                          </div>
                          {editable && <div className="flex shrink-0 gap-1">
                            <Button type="button" variant="ghost" size="icon-xs" aria-label={`Edit ${item.kind} entry`} title="Edit" onClick={() => { setForm({ ...item }); setModal(item.kind === "Reading" ? "test" : item.kind === "Chemical" ? "treatment" : "maintenance"); }}><Pencil aria-hidden="true" /></Button>
                            <Button type="button" variant="ghost" size="icon-xs" className="text-destructive hover:text-destructive" aria-label={`Delete ${item.kind} entry`} title="Delete" onClick={() => setDeleteHistoryItem(item)}><Trash2 aria-hidden="true" /></Button>
                          </div>}
                        </div>
                      </div>
                    );
                  })}
                </section>
              ))}
            </>
          )}

          {tab === "equipment" && (
            <>
              {editable && <Button type="button" className="mb-3 w-full" onClick={() => { setForm({ type: "Pump", active: true }); setModal("equipment"); }}>Add Equipment</Button>}
              {!equipment.data.length && <EmptyState title="No equipment yet" detail="Track pump, SWG, filter, heater, robot, skimmer, cover, and test-kit details." />}
              <SwipeHint />
              {equipment.data.map(item => (
                <SwipeCard key={item.id} id={`equip-${item.id}`} activeId={activeSwipe} setActiveId={setActiveSwipe}
                  onEdit={() => { setForm(item); setModal("equipment"); }}
                  onDelete={async () => {
                    setPoolActionError("");
                    try {
                      await equipment.remove(item.id);
                      setActiveSwipe(null);
                    } catch (error) {
                      showPoolMutationError(error, "Pool equipment could not be deleted right now.");
                    }
                  }}
                  style={S.statusCard(item.next_maintenance && daysBetween(item.next_maintenance) <= 7 ? COLORS.amber : COLORS.blue)}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 16, color: COLORS.white, fontWeight: 900 }}>{item.name || item.type}</div>
                      <div style={{ fontSize: 13, color: COLORS.slateLight, marginTop: 3 }}>{item.type} {item.brand || item.model ? `- ${[item.brand, item.model].filter(Boolean).join(" ")}` : ""}</div>
                      {item.next_maintenance && <div style={{ fontSize: 13, color: COLORS.slate, marginTop: 5 }}>Next maintenance: {formatDate(item.next_maintenance)}</div>}
                      {item.notes && <div style={{ fontSize: 13, color: COLORS.slate, marginTop: 5 }}>{item.notes}</div>}
                    </div>
                    {item.manual_link && <a href={item.manual_link} target="_blank" rel="noreferrer" style={{ color: COLORS.blue, fontSize: 12 }}>Manual</a>}
                  </div>
                </SwipeCard>
              ))}
            </>
          )}

          {tab === "maintenance" && (
            <>
              <div style={S.card}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <CalendarClock size={18} color={COLORS.blue} aria-hidden="true" />
                  <div style={{ fontSize: 16, fontWeight: 900 }}>Equipment Guidance</div>
                </div>
                {equipmentGuidance.map(item => (
                  <div key={item.title} style={{ borderLeft: `3px solid ${item.color}`, padding: "6px 0 6px 10px" }}>
                    <div style={{ fontSize: 14, color: COLORS.white, fontWeight: 900 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: COLORS.slateLight, lineHeight: 1.45 }}>{item.detail}</div>
                  </div>
                ))}
              </div>
              {editable && <Button type="button" className="mb-3 w-full" onClick={() => { setForm({ title: "Filter Cleaning", interval_days: 30, last_completed: TODAY_STR }); setModal("schedule"); }}>Add Reminder</Button>}
              {!dueMaintenance.length && <EmptyState title="No maintenance reminders" detail="Add recurring reminders for filter, SWG, pump, robot, Betta, reagents, opening, and closing." />}
              {dueMaintenance.map(item => {
                const color = maintColor(item.status);
                const due = item.due;
                const days = due ? daysBetween(due) : null;
                return (
                  <div key={item.id} style={S.statusCard(color)}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 900 }}>{item.title}</div>
                        <div style={{ fontSize: 13, color: COLORS.slateLight, marginTop: 4 }}>{days < 0 ? `Overdue by ${Math.abs(days)} days` : days === 0 ? "Due today" : `Due in ${days} days`}</div>
                        {item.notes && <div style={{ fontSize: 13, color: COLORS.slate, marginTop: 5 }}>{item.notes}</div>}
                      </div>
                      {editable && <Button type="button" size="sm" onClick={() => markScheduleDone(item)}>Done</Button>}
                    </div>
                  </div>
                );
              })}
              {maintenanceHistory.data.length > 0 && <ExpandableSection title="Maintenance History" summary={`${maintenanceHistory.data.length} completion${maintenanceHistory.data.length === 1 ? "" : "s"}`}>
                <div className="space-y-2">
                  {maintenanceHistory.data.slice(0, 8).map(item => <div key={item.id} className="border-l-2 border-emerald-400/60 pl-3 py-1">
                    <div className="text-sm font-bold text-foreground">{item.maintenance_item}</div>
                    <div className="text-xs text-muted-foreground">{new Date(item.completed_at).toLocaleString()}{item.prior_due_date ? ` · due ${formatDate(item.prior_due_date)}` : ""}</div>
                    {item.notes && <div className="mt-1 text-xs text-muted-foreground">{item.notes}</div>}
                  </div>)}
                </div>
              </ExpandableSection>}
            </>
          )}
        </>
      )}

      {modal === "review" && reviewRec && (
        <Modal title="Review Treatment Plan" onClose={() => { setModal(null); setReviewRec(null); }}>
          <FormSection>
            <div style={S.card}>
              <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 8 }}>Current chemistry summary</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))", gap: 8 }}>
                {chemistrySummary(latest).slice(0, 6).map(([label, value, unit, key]) => (
                  <div key={`review-${label}`} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 8 }}>
                    <div style={{ fontSize: 11, color: COLORS.slate }}>{label}</div>
                    <div style={{ fontSize: 15, color: statusColor(poolStatus(key, value)), fontWeight: 900 }}>{value ?? "--"}</div>
                    {unit && <div style={{ fontSize: 11, color: COLORS.slate }}>{unit}</div>}
                  </div>
                ))}
              </div>
            </div>

            <div style={S.card}>
              <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 8 }}>Recommended actions</div>
              {treatmentPlan.map(rec => (
                <div key={`review-rec-${rec.id}`} style={{ borderLeft: `3px solid ${rec.color}`, padding: "8px 0 8px 10px" }}>
                  <div style={{ fontSize: 14, color: COLORS.white, fontWeight: 900 }}>{rec.action}</div>
                  <div style={{ fontSize: 12, color: COLORS.slateLight, lineHeight: 1.45, marginTop: 4 }}>{rec.explanation}</div>
                  {rec.amount && <div style={{ fontSize: 12, color: rec.color, fontWeight: 900, marginTop: 4 }}>{rec.amount}</div>}
                </div>
              ))}
            </div>

            <div style={S.card}>
              <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 8 }}>Treatment details</div>
              <div style={{ fontSize: 13, color: COLORS.slateLight, lineHeight: 1.5 }}><b style={{ color: COLORS.white }}>Total chemicals:</b> {totalChemicalText(treatmentPlan)}</div>
              <div style={{ fontSize: 13, color: COLORS.slateLight, lineHeight: 1.5, marginTop: 6 }}><b style={{ color: COLORS.white }}>Expected after treatment:</b> {expectedChemistry(latest, treatmentPlan)}</div>
              <div style={{ fontSize: 13, color: COLORS.slateLight, lineHeight: 1.5, marginTop: 6 }}><b style={{ color: COLORS.white }}>Wait time:</b> {reviewRec.timing}. Keep the pump running as directed and follow product labels.</div>
              <div style={{ fontSize: 13, color: COLORS.slateLight, lineHeight: 1.5, marginTop: 6 }}><b style={{ color: COLORS.white }}>Retest schedule:</b> {reviewRec.retest}</div>
              <div style={{ fontSize: 13, color: COLORS.slateLight, lineHeight: 1.5, marginTop: 6 }}><b style={{ color: COLORS.white }}>Staged additions:</b></div>
              {stagedAdditions(treatmentPlan).map(note => <div key={note} style={{ fontSize: 12, color: COLORS.amber, lineHeight: 1.45, marginTop: 4 }}>{note}</div>)}
              <div style={{ fontSize: 12, color: COLORS.slate, lineHeight: 1.45, marginTop: 8 }}>{reviewRec.safetyNote}</div>
            </div>

            <Button type="button" className="w-full" onClick={confirmReviewedPlan}>Confirm and Log</Button>
          </FormSection>
        </Modal>
      )}

      {modal === "test" && (
        <Modal title={form.id ? "Edit Pool Test" : "Log Pool Test"} onClose={() => { setModal(null); setForm({}); }}>
          <FormSection>
            <DateTimeField
              required
              date={form.date || TODAY_STR}
              time={form.time || new Date().toTimeString().slice(0, 5)}
              dateError={testInvalidFields.includes("date") ? "Enter a valid test date." : ""}
              timeError={testInvalidFields.includes("time") ? "Enter a valid test time." : ""}
              onDateChange={date => setTestField("date", date)}
              onTimeChange={time => setTestField("time", time)}
            />
            <FormGroup><Label>Test Source</Label><SegmentedControl value={sourceMode} options={TEST_SOURCES.map(value => ({ value, label: value }))} ariaLabel="Test source" onValueChange={setSourceMode} /></FormGroup>
            <FormGroup><Label>Test Context</Label><select className="flex h-11 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground" value={form.test_context || "Routine"} onChange={e => setTestField("test_context", e.target.value)}>{POOL_TEST_CONTEXTS.map(value => <option key={value}>{value}</option>)}</select></FormGroup>
            <FormSection title="Chemistry" description="Log any tested values. At least one chemistry or water measurement is needed.">
              <FormRow>{POOL_TEST_PRIMARY_FIELDS.slice(0, 2).map(renderPoolNumberField)}</FormRow>
              <FormRow>{POOL_TEST_PRIMARY_FIELDS.slice(2, 4).map(renderPoolNumberField)}</FormRow>
              <div className="grid gap-3 sm:grid-cols-3">{POOL_TEST_PRIMARY_FIELDS.slice(4, 6).map(renderPoolNumberField)}{renderPoolNumberField(POOL_TEST_ADVANCED_FIELDS[3])}</div>
              {renderPoolNumberField(POOL_TEST_PRIMARY_FIELDS[6])}
            </FormSection>
            <NotesField label="Notes" value={form.notes || ""} placeholder="Clarity, swimmer load, dosing context..." onChange={value => setTestField("notes", value)} />
            <FormGroup><Label>Water Appearance</Label><Input value={form.water_appearance || ""} placeholder="Clear, cloudy, green tint..." onChange={e => setTestField("water_appearance", e.target.value)} /></FormGroup>
            <div className="grid grid-cols-2 gap-2">
              <ToggleField checked={Boolean(form.recent_heavy_usage)} label="Party" onChange={checked => setTestField("recent_heavy_usage", checked)} />
              <ToggleField checked={hasRainContext(form)} label="Rain" onChange={checked => setTestField("recent_weather_notes", setRainContext(form, checked))} />
            </div>
            <button type="button" className="flex w-full items-center justify-between rounded-lg border border-border bg-secondary px-3 py-3 text-left text-sm font-semibold" onClick={() => setShowAdvancedTest(value => !value)}>
              <span>Advanced test details</span><span style={{ color: COLORS.slate }}>{showAdvancedTest ? "Hide" : "Show"}</span>
            </button>
            {showAdvancedTest && (
              <FormSection>
                <FormRow>{POOL_TEST_ADVANCED_FIELDS.slice(0, 2).map(renderPoolNumberField)}</FormRow>
                {renderPoolNumberField(POOL_TEST_ADVANCED_FIELDS[2])}
                <FormGroup><Label>Recent Weather</Label><Input value={form.recent_weather_notes || ""} placeholder="Heat, rain, storms..." onChange={e => setTestField("recent_weather_notes", e.target.value)} /></FormGroup>
              </FormSection>
            )}
            <ValidationSummary error={testSaveError} />
            <SaveCancelFooter saveLabel="Save Test" onCancel={() => setModal(null)} onSave={saveTest} submitting={testSubmitting} />
          </FormSection>
        </Modal>
      )}

      {modal === "treatment" && (
        <Modal title="Chemical Added" onClose={() => { setModal(null); setForm({}); }}>
          <FormSection>
            <FormRow><FormGroup><Label>Date</Label><Input type="date" value={form.date || TODAY_STR} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></FormGroup><FormGroup><Label>Time</Label><Input type="time" value={form.time || new Date().toTimeString().slice(0, 5)} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} /></FormGroup></FormRow>
            <div className="grid gap-3 sm:grid-cols-3"><FormGroup><Label>Treatment</Label><Input value={form.treatment || ""} placeholder="Liquid chlorine" onChange={e => setForm(p => ({ ...p, treatment: e.target.value }))} /></FormGroup><FormGroup><Label>Amount</Label><Input type="number" value={form.amount || ""} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></FormGroup><FormGroup><Label>Unit / Concentration</Label><Input value={form.unit || ""} placeholder="oz at 10%" onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} /></FormGroup></div>
            <FormGroup><Label>Reason</Label><Input value={form.reason || ""} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} /></FormGroup>
            <FormRow><FormGroup><Label>Muriatic Acid (oz)</Label><Input type="number" value={form.muriatic_acid_oz || ""} onChange={e => setForm(p => ({ ...p, muriatic_acid_oz: e.target.value }))} /></FormGroup><FormGroup><Label>Salt (lb)</Label><Input type="number" value={form.salt_lbs || ""} onChange={e => setForm(p => ({ ...p, salt_lbs: e.target.value }))} /></FormGroup></FormRow>
            <FormRow><FormGroup><Label>CYA (oz)</Label><Input type="number" value={form.cya_oz || ""} onChange={e => setForm(p => ({ ...p, cya_oz: e.target.value }))} /></FormGroup><FormGroup><Label>Chlorine (oz)</Label><Input type="number" value={form.liquid_chlorine_oz || ""} onChange={e => setForm(p => ({ ...p, liquid_chlorine_oz: e.target.value }))} /></FormGroup></FormRow>
            <FormRow><FormGroup><Label>SWG Before</Label><Input type="number" value={form.swg_pct_before || ""} onChange={e => setForm(p => ({ ...p, swg_pct_before: e.target.value }))} /></FormGroup><FormGroup><Label>SWG After</Label><Input type="number" value={form.swg_pct_after || ""} onChange={e => setForm(p => ({ ...p, swg_pct_after: e.target.value }))} /></FormGroup></FormRow>
            <FormGroup><Label>Water Clarity</Label><Input value={form.water_clarity || ""} placeholder="Clear, cloudy, green tint..." onChange={e => setForm(p => ({ ...p, water_clarity: e.target.value }))} /></FormGroup>
            <FormRow><FormGroup><Label>Pump Speed RPM</Label><Input type="number" value={form.pump_speed_rpm || ""} onChange={e => setForm(p => ({ ...p, pump_speed_rpm: e.target.value }))} /></FormGroup><FormGroup><Label>Retest At</Label><Input type="datetime-local" value={form.retest_at || ""} onChange={e => setForm(p => ({ ...p, retest_at: e.target.value }))} /></FormGroup></FormRow>
            <FormGroup><Label>Expected Result</Label><Input value={form.expected_result || ""} onChange={e => setForm(p => ({ ...p, expected_result: e.target.value }))} /></FormGroup>
            <FormGroup><Label>Notes</Label><Input value={form.notes || ""} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></FormGroup>
            <ValidationSummary error={poolActionError} />
            <SaveCancelFooter saveLabel="Save Chemical Entry" onCancel={()=>{setModal(null);setForm({});}} onSave={saveTreatment} submitting={treatmentSubmitting} />
          </FormSection>
        </Modal>
      )}

      {modal === "profile" && (
        <Modal title="Pool Profile" onClose={() => { setModal(null); setForm({}); }}>
          <FormSection>
            <FormGroup><Label>Pool Name</Label><Input value={form.name || ""} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></FormGroup>
            <FormRow><FormGroup><Label>Volume (gallons)</Label><Input type="number" value={form.volume_gallons || ""} onChange={e => setForm(p => ({ ...p, volume_gallons: e.target.value }))} /></FormGroup><FormGroup><Label>Surface Type</Label><Input value={form.surface_type || ""} onChange={e => setForm(p => ({ ...p, surface_type: e.target.value }))} /></FormGroup></FormRow>
            <FormGroup><Label>Sanitizer Type</Label><Input value={form.sanitizer_type || ""} placeholder="Saltwater chlorine generator" onChange={e => setForm(p => ({ ...p, sanitizer_type: e.target.value }))} /></FormGroup>
            <ToggleField checked={Boolean(form.saltwater)} label="Saltwater pool" onChange={saltwater => setForm(p => ({ ...p, saltwater }))} />
            <FormRow><FormGroup><Label>Automation System</Label><Input value={form.automation_system || ""} onChange={e => setForm(p => ({ ...p, automation_system: e.target.value }))} /></FormGroup><FormGroup><Label>Salt Cell</Label><Input value={form.salt_cell || ""} onChange={e => setForm(p => ({ ...p, salt_cell: e.target.value }))} /></FormGroup></FormRow>
            <FormRow><FormGroup><Label>Pump</Label><Input value={form.pump || ""} onChange={e => setForm(p => ({ ...p, pump: e.target.value }))} /></FormGroup><FormGroup><Label>Filter</Label><Input value={form.filter || ""} onChange={e => setForm(p => ({ ...p, filter: e.target.value }))} /></FormGroup></FormRow>
            <FormRow><FormGroup><Label>Normal Pump Runtime</Label><Input type="number" value={form.normal_pump_runtime_hours || ""} onChange={e => setForm(p => ({ ...p, normal_pump_runtime_hours: e.target.value }))} /></FormGroup><FormGroup><Label>Minimum SWG RPM</Label><Input type="number" value={form.minimum_salt_cell_rpm || ""} onChange={e => setForm(p => ({ ...p, minimum_salt_cell_rpm: e.target.value }))} /></FormGroup></FormRow>
            <NotesField label="Seasonal Notes" value={form.seasonal_notes || ""} onChange={seasonal_notes => setForm(p => ({ ...p, seasonal_notes }))} />
            <NotesField label="General Notes" value={form.notes || ""} onChange={notes => setForm(p => ({ ...p, notes }))} />
            <Button type="button" className="w-full" onClick={saveProfile}>Save Profile</Button>
          </FormSection>
        </Modal>
      )}

      {modal === "maintenance" && (
        <Modal title="Maintenance or Pool Note" onClose={() => { setModal(null); setForm({}); }}>
          <FormSection>
            <FormRow><FormGroup><Label>Date</Label><Input type="date" value={form.date || TODAY_STR} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></FormGroup><FormGroup><Label>Type</Label><Input value={form.type || ""} placeholder="Filter cleaning, pool party, weather note..." onChange={e => setForm(p => ({ ...p, type: e.target.value }))} /></FormGroup></FormRow>
            <FormRow><FormGroup><Label>Equipment</Label><select className="flex h-11 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground" value={form.equipment_id || ""} onChange={e => setForm(p => ({ ...p, equipment_id: e.target.value }))}><option value="">None</option>{equipment.data.map(item => <option key={item.id} value={item.id}>{item.name || item.type}</option>)}</select></FormGroup><FormGroup><Label>Water Clarity</Label><Input value={form.water_clarity || ""} onChange={e => setForm(p => ({ ...p, water_clarity: e.target.value }))} /></FormGroup></FormRow>
            <FormGroup><Label>Notes</Label><Input value={form.notes || ""} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></FormGroup>
            <Button type="button" className="w-full" onClick={saveMaintenance}>Save Entry</Button>
          </FormSection>
        </Modal>
      )}

      {modal === "equipment" && (
        <Modal title={form.id ? "Edit Equipment" : "Add Equipment"} onClose={() => { setModal(null); setForm({}); }}>
          <FormSection>
            <FormGroup><Label>Type</Label><SegmentedControl value={form.type || "Pump"} options={EQUIPMENT_TYPES.map(value => ({ value, label: value }))} ariaLabel="Equipment type" onValueChange={type => setForm(p => ({ ...p, type }))} /></FormGroup>
            <FormGroup><Label>Name</Label><Input value={form.name || ""} placeholder="e.g. Main pump" onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></FormGroup>
            <FormRow><FormGroup><Label>Brand</Label><Input value={form.brand || ""} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} /></FormGroup><FormGroup><Label>Model</Label><Input value={form.model || ""} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} /></FormGroup></FormRow>
            <FormRow><FormGroup><Label>Install Date</Label><Input type="date" value={form.install_date || ""} onChange={e => setForm(p => ({ ...p, install_date: e.target.value }))} /></FormGroup><FormGroup><Label>Next Maintenance</Label><Input type="date" value={form.next_maintenance || ""} onChange={e => setForm(p => ({ ...p, next_maintenance: e.target.value }))} /></FormGroup></FormRow>
            <FormGroup><Label>Manual Link</Label><Input value={form.manual_link || ""} placeholder="https://..." onChange={e => setForm(p => ({ ...p, manual_link: e.target.value }))} /></FormGroup>
            <FormGroup><Label>Warranty Notes</Label><Input value={form.warranty_notes || ""} onChange={e => setForm(p => ({ ...p, warranty_notes: e.target.value }))} /></FormGroup>
            <FormGroup><Label>Notes</Label><Input value={form.notes || ""} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></FormGroup>
            <Button type="button" className="w-full" onClick={saveEquipment}>Save Equipment</Button>
          </FormSection>
        </Modal>
      )}

      {modal === "schedule" && (
        <Modal title="Maintenance Reminder" onClose={() => { setModal(null); setForm({}); }}>
          <FormSection>
            <FormGroup><Label>Reminder</Label><SegmentedControl value={form.title || "Filter Cleaning"} options={MAINTENANCE_PRESETS.map(([label]) => ({ value: label, label }))} ariaLabel="Maintenance reminder" onValueChange={title => { const preset = MAINTENANCE_PRESETS.find(([label]) => label === title); setForm(p => ({ ...p, title, maintenance_type: title, interval_days: preset?.[1] || p.interval_days || 30 })); }} /></FormGroup>
            <FormGroup><Label>Equipment</Label><select className="flex h-11 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground" value={form.equipment_id || ""} onChange={e => setForm(p => ({ ...p, equipment_id: e.target.value }))}><option value="">None</option>{equipment.data.map(item => <option key={item.id} value={item.id}>{item.name || item.type}</option>)}</select></FormGroup>
            <FormRow><FormGroup><Label>Last Completed</Label><Input type="date" value={form.last_completed || TODAY_STR} onChange={e => setForm(p => ({ ...p, last_completed: e.target.value }))} /></FormGroup><FormGroup><Label>Every Days</Label><Input type="number" value={form.interval_days || 30} onChange={e => setForm(p => ({ ...p, interval_days: e.target.value }))} /></FormGroup></FormRow>
            <FormGroup><Label>Notes</Label><Input value={form.notes || ""} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></FormGroup>
            <Button type="button" className="w-full" onClick={saveSchedule}>Save Reminder</Button>
          </FormSection>
        </Modal>
      )}

      <Dialog open={Boolean(deleteHistoryItem)} onOpenChange={open => !open && setDeleteHistoryItem(null)}>
        <DialogContent titleId="pool-history-delete-title" onClose={() => setDeleteHistoryItem(null)}>
          <DialogHeader>
            <DialogTitle id="pool-history-delete-title">Delete pool history entry?</DialogTitle>
            <DialogDescription>This {deleteHistoryItem?.kind?.toLowerCase() || "pool"} entry will be permanently removed. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDeleteHistoryItem(null)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={confirmHistoryDelete}>Delete entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
