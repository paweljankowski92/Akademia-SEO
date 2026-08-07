import { useState } from 'react'
import { useCollection, insertRow, updateRow, deleteRow } from '../lib/db'
import { useAuth } from '../lib/auth'
import { Modal, Field, EmptyState, formatDate, LockedBanner, LockOverlay, Loading } from '../components/ui'

const META = {
  porada: { label: 'Porada', emoji: '💡' },
  ciekawostka: { label: 'Ciekawostka', emoji: '✨' },
}

export default function Tips({ onRequestLogin }) {
  const { isLoggedIn, isAdmin, user } = useAuth()
  const { rows, loading, error, reload } = useCollection('tips')
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('all')

  const freeId = rows[0]?.id
  const isLocked = (item) => !isLoggedIn && item.id !== freeId
  const shown = rows.filter((i) => filter === 'all' || i.type === filter)

  async function handleDelete(item) {
    if (!confirm('Usunąć ten wpis?')) return
    await deleteRow('tips', item.id)
    reload()
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">💡 Porady i ciekawostki</h1>
          <p className="page-desc">Krótkie tipy SEO i ciekawostki, które warto mieć pod ręką.</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={() => setEditing({ type: 'porada', text: '' })}>+ Dodaj wpis</button>}
      </div>

      {!isLoggedIn && rows.length > 0 && (
        <LockedBanner onRequestLogin={onRequestLogin} message="Bez logowania dostępny jest tylko pierwszy wpis." />
      )}

      <div className="toolbar">
        {['all', 'porada', 'ciekawostka'].map((f) => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'Wszystkie' : `${META[f].emoji} ${META[f].label}`}
          </button>
        ))}
      </div>

      {loading ? <Loading /> : error ? (
        <div className="alert alert-error">⚠️ {error}</div>
      ) : shown.length === 0 ? (
        <EmptyState emoji="💭" title="Brak wpisów" text={isAdmin ? 'Dodaj pierwszą poradę lub ciekawostkę.' : 'Nic tu jeszcze nie ma.'}
          action={isAdmin && <button className="btn btn-primary" onClick={() => setEditing({ type: 'porada', text: '' })}>+ Dodaj wpis</button>} />
      ) : (
        <div className="grid">
          {shown.map((item) => {
            const locked = isLocked(item)
            return (
              <div className={`card ${locked ? 'locked' : ''}`} key={item.id}>
                <div className="card-top">
                  <span className="tag">{META[item.type]?.emoji} {META[item.type]?.label}</span>
                  {locked ? (
                    <span className="lock-badge" title="Dostępne po zalogowaniu">🔒</span>
                  ) : isAdmin ? (
                    <div className="card-actions">
                      <button className="btn-ghost btn-sm" onClick={() => setEditing(item)} title="Edytuj">✏️</button>
                      <button className="btn-danger-ghost btn-sm" onClick={() => handleDelete(item)} title="Usuń">🗑️</button>
                    </div>
                  ) : null}
                </div>
                <p className={`card-body ${locked ? 'locked-blur' : ''}`} style={{ color: 'var(--text)', fontSize: 15 }}>{item.text}</p>
                {locked ? (
                  <div className="card-footer"><LockOverlay onRequestLogin={onRequestLogin} /></div>
                ) : (
                  <span className="meta">{formatDate(item.created_at)}</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <TipForm initial={editing} userId={user?.id}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload() }} />
      )}
    </div>
  )
}

function TipForm({ initial, userId, onSaved, onClose }) {
  const [form, setForm] = useState({ ...initial })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit() {
    if (!form.text.trim()) { setErr('Wpisz treść.'); return }
    setBusy(true); setErr('')
    try {
      const payload = { type: form.type, text: form.text.trim() }
      if (form.id) await updateRow('tips', form.id, payload)
      else await insertRow('tips', { ...payload, created_by: userId ?? null })
      onSaved()
    } catch (e) { setErr('Błąd zapisu: ' + e.message); setBusy(false) }
  }

  return (
    <Modal title={initial.id ? 'Edytuj wpis' : 'Nowy wpis'} onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Zapisywanie…' : 'Zapisz'}</button>
      </>}>
      <Field label="Typ">
        <select className="select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
          <option value="porada">💡 Porada</option>
          <option value="ciekawostka">✨ Ciekawostka</option>
        </select>
      </Field>
      <Field label="Treść">
        <textarea className="textarea" autoFocus value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} />
      </Field>
      {err && <div className="alert alert-error">⚠️ {err}</div>}
    </Modal>
  )
}
