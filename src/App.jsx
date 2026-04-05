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
import Coach from './pages/Coach'
import Progression from './pages/Progression'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [window.location.pathname])

  return (
    <div className="flex h-screen bg-[#0A0A0A] overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-surface z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="font-display font-bold text-brand tracking-tight">CBL COACH</span>
        </header>

        {/* Page content */}
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
            <Route path="/coach" element={<Coach />} />
            <Route path="/progression" element={<Progression />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
