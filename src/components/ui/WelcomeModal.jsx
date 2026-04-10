import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCurrentAthleteId, getAthletes } from '../../utils/coachStore'

const STEPS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    title: 'Bienvenue sur CBL Coach Pro',
    text: 'Ton espace d\'entraînement personnalisé. Tout ce dont tu as besoin pour progresser vers la compétition CBL est ici.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    title: 'Ton coach programme',
    text: 'Nicolas prépare tes séances directement dans l\'app. Quand une semaine est publiée, elle apparaît sur ton dashboard et dans "Programme".',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
      </svg>
    ),
    title: 'Tu t\'entraînes et tu valides',
    text: 'Lance ta séance, coche tes exercices, puis appuie sur "C\'est fait ✓". Ton RPE et tes temps de circuit sont enregistrés.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round">
        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
      </svg>
    ),
    title: 'Tu envoies des feedbacks',
    text: 'Tes questions, tes vidéos de technique, tes ressentis — envoie-les dans "Feedback". Nicolas te répond en audio directement ici.',
  },
]

export default function WelcomeModal() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const athleteId = getCurrentAthleteId()

  useEffect(() => {
    if (!athleteId) return
    const key = `cbl_onboarded_${athleteId}`
    if (!localStorage.getItem(key)) setVisible(true)
  }, [athleteId])

  const close = () => {
    localStorage.setItem(`cbl_onboarded_${athleteId}`, '1')
    setVisible(false)
  }

  const athlete = getAthletes().find(a => a.id === athleteId)
  const firstName = athlete?.nickname || athlete?.name?.split(' ')[0] || 'Athlète'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)' }}
        >
          <motion.div
            initial={{ y: 40, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="w-full max-w-sm rounded-3xl overflow-hidden"
            style={{ background: '#151E2B', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Progress dots */}
            <div className="flex justify-center gap-2 pt-5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? 20 : 6,
                    background: i === step ? '#0EA5E9' : 'rgba(255,255,255,0.15)',
                  }}
                />
              ))}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="px-7 py-6 text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {STEPS[step].icon}
                </div>

                {step === 0 && (
                  <div className="text-brand font-semibold text-sm">Bonjour {firstName} 👋</div>
                )}

                <h2 className="text-lg font-bold text-white leading-snug">{STEPS[step].title}</h2>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(248,250,252,0.6)' }}>{STEPS[step].text}</p>
              </motion.div>
            </AnimatePresence>

            {/* Actions */}
            <div className="px-7 pb-7 flex gap-3">
              {step < STEPS.length - 1 ? (
                <>
                  <button
                    onClick={close}
                    className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors"
                    style={{ color: 'rgba(248,250,252,0.4)', background: 'rgba(255,255,255,0.05)' }}
                  >
                    Passer
                  </button>
                  <button
                    onClick={() => setStep(s => s + 1)}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-black bg-brand hover:bg-brand/90 transition-colors"
                  >
                    Suivant →
                  </button>
                </>
              ) : (
                <button
                  onClick={close}
                  className="w-full py-3 rounded-xl text-sm font-bold text-black bg-brand hover:bg-brand/90 transition-colors"
                >
                  C'est parti !
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
