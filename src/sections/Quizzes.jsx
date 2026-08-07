import { useState } from 'react'
import { useCollection, insertRow, updateRow, deleteRow } from '../lib/db'
import { useAuth } from '../lib/auth'
import { useProgress } from '../lib/progress'
import { Modal, Field, EmptyState, LockedBanner, LockOverlay, Loading } from '../components/ui'

function newQuestion() {
  return { id: crypto.randomUUID(), text: '', options: ['', ''], correct: 0 }
}
function blankQuiz() {
  return { title: '', description: '', questions: [newQuestion()] }
}

export default function Quizzes({ onRequestLogin }) {
  const { isLoggedIn, isAdmin, user } = useAuth()
  const { resultFor } = useProgress()
  const { rows, loading, error, reload } = useCollection('quizzes')
  const [editing, setEditing] = useState(null)
  const [playing, setPlaying] = useState(null)

  const freeId = rows[0]?.id
  const isLocked = (quiz) => !isLoggedIn && quiz.id !== freeId

  async function handleDelete(quiz) {
    if (!confirm(`Usunąć quiz „${quiz.title}”?`)) return
    await deleteRow('quizzes', quiz.id)
    reload()
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">🧠 Quizy</h1>
          <p className="page-desc">Sprawdzaj wiedzę — twórz własne testy i rozwiązuj je.</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={() => setEditing(blankQuiz())}>+ Nowy quiz</button>}
      </div>

      {!isLoggedIn && rows.length > 0 && (
        <LockedBanner onRequestLogin={onRequestLogin} message="Bez logowania dostępny jest tylko pierwszy quiz." />
      )}

      {loading ? <Loading /> : error ? (
        <div className="alert alert-error">⚠️ {error}</div>
      ) : rows.length === 0 ? (
        <EmptyState emoji="🧩" title="Brak quizów" text={isAdmin ? 'Stwórz pierwszy test wiedzy.' : 'Nic tu jeszcze nie ma.'}
          action={isAdmin && <button className="btn btn-primary" onClick={() => setEditing(blankQuiz())}>+ Nowy quiz</button>} />
      ) : (
        <div className="grid">
          {rows.map((quiz) => {
            const locked = isLocked(quiz)
            const result = isLoggedIn ? resultFor('quiz', quiz.id) : null
            const questions = quiz.questions || []
            return (
              <div className={`card ${locked ? 'locked' : ''}`} key={quiz.id}>
                <div className="card-top">
                  <h3 className="card-title">{quiz.title}</h3>
                  {locked ? (
                    <span className="lock-badge" title="Dostępne po zalogowaniu">🔒</span>
                  ) : isAdmin ? (
                    <div className="card-actions">
                      <button className="btn-ghost btn-sm" onClick={() => setEditing(quiz)} title="Edytuj">✏️</button>
                      <button className="btn-danger-ghost btn-sm" onClick={() => handleDelete(quiz)} title="Usuń">🗑️</button>
                    </div>
                  ) : null}
                </div>
                {quiz.description && <p className={`card-body ${locked ? 'locked-blur' : ''}`}>{quiz.description}</p>}
                <div className="card-footer">
                  <span className="tag gray">{questions.length} pyt.</span>
                  {result && (
                    <span className="tag" title="Twój ostatni wynik">
                      🏅 {Math.round((result.score / result.max_score) * 100)}%
                    </span>
                  )}
                  {locked ? (
                    <LockOverlay onRequestLogin={onRequestLogin} />
                  ) : (
                    <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}
                      onClick={() => setPlaying(quiz)} disabled={questions.length === 0}>
                      ▶ Rozwiąż
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <QuizForm initial={editing} userId={user?.id}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload() }} />
      )}

      {playing && <QuizPlayer quiz={playing} canSave={isLoggedIn} onClose={() => setPlaying(null)} />}
    </div>
  )
}

/* ---------------- Tworzenie / edycja (admin) ---------------- */
function QuizForm({ initial, userId, onSaved, onClose }) {
  const [quiz, setQuiz] = useState(() => ({
    ...initial,
    questions: initial.questions?.length ? initial.questions : [newQuestion()],
  }))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const setQuestion = (qid, patch) =>
    setQuiz((q) => ({ ...q, questions: q.questions.map((qq) => (qq.id === qid ? { ...qq, ...patch } : qq)) }))

  async function submit() {
    if (!quiz.title.trim()) { setErr('Podaj tytuł quizu.'); return }
    const clean = quiz.questions
      .map((q) => ({ ...q, options: q.options.map((o) => o.trim()).filter(Boolean) }))
      .filter((q) => q.text.trim() && q.options.length >= 2)
      .map((q) => ({ ...q, correct: Math.min(q.correct, q.options.length - 1) }))
    if (clean.length === 0) { setErr('Dodaj przynajmniej jedno pytanie z 2 odpowiedziami.'); return }

    setBusy(true); setErr('')
    try {
      const payload = { title: quiz.title.trim(), description: quiz.description || null, questions: clean }
      if (quiz.id) await updateRow('quizzes', quiz.id, payload)
      else await insertRow('quizzes', { ...payload, created_by: userId ?? null })
      onSaved()
    } catch (e) {
      setErr('Błąd zapisu: ' + e.message); setBusy(false)
    }
  }

  return (
    <Modal title={initial.id ? 'Edytuj quiz' : 'Nowy quiz'} onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Zapisywanie…' : 'Zapisz quiz'}</button>
      </>}>
      <Field label="Tytuł quizu">
        <input className="input" value={quiz.title} autoFocus onChange={(e) => setQuiz((q) => ({ ...q, title: e.target.value }))} />
      </Field>
      <Field label="Opis (opcjonalnie)">
        <input className="input" value={quiz.description || ''} onChange={(e) => setQuiz((q) => ({ ...q, description: e.target.value }))} />
      </Field>

      {quiz.questions.map((q, qi) => (
        <div className="quiz-q" key={q.id}>
          <div className="option-row" style={{ marginBottom: 8 }}>
            <b style={{ fontSize: 13 }}>Pytanie {qi + 1}</b>
            {quiz.questions.length > 1 && (
              <button className="btn-danger-ghost btn-sm" style={{ marginLeft: 'auto' }}
                onClick={() => setQuiz((qq) => ({ ...qq, questions: qq.questions.filter((x) => x.id !== q.id) }))}>
                Usuń pytanie
              </button>
            )}
          </div>
          <Field>
            <input className="input" placeholder="Treść pytania" value={q.text}
              onChange={(e) => setQuestion(q.id, { text: e.target.value })} />
          </Field>
          <div className="hint" style={{ margin: '8px 0 6px' }}>Zaznacz poprawną odpowiedź kółkiem:</div>
          {q.options.map((opt, oi) => (
            <div className="option-row" key={oi} style={{ marginBottom: 6 }}>
              <label className="radio-pick">
                <input type="radio" name={`correct-${q.id}`} checked={q.correct === oi}
                  onChange={() => setQuestion(q.id, { correct: oi })} />
              </label>
              <input className="input" placeholder={`Odpowiedź ${oi + 1}`} value={opt}
                onChange={(e) => setQuestion(q.id, { options: q.options.map((o, i) => (i === oi ? e.target.value : o)) })} />
              {q.options.length > 2 && (
                <button className="btn-danger-ghost btn-sm"
                  onClick={() => {
                    const options = q.options.filter((_, i) => i !== oi)
                    setQuestion(q.id, { options, correct: q.correct >= options.length ? 0 : q.correct })
                  }}>✕</button>
              )}
            </div>
          ))}
          <button className="btn btn-sm" onClick={() => setQuestion(q.id, { options: [...q.options, ''] })}>+ Odpowiedź</button>
        </div>
      ))}

      <button className="btn" onClick={() => setQuiz((q) => ({ ...q, questions: [...q.questions, newQuestion()] }))}>
        + Dodaj pytanie
      </button>
      {err && <div className="alert alert-error">⚠️ {err}</div>}
    </Modal>
  )
}

/* ---------------- Rozwiązywanie ---------------- */
function QuizPlayer({ quiz, canSave, onClose }) {
  const { saveQuizResult } = useProgress()
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const questions = quiz.questions || []

  const score = questions.reduce((acc, q) => acc + (answers[q.id] === q.correct ? 1 : 0), 0)
  const total = questions.length
  const pct = Math.round((score / total) * 100)

  async function finish() {
    setSubmitted(true)
    if (canSave) await saveQuizResult(quiz.id, score, total)
  }

  return (
    <Modal title={quiz.title} onClose={onClose}
      footer={submitted ? (
        <>
          <button className="btn" onClick={() => { setAnswers({}); setSubmitted(false) }}>↻ Spróbuj ponownie</button>
          <button className="btn btn-primary" onClick={onClose}>Zamknij</button>
        </>
      ) : (
        <>
          <button className="btn" onClick={onClose}>Anuluj</button>
          <button className="btn btn-primary" onClick={finish} disabled={Object.keys(answers).length < total}>
            Sprawdź wynik
          </button>
        </>
      )}>
      {submitted && (
        <div className="quiz-result">
          <div className="quiz-score" style={{ color: pct >= 60 ? 'var(--success)' : 'var(--danger)' }}>{pct}%</div>
          <p>Poprawne odpowiedzi: <b>{score} / {total}</b></p>
          <p className="meta">{pct >= 80 ? '🏆 Świetnie!' : pct >= 60 ? '👍 Nieźle!' : '📖 Warto powtórzyć materiał.'}</p>
          {canSave && <p className="meta">✓ Wynik zapisany w Twoich postępach.</p>}
        </div>
      )}

      {questions.map((q, qi) => (
        <div className="quiz-q" key={q.id}>
          <p style={{ fontWeight: 700, margin: '0 0 12px' }}>{qi + 1}. {q.text}</p>
          {q.options.map((opt, oi) => {
            let cls = 'quiz-option'
            if (submitted) {
              if (oi === q.correct) cls += ' correct'
              else if (answers[q.id] === oi) cls += ' wrong'
            } else if (answers[q.id] === oi) cls += ' selected'
            return (
              <label className={cls} key={oi}>
                <input type="radio" name={`play-${q.id}`} disabled={submitted}
                  checked={answers[q.id] === oi}
                  onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))} />
                {opt}{submitted && oi === q.correct && ' ✓'}
              </label>
            )
          })}
        </div>
      ))}
    </Modal>
  )
}
