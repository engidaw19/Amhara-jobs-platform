import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';
import { ConfirmModal } from '../../components/Modal';

export default function ApplicantNotifications() {
  const navigate = useNavigate();
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  // Confirmation state
  const [confirmDismiss, setConfirmDismiss]   = useState(null); // single id
  const [confirmDismissAll, setConfirmDismissAll] = useState(false);
  const [dismissing, setDismissing]           = useState(false);

  function load() {
    setLoading(true);
    api.getNotifications()
      .then(res => setNotifs(res.notifications || res.data || []))
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function markRead(id) {
    await api.markRead(id).catch(() => {});
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
  }

  async function markAllRead() {
    setMarking(true);
    await api.markAllRead().catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, is_read: 1 })));
    setMarking(false);
  }

  // Called after confirm
  async function doDismiss(id) {
    setDismissing(true);
    await api.dismissNotif(id).catch(() => {});
    setNotifs(prev => prev.filter(n => n.id !== id));
    setConfirmDismiss(null);
    setDismissing(false);
  }

  async function doDismissAll() {
    setDismissing(true);
    await Promise.all(notifs.map(n => api.dismissNotif(n.id).catch(() => {})));
    setNotifs([]);
    setConfirmDismissAll(false);
    setDismissing(false);
  }

  const unread = notifs.filter(n => !n.is_read).length;

  return (
    <div>
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)',
          padding: 0, marginBottom: 'var(--space-4)',
        }}
      >
        ← Back
      </button>

      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up!'}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} loading={marking}>
              Mark all read
            </Button>
          )}
          {notifs.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setConfirmDismissAll(true)}>
              Clear all
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-page"><Spinner size="lg" /></div>
      ) : notifs.length === 0 ? (
        <EmptyState icon="🔔" title="No Notifications" description="You have no notifications at this time." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {notifs.map(n => (
            <div
              key={n.id}
              className="card card-sm"
              style={{
                display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start',
                background: n.is_read ? 'var(--color-white)' : 'var(--color-primary-light)',
                borderColor: n.is_read ? 'var(--border-color)' : 'var(--color-primary)',
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.is_read ? 'transparent' : 'var(--color-primary)', marginTop: 6, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: n.is_read ? 400 : 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-900)', marginBottom: 2 }}>
                  {n.title_en || n.title}
                </p>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', lineHeight: 'var(--line-height-relaxed)' }}>
                  {n.message}
                </p>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)', marginTop: 4 }}>
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
                {!n.is_read && (
                  <button className="btn btn-ghost btn-sm" onClick={() => markRead(n.id)}>Mark read</button>
                )}
                {/* Dismiss requires confirmation */}
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setConfirmDismiss(n.id)}
                  aria-label="Dismiss notification"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Single dismiss confirm */}
      <ConfirmModal
        open={confirmDismiss !== null}
        onClose={() => setConfirmDismiss(null)}
        onConfirm={() => doDismiss(confirmDismiss)}
        loading={dismissing}
        title="Dismiss Notification"
        message="Are you sure you want to dismiss this notification? It will be permanently removed."
        confirmLabel="Dismiss"
        confirmVariant="danger"
      />

      {/* Clear all confirm */}
      <ConfirmModal
        open={confirmDismissAll}
        onClose={() => setConfirmDismissAll(false)}
        onConfirm={doDismissAll}
        loading={dismissing}
        title="Clear All Notifications"
        message={`This will permanently remove all ${notifs.length} notification${notifs.length > 1 ? 's' : ''}. This cannot be undone.`}
        confirmLabel="Clear All"
        confirmVariant="danger"
      />
    </div>
  );
}
