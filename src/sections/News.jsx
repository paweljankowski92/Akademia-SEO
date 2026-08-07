import { useState, useEffect } from 'react'
import { useLocalStorage, uid } from '../lib/storage'
import { seedNews } from '../lib/seed'
import { Modal, Field, EmptyState, formatDate, LockedBanner, LockOverlay } from '../components/ui'

export default function News({ onCount, isLoggedIn = false, onRequestLogin }) {
  const [items, setItems] = useLocalStorage('sa_news', seedNews)
  const [editing, setEditing] = useState(null)

  useEffect(() => { onCount?.(items.length) }, [items.length, onCount])

  const sorted = [...items].sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  // Bez logowania dostępny jest tylko pierwszy (najnowszy) news.
  const freeId = sorted[0]?.id
  const isLocked = (item) => !isLoggedIn && item.id !== freeId

  function handleDelete(item) {
    if (!confirm(`Usunąć news „${item.title}”?`)) return
    setItems((prev) => prev.filter((i) => i.id !== item.id))
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">📰 News</h1>
          <p className="page-desc">Aktualności i nowinki ze świata SEO.</p>
        </div>
        {isLoggedIn && (
          <button className="btn btn-primary" onClick={() => setEditing(emptyNews())}>+ Dodaj news</button>
        )}
      </div>

      {!isLoggedIn && sorted.length > 0 && (
        <LockedBanner onRequestLogin={onRequestLogin} message="Bez logowania dostępny jest tylko pierwszy news." />
      )}

      {sorted.length === 0 ? (
        <EmptyState emoji="🗞️" title="Brak newsów" text="Dodaj pierwszą aktualność."
          action={isLoggedIn && <button className="btn btn-primary" onClick={() => setEditing(emptyNews())}>+ Dodaj news</button>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sorted.map((item) => {
            const locked = isLocked(item)
            return (
              <div className={`card ${locked ? 'locked' : ''}`} key={item.id}>
                <div className="card-top">
                  <div>
                    <h3 className="card-title">{item.title}</h3>
                    <div className="meta" style={{ marginTop: 4 }}>
                      📅 {formatDate(item.date)}{item.source && ` · ${item.source}`}
                    </div>
                  </div>
                  {locked ? (
                    <span className="lock-badge" title="Dostępne po zalogowaniu">🔒</span>
                  ) : (
                    isLoggedIn && (
                      <div className="card-actions">
                        <button className="btn-ghost btn-sm" onClick={() => setEditing(item)} title="Edytuj">✏️</button>
                        <button className="btn-danger-ghost btn-sm" onClick={() => handleDelete(item)} title="Usuń">🗑️</button>
                      </div>
                    )
                  )}
                </div>
                {item.body && <p className={`card-body ${locked ? 'locked-blur' : ''}`}>{item.body}</p>}
                {locked ? (
                  <div className="card-footer"><LockOverlay onRequestLogin={onRequestLogin} /></div>
                ) : (
                  item.url && <a className="link-out" href={item.url} target="_blank" rel="noopener noreferrer">🔗 Czytaj źródło</a>
                )}
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <NewsForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            setItems((prev) => {
              const exists = prev.some((i) => i.id === data.id)
              return exists ? prev.map((i) => (i.id === data.id ? data : i)) : [data, ...prev]
            })
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function emptyNews() {
  return { title: '', source: '', url: '', body: '', date: new Date().toISOString().slice(0, 10) }
}

function NewsForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({ ...initial })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  function submit() {
    if (!form.title.trim()) return alert('Podaj tytuł newsa.')
    onSave({ ...form, id: form.id || uid(), createdAt: form.createdAt || new Date().toISOString() })
  }
  return (
    <Modal title={initial.id ? 'Edytuj news' : 'Nowy news'} onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary" onClick={submit}>Zapisz</button>
      </>}>
      <Field label="Tytuł">
        <input className="input" autoFocus value={form.title} onChange={(e) => set('title', e.target.value)} />
      </Field>
      <Field label="Data">
        <input className="input" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
      </Field>
      <Field label="Źródło (opcjonalnie)" hint="np. Google Search Central, Search Engine Land">
        <input className="input" value={form.source} onChange={(e) => set('source', e.target.value)} />
      </Field>
      <Field label="Link do źródła (opcjonalnie)">
        <input className="input" placeholder="https://…" value={form.url} onChange={(e) => set('url', e.target.value)} />
      </Field>
      <Field label="Treść">
        <textarea className="textarea" value={form.body} onChange={(e) => set('body', e.target.value)} />
      </Field>
    </Modal>
  )
}
