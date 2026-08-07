import { useState, useMemo } from 'react'
import { useCollection, insertRow, updateRow, deleteRow, uploadMaterialFile, deleteMaterialFile } from '../lib/db'
import { useAuth } from '../lib/auth'
import { useProgress } from '../lib/progress'
import { Modal, Field, EmptyState, formatDate, LockedBanner, LockOverlay, Loading } from '../components/ui'

const empty = { title: '', category: '', kind: 'link', url: '', description: '', file_path: null, file_name: null }

export default function Materials({ onRequestLogin }) {
  const { isLoggedIn, isAdmin, user } = useAuth()
  const { isDone, toggleMaterial } = useProgress()
  const { rows, loading, error, reload } = useCollection('materials')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)

  const freeId = rows[0]?.id
  const isLocked = (item) => !isLoggedIn && item.id !== freeId

  const categories = useMemo(
    () => [...new Set(rows.map((i) => i.category).filter(Boolean))],
    [rows]
  )

  const filtered = rows.filter((i) => {
    const q = search.toLowerCase()
    return (
      i.title.toLowerCase().includes(q) ||
      (i.description || '').toLowerCase().includes(q) ||
      (i.category || '').toLowerCase().includes(q)
    )
  })

  async function handleDelete(item) {
    if (!confirm(`Usunąć materiał „${item.title}”?`)) return
    if (item.file_path) await deleteMaterialFile(item.file_path)
    await deleteRow('materials', item.id)
    reload()
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">📚 Materiały</h1>
          <p className="page-desc">Baza wewnętrznych materiałów szkoleniowych — pliki, linki i notatki.</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={() => setEditing(empty)}>+ Dodaj materiał</button>}
      </div>

      {!isLoggedIn && <LockedBanner onRequestLogin={onRequestLogin} message="Bez logowania dostępny jest tylko pierwszy materiał." />}

      <div className="toolbar">
        <input className="input search" placeholder="🔍 Szukaj po tytule, opisie, kategorii…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? <Loading /> : error ? (
        <div className="alert alert-error">⚠️ {error}</div>
      ) : filtered.length === 0 ? (
        <EmptyState emoji="📂"
          title={search ? 'Brak wyników' : 'Brak materiałów'}
          text={search ? 'Zmień frazę wyszukiwania.' : (isAdmin ? 'Dodaj pierwszy materiał szkoleniowy.' : 'Nic tu jeszcze nie ma.')}
          action={!search && isAdmin && <button className="btn btn-primary" onClick={() => setEditing(empty)}>+ Dodaj materiał</button>} />
      ) : (
        <div className="grid">
          {filtered.map((item) => {
            const locked = isLocked(item)
            const done = isLoggedIn && isDone('material', item.id)
            return (
              <div className={`card ${locked ? 'locked' : ''} ${done ? 'done' : ''}`} key={item.id}>
                <div className="card-top">
                  <h3 className="card-title">{item.title}</h3>
                  {locked ? (
                    <span className="lock-badge" title="Dostępne po zalogowaniu">🔒</span>
                  ) : isAdmin ? (
                    <div className="card-actions">
                      <button className="btn-ghost btn-sm" onClick={() => setEditing(item)} title="Edytuj">✏️</button>
                      <button className="btn-danger-ghost btn-sm" onClick={() => handleDelete(item)} title="Usuń">🗑️</button>
                    </div>
                  ) : done ? <span className="done-badge" title="Ukończone">✓</span> : null}
                </div>

                {item.description && <p className={`card-body ${locked ? 'locked-blur' : ''}`}>{item.description}</p>}

                <div className="card-footer">
                  {item.category && <span className="tag">{item.category}</span>}
                  {locked ? (
                    <LockOverlay onRequestLogin={onRequestLogin} />
                  ) : (
                    <>
                      {item.kind === 'link' && item.url && (
                        <a className="link-out" href={item.url} target="_blank" rel="noopener noreferrer">🔗 Otwórz link</a>
                      )}
                      {item.kind === 'file' && item.url && (
                        <a className="link-out" href={item.url} target="_blank" rel="noopener noreferrer">📎 {item.file_name || 'Otwórz plik'}</a>
                      )}
                      {isLoggedIn && !isAdmin && (
                        <button className={`btn btn-sm ${done ? '' : 'btn-primary'}`} onClick={() => toggleMaterial(item.id)}>
                          {done ? '↩ Cofnij' : '✓ Ukończone'}
                        </button>
                      )}
                      <span className="meta" style={{ marginLeft: 'auto' }}>{formatDate(item.created_at)}</span>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <MaterialForm
          initial={editing}
          categories={categories}
          userId={user?.id}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload() }}
        />
      )}
    </div>
  )
}

function MaterialForm({ initial, categories, userId, onSaved, onClose }) {
  const [form, setForm] = useState({ ...initial })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) { setErr('Plik większy niż 50 MB.'); return }
    setBusy(true); setErr('')
    try {
      const { path, url } = await uploadMaterialFile(file)
      setForm((f) => ({ ...f, kind: 'file', file_path: path, url, file_name: file.name }))
    } catch (e2) {
      setErr('Nie udało się wgrać pliku: ' + e2.message)
    } finally {
      setBusy(false)
    }
  }

  async function submit() {
    if (!form.title.trim()) { setErr('Podaj tytuł materiału.'); return }
    setBusy(true); setErr('')
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category || null,
        kind: form.kind,
        url: form.url || null,
        description: form.description || null,
        file_path: form.file_path || null,
        file_name: form.file_name || null,
      }
      if (form.id) {
        await updateRow('materials', form.id, payload)
      } else {
        await insertRow('materials', { ...payload, created_by: userId ?? null })
      }
      onSaved()
    } catch (e) {
      setErr('Błąd zapisu: ' + e.message)
      setBusy(false)
    }
  }

  return (
    <Modal title={initial.id ? 'Edytuj materiał' : 'Nowy materiał'} onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Zapisywanie…' : 'Zapisz'}</button>
      </>}>
      <Field label="Tytuł">
        <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} autoFocus />
      </Field>
      <Field label="Kategoria" hint="np. Podstawy, Procedury, Narzędzia">
        <input className="input" list="cat-list" value={form.category || ''} onChange={(e) => set('category', e.target.value)} />
        <datalist id="cat-list">{categories.map((c) => <option key={c} value={c} />)}</datalist>
      </Field>
      <Field label="Typ materiału">
        <select className="select" value={form.kind} onChange={(e) => set('kind', e.target.value)}>
          <option value="link">🔗 Link</option>
          <option value="file">📎 Plik (PDF, docx, obraz…)</option>
          <option value="note">📝 Notatka</option>
        </select>
      </Field>
      {form.kind === 'link' && (
        <Field label="Adres URL">
          <input className="input" placeholder="https://…" value={form.url || ''} onChange={(e) => set('url', e.target.value)} />
        </Field>
      )}
      {form.kind === 'file' && (
        <Field label="Plik" hint="Zapisywany w Supabase Storage. Do 50 MB.">
          <input className="input" type="file" onChange={handleFile} />
          {form.file_name && <span className="hint">Wgrany plik: <b>{form.file_name}</b></span>}
        </Field>
      )}
      <Field label="Opis / treść">
        <textarea className="textarea" value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
      </Field>
      {err && <div className="alert alert-error">⚠️ {err}</div>}
    </Modal>
  )
}
