import { useState, useCallback } from 'react'
import Materials from './sections/Materials'
import Quizzes from './sections/Quizzes'
import Tips from './sections/Tips'
import News from './sections/News'
import AuthPanel from './components/AuthPanel'
import { useAuth } from './lib/auth'

const NAV = [
  { key: 'materials', label: 'Materiały', icon: '📚' },
  { key: 'quizzes', label: 'Quizy', icon: '🧠' },
  { key: 'tips', label: 'Porady', icon: '💡' },
  { key: 'news', label: 'News', icon: '📰' },
]

export default function App() {
  const [active, setActive] = useState('materials')
  const [counts, setCounts] = useState({})
  const [showAuth, setShowAuth] = useState(false)
  const { user, loading, configured, signOut } = useAuth()

  const setCount = useCallback((key, n) => {
    setCounts((c) => (c[key] === n ? c : { ...c, [key]: n }))
  }, [])

  // Stabilne callbacki per sekcja (bez łamania zasad hooków).
  const onMaterials = useCallback((n) => setCount('materials', n), [setCount])
  const onQuizzes = useCallback((n) => setCount('quizzes', n), [setCount])
  const onTips = useCallback((n) => setCount('tips', n), [setCount])
  const onNews = useCallback((n) => setCount('news', n), [setCount])

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
            {counts[item.key] > 0 && <span className="count">{counts[item.key]}</span>}
          </button>
        ))}

        <div style={{ marginTop: 'auto' }}>
          {!loading && (
            user ? (
              <div className="user-box">
                <div className="user-avatar">{(user.email || '?')[0].toUpperCase()}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="user-email" title={user.email}>{user.email}</div>
                  <div className="user-role">Zalogowany</div>
                </div>
                <button className="btn-ghost btn-sm" title="Wyloguj" onClick={() => signOut()}>⏻</button>
              </div>
            ) : (
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setShowAuth(true)} disabled={!configured}>
                🔑 Zaloguj się
              </button>
            )
          )}

          <div className="sidebar-footer">
            {configured ? 'Logowanie: Supabase' : '⚠️ Brak konfiguracji Supabase'}
            <br />Dane treści: local// v0.2
          </div>
        </div>
      </aside>

      <main className="main">
        {active === 'materials' && (
          <Materials onCount={onMaterials} isLoggedIn={!!user} onRequestLogin={() => setShowAuth(true)} />
        )}
        {active === 'quizzes' && (
          <Quizzes onCount={onQuizzes} isLoggedIn={!!user} onRequestLogin={() => setShowAuth(true)} />
        )}
        {active === 'tips' && (
          <Tips onCount={onTips} isLoggedIn={!!user} onRequestLogin={() => setShowAuth(true)} />
        )}
        {active === 'news' && (
          <News onCount={onNews} isLoggedIn={!!user} onRequestLogin={() => setShowAuth(true)} />
        )}
      </main>

      {showAuth && <AuthPanel onClose={() => setShowAuth(false)} />}
    </div>
  )
}
