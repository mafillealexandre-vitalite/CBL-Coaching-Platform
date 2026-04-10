/**
 * Minimal line-art SVG illustrations for each pilot movement.
 * Style: single-color (#1A2332) coach figure, clean and simple.
 */

const COLOR = '#1A2332'
const S = { stroke: COLOR, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }

function Head({ cx = 50, cy = 12, r = 8 }) {
  return <circle cx={cx} cy={cy} r={r} stroke={COLOR} strokeWidth="3" fill="none" />
}

export const SVG_ILLUSTRATIONS = {

  pullUp: (
    <svg viewBox="0 0 100 120" width="100%" height="100%" {...S} strokeWidth="3">
      <Head cx={50} cy={10} />
      {/* bar */}
      <line x1="20" y1="22" x2="80" y2="22" strokeWidth="4" />
      {/* arms up */}
      <line x1="43" y1="18" x2="35" y2="22" />
      <line x1="57" y1="18" x2="65" y2="22" />
      {/* torso */}
      <line x1="50" y1="18" x2="50" y2="65" />
      {/* legs together */}
      <line x1="50" y1="65" x2="44" y2="90" />
      <line x1="50" y1="65" x2="56" y2="90" />
      {/* chin indicator */}
      <path d="M38 22 Q50 26 62 22" strokeDasharray="3 2" strokeWidth="2" />
    </svg>
  ),

  dips: (
    <svg viewBox="0 0 100 120" width="100%" height="100%" {...S} strokeWidth="3">
      <Head cx={50} cy={30} />
      {/* parallel bars */}
      <line x1="15" y1="50" x2="15" y2="100" strokeWidth="4" />
      <line x1="85" y1="50" x2="85" y2="100" strokeWidth="4" />
      <line x1="10" y1="50" x2="20" y2="50" strokeWidth="4" />
      <line x1="80" y1="50" x2="90" y2="50" strokeWidth="4" />
      {/* arms */}
      <line x1="43" y1="37" x2="15" y2="50" />
      <line x1="57" y1="37" x2="85" y2="50" />
      {/* torso + legs */}
      <line x1="50" y1="37" x2="50" y2="72" />
      <line x1="50" y1="72" x2="43" y2="95" />
      <line x1="50" y1="72" x2="57" y2="95" />
      {/* 90° angle mark */}
      <path d="M26 50 L26 60 L36 60" strokeWidth="1.5" />
    </svg>
  ),

  muscleUp: (
    <svg viewBox="0 0 100 120" width="100%" height="100%" {...S} strokeWidth="3">
      {/* bar */}
      <line x1="20" y1="30" x2="80" y2="30" strokeWidth="4" />
      {/* figure above bar */}
      <Head cx={50} cy={12} />
      <line x1="43" y1="18" x2="35" y2="30" />
      <line x1="57" y1="18" x2="65" y2="30" />
      <line x1="50" y1="18" x2="50" y2="50" />
      <line x1="50" y1="50" x2="43" y2="75" />
      <line x1="50" y1="50" x2="57" y2="75" />
      {/* arrow up (trajectory) */}
      <path d="M72 60 L72 35 L78 41 M72 35 L66 41" strokeWidth="2" strokeDasharray="4 2" />
    </svg>
  ),

  pushUp: (
    <svg viewBox="0 0 120 80" width="100%" height="100%" {...S} strokeWidth="3">
      <Head cx={20} cy={20} />
      {/* torso horizontal */}
      <line x1="27" y1="25" x2="90" y2="40" />
      {/* arms */}
      <line x1="35" y1="27" x2="35" y2="48" />
      <line x1="60" y1="33" x2="60" y2="55" />
      {/* floor hands */}
      <line x1="30" y1="48" x2="42" y2="48" />
      <line x1="55" y1="55" x2="67" y2="55" />
      {/* legs */}
      <line x1="90" y1="40" x2="100" y2="55" />
      <line x1="100" y1="55" x2="115" y2="55" />
      {/* floor line */}
      <line x1="10" y1="70" x2="120" y2="70" strokeWidth="2" strokeDasharray="4 3" />
    </svg>
  ),

  squat: (
    <svg viewBox="0 0 100 120" width="100%" height="100%" {...S} strokeWidth="3">
      <Head cx={50} cy={15} />
      {/* torso upright with slight forward lean */}
      <line x1="50" y1="23" x2="48" y2="62" />
      {/* thighs parallel */}
      <line x1="48" y1="62" x2="28" y2="75" />
      <line x1="48" y1="62" x2="68" y2="75" />
      {/* shins */}
      <line x1="28" y1="75" x2="24" y2="100" />
      <line x1="68" y1="75" x2="72" y2="100" />
      {/* feet */}
      <line x1="18" y1="100" x2="32" y2="100" />
      <line x1="62" y1="100" x2="78" y2="100" />
      {/* parallel line (thighs ≥ parallel) */}
      <line x1="18" y1="75" x2="82" y2="75" strokeDasharray="3 2" strokeWidth="1.5" />
    </svg>
  ),

  gainage: (
    <svg viewBox="0 0 140 80" width="100%" height="100%" {...S} strokeWidth="3">
      <Head cx={15} cy={28} />
      {/* straight body line */}
      <line x1="23" y1="30" x2="118" y2="50" />
      {/* forearm */}
      <line x1="30" y1="33" x2="30" y2="52" />
      <line x1="55" y1="38} " x2="55" y2="58" />
      {/* feet */}
      <line x1="108" y1="48" x2="122" y2="52" />
      <line x1="113" y1="50" x2="127" y2="55" />
      {/* floor */}
      <line x1="10" y1="68" x2="140" y2="68" strokeDasharray="4 3" strokeWidth="2" />
      {/* alignment arrow */}
      <path d="M15 20 L118 40" strokeDasharray="6 3" strokeWidth="1.5" />
    </svg>
  ),

  australianPullUp: (
    <svg viewBox="0 0 120 100" width="100%" height="100%" {...S} strokeWidth="3">
      {/* bar */}
      <line x1="25" y1="20" x2="95" y2="20" strokeWidth="4" />
      {/* figure inclined */}
      <Head cx={55} cy={30} />
      <line x1="47" y1="26" x2="35" y2="20" />
      <line x1="63" y1="26" x2="75" y2="20" />
      <line x1="55" y1="36" x2="55" y2="72" />
      {/* legs to floor */}
      <line x1="55" y1="72" x2="45" y2="90" />
      <line x1="55" y1="72" x2="65" y2="90" />
      {/* floor */}
      <line x1="10" y1="90" x2="110" y2="90" strokeWidth="2" strokeDasharray="4 3" />
      {/* angle indicator */}
      <path d="M35 20 Q45 35 55 36" strokeDasharray="3 2" strokeWidth="1.5" />
    </svg>
  ),

  lunge: (
    <svg viewBox="0 0 120 120" width="100%" height="100%" {...S} strokeWidth="3">
      <Head cx={35} cy={15} />
      {/* torso */}
      <line x1="35" y1="23" x2="35" y2="58" />
      {/* front leg */}
      <line x1="35" y1="58" x2="22" y2="80" />
      <line x1="22" y1="80" x2="15" y2="105" />
      <line x1="10" y1="105" x2="26" y2="105" />
      {/* back leg */}
      <line x1="35" y1="58" x2="65" y2="72" />
      <line x1="65" y1="72" x2="70" y2="100" />
      {/* back knee on floor */}
      <circle cx={65} cy={72} r="4" />
      {/* floor */}
      <line x1="5" y1="105" x2="100" y2="105" strokeDasharray="4 3" strokeWidth="2" />
    </svg>
  ),

  jumpingJack: (
    <svg viewBox="0 0 100 120" width="100%" height="100%" {...S} strokeWidth="3">
      <Head cx={50} cy={12} />
      {/* torso */}
      <line x1="50" y1="20" x2="50" y2="65" />
      {/* arms up & spread */}
      <line x1="50" y1="30" x2="20" y2="18" />
      <line x1="50" y1="30" x2="80" y2="18" />
      {/* hands clap suggestion */}
      <circle cx={50} cy={10} r="5" strokeDasharray="3 2" strokeWidth="2" />
      {/* legs spread */}
      <line x1="50" y1="65" x2="25" y2="95" />
      <line x1="50" y1="65" x2="75" y2="95" />
      {/* feet */}
      <line x1="18" y1="95" x2="32" y2="95" />
      <line x1="68" y1="95" x2="82" y2="95" />
    </svg>
  ),

  burpee: (
    <svg viewBox="0 0 100 120" width="100%" height="100%" {...S} strokeWidth="3">
      {/* Phase: floor position */}
      <Head cx={15} cy={55} />
      <line x1="23" y1="57" x2="80" y2="67" />
      <line x1="30" y1="60" x2="30" y2="78" />
      <line x1="60" y1="64" x2="60" y2="82" />
      {/* feet on floor */}
      <line x1="72" y1="67" x2="88" y2="70" />
      <line x1="80" y1="78" x2="90" y2="80" />
      {/* floor */}
      <line x1="5" y1="82" x2="100" y2="82" strokeDasharray="4 3" strokeWidth="2" />
      {/* jump arrow */}
      <path d="M50 75 Q50 30 50 10" strokeDasharray="5 3" strokeWidth="2" />
      <path d="M43 16 L50 8 L57 16" strokeWidth="2" />
      {/* standing head at top */}
      <Head cx={50} cy={8} r={6} />
    </svg>
  ),

  weightedDips: (
    <svg viewBox="0 0 100 120" width="100%" height="100%" {...S} strokeWidth="3">
      <Head cx={50} cy={28} />
      {/* parallel bars */}
      <line x1="15" y1="48" x2="15" y2="95" strokeWidth="4" />
      <line x1="85" y1="48" x2="85" y2="95" strokeWidth="4" />
      <line x1="10" y1="48" x2="20" y2="48" strokeWidth="4" />
      <line x1="80" y1="48" x2="90" y2="48" strokeWidth="4" />
      {/* arms */}
      <line x1="43" y1="35" x2="15" y2="48" />
      <line x1="57" y1="35" x2="85" y2="48" />
      {/* torso + legs */}
      <line x1="50" y1="35" x2="50" y2="70" />
      <line x1="50" y1="70" x2="43" y2="92" />
      <line x1="50" y1="70" x2="57" y2="92" />
      {/* weight plate below */}
      <ellipse cx={50} cy={108} rx={14} ry={5} strokeWidth="2" />
      <line x1="50" y1="92" x2="50" y2="103" strokeWidth="2" strokeDasharray="3 2" />
      {/* 90° angle mark */}
      <path d="M26 48 L26 58 L36 58" strokeWidth="1.5" />
    </svg>
  ),

  chestToBar: (
    <svg viewBox="0 0 100 120" width="100%" height="100%" {...S} strokeWidth="3">
      {/* bar — chest level */}
      <line x1="20" y1="35" x2="80" y2="35" strokeWidth="4" />
      <Head cx={50} cy={10} />
      {/* arms up */}
      <line x1="43" y1="17" x2="35" y2="35" />
      <line x1="57" y1="17" x2="65" y2="35" />
      {/* torso */}
      <line x1="50" y1="17" x2="50" y2="65" />
      {/* legs */}
      <line x1="50" y1="65" x2="43" y2="90" />
      <line x1="50" y1="65" x2="57" y2="90" />
      {/* chest contact indicator */}
      <circle cx={50} cy={35} r={6} strokeDasharray="3 2" strokeWidth="2" />
      <path d="M44 22 Q50 28 56 22" strokeDasharray="3 2" strokeWidth="2" />
      {/* arrow showing chest must reach bar */}
      <path d="M68 20 L68 35 L74 29 M68 35 L62 29" strokeWidth="2" />
    </svg>
  ),
}
