import { createPortal } from 'react-dom';
import { createContext, useCallback, useContext, useState } from 'react';

/* ── Toast Context ─────────────────────────────────────────── */
const ToastContext = createContext(null);

let _id = 0;
const ICONS = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      {createPortal(
        <div className="toast-container" aria-live="polite" aria-atomic="false">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast-${t.type}`} role="alert">
              <span style={{ fontSize: '1.1em' }} aria-hidden="true">
                {ICONS[t.type] ?? ICONS.info}
              </span>
              <span className="toast-message">{t.message}</span>
              <button
                className="toast-dismiss"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');

  return {
    toast: ctx.push,
    success: (msg, dur) => ctx.push(msg, 'success', dur),
    error:   (msg, dur) => ctx.push(msg, 'error',   dur),
    warning: (msg, dur) => ctx.push(msg, 'warning',  dur),
    info:    (msg, dur) => ctx.push(msg, 'info',     dur),
  };
}
