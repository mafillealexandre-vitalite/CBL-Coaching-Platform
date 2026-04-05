# Assumptions — CBL Coaching Platform

Hypothèses posées de façon autonome pendant la construction.

---

## Phase 2 — Nouvelles features (2026-04-04)

### Feature 0 — Diagnostic
- Charges goblet squat fixées à 15kg (baseline athlete.json).
- Circuit test = 80 reps total : 10 tractions + 20 dips + 30 pompes + 20 squats.
- Profil calculé localement par `diagnosticEngine.js`, normalisé sur les cibles Espoir.
- Résistance Lactique = complétion circuit (50%) + score temps (50%) + pénalité RPE si > 9 ET complétion < 80%.
- Stockage : `cbl_diagnostic` (dernier test), `cbl_meso_tests` (historique complet pour ajustements).
- Temps de récup encodés dans le protocole (180–240s), timer avec option "Passer".

### Feature 1 — Story 9:16
- Export via html2canvas (inliné par vite-plugin-singlefile → fonctionne en file://).
- Données : score global, force brute, résistance lactique, séances totales, jours avant compét, semaine.
- Nom fichier : `CBL-Story-SemaineN.png`. Si pas de diagnostic : scores affichés comme "—".

### Feature 2 — Charges et affinage
- Charges disponibles : `[0, 5, 10, 15, 20, 30]` kg — aucune autre valeur dans tout le code.
- Muscle-up lesté : B1=0kg, B2=+5kg, B3=+10kg.
- Dips lestés : B1 sem 1-2=0kg, B1 sem 3-4=+5kg, B2=+10kg, B3=+15kg.
- Ajustements automatiques affichés dans Coach > onglet Ajustements (nécessite 2+ diagnostics).

### Feature 3 — Coach local
- Zéro API externe. 18 scénarios CBL dans `coach-rules.json`.
- Matching : métriques (triggers numériques) > mots-clés texte libre. Max 3 réponses par débrief.
- Compatible Wispr (dictée vocale → texte → extraction keywords).

### Feature 4 — KPIs
- Sources : `cbl_session_log` (sessions), `cbl_coach_log` (RPE).
- 4 KPIs : Régularité 28j, Séances cette semaine, RPE moyen 7j, Streak.
- `cbl_session_log` non encore auto-alimenté par Session.jsx (hors scope v2). Pour tester :
  `localStorage.setItem('cbl_session_log', JSON.stringify([{completed:true, date:new Date().toISOString(), rpe:7, label:'Test'}]))`

---

## Plan de coaching
- **Date de compétition** : 2026-09-01 (estimée). À ajuster quand la date est confirmée via `athlete.competitionDate` dans `athlete.json`.
- **Date de début plan** : 2026-04-07 (lundi suivant l'initialisation).
- **5 séances/semaine max** dans les templates M2/M3, **4 séances** en M1. Adapter selon énergie et récupération.
- **Poids des exercices lestés** : départ conservateur (+5kg puis +10kg). À ajuster selon les sensations.
- **Goblet Squat** : objectif conservé à @16kg (poids CBL Amateur). La progression est en reps, pas en charge.

## Circuits
- Les photos CBL_Amateur.jpeg et CBL_Amateur 2.jpeg sont identiques (même circuit, 1st Round OQ7). Une seule entrée dans circuits.json.
- Le circuit "CBL_Elite1:2Finale.jpeg" est l'Amateur ½ Finale (pas Elite), d'après le texte de l'image.
- WOD types (Espoir/Pro/Elite) : circuits d'exemple fournis par CBL, pas nécessairement ceux de la prochaine compétition d'Alexandre.
- Time cap Espoir = 8 min (image WOD_Espoir), conservé comme cible de référence.

## Technique
- Pas de backend pour la V1 : toutes les données de progression sont en localStorage.
- LocalStorage key `cbl_availability` pour les dispos de la semaine.
- LocalStorage key `cbl_perfs` pour les tests de performance.
- Le timer de simulation ne comptabilise pas automatiquement les reps (pas de capteur) — Alexandre coche manuellement les stations.

## Design
- Typographie : Space Grotesk (Google Fonts). Alternative si hors ligne : system-ui.
- Couleur brand : #00D4FF (cyan électrique). Pas de violet.
- Mobile-first : sidebar en drawer sur mobile, fixe sur desktop.
