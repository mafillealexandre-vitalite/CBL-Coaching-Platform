# DECISIONS — Vue Coach CBL Coach Pro

## D1 — Auth : flag localStorage
**Décision** : Pas de vrai système d'auth. Un flag `cbl_role` ('athlete' | 'coach') en localStorage + un code PIN simple.
**Pourquoi** : Pas de backend V1, app mono-utilisateur. Aucune bibliothèque auth à ajouter.
**Trade-off** : Pas sécurisé. Acceptable pour V1 usage coach/coaché confiance.

## D2 — Persistence : localStorage uniquement
**Décision** : Toutes les données coach stockées en localStorage, préfixe `cbl_coach_`.
**Pourquoi** : Cohérent avec l'existant. Pas de Supabase, pas de dépendance externe.
**Keys** :
- `cbl_coach_athletes` : liste athlètes
- `cbl_coach_program_${id}` : programme par athlète
- `cbl_coach_standards` : fiches conseil
- `cbl_coach_circuit_times` : temps circuits par athlète

## D3 — Route : /coach-panel (pas /coach)
**Décision** : La vue coach utilise `/coach-panel` car `/coach` est déjà pris par "Coach Claude" (débrief IA).
**Pourquoi** : Évite de casser l'existant.

## D4 — Architecture : CoachPanel monolithique avec sous-composants
**Décision** : Tout le code Coach dans `CoachPanel.jsx` + 2 fichiers extraits (CoachStandards, CoachCircuits).
**Pourquoi** : Les composants Athlete/Program partagent trop d'état pour justifier une séparation en routes.
**Navigation interne** : useState (section, selectedAthlete, selectedWeek) au lieu de React Router imbriqué.

## D5 — Programmation : structure Cycle→Bloc→Semaine en JSON
**Décision** : Structure arborescente JSON avec IDs générés localement (Date.now() + random).
**Pourquoi** : Simple, pas de ORM, cohérent avec le reste de l'app.
**Status semaine** : 'draft' (invisible côté coaché) | 'published' (visible).

## D6 — Vue coaché côté Standards
**Décision** : Ajouter une section "Conseils coach" en haut de Standards.jsx qui lit `cbl_coach_standards`.
**Pourquoi** : Intégration naturelle sans créer une nouvelle page.
**Filtrage** : Affiche les standards non assignés (globaux) + ceux assignés à 'alexandre'.

## D7 — Athlète par défaut seedé : Alexandre Mafille
**Décision** : Au premier chargement coach panel, seeder Alexandre comme premier coaché.
**Pourquoi** : L'app est déjà centrée sur Alexandre. Le coach (Nicolas) le retrouve immédiatement.
**id** : 'alexandre' (consistant avec les clés localStorage existantes).
