import { useState, useEffect, useCallback, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

/* ════════════════════════════════════════════
   PROGRAM DEFINITION
   ════════════════════════════════════════════ */

const PROGRAM = {
  mon: {
    label: "MON", title: "Heavy Squat · Light Deadlift", exercises: [
      { id: "squat_h", name: "Barbell Squat", heavy: true, sets: 4, reps: "5-6", startLbs: 85, note: "Heavy. Deload 10% if form breaks." },
      { id: "rdl_l", name: "DB Romanian Deadlift", heavy: false, sets: 3, reps: "8-10", startLbs: 45, note: "Light. Tempo 3/0/3/0. Hip hinge." },
      { id: "leg_press", name: "Leg Press", heavy: false, sets: 3, reps: "8-10", startLbs: 180, note: "Foot placement mid-high." },
      { id: "calf_raise", name: "Standing Calf Raise", heavy: false, sets: 4, reps: "12-15", startLbs: 100, note: "Full ROM, pause at top." },
      { id: "plank_m", name: "Weighted Plank", heavy: false, sets: 3, reps: "30-45s", startLbs: 0, note: "Add plate when able." },
    ],
    rehab: [
      { id: "rb_iso_flex", name: "Isometric Elbow Flexion Hold", sets: 3, reps: "30-45s", note: "Bicep rehab · Neutral grip · Start 5 lbs" },
      { id: "rb_iso_sup", name: "Isometric Supination Hold", sets: 3, reps: "30s", note: "Bicep rehab · Band or light DB" },
    ]
  },
  wed: {
    label: "WED", title: "Heavy DB Press · Light Push", exercises: [
      { id: "db_press_h", name: "DB Press (Flat)", heavy: true, sets: 3, reps: "5-6", startLbs: 50, note: "Heavy. Bench substitute. Retract scapulae." },
      { id: "incline_l", name: "Incline DB Press", heavy: false, sets: 3, reps: "8-10", startLbs: 30, note: "Light. Tempo 3/0/3/0. 30° incline." },
      { id: "tri_push_l", name: "Tricep Pushdown", heavy: false, sets: 3, reps: "10-12", startLbs: 40, note: "Light. Tempo 3/0/3/0. Rope." },
      { id: "lat_raise", name: "DB Lateral Raise", heavy: false, sets: 3, reps: "12-15", startLbs: 15, note: "Controlled tempo." },
      { id: "cable_fly", name: "Cable Fly", heavy: false, sets: 3, reps: "10-12", startLbs: 25, note: "Slight forward lean." },
    ],
    rehab: [
      { id: "rs_band", name: "Band Pull-Apart", sets: 3, reps: "15-20", note: "Shoulder rehab · Thumbs up · Scapular retraction" },
      { id: "rs_ext_rot", name: "Sidelying External Rotation", sets: 3, reps: "15", note: "Shoulder rehab · 2-5 lb DB · Elbow pinned" },
    ]
  },
  fri: {
    label: "FRI", title: "Heavy Deadlift · Light Squat", exercises: [
      { id: "deadlift_h", name: "Barbell Deadlift", heavy: true, sets: 3, reps: "5-6", startLbs: 135, note: "Heavy. Mixed grip or straps." },
      { id: "squat_l", name: "Barbell Squat", heavy: false, sets: 3, reps: "8-10", startLbs: 60, note: "Light. Tempo 3/0/3/0. Pattern work." },
      { id: "leg_curl", name: "Lying Leg Curl", heavy: false, sets: 3, reps: "10-12", startLbs: 50, note: "Slow eccentric 3s." },
      { id: "hip_thrust", name: "Barbell Hip Thrust", heavy: false, sets: 3, reps: "8-10", startLbs: 95, note: "Pause at top." },
      { id: "hang_knee", name: "Hanging Knee Raise (Straps)", heavy: false, sets: 3, reps: "10-15", startLbs: 0, note: "Ab straps — no bicep load." },
    ],
    rehab: [
      { id: "rb_iso_flex2", name: "Isometric Elbow Flexion Hold", sets: 3, reps: "30-45s", note: "Bicep rehab · Neutral grip" },
      { id: "rb_iso_sup2", name: "Isometric Supination Hold", sets: 3, reps: "30s", note: "Bicep rehab" },
    ]
  },
  sat: {
    label: "SAT", title: "Heavy Incline · Light DB Press · Pull + Rehab", exercises: [
      { id: "incline_h", name: "Incline DB Press", heavy: true, sets: 3, reps: "6-8", startLbs: 40, note: "Heavy. 30° incline." },
      { id: "db_press_l", name: "DB Press (Flat)", heavy: false, sets: 3, reps: "8-10", startLbs: 35, note: "Light. Tempo 3/0/3/0." },
      { id: "db_row", name: "DB Row (Neutral Grip)", heavy: false, sets: 3, reps: "8-10", startLbs: 45, note: "Capped at pain-free weight." },
      { id: "cable_row", name: "Seated Cable Row (Wide)", heavy: false, sets: 3, reps: "10-12", startLbs: 60, note: "Wide grip minimizes bicep." },
      { id: "face_pull", name: "Cable Face Pull", heavy: false, sets: 3, reps: "15-20", startLbs: 20, note: "External rotation at top." },
      { id: "rear_delt", name: "Reverse Pec Deck", heavy: false, sets: 3, reps: "12-15", startLbs: 40, note: "Shoulders down and back." },
    ],
    rehab: [
      { id: "rs_wall", name: "Scapular Wall Slides", sets: 3, reps: "10", note: "Shoulder rehab · W to Y position" },
      { id: "rs_cable_er", name: "Cable External Rotation", sets: 3, reps: "12-15", note: "Shoulder rehab · Elbow at side" },
      { id: "rs_ytw", name: "Prone Y-T-W Raises", sets: 2, reps: "10 each", note: "Shoulder rehab · Light DBs 2-5 lbs" },
      { id: "rs_band2", name: "Band Pull-Apart", sets: 3, reps: "15-20", note: "Shoulder rehab · Thumbs up" },
    ]
  },
};

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
const CHART_LIFTS = [
  { id: "squat_h", label: "Squat", color: "#67d4f4" },
  { id: "deadlift_h", label: "Deadlift", color: "#f59e0b" },
  { id: "db_press_h", label: "DB Press", color: "#c5f467" },
  { id: "incline_h", label: "Incline", color: "#a78bfa" },
];

const STEP_GOAL = 6000;

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
  // Rehab
  { name: "Isometric Elbow Flexion Hold", category: "Rehab" },
  { name: "Isometric Supination Hold", category: "Rehab" },
  { name: "Sidelying External Rotation", category: "Rehab" },
  { name: "Cable External Rotation", category: "Rehab" },
  { name: "Scapular Wall Slides", category: "Rehab" },
  { name: "Prone Y-T-W Raises", category: "Rehab" },
];

