import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';

/**
 * Modal — accessible dialog rendered via portal.
 *
 * Props:
 *   open        : boolean
 *   onClose     : () => void
 *   title       : string
 *   children    : ReactNode (body content)
 *   footer      : ReactNode (replaces default footer)
 *   size        : 'sm' | 'md' | 'lg'  (md = 520px)
 *   hideClose   : boolean
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  hideClose = false,
}) {
  // Trap scroll & close on Escape
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const maxW = size === 'sm' ? 360 : size === 'lg' ? 760 : 520;

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-box" style={{ maxWidth: maxW }}>
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">{title}</h2>
          {!hideClose && (
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              ✕
            </button>
          )}
        </div>

        <div className="modal-body">{children}</div>

        {footer !== undefined && (
          <div className="modal-footer">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}

/**
 * ConfirmModal — thin wrapper for yes/no confirmations.
 */
export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', confirmVariant = 'danger', loading = false }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p style={{ color: 'var(--color-gray-700)', lineHeight: 'var(--line-height-relaxed)' }}>
        {message}
      </p>
    </Modal>
  );
}
