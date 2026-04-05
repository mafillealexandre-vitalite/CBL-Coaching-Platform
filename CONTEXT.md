# CBL Coaching Platform — CONTEXT

## Projet
Plateforme de coaching personnalisée pour préparer la Calisthenics Battle League (CBL), de la division Amateur vers l'Espoir.

## Athlète
- **Nom** : Alexandre Mafille
- **Profil** : Enseignant EPS + athlète calisthenics amateur
- **Vécu CBL** : Première compétition perdue en phase de pool (Set 1 en 5'24/6', Set 2 non terminé)
- **Cause identifiée** : Pas entraîné aux circuits sous fatigue lactique

## Maxima actuels (baseline)
| Mouvement | Max | Objectif 3 mois |
|---|---|---|
| Tractions | 23 | 30 |
| Muscle-up | 7 | 12 |
| Dips | 30 | 40 |
| Pompes | 52 | 65 |
| Goblet Squat @16kg | 30 | 40 |

## Structure du projet

```
CBL-Coaching-Platform/
├── src/
│   ├── data/               # Sources de vérité JSON
│   │   ├── athlete.json    # Profil + maxima + objectifs
│   │   ├── circuits.json   # 11 circuits CBL extraits des photos
│   │   ├── coaching-plan.json # Plan 3 mois complet
│   │   └── stats.json      # Template stats (localStorage en prod)
│   ├── pages/              # 6 pages principales
│   │   ├── Dashboard.jsx   # Vue semaine + dispo dynamique
│   │   ├── Plan.jsx        # Macro/Méso/Micro/Jalons
│   │   ├── Session.jsx     # Séance du jour + timer
│   │   ├── Circuits.jsx    # Circuits CBL + simulation
│   │   ├── Stats.jsx       # Graphiques + saisie manuelle
│   │   └── Profile.jsx     # Profil + countdown compét
│   └── components/
│       └── layout/Sidebar.jsx
├── CONTEXT.md
├── ASSUMPTIONS.md
└── AGENTS.md
```

## Stack
- React 18 + Vite 5
- TailwindCSS 3 (dark mode natif)
- Framer Motion (animations)
- Recharts (graphiques)
- React Router 6
- LocalStorage pour persistance (no backend V1)

## Feature clé : planification dynamique
Le Dashboard permet à Alexandre de cocher ses jours disponibles chaque semaine. Le plan s'adapte automatiquement en assignant les séances sur ces jours. Persisté en localStorage.

## Circuits extraits
Sources : photos dans `/Desktop/Circuits_Street/`
- CBL Premiers Pas (Div 4 - ATLAS) : 1er Tour, 2e Tour, Quart de Finale
- CBL Open Qualifier #7 Paris 2026 : Amateur 1st Round, 2nd Round, ½ Finale, Finale
- CBL Open Qualifier #7 Paris 2026 : Elite Finale
- WOD types : Espoir (Div3), Pro (Div2), Elite (Div1)
