import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, Droplets, History, Settings2, Wrench } from "lucide-react";
import { EmptyState, Loading, Modal, SwipeCard, SwipeHint } from "../../components/common";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { FormGroup, FormRow, FormSection } from "../../components/ui/form";
import { ChipGroup, SegmentedControl } from "../../components/ui/segmented-control";
import { roleCanManage } from "../../hooks/useHouseholdCollaboration";
import { useHousehold } from "../../context/HouseholdContext";
import { TODAY_STR, daysAgo, daysBetween, formatDate, nextDueDate } from "../../lib/dates";
import { useTable } from "../../hooks/useTable";
import { maintColor, maintStatus, statusColor } from "../../utils/status";
import { COLORS, S } from "../../theme";
import { getChemRecommendations, getPoolHealth, getPoolRecommendations, POOL_RULE_CONFIG } from "./actionEngine";

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

function metric(label, value, color = COLORS.white, detail = "") {
  return (
    <div style={S.statCell(color)}>
      <div style={{ ...S.statVal, color }}>{value || "--"}</div>
      <div style={S.statLbl}>{label}</div>
      {detail && <div style={{ fontSize: 11, color: COLORS.slate, marginTop: 3 }}>{detail}</div>}
    </div>
  );
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

function swimReadiness(latest, recommendations) {
  if (!latest) return { label: "Test first", color: COLORS.amber, detail: "Log current FC and pH before swimming." };
  const blockers = recommendations.filter(rec => ["critical", "high"].includes(rec.priority));
  const fc = Number(latest.free_chlorine);
  const ph = Number(latest.ph);
  if (blockers.some(rec => ["fc-low", "fc-high", "ph-high", "ph-low", "cc-high"].includes(rec.id))) {
    return { label: "Hold swim", color: COLORS.red, detail: blockers[0]?.action || "Water needs attention first." };
  }
  if (Number.isFinite(fc) && Number.isFinite(ph) && fc >= 3 && fc <= 8 && ph >= 7.2 && ph <= 7.8) {
    return { label: "Looks swim-ready", color: COLORS.green, detail: "FC and pH are in the operating range." };
  }
  return { label: "Use caution", color: COLORS.amber, detail: "Confirm FC and pH before swimming." };
}

function recommendationCard(rec, onConfirm, editable) {
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
        <Button type="button" className="mt-3 w-full" onClick={() => onConfirm(rec)}>Confirm Action</Button>
      )}
    </div>
  );
}

