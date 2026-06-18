import { useState, useEffect, useCallback } from "react";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
// 1. Go to https://supabase.com → New Project
// 2. Run familyos_schema.sql in the SQL Editor
// 3. Paste your Project URL and anon key below
const SUPABASE_URL = "https://dsowansazqleudupnjug.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3dhbnNhenFsZXVkdXBuanVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MTkzMTYsImV4cCI6MjA5NzE5NTMxNn0.lO3QE01JzvPAaGDVVW9bbeKgnJHMdDNT667KZXLwSXk";

// Lightweight Supabase REST client — no npm needed
const sb = {
  from: (table) => ({
    _table: table,
    _order: null,
    _eq: null,
    order(col, { ascending = true } = {}) { this._order = `${col}.${ascending ? "asc" : "desc"}`; return this; },
    eq(col, val) { this._eq = `${col}=eq.${val}`; return this; },
    async select(cols = "*") {
      const params = new URLSearchParams({ select: cols });
      if (this._order) params.set("order", this._order);
      if (this._eq) params.append(this._eq.split("=")[0], this._eq.split("=")[1]);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${this._table}?${params}`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      const data = await res.json();
      return { data, error: res.ok ? null : data };
    },
    async insert(row) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${this._table}`, {
        method: "POST",
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(row),
      });
      const data = await res.json();
      return { data: Array.isArray(data) ? data[0] : data, error: res.ok ? null : data };
    },
    async update(row) {
      if (!this._eq) throw new Error("update() requires .eq()");
      const [col, val] = this._eq.split("=eq.");
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${this._table}?${col}=eq.${val}`, {
        method: "PATCH",
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(row),
      });
      const data = await res.json();
      return { data: Array.isArray(data) ? data[0] : data, error: res.ok ? null : data };
    },
    async delete() {
      if (!this._eq) throw new Error("delete() requires .eq()");
      const [col, val] = this._eq.split("=eq.");
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${this._table}?${col}=eq.${val}`, {
        method: "DELETE",
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      return { error: res.ok ? null : await res.json() };
    },
  }),
};

const IS_CONFIGURED = SUPABASE_URL !== "https://dsowansazqleudupnjug.supabase.co";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const COLORS = {
  navy: "#0F1729", navyMid: "#1A2540", navyLight: "#243352",
  slate: "#8892A4", slateLight: "#B8C0CC", white: "#F7F8FA",
  red: "#E05252", amber: "#F0A030", green: "#3DB87A", blue: "#4A90D9", purple: "#8B6FD4",
};

const MEMBER_COLORS = {
  Matt: "#4A90D9", Wife: "#8B6FD4", Emma: "#E05252", Jake: "#3DB87A", Ryan: "#F0A030",
};

// ─── Fallback seed data (used when Supabase not configured) ───────────────────
const SEED = {
  pool_readings: [
    { id: "1", date: "2026-06-14", ph: 7.4, free_chlorine: 3.0, salt: 3300, cya: 70, alkalinity: 95, water_temp: 84, swg_setting: 60, notes: "" },
    { id: "2", date: "2026-06-11", ph: 7.2, free_chlorine: 1.8, salt: 3250, cya: 68, alkalinity: 88, water_temp: 82, swg_setting: 65, notes: "Added chlorine" },
    { id: "3", date: "2026-06-08", ph: 7.6, free_chlorine: 3.5, salt: 3300, cya: 72, alkalinity: 102, water_temp: 80, swg_setting: 60, notes: "" },
    { id: "4", date: "2026-06-05", ph: 7.3, free_chlorine: 2.8, salt: 3280, cya: 69, alkalinity: 91, water_temp: 79, swg_setting: 60, notes: "" },
  ],
  pool_maintenance: [
    { id: "1", date: "2026-06-13", type: "Brushed walls & floor", notes: "" },
    { id: "2", date: "2026-06-10", type: "Cleaned skimmer basket", notes: "" },
    { id: "3", date: "2026-06-06", type: "Backwashed filter", notes: "" },
  ],
  home_maintenance: [
    { id: "1", title: "HVAC Filter", last_completed: "2026-03-01", interval_days: 90, notes: "16x25x1 filter" },
    { id: "2", title: "Pool Filter Backwash", last_completed: "2026-06-06", interval_days: 14, notes: "" },
    { id: "3", title: "Gutter Cleaning", last_completed: "2026-04-15", interval_days: 90, notes: "" },
    { id: "4", title: "Smoke Detector Test", last_completed: "2026-01-01", interval_days: 180, notes: "" },
    { id: "5", title: "Water Heater Flush", last_completed: "2025-12-01", interval_days: 365, notes: "" },
    { id: "6", title: "Dryer Vent Clean", last_completed: "2026-01-15", interval_days: 180, notes: "" },
  ],
  college_schools: [
    { id: "1", name: "University of Virginia", status: "researching" },
    { id: "2", name: "Wake Forest University", status: "researching" },
    { id: "3", name: "University of Richmond", status: "target" },
    { id: "4", name: "James Madison University", status: "target" },
  ],
  college_deadlines: [
    { id: "1", title: "SAT Registration — August Test", due_date: "2026-06-20", school: "", category: "test", completed: false },
    { id: "2", title: "Common App Account Setup", due_date: "2026-07-01", school: "Common App", category: "application", completed: false },
    { id: "3", title: "UVA Campus Visit", due_date: "2026-07-15", school: "University of Virginia", category: "visit", completed: false },
    { id: "4", title: "Junior Year Transcript Request", due_date: "2026-08-01", school: "", category: "application", completed: false },
    { id: "5", title: "SAT Exam Date", due_date: "2026-08-23", school: "", category: "test", completed: false },
  ],
  sat_scores: [
    { id: "1", date: "2026-03-08", total: 1280, math: 640, verbal: 640, notes: "PSAT — strong baseline" },
  ],
};

