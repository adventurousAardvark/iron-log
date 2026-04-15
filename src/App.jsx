import { useState, useEffect, useCallback, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

/* ════════════════════════════════════════════
   PROGRAM DEFINITION
   ════════════════════════════════════════════ */


const DAY_KEYS = ["mon", "wed", "fri", "sat"];
const ALL_DAYS = [
  { key: "mon", label: "MON", rest: false },
  { key: "tue", label: "TUE", rest: true },
  { key: "wed", label: "WED", rest: false },
  { key: "thu", label: "THU", rest: true },
  { key: "fri", label: "FRI", rest: false },
  { key: "sat", label: "SAT", rest: false },
  { key: "sun", label: "SUN", rest: true },
];

const STEP_GOAL = 6000;

const DAY_OFFSETS = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };

function getThisMonday() {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDayDate(startDate, weekNum, dayKey) {
  const d = new Date(startDate);
  d.setDate(d.getDate() + (weekNum - 1) * 7 + DAY_OFFSETS[dayKey]);
  return d;
}

function fmtDate(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const EXERCISE_DB = [
  // Legs
  { name: "Barbell Squat", category: "Legs" },
  { name: "Front Squat", category: "Legs" },
  { name: "Goblet Squat", category: "Legs" },
  { name: "Hack Squat", category: "Legs" },
  { name: "Leg Press", category: "Legs" },
  { name: "Bulgarian Split Squat", category: "Legs" },
  { name: "Lunge", category: "Legs" },
  { name: "Step Up", category: "Legs" },
  { name: "Leg Extension", category: "Legs" },
  { name: "Lying Leg Curl", category: "Legs" },
  { name: "Seated Leg Curl", category: "Legs" },
  { name: "Romanian Deadlift", category: "Legs" },
  { name: "DB Romanian Deadlift", category: "Legs" },
  { name: "Nordic Curl", category: "Legs" },
  { name: "Barbell Hip Thrust", category: "Legs" },
  { name: "Glute Bridge", category: "Legs" },
  { name: "Good Morning", category: "Legs" },
  { name: "Standing Calf Raise", category: "Legs" },
  { name: "Seated Calf Raise", category: "Legs" },
  // Back
  { name: "Barbell Deadlift", category: "Back" },
  { name: "Sumo Deadlift", category: "Back" },
  { name: "Trap Bar Deadlift", category: "Back" },
  { name: "Rack Pull", category: "Back" },
  { name: "Pull-Up", category: "Back" },
  { name: "Chin-Up", category: "Back" },
  { name: "Lat Pulldown", category: "Back" },
  { name: "Seated Cable Row", category: "Back" },
  { name: "DB Row", category: "Back" },
  { name: "Barbell Row", category: "Back" },
  { name: "T-Bar Row", category: "Back" },
  { name: "Meadows Row", category: "Back" },
  { name: "Straight Arm Pulldown", category: "Back" },
  { name: "Face Pull", category: "Back" },
  { name: "Barbell Shrug", category: "Back" },
  // Chest
  { name: "Barbell Bench Press", category: "Chest" },
  { name: "DB Press (Flat)", category: "Chest" },
  { name: "Incline Barbell Press", category: "Chest" },
  { name: "Incline DB Press", category: "Chest" },
  { name: "Decline Bench Press", category: "Chest" },
  { name: "Cable Fly", category: "Chest" },
  { name: "DB Fly", category: "Chest" },
  { name: "Pec Deck", category: "Chest" },
  { name: "Push-Up", category: "Chest" },
  { name: "Weighted Dip", category: "Chest" },
  // Shoulders
  { name: "Overhead Press", category: "Shoulders" },
  { name: "DB Shoulder Press", category: "Shoulders" },
  { name: "Arnold Press", category: "Shoulders" },
  { name: "DB Lateral Raise", category: "Shoulders" },
  { name: "Cable Lateral Raise", category: "Shoulders" },
  { name: "Front Raise", category: "Shoulders" },
  { name: "Reverse Pec Deck", category: "Shoulders" },
  { name: "Upright Row", category: "Shoulders" },
  { name: "Cable Face Pull", category: "Shoulders" },
  { name: "Band Pull-Apart", category: "Shoulders" },
  // Arms
  { name: "Barbell Curl", category: "Arms" },
  { name: "DB Curl", category: "Arms" },
  { name: "Hammer Curl", category: "Arms" },
  { name: "Preacher Curl", category: "Arms" },
  { name: "Cable Curl", category: "Arms" },
  { name: "Incline DB Curl", category: "Arms" },
  { name: "Tricep Pushdown", category: "Arms" },
  { name: "Overhead Tricep Extension", category: "Arms" },
  { name: "Skull Crusher", category: "Arms" },
  { name: "Close Grip Bench Press", category: "Arms" },
  { name: "Tricep Kickback", category: "Arms" },
  // Core
  { name: "Weighted Plank", category: "Core" },
  { name: "Ab Wheel Rollout", category: "Core" },
  { name: "Hanging Knee Raise (Straps)", category: "Core" },
  { name: "Hanging Leg Raise", category: "Core" },
  { name: "Cable Crunch", category: "Core" },
  { name: "Decline Crunch", category: "Core" },
  { name: "Russian Twist", category: "Core" },
  { name: "Dead Bug", category: "Core" },
];

/* ════════════════════════════════════════════
   STORAGE — localStorage + JSON file backup
   ════════════════════════════════════════════ */

const API_URL = "/api/data";
const LIBRARY_URL = "/api/library";

async function loadData() {
  try {
    const res = await fetch(API_URL);
    return await res.json();
  } catch (e) {
    console.error("load err (server down?):", e);
    try {
      const raw = localStorage.getItem("iron-log-data");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}

function saveData(d) {
  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(d),
  }).catch(e => console.error("save err:", e));
}

async function loadLibrary() {
  try {
    const res = await fetch(LIBRARY_URL);
    return await res.json();
  } catch { return null; }
}

function saveLibrary(lib) {
  fetch(LIBRARY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lib),
  }).catch(e => console.error("library save err:", e));
}

const PROGRAM_URL = "/api/program";

async function loadProgram() {
  try {
    const res = await fetch(PROGRAM_URL);
    return await res.json();
  } catch { return null; }
}

function saveProgram(prog) {
  fetch(PROGRAM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prog),
  }).catch(e => console.error("program save err:", e));
}

