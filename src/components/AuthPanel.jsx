import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { Modal, Field } from './ui'

export default function AuthPanel({ onClose }) {
  const { signIn, signUp, configured } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    setInfo('')

    if (!configured) {
      setError('Brak konfiguracji Supabase (.env).')
      return
    }
    if (!email.trim() || !password) {
      setError('Podaj e-mail i hasło.')
      return
    }
    if (mode === 'register' && password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków.')
      return
    }

    setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email.trim(), password)
        if (error) throw error
        onClose()
      } else {
        const { data, error } = await signUp(email.trim(), password)
        if (error) throw error
        // Jeśli włączone potwierdzanie e-mail, sesji jeszcze nie ma.
        if (data.session) {
          onClose()
        } else {
          setInfo('Konto utworzone. Sprawdź skrzynkę i potwierdź adres e-mail, aby się zalogować.')
        }
      }
    } catch (err) {
      setError(translateError(err.message))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={mode === 'login' ? 'Zaloguj się' : 'Utwórz konto'}
      onClose={onClose}
    >
      <div className="auth-tabs">
        <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); setInfo('') }}>
          Logowanie
        </button>
        <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError(''); setInfo('') }}>
          Rejestracja
        </button>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="E-mail">
          <input className="input" type="email" autoComplete="email" autoFocus
            value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ty@firma.pl" />
        </Field>
        <Field label="Hasło" hint={mode === 'register' ? 'Minimum 6 znaków.' : undefined}>
          <input className="input" type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </Field>

        {error && <div className="alert alert-error">⚠️ {error}</div>}
        {info && <div className="alert alert-info">✉️ {info}</div>}

        <button className="btn btn-primary" type="submit" disabled={busy} style={{ justifyContent: 'center' }}>
          {busy ? 'Chwila…' : mode === 'login' ? 'Zaloguj się' : 'Zarejestruj się'}
        </button>
      </form>
    </Modal>
  )
}

function translateError(msg = '') {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Nieprawidłowy e-mail lub hasło.'
  if (m.includes('already registered') || m.includes('already exists')) return 'Ten e-mail jest już zarejestrowany.'
  if (m.includes('email not confirmed')) return 'Potwierdź najpierw adres e-mail (sprawdź skrzynkę).'
  if (m.includes('rate limit')) return 'Zbyt wiele prób. Spróbuj za chwilę.'
  return msg || 'Coś poszło nie tak.'
}
