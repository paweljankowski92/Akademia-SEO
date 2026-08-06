import { useState, useEffect, useCallback } from 'react'

/* ------------------------------------------------------------------ *
 *  useLocalStorage — trzyma stan zsynchronizowany z localStorage.
 *  Dzięki temu dane nie znikają po odświeżeniu strony.
 * ------------------------------------------------------------------ */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? JSON.parse(raw) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.error('Nie udało się zapisać danych:', e)
    }
  }, [key, value])

  return [value, setValue]
}

/* Proste, unikalne ID bez zewnętrznych bibliotek. */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/* ------------------------------------------------------------------ *
 *  IndexedDB — do trzymania załączonych plików (PDF, docx, obrazy).
 *  localStorage jest za mały na pliki, więc pliki lądują tutaj.
 * ------------------------------------------------------------------ */
const DB_NAME = 'seo-akademia'
const STORE = 'files'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveFile(id, blob) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(blob, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getFile(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(id)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

export async function deleteFile(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/* Otwiera plik z IndexedDB w nowej karcie (podgląd / pobranie). */
export function useOpenFile() {
  return useCallback(async (fileId, fileName) => {
    const blob = await getFile(fileId)
    if (!blob) {
      alert('Nie znaleziono pliku (mógł zostać usunięty).')
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.target = '_blank'
    a.rel = 'noopener'
    if (fileName) a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }, [])
}
