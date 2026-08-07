import { useEffect } from 'react'

export function Modal({ title, children, footer, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="btn-ghost" onClick={onClose} aria-label="Zamknij">✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function Field({ label, hint, children }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

export function EmptyState({ emoji, title, text, action }) {
  return (
    <div className="empty">
      <div className="emoji">{emoji}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  )
}

export function Loading({ text = 'Wczytywanie…' }) {
  return (
    <div className="loading">
      <div className="spinner" />
      <span>{text}</span>
    </div>
  )
}

export function LockedBanner({ onRequestLogin, message = 'Bez logowania dostępny jest tylko pierwszy element.' }) {
  return (
    <div className="alert alert-info" style={{ marginBottom: 18 }}>
      🔒 {message}{' '}
      <button
        className="link-out"
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
        onClick={onRequestLogin}
      >
        Zaloguj się
      </button>
      , aby odblokować pełny dostęp.
    </div>
  )
}

export function LockOverlay({ onRequestLogin }) {
  return (
    <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={onRequestLogin}>
      🔓 Zaloguj się, aby odblokować
    </button>
  )
}

export function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('pl-PL', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch {
    return iso
  }
}