/* ════════════════════════════════════════════
   STORAGE — localStorage + JSON file backup
   ════════════════════════════════════════════ */

const STORAGE_KEY = "iron-log-data";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveData(d) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch (e) { console.error("save err", e); }
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
  return { sessions: {}, steps: {}, meals: {}, rehabDone: {}, weekNum: 1, program: {}, workoutDays: DEFAULT_WORKOUT_DAYS, mealLibrary: [] };
}

function getProgram(data, dayKey) {
  if (data && data.program && data.program[dayKey]) return data.program[dayKey];
  if (PROGRAM[dayKey]) return PROGRAM[dayKey];
  return { title: "", exercises: [], rehab: [] };
}

function calcKcal(m) {
  return Math.round((m.protein || 0) * 4 + (m.carbs || 0) * 4 + (m.fat || 0) * 9);
}

function sessionKey(dayKey, week) { return `${dayKey}_w${week}`; }

function buildEmptySets(exercise) {
  return Array.from({ length: exercise.sets }, () => ({
    lbs: exercise.startLbs, reps: 0, rpe: null, painBicep: false, painShoulder: false
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

function PainToggle({ active, label, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: active ? color + "22" : "transparent",
      border: `1px solid ${active ? color : C.border}`,
      color: active ? color : C.dim, borderRadius: 6, padding: "2px 8px", fontSize: 11,
      cursor: "pointer", fontFamily: "inherit", transition: "all .15s", whiteSpace: "nowrap",
    }}>{label}</button>
  );
}

function SetRow({ set, idx, onChange }) {
  const inp = {
    background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6,
    padding: "6px 8px", fontSize: 14, fontFamily: "'JetBrains Mono',monospace",
    width: "100%", outline: "none", textAlign: "center",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr 76px auto auto", gap: 8, alignItems: "center", padding: "5px 0" }}>
      <span style={{ color: C.dim, fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>S{idx + 1}</span>
      <input type="number" placeholder="lbs" value={set.lbs || ""} style={inp}
        onChange={e => onChange({ ...set, lbs: Number(e.target.value) })} />
      <input type="number" placeholder="reps" value={set.reps || ""} style={inp}
        onChange={e => onChange({ ...set, reps: Number(e.target.value) })} />
      <select value={set.rpe || ""} style={{ ...inp, padding: "6px 2px", cursor: "pointer", appearance: "auto" }}
        onChange={e => onChange({ ...set, rpe: e.target.value ? Number(e.target.value) : null })}>
        <option value="">RPE</option>
        {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(v => <option key={v} value={v}>{v}</option>)}
      </select>
      <PainToggle active={set.painBicep} label="Bicep" color={C.danger}
        onClick={() => onChange({ ...set, painBicep: !set.painBicep })} />
      <PainToggle active={set.painShoulder} label="Shldr" color={C.warn}
        onClick={() => onChange({ ...set, painShoulder: !set.painShoulder })} />
    </div>
  );
}

function ExerciseCard({ exercise, sets, onUpdate, isRehab, rehabDone, onRehabToggle, editMode, onRemove, onAddSet, onRemoveSet }) {
  const [open, setOpen] = useState(false);
  const hasData = sets && sets.some(s => s.reps > 0);
  const hasPain = sets && sets.some(s => s.painBicep || s.painShoulder);
  const tagColor = isRehab ? C.rehab : exercise.heavy ? C.accent : C.muted;
  const tagLabel = isRehab ? "REHAB" : exercise.heavy ? "HEAVY" : "LIGHT · 3/0/3/0";
  const currentSets = sets || [];

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${hasPain ? C.danger + "66" : C.border}`,
      borderRadius: 10, marginBottom: 8, overflow: "hidden", transition: "border-color .2s",
    }}>
      <div onClick={() => !isRehab && setOpen(!open)} style={{
        padding: "12px 16px", cursor: isRehab ? "default" : "pointer",
        display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          {isRehab ? (
            <input type="checkbox" checked={!!rehabDone} onChange={onRehabToggle}
              style={{ width: 16, height: 16, accentColor: C.rehab, cursor: "pointer", flexShrink: 0 }} />
          ) : (
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: hasData ? C.success : C.dim, flexShrink: 0 }} />
          )}
          <span style={{
            color: isRehab && rehabDone ? C.dim : C.text, fontSize: 14, fontWeight: 500,
            textDecoration: isRehab && rehabDone ? "line-through" : "none",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{exercise.name}</span>
          <span style={{
            color: tagColor, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase",
            background: tagColor + "15", padding: "2px 8px", borderRadius: 4, flexShrink: 0,
          }}>{tagLabel}</span>
        </div>
        {isRehab && (
          <span style={{ color: C.rehab, fontSize: 12, fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>
            {exercise.sets}×{exercise.reps}
          </span>
        )}
        {!isRehab && (
          <>
            <span style={{ color: C.muted, fontSize: 12, fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>
              {currentSets.length}×{exercise.reps}
            </span>
            <span style={{ color: C.dim, fontSize: 16, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}>▾</span>
          </>
        )}
        {editMode && !isRehab && onRemove && (
          <button onClick={e => { e.stopPropagation(); onRemove(); }} style={{
            background: "none", border: "none", color: C.danger, fontSize: 17,
            cursor: "pointer", padding: "0 0 0 6px", lineHeight: 1, flexShrink: 0,
          }}>×</button>
        )}
      </div>
      {open && !isRehab && (
        <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ padding: "8px 0 4px", color: C.muted, fontSize: 12, fontStyle: "italic" }}>{exercise.note}</div>
          {currentSets.length > 0 && (
            <div>
              <div style={{
                display: "grid", gridTemplateColumns: "32px 1fr 1fr 76px auto auto", gap: 8, padding: "4px 0",
                color: C.dim, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase",
              }}>
                <span></span><span>LBS</span><span>REPS</span><span>RPE</span><span>PAIN</span><span></span>
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
      {isRehab && (
        <div style={{ padding: "0 16px 10px" }}>
          <div style={{ color: C.muted, fontSize: 11, fontStyle: "italic" }}>{exercise.note}</div>
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

function MealPicker({ library, onSelect, onNewBlank, onClose }) {
  const [query, setQuery] = useState("");
  const filtered = library.filter(m => m.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{ background: C.surface2, border: `1px solid ${C.borderHi}`, borderRadius: 10, padding: 14, marginBottom: 8 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search saved meals…"
          style={{
            flex: 1, background: C.bg, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8,
            padding: "8px 12px", fontSize: 13, fontFamily: "inherit", outline: "none",
          }}
        />
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.dim, fontSize: 18, cursor: "pointer", padding: "0 4px" }}>×</button>
      </div>
      <div style={{ maxHeight: 220, overflowY: "auto" }}>
        {filtered.length === 0 && (
          <div style={{ color: C.dim, fontSize: 12, padding: "6px 2px" }}>No saved meals{query ? " matching that search" : ""}.</div>
        )}
        {filtered.map((m, i) => (
          <button key={i} onClick={() => onSelect(m)} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            width: "100%", background: "transparent", border: `1px solid ${C.border}`,
            borderRadius: 8, padding: "8px 12px", marginBottom: 4, cursor: "pointer",
            fontFamily: "inherit", color: C.text, textAlign: "left",
          }}>
            <span style={{ fontSize: 13 }}>{m.name}</span>
            <span style={{ color: C.dim, fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>
              {m.protein}p · {m.carbs}c · {m.fat}f · {calcKcal(m)} kcal
            </span>
          </button>
        ))}
      </div>
      <button onClick={onNewBlank} style={{
        marginTop: 8, width: "100%", background: "transparent", border: `1px dashed ${C.borderHi}`,
        color: C.accent, borderRadius: 8, padding: "7px 0", cursor: "pointer",
        fontSize: 12, fontFamily: "inherit",
      }}>+ new blank meal</button>
    </div>
  );
}

function ManageLibrary({ library, onDelete, onClose }) {
  return (
    <div style={{ background: C.surface2, border: `1px solid ${C.borderHi}`, borderRadius: 10, padding: 14, marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ color: C.warn, fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>MEAL LIBRARY</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.dim, fontSize: 18, cursor: "pointer", padding: "0 4px" }}>×</button>
      </div>
      {library.length === 0 && (
        <div style={{ color: C.dim, fontSize: 12, padding: "4px 2px" }}>No saved meals yet.</div>
      )}
      {library.map((m, i) => (
        <div key={i} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", marginBottom: 4,
        }}>
          <div>
            <span style={{ color: C.text, fontSize: 13 }}>{m.name}</span>
            <span style={{ color: C.dim, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", marginLeft: 10 }}>
              {m.protein}p · {m.carbs}c · {m.fat}f · {calcKcal(m)} kcal
            </span>
          </div>
          <button onClick={() => onDelete(m.name)} style={{
            background: "none", border: "none", color: C.dim, fontSize: 14,
            cursor: "pointer", padding: "0 4px", lineHeight: 1,
          }}>✕</button>
        </div>
      ))}
    </div>
  );
}

function MacroSection({ meals, onUpdate, isTrainingDay, mealLibrary, onUpdateLibrary }) {
  const [showPicker, setShowPicker] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const goal = isTrainingDay ? 2800 : 2000;

  const totals = meals.reduce((acc, m) => {
    const s = m.serving || 1;
    return {
      protein: acc.protein + (m.protein || 0) * s,
      carbs: acc.carbs + (m.carbs || 0) * s,
      fiber: acc.fiber + (m.fiber || 0) * s,
      fat: acc.fat + (m.fat || 0) * s,
      satFat: acc.satFat + (m.satFat || 0) * s,
      kcal: acc.kcal + calcKcal(m) * s,
    };
  }, { protein: 0, carbs: 0, fiber: 0, fat: 0, satFat: 0, kcal: 0 });

  const pct = Math.min((totals.kcal / goal) * 100, 100);
  const over = totals.kcal > goal;

  const addBlankMeal = () => {
    onUpdate([...meals, { id: Date.now(), name: "", protein: 0, carbs: 0, fiber: 0, fat: 0, satFat: 0, serving: 1 }]);
    setShowPicker(false);
  };
  const addFromLibrary = (libMeal) => {
    onUpdate([...meals, { ...libMeal, id: Date.now(), serving: 1 }]);
    setShowPicker(false);
  };
  const updateMeal = (id, field, val) => onUpdate(meals.map(m => m.id === id ? { ...m, [field]: val } : m));
  const removeMeal = (id) => onUpdate(meals.filter(m => m.id !== id));

  const saveToLibrary = (meal) => {
    const entry = { name: meal.name, protein: meal.protein || 0, carbs: meal.carbs || 0, fiber: meal.fiber || 0, fat: meal.fat || 0, satFat: meal.satFat || 0 };
    const existing = (mealLibrary || []).findIndex(m => m.name === meal.name);
    const updated = existing >= 0
      ? mealLibrary.map((m, i) => i === existing ? entry : m)
      : [...(mealLibrary || []), entry];
    onUpdateLibrary(updated);
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
          {totals.kcal.toLocaleString()}
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

      {/* Column headers */}
      {meals.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 52px 52px 52px 52px 52px 44px 28px 24px", gap: 4,
          color: C.dim, fontSize: 9, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase",
          padding: "0 0 4px", marginBottom: 2 }}>
          <span>MEAL</span>
          <span style={{ textAlign: "center" }}>×SRV</span>
          {macroFields.map(f => <span key={f.key} style={{ textAlign: "center", color: f.color }}>{f.label}</span>)}
          <span style={{ textAlign: "center" }}>KCAL</span>
          <span style={{ textAlign: "center" }}>LIB</span>
          <span></span>
        </div>
      )}

      {/* Meal rows */}
      {meals.map(m => (
        <div key={m.id} style={{ display: "grid", gridTemplateColumns: "1fr 40px 52px 52px 52px 52px 52px 44px 28px 24px", gap: 4, marginBottom: 5, alignItems: "center" }}>
          <input placeholder="meal / food" value={m.name} style={{ ...inp, textAlign: "left", padding: "5px 8px", fontSize: 12 }}
            onChange={e => updateMeal(m.id, "name", e.target.value)} />
          <input type="number" placeholder="1" value={m.serving ?? 1} style={{ ...inp, color: C.steps }}
            step="0.25" min="0.25"
            onChange={e => updateMeal(m.id, "serving", Number(e.target.value) || 1)} />
          {macroFields.map(f => (
            <input key={f.key} type="number" placeholder="0" value={m[f.key] || ""} style={inp}
              onChange={e => updateMeal(m.id, f.key, Number(e.target.value) || 0)} />
          ))}
          <span style={{ color: C.muted, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", textAlign: "center" }}>
            {Math.round(calcKcal(m) * (m.serving || 1))}
          </span>
          <button
            onClick={() => saveToLibrary(m)}
            disabled={!m.name.trim()}
            title="Save to library"
            style={{
              background: "none", border: `1px solid ${m.name.trim() ? C.warn + "88" : C.border}`,
              color: m.name.trim() ? C.warn : C.dim, fontSize: 10,
              cursor: m.name.trim() ? "pointer" : "default", borderRadius: 4,
              padding: "2px 0", lineHeight: 1, fontFamily: "inherit", width: "100%",
            }}>↑</button>
          <button onClick={() => removeMeal(m.id)} style={{
            background: "none", border: "none", color: C.dim, fontSize: 14, cursor: "pointer",
            padding: 0, lineHeight: 1, fontFamily: "inherit",
          }}>✕</button>
        </div>
      ))}

      {showManage && (
        <ManageLibrary
          library={mealLibrary || []}
          onDelete={deleteFromLibrary}
          onClose={() => setShowManage(false)}
        />
      )}

      {showPicker && (
        <MealPicker
          library={mealLibrary || []}
          onSelect={addFromLibrary}
          onNewBlank={addBlankMeal}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Add row button */}
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

function ProgressChart({ data }) {
  if (!data || data.length < 1) return (
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
          {CHART_LIFTS.map(l => (
            <Line key={l.id} type="monotone" dataKey={l.id} name={l.label} stroke={l.color}
              strokeWidth={2} dot={{ r: 4, fill: l.color }} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
        {CHART_LIFTS.map(l => (
          <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 3, background: l.color, borderRadius: 2 }} />
            <span style={{ color: C.muted, fontSize: 11 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN APP
   ════════════════════════════════════════════ */

export default function App() {
  const [data, setData] = useState(null);
  const [activeDay, setActiveDay] = useState("mon");
  const [view, setView] = useState("workout");
  const [week, setWeek] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const saveTimeout = useRef(null);

  useEffect(() => {
    const saved = loadData();
    const d = saved || emptyState();
    if (!d.program) d.program = {};
    if (!d.workoutDays) d.workoutDays = DEFAULT_WORKOUT_DAYS;
    if (!d.mealLibrary) d.mealLibrary = [];
    setData(d);
    setWeek(d.weekNum || 1);
  }, []);

  const persist = useCallback((newData) => {
    setData(newData);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => saveData(newData), 400);
  }, []);

  const getSession = useCallback((dayKey) => {
    if (!data) return null;
    const sk = sessionKey(dayKey, week);
    if (data.sessions[sk]) return data.sessions[sk];
    const prog = getProgram(data, dayKey);
    if (!prog) return {};
    const session = {};
    prog.exercises.forEach(ex => { session[ex.id] = buildEmptySets(ex); });
    return session;
  }, [data, week]);

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
    const prog = getProgram(data, dayKey);
    const newEx = { id: `custom_${Date.now()}_${Math.random().toString(36).slice(2)}`, name: ex.name, heavy: false, sets: 3, reps: "8-10", startLbs: 0, note: "" };
    const updated = { ...prog, exercises: [...prog.exercises, newEx] };
    persist({ ...data, program: { ...(data.program || {}), [dayKey]: updated } });
  }, [data, persist]);

  const handleRemoveExercise = useCallback((dayKey, exId) => {
    const prog = getProgram(data, dayKey);
    const updated = { ...prog, exercises: prog.exercises.filter(e => e.id !== exId) };
    const sk = sessionKey(dayKey, week);
    const currentSession = data.sessions[sk] ? { ...data.sessions[sk] } : {};
    delete currentSession[exId];
    persist({ ...data, program: { ...(data.program || {}), [dayKey]: updated }, sessions: { ...data.sessions, [sk]: currentSession } });
  }, [data, week, persist]);

  const handleAddSet = useCallback((dayKey, exId) => {
    const sk = sessionKey(dayKey, week);
    const session = { ...getSession(dayKey) };
    const sets = session[exId] || [];
    const last = sets[sets.length - 1];
    session[exId] = [...sets, { lbs: last ? last.lbs : 0, reps: 0, rpe: null, painBicep: false, painShoulder: false }];
    const prog = getProgram(data, dayKey);
    const updated = { ...prog, exercises: prog.exercises.map(e => e.id === exId ? { ...e, sets: session[exId].length } : e) };
    persist({ ...data, sessions: { ...data.sessions, [sk]: session }, program: { ...(data.program || {}), [dayKey]: updated } });
  }, [data, week, getSession, persist]);

  const handleRemoveSet = useCallback((dayKey, exId) => {
    const sk = sessionKey(dayKey, week);
    const session = { ...getSession(dayKey) };
    const sets = session[exId] || [];
    if (sets.length <= 1) return;
    session[exId] = sets.slice(0, -1);
    const prog = getProgram(data, dayKey);
    const updated = { ...prog, exercises: prog.exercises.map(e => e.id === exId ? { ...e, sets: session[exId].length } : e) };
    persist({ ...data, sessions: { ...data.sessions, [sk]: session }, program: { ...(data.program || {}), [dayKey]: updated } });
  }, [data, week, getSession, persist]);

  const toggleWorkoutDay = useCallback((dayKey) => {
    const current = data.workoutDays || DEFAULT_WORKOUT_DAYS;
    const isWorkout = current.includes(dayKey);
    const newDays = isWorkout ? current.filter(d => d !== dayKey) : [...current, dayKey];
    persist({ ...data, workoutDays: newDays });
  }, [data, persist]);

  const getRehabDone = useCallback((dayKey, rehabId) => {
    if (!data) return false;
    return !!(data.rehabDone || {})[`${rehabId}_${dayKey}_w${week}`];
  }, [data, week]);

  const toggleRehab = useCallback((dayKey, rehabId) => {
    const k = `${rehabId}_${dayKey}_w${week}`;
    const rd = { ...(data.rehabDone || {}), [k]: !((data.rehabDone || {})[k]) };
    persist({ ...data, rehabDone: rd });
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
    if (!data) return [];
    const points = [];
    for (let w = 1; w <= (data.weekNum || 1); w++) {
      const point = { week: `W${w}` };
      CHART_LIFTS.forEach(lift => {
        for (const dk of DAY_KEYS) {
          const sk = sessionKey(dk, w);
          const session = data.sessions[sk];
          if (session && session[lift.id]) {
            const sets = session[lift.id];
            const maxLbs = Math.max(...sets.filter(s => s.reps > 0).map(s => s.lbs), 0);
            if (maxLbs > 0) point[lift.id] = maxLbs;
          }
        }
      });
      if (Object.keys(point).length > 1) points.push(point);
    }
    return points;
  }, [data]);

  const painCount = useCallback(() => {
    if (!data) return { bicep: 0, shoulder: 0 };
    let b = 0, s = 0;
    DAY_KEYS.forEach(dk => {
      const sk = sessionKey(dk, week);
      const session = data.sessions[sk];
      if (session) Object.values(session).forEach(sets => {
        if (Array.isArray(sets)) sets.forEach(set => {
          if (set.painBicep) b++;
          if (set.painShoulder) s++;
        });
      });
    });
    return { bicep: b, shoulder: s };
  }, [data, week]);

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.muted, fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>Loading...</div>
      </div>
    );
  }

  const activeDayMeta = ALL_DAYS.find(d => d.key === activeDay);
  const isRestDay = !(data.workoutDays || DEFAULT_WORKOUT_DAYS).includes(activeDay);
  const day = isRestDay ? null : getProgram(data, activeDay);
  const session = isRestDay ? null : getSession(activeDay);
  const pain = painCount();

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
            <span style={{ color: C.muted, fontSize: 12 }}>4-Day Heavy/Light · Compound Focus · 3/0/3/0 Tendon Tempo</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button onClick={() => exportData(data)} title="Export backup" style={{
              background: C.surface, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6,
              padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
            }}>↓ Export</button>
            <button onClick={handleImport} title="Import backup" style={{
              background: C.surface, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6,
              padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
            }}>↑ Import</button>
          </div>
        </div>

        {/* PAIN BADGES */}
        {(pain.bicep > 0 || pain.shoulder > 0) && (
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {pain.bicep > 0 && <span style={{ background: C.danger + "22", color: C.danger, fontSize: 10,
              fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>⚠ Bicep pain ×{pain.bicep} this week</span>}
            {pain.shoulder > 0 && <span style={{ background: C.warn + "22", color: C.warn, fontSize: 10,
              fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>⚠ Shoulder pain ×{pain.shoulder} this week</span>}
          </div>
        )}

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

          {/* WORKOUT / REST TOGGLE */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
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
          </div>

          {isRestDay ? (
            <>
              <StepTracker steps={getSteps(activeDay)} onUpdate={v => updateSteps(activeDay, v)} />
              <MacroSection meals={getMeals(activeDay)} onUpdate={v => updateMeals(activeDay, v)} isTrainingDay={false} mealLibrary={data.mealLibrary} onUpdateLibrary={lib => persist({ ...data, mealLibrary: lib })} />
            </>
          ) : (
            <>
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
                <ExerciseCard key={ex.id} exercise={ex} isRehab={false}
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
                <span style={{ color: C.rehab, fontSize: 10, fontWeight: 600, letterSpacing: 1.5 }}>REHAB PROTOCOL</span>
              </div>
              {day.rehab.map(ex => (
                <ExerciseCard key={ex.id} exercise={ex} isRehab={true} sets={null} onUpdate={() => {}}
                  rehabDone={getRehabDone(activeDay, ex.id)}
                  onRehabToggle={() => toggleRehab(activeDay, ex.id)} />
              ))}

              <div style={{ marginTop: 20, marginBottom: 8 }}>
                <span style={{ color: C.warn, fontSize: 10, fontWeight: 600, letterSpacing: 1.5 }}>NUTRITION</span>
              </div>
              <MacroSection meals={getMeals(activeDay)} onUpdate={v => updateMeals(activeDay, v)} isTrainingDay={true} mealLibrary={data.mealLibrary} onUpdateLibrary={lib => persist({ ...data, mealLibrary: lib })} />

              <div style={{ marginTop: 8, padding: 14, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                <div style={{ color: C.dim, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, marginBottom: 6 }}>SESSION NOTES</div>
                <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>
                  {(activeDay === "mon" || activeDay === "fri")
                    ? "Lower body day — 2 light warm-up sets before working weight on heavy compound."
                    : "Upper body day — begin with rehab/activation exercises before pressing."}
                  {" "}Light exercises: 3s concentric / 3s eccentric for tendon loading.
                  {" "}Log pain flags if any discomfort in bicep or shoulder during sets.
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── PROGRESS VIEW ─── */}
      {view === "progress" && (
        <div style={{ padding: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>Main Lift Progression</h2>
          <span style={{ color: C.muted, fontSize: 12 }}>Top working weight per week</span>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginTop: 14 }}>
            <ProgressChart data={chartData()} />
          </div>

          {/* SESSION HISTORY */}
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: "24px 0 12px" }}>Session History</h3>
          {Array.from({ length: Math.min(week, 16) }, (_, i) => week - i).map(w => {
            const weekDays = ALL_DAYS.map(({ key: dk, label, rest }) => {
              const sk = sessionKey(dk, w);
              const steps = (data.steps[`steps_${dk}_w${w}`] || 0);
              return { label, rest, session: rest ? null : data.sessions[sk], steps };
            });
            const hasAny = weekDays.some(wd => (!wd.rest && wd.session && Object.values(wd.session).some(
              sets => Array.isArray(sets) && sets.some(s => s.reps > 0))) || wd.steps > 0);
            if (!hasAny && w !== week) return null;
            return (
              <div key={w} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, marginBottom: 8 }}>
                <div style={{ color: C.accent, fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>
                  WEEK {w} {w === week && <span style={{ color: C.muted, fontWeight: 400 }}>← current</span>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                  {weekDays.map(wd => {
                    const completed = !wd.rest && wd.session && Object.values(wd.session).some(
                      sets => Array.isArray(sets) && sets.some(s => s.reps > 0));
                    const stepsLogged = wd.steps >= STEP_GOAL;
                    const color = completed ? C.success : stepsLogged ? C.steps : C.dim;
                    return (
                      <div key={wd.label} style={{ textAlign: "center" }}>
                        <div style={{ color: C.dim, fontSize: 9, fontWeight: 600, marginBottom: 4 }}>{wd.label}</div>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%", margin: "0 auto",
                          background: (completed || stepsLogged) ? color + "22" : C.border,
                          border: `2px solid ${color}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color, fontSize: 11,
                        }}>{completed ? "✓" : stepsLogged ? "◯" : "–"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* PAIN SUMMARY */}
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: "24px 0 12px" }}>Pain Flag Summary — Week {week}</h3>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: C.danger, fontSize: 30, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{pain.bicep}</div>
                <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Bicep flags</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: C.warn, fontSize: 30, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{pain.shoulder}</div>
                <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Shoulder flags</div>
              </div>
            </div>
            {(pain.bicep > 3 || pain.shoulder > 3) && (
              <div style={{ marginTop: 14, padding: 10, background: C.danger + "11", borderRadius: 8,
                color: C.danger, fontSize: 12, textAlign: "center" }}>
                Multiple pain flags detected — bring this up in your next chat for adjustments
              </div>
            )}
            {pain.bicep === 0 && pain.shoulder === 0 && (
              <div style={{ marginTop: 10, color: C.success, fontSize: 12, textAlign: "center" }}>
                No pain flags this week ✓
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
