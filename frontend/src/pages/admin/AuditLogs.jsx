import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';

export default function AdminAuditLogs() {
  const navigate = useNavigate();
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuditLogs()
      .then(res => setLogs(res.logs || res.data || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

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

      <div className="page-header">
        <h1 className="page-title">Audit Logs</h1>
        <p className="page-subtitle">Security-sensitive administrative actions are recorded here.</p>
      </div>

      {loading ? (
        <div className="loading-page"><Spinner size="lg" /></div>
      ) : logs.length === 0 ? (
        <EmptyState icon="🔍" title="No Audit Logs" description="No administrative actions have been recorded yet." />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr><th>Action</th><th>Performed By</th><th>Target</th><th>Details</th><th>Date &amp; Time</th></tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}>
                    <td>
                      <span className="badge badge-info" style={{ textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        {l.action?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: 'var(--font-size-sm)' }}>{l.actor_name || l.actor_id}</td>
                    <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                      {l.target_type && <span>{l.target_type} #{l.target_id}</span>}
                    </td>
                    <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', maxWidth: 240 }}>
                      {l.details
                        ? (typeof l.details === 'object' ? JSON.stringify(l.details) : String(l.details)).slice(0, 120)
                        : '—'}
                    </td>
                    <td style={{ fontSize: 'var(--font-size-sm)', whiteSpace: 'nowrap', color: 'var(--color-gray-500)' }}>
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