export function Pool() {
  const readings = useTable("pool_readings", "logged_at");
  const treatments = useTable("pool_treatments", "logged_at");
  const maintenance = useTable("pool_maintenance", "date");
  const schedule = useTable("pool_schedule", "title", true);
  const equipment = useTable("pool_equipment", "type", true);
  const audits = useTable("pool_action_audits", "created_at");
  const household = useHousehold();
  const editable = roleCanManage(household.membership?.role);
  const [tab, setTab] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [activeSwipe, setActiveSwipe] = useState(null);
  const [historyFilter, setHistoryFilter] = useState("All");
  const [sourceMode, setSourceMode] = useState("Taylor Kit");
  const [showAdvancedTest, setShowAdvancedTest] = useState(false);

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
  const readiness = swimReadiness(latest, recommendations);
  const trends = [
    { name: "FC", ...trend(readings.data, "free_chlorine") },
    { name: "pH", ...trend(readings.data, "ph") },
    { name: "CYA", ...trend(readings.data, "cya") },
    { name: "Salt", ...trend(readings.data, "salt") },
    { name: "Temp", ...trend(readings.data, "water_temp") },
  ];
  const recentTreatment = treatments.data[0];
  const dueMaintenance = schedule.data
    .map(item => ({ ...item, status: maintStatus(item), due: item.last_completed ? nextDueDate(item.last_completed, item.interval_days) : null }))
    .sort((a, b) => ({ overdue: 0, "due-soon": 1, ok: 2 }[a.status] - { overdue: 0, "due-soon": 1, ok: 2 }[b.status]));

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
    const value = num(form[key]);
    if (form[key] === "" || form[key] === undefined || form[key] === null) return "";
    if (value === null) return "Enter a number.";
    const ranges = {
      free_chlorine: [0, 50],
      cc: [0, 20],
      ph: [6.2, 9.0],
      alkalinity: [0, 300],
      cya: [0, 200],
      salt: [0, 8000],
      water_temp: [32, 110],
      swg_setting: [0, 100],
      pump_hours: [0, 24],
      calcium_hardness: [0, 1000],
    };
    const range = ranges[key];
    if (range && (value < range[0] || value > range[1])) return `Expected ${range[0]}-${range[1]}.`;
    return "";
  }

  function openTest(row = null) {
    setForm(row ? { ...row, time: row.logged_at ? new Date(row.logged_at).toTimeString().slice(0, 5) : "" } : { date: TODAY_STR, test_source: "Taylor Kit" });
    setSourceMode(row?.test_source || "Taylor Kit");
    setModal("test");
  }

  async function saveTest() {
    const invalidFields = ["free_chlorine", "cc", "ph", "alkalinity", "cya", "salt", "water_temp", "swg_setting", "pump_hours", "calcium_hardness"].filter(key => fieldError(key));
    if (invalidFields.length) return;
    const row = {
      date: form.date || TODAY_STR,
      logged_at: dateTime(form.date || TODAY_STR, form.time),
      test_source: sourceMode,
      ph: num(form.ph),
      free_chlorine: num(form.free_chlorine),
      cc: num(form.cc),
      salt: num(form.salt),
      cya: num(form.cya),
      alkalinity: num(form.alkalinity),
      calcium_hardness: num(form.calcium_hardness),
      water_temp: num(form.water_temp),
      swg_setting: num(form.swg_setting),
      pump_hours: num(form.pump_hours),
      recent_weather_notes: form.recent_weather_notes || "",
      recent_heavy_usage: Boolean(form.recent_heavy_usage),
      notes: form.notes || "",
    };
    if (form.id) await readings.update(form.id, row);
    else await readings.insert(row);
    setModal(null); setForm({});
  }

  async function confirmAction(rec) {
    await audits.insert({
      reading_id: latest?.id || null,
      recommendation_id: rec.id,
      action: rec.action,
      explanation: rec.explanation,
      confidence: rec.confidence,
      safety_note: rec.safetyNote,
      status: "confirmed",
      created_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
    });
    setForm({ date: TODAY_STR, notes: rec.action });
    setModal(rec.category === "Equipment" ? "maintenance" : "treatment");
  }

  async function saveTreatment() {
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
      notes: form.notes || "",
    };
    if (form.id) await treatments.update(form.id, row);
    else await treatments.insert(row);
    setModal(null); setForm({});
  }

  async function saveMaintenance() {
    const row = {
      date: form.date || TODAY_STR,
      type: form.type || "Pool Note",
      equipment_id: form.equipment_id || null,
      water_clarity: form.water_clarity || "",
      notes: form.notes || "",
    };
    if (form.id) await maintenance.update(form.id, row);
    else await maintenance.insert(row);
    setModal(null); setForm({});
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
    if (form.id) await equipment.update(form.id, row);
    else await equipment.insert(row);
    setModal(null); setForm({});
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
    if (form.id) await schedule.update(form.id, row);
    else await schedule.insert(row);
    setModal(null); setForm({});
  }

  async function markScheduleDone(item) {
    await schedule.update(item.id, { ...item, last_completed: TODAY_STR });
    await maintenance.insert({ date: TODAY_STR, type: item.maintenance_type || item.title, equipment_id: item.equipment_id || null, notes: "Completed from Pool maintenance reminders." });
  }

  const loading = readings.loading || treatments.loading || maintenance.loading || schedule.loading || equipment.loading || audits.loading;

  return (
    <div style={S.screen}>
      <div style={{ ...S.statusCard(readiness.color), marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 12, color: COLORS.slate, fontWeight: 800, textTransform: "uppercase" }}>Swim Readiness</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: readiness.color, marginTop: 2 }}>{readiness.label}</div>
            <div style={{ fontSize: 14, color: COLORS.slateLight, lineHeight: 1.5, marginTop: 6 }}>{readiness.detail}</div>
          </div>
          <Droplets size={28} color={readiness.color} aria-hidden="true" />
        </div>
        <div style={{ ...S.statGrid, marginTop: 14 }}>
          {metric("Last Tested", latest ? `${daysAgo(latest.date)}d` : "--", latest && daysAgo(latest.date) <= 2 ? COLORS.green : COLORS.amber, latest ? formatDate(latest.date) : "No test")}
          {metric("Health", health.status, health.color, health.summary)}
          {metric("Salt", latest?.salt ? `${latest.salt}` : "--", statusColor(poolStatus("salt", latest?.salt)), "ppm")}
        </div>
        <div style={{ ...S.statGrid, marginTop: 10 }}>
          {metric("FC", latest?.free_chlorine, statusColor(poolStatus("free_chlorine", latest?.free_chlorine)), "ppm")}
          {metric("pH", latest?.ph, statusColor(poolStatus("ph", latest?.ph)))}
          {metric("CYA", latest?.cya, statusColor(poolStatus("cya", latest?.cya)), "ppm")}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 6, marginTop: 10 }}>
          {trends.map(item => (
            <div key={item.name} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "7px 5px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: COLORS.slate }}>{item.name}</div>
              <div style={{ fontSize: 11, color: item.color, fontWeight: 800, marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>
        {recentTreatment && <div style={{ fontSize: 12, color: COLORS.slate, marginTop: 10 }}>Last chemical: {history.find(item => item.kind === "Chemical")?.text || "Treatment logged"} on {formatDate(recentTreatment.date)}</div>}
      </div>

      <div style={{ ...S.statusCard(nextAction?.color || COLORS.blue), marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: COLORS.slate, fontWeight: 800, textTransform: "uppercase" }}>What should I do today?</div>
        <div style={{ fontSize: 18, color: COLORS.white, fontWeight: 900, lineHeight: 1.35, marginTop: 6 }}>{nextAction?.action}</div>
        <div style={{ fontSize: 14, color: COLORS.slateLight, lineHeight: 1.5, marginTop: 6 }}>{nextAction?.explanation}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <Button type="button" className="flex-1" onClick={() => openTest()} disabled={!editable}>Log Test</Button>
          <Button type="button" variant="secondary" className="flex-1" onClick={() => nextAction && confirmAction(nextAction)} disabled={!editable || !nextAction || nextAction.priority === "low"}>Confirm</Button>
        </div>
        {!editable && <div style={{ fontSize: 12, color: COLORS.slate, marginTop: 10 }}>Viewer access is read-only for Pool actions.</div>}
      </div>

      <div style={S.tabs}>
        {[
          ["dashboard", ClipboardList],
          ["history", History],
          ["equipment", Wrench],
          ["maintenance", Settings2],
        ].map(([id, Icon]) => (
          <button key={id} style={S.tabBtn(tab === id)} onClick={() => setTab(id)}>
            <Icon size={14} aria-hidden="true" style={{ display: "inline", marginRight: 4, verticalAlign: "-2px" }} />{id === "dashboard" ? "actions" : id}
          </button>
        ))}
      </div>

      {loading ? <Loading /> : (
        <>
          {tab === "dashboard" && (
            <>
              {recommendations.map(rec => recommendationCard(rec, confirmAction, editable))}
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
              <SwipeHint />
              {Object.entries(groupedHistory).map(([date, items]) => (
                <section key={date} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: COLORS.slate, fontWeight: 900, textTransform: "uppercase", margin: "8px 0" }}>{formatDate(date)}</div>
                  {items.map(item => (
                    <SwipeCard key={`${item.kind}-${item.id}`} id={`${item.kind}-${item.id}`} activeId={activeSwipe} setActiveId={setActiveSwipe}
                      onEdit={() => {
                        setForm({ ...item });
                        setModal(item.kind === "Reading" ? "test" : item.kind === "Chemical" ? "treatment" : "maintenance");
                      }}
                      onDelete={() => {
                        if (item.kind === "Reading") readings.remove(item.id);
                        else if (item.kind === "Chemical") treatments.remove(item.id);
                        else maintenance.remove(item.id);
                        setActiveSwipe(null);
                      }}
                      style={S.card}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 13, color: item.kind === "Chemical" ? COLORS.amber : item.kind === "Reading" ? COLORS.blue : COLORS.green, fontWeight: 800 }}>{item.kind}</div>
                          <div style={{ fontSize: 15, color: COLORS.white, fontWeight: 800, marginTop: 3 }}>{item.text}</div>
                          {item.notes && <div style={{ fontSize: 13, color: COLORS.slate, lineHeight: 1.45, marginTop: 5 }}>{item.notes}</div>}
                        </div>
                        {item.kind === "Reading" && <div style={{ fontSize: 12, color: COLORS.slate, whiteSpace: "nowrap" }}>FC {item.free_chlorine ?? "--"} / pH {item.ph ?? "--"}</div>}
                      </div>
                    </SwipeCard>
                  ))}
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
                  onDelete={() => { equipment.remove(item.id); setActiveSwipe(null); }}
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
            </>
          )}
        </>
      )}

      {modal === "test" && (
        <Modal title={form.id ? "Edit Pool Test" : "Log Pool Test"} onClose={() => { setModal(null); setForm({}); }}>
          <FormSection>
            <FormRow><FormGroup><Label>Date</Label><Input type="date" value={form.date || TODAY_STR} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></FormGroup><FormGroup><Label>Time</Label><Input type="time" value={form.time || new Date().toTimeString().slice(0, 5)} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} /></FormGroup></FormRow>
            <FormGroup><Label>Test Source</Label><SegmentedControl value={sourceMode} options={TEST_SOURCES.map(value => ({ value, label: value }))} ariaLabel="Test source" onValueChange={setSourceMode} /></FormGroup>
            <FormRow>
              <FormGroup><Label>FC ppm</Label><Input type="number" min="0" max="50" step="0.5" value={form.free_chlorine ?? ""} onChange={e => setForm(p => ({ ...p, free_chlorine: e.target.value }))} />{fieldError("free_chlorine") && <div style={{ fontSize: 12, color: COLORS.red }}>{fieldError("free_chlorine")}</div>}</FormGroup>
              <FormGroup><Label>pH</Label><Input type="number" min="6.2" max="9" step="0.1" value={form.ph ?? ""} onChange={e => setForm(p => ({ ...p, ph: e.target.value }))} />{fieldError("ph") && <div style={{ fontSize: 12, color: COLORS.red }}>{fieldError("ph")}</div>}</FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup><Label>CYA ppm</Label><Input type="number" min="0" max="200" value={form.cya ?? ""} onChange={e => setForm(p => ({ ...p, cya: e.target.value }))} />{fieldError("cya") && <div style={{ fontSize: 12, color: COLORS.red }}>{fieldError("cya")}</div>}</FormGroup>
              <FormGroup><Label>Salt ppm</Label><Input type="number" min="0" max="8000" value={form.salt ?? ""} onChange={e => setForm(p => ({ ...p, salt: e.target.value }))} />{fieldError("salt") && <div style={{ fontSize: 12, color: COLORS.red }}>{fieldError("salt")}</div>}</FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup><Label>CC ppm</Label><Input type="number" min="0" max="20" step="0.5" value={form.cc ?? ""} onChange={e => setForm(p => ({ ...p, cc: e.target.value }))} />{fieldError("cc") && <div style={{ fontSize: 12, color: COLORS.red }}>{fieldError("cc")}</div>}</FormGroup>
              <FormGroup><Label>TA ppm</Label><Input type="number" min="0" max="300" value={form.alkalinity ?? ""} onChange={e => setForm(p => ({ ...p, alkalinity: e.target.value }))} />{fieldError("alkalinity") && <div style={{ fontSize: 12, color: COLORS.red }}>{fieldError("alkalinity")}</div>}</FormGroup>
            </FormRow>
            <button type="button" className="flex w-full items-center justify-between rounded-lg border border-border bg-secondary px-3 py-3 text-left text-sm font-semibold" onClick={() => setShowAdvancedTest(value => !value)}>
              <span>Advanced test details</span><span style={{ color: COLORS.slate }}>{showAdvancedTest ? "Hide" : "Show"}</span>
            </button>
            {showAdvancedTest && (
              <>
                <FormRow><FormGroup><Label>Water Temp F</Label><Input type="number" min="32" max="110" value={form.water_temp ?? ""} onChange={e => setForm(p => ({ ...p, water_temp: e.target.value }))} />{fieldError("water_temp") && <div style={{ fontSize: 12, color: COLORS.red }}>{fieldError("water_temp")}</div>}</FormGroup><FormGroup><Label>SWG %</Label><Input type="number" min="0" max="100" value={form.swg_setting ?? ""} onChange={e => setForm(p => ({ ...p, swg_setting: e.target.value }))} />{fieldError("swg_setting") && <div style={{ fontSize: 12, color: COLORS.red }}>{fieldError("swg_setting")}</div>}</FormGroup></FormRow>
                <FormRow><FormGroup><Label>Pump Runtime</Label><Input type="number" min="0" max="24" value={form.pump_hours ?? ""} onChange={e => setForm(p => ({ ...p, pump_hours: e.target.value }))} />{fieldError("pump_hours") && <div style={{ fontSize: 12, color: COLORS.red }}>{fieldError("pump_hours")}</div>}</FormGroup><FormGroup><Label>Calcium ppm</Label><Input type="number" min="0" max="1000" value={form.calcium_hardness ?? ""} onChange={e => setForm(p => ({ ...p, calcium_hardness: e.target.value }))} />{fieldError("calcium_hardness") && <div style={{ fontSize: 12, color: COLORS.red }}>{fieldError("calcium_hardness")}</div>}</FormGroup></FormRow>
                <FormGroup><Label>Recent Weather</Label><Input value={form.recent_weather_notes || ""} placeholder="Heat, rain, storms..." onChange={e => setForm(p => ({ ...p, recent_weather_notes: e.target.value }))} /></FormGroup>
                <button type="button" className="flex w-full items-center gap-3 rounded-lg border border-border bg-secondary px-3 py-3 text-left text-sm font-semibold" onClick={() => setForm(p => ({ ...p, recent_heavy_usage: !p.recent_heavy_usage }))}><span className={`h-5 w-5 rounded-md border ${form.recent_heavy_usage ? "border-primary bg-primary" : "border-muted-foreground"}`} />Recent heavy usage or party</button>
              </>
            )}
            <FormGroup><Label>Notes</Label><Input value={form.notes || ""} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></FormGroup>
            <Button type="button" className="w-full" onClick={saveTest}>Save Test</Button>
          </FormSection>
        </Modal>
      )}

      {modal === "treatment" && (
        <Modal title="Chemical Added" onClose={() => { setModal(null); setForm({}); }}>
          <FormSection>
            <FormRow><FormGroup><Label>Date</Label><Input type="date" value={form.date || TODAY_STR} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></FormGroup><FormGroup><Label>Time</Label><Input type="time" value={form.time || new Date().toTimeString().slice(0, 5)} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} /></FormGroup></FormRow>
            <FormRow><FormGroup><Label>Muriatic Acid (oz)</Label><Input type="number" value={form.muriatic_acid_oz || ""} onChange={e => setForm(p => ({ ...p, muriatic_acid_oz: e.target.value }))} /></FormGroup><FormGroup><Label>Salt (lb)</Label><Input type="number" value={form.salt_lbs || ""} onChange={e => setForm(p => ({ ...p, salt_lbs: e.target.value }))} /></FormGroup></FormRow>
            <FormRow><FormGroup><Label>CYA (oz)</Label><Input type="number" value={form.cya_oz || ""} onChange={e => setForm(p => ({ ...p, cya_oz: e.target.value }))} /></FormGroup><FormGroup><Label>Chlorine (oz)</Label><Input type="number" value={form.liquid_chlorine_oz || ""} onChange={e => setForm(p => ({ ...p, liquid_chlorine_oz: e.target.value }))} /></FormGroup></FormRow>
            <FormRow><FormGroup><Label>SWG Before</Label><Input type="number" value={form.swg_pct_before || ""} onChange={e => setForm(p => ({ ...p, swg_pct_before: e.target.value }))} /></FormGroup><FormGroup><Label>SWG After</Label><Input type="number" value={form.swg_pct_after || ""} onChange={e => setForm(p => ({ ...p, swg_pct_after: e.target.value }))} /></FormGroup></FormRow>
            <FormGroup><Label>Water Clarity</Label><Input value={form.water_clarity || ""} placeholder="Clear, cloudy, green tint..." onChange={e => setForm(p => ({ ...p, water_clarity: e.target.value }))} /></FormGroup>
            <FormGroup><Label>Notes</Label><Input value={form.notes || ""} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></FormGroup>
            <Button type="button" className="w-full" onClick={saveTreatment}>Save Chemical Entry</Button>
          </FormSection>
        </Modal>
      )}

      {modal === "maintenance" && (
        <Modal title="Maintenance or Pool Note" onClose={() => { setModal(null); setForm({}); }}>
          <FormSection>
            <FormGroup><Label>Date</Label><Input type="date" value={form.date || TODAY_STR} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></FormGroup>
            <FormGroup><Label>Type</Label><Input value={form.type || ""} placeholder="Filter cleaning, pool party, weather note..." onChange={e => setForm(p => ({ ...p, type: e.target.value }))} /></FormGroup>
            <FormGroup><Label>Equipment</Label><select className="flex h-11 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground" value={form.equipment_id || ""} onChange={e => setForm(p => ({ ...p, equipment_id: e.target.value }))}><option value="">None</option>{equipment.data.map(item => <option key={item.id} value={item.id}>{item.name || item.type}</option>)}</select></FormGroup>
            <FormGroup><Label>Water Clarity</Label><Input value={form.water_clarity || ""} onChange={e => setForm(p => ({ ...p, water_clarity: e.target.value }))} /></FormGroup>
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
    </div>
  );
}
