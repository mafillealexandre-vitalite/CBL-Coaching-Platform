# CBL Coaching Platform — Instructions Codex/Agents

## Projet
Application React de coaching CBL (Calisthenics Battle League) pour Alexandre Mafille.

## Stack
- React 18 + Vite 5 + TailwindCSS 3
- Framer Motion (animations)
- Recharts (graphiques stats)
- React Router 6 (navigation SPA)
- Pas de backend (localStorage uniquement)

## Architecture
```
src/
  data/           → fichiers JSON (source de vérité)
  pages/          → Dashboard, Plan, Session, Circuits, Stats, Profile
  components/
    layout/       → Sidebar
    ui/           → composants réutilisables
```

## Règles
1. Ne jamais casser la feature de disponibilité (Dashboard.jsx → `cbl_availability` localStorage)
2. Toujours utiliser les classes Tailwind de tailwind.config.js (brand, surface, border, text-muted, etc.)
3. Toutes les données viennent de `src/data/*.json` — pas de données hardcodées dans les composants
4. Mobile-first : tester en vue mobile d'abord
5. Les couleurs dynamiques (basées sur des valeurs JSON) peuvent être en style inline

## Tests rapides
```bash
npm run dev   # vérifier que tout compile
npm run build # vérifier le build prod
```
