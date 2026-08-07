import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/* Jeśli brakuje danych w .env, informujemy zamiast rzucać kryptycznym błędem. */
export const isSupabaseConfigured = Boolean(url && key)

if (!isSupabaseConfigured) {
  console.warn(
    'Brak konfiguracji Supabase. Uzupełnij VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY w pliku .env'
  )
}

export const supabase = isSupabaseConfigured
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null