const EVENTS = [
  { id: 1, title: "Emma — Dance Recital", date: "2026-06-17", time: "6:00 PM", member: "Emma", location: "Performing Arts Center" },
  { id: 2, title: "Jake — Baseball Practice", date: "2026-06-17", time: "4:30 PM", member: "Jake", location: "Community Field" },
  { id: 3, title: "Ryan — Soccer Game", date: "2026-06-18", time: "10:00 AM", member: "Ryan", location: "Sports Complex" },
  { id: 4, title: "Dentist — Emma & Jake", date: "2026-06-19", time: "2:00 PM", member: "Emma", location: "Dr. Smith Dental" },
  { id: 5, title: "Emma — Dance Practice", date: "2026-06-19", time: "5:00 PM", member: "Emma", location: "Dance Studio" },
  { id: 6, title: "Family Dinner — Grandparents", date: "2026-06-21", time: "", member: "Matt", location: "" },
  { id: 7, title: "Jake — Baseball Game", date: "2026-06-22", time: "1:00 PM", member: "Jake", location: "Community Field" },
  { id: 8, title: "Ryan — Soccer Practice", date: "2026-06-23", time: "4:00 PM", member: "Ryan", location: "Sports Complex" },
  { id: 9, title: "Emma — SAT Prep Class", date: "2026-06-24", time: "9:00 AM", member: "Emma", location: "Test Prep Center" },
  { id: 10, title: "HOA Meeting", date: "2026-06-25", time: "7:00 PM", member: "Matt", location: "Clubhouse" },
];

// ─── Utilities ────────────────────────────────────────────────────────────────
const TODAY_STR = "2026-06-16";
const today = new Date(TODAY_STR + "T12:00:00");

