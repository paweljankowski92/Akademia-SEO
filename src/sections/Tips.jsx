import { useState, useEffect } from 'react'
import { useLocalStorage, uid } from '../lib/storage'
import { seedTips } from '../lib/seed'
import { Modal, Field, EmptyState, formatDate } from '../components/ui'

const META = {
  porada: { label: 'Porada', emoji: '💡' },
  ciekawostka: { label: 'Ciekawostka', emoji: '✨' },
}

export default function Tips({ onCount }) {
  const [items, setItems] = useLocalStorage('sa_tips', seedTips)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => { onCount?.(items.length) }, [items.length, onCount])

  const shown = items.filter((i) => filter === 'all' || i.type === filter)

  function handleDelete(item) {
    if (!confirm('Usunąć ten wpis?')) return
    setItems((prev) => prev.filter((i) => i.id !== item.id))
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">💡 Porady i ciekawostki</h1>
          <p className="page-desc">Krótkie tipy SEO i ciekawostki, które warto mieć pod ręką.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({ type: 'porada', text: '' })}>+ Dodaj wpis</button>
      </div>

      <div className="toolbar">
        {['all', 'porada', 'ciekawostka'].map((f) => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'Wszystkie' : `${META[f].emoji} ${META[f].label}`}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState emoji="💭" title="Brak wpisów" text="Dodaj pierwszą poradę lub ciekawostkę."
          action={<button className="btn btn-primary" onClick={() => setEditing({ type: 'porada', text: '' })}>+ Dodaj wpis</button>} />
      ) : (
        <div className="grid">
          {shown.map((item) => (
            <div className="card" key={item.id}>
              <div className="card-top">
                <span className="tag">{META[item.type]?.emoji} {META[item.type]?.label}</span>
                <div className="card-actions">
                  <button className="btn-ghost btn-sm" onClick={() => setEditing(item)} title="Edytuj">✏️</button>
                  <button className="btn-danger-ghost btn-sm" onClick={() => handleDelete(item)} title="Usuń">🗑️</button>
                </div>
              </div>
              <p className="card-body" style={{ color: 'var(--text)', fontSize: 15 }}>{item.text}</p>
              <span className="meta">{formatDate(item.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <TipForm
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

function TipForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({ ...initial })
  function submit() {
    if (!form.text.trim()) return alert('Wpisz treść.')
    onSave({ ...form, id: form.id || uid(), createdAt: form.createdAt || new Date().toISOString() })
  }
  return (
    <Modal title={initial.id ? 'Edytuj wpis' : 'Nowy wpis'} onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary" onClick={submit}>Zapisz</button>
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
    </Modal>
  )
}
