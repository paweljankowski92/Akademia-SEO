import { useEffect, useState } from 'react'
import { fetchAll } from '../lib/db'
import { useAuth } from '../lib/auth'
import { useProgress } from '../lib/progress'
import { Loading, EmptyState } from '../components/ui'

export default function Dashboard({ onRequestLogin, onNavigate }) {
  const { isLoggedIn, isAdmin, profile } = useAuth()

  if (!isLoggedIn) {
    return (
      <div>
        <h1 className="page-title">🏠 Panel</h1>
        <EmptyState emoji="🔐" title="Zaloguj się, aby zobaczyć panel"
          text="Panel pokazuje Twoje postępy w nauce (kursant) lub statystyki zespołu (administrator)."
          action={<button className="btn btn-primary" onClick={onRequestLogin}>🔑 Zaloguj się</button>} />
      </div>
    )
  }

  return isAdmin
    ? <AdminPanel onNavigate={onNavigate} />
    : <StudentPanel email={profile?.email} onNavigate={onNavigate} />
}

/* ================= PANEL ADMINISTRATORA ================= */
function AdminPanel({ onNavigate }) {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const [materials, quizzes, tips, news, profiles, progress] = await Promise.all([
          fetchAll('materials'), fetchAll('quizzes'), fetchAll('tips'),
          fetchAll('news'), fetchAll('profiles'), fetchAll('progress'),
        ])
        setData({ materials, quizzes, tips, news, profiles, progress })
      } catch (e) {
        setError(e.message)
      }
    })()
  }, [])

  if (error) return <div className="alert alert-error">⚠️ {error}</div>
  if (!data) return <Loading />

  const students = data.profiles.filter((p) => p.role === 'kursant')
  const byUser = (uid, kind) => data.progress.filter((r) => r.user_id === uid && r.kind === kind)
  const avg = (rows) => {
    const scored = rows.filter((r) => r.max_score)
    if (!scored.length) return null
    return Math.round(scored.reduce((a, r) => a + (r.score / r.max_score) * 100, 0) / scored.length)
  }

  const quizTitles = Object.fromEntries(data.quizzes.map((q) => [q.id, q.title]))
  const myProgress = data.progress.filter((r) => r.user_id === user?.id)

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">🛠️ Panel administratora</h1>
          <p className="page-desc">Zarządzaj treściami i śledź postępy zespołu.</p>
        </div>
        <span className="tag">Administrator</span>
      </div>

      <div className="stat-grid">
        <Stat icon="📚" label="Materiały" value={data.materials.length} />
        <Stat icon="🧠" label="Quizy" value={data.quizzes.length} />
        <Stat icon="💡" label="Porady" value={data.tips.length} />
        <Stat icon="📰" label="News" value={data.news.length} />
        <Stat icon="👥" label="Kursanci" value={students.length} />
      </div>

      {/* Postępy administratora jako uczestnika */}
      <MyProgress
        heading="🎓 Twoje postępy"
        progress={myProgress}
        materialsTotal={data.materials.length}
        quizzesTotal={data.quizzes.length}
        quizTitles={quizTitles}
        onNavigate={onNavigate}
      />

      <h2 className="section-h">Postępy kursantów</h2>
      {students.length === 0 ? (
        <EmptyState emoji="👤" title="Brak kursantów"
          text="Gdy ktoś się zarejestruje, pojawi się tu wraz z postępami. Role zmienisz w tabeli profiles w Supabase." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Kursant</th><th>Materiały</th><th>Quizy</th><th>Śr. wynik</th></tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const mats = byUser(s.id, 'material').length
                const quizzes = byUser(s.id, 'quiz')
                const a = avg(quizzes)
                return (
                  <tr key={s.id}>
                    <td>{s.email}</td>
                    <td>{mats} / {data.materials.length}</td>
                    <td>{quizzes.length} / {data.quizzes.length}</td>
                    <td>{a == null ? '—' : `${a}%`}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ================= PANEL KURSANTA ================= */
function StudentPanel({ email, onNavigate }) {
  const { rows: progress } = useProgress()
  const [totals, setTotals] = useState(null)

  useEffect(() => {
    (async () => {
      const [materials, quizzes] = await Promise.all([fetchAll('materials'), fetchAll('quizzes')])
      setTotals({
        materials: materials.length,
        quizzes: quizzes.length,
        quizTitles: Object.fromEntries(quizzes.map((q) => [q.id, q.title])),
      })
    })()
  }, [])

  if (!totals) return <Loading />

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">🎓 Twój panel</h1>
          <p className="page-desc">{email} — śledź swoje postępy w nauce.</p>
        </div>
        <span className="tag">Kursant</span>
      </div>

      <MyProgress
        progress={progress}
        materialsTotal={totals.materials}
        quizzesTotal={totals.quizzes}
        quizTitles={totals.quizTitles}
        onNavigate={onNavigate}
      />
    </div>
  )
}

/* ================= WSPÓLNA SEKCJA POSTĘPÓW ================= */
function MyProgress({ heading, progress, materialsTotal, quizzesTotal, quizTitles, onNavigate }) {
  const doneMaterials = progress.filter((r) => r.kind === 'material').length
  const quizRows = progress.filter((r) => r.kind === 'quiz')
  const scored = quizRows.filter((r) => r.max_score)
  const avgScore = scored.length
    ? Math.round(scored.reduce((a, r) => a + (r.score / r.max_score) * 100, 0) / scored.length)
    : null

  return (
    <>
      {heading && <h2 className="section-h">{heading}</h2>}

      <div className="stat-grid">
        <ProgressStat icon="📚" label="Ukończone materiały" done={doneMaterials} total={materialsTotal} />
        <ProgressStat icon="🧠" label="Rozwiązane quizy" done={quizRows.length} total={quizzesTotal} />
        <Stat icon="🏅" label="Średni wynik quizów" value={avgScore == null ? '—' : `${avgScore}%`} />
      </div>

      <h3 className="section-h" style={{ fontSize: 15 }}>Twoje wyniki quizów</h3>
      {quizRows.length === 0 ? (
        <EmptyState emoji="🧩" title="Brak rozwiązanych quizów"
          text="Rozwiąż pierwszy quiz, aby zobaczyć tu swój wynik."
          action={<button className="btn btn-primary" onClick={() => onNavigate?.('quizzes')}>Przejdź do quizów</button>} />
      ) : (
        <div className="table-wrap" style={{ marginBottom: 30 }}>
          <table className="table">
            <thead><tr><th>Quiz</th><th>Wynik</th><th>Procent</th></tr></thead>
            <tbody>
              {quizRows.map((r) => (
                <tr key={r.id}>
                  <td>{quizTitles[r.item_id] || '(usunięty quiz)'}</td>
                  <td>{r.score} / {r.max_score}</td>
                  <td>{r.max_score ? `${Math.round((r.score / r.max_score) * 100)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

/* ---------- małe komponenty ---------- */
function Stat({ icon, label, value }) {
  return (
    <div className="stat">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function ProgressStat({ icon, label, done, total }) {
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <div className="stat">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{done}<span style={{ fontSize: 18, color: 'var(--text-muted)' }}> / {total}</span></div>
      <div className="stat-label">{label}</div>
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
    </div>
  )
}
