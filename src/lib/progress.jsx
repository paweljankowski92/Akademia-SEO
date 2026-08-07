import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'

const ProgressContext = createContext(null)

export function ProgressProvider({ children }) {
  const { user } = useAuth()
  const [rows, setRows] = useState([])

  const reload = useCallback(async () => {
    if (!user) { setRows([]); return }
    const { data, error } = await supabase.from('progress').select('*')
    if (!error) setRows(data ?? [])
  }, [user])

  useEffect(() => { reload() }, [reload])

  const key = (kind, itemId) => `${kind}:${itemId}`
  const map = new Map(rows.map((r) => [key(r.kind, r.item_id), r]))

  const isDone = (kind, itemId) => map.has(key(kind, itemId))
  const resultFor = (kind, itemId) => map.get(key(kind, itemId)) || null

  // Oznacz / odznacz materiał jako ukończony
  const toggleMaterial = async (itemId) => {
    if (!user) return
    if (isDone('material', itemId)) {
      await supabase.from('progress').delete()
        .eq('user_id', user.id).eq('kind', 'material').eq('item_id', itemId)
    } else {
      await supabase.from('progress').upsert(
        { user_id: user.id, kind: 'material', item_id: itemId, completed: true },
        { onConflict: 'user_id,kind,item_id' }
      )
    }
    reload()
  }

  // Zapisz wynik quizu (nadpisuje poprzedni)
  const saveQuizResult = async (itemId, score, maxScore) => {
    if (!user) return
    await supabase.from('progress').upsert(
      { user_id: user.id, kind: 'quiz', item_id: itemId, completed: true, score, max_score: maxScore },
      { onConflict: 'user_id,kind,item_id' }
    )
    reload()
  }

  const value = { rows, isDone, resultFor, toggleMaterial, saveQuizResult, reload }
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress musi być użyty wewnątrz <ProgressProvider>')
  return ctx
}