function exportData(d) {
  const blob = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `iron-log-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

const DEFAULT_WORKOUT_DAYS = ["mon", "wed", "fri", "sat"];

function emptyState() {
  return { sessions: {}, steps: {}, meals: {}, weekNum: 1, workoutDays: DEFAULT_WORKOUT_DAYS, bodyWeight: {}, metrics: {}, startDate: getThisMonday().toISOString() };
}

function getProgram(program, dayKey) {
  if (program && program[dayKey]) return program[dayKey];
  return { title: "", exercises: [] };
}

function calcKcal(m) {
  return Math.round((m.protein || 0) * 4 + (m.carbs || 0) * 4 + (m.fat || 0) * 9);
}

function sessionKey(dayKey, week) { return `${dayKey}_w${week}`; }

function buildEmptySets(exercise) {
  return Array.from({ length: exercise.sets }, () => ({
    lbs: exercise.startLbs, reps: 0
  }));
}

/* ════════════════════════════════════════════
   COLORS
   ════════════════════════════════════════════ */

const C = {
  bg: "#07080a", surface: "#0f1114", surface2: "#161a1f", border: "#1e2328",
  borderHi: "#2a3038", text: "#dce0e5", muted: "#7a828c", dim: "#464d56",
  accent: "#c5f467", accentDim: "#7fa33a", warn: "#f59e0b", danger: "#ef4444",
  rehab: "#67d4f4", steps: "#a78bfa", success: "#34d399",
};

/* ════════════════════════════════════════════
   COMPONENTS
   ════════════════════════════════════════════ */

function SetRow({ set, idx, onChange }) {
  const inp = {
    background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6,
    padding: "6px 8px", fontSize: 14, fontFamily: "'JetBrains Mono',monospace",
    width: "100%", outline: "none", textAlign: "center",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr", gap: 8, alignItems: "center", padding: "5px 0" }}>
      <span style={{ color: C.dim, fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>S{idx + 1}</span>
      <input type="number" placeholder="lbs" value={set.lbs || ""} style={inp}
        onChange={e => onChange({ ...set, lbs: Number(e.target.value) })} />
      <input type="number" placeholder="reps" value={set.reps || ""} style={inp}
        onChange={e => onChange({ ...set, reps: Number(e.target.value) })} />
    </div>
  );
}

function ExerciseCard({ exercise, sets, onUpdate, editMode, onRemove, onAddSet, onRemoveSet }) {
  const [open, setOpen] = useState(false);
  const hasData = sets && sets.some(s => s.reps > 0);
  const tagColor = exercise.heavy ? C.accent : C.muted;
  const tagLabel = exercise.heavy ? "HEAVY" : "LIGHT · 3/0/3/0";
  const currentSets = sets || [];

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10, marginBottom: 8, overflow: "hidden", transition: "border-color .2s",
    }}>
      <div onClick={() => setOpen(!open)} style={{
        padding: "12px 16px", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: hasData ? C.success : C.dim, flexShrink: 0 }} />
          <span style={{
            color: C.text, fontSize: 14, fontWeight: 500,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{exercise.name}</span>
          <span style={{
            color: tagColor, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase",
            background: tagColor + "15", padding: "2px 8px", borderRadius: 4, flexShrink: 0,
          }}>{tagLabel}</span>
        </div>
        <span style={{ color: C.muted, fontSize: 12, fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>
          {currentSets.length}×{exercise.reps}
        </span>
        <span style={{ color: C.dim, fontSize: 16, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}>▾</span>
        {editMode && onRemove && (
          <button onClick={e => { e.stopPropagation(); onRemove(); }} style={{
            background: "none", border: "none", color: C.danger, fontSize: 17,
            cursor: "pointer", padding: "0 0 0 6px", lineHeight: 1, flexShrink: 0,
          }}>×</button>
        )}
      </div>
      {open && (
        <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ padding: "8px 0 4px", color: C.muted, fontSize: 12, fontStyle: "italic" }}>{exercise.note}</div>
          {currentSets.length > 0 && (
            <div>
              <div style={{
                display: "grid", gridTemplateColumns: "32px 1fr 1fr", gap: 8, padding: "4px 0",
                color: C.dim, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase",
              }}>
                <span></span><span>LBS</span><span>REPS</span>
              </div>
              {currentSets.map((s, i) => (
                <SetRow key={i} set={s} idx={i} onChange={newSet => {
                  const updated = [...currentSets]; updated[i] = newSet; onUpdate(updated);
                }} />
              ))}
            </div>
          )}
          {editMode && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={() => onAddSet && onAddSet()} style={{
                flex: 1, background: C.surface2, border: `1px solid ${C.border}`,
                color: C.accent, borderRadius: 6, padding: "6px 0", fontSize: 12,
                cursor: "pointer", fontFamily: "inherit",
              }}>+ Add Set</button>
              <button onClick={() => onRemoveSet && onRemoveSet()} disabled={currentSets.length <= 1} style={{
                flex: 1, background: C.surface2, border: `1px solid ${C.border}`,
                color: currentSets.length > 1 ? C.danger : C.dim, borderRadius: 6, padding: "6px 0",
                fontSize: 12, cursor: currentSets.length > 1 ? "pointer" : "default", fontFamily: "inherit",
              }}>− Remove Set</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StepTracker({ steps, onUpdate }) {
  const pct = Math.min((steps / STEP_GOAL) * 100, 100);
  const met = steps >= STEP_GOAL;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ color: C.steps, fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
          ◯ DAILY STEPS
        </span>
        <span style={{ color: met ? C.success : C.muted, fontSize: 12 }}>
          {met ? "✓ Goal reached" : `${(STEP_GOAL - steps).toLocaleString()} to go`}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <input type="number" placeholder="0" value={steps || ""} style={{
          background: C.bg, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8,
          padding: "8px 12px", fontSize: 18, fontFamily: "'JetBrains Mono',monospace", width: 120, outline: "none",
        }} onChange={e => onUpdate(Number(e.target.value) || 0)} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: met ? C.success : C.steps,
              borderRadius: 4, transition: "width .3s" }} />
          </div>
        </div>
        <span style={{ color: C.text, fontSize: 14, fontFamily: "'JetBrains Mono',monospace", minWidth: 60, textAlign: "right" }}>
          {steps.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

const METRIC_TYPES = [
  { key: "blood_sugar", label: "Blood Sugar", unit: "mg/dL", step: "1", hasTime: true },
  { key: "ketones_ppm", label: "Ketones (Breath)", unit: "ppm", step: "1", hasTime: true },
  { key: "ketones_mmol", label: "Ketones (Blood)", unit: "mmol/L", step: "0.1", hasTime: true },
  { key: "blood_pressure_sys", label: "Blood Pressure (Sys)", unit: "mmHg", step: "1", hasTime: true },
  { key: "blood_pressure_dia", label: "Blood Pressure (Dia)", unit: "mmHg", step: "1", hasTime: true },
  { key: "heart_rate", label: "Heart Rate", unit: "bpm", step: "1", hasTime: true },
  { key: "body_temp", label: "Body Temperature", unit: "°F", step: "0.1", hasTime: true },
  { key: "body_fat", label: "Body Fat", unit: "%", step: "0.1", hasTime: false },
  { key: "waist", label: "Waist", unit: "in", step: "0.25", hasTime: false },
];

function MetricPicker({ onAdd, onClose }) {
  return (
    <div style={{ background: C.surface2, border: `1px solid ${C.borderHi}`, borderRadius: 10, padding: 14, marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ color: C.rehab, fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>ADD METRIC</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.dim, fontSize: 18, cursor: "pointer", padding: "0 4px" }}>×</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {METRIC_TYPES.map(mt => (
          <button key={mt.key} onClick={() => { onAdd(mt.key); onClose(); }} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            width: "100%", background: "transparent", border: `1px solid ${C.border}`,
            borderRadius: 8, padding: "8px 12px", cursor: "pointer",
            fontFamily: "inherit", color: C.text, textAlign: "left",
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.rehab}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
          >
            <span style={{ fontSize: 13 }}>{mt.label}</span>
            <span style={{ color: C.dim, fontSize: 11 }}>{mt.unit}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function MetricsSection({ bodyWeight, onBodyWeightChange, metrics, onMetricsChange }) {
  const [showPicker, setShowPicker] = useState(false);
  const entries = Array.isArray(metrics) ? metrics : [];

  const inp = {
    background: C.bg, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8,
    padding: "6px 8px", fontSize: 13, fontFamily: "'JetBrains Mono',monospace", outline: "none", textAlign: "center",
  };

  const addMetric = (typeKey) => {
    const mt = METRIC_TYPES.find(m => m.key === typeKey);
    const entry = { id: Date.now(), type: typeKey, value: "", time: mt.hasTime ? nowTime() : null };
    onMetricsChange([...entries, entry]);
  };

  const updateEntry = (id, field, val) => onMetricsChange(entries.map(e => e.id === id ? { ...e, [field]: val } : e));
  const removeEntry = (id) => onMetricsChange(entries.filter(e => e.id !== id));

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: C.rehab, fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
          ◯ METRICS
        </span>
      </div>

      {/* Body weight — always shown */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
        <span style={{ color: C.dim, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, minWidth: 90 }}>Body Weight</span>
        <input type="number" placeholder="0" value={bodyWeight || ""} step="0.1" style={{ ...inp, width: 90 }}
          onChange={e => onBodyWeightChange(Number(e.target.value) || "")} />
        <span style={{ color: C.dim, fontSize: 11 }}>lbs</span>
      </div>

      {/* Column headers */}
      {entries.length > 0 && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 80px 56px 24px", gap: 6, marginTop: 12,
          color: C.dim, fontSize: 9, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase",
          padding: "0 0 4px",
        }}>
          <span>METRIC</span>
          <span style={{ textAlign: "center" }}>VALUE</span>
          <span style={{ textAlign: "center" }}>TIME</span>
          <span></span>
        </div>
      )}

      {/* Metric entries */}
      {entries.map(entry => {
        const mt = METRIC_TYPES.find(m => m.key === entry.type) || { label: entry.type, unit: "", step: "1", hasTime: true };
        return (
          <div key={entry.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 56px 24px", gap: 6, marginBottom: 5, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: C.text, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mt.label}</span>
              <span style={{ color: C.dim, fontSize: 10, flexShrink: 0 }}>{mt.unit}</span>
            </div>
            <input type="number" placeholder="0" value={entry.value || ""} step={mt.step} style={inp}
              onChange={e => updateEntry(entry.id, "value", Number(e.target.value) || "")} />
            {mt.hasTime ? (
              <input type="time" value={entry.time || ""} style={{ ...inp, fontSize: 11, padding: "6px 2px" }}
                onChange={e => updateEntry(entry.id, "time", e.target.value)} />
            ) : (
              <span></span>
            )}
            <button onClick={() => removeEntry(entry.id)} style={{
              background: "none", border: "none", color: C.dim, fontSize: 14, cursor: "pointer",
              padding: 0, lineHeight: 1, fontFamily: "inherit",
            }}>✕</button>
          </div>
        );
      })}

      {/* Add button / picker */}
      {showPicker ? (
        <MetricPicker onAdd={addMetric} onClose={() => setShowPicker(false)} />
      ) : (
        <button onClick={() => setShowPicker(true)} style={{
          marginTop: entries.length > 0 ? 8 : 12, width: "100%", background: "transparent",
          border: `1px dashed ${C.border}`, color: C.muted, borderRadius: 8, padding: "7px 0",
          cursor: "pointer", fontSize: 13, fontFamily: "inherit", letterSpacing: 0.5,
        }}>+ add metric</button>
      )}
    </div>
  );
}

/* --- Nutrition helpers --- */
function itemMacros(item) {
  const s = item.serving || 1;
  return { protein: (item.protein || 0) * s, carbs: (item.carbs || 0) * s, fiber: (item.fiber || 0) * s, fat: (item.fat || 0) * s, satFat: (item.satFat || 0) * s, kcal: calcKcal(item) * s };
}
function mealTotals(meal) {
  const items = meal.items || [];
  const ms = meal.serving || 1;
  if (items.length === 0) { const m = itemMacros(meal); return { protein: m.protein * ms, carbs: m.carbs * ms, fiber: m.fiber * ms, fat: m.fat * ms, satFat: m.satFat * ms, kcal: m.kcal * ms }; }
  const base = items.reduce((acc, it) => {
    const m = itemMacros(it);
    return { protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fiber: acc.fiber + m.fiber, fat: acc.fat + m.fat, satFat: acc.satFat + m.satFat, kcal: acc.kcal + m.kcal };
  }, { protein: 0, carbs: 0, fiber: 0, fat: 0, satFat: 0, kcal: 0 });
  return { protein: base.protein * ms, carbs: base.carbs * ms, fiber: base.fiber * ms, fat: base.fat * ms, satFat: base.satFat * ms, kcal: base.kcal * ms };
}
function migrateMeal(m) {
  // Convert old flat meals to grouped format
  if (m.items) return m;
  const { id, name, serving, ...macros } = m;
  return { id, name: name || "", items: [{ id: Date.now(), name: name || "", ...macros, serving: serving || 1 }] };
}

function ItemPicker({ library, onSelect, onNewBlank, onClose, label }) {
  const [query, setQuery] = useState("");
  const items = library.filter(m => m.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div style={{ background: C.surface2, border: `1px solid ${C.borderHi}`, borderRadius: 10, padding: 14, marginBottom: 8 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
          placeholder={`Search ${label}…`}
          style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.dim, fontSize: 18, cursor: "pointer", padding: "0 4px" }}>×</button>
      </div>
      <div style={{ maxHeight: 220, overflowY: "auto" }}>
        {items.length === 0 && <div style={{ color: C.dim, fontSize: 12, padding: "6px 2px" }}>No saved {label}{query ? " matching that search" : ""}.</div>}
        {items.map((m, i) => {
          const t = m.items ? mealTotals(m) : itemMacros(m);
          return (
            <button key={i} onClick={() => onSelect(m)} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
              background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8,
              padding: "8px 12px", marginBottom: 4, cursor: "pointer", fontFamily: "inherit", color: C.text, textAlign: "left",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {m.items && <span style={{ color: C.warn, fontSize: 9, fontWeight: 600, background: C.warn + "18", padding: "1px 5px", borderRadius: 3 }}>MEAL</span>}
                <span style={{ fontSize: 13 }}>{m.name}</span>
                {m.items && <span style={{ color: C.dim, fontSize: 10 }}>({m.items.length} items)</span>}
              </div>
              <span style={{ color: C.dim, fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>
                {Math.round(t.protein)}p · {Math.round(t.carbs)}c · {Math.round(t.fat)}f · {Math.round(t.kcal)} kcal
              </span>
            </button>
          );
        })}
      </div>
      <button onClick={onNewBlank} style={{
        marginTop: 8, width: "100%", background: "transparent", border: `1px dashed ${C.borderHi}`,
        color: C.accent, borderRadius: 8, padding: "7px 0", cursor: "pointer", fontSize: 12, fontFamily: "inherit",
      }}>+ new blank {label}</button>
    </div>
  );
}

function ManageLibrary({ library, onDelete, onClose }) {
  return (
    <div style={{ background: C.surface2, border: `1px solid ${C.borderHi}`, borderRadius: 10, padding: 14, marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ color: C.warn, fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>LIBRARY</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.dim, fontSize: 18, cursor: "pointer", padding: "0 4px" }}>×</button>
      </div>
      {library.length === 0 && <div style={{ color: C.dim, fontSize: 12, padding: "4px 2px" }}>No saved items yet.</div>}
      {library.map((m, i) => {
        const t = m.items ? mealTotals(m) : itemMacros(m);
        return (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {m.items && <span style={{ color: C.warn, fontSize: 9, fontWeight: 600, background: C.warn + "18", padding: "1px 5px", borderRadius: 3 }}>MEAL</span>}
              <span style={{ color: C.text, fontSize: 13 }}>{m.name}</span>
              {m.items && <span style={{ color: C.dim, fontSize: 10 }}>({m.items.length} items)</span>}
              <span style={{ color: C.dim, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", marginLeft: 6 }}>
                {Math.round(t.protein)}p · {Math.round(t.carbs)}c · {Math.round(t.fat)}f · {Math.round(t.kcal)} kcal
              </span>
            </div>
            <button onClick={() => onDelete(m.name)} style={{ background: "none", border: "none", color: C.dim, fontSize: 14, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>✕</button>
          </div>
        );
      })}
    </div>
  );
}

function MealCard({ meal, onUpdate, onRemove, onSaveToLibrary, onSaveItemToLibrary, itemLibrary, inp, macroFields }) {
  const [open, setOpen] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const items = meal.items || [];
  const t = mealTotals(meal);

  const updateItem = (itemId, field, val) => {
    onUpdate({ ...meal, items: items.map(it => it.id === itemId ? { ...it, [field]: val } : it) });
  };
  const removeItem = (itemId) => {
    onUpdate({ ...meal, items: items.filter(it => it.id !== itemId) });
  };
  const addBlankItem = () => {
    onUpdate({ ...meal, items: [...items, { id: Date.now(), name: "", protein: 0, carbs: 0, fiber: 0, fat: 0, satFat: 0, serving: 1 }] });
    setShowItemPicker(false);
  };
  const addItemFromLibrary = (libItem) => {
    if (libItem.items) {
      // Adding a saved meal's items
      const newItems = libItem.items.map(it => ({ ...it, id: Date.now() + Math.random() }));
      onUpdate({ ...meal, items: [...items, ...newItems] });
    } else {
      onUpdate({ ...meal, items: [...items, { ...libItem, id: Date.now(), serving: 1 }] });
    }
    setShowItemPicker(false);
  };

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 8, overflow: "hidden", background: C.bg }}>
      {/* Meal header row */}
      <div style={{ display: "grid", gridTemplateColumns: "24px 1fr 44px 28px 24px", gap: 4, padding: "8px 10px", alignItems: "center", cursor: "pointer" }}
        onClick={() => setOpen(!open)}>
        <span style={{ color: C.dim, fontSize: 14, transform: open ? "rotate(90deg)" : "none", transition: "transform .15s", textAlign: "center" }}>▸</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <input placeholder="Meal name" value={meal.name} style={{ ...inp, textAlign: "left", padding: "4px 8px", fontSize: 13, fontWeight: 600, flex: 1, background: "transparent", border: "none" }}
            onClick={e => e.stopPropagation()}
            onChange={e => onUpdate({ ...meal, name: e.target.value })} />
          <span style={{ color: C.dim, fontSize: 10, flexShrink: 0 }}>{items.length} item{items.length !== 1 ? "s" : ""}</span>
        </div>
        <span style={{ color: C.muted, fontSize: 12, fontFamily: "'JetBrains Mono',monospace", textAlign: "center" }}>
          {Math.round(t.kcal)}
        </span>
        <button onClick={e => { e.stopPropagation(); onSaveToLibrary(); }} disabled={!meal.name.trim()} title="Save meal to library"
          style={{ background: "none", border: `1px solid ${meal.name.trim() ? C.warn + "88" : C.border}`, color: meal.name.trim() ? C.warn : C.dim, fontSize: 10, cursor: meal.name.trim() ? "pointer" : "default", borderRadius: 4, padding: "2px 0", lineHeight: 1, fontFamily: "inherit", width: "100%" }}>↑</button>
        <button onClick={e => { e.stopPropagation(); onRemove(); }} style={{ background: "none", border: "none", color: C.dim, fontSize: 14, cursor: "pointer", padding: 0, lineHeight: 1, fontFamily: "inherit" }}>✕</button>
      </div>

      {/* Macro summary bar */}
      <div style={{ display: "flex", gap: 10, padding: "0 10px 8px 38px" }}>
        {macroFields.map(f => (
          <span key={f.key} style={{ color: f.color, fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>
            {f.label} {Math.round(t[f.key])}g
          </span>
        ))}
      </div>

      {/* Expanded: individual items */}
      {open && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 10px 10px 10px", background: C.surface }}>
          {/* Item column headers */}
          {items.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 48px 48px 48px 48px 48px 40px 24px 24px", gap: 3, color: C.dim, fontSize: 8, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", padding: "0 0 4px" }}>
              <span>ITEM</span>
              <span style={{ textAlign: "center" }}>×SRV</span>
              {macroFields.map(f => <span key={f.key} style={{ textAlign: "center", color: f.color }}>{f.label}</span>)}
              <span style={{ textAlign: "center" }}>KCAL</span>
              <span style={{ textAlign: "center" }}>LIB</span>
              <span></span>
            </div>
          )}
          {items.map(it => (
            <div key={it.id} style={{ display: "grid", gridTemplateColumns: "1fr 40px 48px 48px 48px 48px 48px 40px 24px 24px", gap: 3, marginBottom: 4, alignItems: "center" }}>
              <input placeholder="ingredient" value={it.name} style={{ ...inp, textAlign: "left", padding: "4px 6px", fontSize: 11 }}
                onChange={e => updateItem(it.id, "name", e.target.value)} />
              <input type="number" placeholder="1" value={it.serving ?? 1} step="0.25" min="0.25" style={{ ...inp, color: C.steps, fontSize: 11 }}
                onChange={e => updateItem(it.id, "serving", Number(e.target.value) || 1)} />
              {macroFields.map(f => {
                const s = it.serving || 1;
                return (
                <input key={f.key} type="number" placeholder="0" value={Math.round(((it[f.key] || 0) * s) * 10) / 10 || ""} style={{ ...inp, fontSize: 11 }}
                  onChange={e => updateItem(it.id, f.key, (Number(e.target.value) || 0) / s)} />
                );
              })}
              <span style={{ color: C.muted, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", textAlign: "center" }}>
                {Math.round(calcKcal(it) * (it.serving || 1))}
              </span>
              <button onClick={() => onSaveItemToLibrary(it)} disabled={!it.name.trim()} title="Save item to library"
                style={{ background: "none", border: `1px solid ${it.name.trim() ? C.warn + "44" : C.border}`, color: it.name.trim() ? C.warn : C.dim, fontSize: 9, cursor: it.name.trim() ? "pointer" : "default", borderRadius: 3, padding: "1px 0", lineHeight: 1, fontFamily: "inherit", width: "100%" }}>↑</button>
              <button onClick={() => removeItem(it.id)} style={{ background: "none", border: "none", color: C.dim, fontSize: 13, cursor: "pointer", padding: 0, lineHeight: 1, fontFamily: "inherit" }}>✕</button>
            </div>
          ))}

          {showItemPicker ? (
            <ItemPicker label="items" library={itemLibrary} onSelect={addItemFromLibrary} onNewBlank={addBlankItem} onClose={() => setShowItemPicker(false)} />
          ) : (
            <button onClick={() => {
              if (itemLibrary.length > 0) setShowItemPicker(true);
              else addBlankItem();
            }} style={{
              marginTop: 4, width: "100%", background: "transparent", border: `1px dashed ${C.border}`,
              color: C.dim, borderRadius: 6, padding: "5px 0", cursor: "pointer", fontSize: 11, fontFamily: "inherit",
            }}>+ add item</button>
          )}
        </div>
      )}
    </div>
  );
}

function MacroSection({ meals: rawMeals, onUpdate, isTrainingDay, mealLibrary, onUpdateLibrary }) {
  const [showPicker, setShowPicker] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const goal = isTrainingDay ? 2800 : 2000;

  // Migrate legacy flat meals to grouped format
  const meals = rawMeals.map(migrateMeal);

  const totals = meals.reduce((acc, m) => {
    const t = mealTotals(m);
    return { protein: acc.protein + t.protein, carbs: acc.carbs + t.carbs, fiber: acc.fiber + t.fiber, fat: acc.fat + t.fat, satFat: acc.satFat + t.satFat, kcal: acc.kcal + t.kcal };
  }, { protein: 0, carbs: 0, fiber: 0, fat: 0, satFat: 0, kcal: 0 });

  const pct = Math.min((totals.kcal / goal) * 100, 100);
  const over = totals.kcal > goal;

  const addBlankMeal = () => {
    onUpdate([...meals, { id: Date.now(), name: "", items: [{ id: Date.now() + 1, name: "", protein: 0, carbs: 0, fiber: 0, fat: 0, satFat: 0, serving: 1 }] }]);
    setShowPicker(false);
  };
  const addFromLibrary = (libEntry) => {
    if (libEntry.items) {
      // It's a saved meal — add as a full meal group
      onUpdate([...meals, { ...libEntry, id: Date.now(), items: libEntry.items.map(it => ({ ...it, id: Date.now() + Math.random() })) }]);
    } else {
      // It's a single item — wrap it in a meal
      onUpdate([...meals, { id: Date.now(), name: libEntry.name, items: [{ ...libEntry, id: Date.now() + 1, serving: 1 }] }]);
    }
    setShowPicker(false);
  };
  const updateMeal = (id, updated) => onUpdate(meals.map(m => m.id === id ? updated : m));
  const removeMeal = (id) => onUpdate(meals.filter(m => m.id !== id));

  const saveMealToLibrary = (meal) => {
    const entry = { name: meal.name, items: (meal.items || []).map(it => ({ name: it.name, protein: it.protein || 0, carbs: it.carbs || 0, fiber: it.fiber || 0, fat: it.fat || 0, satFat: it.satFat || 0, serving: it.serving || 1 })) };
    const existing = (mealLibrary || []).findIndex(m => m.name === meal.name);
    onUpdateLibrary(existing >= 0 ? mealLibrary.map((m, i) => i === existing ? entry : m) : [...(mealLibrary || []), entry]);
  };
  const saveItemToLibrary = (item) => {
    const entry = { name: item.name, protein: item.protein || 0, carbs: item.carbs || 0, fiber: item.fiber || 0, fat: item.fat || 0, satFat: item.satFat || 0 };
    const existing = (mealLibrary || []).findIndex(m => m.name === item.name && !m.items);
    onUpdateLibrary(existing >= 0 ? mealLibrary.map((m, i) => i === existing ? entry : m) : [...(mealLibrary || []), entry]);
  };
  const deleteFromLibrary = (name) => {
    onUpdateLibrary((mealLibrary || []).filter(m => m.name !== name));
  };

  const inp = {
    background: C.bg, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6,
    padding: "5px 4px", fontSize: 12, fontFamily: "'JetBrains Mono',monospace",
    width: "100%", outline: "none", textAlign: "center",
  };

  const macroFields = [
    { key: "fat", label: "FAT", color: C.rehab },
    { key: "satFat", label: "SFAT", color: C.muted },
    { key: "carbs", label: "CARB", color: C.warn },
    { key: "fiber", label: "FIBER", color: C.success },
    { key: "protein", label: "PRO", color: C.accent },
  ];

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
      {/* Header + calorie bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ color: C.warn, fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>◯ NUTRITION</span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => { setShowManage(m => !m); setShowPicker(false); }} style={{
            background: "none", border: "none", color: C.dim, fontSize: 11,
            cursor: "pointer", fontFamily: "inherit", padding: 0, textDecoration: "underline",
          }}>manage library</button>
          <span style={{ color: C.muted, fontSize: 11 }}>{isTrainingDay ? "Training" : "Rest"} · target {goal.toLocaleString()} kcal</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ color: over ? C.danger : C.text, fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", minWidth: 56 }}>
          {Math.round(totals.kcal).toLocaleString()}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, transition: "width .3s",
              background: over ? C.danger : pct > 85 ? C.warn : C.success }} />
          </div>
        </div>
        <span style={{ color: C.muted, fontSize: 11 }}>{goal.toLocaleString()} kcal</span>
      </div>

      {/* Macro totals row */}
      {meals.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {macroFields.map(f => (
            <div key={f.key} style={{ textAlign: "center", minWidth: 44 }}>
              <div style={{ color: f.color, fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>{f.label}</div>
              <div style={{ color: C.text, fontSize: 13, fontFamily: "'JetBrains Mono',monospace" }}>{Math.round(totals[f.key])}g</div>
            </div>
          ))}
        </div>
      )}

      {/* Meal cards */}
      {meals.map(m => (
        <MealCard key={m.id} meal={m}
          onUpdate={updated => updateMeal(m.id, updated)}
          onRemove={() => removeMeal(m.id)}
          onSaveToLibrary={() => saveMealToLibrary(m)}
          onSaveItemToLibrary={it => saveItemToLibrary(it)}
          itemLibrary={mealLibrary || []}
          inp={inp}
          macroFields={macroFields}
        />
      ))}

      {showManage && (
        <ManageLibrary library={mealLibrary || []} onDelete={deleteFromLibrary} onClose={() => setShowManage(false)} />
      )}

      {showPicker && (
        <ItemPicker label="meals" library={mealLibrary || []} onSelect={addFromLibrary} onNewBlank={addBlankMeal} onClose={() => setShowPicker(false)} />
      )}

      {/* Add meal button */}
      {!showPicker && !showManage && (
        <button onClick={() => {
          if ((mealLibrary || []).length > 0) setShowPicker(true);
          else addBlankMeal();
        }} style={{
          marginTop: meals.length > 0 ? 8 : 0,
          background: "transparent", border: `1px dashed ${C.border}`, color: C.muted,
          borderRadius: 8, padding: "7px 0", width: "100%", cursor: "pointer",
          fontSize: 13, fontFamily: "inherit", letterSpacing: 0.5,
        }}>+ add meal</button>
      )}
    </div>
  );
}

function ExercisePicker({ onAdd, onClose }) {
  const [query, setQuery] = useState("");
  const filtered = query.length > 0
    ? EXERCISE_DB.filter(e => e.name.toLowerCase().includes(query.toLowerCase()))
    : EXERCISE_DB;
  const groups = filtered.reduce((acc, ex) => {
    if (!acc[ex.category]) acc[ex.category] = [];
    acc[ex.category].push(ex);
    return acc;
  }, {});

  return (
    <div style={{ background: C.surface2, border: `1px solid ${C.borderHi}`, borderRadius: 10, padding: 14, marginBottom: 8 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search exercises…"
          style={{
            flex: 1, background: C.bg, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8,
            padding: "8px 12px", fontSize: 13, fontFamily: "inherit", outline: "none",
          }}
        />
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.dim, fontSize: 18, cursor: "pointer", padding: "0 4px" }}>×</button>
      </div>
      <div style={{ maxHeight: 300, overflowY: "auto" }}>
        {query.length > 0 && (
          <button onClick={() => { onAdd({ name: query }); onClose(); }} style={{
            width: "100%", textAlign: "left", background: C.accent + "15", border: `1px solid ${C.accent + "44"}`,
            color: C.accent, borderRadius: 6, padding: "8px 12px", fontSize: 12, cursor: "pointer",
            fontFamily: "inherit", marginBottom: 8,
          }}>+ Use custom: "{query}"</button>
        )}
        {Object.entries(groups).map(([cat, exercises]) => (
          <div key={cat} style={{ marginBottom: 8 }}>
            <div style={{ color: C.dim, fontSize: 9, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", padding: "4px 0 2px" }}>{cat}</div>
            {exercises.map(ex => (
              <button key={ex.name} onClick={() => { onAdd(ex); onClose(); }} style={{
                display: "block", width: "100%", textAlign: "left", background: "none",
                border: "none", borderBottom: `1px solid ${C.border}`, color: C.text,
                padding: "8px 4px", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              }}
              onMouseEnter={e => e.currentTarget.style.color = C.accent}
              onMouseLeave={e => e.currentTarget.style.color = C.text}
              >{ex.name}</button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressChart({ data, lifts }) {
  if (!data || data.length < 1 || !lifts || lifts.length < 1) return (
    <div style={{ color: C.dim, fontSize: 13, textAlign: "center", padding: 40 }}>
      Log at least one session to see progress charts
    </div>
  );
  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
          <XAxis dataKey="week" stroke={C.dim} fontSize={11} tickLine={false} />
          <YAxis stroke={C.dim} fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.borderHi}`, borderRadius: 8, color: C.text, fontSize: 12 }} />
          {lifts.map(l => (
            <Line key={l.id} type="monotone" dataKey={l.id} name={l.label} stroke={l.color}
              strokeWidth={2} dot={{ r: 4, fill: l.color }} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
        {lifts.map(l => (
          <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 3, background: l.color, borderRadius: 2 }} />
            <span style={{ color: C.muted, fontSize: 11 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CaloriesChart({ data: appData }) {
  if (!appData) return null;
  const points = [];
  for (let w = 1; w <= (appData.weekNum || 1); w++) {
    for (const { key: dk } of ALL_DAYS) {
      const meals = (appData.meals || {})[`meals_${dk}_w${w}`] || [];
      const kcal = meals.reduce((sum, m) => sum + Math.round(calcKcal(m) * (m.serving || 1)), 0);
      if (kcal > 0) {
        const date = appData.startDate ? getDayDate(appData.startDate, w, dk) : null;
        points.push({ label: date ? fmtDate(date) : `W${w} ${dk.toUpperCase()}`, kcal });
      }
    }
  }
  if (points.length < 1) return (
    <div style={{ color: C.dim, fontSize: 13, textAlign: "center", padding: 40 }}>Log meals to see this chart</div>
  );
  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <LineChart data={points} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
          <XAxis dataKey="label" stroke={C.dim} fontSize={10} tickLine={false} />
          <YAxis stroke={C.dim} fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.borderHi}`, borderRadius: 8, color: C.text, fontSize: 12 }}
            formatter={val => [`${val} kcal`, "Calories"]} />
          <Line type="monotone" dataKey="kcal" name="Calories" stroke={C.warn} strokeWidth={2} dot={{ r: 3, fill: C.warn }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function BodyWeightChart({ data: appData }) {
  if (!appData) return null;
  const points = [];
  for (let w = 1; w <= (appData.weekNum || 1); w++) {
    for (const { key: dk } of ALL_DAYS) {
      const bw = (appData.bodyWeight || {})[`bw_${dk}_w${w}`] || null;
      if (bw) {
        const date = appData.startDate ? getDayDate(appData.startDate, w, dk) : null;
        points.push({ label: date ? fmtDate(date) : `W${w} ${dk.toUpperCase()}`, bw });
      }
    }
  }
  if (points.length < 1) return (
    <div style={{ color: C.dim, fontSize: 13, textAlign: "center", padding: 40 }}>Log body weight to see this chart</div>
  );
  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <LineChart data={points} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
          <XAxis dataKey="label" stroke={C.dim} fontSize={10} tickLine={false} />
          <YAxis stroke={C.dim} fontSize={10} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
          <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.borderHi}`, borderRadius: 8, color: C.text, fontSize: 12 }}
            formatter={val => [`${val} lbs`, "Body Weight"]} />
          <Line type="monotone" dataKey="bw" name="Body Weight" stroke={C.steps} strokeWidth={2} dot={{ r: 3, fill: C.steps }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN APP
   ════════════════════════════════════════════ */

export default function App() {
  const [data, setData] = useState(null);
  const [mealLibrary, setMealLibrary] = useState([]);
  const [program, setProgram] = useState({});
  const [activeDay, setActiveDay] = useState("mon");
  const [view, setView] = useState("workout");
  const [week, setWeek] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [progressTab, setProgressTab] = useState("lifts");
  const saveTimeout = useRef(null);
  const libSaveTimeout = useRef(null);
  const progSaveTimeout = useRef(null);

  useEffect(() => {
    Promise.all([loadData(), loadLibrary(), loadProgram()]).then(([saved, lib, prog]) => {
      const d = (saved && saved.sessions) ? saved : emptyState();
      if (!d.workoutDays) d.workoutDays = DEFAULT_WORKOUT_DAYS;
      if (!d.bodyWeight) d.bodyWeight = {};
      if (!d.metrics) d.metrics = {};
      if (!d.startDate) d.startDate = getThisMonday().toISOString();
      // Migrate: if library file is empty but data has mealLibrary, seed from data
      const library = Array.isArray(lib) && lib.length > 0 ? lib : (d.mealLibrary || []);
      delete d.mealLibrary;
      // Migrate: if program file is empty but data has program, seed from data
      const programData = (prog && Object.keys(prog).length > 0) ? prog : (d.program || {});
      delete d.program;
      setData(d);
      setMealLibrary(library);
      setProgram(programData);
      setWeek(d.weekNum || 1);
      if ((!lib || lib.length === 0) && library.length > 0) saveLibrary(library);
      if ((!prog || Object.keys(prog).length === 0) && Object.keys(programData).length > 0) saveProgram(programData);
    });
  }, []);

  const persist = useCallback((newData) => {
    setData(newData);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => saveData(newData), 400);
  }, []);

  const updateLibrary = useCallback((lib) => {
    setMealLibrary(lib);
    if (libSaveTimeout.current) clearTimeout(libSaveTimeout.current);
    libSaveTimeout.current = setTimeout(() => saveLibrary(lib), 400);
  }, []);

  const updateProgram = useCallback((prog) => {
    setProgram(prog);
    if (progSaveTimeout.current) clearTimeout(progSaveTimeout.current);
    progSaveTimeout.current = setTimeout(() => saveProgram(prog), 400);
  }, []);

  const getSession = useCallback((dayKey) => {
    if (!data) return null;
    const sk = sessionKey(dayKey, week);
    if (data.sessions[sk]) return data.sessions[sk];
    const prog = getProgram(program,dayKey);
    if (!prog) return {};
    const session = {};
    prog.exercises.forEach(ex => { session[ex.id] = buildEmptySets(ex); });
    return session;
  }, [data, week, program]);

  const updateSet = useCallback((dayKey, exId, sets) => {
    const sk = sessionKey(dayKey, week);
    const session = getSession(dayKey);
    session[exId] = sets;
    persist({ ...data, sessions: { ...data.sessions, [sk]: session } });
  }, [data, week, getSession, persist]);

  const getSteps = useCallback((dayKey) => {
    if (!data) return 0;
    return data.steps[`steps_${dayKey}_w${week}`] || 0;
  }, [data, week]);

  const updateSteps = useCallback((dayKey, val) => {
    persist({ ...data, steps: { ...data.steps, [`steps_${dayKey}_w${week}`]: val } });
  }, [data, week, persist]);

  const getMeals = useCallback((dayKey) => {
    if (!data) return [];
    return (data.meals || {})[`meals_${dayKey}_w${week}`] || [];
  }, [data, week]);

  const updateMeals = useCallback((dayKey, meals) => {
    persist({ ...data, meals: { ...(data.meals || {}), [`meals_${dayKey}_w${week}`]: meals } });
  }, [data, week, persist]);

  const handleAddExercise = useCallback((dayKey, ex) => {
    const prog = getProgram(program, dayKey);
    const newEx = { id: `custom_${Date.now()}_${Math.random().toString(36).slice(2)}`, name: ex.name, heavy: false, sets: 3, reps: "8-10", startLbs: 0, note: "" };
    const updated = { ...prog, exercises: [...prog.exercises, newEx] };
    updateProgram({ ...program, [dayKey]: updated });
  }, [program, updateProgram]);

  const handleRemoveExercise = useCallback((dayKey, exId) => {
    const prog = getProgram(program, dayKey);
    const updated = { ...prog, exercises: prog.exercises.filter(e => e.id !== exId) };
    updateProgram({ ...program, [dayKey]: updated });
    const sk = sessionKey(dayKey, week);
    const currentSession = data.sessions[sk] ? { ...data.sessions[sk] } : {};
    delete currentSession[exId];
    persist({ ...data, sessions: { ...data.sessions, [sk]: currentSession } });
  }, [data, program, week, persist, updateProgram]);

  const handleAddSet = useCallback((dayKey, exId) => {
    const sk = sessionKey(dayKey, week);
    const session = { ...getSession(dayKey) };
    const sets = session[exId] || [];
    const last = sets[sets.length - 1];
    session[exId] = [...sets, { lbs: last ? last.lbs : 0, reps: 0 }];
    const prog = getProgram(program, dayKey);
    const updated = { ...prog, exercises: prog.exercises.map(e => e.id === exId ? { ...e, sets: session[exId].length } : e) };
    updateProgram({ ...program, [dayKey]: updated });
    persist({ ...data, sessions: { ...data.sessions, [sk]: session } });
  }, [data, program, week, getSession, persist, updateProgram]);

  const handleRemoveSet = useCallback((dayKey, exId) => {
    const sk = sessionKey(dayKey, week);
    const session = { ...getSession(dayKey) };
    const sets = session[exId] || [];
    if (sets.length <= 1) return;
    session[exId] = sets.slice(0, -1);
    const prog = getProgram(program, dayKey);
    const updated = { ...prog, exercises: prog.exercises.map(e => e.id === exId ? { ...e, sets: session[exId].length } : e) };
    updateProgram({ ...program, [dayKey]: updated });
    persist({ ...data, sessions: { ...data.sessions, [sk]: session } });
  }, [data, program, week, getSession, persist, updateProgram]);

  const toggleWorkoutDay = useCallback((dayKey) => {
    const current = data.workoutDays || DEFAULT_WORKOUT_DAYS;
    const isWorkout = current.includes(dayKey);
    const newDays = isWorkout ? current.filter(d => d !== dayKey) : [...current, dayKey];
    persist({ ...data, workoutDays: newDays });
  }, [data, persist]);

  const getMetrics = useCallback((dayKey) => {
    if (!data) return [];
    const raw = (data.metrics || {})[`metrics_${dayKey}_w${week}`];
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    // migrate old object format to array
    const entries = [];
    if (raw.bloodSugar) entries.push({ id: 1, type: "blood_sugar", value: raw.bloodSugar, time: "" });
    if (raw.ketonesPpm) entries.push({ id: 2, type: "ketones_ppm", value: raw.ketonesPpm, time: "" });
    if (raw.ketonesMmol) entries.push({ id: 3, type: "ketones_mmol", value: raw.ketonesMmol, time: "" });
    return entries;
  }, [data, week]);

  const updateMetrics = useCallback((dayKey, val) => {
    persist({ ...data, metrics: { ...(data.metrics || {}), [`metrics_${dayKey}_w${week}`]: val } });
  }, [data, week, persist]);

  const getBodyWeight = useCallback((dayKey) => {
    if (!data) return "";
    return (data.bodyWeight || {})[`bw_${dayKey}_w${week}`] || "";
  }, [data, week]);

  const updateBodyWeight = useCallback((dayKey, val) => {
    persist({ ...data, bodyWeight: { ...(data.bodyWeight || {}), [`bw_${dayKey}_w${week}`]: val } });
  }, [data, week, persist]);

  const changeWeek = (dir) => {
    const nw = Math.max(1, Math.min(52, week + dir));
    setWeek(nw);
    if (data && nw > (data.weekNum || 1)) {
      persist({ ...data, weekNum: nw });
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        if (imported.sessions) {
          // Extract library and program from backup if present
          if (imported.mealLibrary) {
            updateLibrary(imported.mealLibrary);
            delete imported.mealLibrary;
          }
          if (imported.program) {
            updateProgram(imported.program);
            delete imported.program;
          }
          persist(imported);
          setWeek(imported.weekNum || 1);
          alert("Data imported successfully!");
        } else {
          alert("Invalid backup file.");
        }
      } catch { alert("Failed to read file."); }
    };
    input.click();
  };

  const chartData = useCallback(() => {
    if (!data) return { points: [], lifts: [] };
    const liftMap = {};
    const points = [];
    for (let w = 1; w <= (data.weekNum || 1); w++) {
      const point = { week: `W${w}` };
      for (const dk of DAY_KEYS) {
        const sk = sessionKey(dk, w);
        const session = data.sessions[sk];
        if (!session) continue;
        const prog = getProgram(program,dk);
        for (const ex of prog.exercises) {
          if (session[ex.id]) {
            const sets = session[ex.id];
            const completedSets = sets.filter(s => s.reps > 0 && s.lbs > 0);
            if (completedSets.length > 0) {
              const maxLbs = Math.max(...completedSets.map(s => s.lbs));
              point[ex.id] = maxLbs;
              if (!liftMap[ex.id]) liftMap[ex.id] = ex.name;
            }
          }
        }
      }
      if (Object.keys(point).length > 1) points.push(point);
    }
    const LIFT_COLORS = ["#67d4f4", "#f59e0b", "#c5f467", "#a78bfa", "#34d399", "#ef4444", "#ec4899", "#8b5cf6", "#06b6d4", "#84cc16"];
    const lifts = Object.entries(liftMap).map(([id, name], i) => ({
      id, label: name, color: LIFT_COLORS[i % LIFT_COLORS.length],
    }));
    return { points, lifts };
  }, [data]);


  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.muted, fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>Loading...</div>
      </div>
    );
  }

  const isRestDay = !(data.workoutDays || DEFAULT_WORKOUT_DAYS).includes(activeDay);
  const day = isRestDay ? null : getProgram(program,activeDay);
  const session = isRestDay ? null : getSession(activeDay);
  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "'DM Sans','Helvetica Neue',sans-serif", maxWidth: 680, margin: "0 auto", padding: "0 0 80px",
    }}>
      {/* ─── HEADER ─── */}
      <div style={{ padding: "20px 16px 0", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.5, color: C.accent }}>IRON LOG</h1>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button onClick={() => exportData({ ...data, program, mealLibrary })} title="Export backup" style={{
              background: C.surface, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6,
              padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
            }}>↓ Export</button>
            <button onClick={handleImport} title="Import backup" style={{
              background: C.surface, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6,
              padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
            }}>↑ Import</button>
          </div>
        </div>

        {/* WEEK NAV */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, paddingBottom: 14 }}>
          <button onClick={() => changeWeek(-1)} style={{ background: "none", border: "none",
            color: week > 1 ? C.text : C.dim, fontSize: 18, cursor: "pointer", padding: "4px 8px" }}>◀</button>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 16, fontWeight: 600,
            color: C.accent, letterSpacing: 2 }}>WEEK {week}</span>
          <button onClick={() => changeWeek(1)} style={{ background: "none", border: "none",
            color: C.text, fontSize: 18, cursor: "pointer", padding: "4px 8px" }}>▶</button>
        </div>

        {/* VIEW TOGGLE */}
        <div style={{ display: "flex", gap: 0, marginBottom: -1 }}>
          {[{ k: "workout", l: "Workout" }, { k: "progress", l: "Progress" }].map(v => (
            <button key={v.k} onClick={() => setView(v.k)} style={{
              flex: 1, background: view === v.k ? C.surface : "transparent",
              border: `1px solid ${view === v.k ? C.border : "transparent"}`,
              borderBottom: view === v.k ? `1px solid ${C.surface}` : `1px solid ${C.border}`,
              borderRadius: "8px 8px 0 0", padding: "10px 0", color: view === v.k ? C.text : C.dim,
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.5,
            }}>{v.l}</button>
          ))}
        </div>
      </div>

      {/* ─── WORKOUT VIEW ─── */}
      {view === "workout" && (
        <div style={{ padding: 16 }}>
          {/* DAY TABS */}
          <div style={{ display: "flex", gap: 4, marginBottom: 8, overflowX: "auto", paddingBottom: 2 }}>
            {ALL_DAYS.map(({ key: dk, label }) => {
              const sk = sessionKey(dk, week);
              const isWorkoutDay = (data.workoutDays || DEFAULT_WORKOUT_DAYS).includes(dk);
              const hasLogs = isWorkoutDay && data.sessions[sk] && Object.values(data.sessions[sk]).some(
                sets => Array.isArray(sets) && sets.some(s => s.reps > 0));
              const hasSteps = (data.steps[`steps_${dk}_w${week}`] || 0) > 0;
              const isActive = dk === activeDay;
              return (
                <button key={dk} onClick={() => { setActiveDay(dk); setEditMode(false); setShowPicker(false); }} style={{
                  flex: "0 0 auto", minWidth: 44, padding: "7px 4px 5px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                  background: isActive ? C.surface2 : "transparent",
                  border: `1px solid ${isActive ? C.borderHi : C.border}`,
                  color: isActive ? C.text : isWorkoutDay ? C.muted : C.dim,
                  fontSize: 12, fontWeight: 600, position: "relative",
                  borderBottom: `3px solid ${isWorkoutDay ? (isActive ? C.accent : C.accentDim + "66") : "transparent"}`,
                }}>
                  {label}
                  {(hasLogs || hasSteps) && <span style={{ position: "absolute", top: 3, right: 4, width: 4, height: 4,
                    borderRadius: "50%", background: hasLogs ? C.success : C.steps }} />}
                </button>
              );
            })}
          </div>

          {/* WORKOUT / REST TOGGLE + DATE */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            {["workout", "rest"].map(type => {
              const active = type === "workout" ? !isRestDay : isRestDay;
              return (
                <button key={type} onClick={() => {
                  if ((type === "workout") === isRestDay) { toggleWorkoutDay(activeDay); setEditMode(false); setShowPicker(false); }
                }} style={{
                  padding: "4px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.5, textTransform: "uppercase",
                  background: active ? (type === "workout" ? C.accent + "22" : C.surface) : "transparent",
                  border: `1px solid ${active ? (type === "workout" ? C.accent : C.border) : C.border}`,
                  color: active ? (type === "workout" ? C.accent : C.muted) : C.dim,
                }}>{type}</button>
              );
            })}
            <div style={{ flex: 1 }} />
            {data.startDate && (
              <span style={{ color: C.dim, fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>
                {fmtDate(getDayDate(data.startDate, week, activeDay))}
              </span>
            )}
          </div>

          {isRestDay ? (
            <>
              <MetricsSection bodyWeight={getBodyWeight(activeDay)} onBodyWeightChange={v => updateBodyWeight(activeDay, v)} metrics={getMetrics(activeDay)} onMetricsChange={v => updateMetrics(activeDay, v)} />
              <StepTracker steps={getSteps(activeDay)} onUpdate={v => updateSteps(activeDay, v)} />
              <MacroSection meals={getMeals(activeDay)} onUpdate={v => updateMeals(activeDay, v)} isTrainingDay={false} mealLibrary={mealLibrary} onUpdateLibrary={updateLibrary} />
            </>
          ) : (
            <>
              <MetricsSection bodyWeight={getBodyWeight(activeDay)} onBodyWeightChange={v => updateBodyWeight(activeDay, v)} metrics={getMetrics(activeDay)} onMetricsChange={v => updateMetrics(activeDay, v)} />
              <StepTracker steps={getSteps(activeDay)} onUpdate={v => updateSteps(activeDay, v)} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: C.dim, fontSize: 10, fontWeight: 600, letterSpacing: 1.5 }}>EXERCISES</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => { setEditMode(e => !e); setShowPicker(false); }} style={{
                    background: editMode ? C.accentDim + "33" : C.surface,
                    border: `1px solid ${editMode ? C.accent : C.border}`,
                    color: editMode ? C.accent : C.muted,
                    borderRadius: 6, padding: "3px 10px", fontSize: 10,
                    cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
                  }}>{editMode ? "Done" : "Edit"}</button>
                </div>
              </div>

              {day.exercises.map(ex => (
                <ExerciseCard key={ex.id} exercise={ex}
                  sets={session ? (session[ex.id] || buildEmptySets(ex)) : buildEmptySets(ex)}
                  onUpdate={sets => updateSet(activeDay, ex.id, sets)}
                  editMode={editMode}
                  onRemove={() => handleRemoveExercise(activeDay, ex.id)}
                  onAddSet={() => handleAddSet(activeDay, ex.id)}
                  onRemoveSet={() => handleRemoveSet(activeDay, ex.id)}
                />
              ))}
              {editMode && (
                <>
                  <button onClick={() => setShowPicker(p => !p)} style={{
                    width: "100%", background: "transparent", border: `1px dashed ${C.borderHi}`,
                    color: C.accent, borderRadius: 8, padding: "8px 0", cursor: "pointer",
                    fontSize: 13, fontFamily: "inherit", letterSpacing: 0.5, marginBottom: 8,
                  }}>+ Add Exercise</button>
                  {showPicker && <ExercisePicker onAdd={ex => handleAddExercise(activeDay, ex)} onClose={() => setShowPicker(false)} />}
                </>
              )}

              <div style={{ marginTop: 20, marginBottom: 8 }}>
                <span style={{ color: C.warn, fontSize: 10, fontWeight: 600, letterSpacing: 1.5 }}>NUTRITION</span>
              </div>
              <MacroSection meals={getMeals(activeDay)} onUpdate={v => updateMeals(activeDay, v)} isTrainingDay={true} mealLibrary={mealLibrary} onUpdateLibrary={updateLibrary} />

              <div style={{ marginTop: 8, padding: 14, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                <div style={{ color: C.dim, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, marginBottom: 6 }}>SESSION NOTES</div>
                <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>
                  {(activeDay === "mon" || activeDay === "fri")
                    ? "Lower body day — 2 light warm-up sets before working weight on heavy compound."
                    : "Upper body day — begin with activation exercises before pressing."}
                  {" "}Light exercises: 3s concentric / 3s eccentric for tendon loading.
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── PROGRESS VIEW ─── */}
      {view === "progress" && (
        <div style={{ padding: 16 }}>
          {/* PROGRESS SUB-TABS */}
          <div style={{ display: "flex", gap: 4, marginBottom: 16, overflowX: "auto" }}>
            {[
              { k: "lifts", l: "Lifts" },
              { k: "calories", l: "Calories" },
              { k: "bodyweight", l: "Body Weight" },
              { k: "history", l: "History" },
            ].map(t => (
              <button key={t.k} onClick={() => setProgressTab(t.k)} style={{
                flex: "0 0 auto", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.3,
                background: progressTab === t.k ? C.accent + "22" : "transparent",
                border: `1px solid ${progressTab === t.k ? C.accent : C.border}`,
                color: progressTab === t.k ? C.accent : C.muted,
              }}>{t.l}</button>
            ))}
          </div>

          {progressTab === "lifts" && (
            <>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>Main Lift Progression</h2>
              <span style={{ color: C.muted, fontSize: 12 }}>Top working weight per week</span>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginTop: 14 }}>
                <ProgressChart data={chartData().points} lifts={chartData().lifts} />
              </div>
            </>
          )}

          {progressTab === "calories" && (
            <>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>Daily Calories</h2>
              <span style={{ color: C.muted, fontSize: 12 }}>Total kcal logged per day</span>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginTop: 14 }}>
                <CaloriesChart data={data} />
              </div>
            </>
          )}

          {progressTab === "bodyweight" && (
            <>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>Body Weight</h2>
              <span style={{ color: C.muted, fontSize: 12 }}>Daily weigh-in (lbs)</span>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginTop: 14 }}>
                <BodyWeightChart data={data} />
              </div>
            </>
          )}

          {progressTab === "history" && (<>
          {Array.from({ length: Math.min(week, 16) }, (_, i) => week - i).map(w => {
            const weekDays = ALL_DAYS.map(({ key: dk, label }) => {
              const sk = sessionKey(dk, w);
              const steps = (data.steps[`steps_${dk}_w${w}`] || 0);
              const meals = (data.meals || {})[`meals_${dk}_w${w}`] || [];
              const kcal = meals.reduce((sum, m) => sum + Math.round(calcKcal(m) * (m.serving || 1)), 0);
              const bw = (data.bodyWeight || {})[`bw_${dk}_w${w}`] || null;
              const date = data.startDate ? getDayDate(data.startDate, w, dk) : null;
              return { label, dk, session: data.sessions[sk], steps, kcal, bw, date };
            });
            const hasAny = weekDays.some(wd => (wd.session && Object.values(wd.session).some(
              sets => Array.isArray(sets) && sets.some(s => s.reps > 0))) || wd.steps > 0 || wd.kcal > 0 || wd.bw);
            if (!hasAny && w !== week) return null;
            return (
              <div key={w} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, marginBottom: 8 }}>
                <div style={{ color: C.accent, fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>
                  WEEK {w} {w === week && <span style={{ color: C.muted, fontWeight: 400 }}>← current</span>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                  {weekDays.map(wd => {
                    const completed = wd.session && Object.values(wd.session).some(
                      sets => Array.isArray(sets) && sets.some(s => s.reps > 0));
                    const stepsLogged = wd.steps >= STEP_GOAL;
                    const dotColor = completed ? C.success : stepsLogged ? C.steps : C.dim;
                    return (
                      <div key={wd.label} style={{
                        textAlign: "center", background: C.surface2, borderRadius: 8, padding: "6px 2px",
                        border: `1px solid ${completed ? C.success + "44" : C.border}`,
                      }}>
                        <div style={{ color: C.dim, fontSize: 9, fontWeight: 600 }}>{wd.label}</div>
                        {wd.date && <div style={{ color: C.dim, fontSize: 9, marginBottom: 4 }}>{fmtDate(wd.date)}</div>}
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%", margin: "0 auto 4px",
                          background: (completed || stepsLogged) ? dotColor + "22" : C.border,
                          border: `2px solid ${dotColor}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: dotColor, fontSize: 10,
                        }}>{completed ? "✓" : stepsLogged ? "◯" : "–"}</div>
                        {wd.kcal > 0 && <div style={{ color: C.warn, fontSize: 9, fontFamily: "'JetBrains Mono',monospace" }}>{wd.kcal}</div>}
                        {wd.bw && <div style={{ color: C.steps, fontSize: 9, fontFamily: "'JetBrains Mono',monospace" }}>{wd.bw}lb</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          </>)}

        </div>
      )}
    </div>
  );
}
