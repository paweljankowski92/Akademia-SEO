import { useState, useCallback } from 'react'
import Materials from './sections/Materials'
import Quizzes from './sections/Quizzes'
import Tips from './sections/Tips'
import News from './sections/News'

const NAV = [
  { key: 'materials', label: 'Materiały', icon: '📚' },
  { key: 'quizzes', label: 'Quizy', icon: '🧠' },
  { key: 'tips', label: 'Porady', icon: '💡' },
  { key: 'news', label: 'News', icon: '📰' },
]

export default function App() {
  const [active, setActive] = useState('materials')
  const [counts, setCounts] = useState({})

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

        <div className="sidebar-footer">
          Dane zapisywane lokalnie w tej przeglądarce.<br />v0.1
        </div>
      </aside>

      <main className="main">
        {active === 'materials' && <Materials onCount={onMaterials} />}
        {active === 'quizzes' && <Quizzes onCount={onQuizzes} />}
        {active === 'tips' && <Tips onCount={onTips} />}
        {active === 'news' && <News onCount={onNews} />}
      </main>
    </div>
  )
}
