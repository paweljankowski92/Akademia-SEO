import { useState, useMemo, useEffect } from 'react'
import { useLocalStorage, uid, saveFile, deleteFile, useOpenFile } from '../lib/storage'
import { seedMaterials } from '../lib/seed'
import { Modal, Field, EmptyState, formatDate } from '../components/ui'

const empty = {
  title: '', category: '', kind: 'link', url: '', description: '',
  fileId: null, fileName: null,
}

export default function Materials({ onCount, isLoggedIn = false, onRequestLogin }) {
  const [items, setItems] = useLocalStorage('sa_materials', seedMaterials)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // obiekt lub null
  const openFile = useOpenFile()

  useEffect(() => { onCount?.(items.length) }, [items.length, onCount])

  // Bez logowania odblokowany jest tylko pierwszy materiał z pełnej listy.
  // (Bazujemy na pełnej liście, żeby nie dało się odblokować przez wyszukiwarkę.)
  const freeId = items[0]?.id
  const isLocked = (item) => !isLoggedIn && item.id !== freeId

  const categories = useMemo(
    () => [...new Set(items.map((i) => i.category).filter(Boolean))],
    [items]
  )

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    return (
      i.title.toLowerCase().includes(q) ||
      (i.description || '').toLowerCase().includes(q) ||
      (i.category || '').toLowerCase().includes(q)
    )
  })

  async function handleDelete(item) {
    if (!confirm(`Usunąć materiał „${item.title}”?`)) return
    if (item.fileId) await deleteFile(item.fileId)
    setItems((prev) => prev.filter((i) => i.id !== item.id))
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">📚 Materiały</h1>
          <p className="page-desc">Baza wewnętrznych materiałów szkoleniowych — pliki, linki i notatki.</p>
        </div>
        {isLoggedIn && (
          <button className="btn btn-primary" onClick={() => setEditing(empty)}>+ Dodaj materiał</button>
        )}
      </div>

      {!isLoggedIn && (
        <div className="alert alert-info" style={{ marginBottom: 18 }}>
          🔒 Bez logowania dostępny jest tylko pierwszy materiał.{' '}
          <button className="link-out" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
            onClick={onRequestLogin}>Zaloguj się</button>, aby odblokować całą bazę.
        </div>
      )}

      <div className="toolbar">
        <input
          className="input search"
          placeholder="🔍 Szukaj po tytule, opisie, kategorii…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          emoji="📂"
          title={search ? 'Brak wyników' : 'Brak materiałów'}
          text={search ? 'Zmień frazę wyszukiwania.' : 'Dodaj pierwszy materiał szkoleniowy.'}
          action={!search && isLoggedIn && <button className="btn btn-primary" onClick={() => setEditing(empty)}>+ Dodaj materiał</button>}
        />
      ) : (
        <div className="grid">
          {filtered.map((item) => {
            const locked = isLocked(item)
            return (
              <div className={`card ${locked ? 'locked' : ''}`} key={item.id}>
                <div className="card-top">
                  <h3 className="card-title">{item.title}</h3>
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

                {item.description && (
                  <p className={`card-body ${locked ? 'locked-blur' : ''}`}>{item.description}</p>
                )}

                <div className="card-footer">
                  {item.category && <span className="tag">{item.category}</span>}

                  {locked ? (
                    <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={onRequestLogin}>
                      🔓 Zaloguj się, aby odblokować
                    </button>
                  ) : (
                    <>
                      {item.kind === 'link' && item.url && (
                        <a className="link-out" href={item.url} target="_blank" rel="noopener noreferrer">🔗 Otwórz link</a>
                      )}
                      {item.kind === 'file' && item.fileId && (
                        <button className="link-out" onClick={() => openFile(item.fileId, item.fileName)}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                          📎 {item.fileName || 'Otwórz plik'}
                        </button>
                      )}
                      <span className="meta" style={{ marginLeft: 'auto' }}>{formatDate(item.createdAt)}</span>
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

function MaterialForm({ initial, categories, onSave, onClose }) {
  const [form, setForm] = useState({ ...initial })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 25 * 1024 * 1024) {
      alert('Plik jest większy niż 25 MB. W wersji lokalnej lepiej użyć linku (np. Google Drive).')
      return
    }
    setBusy(true)
    const id = form.fileId || uid()
    await saveFile(id, file)
    setForm((f) => ({ ...f, kind: 'file', fileId: id, fileName: file.name }))
    setBusy(false)
  }

  function submit() {
    if (!form.title.trim()) return alert('Podaj tytuł materiału.')
    onSave({
      ...form,
      id: form.id || uid(),
      createdAt: form.createdAt || new Date().toISOString(),
    })
  }

  return (
    <Modal
      title={initial.id ? 'Edytuj materiał' : 'Nowy materiał'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Anuluj</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? 'Wgrywanie…' : 'Zapisz'}
          </button>
        </>
      }
    >
      <Field label="Tytuł">
        <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} autoFocus />
      </Field>

      <Field label="Kategoria" hint="np. Podstawy, Procedury, Narzędzia">
        <input className="input" list="cat-list" value={form.category} onChange={(e) => set('category', e.target.value)} />
        <datalist id="cat-list">
          {categories.map((c) => <option key={c} value={c} />)}
        </datalist>
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
          <input className="input" placeholder="https://…" value={form.url} onChange={(e) => set('url', e.target.value)} />
        </Field>
      )}

      {form.kind === 'file' && (
        <Field label="Plik" hint="Zapisywany lokalnie w przeglądarce. Do 25 MB.">
          <input className="input" type="file" onChange={handleFile} />
          {form.fileName && <span className="hint">Wgrany plik: <b>{form.fileName}</b></span>}
        </Field>
      )}

      <Field label="Opis / treść">
        <textarea className="textarea" value={form.description} onChange={(e) => set('description', e.target.value)} />
      </Field>
    </Modal>
  )
}
