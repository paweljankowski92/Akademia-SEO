import { useState } from 'react'
import Dashboard from './sections/Dashboard'
import Materials from './sections/Materials'
import Quizzes from './sections/Quizzes'
import Tips from './sections/Tips'
import News from './sections/News'
import AuthPanel from './components/AuthPanel'
import { useAuth } from './lib/auth'

const NAV = [
  { key: 'panel', label: 'Panel', icon: '🏠' },
  { key: 'materials', label: 'Materiały', icon: '📚' },
  { key: 'quizzes', label: 'Quizy', icon: '🧠' },
  { key: 'tips', label: 'Porady', icon: '💡' },
  { key: 'news', label: 'News', icon: '📰' },
]

export default function App() {
  const [active, setActive] = useState('panel')
  const [showAuth, setShowAuth] = useState(false)
  const { user, profile, isAdmin, loading, configured, signOut } = useAuth()

  const requestLogin = () => setShowAuth(true)

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">S</div>
          <div>
            <div className="brand-name">SEO Akademia</div>
            <div className="brand-sub">Szkolenia wewnętrzne</div>
          </div>
        </div>

        {NAV.map((item) => (
          <button
            key={item.key}
            className={`nav-item ${active === item.key ? 'active' : ''}`}
            onClick={() => setActive(item.key)}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div style={{ marginTop: 'auto' }}>
          {!loading && (
            user ? (
              <div className="user-box">
                <div className="user-avatar">{(profile?.email || user.email || '?')[0].toUpperCase()}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="user-email" title={profile?.email || user.email}>{profile?.email || user.email}</div>
                  <div className="user-role">{isAdmin ? '🛠️ Administrator' : '🎓 Kursant'}</div>
                </div>
                <button className="btn-ghost btn-sm" title="Wyloguj" onClick={() => signOut()}>⏻</button>
              </div>
            ) : (
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                onClick={requestLogin} disabled={!configured}>
                🔑 Zaloguj się
              </button>
            )
          )}

          <div className="sidebar-footer">
            {configured ? 'Dane: Supabase' : '⚠️ Brak konfiguracji Supabase'}
            <br />v0.3
          </div>
        </div>
      </aside>

      <main className="main">
        {active === 'panel' && <Dashboard onRequestLogin={requestLogin} onNavigate={setActive} />}
        {active === 'materials' && <Materials onRequestLogin={requestLogin} />}
        {active === 'quizzes' && <Quizzes onRequestLogin={requestLogin} />}
        {active === 'tips' && <Tips onRequestLogin={requestLogin} />}
        {active === 'news' && <News onRequestLogin={requestLogin} />}
      </main>

      {showAuth && <AuthPanel onClose={() => setShowAuth(false)} />}
    </div>
  )
}