function daysBetween(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return Math.round((d - today) / (1000 * 60 * 60 * 24));
}
function daysAgo(dateStr) { return -daysBetween(dateStr); }
function nextDueDate(last, interval) {
  const d = new Date(last + "T12:00:00");
  d.setDate(d.getDate() + interval);
  return d.toISOString().split("T")[0];
}
function formatDate(s) {
  return new Date(s + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function formatDateFull(s) {
  return new Date(s + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// Pentair-specific ranges (updated from generic)
function poolStatus(param, value) {
  const ranges = {
    ph:            { low: 7.2, goodHigh: 7.6, high: 7.8 },
    free_chlorine: { low: 1.5, goodHigh: 4.0, high: 5.0 },
    salt:          { low: 3200, goodHigh: 3600, high: 3800 }, // Pentair IntelliChlor range
    cya:           { low: 50,  goodHigh: 80,  high: 90  },
    alkalinity:    { low: 80,  goodHigh: 120, high: 140 },
  };
  const r = ranges[param];
  if (!r) return "green";
  if (value < r.low || value > r.high) return "red";
  if (value <= r.goodHigh) return "green";
  return "amber";
}
function statusColor(s) {
  return s === "red" ? COLORS.red : s === "amber" ? COLORS.amber : COLORS.green;
}
function maintStatus(item) {
  const days = daysBetween(nextDueDate(item.last_completed, item.interval_days));
  if (days < 0) return "overdue";
  if (days <= 7) return "due-soon";
  return "ok";
}
function maintColor(s) {
  return s === "overdue" ? COLORS.red : s === "due-soon" ? COLORS.amber : COLORS.green;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  app: { background: COLORS.navy, minHeight: "100vh", maxWidth: 430, margin: "0 auto", fontFamily: "'Inter', system-ui, sans-serif", color: COLORS.white, position: "relative", paddingBottom: 84 },
  header: { background: COLORS.navyMid, padding: "16px 20px 12px", borderBottom: `1px solid ${COLORS.navyLight}`, position: "sticky", top: 0, zIndex: 10 },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  logo: { fontSize: 18, fontWeight: 700, letterSpacing: "-0.5px" },
  logoAccent: { color: COLORS.blue },
  dateLabel: { fontSize: 12, color: COLORS.slate, marginTop: 2 },
  screen: { padding: "20px 16px" },
  sectionLabel: { fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", color: COLORS.slate, textTransform: "uppercase", marginBottom: 10, marginTop: 24 },
  card: { background: COLORS.navyMid, borderRadius: 12, padding: "14px 16px", marginBottom: 10, border: `1px solid ${COLORS.navyLight}` },
  statusCard: (color) => ({ background: COLORS.navyMid, borderRadius: 12, padding: "14px 16px", marginBottom: 10, border: `1px solid ${COLORS.navyLight}`, borderLeft: `3px solid ${color}` }),
  badge: (color) => ({ display: "inline-block", background: color + "22", color, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
  memberDot: (member) => ({ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: MEMBER_COLORS[member] || COLORS.slate, marginRight: 6 }),
  btn: { background: COLORS.blue, color: "#fff", border: "none", borderRadius: 8, padding: "11px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%", marginTop: 12 },
  btnSm: { background: COLORS.navyLight, color: COLORS.slateLight, border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 },
  btnGreen: { background: COLORS.green + "22", color: COLORS.green, border: `1px solid ${COLORS.green}44`, borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 },
  input: { background: COLORS.navyLight, border: `1px solid ${COLORS.navyLight}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, color: COLORS.white, width: "100%", boxSizing: "border-box", outline: "none", marginBottom: 10 },
  label: { fontSize: 11, color: COLORS.slate, marginBottom: 4, display: "block", fontWeight: 600 },
  row: { display: "flex", gap: 10 },
  col: { flex: 1 },
  statGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 },
  statCell: (color) => ({ background: COLORS.navyMid, border: `1px solid ${COLORS.navyLight}`, borderTop: `3px solid ${color}`, borderRadius: 8, padding: "10px 8px", textAlign: "center" }),
  statVal: { fontSize: 17, fontWeight: 700 },
  statLbl: { fontSize: 10, color: COLORS.slate, marginTop: 2 },
  statTarget: { fontSize: 9, color: COLORS.slate, marginTop: 1 },
  nav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: COLORS.navyMid, borderTop: `1px solid ${COLORS.navyLight}`, display: "flex", zIndex: 20 },
  navItem: (a) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0 8px", cursor: "pointer", background: "transparent", border: "none", color: a ? COLORS.blue : COLORS.slate, fontSize: 10, fontWeight: a ? 700 : 500, gap: 4 }),
  modal: { position: "fixed", inset: 0, background: "#000b", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  sheet: { background: COLORS.navyMid, borderRadius: "16px 16px 0 0", padding: "20px 20px 48px", width: "100%", maxWidth: 430, maxHeight: "90vh", overflowY: "auto" },
  sheetTitle: { fontSize: 17, fontWeight: 700, marginBottom: 18 },
  chip: (a, c) => ({ display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${a ? c : COLORS.navyLight}`, background: a ? c + "22" : "transparent", color: a ? c : COLORS.slate, marginRight: 6, marginBottom: 6 }),
  tabs: { display: "flex", background: COLORS.navyMid, borderRadius: 10, padding: 3, marginBottom: 16, border: `1px solid ${COLORS.navyLight}` },
  tabBtn: (a) => ({ flex: 1, border: "none", borderRadius: 8, padding: "8px 0", cursor: "pointer", background: a ? COLORS.blue : "transparent", color: a ? "#fff" : COLORS.slate, fontSize: 12, fontWeight: 700, textTransform: "capitalize", transition: "all 0.15s" }),
  empty: { textAlign: "center", padding: "40px 20px", color: COLORS.slate, fontSize: 14 },
  progress: { height: 3, background: COLORS.navyLight, borderRadius: 2, marginTop: 8, overflow: "hidden" },
  progressFill: (pct, color) => ({ height: "100%", width: `${Math.min(100, Math.max(0, pct))}%`, background: color, borderRadius: 2 }),
  setupBanner: { background: COLORS.amber + "18", border: `1px solid ${COLORS.amber}44`, borderRadius: 12, padding: "14px 16px", marginBottom: 16 },
  loadingDot: { display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: COLORS.slate, margin: "0 2px", animation: "pulse 1.4s infinite" },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const I = {
  home:     (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  cal:      (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  college:  (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  house:    (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>,
  pool:     (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round"><path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="10"/></svg>,
  close:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  refresh:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.5 15a9 9 0 11-2.8-6.4L23 10"/></svg>,
};

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const W = 64, H = 24;
  const pts = data.map((v, i) => `${(i/(data.length-1))*W},${H-((v-min)/range)*H}`).join(" ");
  return <svg width={W} height={H}><polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={S.modal} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.sheet}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <div style={S.sheetTitle}>{title}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:COLORS.slate, cursor:"pointer", padding:4 }}>{I.close()}</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Loading ──────────────────────────────────────────────────────────────────
function Loading() {
  return <div style={S.empty}><div>Loading…</div></div>;
}

// ─── Setup Banner ─────────────────────────────────────────────────────────────
function SetupBanner() {
  return (
    <div style={S.setupBanner}>
      <div style={{ fontSize:13, fontWeight:700, color:COLORS.amber, marginBottom:4 }}>⚡ Demo Mode — Data not saved</div>
      <div style={{ fontSize:12, color:COLORS.slateLight, lineHeight:1.5 }}>
        Add your Supabase URL and anon key at the top of FamilyOS.jsx to enable persistence. See the setup guide below.
      </div>
    </div>
  );
}

// ─── Data hook ────────────────────────────────────────────────────────────────
function useTable(table, orderCol, orderAsc = false) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!IS_CONFIGURED) { setData(SEED[table]); setLoading(false); return; }
    setLoading(true);
    const { data: rows, error } = await sb.from(table).order(orderCol, { ascending: orderAsc }).select();
    if (!error) setData(rows);
    setLoading(false);
  }, [table, orderCol, orderAsc]);

  useEffect(() => { load(); }, [load]);

  async function insert(row) {
    if (!IS_CONFIGURED) {
      const newRow = { ...row, id: String(Date.now()) };
      setData(prev => orderAsc ? [...(prev||[]), newRow] : [newRow, ...(prev||[])]);
      return newRow;
    }
    const { data: newRow, error } = await sb.from(table).insert(row);
    if (!error) await load();
    return newRow;
  }

  async function update(id, row) {
    if (!IS_CONFIGURED) {
      setData(prev => prev.map(r => r.id === id ? { ...r, ...row } : r));
      return;
    }
    await sb.from(table).eq("id", id).update(row);
    await load();
  }

  async function remove(id) {
    if (!IS_CONFIGURED) {
      setData(prev => prev.filter(r => r.id !== id));
      return;
    }
    await sb.from(table).eq("id", id).delete();
    await load();
  }

  return { data: data || [], loading, reload: load, insert, update, remove };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ onNavigate }) {
  const { data: poolReadings } = useTable("pool_readings", "date");
  const { data: homeMaint } = useTable("home_maintenance", "title", true);
  const { data: deadlines } = useTable("college_deadlines", "due_date", true);

  const lastReading = poolReadings[0];
  const daysSincePool = lastReading ? daysAgo(lastReading.date) : 999;
  const overdueItems = homeMaint.filter(m => maintStatus(m) === "overdue");
  const urgentDeadlines = deadlines.filter(d => !d.completed && daysBetween(d.due_date) <= 14);
  const thisWeek = EVENTS.filter(e => { const d = daysBetween(e.date); return d >= 0 && d <= 6; });
  const todayEvents = thisWeek.filter(e => e.date === TODAY_STR);
  const upcomingEvents = thisWeek.filter(e => e.date !== TODAY_STR);

  const attention = [];
  if (daysSincePool >= 4) attention.push({ color: COLORS.amber, icon:"🏊", text:`Pool not logged in ${daysSincePool} days`, action:"Log Now", tab:"pool" });
  overdueItems.forEach(m => {
    const days = -daysBetween(nextDueDate(m.last_completed, m.interval_days));
    attention.push({ color: COLORS.red, icon:"🏡", text:`${m.title} overdue by ${days} days`, action:"View", tab:"home-mgmt" });
  });
  urgentDeadlines.forEach(d => {
    const days = daysBetween(d.due_date);
    attention.push({ color: days <= 4 ? COLORS.red : COLORS.amber, icon:"🎓", text:`${d.title} — ${days === 0 ? "Today" : days < 0 ? `${-days}d overdue` : `${days}d`}`, action:"View", tab:"college" });
  });

  return (
    <div style={S.screen}>
      {!IS_CONFIGURED && <SetupBanner />}

      {/* Headline */}
      <div style={{ ...S.card, background: COLORS.navyLight, borderColor: COLORS.blue+"44" }}>
        <div style={{ fontSize:11, color:COLORS.blue, fontWeight:700, letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:6 }}>Week of June 16</div>
        <div style={{ fontSize:20, fontWeight:700, lineHeight:1.2 }}>{attention.length} item{attention.length!==1?"s":""} need your attention</div>
        <div style={{ fontSize:13, color:COLORS.slate, marginTop:4 }}>{thisWeek.length} events · {urgentDeadlines.length} deadline{urgentDeadlines.length!==1?"s":""} approaching</div>
      </div>

      {/* Attention */}
      {attention.length > 0 && <>
        <div style={S.sectionLabel}>Needs Attention</div>
        {attention.map((a, i) => (
          <div key={i} style={S.statusCard(a.color)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:13, fontWeight:600, flex:1, paddingRight:10 }}>{a.icon} {a.text}</div>
              <button style={S.btnSm} onClick={() => onNavigate(a.tab)}>{a.action} →</button>
            </div>
          </div>
        ))}
      </>}

      {/* Today */}
      {todayEvents.length > 0 && <>
        <div style={S.sectionLabel}>Today</div>
        {todayEvents.map(e => (
          <div key={e.id} style={{ ...S.card, borderLeft:`3px solid ${MEMBER_COLORS[e.member]||COLORS.slate}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div><span style={S.memberDot(e.member)}/><span style={{ fontSize:14, fontWeight:600 }}>{e.title}</span>
                <div style={{ fontSize:12, color:COLORS.slate, marginTop:2 }}>{e.time}{e.location ? ` · ${e.location}`:""}</div>
              </div>
              <span style={S.badge(MEMBER_COLORS[e.member]||COLORS.slate)}>{e.member}</span>
            </div>
          </div>
        ))}
      </>}

      {/* This week */}
      {upcomingEvents.length > 0 && <>
        <div style={S.sectionLabel}>This Week</div>
        {upcomingEvents.map(e => (
          <div key={e.id} style={{ ...S.card, borderLeft:`3px solid ${MEMBER_COLORS[e.member]||COLORS.slate}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div><span style={S.memberDot(e.member)}/><span style={{ fontSize:14, fontWeight:600 }}>{e.title}</span>
                <div style={{ fontSize:12, color:COLORS.slate, marginTop:2 }}>{formatDateFull(e.date)}{e.time?` · ${e.time}`:""}</div>
              </div>
              <span style={S.badge(MEMBER_COLORS[e.member]||COLORS.slate)}>{e.member}</span>
            </div>
          </div>
        ))}
      </>}

      {/* Pool snapshot */}
      {lastReading && <>
        <div style={S.sectionLabel}>Pool — Last Reading {formatDate(lastReading.date)}</div>
        <div style={S.statGrid}>
          {[{k:"ph",l:"pH"},{k:"free_chlorine",l:"Cl"},{k:"salt",l:"Salt"}].map(({k,l}) => {
            const s = poolStatus(k, lastReading[k]);
            return (
              <div key={k} style={S.statCell(statusColor(s))}>
                <div style={S.statVal}>{lastReading[k]}</div>
                <div style={S.statLbl}>{l}</div>
              </div>
            );
          })}
        </div>
      </>}
    </div>
  );
}

// ─── Schedule ─────────────────────────────────────────────────────────────────
function Schedule() {
  const [filter, setFilter] = useState("All");
  const members = ["All","Emma","Jake","Ryan","Matt","Wife"];
  const days = Array.from({length:14},(_,i) => {
    const d = new Date(today); d.setDate(d.getDate()+i); return d.toISOString().split("T")[0];
  });
  const filtered = EVENTS.filter(e => filter==="All"||e.member===filter);

  return (
    <div style={S.screen}>
      <div style={{ marginBottom:16 }}>
        {members.map(m => <span key={m} style={S.chip(filter===m, MEMBER_COLORS[m]||COLORS.blue)} onClick={()=>setFilter(m)}>{m}</span>)}
      </div>
      {days.map(day => {
        const evs = filtered.filter(e => e.date===day);
        if (!evs.length) return null;
        const isToday = day===TODAY_STR;
        const label = isToday ? "Today" : formatDateFull(day);
        return (
          <div key={day}>
            <div style={{ ...S.sectionLabel, color:isToday?COLORS.blue:COLORS.slate }}>{label}</div>
            {evs.map(e => (
              <div key={e.id} style={{ ...S.card, borderLeft:`3px solid ${MEMBER_COLORS[e.member]||COLORS.slate}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:600 }}>{e.title}</div>
                    <div style={{ fontSize:12, color:COLORS.slate, marginTop:3 }}>{e.time||"All day"}{e.location?` · ${e.location}`:""}</div>
                  </div>
                  <span style={S.badge(MEMBER_COLORS[e.member]||COLORS.slate)}>{e.member}</span>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── College ──────────────────────────────────────────────────────────────────
function College() {
  const [tab, setTab] = useState("deadlines");
  const deadlines = useTable("college_deadlines", "due_date", true);
  const schools = useTable("college_schools", "name", true);
  const scores = useTable("sat_scores", "date");
  const [showModal, setShowModal] = useState(null);
  const [form, setForm] = useState({});

  const catColor = { test:COLORS.purple, application:COLORS.blue, visit:COLORS.green, other:COLORS.slate };
  const statusColors = { researching:COLORS.slate, target:COLORS.blue, applying:COLORS.amber, applied:COLORS.purple, accepted:COLORS.green, rejected:COLORS.red };

  const pending = deadlines.data.filter(d=>!d.completed).sort((a,b)=>new Date(a.due_date)-new Date(b.due_date));
  const done = deadlines.data.filter(d=>d.completed);

  async function saveDeadline() {
    if (!form.title||!form.due_date) return;
    await deadlines.insert({ title:form.title, due_date:form.due_date, school:form.school||"", category:form.category||"other", completed:false });
    setForm({}); setShowModal(null);
  }
  async function saveSchool() {
    if (!form.name) return;
    await schools.insert({ name:form.name, status:form.status||"researching" });
    setForm({}); setShowModal(null);
  }
  async function saveScore() {
    if (!form.date||!form.total) return;
    await scores.insert({ date:form.date, total:+form.total, math:+form.math||0, verbal:+form.verbal||0, notes:form.notes||"" });
    setForm({}); setShowModal(null);
  }

  return (
    <div style={S.screen}>
      <div style={{ ...S.card, background:COLORS.navyLight, borderLeft:`3px solid ${MEMBER_COLORS.Emma}`, marginBottom:16 }}>
        <div style={{ fontSize:11, color:COLORS.red, fontWeight:700, letterSpacing:"0.8px", textTransform:"uppercase" }}>Emma · Class of 2028</div>
        <div style={{ fontSize:16, fontWeight:700, marginTop:2 }}>Junior Year — College Planning</div>
        <div style={{ fontSize:12, color:COLORS.slate, marginTop:4 }}>
          {schools.data.filter(s=>s.status==="target"||s.status==="applying").length} target schools · {pending.length} open deadlines
        </div>
      </div>

      <div style={S.tabs}>
        {["deadlines","schools","scores"].map(t => <button key={t} style={S.tabBtn(tab===t)} onClick={()=>setTab(t)}>{t}</button>)}
      </div>

      {tab==="deadlines" && <>
        {deadlines.loading ? <Loading/> : <>
          {pending.map(d => {
            const days = daysBetween(d.due_date);
            return (
              <div key={d.id} style={S.statusCard(days<=7?COLORS.red:days<=14?COLORS.amber:COLORS.blue)}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ flex:1, paddingRight:10 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{d.title}</div>
                    {d.school && <div style={{ fontSize:11, color:COLORS.slate, marginTop:2 }}>{d.school}</div>}
                    <div style={{ display:"flex", gap:6, marginTop:6, alignItems:"center" }}>
                      <span style={S.badge(catColor[d.category]||COLORS.slate)}>{d.category}</span>
                      <span style={{ fontSize:11, color:days<=7?COLORS.red:COLORS.slate, fontWeight:600 }}>
                        {days===0?"Today":days<0?`${-days}d overdue`:`${days}d`}
                      </span>
                    </div>
                  </div>
                  <button style={S.btnGreen} onClick={()=>deadlines.update(d.id,{completed:true})}>Done ✓</button>
                </div>
              </div>
            );
          })}
          {done.length > 0 && <>
            <div style={{ ...S.sectionLabel, marginTop:20 }}>Completed</div>
            {done.map(d => (
              <div key={d.id} style={{ ...S.card, opacity:0.5 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontSize:13, textDecoration:"line-through", color:COLORS.slate }}>{d.title}</div>
                  <button style={S.btnSm} onClick={()=>deadlines.update(d.id,{completed:false})}>Undo</button>
                </div>
              </div>
            ))}
          </>}
          <button style={S.btn} onClick={()=>{setForm({category:"test"});setShowModal("deadline");}}>+ Add Deadline</button>
        </>}
      </>}

      {tab==="schools" && <>
        {schools.loading ? <Loading/> : <>
          {["target","researching","applying","applied","accepted","rejected"].map(status => {
            const group = schools.data.filter(s=>s.status===status);
            if (!group.length) return null;
            return (
              <div key={status}>
                <div style={S.sectionLabel}>{status.charAt(0).toUpperCase()+status.slice(1)}</div>
                {group.map(s => (
                  <div key={s.id} style={S.statusCard(statusColors[s.status])}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ fontSize:14, fontWeight:600 }}>{s.name}</div>
                      <select value={s.status} onChange={e=>schools.update(s.id,{status:e.target.value})}
                        style={{ background:COLORS.navyLight, color:COLORS.slateLight, border:"none", borderRadius:6, padding:"4px 8px", fontSize:11, cursor:"pointer" }}>
                        {["researching","target","applying","applied","accepted","rejected"].map(st=><option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          <button style={S.btn} onClick={()=>{setForm({status:"researching"});setShowModal("school");}}>+ Add School</button>
        </>}
      </>}

      {tab==="scores" && <>
        {scores.loading ? <Loading/> : <>
          {scores.data.length > 0 && (
            <div style={{ ...S.card, background:COLORS.navyLight, textAlign:"center", marginBottom:16 }}>
              <div style={{ fontSize:36, fontWeight:800 }}>{scores.data[0].total}</div>
              <div style={{ fontSize:12, color:COLORS.slate }}>Most Recent · {formatDate(scores.data[0].date)}</div>
              <div style={{ display:"flex", justifyContent:"center", gap:28, marginTop:12 }}>
                <div><div style={{ fontSize:20, fontWeight:700 }}>{scores.data[0].math}</div><div style={{ fontSize:11, color:COLORS.slate }}>Math</div></div>
                <div style={{ width:1, background:COLORS.navyLight }}/>
                <div><div style={{ fontSize:20, fontWeight:700 }}>{scores.data[0].verbal}</div><div style={{ fontSize:11, color:COLORS.slate }}>Verbal</div></div>
              </div>
            </div>
          )}
          {scores.data.map(s => (
            <div key={s.id} style={S.card}>
              <div style={{ fontSize:15, fontWeight:700 }}>{s.total} <span style={{ fontSize:11, color:COLORS.slate }}>({s.math}M / {s.verbal}V)</span></div>
              <div style={{ fontSize:12, color:COLORS.slate, marginTop:2 }}>{formatDate(s.date)}{s.notes?` · ${s.notes}`:""}</div>
            </div>
          ))}
          <button style={S.btn} onClick={()=>{setForm({});setShowModal("score");}}>+ Log Score</button>
        </>}
      </>}

      {showModal==="deadline" && (
        <Modal title="Add Deadline" onClose={()=>setShowModal(null)}>
          <label style={S.label}>Title</label>
          <input style={S.input} placeholder="e.g. Common App Essay Draft" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
          <label style={S.label}>Due Date</label>
          <input type="date" style={S.input} value={form.due_date||""} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))}/>
          <label style={S.label}>School (optional)</label>
          <input style={S.input} placeholder="e.g. University of Virginia" value={form.school||""} onChange={e=>setForm(p=>({...p,school:e.target.value}))}/>
          <label style={S.label}>Category</label>
          <div>{["test","application","visit","other"].map(c=><span key={c} style={S.chip(form.category===c,catColor[c])} onClick={()=>setForm(p=>({...p,category:c}))}>{c}</span>)}</div>
          <button style={{...S.btn,marginTop:16}} onClick={saveDeadline}>Add Deadline</button>
        </Modal>
      )}
      {showModal==="school" && (
        <Modal title="Add School" onClose={()=>setShowModal(null)}>
          <label style={S.label}>School Name</label>
          <input style={S.input} placeholder="e.g. University of Virginia" value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/>
          <label style={S.label}>Status</label>
          <div>{["researching","target","applying"].map(s=><span key={s} style={S.chip(form.status===s,statusColors[s])} onClick={()=>setForm(p=>({...p,status:s}))}>{s}</span>)}</div>
          <button style={{...S.btn,marginTop:16}} onClick={saveSchool}>Add School</button>
        </Modal>
      )}
      {showModal==="score" && (
        <Modal title="Log SAT Score" onClose={()=>setShowModal(null)}>
          <label style={S.label}>Date</label>
          <input type="date" style={S.input} value={form.date||""} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Math</label><input type="number" style={S.input} placeholder="200–800" value={form.math||""} onChange={e=>setForm(p=>({...p,math:e.target.value}))}/></div>
            <div style={S.col}><label style={S.label}>Verbal</label><input type="number" style={S.input} placeholder="200–800" value={form.verbal||""} onChange={e=>setForm(p=>({...p,verbal:e.target.value}))}/></div>
          </div>
          <label style={S.label}>Total</label>
          <input type="number" style={S.input} placeholder="400–1600" value={form.total||""} onChange={e=>setForm(p=>({...p,total:e.target.value}))}/>
          <label style={S.label}>Notes</label>
          <input style={S.input} placeholder="e.g. Official test" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
          <button style={{...S.btn,marginTop:16}} onClick={saveScore}>Log Score</button>
        </Modal>
      )}
    </div>
  );
}

// ─── Home Maintenance ─────────────────────────────────────────────────────────
function HomeMgmt() {
  const maint = useTable("home_maintenance", "title", true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({});

  async function markDone(item) {
    await maint.update(item.id, { last_completed: TODAY_STR });
  }
  async function save() {
    if (!form.title||!form.interval_days) return;
    await maint.insert({ title:form.title, last_completed:form.last_completed||TODAY_STR, interval_days:+form.interval_days, notes:form.notes||"" });
    setForm({}); setShowModal(false);
  }

  const sorted = [...maint.data].sort((a,b) => {
    const order = { overdue:0, "due-soon":1, ok:2 };
    return order[maintStatus(a)] - order[maintStatus(b)];
  });

  return (
    <div style={S.screen}>
      {maint.loading ? <Loading/> : <>
        <div style={S.sectionLabel}>Maintenance Schedule</div>
        {sorted.map(item => {
          const st = maintStatus(item);
          const color = maintColor(st);
          const nextDue = nextDueDate(item.last_completed, item.interval_days);
          const days = daysBetween(nextDue);
          const pct = Math.max(0, 100 - (days / item.interval_days) * 100);
          return (
            <div key={item.id} style={S.statusCard(color)}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600 }}>{item.title}</div>
                  <div style={{ fontSize:12, color:COLORS.slate, marginTop:2 }}>
                    {st==="overdue" ? `Overdue by ${-days}d` : st==="due-soon" ? `Due in ${days}d` : `Due ${formatDate(nextDue)}`}
                    {item.notes?` · ${item.notes}`:""}
                  </div>
                  <div style={S.progress}><div style={S.progressFill(pct, color)}/></div>
                </div>
                <button style={{...S.btnGreen, marginLeft:12}} onClick={()=>markDone(item)}>Done ✓</button>
              </div>
            </div>
          );
        })}
        {sorted.length===0 && <div style={S.empty}>No maintenance items yet.</div>}
        <button style={S.btn} onClick={()=>{setForm({});setShowModal(true);}}>+ Add Item</button>
      </>}

      {showModal && (
        <Modal title="Add Maintenance Item" onClose={()=>setShowModal(false)}>
          <label style={S.label}>Item Name</label>
          <input style={S.input} placeholder="e.g. HVAC Filter" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
          <label style={S.label}>Interval</label>
          <div style={{ marginBottom:8 }}>
            {[14,30,60,90,180,365].map(d=><span key={d} style={S.chip(+form.interval_days===d,COLORS.blue)} onClick={()=>setForm(p=>({...p,interval_days:d}))}>{d}d</span>)}
          </div>
          <input type="number" style={S.input} placeholder="Or enter custom days" value={form.interval_days||""} onChange={e=>setForm(p=>({...p,interval_days:e.target.value}))}/>
          <label style={S.label}>Last Completed</label>
          <input type="date" style={S.input} value={form.last_completed||""} onChange={e=>setForm(p=>({...p,last_completed:e.target.value}))}/>
          <label style={S.label}>Notes (optional)</label>
          <input style={S.input} placeholder="e.g. 16x25x1, check Grainger" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
          <button style={{...S.btn,marginTop:8}} onClick={save}>Add Item</button>
        </Modal>
      )}
    </div>
  );
}

// ─── Pool ─────────────────────────────────────────────────────────────────────
function Pool() {
  const readings = useTable("pool_readings", "date");
  const maint = useTable("pool_maintenance", "date");
  const [tab, setTab] = useState("log");
  const [showLog, setShowLog] = useState(false);
  const [showMaint, setShowMaint] = useState(false);
  const [form, setForm] = useState({});

  const PARAMS = [
    { k:"ph",            l:"pH",        unit:"",    target:"7.2–7.6" },
    { k:"free_chlorine", l:"Free Cl",   unit:"ppm", target:"2–4" },
    { k:"salt",          l:"Salt",      unit:"ppm", target:"3200–3600" },  // Pentair
    { k:"cya",           l:"CYA",       unit:"ppm", target:"50–80" },
    { k:"alkalinity",    l:"Alkalinity",unit:"ppm", target:"80–120" },
    { k:"water_temp",    l:"Temp",      unit:"°F",  target:"—" },
  ];

  const last = readings.data[0];

  async function saveReading() {
    await readings.insert({
      date: form.date||TODAY_STR, ph:+form.ph, free_chlorine:+form.free_chlorine,
      salt:+form.salt, cya:+form.cya, alkalinity:+form.alkalinity,
      water_temp:+form.water_temp||null, swg_setting:+form.swg_setting||null, notes:form.notes||""
    });
    setForm({}); setShowLog(false);
  }
  async function saveMaint() {
    if (!form.type) return;
    await maint.insert({ date:form.date||TODAY_STR, type:form.type, notes:form.notes||"" });
    setForm({}); setShowMaint(false);
  }

  return (
    <div style={S.screen}>
      {/* Current status card */}
      {last && (
        <div style={{ ...S.card, background:COLORS.navyLight, marginBottom:16 }}>
          <div style={{ fontSize:11, color:COLORS.blue, fontWeight:700, letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:8 }}>
            Last Reading — {formatDate(last.date)}{last.water_temp ? ` · ${last.water_temp}°F` : ""}
          </div>
          <div style={S.statGrid}>
            {PARAMS.filter(p=>p.k!=="water_temp").map(p => {
              const s = poolStatus(p.k, last[p.k]);
              const c = statusColor(s);
              return (
                <div key={p.k} style={S.statCell(c)}>
                  <div style={S.statVal}>{last[p.k]}</div>
                  <div style={S.statLbl}>{p.l}</div>
                  <div style={S.statTarget}>{p.target}</div>
                </div>
              );
            })}
          </div>
          {last.swg_setting && <div style={{ fontSize:12, color:COLORS.slate, marginTop:8 }}>SWG: {last.swg_setting}% · Pentair IntelliChlor</div>}
        </div>
      )}

      <div style={S.tabs}>
        {["log","trends","maintenance"].map(t=><button key={t} style={S.tabBtn(tab===t)} onClick={()=>setTab(t)}>{t}</button>)}
      </div>

      {tab==="log" && <>
        {readings.loading ? <Loading/> : readings.data.map(r => (
          <div key={r.id} style={S.card}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <div style={{ fontSize:13, fontWeight:700 }}>{formatDate(r.date)}</div>
              <div style={{ fontSize:12, color:COLORS.slate }}>{r.water_temp ? `${r.water_temp}°F · ` : ""}SWG {r.swg_setting}%</div>
            </div>
            <div style={{ display:"flex", gap:14, marginTop:8, flexWrap:"wrap" }}>
              {PARAMS.filter(p=>p.k!=="water_temp").map(p => {
                const s = poolStatus(p.k, r[p.k]);
                return <div key={p.k}><div style={{ fontSize:13, fontWeight:600, color:statusColor(s) }}>{r[p.k]}</div><div style={{ fontSize:10, color:COLORS.slate }}>{p.l}</div></div>;
              })}
            </div>
            {r.notes && <div style={{ fontSize:11, color:COLORS.slate, marginTop:6, fontStyle:"italic" }}>{r.notes}</div>}
          </div>
        ))}
        <button style={S.btn} onClick={()=>{setForm({date:TODAY_STR});setShowLog(true);}}>+ Log Reading</button>
      </>}

      {tab==="trends" && <>
        {PARAMS.filter(p=>p.k!=="water_temp").map(p => {
          const vals = [...readings.data].reverse().map(r=>r[p.k]);
          const latest = vals[vals.length-1];
          const s = poolStatus(p.k, latest);
          const c = statusColor(s);
          return (
            <div key={p.k} style={{ ...S.card, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600 }}>{p.l}</div>
                <div style={{ fontSize:11, color:COLORS.slate }}>Target: {p.target}{p.unit?" "+p.unit:""}</div>
                <div style={{ fontSize:20, fontWeight:700, color:c, marginTop:4 }}>{latest}{p.k==="ph"?"":p.k==="salt"||p.k==="cya"||p.k==="alkalinity"?" ppm":" ppm"}</div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                <Sparkline data={vals} color={c}/>
                <span style={{...S.badge(c), fontSize:10}}>{s==="green"?"OK":s==="amber"?"Watch":"Adjust"}</span>
              </div>
            </div>
          );
        })}
      </>}

      {tab==="maintenance" && <>
        {maint.loading ? <Loading/> : maint.data.map(m => (
          <div key={m.id} style={S.card}>
            <div style={{ fontSize:13, fontWeight:600 }}>{m.type}</div>
            <div style={{ fontSize:12, color:COLORS.slate, marginTop:2 }}>{formatDate(m.date)}{m.notes?` · ${m.notes}`:""}</div>
          </div>
        ))}
        <button style={S.btn} onClick={()=>{setForm({date:TODAY_STR});setShowMaint(true);}}>+ Log Maintenance</button>
      </>}

      {showLog && (
        <Modal title="Log Pool Reading" onClose={()=>setShowLog(false)}>
          <label style={S.label}>Date</label>
          <input type="date" style={S.input} value={form.date||""} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>pH</label><input type="number" step="0.1" style={S.input} placeholder="7.4" value={form.ph||""} onChange={e=>setForm(p=>({...p,ph:e.target.value}))}/></div>
            <div style={S.col}><label style={S.label}>Free Cl (ppm)</label><input type="number" step="0.1" style={S.input} placeholder="3.0" value={form.free_chlorine||""} onChange={e=>setForm(p=>({...p,free_chlorine:e.target.value}))}/></div>
          </div>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Salt (ppm)</label><input type="number" style={S.input} placeholder="3400" value={form.salt||""} onChange={e=>setForm(p=>({...p,salt:e.target.value}))}/></div>
            <div style={S.col}><label style={S.label}>CYA (ppm)</label><input type="number" style={S.input} placeholder="70" value={form.cya||""} onChange={e=>setForm(p=>({...p,cya:e.target.value}))}/></div>
          </div>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Alkalinity (ppm)</label><input type="number" style={S.input} placeholder="95" value={form.alkalinity||""} onChange={e=>setForm(p=>({...p,alkalinity:e.target.value}))}/></div>
            <div style={S.col}><label style={S.label}>Water Temp (°F)</label><input type="number" style={S.input} placeholder="84" value={form.water_temp||""} onChange={e=>setForm(p=>({...p,water_temp:e.target.value}))}/></div>
          </div>
          <label style={S.label}>SWG Setting (%)</label>
          <input type="number" style={S.input} placeholder="60" value={form.swg_setting||""} onChange={e=>setForm(p=>({...p,swg_setting:e.target.value}))}/>
          <label style={S.label}>Notes</label>
          <input style={S.input} placeholder="Optional" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
          <button style={{...S.btn,marginTop:8}} onClick={saveReading}>Save Reading</button>
        </Modal>
      )}
      {showMaint && (
        <Modal title="Log Pool Maintenance" onClose={()=>setShowMaint(false)}>
          <label style={S.label}>Date</label>
          <input type="date" style={S.input} value={form.date||""} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/>
          <label style={S.label}>Type</label>
          {["Brushed walls & floor","Cleaned skimmer basket","Backwashed filter","Added salt","Shocked pool","Cleaned filter cartridge","Other"].map(t=>(
            <span key={t} style={S.chip(form.type===t,COLORS.blue)} onClick={()=>setForm(p=>({...p,type:t}))}>{t}</span>
          ))}
          <label style={{...S.label,marginTop:8}}>Notes (optional)</label>
          <input style={S.input} placeholder="Any details" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
          <button style={{...S.btn,marginTop:8}} onClick={saveMaint}>Save</button>
        </Modal>
      )}
    </div>
  );
}

// ─── Setup Guide ──────────────────────────────────────────────────────────────
function SetupGuide({ onClose }) {
  const steps = [
    { n:"1", title:"Create Supabase project", body:"Go to supabase.com → New Project. Choose a region close to you. Save your database password." },
    { n:"2", title:"Run the schema", body:'In your project, go to SQL Editor → New Query. Paste the entire contents of familyos_schema.sql and click Run. This creates all tables and seeds your initial data.' },
    { n:"3", title:"Copy your credentials", body:'Go to Project Settings → API. Copy the Project URL and the anon (public) key.' },
    { n:"4", title:"Add credentials to FamilyOS.jsx", body:'At the top of FamilyOS.jsx, replace https://dsowansazqleudupnjug.supabase.co and eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3dhbnNhenFsZXVkdXBuanVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MTkzMTYsImV4cCI6MjA5NzE5NTMxNn0.lO3QE01JzvPAaGDVVW9bbeKgnJHMdDNT667KZXLwSXk with the values you just copied.' },
    { n:"5", title:"You\'re live", body:'Data now persists across sessions and syncs between your phone and your wife\'s phone in real time. Google Calendar sync is next.' },
  ];
  return (
    <Modal title="Supabase Setup Guide" onClose={onClose}>
      {steps.map(s => (
        <div key={s.n} style={{ marginBottom:18 }}>
          <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
            <div style={{ width:24, height:24, borderRadius:"50%", background:COLORS.blue, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0 }}>{s.n}</div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>{s.title}</div>
              <div style={{ fontSize:13, color:COLORS.slateLight, lineHeight:1.6 }}>{s.body}</div>
            </div>
          </div>
        </div>
      ))}
      <div style={{ background:COLORS.navyLight, borderRadius:8, padding:"12px 14px", marginTop:8 }}>
        <div style={{ fontSize:11, color:COLORS.slate, fontWeight:700, marginBottom:4 }}>FREE TIER LIMITS</div>
        <div style={{ fontSize:12, color:COLORS.slateLight, lineHeight:1.6 }}>Supabase free tier: 500MB database, 2GB bandwidth, unlimited API requests. More than enough for FamilyOS for years.</div>
      </div>
    </Modal>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("home");
  const [showSetup, setShowSetup] = useState(false);

  const TABS = [
    { id:"home",     label:"Home",     icon:I.home },
    { id:"schedule", label:"Schedule", icon:I.cal },
    { id:"college",  label:"College",  icon:I.college },
    { id:"home-mgmt",label:"House",    icon:I.house },
    { id:"pool",     label:"Pool",     icon:I.pool },
  ];

  const TITLES = { home:"FamilyOS", schedule:"Schedule", college:"College Planning", "home-mgmt":"Home", pool:"Pool" };

  return (
    <div style={S.app}>
      <style>{`
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.5; }
        select option { background: #1A2540; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      {/* Header */}
      <div style={S.header}>
        <div style={S.headerRow}>
          <div>
            <div style={S.logo}>
              {tab==="home" ? <><span style={S.logoAccent}>Family</span>OS</> : TITLES[tab]}
            </div>
            {tab==="home" && <div style={S.dateLabel}>Tuesday, June 16, 2026</div>}
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {!IS_CONFIGURED && (
              <button onClick={()=>setShowSetup(true)} style={{ background:COLORS.amber+"22", color:COLORS.amber, border:`1px solid ${COLORS.amber}44`, borderRadius:6, padding:"5px 10px", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                Setup DB
              </button>
            )}
            <div style={{ display:"flex", gap:4 }}>
              {Object.entries(MEMBER_COLORS).slice(0,3).map(([name,color])=>(
                <div key={name} style={{ width:26, height:26, borderRadius:"50%", background:color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff" }}>
                  {name[0]}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Screens */}
      {tab==="home"     && <Dashboard onNavigate={setTab}/>}
      {tab==="schedule" && <Schedule/>}
      {tab==="college"  && <College/>}
      {tab==="home-mgmt"&& <HomeMgmt/>}
      {tab==="pool"     && <Pool/>}

      {/* Bottom Nav */}
      <nav style={S.nav}>
        {TABS.map(t=>(
          <button key={t.id} style={S.navItem(tab===t.id)} onClick={()=>setTab(t.id)}>
            {t.icon(tab===t.id)}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {showSetup && <SetupGuide onClose={()=>setShowSetup(false)}/>}
    </div>
  );
}
