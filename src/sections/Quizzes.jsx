import { useState, useEffect } from 'react'
import { useLocalStorage, uid } from '../lib/storage'
import { seedQuizzes } from '../lib/seed'
import { Modal, Field, EmptyState } from '../components/ui'

export default function Quizzes({ onCount }) {
  const [quizzes, setQuizzes] = useLocalStorage('sa_quizzes', seedQuizzes)
  const [editing, setEditing] = useState(null)
  const [playing, setPlaying] = useState(null)

  useEffect(() => { onCount?.(quizzes.length) }, [quizzes.length, onCount])

  function handleDelete(quiz) {
    if (!confirm(`Usunąć quiz „${quiz.title}”?`)) return
    setQuizzes((prev) => prev.filter((q) => q.id !== quiz.id))
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">🧠 Quizy</h1>
          <p className="page-desc">Sprawdzaj wiedzę — twórz własne testy i rozwiązuj je.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing(newQuiz())}>+ Nowy quiz</button>
      </div>

      {quizzes.length === 0 ? (
        <EmptyState emoji="🧩" title="Brak quizów" text="Stwórz pierwszy test wiedzy."
          action={<button className="btn btn-primary" onClick={() => setEditing(newQuiz())}>+ Nowy quiz</button>} />
      ) : (
        <div className="grid">
          {quizzes.map((quiz) => (
            <div className="card" key={quiz.id}>
              <div className="card-top">
                <h3 className="card-title">{quiz.title}</h3>
                <div className="card-actions">
                  <button className="btn-ghost btn-sm" onClick={() => setEditing(quiz)} title="Edytuj">✏️</button>
                  <button className="btn-danger-ghost btn-sm" onClick={() => handleDelete(quiz)} title="Usuń">🗑️</button>
                </div>
              </div>
              {quiz.description && <p className="card-body">{quiz.description}</p>}
              <div className="card-footer">
                <span className="tag gray">{quiz.questions.length} pyt.</span>
                <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}
                  onClick={() => setPlaying(quiz)} disabled={quiz.questions.length === 0}>
                  ▶ Rozwiąż
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <QuizForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            setQuizzes((prev) => {
              const exists = prev.some((q) => q.id === data.id)
              return exists ? prev.map((q) => (q.id === data.id ? data : q)) : [data, ...prev]
            })
            setEditing(null)
          }}
        />
      )}

      {playing && <QuizPlayer quiz={playing} onClose={() => setPlaying(null)} />}
    </div>
  )
}

function newQuiz() {
  return {
    id: uid(),
    title: '',
    description: '',
    createdAt: new Date().toISOString(),
    questions: [newQuestion()],
    _isNew: true,
  }
}
function newQuestion() {
  return { id: uid(), text: '', options: ['', ''], correct: 0 }
}

/* ---------------- Tworzenie / edycja ---------------- */
function QuizForm({ initial, onSave, onClose }) {
  const [quiz, setQuiz] = useState(() => ({
    ...initial,
    questions: initial.questions.length ? initial.questions : [newQuestion()],
  }))

  const setQuestion = (qid, patch) =>
    setQuiz((q) => ({ ...q, questions: q.questions.map((qq) => (qq.id === qid ? { ...qq, ...patch } : qq)) }))

  function submit() {
    if (!quiz.title.trim()) return alert('Podaj tytuł quizu.')
    const clean = quiz.questions
      .map((q) => ({ ...q, options: q.options.map((o) => o.trim()).filter(Boolean) }))
      .filter((q) => q.text.trim() && q.options.length >= 2)
      .map((q) => ({ ...q, correct: Math.min(q.correct, q.options.length - 1) }))
    if (clean.length === 0) return alert('Dodaj przynajmniej jedno pytanie z 2 odpowiedziami.')
    const { _isNew, ...rest } = quiz
    onSave({ ...rest, questions: clean })
  }

  return (
    <Modal
      title={initial._isNew ? 'Nowy quiz' : 'Edytuj quiz'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Anuluj</button>
          <button className="btn btn-primary" onClick={submit}>Zapisz quiz</button>
        </>
      }
    >
      <Field label="Tytuł quizu">
        <input className="input" value={quiz.title} autoFocus onChange={(e) => setQuiz((q) => ({ ...q, title: e.target.value }))} />
      </Field>
      <Field label="Opis (opcjonalnie)">
        <input className="input" value={quiz.description} onChange={(e) => setQuiz((q) => ({ ...q, description: e.target.value }))} />
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
    </Modal>
  )
}

/* ---------------- Rozwiązywanie ---------------- */
function QuizPlayer({ quiz, onClose }) {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const score = quiz.questions.reduce((acc, q) => acc + (answers[q.id] === q.correct ? 1 : 0), 0)
  const total = quiz.questions.length
  const pct = Math.round((score / total) * 100)

  return (
    <Modal
      title={quiz.title}
      onClose={onClose}
      footer={
        submitted ? (
          <>
            <button className="btn" onClick={() => { setAnswers({}); setSubmitted(false) }}>↻ Spróbuj ponownie</button>
            <button className="btn btn-primary" onClick={onClose}>Zamknij</button>
          </>
        ) : (
          <>
            <button className="btn" onClick={onClose}>Anuluj</button>
            <button className="btn btn-primary"
              onClick={() => setSubmitted(true)}
              disabled={Object.keys(answers).length < total}>
              Sprawdź wynik
            </button>
          </>
        )
      }
    >
      {submitted && (
        <div className="quiz-result">
          <div className="quiz-score" style={{ color: pct >= 60 ? 'var(--success)' : 'var(--danger)' }}>{pct}%</div>
          <p>Poprawne odpowiedzi: <b>{score} / {total}</b></p>
          <p className="meta">{pct >= 80 ? '🏆 Świetnie!' : pct >= 60 ? '👍 Nieźle!' : '📖 Warto powtórzyć materiał.'}</p>
        </div>
      )}

      {quiz.questions.map((q, qi) => (
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
                {opt}
                {submitted && oi === q.correct && ' ✓'}
              </label>
            )
          })}
        </div>
      ))}
    </Modal>
  )
}
