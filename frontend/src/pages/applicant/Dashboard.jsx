import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';

export default function ApplicantDashboard() {
  const { user } = useAuth();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.seekerStats()
      .then(res => setStats(res.data || res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-page"><Spinner size="lg" /></div>
  );

  const recent = stats?.recent_applications || [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome, {user?.full_name?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">Here's a summary of your job search activity.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Applications Sent',  value: stats?.total_applications ?? 0,  icon: '📋', color: 'blue' },
          { label: 'Under Review',       value: stats?.under_review ?? 0,         icon: '🔍', color: 'yellow' },
          { label: 'Shortlisted',        value: stats?.shortlisted ?? 0,          icon: '⭐', color: 'orange' },
          { label: 'Accepted',           value: stats?.accepted ?? 0,             icon: '✅', color: 'green' },
          { label: 'Unread Notifications', value: stats?.unread_notifications ?? 0, icon: '🔔', color: 'red' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
        <Link to="/jobs" className="card card-sm" style={{ textDecoration: 'none', textAlign: 'center', background: 'var(--color-primary)', color: '#fff', border: 'none' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🔍</div>
          <p style={{ fontWeight: 600 }}>Find Jobs</p>
        </Link>
        <Link to="/applicant/applications" className="card card-sm" style={{ textDecoration: 'none', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>📋</div>
          <p style={{ fontWeight: 600 }}>My Applications</p>
        </Link>
        <Link to="/applicant/profile" className="card card-sm" style={{ textDecoration: 'none', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>👤</div>
          <p style={{ fontWeight: 600 }}>Edit Profile</p>
        </Link>
        <Link to="/applicant/notifications" className="card card-sm" style={{ textDecoration: 'none', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🔔</div>
          <p style={{ fontWeight: 600 }}>Notifications</p>
        </Link>
      </div>

      {/* Recent applications */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)' }}>Recent Applications</h2>
          <Link to="/applicant/applications" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)' }}>View all →</Link>
        </div>

        {recent.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
            <div className="empty-state-icon">📭</div>
            <p className="empty-state-title">No Applications Yet</p>
            <p className="empty-state-desc">Start by browsing available vacancies.</p>
            <Link to="/jobs" className="btn btn-primary" style={{ marginTop: 'var(--space-3)' }}>Browse Jobs</Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Bureau</th>
                  <th>Applied</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(a => (
                  <tr key={a.id}>
                    <td><Link to={`/jobs/${a.job_id}`} style={{ color: 'var(--color-primary)', fontWeight: 500 }}>{a.job_title}</Link></td>
                    <td style={{ color: 'var(--color-gray-600)', fontSize: 'var(--font-size-sm)' }}>{a.bureau_name}</td>
                    <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>{new Date(a.applied_at).toLocaleDateString()}</td>
                    <td><StatusBadge status={a.status} type="application" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
