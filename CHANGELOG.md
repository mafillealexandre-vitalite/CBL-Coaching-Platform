# CBL Coach Pro — Changelog

## v2.0.0 — Pro Coach Edition

### Design System — Premium Slate

Replaced the near-black theme with a professional "Premium Slate" palette.

**Changed files:**
- `tailwind.config.js` — new color tokens (brand → #0EA5E9, warm surfaces, slate borders)
- `src/index.css` — light body bg (#F0EFE9), updated glass utility, new animations
- `src/design-tokens.css` *(new)* — CSS custom properties for all design tokens
- `src/App.jsx` — bg-bg-base, dark navy mobile header
- `src/components/layout/Sidebar.jsx` — full dark navy sidebar (#1A2332) with light text

**Accent changes:**
- Cyan: #00D4FF → #0EA5E9 (sky-500, softer)
- Orange: #FF9500 → #F59E0B (amber-500)
- Green: #00D47A → #10B981 (emerald-500)
- Red: #FF3D3D → #EF4444 (red-500)
- New: Purple #8B5CF6 for elite/secret content

---

### Feature 1 — Gamification Dashboard

**New components in `src/components/Gamification/`:**
- `LevelSystem.jsx` — level ladder (Rookie → Engagé → Confirmé → Elite → Légende), badge arc, level-up modal
- `PerformanceCalendar.jsx` — month heatmap (Mon–Sun, intensity-colored cells, inline session detail)
- `MonthKPIBar.jsx` — 4 stat cards with month-over-month comparison badges
- `NextMonthPreview.jsx` — locked/mystery session cards with countdown

**Updated:** `src/pages/Dashboard.jsx`
- Imports 4 gamification components
- Level badge displayed in dashboard header
- New "Performance & Progression" accordion (after KPIs)
- Level-up detection: shows animated modal on level change

---

### Feature 2 — Exercise Guide with Audio Memo

**New files:**
- `src/data/movementStandards.js` — `PILOT_MODE` flag + 10 movement standards with competition-grade criteria
- `src/components/ExerciseGuide/MovementSVGs.jsx` — SVG line-art for all 10 movements
- `src/components/ExerciseGuide/TechniqueModal.jsx` — modal with illustration + criteria + validate toggle
- `src/components/ExerciseGuide/AudioMemoButton.jsx` — mic/record/play button, stores base64 audio in localStorage

**Updated:** `src/pages/Circuits.jsx`
- Exercise names are now clickable buttons (if a movement standard matches)
- Audio memo button on each exercise row (right side)
- Applies to first 5 circuits when `PILOT_MODE = true`

**How to extend to all circuits:** In `src/data/movementStandards.js`, set `PILOT_MODE = false`.

**How to add a new movement standard:** Add a new entry to `MOVEMENT_STANDARDS` array in `src/data/movementStandards.js` following the `MovementStandard` interface. Add a corresponding SVG to `src/components/ExerciseGuide/MovementSVGs.jsx`.

---

### Feature 3 — Garmin Workout Export (.tcx)

**New file:** `src/components/GarminExport/GarminExport.jsx`
- Inline collapsible panel below each circuit card
- Two sliders: seconds/rep (2–6s) and rest between exercises (30–120s)
- Computed estimated duration display
- Generates valid `.tcx` XML and triggers browser download
- Garmin Connect accepts `.tcx` files natively (upload via web or Garmin Express)

---

### Feature 4 — Progress Map & Monthly Visual

**New components in `src/components/Progression/`:**
- `SessionTimeline.jsx` — horizontal scrollable timeline, nodes per session colored by type, tooltip on click, dotted projection line, 3 secret milestone unlocks
- `MonthlySummaryCard.jsx` — auto-generated monthly summary card with vs-previous-month comparison

**Updated:** `src/pages/Progression.jsx`
- New "Timeline" tab added as default view
- Monthly summary card shown above tabs
- 3 secret circuits added to `src/data/circuits.json` (flagged `secret: true`, `unlocksAt: 20/50/100`)

**How to add a new secret milestone:**
1. Add an entry to `SECRET_MILESTONES` in `src/components/Progression/SessionTimeline.jsx`
2. Add a matching circuit entry to `src/data/circuits.json` with `"secret": true, "unlocksAt": N`

---

### Running locally

```bash
cd cbl-coach-pro
npm install
npm run dev     # → http://localhost:5173
```

### Deploying

```bash
npm run build   # uses vite.config.vercel.js
```
Deploy `dist/` to Vercel or any static host.
