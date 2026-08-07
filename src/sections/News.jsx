import { useState } from 'react'
import { useCollection, insertRow, updateRow, deleteRow } from '../lib/db'
import { useAuth } from '../lib/auth'
import { Modal, Field, EmptyState, formatDate, LockedBanner, LockOverlay, Loading } from '../components/ui'

function emptyNews() {
  return { title: '', source: '', url: '', body: '', date: new Date().toISOString().slice(0, 10) }
}

export default function News({ onRequestLogin }) {
  const { isLoggedIn, isAdmin, user } = useAuth()
  const { rows, loading, error, reload } = useCollection('news', { column: 'date', ascending: false })
  const [editing, setEditing] = useState(null)

  const freeId = rows[0]?.id
  const isLocked = (item) => !isLoggedIn && item.id !== freeId

  async function handleDelete(item) {
    if (!confirm(`Usunąć news „${item.title}”?`)) return
    await deleteRow('news', item.id)
    reload()
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">📰 News</h1>
          <p className="page-desc">Aktualności i nowinki ze świata SEO.</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={() => setEditing(emptyNews())}>+ Dodaj news</button>}
      </div>

      {!isLoggedIn && rows.length > 0 && (
        <LockedBanner onRequestLogin={onRequestLogin} message="Bez logowania dostępny jest tylko pierwszy news." />
      )}

      {loading ? <Loading /> : error ? (
        <div className="alert alert-error">⚠️ {error}</div>
      ) : rows.length === 0 ? (
        <EmptyState emoji="🗞️" title="Brak newsów" text={isAdmin ? 'Dodaj pierwszą aktualność.' : 'Nic tu jeszcze nie ma.'}
          action={isAdmin && <button className="btn btn-primary" onClick={() => setEditing(emptyNews())}>+ Dodaj news</button>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {rows.map((item) => {
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
                  ) : isAdmin ? (
                    <div className="card-actions">
                      <button className="btn-ghost btn-sm" onClick={() => setEditing(item)} title="Edytuj">✏️</button>
                      <button className="btn-danger-ghost btn-sm" onClick={() => handleDelete(item)} title="Usuń">🗑️</button>
                    </div>
                  ) : null}
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
        <NewsForm initial={editing} userId={user?.id}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload() }} />
      )}
    </div>
  )
}

function NewsForm({ initial, userId, onSaved, onClose }) {
  const [form, setForm] = useState({ ...initial })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function submit() {
    if (!form.title.trim()) { setErr('Podaj tytuł newsa.'); return }
    setBusy(true); setErr('')
    try {
      const payload = {
        title: form.title.trim(),
        source: form.source || null,
        url: form.url || null,
        body: form.body || null,
        date: form.date || null,
      }
      if (form.id) await updateRow('news', form.id, payload)
      else await insertRow('news', { ...payload, created_by: userId ?? null })
      onSaved()
    } catch (e) { setErr('Błąd zapisu: ' + e.message); setBusy(false) }
  }

  return (
    <Modal title={initial.id ? 'Edytuj news' : 'Nowy news'} onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Zapisywanie…' : 'Zapisz'}</button>
      </>}>
      <Field label="Tytuł"><input className="input" autoFocus value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
      <Field label="Data"><input className="input" type="date" value={form.date || ''} onChange={(e) => set('date', e.target.value)} /></Field>
      <Field label="Źródło (opcjonalnie)" hint="np. Google Search Central, Search Engine Land">
        <input className="input" value={form.source || ''} onChange={(e) => set('source', e.target.value)} />
      </Field>
      <Field label="Link do źródła (opcjonalnie)">
        <input className="input" placeholder="https://…" value={form.url || ''} onChange={(e) => set('url', e.target.value)} />
      </Field>
      <Field label="Treść"><textarea className="textarea" value={form.body || ''} onChange={(e) => set('body', e.target.value)} /></Field>
      {err && <div className="alert alert-error">⚠️ {err}</div>}
    </Modal>
  )
}
