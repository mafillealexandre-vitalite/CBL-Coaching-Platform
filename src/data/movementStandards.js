/**
 * Movement standards — Critères officiels CBL (Règlement Solo 2025/26)
 * Source : "CBL 2025-26 _ Déroulement & Règlement Battle solo.pdf"
 */
export const PILOT_MODE = false

/** @typedef {{ id: string, name: string, category: 'PULL'|'PUSH'|'LEGS'|'CORE'|'CARDIO', criteria: string[], noRep?: string[], svgKey: string, coachTip?: string }} MovementStandard */

/** @type {MovementStandard[]} */
export const MOVEMENT_STANDARDS = [
  // ─── PULL ─────────────────────────────────────────────────────────────────
  {
    id: 'muscle-up',
    name: 'Muscle-up',
    category: 'PULL',
    criteria: [
      'Départ en suspension, bras tendus, coudes verrouillés, corps aligné (épaules, hanches, genoux, chevilles)',
      'Ascension en deux temps : tirage (poitrine au-dessus de la barre) puis poussée type dips — phases fluides et continues',
      'Rep validée : coudes verrouillés en haut ET épaules au-dessus de la barre',
      'Retour complet en position de départ, bras tendus, avant la rep suivante',
      'Jambes tendues et pieds joints du début à la fin — pas de flexion de genoux',
      'Léger balancier toléré avant le tirage si le corps reste droit (sans flexion hanches/genoux)',
      'Kipping interdit — pas de flexion des genoux/hanches pour générer de l\'élan',
      'False grip interdit — contact du poignet avec la barre non autorisé',
    ],
    noRep: [
      'False grip (contact du poignet avec la barre)',
      'Pieds écartés ou flexion de genoux à tout moment',
      'Discontinuité : pause, double rebond ou retour vers le bas pendant la montée',
      'Départ non conforme (bras non tendus, corps non aligné)',
      'Flexion de hanches excessive ou retour de hanches trop marqué lors de la transition',
      'Balancier supérieur à 30° entre les répétitions',
      'Passage non simultané des épaules au-dessus de la barre',
      'Coudes non verrouillés en haut ou en bas',
      'Épaules non au-dessus de la barre au verrouillage final',
    ],
    svgKey: 'muscleUp',
    coachTip: 'Les deux phases (tirage + poussée) doivent s\'enchaîner sans pause. Toute pause au niveau de la barre = no rep.',
  },
  {
    id: 'traction',
    name: 'Pull-up (traction)',
    category: 'PULL',
    criteria: [
      'Suspendu à la barre en prise pronation (paumes vers l\'avant), bras tendus, coudes verrouillés',
      'Corps aligné : épaules, hanches, genoux et chevilles sur une même ligne',
      'Jambes tendues, sans flexion de genoux, pieds joints (ou disques serrés si lesté)',
      'Phase de montée : tirage fluide et continu — le menton doit clairement passer AU-DESSUS de la barre',
      'Le simple contact du menton sur la barre ne suffit pas',
      'Retour en position de départ : bras entièrement tendus et alignement complet',
      'Kipping interdit — pas de flexion des hanches ou genoux pour générer de l\'élan',
      'Largeur des mains limitée à 1m05 entre les mains',
    ],
    noRep: [
      'False grip (contact du poignet avec la barre)',
      'Pieds écartés ou flexion de genoux',
      'Discontinuité : pause, double rebond ou retour vers le bas pendant la montée',
      'Départ non conforme (bras non tendus, corps non aligné)',
      'Absence de retour bras tendus avant de lâcher la barre',
      'Flexion de hanche (cassure du gainage)',
      'Glissement des poignets sur la barre pendant la montée',
      'Balancier excessif entre les répétitions',
      'Menton non visible au-dessus de la barre',
    ],
    svgKey: 'pullUp',
    coachTip: 'Le menton doit CLAIREMENT passer au-dessus. En cas de doute pour le juge → no rep. Vise la poitrine à la barre.',
  },
  {
    id: 'chin-up',
    name: 'Chin-up (supination)',
    category: 'PULL',
    criteria: [
      'Suspendu à la barre en prise supination (paumes vers soi), bras tendus, coudes verrouillés',
      'Corps aligné : épaules, hanches, genoux et chevilles sur une même ligne',
      'Jambes tendues, sans flexion de genoux, pieds joints',
      'Le menton doit clairement passer au-dessus de la barre',
      'Retour en position de départ bras entièrement tendus',
      'Kipping interdit — pas de flexion des hanches ou genoux',
      'Largeur des mains limitée à 1m05',
    ],
    noRep: [
      'Pieds écartés ou flexion de genoux',
      'Discontinuité du mouvement',
      'Menton non visible au-dessus de la barre',
      'Absence de retour bras tendus',
      'Flexion de hanche / cassure du gainage',
      'Balancier excessif',
    ],
    svgKey: 'pullUp',
    coachTip: 'La prise supination sollicite davantage le biceps. Même critères stricts que le pull-up pour la validation.',
  },
  {
    id: 'chest-to-bar',
    name: 'Chest-to-bar pull-up',
    category: 'PULL',
    criteria: [
      'Même règles que le Pull-up standard avec amplitude augmentée',
      'La poitrine (partie basse des pectoraux) doit toucher la barre à chaque répétition',
      'Départ en dead hang, bras complètement tendus',
      'Kipping interdit — tirage strict uniquement',
      'Retour en position de départ bras entièrement tendus',
    ],
    noRep: [
      'Poitrine ne touche pas la barre (= traction standard, rep non comptée)',
      'Kipping ou flexion des hanches/genoux',
      'Absence de retour bras tendus',
      'Menton seul au-dessus de la barre sans contact poitrine',
    ],
    svgKey: 'chestToBar',
    coachTip: 'Si la poitrine ne touche pas la barre, c\'est une traction standard — la rep n\'est pas comptée.',
  },
  // ─── PUSH ─────────────────────────────────────────────────────────────────
  {
    id: 'dips',
    name: 'Dips (parallèles)',
    category: 'PUSH',
    criteria: [
      'Position de départ : bras tendus en appui, coudes verrouillés, jambes tendues, corps aligné (hanches, genoux, chevilles)',
      'Descente par flexion des bras jusqu\'à ce que l\'ARRIÈRE de l\'épaule soit plus bas que la pointe du coude (olécrane)',
      'Pendant la descente : hanches passent EN DESSOUS du plan horizontal formé par le haut des barres',
      'Remontée validée en revenant à la position de départ complète (bras tendus, corps aligné)',
      'Jambes tendues et pieds joints du début à la fin — flexion de genoux interdite',
      'Hanches, genoux et chevilles doivent rester alignés — pieds en arrière autorisés si jambes tendues',
      'Pas de kick avant ou arrière entre les répétitions',
      'Pour les dips lestés : le disque doit suivre proportionnellement l\'amplitude (descente + remontée)',
    ],
    noRep: [
      'Pieds écartés ou flexion de genoux',
      'Perte d\'alignement chevilles/genoux/hanches',
      'Kick avant, arrière ou retour de jambes pendant l\'exécution',
      'Mouvement discontinu : pause, double rebond ou redescente pendant la montée',
      'Remontée non simultanée des épaules',
      'Coudes non verrouillés en haut du mouvement',
      'Amplitude basse non respectée : hanches au-dessus de la ligne des barres OU arrière d\'épaule pas plus bas que l\'olécrane',
      'Absence de retour en position de départ entre les répétitions',
      'Dips lestés : disque immobile ne suivant pas l\'amplitude',
    ],
    svgKey: 'dips',
    coachTip: 'L\'amplitude en bas est double : hanches sous la ligne des barres ET arrière d\'épaule sous la pointe du coude. Les deux.',
  },

  {
    id: 'push-up',
    name: 'Push-up (pompes)',
    category: 'PUSH',
    criteria: [
      'Position de départ : paumes à plat sur le support ou sol, pieds joints, corps aligné (chevilles, genoux, hanches, épaules)',
      'Bras et jambes tendus, coudes verrouillés en extension',
      'Descente par flexion des coudes jusqu\'au contact de la poitrine avec la cible (sol/fil tendu/parallettes)',
      'Le tronc et les hanches descendent simultanément — pas de cassure',
      'Remontée en un seul bloc jusqu\'à la position de départ (bras tendus, corps aligné)',
      'Jambes tendues et pieds joints pendant toute la répétition',
      'Si lesté avec gilet : le gilet doit être en contact avec la cible ET la poitrine avec le gilet',
    ],
    noRep: [
      'Pieds écartés ou flexion de genoux',
      'Discontinuité : pause, double rebond ou retour vers le bas pendant la montée',
      'Départ non conforme (coudes non verrouillés ou corps non aligné)',
      'Amplitude haute non atteinte : bras non tendus ou corps non aligné',
      'Amplitude basse non atteinte : pas de contact avec la cible ET arrière d\'épaule pas plus bas que l\'olécrane',
      'Décollage des pieds pendant la répétition',
      'Absence de retour en position de départ entre les répétitions',
    ],
    svgKey: 'pushUp',
    coachTip: 'La poitrine doit toucher la cible. En compét, un arbitre peut placer sa main pour vérifier le contact.',
  },
  {
    id: 'single-bar-dips',
    name: 'Single Bar Dips',
    category: 'PUSH',
    criteria: [
      'Position de départ : bras tendus en appui sur une barre unique, épaules au-dessus de la barre, prise pronation (paumes vers le sol)',
      'Bras tendus, coudes verrouillés, corps aligné (hanches, genoux, chevilles)',
      'Descente par flexion de coude et d\'épaule jusqu\'à ce que la POINTE DE L\'HUMÉRUS descende plus bas que la pointe du coude',
      'Pendant la descente : hanches passent en dessous du plan horizontal de la barre',
      'Remontée validée : coudes verrouillés en haut ET épaules au-dessus de la barre',
      'Jambes tendues et pieds joints du début à la fin',
    ],
    noRep: [
      'Pieds écartés ou flexion de genoux',
      'Perte d\'alignement chevilles/genoux/hanches',
      'Kick avant, arrière ou retour de jambes excessif',
      'Mouvement discontinu',
      'Remontée non simultanée des épaules',
      'Coudes non verrouillés en haut',
      'Amplitude basse non respectée (humérus proximal non plus bas que l\'olécrane)',
      'Épaules non au-dessus de la barre au verrouillage',
    ],
    svgKey: 'dips',
    coachTip: 'Le Single Bar Dips suit directement un Muscle-up dans un WOD. L\'amplitude basse est identique aux dips parallèles.',
  },
  // ─── LEGS ─────────────────────────────────────────────────────────────────
  {
    id: 'back-squat',
    name: 'Back Squat',
    category: 'LEGS',
    criteria: [
      'Position de départ : corps debout aligné, jambes tendues, genoux verrouillés (épaules/hanches/genoux/chevilles)',
      'Barre reposant sur les trapèzes (haut du dos), en contact avec les épaules, tenue fermement',
      'Descente : pli de la hanche passe SOUS LA PARTIE LA PLUS HAUTE DU GENOU (parallèles = non valide, il faut passer en dessous)',
      'Remontée validée : jambes tendues, genoux et hanches verrouillés, épaules au-dessus des hanches',
      'Pas d\'appui des coudes sur les cuisses ou genoux lors de la poussée',
      'Les pieds ne doivent pas se déplacer ou pivoter pendant la répétition',
      'Barre doit être reposée sur le rack prévu — tout autre dépôt = disqualification',
    ],
    noRep: [
      'Amplitude non respectée : le pli de la hanche ne passe pas sous la partie haute du genou',
      'Non-verrouillage en haut (genoux non tendus)',
      'Absence de retour en position de départ entre les répétitions',
      'Appui des coudes sur les cuisses ou genoux',
      'Déplacement ou pivot du pied',
      'Mouvement discontinu : pause, double rebond ou redescente pendant la montée',
    ],
    svgKey: 'squat',
    coachTip: 'Les cuisses parallèles au sol ne suffisent pas — le pli de hanche doit PASSER SOUS la partie haute du genou.',
  },
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    category: 'LEGS',
    criteria: [
      'Position de départ : corps debout aligné, jambes tendues, genoux verrouillés',
      'Kettlebell tenu par la poignée avec les deux mains, boule orientée vers le HAUT',
      'Aucun contact entre le kettlebell et une autre partie du corps que les mains',
      'Descente : pli de hanche passe en dessous du point le plus haut du genou',
      'Remontée : extension complète des membres inférieurs, position debout stabilisée, genoux tendus',
      'Les mains doivent rester fermées — les poignets ne redescendent pas sous les coudes',
    ],
    noRep: [
      'Amplitude non respectée : pli de hanche ne passe pas sous le genou',
      'Mauvaise tenue du kettlebell (non saisi uniquement par la poignée, boule vers le bas, contact avec le buste)',
      'Appui des coudes sur les cuisses ou genoux',
      'Déplacement ou pivot du pied',
      'Mouvement discontinu',
      'Absence de retour en position debout stabilisée (genoux non verrouillés)',
    ],
    svgKey: 'squat',
    coachTip: 'La boule du kettlebell est orientée vers le HAUT. Tout contact du kettlebell avec le corps (buste/avant-bras) = no rep.',
  },
]

/** Find the standard matching a label (fuzzy match) */
export function findStandard(label) {
  if (!label) return null
  const lower = label.toLowerCase()
  return MOVEMENT_STANDARDS.find(m =>
    lower.includes(m.id) ||
    lower.includes(m.name.toLowerCase()) ||
    (m.id === 'traction' && (lower.includes('pull') || lower.includes('traction'))) ||
    (m.id === 'goblet-squat' && lower.includes('goblet')) ||
    (m.id === 'back-squat' && (lower.includes('back squat') || lower.includes('squat @'))) ||
    (m.id === 'single-bar-dips' && lower.includes('single bar'))
  ) || null
}
