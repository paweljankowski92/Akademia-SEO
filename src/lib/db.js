import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

/* ------------------------------------------------------------------ *
 *  Podstawowe operacje CRUD na tabelach Supabase.
 * ------------------------------------------------------------------ */
export async function fetchAll(table, { column = 'created_at', ascending = false } = {}) {
  const { data, error } = await supabase.from(table).select('*').order(column, { ascending })
  if (error) throw error
  return data ?? []
}

export async function insertRow(table, row) {
  const { data, error } = await supabase.from(table).insert(row).select().single()
  if (error) throw error
  return data
}

export async function updateRow(table, id, patch) {
  const { data, error } = await supabase.from(table).update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}

/* ------------------------------------------------------------------ *
 *  Pliki materiałów (Supabase Storage, bucket "materials").
 * ------------------------------------------------------------------ */
export async function uploadMaterialFile(file) {
  const safe = file.name.replace(/[^\w.\-]+/g, '_')
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`
  const { error } = await supabase.storage.from('materials').upload(path, file, { upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('materials').getPublicUrl(path)
  return { path, url: data.publicUrl }
}

export async function deleteMaterialFile(path) {
  if (!path) return
  await supabase.storage.from('materials').remove([path])
}

/* ------------------------------------------------------------------ *
 *  Hook wczytujący kolekcję z tabeli (z obsługą ładowania/błędów).
 * ------------------------------------------------------------------ */
export function useCollection(table, opts) {
  const column = opts?.column ?? 'created_at'
  const ascending = opts?.ascending ?? false

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await fetchAll(table, { column, ascending }))
      setError(null)
    } catch (e) {
      setError(e.message || 'Błąd wczytywania danych.')
    } finally {
      setLoading(false)
    }
  }, [table, column, ascending])

  useEffect(() => { reload() }, [reload])

  return { rows, setRows, loading, error, reload }
}
