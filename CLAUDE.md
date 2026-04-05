# CBL Coaching Platform — Instructions Claude

## Stack
React 18 + Vite + TailwindCSS 3 + Framer Motion + Recharts + React Router 6

## Commandes
```bash
npm install        # installer les dépendances
npm run dev        # dev server (port 5173)
npm run build      # build prod
```

## Données
Toutes les données sont dans `src/data/*.json`. Modifier ces fichiers pour changer le contenu.
- `athlete.json` : profil, maxima, objectifs
- `circuits.json` : circuits CBL
- `coaching-plan.json` : plan 3 mois + templates de séances
- `stats.json` : non utilisé en prod (localStorage)

## Conventions
- Styles : Tailwind classes uniquement (pas de CSS inline sauf pour les couleurs dynamiques)
- Animations : Framer Motion pour les transitions de page et les micro-interactions
- State persistant : localStorage (clés préfixées `cbl_`)
- Pas de backend en V1

## Feature clé
Le sélecteur de disponibilités dans Dashboard.jsx est la feature centrale. Les jours cochés sont persistés en localStorage (`cbl_availability`). Ne pas casser ce flux en modifiant l'assignation des séances.
