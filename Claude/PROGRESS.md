# CBL Coaching Platform — Journal de progression

## V5 — UX & Tracking Patch (2026-04-04)

### Features livrées

| # | Feature | Statut |
|---|---------|--------|
| 1 | Badge durée estimée sur toutes les séances (`⏱ ~N min`) | ✅ |
| 2 | Bouton "J'ai fait ma séance" sur Dashboard — modal RPE + durée → localStorage | ✅ |
| 3 | Sections accordéon Dashboard avec Framer Motion + persistance localStorage | ✅ |
| 4 | Intention par séance (italique, toujours visible) | ✅ |
| 5 | Jalon 1 — circuit lactique semaine 2 (2 sets, ~25 min, delta vs J0) | ✅ |
| 6 | Récap semaine — carrousel 4 cartes (stats, volume, donut, conseil coach) | ✅ |
| 7 | Récap mensuel — même structure + barres progression semaine | ✅ |
| 8 | Page `/progression` — calendrier + liste des séances | ✅ |
| 9 | Export A4 PNG haute résolution (html2canvas, dark/light mode) | ✅ |

### Nouveaux fichiers
- `src/utils/sessionUtils.js` — estimateSessionDuration, logSession, computeWeekStats, computeMonthStats, getSessionLog, getPlanWeek
- `src/components/ui/Accordion.jsx` — accordéon réutilisable avec persistance localStorage
- `src/components/ui/SessionCompleteModal.jsx` — modal validation séance (RPE + durée)
- `src/components/ui/WeeklyRecap.jsx` — WeeklyRecap + MonthlyRecap (carrousels swipeables)
- `src/components/ui/SessionExport.jsx` — export A4 PNG via html2canvas
- `src/pages/Progression.jsx` — calendrier + liste historique séances

### Fichiers modifiés
- `src/data/coaching-plan.json` — intentions ajoutées sur toutes les séances (17 sessions, 4 templates) + jalons J0–J4
- `src/pages/Dashboard.jsx` — accordéons, bouton séance validée, KPIs, récaps hebdo/mensuel
- `src/pages/Session.jsx` — intention, durée estimée, export, modal validation
- `src/pages/Diagnostic.jsx` — Jalon 1 circuit-only, présentation jalons en intro
- `src/App.jsx` — route `/progression` ajoutée
- `src/components/layout/Sidebar.jsx` — lien "Progression" ajouté

### localStorage keys
| Clé | Contenu |
|-----|---------|
| `cbl_session_log` | Tableau de séances validées (label, type, rpe, duration, date, week, completed) |
| `cbl_diagnostic` | Résultats diagnostic initial (J0) |
| `cbl_meso_tests` | Résultats jalons circuit (J1, J2…) |
| `cbl_availability` | Jours disponibles (feature existante) |
| `cbl_coach_log` | Historique débriefs coach IA (feature existante) |
| `cbl_accordion_{id}` | État ouvert/fermé de chaque accordéon Dashboard |

---

## V2 — Phase 2 (Janvier 2026)

### Features livrées
- Diagnostic initial 7 tests — profil 4 axes (Force Brute, Endurance Force, Résistance Lactique, Équilibre Push/Pull)
- StoryCard 9:16 exportable PNG
- Jalons circuit + ajustement dynamique plan
- Coach local (zéro API) — 18 scénarios JSON, matching keywords + métriques
- KPI widgets Dashboard

---

## Déploiement

- **Local (Vercel/SPA)** : `npm run build` → `dist/` → copié dans `~/Desktop/Circuits_Street/CBL-Coach/`
- **Vercel** : repo GitHub `CBL-Coaching-Platform`, déploiement auto sur push `main`
- **vite.config.js** : `base: '/'`, `outDir: 'dist'`
- **vercel.json** : rewrites SPA `/* → /index.html`
