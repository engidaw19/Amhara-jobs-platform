/**
 * Alert — inline status message.
 * type: 'info' | 'success' | 'warning' | 'danger'
 */
export default function Alert({ type = 'info', children, onClose }) {
  const icons = { info: 'ℹ', success: '✓', warning: '⚠', danger: '✕' };
  return (
    <div className={`alert alert-${type}`} role="alert">
      <span aria-hidden="true" style={{ flexShrink: 0 }}>{icons[type]}</span>
      <div style={{ flex: 1 }}>{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '1rem', padding: 0, flexShrink: 0 }}
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}
