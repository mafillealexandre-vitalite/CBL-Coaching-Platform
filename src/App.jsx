import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './pages/Dashboard'
import Plan from './pages/Plan'
import Session from './pages/Session'
import Circuits from './pages/Circuits'
import Stats from './pages/Stats'
import Profile from './pages/Profile'
import Diagnostic from './pages/Diagnostic'
import CoachPanel from './pages/CoachPanel'
import Progression from './pages/Progression'
import Standards from './pages/Standards'
import Import from './pages/Import'
import FeedbackPage from './pages/FeedbackPage'
import AthleteLogin from './pages/AthleteLogin'
import { getCurrentAthleteId, getRole } from './utils/coachStore'

// Guard: redirects to /login if athlete not logged in (coach bypasses)
function AthleteGuard({ children }) {
  const role = getRole()
  if (role === 'coach') return children
  if (!getCurrentAthleteId()) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [window.location.pathname])

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<AthleteLogin />} />

      {/* Protected app shell */}
      <Route path="*" element={
        <AthleteGuard>
          <div className="flex h-screen bg-bg-base overflow-hidden">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            {sidebarOpen && (
              <div
                className="fixed inset-0 z-30 bg-black/60 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <header className="md:hidden flex items-center gap-3 px-4 py-3 z-20" style={{ background: '#1A2332', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-1.5 rounded-md"
                  style={{ color: 'rgba(248,250,252,0.7)' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                </button>
                <span className="font-black text-base tracking-widest uppercase" style={{ color: '#ffffff', letterSpacing: '0.12em' }}>CBL <span style={{ color: '#0EA5E9' }}>COACH</span> PRO</span>
              </header>
              <main className="flex-1 overflow-y-auto bg-grid-pattern">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/plan" element={<Plan />} />
                  <Route path="/session" element={<Session />} />
                  <Route path="/circuits" element={<Circuits />} />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/diagnostic" element={<Diagnostic />} />
                  <Route path="/coach-panel" element={<CoachPanel />} />
                  <Route path="/progression" element={<Progression />} />
                  <Route path="/standards" element={<Standards />} />
                  <Route path="/import" element={<Import />} />
                  <Route path="/feedback" element={<FeedbackPage />} />
                </Routes>
              </main>
            </div>
          </div>
        </AthleteGuard>
      } />
    </Routes>
  )
}
