import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas'

/**
 * 9:16 shareable story card — Feature 1
 * Shows athlete's best session data + progression
 */
export default function StoryCard({ isOpen, onClose }) {
  const cardRef = useRef(null)
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)
  const [storyData, setStoryData] = useState(null)

  useEffect(() => {
    if (!isOpen) return
    // Load data for story
    const diagnostic = JSON.parse(localStorage.getItem('cbl_diagnostic') || 'null')
    const sessions = JSON.parse(localStorage.getItem('cbl_session_log') || '[]')
    const coachLog = JSON.parse(localStorage.getItem('cbl_coach_log') || '[]')
    const availability = JSON.parse(localStorage.getItem('cbl_availability') || '[1,2,4,5,6]')

    const lastSession = sessions[sessions.length - 1] || null
    const totalSessions = sessions.filter(s => s.completed).length
    const lastRpe = coachLog[coachLog.length - 1]?.metrics?.rpe || null

    const startDate = new Date('2026-04-07')
    const weekNum = Math.max(1, Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24 * 7)))
    const compDate = new Date('2026-09-01')
    const daysToComp = Math.ceil((compDate - new Date()) / (1000 * 60 * 60 * 24))

    setStoryData({
      overall: diagnostic?.profile?.overall ?? null,
      forceBrute: diagnostic?.profile?.scores?.forceBrute ?? null,
      resistanceLactique: diagnostic?.profile?.scores?.resistanceLactique ?? null,
      weekNum,
      daysToComp,
      totalSessions,
      lastRpe,
      availability: availability.length,
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    })
    setExported(false)
  }, [isOpen])

  const exportImage = async () => {
    if (!cardRef.current) return
    setExporting(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#0A0A0A',
        useCORS: true,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `CBL-Story-Semaine${storyData?.weekNum || 1}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      setExported(true)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="flex flex-col items-center gap-4 w-full max-w-xs"
          >
            {/* Close */}
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-white/60">Story 9:16</span>
              <button onClick={onClose} className="text-white/60 hover:text-white text-lg leading-none">✕</button>
            </div>

            {/* The 9:16 card */}
            <div
              ref={cardRef}
              style={{
                width: 270,
                height: 480,
                background: 'linear-gradient(145deg, #0D0D0D 0%, #111827 50%, #0A0A0A 100%)',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                flexShrink: 0,
              }}
              className="rounded-2xl border border-white/10 shadow-2xl"
            >
              {/* Background grid pattern */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }} />

              {/* Glow accent */}
              <div style={{
                position: 'absolute', top: -60, right: -60,
                width: 200, height: 200,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%)',
              }} />

              {/* Content */}
              <div style={{ position: 'relative', zIndex: 1, padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>

                {/* Header */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: '#00D4FF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 14, color: '#000', fontWeight: 'bold' }}>⚡</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        CBL COACH
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
                        Alexandre Mafille
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                    {storyData?.date}
                  </div>
                </div>

                {/* Week badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(0,212,255,0.1)',
                  border: '1px solid rgba(0,212,255,0.2)',
                  borderRadius: 20, padding: '4px 10px',
                  marginBottom: 16, alignSelf: 'flex-start',
                }}>
                  <span style={{ fontSize: 10, color: '#00D4FF', fontWeight: 700 }}>
                    Semaine {storyData?.weekNum}/12
                  </span>
                </div>

                {/* Overall score */}
                {storyData?.overall != null && (
                  <div style={{ marginBottom: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Score Profil CBL
                    </div>
                    <div style={{ fontSize: 56, fontWeight: 900, color: '#00D4FF', lineHeight: 1, letterSpacing: '-0.02em' }}>
                      {storyData.overall}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>/100</div>
                  </div>
                )}

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, flex: 1 }}>
                  {[
                    { label: 'Force Brute', value: storyData?.forceBrute != null ? `${storyData.forceBrute}%` : '—', color: '#00D4FF' },
                    { label: 'Rés. Lactique', value: storyData?.resistanceLactique != null ? `${storyData.resistanceLactique}%` : '—', color: '#FF3D3D' },
                    { label: 'Séances totales', value: storyData?.totalSessions ?? '0', color: '#00D47A' },
                    { label: 'J avant compét.', value: storyData?.daysToComp ?? '—', color: '#FF9500' },
                  ].map(stat => (
                    <div key={stat.label} style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12, padding: '10px 12px',
                    }}>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {stat.label}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: stat.color, letterSpacing: '-0.02em' }}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Goal bar */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Objectif CBL Espoir
                    </span>
                    <span style={{ fontSize: 9, color: '#00D47A' }}>
                      {storyData?.overall != null ? `${storyData.overall}%` : 'Non testé'}
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #00D4FF, #00D47A)',
                      borderRadius: 4,
                      width: `${storyData?.overall ?? 0}%`,
                    }} />
                  </div>
                </div>

                {/* Footer */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
                    #CBL2026 #Calisthenics
                  </span>
                  <div style={{
                    fontSize: 9, color: 'rgba(255,255,255,0.25)',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00D4FF' }} />
                    CBL COACH
                  </div>
                </div>
              </div>
            </div>

            {/* Export button */}
            <button
              onClick={exportImage}
              disabled={exporting}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                background: exported ? 'rgba(0,212,122,0.15)' : '#00D4FF',
                color: exported ? '#00D47A' : '#000',
                border: exported ? '1px solid rgba(0,212,122,0.3)' : 'none',
              }}
            >
              {exporting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Export…
                </span>
              ) : exported ? '✓ Téléchargée !' : '⬇ Télécharger la story'}
            </button>

            <p className="text-xs text-white/30 text-center">
              Ou fais une capture d'écran directement
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
